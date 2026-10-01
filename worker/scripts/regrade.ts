/**
 * Re-grades the final lessons of a saved benchmark run with the CURRENT verifier (no model call).
 * Shows how a verifier change alone moves the grades on identical model output.
 *   npx tsx scripts/regrade.ts tools/benchmark/results/<run>.json
 */
import { readFileSync, writeFileSync } from "node:fs";
import type { ModelLesson } from "../../shared/src/solution";
import { verifyLesson } from "../../shared/src/verify";
import { grade, type BenchItem } from "./lib/grade";

const run = JSON.parse(readFileSync(process.argv[2]!, "utf8")) as { summary: Record<string, unknown>; rows: { id: string; grade: string; lesson: ModelLesson | null }[] };
const outIdx = process.argv.indexOf("--out");
const regraded: Record<string, unknown>[] = [];
const items = new Map(
  readFileSync(new URL("../../tools/benchmark/dataset/problems.jsonl", import.meta.url), "utf8").trim().split("\n").map((l) => {
    const i = JSON.parse(l) as BenchItem;
    return [i.id, i];
  }),
);
const tally: Record<string, number> = {};
for (const r of run.rows) {
  const v = r.lesson ? verifyLesson(r.lesson) : null;
  const g = grade(items.get(r.id)!, v?.lesson ?? null, v?.verification ?? null);
  tally[g.grade] = (tally[g.grade] ?? 0) + 1;
  regraded.push({ ...r, grade: g.grade, answerCorrect: g.answerCorrect, status: v?.verification.status ?? null, lesson: v?.lesson ?? null });
  const failed = v?.verification.checks.filter((c) => !c.passed).map((c) => c.label.slice(0, 60)) ?? [];
  console.log(`${r.grade.padEnd(8)} → ${g.grade.padEnd(8)} ${r.id.padEnd(8)} ${v?.verification.status ?? "-"}  ${failed.length ? `failed: ${failed.join(" | ")}` : ""}`);
}
console.log(JSON.stringify(tally));
if (outIdx > 0) writeFileSync(process.argv[outIdx + 1]!, JSON.stringify({ summary: { ...run.summary, regradedWith: "current verifier", tally }, rows: regraded }, null, 1));
