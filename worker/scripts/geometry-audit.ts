/**
 * Geometry audit — the three checks of the improvement loop, on lessons that already exist (no model call):
 *
 *   1. figure ↔ solution text: every point the solution names is drawn, and every point the solution *defines*
 *      ("Gọi X là giao điểm của AL và GJ", "X = AL ∩ GJ") sits where that definition puts it;
 *   2. steps ↔ figure: claims a step makes that are false on the exact figure (and arithmetic slips);
 *   3. grade level: methods outside the knowledge base (forbidden) or advanced ones (advisory).
 *
 *   npx tsx scripts/geometry-audit.ts <result.json>... [--db] [--json out.json]
 *     <result.json>  benchmark result files (their lessons are re-verified with the current code)
 *     --db           also the stored lessons in the local D1 database
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { figureCoverage } from "../../shared/src/figureComplete";
import { resolveFigure } from "../../shared/src/geometry";
import { gradeLevelReport } from "../../shared/src/gradeLevel";
import { constructNamedPoints } from "../../shared/src/pointDefinitions";
import { ModelLessonSchema, type ModelLesson } from "../../shared/src/solution";
import { verifyLesson } from "../../shared/src/verify";

const args = process.argv.slice(2);
const files = args.filter((a) => a.endsWith(".json") && !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--json");
const jsonOut = args.includes("--json") ? args[args.indexOf("--json") + 1] : undefined;

interface Case {
  id: string;
  lesson: ModelLesson;
  problemText?: string;
}
const cases: Case[] = [];
const dataset = new Map<string, string>();
for (const f of ["chuyen.jsonl", "problems.jsonl"])
  for (const line of readFileSync(new URL(`../../tools/benchmark/dataset/${f}`, import.meta.url), "utf8").trim().split("\n")) {
    const d = JSON.parse(line) as { id: string; problem_text: string };
    dataset.set(d.id, d.problem_text);
  }
for (const f of files) {
  const run = JSON.parse(readFileSync(f, "utf8")) as { summary: { exp: string }; rows: { id: string; lesson: unknown }[] };
  for (const r of run.rows) {
    const p = ModelLessonSchema.safeParse(r.lesson);
    if (p.success && (p.data.analysis.topic === "geometry" || p.data.figure)) cases.push({ id: `${run.summary.exp}:${r.id}`, lesson: p.data, problemText: dataset.get(r.id) });
  }
}
if (args.includes("--db")) {
  const dir = new URL("../.wrangler/state/v3/d1/miniflare-D1DatabaseObject/", import.meta.url).pathname;
  const db = dir + readdirSync(dir).find((f) => f.endsWith(".sqlite") && f !== "metadata.sqlite");
  const rows: { id: string; lesson_json: string; q: string | null }[] = JSON.parse(
    execFileSync("sqlite3", ["-json", db, "SELECT s.scan_id || '/' || s.question_id AS id, s.lesson_json, c.questions_json AS q FROM solutions s JOIN scans c ON c.id = s.scan_id WHERE s.status = 'ready' AND s.lesson_json IS NOT NULL"], { encoding: "utf8", maxBuffer: 1 << 28 }) || "[]",
  );
  for (const r of rows) {
    const p = ModelLessonSchema.safeParse(JSON.parse(r.lesson_json));
    if (!p.success || !(p.data.analysis.topic === "geometry" || p.data.figure)) continue;
    const qs = r.q ? JSON.parse(r.q) : [];
    const text = (Array.isArray(qs) ? qs : qs.questions ?? []).find((q: { id: string }) => q.id === r.id.split("/")[1])?.text;
    cases.push({ id: `db:${r.id.slice(0, 8)}/${r.id.split("/")[1]}`, lesson: p.data, problemText: text });
  }
}

/** Points the solution text defines, with where that definition puts them vs where the figure has them. */
function definitionMismatches(lesson: ModelLesson): { point: string; off: number }[] {
  const fig = lesson.figure;
  if (!fig) return [];
  const resolved = resolveFigure(fig);
  const out: { point: string; off: number }[] = [];
  const texts = [...lesson.steps.flatMap((s) => [s.title, s.explanation]), ...lesson.hints.map((h) => h.explanation)].join("\n");
  const xs = Object.values(resolved.points).map((p) => p.x);
  const ys = Object.values(resolved.points).map((p) => p.y);
  const size = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 1e-6);
  for (const p of fig.points) {
    if (p.hidden || p.kind === "free" || !resolved.points[p.id]) continue;
    if (!new RegExp(`(?:Gọi\\s+|gọi\\s+|\\$?)${p.id}\\$?\\s*(?:là|=)`).test(texts.replace(/\$/g, ""))) continue;
    // Rebuild this point from the solution's words alone, on the same figure without it.
    const without = { ...fig, points: fig.points.map((q) => (q.id === p.id ? { ...q, kind: "free" as const, refs: [], x: 1e3, y: 1e3, value: null } : q)) };
    const stub = { ...lesson, analysis: { ...lesson.analysis, statement: "" }, figure: without } as ModelLesson;
    const rebuilt = constructNamedPoints(stub).lesson.figure!;
    const def = rebuilt.points.find((q) => q.id === p.id);
    if (!def || def.kind === "free") continue; // the words couldn't be parsed: nothing to compare
    const r2 = resolveFigure(rebuilt).points[p.id];
    const r1 = resolved.points[p.id]!;
    if (!r2) continue;
    const off = Math.hypot(r1.x - r2.x, r1.y - r2.y) / size;
    if (off > 1e-6) out.push({ point: p.id, off });
  }
  return out;
}

