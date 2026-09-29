/**
 * Dev tool: solve one problem with the real model, print the lesson and verification.
 *   npx tsx scripts/solve-once.ts "problem text" [model] [effort]
 * Reads OPENAI_API_KEY from .dev.vars.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { VN_GRADE_9 } from "../src/solver/curriculum";
import { GeminiJsonModel } from "../src/solver/geminiModel";
import { OpenAiJsonModel } from "../src/solver/llm";
import { solveProblem } from "../src/solver/pipeline";

const vars = Object.fromEntries(
  readFileSync(new URL("../.dev.vars", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
const [problem, model = "gemini-3.5-flash-lite", effort = "low"] = process.argv.slice(2);
const llm = model.startsWith("gemini")
  ? new GeminiJsonModel(vars.GEMINI_API_KEY!, model, effort)
  : new OpenAiJsonModel(vars.OPENAI_API_KEY!, model, effort);
const result = await solveProblem(llm, VN_GRADE_9, problem!, {
  signal: AbortSignal.timeout(240_000),
  log: console.log,
  // DUMP=dir writes each attempt's raw output there (for debugging figures).
  onRaw: process.env.DUMP ? (n, text) => writeFileSync(`${process.env.DUMP}/attempt-${n}.json`, text) : undefined,
});
console.log(`status=${result.verification.status} attempts=${result.attempts} ${(result.durationMs / 1000).toFixed(1)}s`);
console.log(`USAGE ${JSON.stringify(result.usage)}`);
writeFileSync("/tmp/lesson.json", JSON.stringify(result, null, 2));
const l = result.lesson;
console.log("analysis:", l.analysis.status, l.analysis.topic, "|", l.analysis.concepts.join("; "));
console.log("strategy:", l.strategy);
for (const h of l.hints) console.log(`H${h.level} [${h.stepId}] Q: ${h.question}\n     A: ${h.explanation}${h.focus.length ? `  focus=${h.focus}` : ""}`);
for (const s of l.steps) console.log(`${s.id} ${s.title} :: ${s.math ?? ""}  (${s.reason ?? ""}) ${s.geometryActions.map((a) => a.action + ":" + a.targets).join(" ")}`);
console.log("answer:", l.finalAnswer.text);
console.log("checks:", JSON.stringify(result.verification.checks));
if (l.figure) console.log("figure:", l.figure.scale, l.figure.points.map((p) => `${p.id}:${p.kind}`).join(" "));
