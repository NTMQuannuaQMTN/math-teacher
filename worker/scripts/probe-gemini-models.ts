/** Dev probe: can this key call each Gemini model? npx tsx scripts/probe-gemini-models.ts <model...> */
import { readFileSync } from "node:fs";
import { geminiJson } from "../src/gemini";
const vars = Object.fromEntries(
  readFileSync(new URL("../.dev.vars", import.meta.url), "utf8").split("\n").filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
for (const model of process.argv.slice(2)) {
  const t0 = Date.now();
  try {
    const r = await geminiJson({
      apiKey: vars.GEMINI_API_KEY!,
      model,
      system: "Answer briefly.",
      contents: [{ role: "user", parts: [{ text: "What is 17 * 3? Reply as JSON." }] }],
      schema: { type: "object", properties: { answer: { type: "number" } }, required: ["answer"] },
      thinkingLevel: "low",
      maxOutputTokens: 2000,
      signal: AbortSignal.timeout(60_000),
    });
    console.log(`${model.padEnd(24)} OK  ${r.text.trim()}  (${Date.now() - t0}ms, in=${r.usage.input} out=${r.usage.output})`);
  } catch (err) {
    console.log(`${model.padEnd(24)} FAIL ${(err as Error).message.replace(/\s+/g, " ").slice(0, 150)}`);
  }
  await new Promise((r) => setTimeout(r, 1500));
}
