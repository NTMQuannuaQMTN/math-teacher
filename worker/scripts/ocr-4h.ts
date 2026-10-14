/**
 * OCR evaluation against the gold transcriptions in tools/ocr-eval/cases.json, run directly on the production OCR code
 * (createOcrProvider + runOcr + normalizeOcrOutput) with the local PaddleOCR-VL server only (no paid provider, no worker).
 * Also checks OCR → solver: the deterministic solver gets the OCR text and the gold text; the answers must agree.
 *
 *   npx tsx scripts/ocr-4h.ts            (needs llama-server with PaddleOCR-VL on LOCAL_OCR_URL, default :8090)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createOcrProvider, runOcr } from "../src/ocr/service";
import type { Env } from "../src/env";
import { flatten } from "../src/solver/routine/text";
import { solveProblem } from "../src/solver/pipeline";
import { VN_GRADE_9 } from "../src/solver/curriculum";
import { OcrFailure } from "../src/ocr/provider";
import type { JsonModel } from "../src/solver/llm";

const root = new URL("../../", import.meta.url).pathname;
const vars = Object.fromEntries(readFileSync(`${root}worker/.dev.vars`, "utf8").split("\n").filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
// Local OCR only: copy just the OCR settings, never an API key.
const env = { OCR_PROVIDER: "local", LOCAL_OCR_URL: vars.LOCAL_OCR_URL ?? "http://127.0.0.1:8090", LOCAL_OCR_MODEL: vars.LOCAL_OCR_MODEL, OCR_OUTPUT_FORMAT: vars.OCR_OUTPUT_FORMAT, LOCAL_OCR_PROMPT: vars.LOCAL_OCR_PROMPT, OCR_TIMEOUT_MS: "20000" } as unknown as Env;
const cases = JSON.parse(readFileSync(`${root}tools/ocr-eval/cases.json`, "utf8")) as { id: string; expected: string | null; expectStatus?: string }[];

// Same normalisation as tools/ocr-eval/run.mjs (CER definition kept comparable with earlier reports).
const norm = (t: string) => t.normalize("NFC").toLowerCase().replace(/[−–—]/g, "-").replace(/[·⋅•]/g, ".").replace(/[×✕]/g, "x").replace(/[⎧⎨⎩{}]/g, "").replace(/[;:,]/g, "").replace(/\s+/g, "");
/** Notation-independent form: LaTeX and unicode math both mapped to one plain spelling first. Parentheses are kept:
 *  √(x + 1) and √x + 1 are different problems. */
const mathNorm = (t: string) => norm(flatten(t.replace(/\\begin\{cases\}|\\end\{cases\}|\\\\/g, " ").replace(/∛/g, "cbrt").replace(/\\sqrt\[3\]/g, "cbrt").replace(/÷|\\div/g, ":").replace(/△|\\triangle/g, "tamgiac")).replace(/√\(([a-z0-9])\)/g, "√$1"));
function edit(a: string, b: string) {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]!;
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j]!;
      prev[j] = Math.min(prev[j]! + 1, prev[j - 1]! + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length]!;
}
const unavailable: JsonModel = { name: "none", model: "unavailable", complete: async () => { throw new OcrFailure("provider_error", "offline", true); } };
async function answerOf(text: string) {
  try {
    const r = await solveProblem(unavailable, VN_GRADE_9, text, { signal: AbortSignal.timeout(5000) });
    return `${r.model}: ${r.lesson.finalAnswer.text}`;
  } catch {
    return null;
  }
}

const provider = createOcrProvider(env);
const rows = [];
for (const c of cases) {
  const image = readFileSync(`${root}tools/ocr-eval/fixtures/${c.id}.jpg`);
  const started = Date.now();
  let row: Record<string, unknown> = { id: c.id };
  try {
    const out = await runOcr(provider, env, { bytes: image.buffer.slice(image.byteOffset, image.byteOffset + image.byteLength) as ArrayBuffer, contentType: "image/jpeg" });
    const ms = Date.now() - started;
    row = { ...row, ms, status: out.status, problems: out.problems.length, confidence: out.confidence ?? null, rawText: out.rawText };
    if (c.expected === null) row.pass = c.expectStatus ? c.expectStatus.split("_or_").includes(out.status) || (c.expectStatus === "unreadable_or_low_quality" && ["unreadable", "low_quality"].includes(out.status)) : null;
    else {
      const cer = edit(norm(c.expected), norm(out.rawText)) / Math.max(1, norm(c.expected).length);
      const mcer = edit(mathNorm(c.expected), mathNorm(out.rawText)) / Math.max(1, mathNorm(c.expected).length);
      // OCR → solver: the deterministic solver must give the same result on the OCR text as on the gold text.
      const text = out.problems.length === 1 ? out.problems[0]!.text : out.rawText;
      const [gold, read] = [await answerOf(c.expected), await answerOf(text)];
      row = { ...row, cer: +cer.toFixed(4), mathCer: +mcer.toFixed(4), exactAfterNormalisation: mcer === 0, pass: cer <= 0.1, solverOnGold: gold, solverOnOcr: read, solverAgrees: gold === null ? null : gold === read };
    }
  } catch (err) {
    row = { ...row, ms: Date.now() - started, error: (err as Error).message, pass: false };
  }
  rows.push(row);
  console.log(`${c.id.padEnd(22)} ${row.error ? `ERROR ${row.error}` : `${row.status} cer=${row.cer ?? "-"} mathCer=${row.mathCer ?? "-"} pass=${row.pass} ${row.ms}ms${row.solverAgrees === null || row.solverAgrees === undefined ? "" : ` solverAgrees=${row.solverAgrees}`}`}`);
}
const scored = rows.filter((r) => typeof r.cer === "number");
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
const summary = {
  cases: rows.length, textCases: scored.length, passCer10: scored.filter((r) => r.pass).length, meanCer: +mean(scored.map((r) => r.cer as number)).toFixed(4),
  meanMathCer: +mean(scored.map((r) => r.mathCer as number)).toFixed(4), exactAfterNormalisation: scored.filter((r) => r.exactAfterNormalisation).length,
  negativeCasesPassed: rows.filter((r) => r.cer === undefined && r.pass === true).length, negativeCases: rows.filter((r) => r.cer === undefined && !r.error).length,
  solverChecked: rows.filter((r) => r.solverAgrees !== null && r.solverAgrees !== undefined).length, solverAgrees: rows.filter((r) => r.solverAgrees === true).length,
  medianMs: [...rows.map((r) => r.ms as number)].sort((a, b) => a - b)[Math.floor(rows.length / 2)],
};
console.log(summary);
writeFileSync(`${root}tools/eval-4h/results/ocr-paddle-local.json`, JSON.stringify({ createdAt: new Date().toISOString(), model: env.LOCAL_OCR_MODEL, summary, rows }, null, 2));
