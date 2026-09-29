#!/usr/bin/env node
/**
 * Solve API smoke test. Run against a worker with SOLVER_PROVIDER=mock and
 * ENVIRONMENT=development (mock scenarios are selected with X-Mock-Scenario):
 *   npx wrangler dev --port 8788 --persist-to /tmp/wr-mock --var SOLVER_PROVIDER:mock --var OCR_PROVIDER:mock
 *   API_URL=http://localhost:8788 node scripts/smoke-solve.mjs
 */
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

const API = process.env.API_URL ?? "http://localhost:8788";
const fixture = readFileSync(new URL("../../tools/ocr-eval/fixtures/02-quadratic-vi.jpg", import.meta.url));
const token = () => randomBytes(32).toString("base64url");
const A = token();
const B = token();
let passed = 0;

function check(cond, label, detail) {
  if (!cond) {
    console.error(`✗ ${label}`);
    if (detail !== undefined) console.error(JSON.stringify(detail, null, 2).slice(0, 1500));
    process.exit(1);
  }
  passed++;
  console.log(`✓ ${label}`);
}

async function call(method, path, { device = A, body, headers = {} } = {}) {
  const res = await fetch(API + path, { method, body, headers: { authorization: `Bearer ${device}`, ...headers } });
  const text = await res.text();
  return { status: res.status, json: text ? JSON.parse(text) : null };
}

async function newScan(text, device = A) {
  const form = new FormData();
  form.append("image", new Blob([fixture], { type: "image/jpeg" }), "p.jpg");
  const { json } = await call("POST", "/v1/scans", { device, body: form, headers: { "Idempotency-Key": token() } });
  const id = json.scan.id;
  if (text) {
    await call("POST", `/v1/scans/${id}/confirm`, { device, body: JSON.stringify({ text }), headers: { "content-type": "application/json" } });
  }
  return id;
}

const solve = (id, { scenario, device = A, regenerate = false } = {}) =>
  call("POST", `/v1/scans/${id}/solve`, {
    device,
    body: JSON.stringify({ regenerate }),
    headers: { "content-type": "application/json", ...(scenario ? { "x-mock-scenario": scenario } : {}) },
  });

const GEO = "Cho tam giác $ABC$ cân tại $A$ có $\\widehat{A} = 40^{\\circ}$. Tính $\\widehat{B}$.";
const ALG = "Giải phương trình $x^{2} - 5x + 6 = 0$.";

// --- preconditions & happy path ---------------------------------------------
const draft = await newScan(null);
const unconfirmed = await solve(draft);
check(unconfirmed.status === 400 && unconfirmed.json.error.code === "problem_not_confirmed", "an unsaved problem can't be solved");

const geo = await newScan(GEO);
const first = await solve(geo);
const sol = first.json.solution;
check(first.status === 200 && sol.status === "ready", "solve returns a ready lesson", first.json);
check(sol.verification.status === "verified", "the lesson is verified");
check(sol.lesson.figure && sol.lesson.hints.length >= 2 && sol.lesson.steps.length >= 2, "lesson has hints, steps and a figure");
check(sol.lesson.hints.every((h) => sol.lesson.steps.some((s) => s.id === h.stepId)), "every hint points at a real step");

const t0 = Date.now();
const again = await solve(geo);
check(again.json.solution.id === sol.id && again.json.solution.createdAt === sol.createdAt && Date.now() - t0 < 1000, "solving again reuses the stored lesson");
const got = await call("GET", `/v1/scans/${geo}/solution`);
check(got.status === 200 && got.json.solution.status === "ready", "GET returns the stored lesson");

// --- authorization ----------------------------------------------------------
check((await call("GET", `/v1/scans/${geo}/solution`, { device: B })).status === 404, "another device can't read the lesson");
check((await solve(geo, { device: B })).status === 404, "another device can't trigger solving");
check((await call("GET", `/v1/scans/${geo}/solution`, { device: "nope" })).status === 401, "requests without a valid device token are rejected");

// --- failures & recovery ----------------------------------------------------
const alg = await newScan(ALG);
const failed = await solve(alg, { scenario: "solve_provider_error" });
check(failed.json.solution.status === "failed" && failed.json.solution.error.code === "solve_provider_error" && failed.json.solution.error.retryable, "provider failure is reported as retryable", failed.json);
const recovered = await solve(alg);
check(recovered.json.solution.status === "ready" && recovered.json.solution.verification.status === "verified", "retrying after a provider failure works");

const mal = await newScan(ALG);
const malformed = await solve(mal, { scenario: "solve_malformed" });
check(malformed.json.solution.status === "failed" && malformed.json.solution.error.code === "solve_malformed_output", "malformed AI output fails cleanly (after a retry)");

