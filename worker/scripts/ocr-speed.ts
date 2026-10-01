/**
 * Local OCR speed/accuracy bench: calls an OpenAI-compatible vision server directly (no worker in
 * between) with the app's own OCR prompt + schema, and reports where the time goes (prompt/image
 * processing vs generation) and accuracy (CER, same metric as tools/ocr-eval/run.mjs).
 *
 *   npx tsx scripts/ocr-speed.ts --tag q35-9b-compact [--format compact|full] [--size 1280]
 *     [--ids 01-arithmetic-vi,…] [--url http://127.0.0.1:8080] [--model alias] [--max-tokens 4096]
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Agent, setGlobalDispatcher } from "undici";
import { MODEL_OCR_COMPACT_JSON_SCHEMA, MODEL_OCR_JSON_SCHEMA, normalizeOcrOutput } from "../src/ocr/normalize";
import { OCR_SYSTEM_PROMPT, OCR_SYSTEM_PROMPT_COMPACT, OCR_USER_INSTRUCTION } from "../src/ocr/prompt";
import { meanLogprob } from "../src/ocr/local";
import { ocrTextToCompactJson } from "../src/ocr/textFormat";

setGlobalDispatcher(new Agent({ headersTimeout: 0, bodyTimeout: 0 }));
const args = process.argv.slice(2);
const flag = (n: string, d?: string) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1]! : d;
};
const tag = flag("tag", "adhoc")!;
const format = (flag("format", "compact") as "compact" | "full" | "text") ?? "compact";
const textPrompt = flag("prompt", "OCR:")!;
const size = flag("size") ? Number(flag("size")) : null;
const url = flag("url", "http://127.0.0.1:8080")!;
const model = flag("model", "local")!;
const maxTokens = Number(flag("max-tokens", "4096"));
const ids = flag("ids")?.split(",");

const ROOT = new URL("../../tools/ocr-eval/", import.meta.url).pathname;
type Case = { id: string; category: string; expected: string | null; expectStatus?: string; expectProblems?: number };
const cases = (JSON.parse(readFileSync(`${ROOT}cases.json`, "utf8")) as Case[]).filter((c) => (ids ? ids.includes(c.id) : true));

// Same normalisation and metric as tools/ocr-eval/run.mjs.
const normalize = (t: string) =>
  t.normalize("NFC").toLowerCase().replace(/[−–—]/g, "-").replace(/[·⋅•]/g, ".").replace(/[×✕]/g, "x").replace(/[⎧⎨⎩{}]/g, "").replace(/[;:,]/g, "").replace(/\s+/g, "");
function editDistance(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length]!;
}

function imageBytes(id: string): Buffer {
  const src = `${ROOT}fixtures/${id}.jpg`;
  if (!size) return readFileSync(src);
  const out = join(tmpdir(), `ocr-${id}-${size}.jpg`);
  // Downscale (never upscale) the long side with macOS sips.
  execFileSync("sips", ["-Z", String(size), src, "--out", out], { stdio: "ignore" });
  return readFileSync(out);
}

const rows: Record<string, unknown>[] = [];
for (const c of cases) {
  const bytes = imageBytes(c.id);
  const started = Date.now();
  let row: Record<string, unknown> = { id: c.id };
  try {
    const res = await fetch(`${url}/v1/chat/completions`, {
      method: "POST",
      signal: AbortSignal.timeout(12 * 60_000),
      headers: { "content-type": "application/json" },
      body: JSON.stringify(format === "text" ? {
        model,
        temperature: 0,
        max_tokens: maxTokens,
        logprobs: true,
        messages: [{ role: "user", content: [{ type: "image_url", image_url: { url: `data:image/jpeg;base64,${bytes.toString("base64")}` } }, { type: "text", text: textPrompt }] }],
      } : {
        model,
        temperature: 0,
        max_tokens: maxTokens,
        chat_template_kwargs: { enable_thinking: false },
        response_format: { type: "json_schema", json_schema: { name: "ocr_result", strict: true, schema: format === "compact" ? MODEL_OCR_COMPACT_JSON_SCHEMA : MODEL_OCR_JSON_SCHEMA } },
        messages: [
          { role: "system", content: format === "compact" ? OCR_SYSTEM_PROMPT_COMPACT : OCR_SYSTEM_PROMPT },
          { role: "user", content: [{ type: "text", text: OCR_USER_INSTRUCTION }, { type: "image_url", image_url: { url: `data:image/jpeg;base64,${bytes.toString("base64")}` } }] },
        ],
      }),
    });
    const body = (await res.json()) as {
      choices?: { finish_reason?: string; message?: { content?: string }; logprobs?: { content?: { logprob?: number }[] } }[];
      timings?: { prompt_n?: number; prompt_ms?: number; predicted_n?: number; predicted_ms?: number };
    };
    const ms = Date.now() - started;
    const content = body.choices?.[0]?.message?.content ?? "";
    const lp = meanLogprob(body.choices?.[0]?.logprobs?.content);
    const text = format === "text" ? ocrTextToCompactJson(content, lp) : content;
    const t = body.timings ?? {};
    row = { ...row, ms, promptTokens: t.prompt_n, promptMs: Math.round(t.prompt_ms ?? 0), outTokens: t.predicted_n, genMs: Math.round(t.predicted_ms ?? 0), finish: body.choices?.[0]?.finish_reason };
    const ocr = normalizeOcrOutput(text, { provider: "local", model, durationMs: ms });
    let pass: boolean;
    let cer: number | null = null;
    if (c.expected === null) {
      const allowed = c.expectStatus === "unreadable_or_low_quality" ? ["unreadable", "low_quality"] : [c.expectStatus];
      pass = allowed.includes(ocr.status);
    } else {
      cer = editDistance(normalize(c.expected), normalize(ocr.rawText)) / Math.max(1, normalize(c.expected).length);
      pass = cer <= 0.1 && (ocr.status === "success" || ocr.status === "low_quality") && (!c.expectProblems || ocr.problems.length === c.expectProblems);
    }
    row = { ...row, status: ocr.status, cer: cer === null ? null : Number(cer.toFixed(4)), problems: ocr.problems.length, pass, meanLogprob: lp === undefined ? null : Number(lp.toFixed(3)), rawText: ocr.rawText, formattedText: ocr.formattedText, modelText: content };
  } catch (err) {
    row = { ...row, ms: Date.now() - started, pass: false, error: (err as Error).message.slice(0, 120) };
  }
  rows.push(row);
  console.log(
    `${row.pass ? "PASS" : "FAIL"} ${c.id.padEnd(22)} ${String(row.ms).padStart(7)}ms  prompt ${row.promptTokens ?? "-"}t/${row.promptMs ?? "-"}ms  gen ${row.outTokens ?? "-"}t/${row.genMs ?? "-"}ms  CER ${row.cer ?? "-"} ${row.status ?? row.error ?? ""}`,
  );
}
const n = rows.length;
const avg = (k: string) => Math.round(rows.reduce((s, r) => s + (Number(r[k]) || 0), 0) / n);
const cers = rows.filter((r) => typeof r.cer === "number").map((r) => r.cer as number);
const summary = {
  tag, format, size, model, n, pass: rows.filter((r) => r.pass).length,
  meanCer: cers.length ? Number((cers.reduce((a, b) => a + b, 0) / cers.length).toFixed(4)) : null,
  meanMs: avg("ms"), medianMs: [...rows.map((r) => Number(r.ms))].sort((a, b) => a - b)[Math.floor(n / 2)],
  meanPromptMs: avg("promptMs"), meanGenMs: avg("genMs"), meanOutTokens: avg("outTokens"), meanPromptTokens: avg("promptTokens"),
};
console.log(JSON.stringify(summary));
const out = new URL("../../tools/benchmark/results/", import.meta.url).pathname;
mkdirSync(out, { recursive: true });
writeFileSync(`${out}OCR-${tag}.json`, JSON.stringify({ summary, rows }, null, 1));
