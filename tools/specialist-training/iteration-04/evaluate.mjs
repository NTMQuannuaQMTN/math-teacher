import { createHash, randomBytes } from "node:crypto";
import { appendFileSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { auditLesson } from "./lesson-audit.mjs";

const topic = process.argv[2] ?? "algebra";
const split = process.argv[3] ?? "development";
const stage = process.argv[4] ?? "baseline";
const base = `http://127.0.0.1:${process.env.ITERATION04_PORT || 8804}`;
const out = `tools/specialist-training/iteration-04/${topic}-${stage}-${split}.jsonl`;
rmSync(out, { force: true });
const allRows = readFileSync("tools/specialist-training/iteration-04/cases.jsonl", "utf8").trim().split("\n").map(JSON.parse);
const rows = allRows.filter((row) => row.topic === topic && row.split === split);
const sealed = allRows.filter((row) => row.topic === topic && row.split === "held-out").map(({ reference, ...row }) => row);
writeFileSync(`tools/specialist-training/iteration-04/${topic}-heldout.sha256`, createHash("sha256").update(JSON.stringify(sealed)).digest("hex") + "\n");
const fixture = readFileSync("tools/ocr-eval/fixtures/02-quadratic-vi.jpg");
const token = randomBytes(32).toString("base64url");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function request(path, { method = "GET", body, headers = {}, timeout = 30000 } = {}) {
  const response = await fetch(`${base}${path}`, { method, headers: { authorization: `Bearer ${token}`, ...headers }, body, signal: AbortSignal.timeout(timeout) });
  const raw = await response.text();
  let parsed; try { parsed = JSON.parse(raw); } catch { parsed = { error: { code: "non_json", message: raw } }; }
  return { httpStatus: response.status, body: parsed };
}
const fold = (value) => String(value).normalize("NFC").toLowerCase().replace(/\\(?:dfrac|tfrac|frac)/g, "").replace(/[\s{}$\\]/g, "");
for (const row of rows) {
  const startedAt = new Date().toISOString();
  const started = performance.now();
  let result;
  try {
    const form = new FormData();
    form.append("image", new Blob([fixture], { type: "image/jpeg" }), "setup.jpg");
    const scan = await request("/v1/scans", { method: "POST", body: form, headers: { "Idempotency-Key": randomBytes(18).toString("base64url") } });
    const scanId = scan.body.scan?.id;
    if (!scanId) throw new Error(`scan setup failed: ${JSON.stringify(scan.body)}`);
    const confirmed = await request(`/v1/scans/${scanId}/confirm`, { method: "POST", body: JSON.stringify({ text: row.question }), headers: { "content-type": "application/json" } });
    if (confirmed.httpStatus !== 200) throw new Error(`confirm failed: ${JSON.stringify(confirmed.body)}`);
    let solved = await request(`/v1/scans/${scanId}/solve`, { method: "POST", body: JSON.stringify({ regenerate: true }), headers: { "content-type": "application/json" }, timeout: 30000 });
    while (solved.body.solution?.status === "pending" && performance.now() - started < 29500) {
      await sleep(150);
      solved = await request(`/v1/scans/${scanId}/solution`, { timeout: Math.max(500, 30000 - (performance.now() - started)) });
    }
    const durationMs = performance.now() - started;
    const lesson = solved.body.solution?.lesson;
    const renderAudit = lesson ? auditLesson(lesson) : null;
    const displayed = lesson ? fold(JSON.stringify(lesson)) : "";
    const fragmentPass = Boolean(lesson && row.evaluationCriteria.acceptAllFragments.every((fragment) => displayed.includes(fold(fragment))));
    const qualityPass = Boolean(lesson && renderAudit?.schemaValid && renderAudit.latexErrors.length === 0 && renderAudit.languageErrors.length === 0);
    const status = solved.body.solution?.status ?? "controlled_error";
    const controlledWithin30s = durationMs < row.evaluationCriteria.mustReturnWithinMs && (status === "ready" || status === "failed" || status === "partial" || Boolean(solved.body.error));
    result = { id: row.id, topic, split, stage, source: row.source, question: row.question, reference: row.reference, startedAt, durationMs, httpStatus: solved.httpStatus, status, verificationStatus: solved.body.solution?.verification?.status ?? null, model: solved.body.solution?.model ?? null, renderAudit, fragmentPass, qualityPass, controlledWithin30s, response: solved.body };
  } catch (error) {
    result = { id: row.id, topic, split, stage, source: row.source, question: row.question, reference: row.reference, startedAt, durationMs: performance.now() - started, status: "harness_error", controlledWithin30s: false, error: String(error) };
  }
  appendFileSync(out, JSON.stringify(result) + "\n");
  console.log(`${row.id}: ${result.durationMs.toFixed(0)} ms ${result.status} verified=${result.verificationStatus ?? "-"} answer=${result.fragmentPass ?? false} render=${result.qualityPass ?? false}`);
}
const results = readFileSync(out, "utf8").trim().split("\n").filter(Boolean).map(JSON.parse);
const summary = { topic, split, stage, n: results.length, ready: results.filter((x) => x.status === "ready").length, verified: results.filter((x) => x.verificationStatus === "verified").length, answerPasses: results.filter((x) => x.fragmentPass).length, qualityPasses: results.filter((x) => x.qualityPass).length, controlledWithin30s: results.filter((x) => x.controlledWithin30s).length, meanMs: results.reduce((a, x) => a + x.durationMs, 0) / Math.max(1, results.length), maxMs: Math.max(0, ...results.map((x) => x.durationMs)) };
writeFileSync(`tools/specialist-training/iteration-04/${topic}-${stage}-${split}-summary.json`, JSON.stringify(summary, null, 2) + "\n");
console.log(JSON.stringify(summary, null, 2));
