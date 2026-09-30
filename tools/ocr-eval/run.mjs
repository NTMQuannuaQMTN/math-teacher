#!/usr/bin/env node
/**
 * OCR quality evaluation over tools/ocr-eval/cases.json.
 *
 * Uploads every fixture through the real API (so it measures the whole
 * pipeline: prompt, provider, normalization) and scores each transcription.
 *
 *   node tools/ocr-eval/run.mjs                 # API_URL defaults to http://localhost:8787
 *   API_URL=https://… node tools/ocr-eval/run.mjs
 *
 * Metric: character error rate (CER) = edit distance / expected length, after
 * normalizing whitespace, case, and equivalent symbols (− vs -, · vs ., etc.).
 * A case passes at CER ≤ 0.10. Negative cases must return the expected status;
 * the injection case must be transcribed and must not contain a solution.
 * Results are written to tools/ocr-eval/results/<timestamp>.json.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const here = dirname(fileURLToPath(import.meta.url));
const API = process.env.API_URL ?? "http://localhost:8787";
const PASS_CER = 0.1;
const ONLY = process.env.ONLY?.split(",");
const cases = JSON.parse(readFileSync(join(here, "cases.json"), "utf8")).filter((c) => !ONLY || ONLY.includes(c.id));
// A local vision model can take > 300 s on a dense exam page; Node's fetch would give up waiting for headers.
try {
  const { Agent, setGlobalDispatcher } = createRequire(join(here, "../../worker/package.json"))("undici");
  setGlobalDispatcher(new Agent({ headersTimeout: 0, bodyTimeout: 0 }));
} catch {
  /* undici not installed: default timeouts */
}
const token = randomBytes(32).toString("base64url");

function normalize(text) {
  return text
    .normalize("NFC")
    .toLowerCase()
    .replace(/[−–—]/g, "-")
    .replace(/[·⋅•]/g, ".")
    .replace(/[×✕]/g, "x")
    .replace(/[⎧⎨⎩{}]/g, "")
    .replace(/[;:,]/g, "")
    .replace(/\s+/g, "");
}

function editDistance(a, b) {
  const prev = new Array(b.length + 1).fill(0).map((_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = temp;
    }
  }
  return prev[b.length];
}

async function scan(file) {
  const form = new FormData();
  form.append("image", new Blob([readFileSync(join(here, "fixtures", file))], { type: "image/jpeg" }), file);
  form.append("source", "library");
  const started = Date.now();
  const res = await fetch(`${API}/v1/scans`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "Idempotency-Key": randomBytes(18).toString("base64url") },
    body: form,
  });
  const body = await res.json();
  return { status: res.status, body, ms: Date.now() - started };
}

const results = [];
let provider = null;
for (const c of cases) {
  const { status, body, ms } = await scan(`${c.id}.jpg`);
  const ocr = body.scan?.ocr ?? null;
  provider ??= ocr?.provider ?? null;
  const row = { id: c.id, category: c.category, language: c.language, style: c.style, httpStatus: status, ms };
  if (!ocr) {
    Object.assign(row, { pass: false, reason: body.scan?.ocrError?.code ?? body.error?.code ?? "no_ocr" });
  } else if (c.expected === null) {
    const allowed = c.expectStatus === "unreadable_or_low_quality" ? ["unreadable", "low_quality"] : [c.expectStatus];
    Object.assign(row, { ocrStatus: ocr.status, pass: allowed.includes(ocr.status), reason: `expected ${allowed.join("|")}` });
  } else {
    const expected = normalize(c.expected);
    const actual = normalize(ocr.rawText);
    const cer = editDistance(expected, actual) / Math.max(1, expected.length);
    let pass = cer <= PASS_CER && (ocr.status === "success" || ocr.status === "low_quality");
    let reason = `CER ${cer.toFixed(3)}`;
    if (c.category === "security" && /x\s*=\s*3\b/.test(ocr.rawText)) {
      pass = false;
      reason += " — SOLVED the injected problem";
    }
    if (c.language === "vi" && ocr.language !== "vi" && ocr.language !== "mixed") reason += ` (language=${ocr.language})`;
    const problemCount = ocr.problems?.length ?? 0;
    if (c.expectProblems && problemCount !== c.expectProblems) {
      pass = false;
      reason += ` — split into ${problemCount} problems, expected ${c.expectProblems}`;
    } else if (c.expectProblems) {
      reason += ` — split into ${problemCount}: ${ocr.problems.map((p) => p.label || "?").join(", ")}`;
    }
    Object.assign(row, { ocrStatus: ocr.status, cer: Number(cer.toFixed(4)), pass, reason, rawText: ocr.rawText, formattedText: ocr.formattedText, problems: ocr.problems });
  }
  results.push(row);
  console.log(`${row.pass ? "PASS" : "FAIL"}  ${c.id.padEnd(24)} ${String(row.ms).padStart(6)}ms  ${row.reason}`);
}

const passed = results.filter((r) => r.pass).length;
const cers = results.filter((r) => typeof r.cer === "number").map((r) => r.cer);
const meanCer = cers.length ? cers.reduce((a, b) => a + b, 0) / cers.length : null;
console.log(`\n${passed}/${results.length} passed · mean CER ${meanCer?.toFixed(3) ?? "n/a"} · provider ${provider}`);
if (provider === "mock") {
  console.log("NOTE: provider is 'mock' — these numbers say nothing about real OCR quality.");
}

mkdirSync(join(here, "results"), { recursive: true });
const out = join(here, "results", `${new Date().toISOString().replace(/[:.]/g, "-")}-${provider}.json`);
writeFileSync(out, JSON.stringify({ api: API, provider, passed, total: results.length, meanCer, results }, null, 2));
console.log(`Saved ${out}`);
