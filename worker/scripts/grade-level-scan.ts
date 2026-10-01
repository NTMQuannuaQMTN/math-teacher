/**
 * Applies the deterministic grade-level rubric (shared/src/gradeLevel.ts) to stored lessons: benchmark
 * results (tools/benchmark/results) and, if given, a local D1 file. No model call.
 *   npx tsx scripts/grade-level-scan.ts [results-prefix] [--d1 path] [--json out.json]
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { gradeLevelReport } from "../../shared/src/gradeLevel";
import type { ModelLesson } from "../../shared/src/solution";

const args = process.argv.slice(2);
const flag = (n: string) => (args.includes(`--${n}`) ? args[args.indexOf(`--${n}`) + 1] : undefined);
const prefix = args[0] && !args[0].startsWith("--") ? args[0] : "EXP-";
const dir = new URL("../../tools/benchmark/results/", import.meta.url).pathname;
const lessons: { source: string; id: string; model: string; lesson: ModelLesson }[] = [];
for (const f of readdirSync(dir).filter((f) => f.startsWith(prefix) && f.endsWith(".json"))) {
  const run = JSON.parse(readFileSync(dir + f, "utf8"));
  for (const r of run.rows ?? []) if (r.lesson) lessons.push({ source: f.replace(".json", ""), id: r.id, model: run.summary?.system ?? "?", lesson: r.lesson });
}
const d1 = flag("d1");
if (d1) {
  const rows = JSON.parse(execFileSync("sqlite3", ["-json", d1, "select id, model, lesson_json from solutions where lesson_json is not null and model != 'mock-solver'"], { encoding: "utf8" }) || "[]");
  for (const r of rows) lessons.push({ source: "d1", id: r.id.slice(0, 8), model: r.model, lesson: JSON.parse(r.lesson_json) });
}
const out = lessons.map((l) => ({ source: l.source, id: l.id, model: l.model, ...gradeLevelReport(l.lesson) }));
const byModel = new Map<string, typeof out>();
for (const o of out) byModel.set(o.model, [...(byModel.get(o.model) ?? []), o]);
for (const [model, rows] of byModel) {
  const pct = (k: keyof (typeof out)[0]["rubric"]) => `${rows.filter((r) => r.rubric[k]).length}/${rows.length}`;
  console.log(`${model.padEnd(40)} fit ${pct("curriculumFit")}  familiar ${pct("familiarMethods")}  concise ${pct("concise")}  no-hand-waving ${pct("noHandWaving")}  hints ${pct("hintsProgressive")}`);
}
for (const o of out) if (o.forbidden.length || o.advisory.length) console.log(`  ${o.source} ${o.id}: ${[...o.forbidden.map((f) => `FORBIDDEN ${f}`), ...o.advisory].join("; ")}`);
const json = flag("json");
if (json) writeFileSync(json, JSON.stringify(out, null, 1));