const report: unknown[] = [];
const totals = { lessons: 0, withFigure: 0, missingObjects: 0, definitionMismatch: 0, falseClaimSteps: 0, steps: 0, forbidden: 0, advisory: 0, clean: 0 };
for (const c of cases) {
  const v = verifyLesson(c.lesson, { problemText: c.problemText });
  totals.lessons++;
  const fig = v.lesson.figure;
  const cov = fig && v.resolvedFigure ? figureCoverage(v.lesson, v.resolvedFigure) : null;
  if (fig) totals.withFigure++;
  const missing = cov?.missing ?? [];
  const defs = definitionMismatches(v.lesson);
  const failedSteps = (v.verification.steps ?? []).filter((s) => s.status === "failed").map((s) => s.stepId);
  const falseClaims = v.feedback.filter((f) => /is false in the constructed figure|arithmetic slip/.test(f)).map((f) => f.replace(/^the lesson states /, "").slice(0, 200));
  const gl = gradeLevelReport(v.lesson);
  const advanced = gl.advisory.filter((a) => a.startsWith("uses "));
  totals.missingObjects += missing.length;
  totals.definitionMismatch += defs.length;
  totals.falseClaimSteps += failedSteps.length;
  totals.steps += v.lesson.steps.length;
  totals.forbidden += gl.forbidden.length;
  totals.advisory += advanced.length;
  const clean = !!fig && missing.length === 0 && defs.length === 0 && failedSteps.length === 0 && gl.forbidden.length === 0;
  if (clean) totals.clean++;
  report.push({ id: c.id, status: v.verification.status, figure: !!fig, missing, definitionMismatch: defs, failedSteps, falseClaims, forbidden: gl.forbidden, advanced });
  console.log(
    `${clean ? "✓" : "✗"} ${c.id} [${v.verification.status}]` +
      `${fig ? "" : " NO FIGURE"}` +
      `${missing.length ? ` | (1) not drawn: ${missing.join(", ")}` : ""}` +
      `${defs.length ? ` | (1) drawn elsewhere than the text says: ${defs.map((d) => `${d.point} (off ${(d.off * 100).toFixed(0)}%)`).join(", ")}` : ""}` +
      `${failedSteps.length ? ` | (2) steps vs figure: ${failedSteps.join(", ")} — ${falseClaims.slice(0, 3).join(" ; ")}` : ""}` +
      `${gl.forbidden.length ? ` | (3) outside the curriculum: ${gl.forbidden.join("; ")}` : ""}` +
      `${advanced.length ? ` | (3) advanced: ${advanced.join("; ")}` : ""}`,
  );
}
console.log(`\n${JSON.stringify(totals)}`);
if (jsonOut) writeFileSync(jsonOut, JSON.stringify({ createdAt: new Date().toISOString(), totals, cases: report }, null, 2) + "\n");
