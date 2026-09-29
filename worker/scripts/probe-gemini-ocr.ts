/** Dev probe: OCR one fixture with each given Gemini model. npx tsx scripts/probe-gemini-ocr.ts <fixture> <model...> */
import { readFileSync } from "node:fs";
import { GeminiOcrProvider } from "../src/ocr/gemini";
import { normalizeOcrOutput } from "../src/ocr/normalize";

const vars = Object.fromEntries(
  readFileSync(new URL("../.dev.vars", import.meta.url), "utf8").split("\n").filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
const [fixture, ...models] = process.argv.slice(2);
const bytes = readFileSync(new URL(`../../tools/ocr-eval/fixtures/${fixture}`, import.meta.url));
for (const model of models) {
  const t0 = Date.now();
  try {
    const out = await new GeminiOcrProvider(vars.GEMINI_API_KEY!, model).extract({
      bytes: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
      contentType: "image/jpeg",
      signal: AbortSignal.timeout(60_000),
    });
    const r = normalizeOcrOutput(out.text, { provider: "gemini", model, durationMs: Date.now() - t0 });
    console.log(`  ${model}: ${r.status} ${Date.now() - t0}ms | ${r.problems.length} problem(s) | ${r.rawText.replace(/\n/g, " ⏎ ").slice(0, 110)}`);
  } catch (err) {
    console.log(`  ${model}: FAILED ${(err as Error).message.slice(0, 200)}`);
  }
}