const fix = await newScan(GEO);
const fixed = await solve(fix, { scenario: "solve_fix_on_retry" });
check(fixed.json.solution.status === "ready" && fixed.json.solution.attempts === 2 && fixed.json.solution.verification.status === "verified", "a wrong first answer is corrected by the verification retry", fixed.json.solution);

const bad = await newScan(ALG);
const unverified = await solve(bad, { scenario: "solve_unverified" });
check(unverified.json.solution.status === "ready" && unverified.json.solution.verification.status === "unverified", "a still-wrong answer is marked unverified, not correct");
check(unverified.json.solution.verification.checks.some((c) => !c.passed), "the failing check is reported");

// --- concurrency -----------------------------------------------------------
const slow = await newScan(ALG);
const slowReq = solve(slow, { scenario: "solve_slow" });
await new Promise((r) => setTimeout(r, 800));
const dup = await solve(slow);
check(dup.status === 409 && dup.json.error.code === "solve_in_progress" && dup.json.error.retryable, "a duplicate solve while generating gets 409");
const pending = await call("GET", `/v1/scans/${slow}/solution`);
check(pending.status === 202 && pending.json.solution.status === "pending", "GET reports pending while generating");
check((await slowReq).json.solution.status === "ready", "the original request completes");

// --- edits, regenerate, delete ------------------------------------------------
await call("POST", `/v1/scans/${geo}/confirm`, { body: JSON.stringify({ text: ALG }), headers: { "content-type": "application/json" } });
const edited = await solve(geo);
check(edited.json.solution.lesson.figure === null && edited.json.solution.lesson.analysis.topic === "equation", "editing the problem produces a new lesson for the new text");
const regen = await solve(geo, { regenerate: true });
check(regen.json.solution.createdAt !== edited.json.solution.createdAt, "regenerate creates a fresh lesson");
check((await call("DELETE", `/v1/scans/${geo}`)).status === 204, "deleting the problem works");
check((await call("GET", `/v1/scans/${geo}/solution`)).status === 404, "its lesson is deleted too");

// --- one photo, several questions ------------------------------------------------
const wsForm = new FormData();
wsForm.append("image", new Blob([fixture], { type: "image/jpeg" }), "ws.jpg");
const ws = await call("POST", "/v1/scans", { body: wsForm, headers: { "Idempotency-Key": token(), "x-mock-scenario": "worksheet" } });
const wsScan = ws.json.scan;
check(wsScan.ocr.problems.length === 3 && wsScan.ocr.problems[1].label === "Bài 2", "OCR splits a worksheet into separate problems", wsScan.ocr);
const kept = [wsScan.ocr.problems[0], { ...wsScan.ocr.problems[1], text: wsScan.ocr.problems[1].text + " (sửa)" }];
const confirmed = await call("POST", `/v1/scans/${wsScan.id}/confirm`, {
  body: JSON.stringify({ questions: kept }),
  headers: { "content-type": "application/json" },
});
const qs = confirmed.json.scan.problem.questions;
check(qs.length === 2 && qs[0].id === "q1" && qs[1].id === "q2" && qs[1].label === "Bài 2", "confirming keeps only the chosen questions, in order");
check(confirmed.json.scan.problem.edited === true, "dropping/editing questions is recorded as edited");
const q2 = await call("POST", `/v1/scans/${wsScan.id}/questions/q2/solve`, { body: "{}", headers: { "content-type": "application/json" } });
check(q2.json.solution.status === "ready" && q2.json.solution.questionId === "q2", "each question is solved on its own", q2.json);
check(q2.json.solution.lesson.figure !== null, "question 2 (the triangle) gets its own geometry lesson");
check((await call("GET", `/v1/scans/${wsScan.id}/questions/q1/solution`)).status === 404, "question 1 has no lesson until it's solved");
const q1 = await call("POST", `/v1/scans/${wsScan.id}/questions/q1/solve`, { body: "{}", headers: { "content-type": "application/json" } });
check(q1.json.solution.lesson.figure === null && q1.json.solution.id !== q2.json.solution.id, "question 1 gets a separate (algebra) lesson");
check((await call("POST", `/v1/scans/${wsScan.id}/questions/q9/solve`)).status === 404, "an unknown question is rejected");
check((await call("GET", `/v1/scans/${wsScan.id}/questions/q2/solution`, { device: B })).status === 404, "another device can't read a question's lesson");
const both = await call("POST", `/v1/scans/${wsScan.id}/confirm`, { body: JSON.stringify({ text: "x", questions: kept }), headers: { "content-type": "application/json" } });
check(both.status === 400, "confirm rejects text and questions together");

console.log(`\nAll ${passed} solve checks passed against ${API}`);
