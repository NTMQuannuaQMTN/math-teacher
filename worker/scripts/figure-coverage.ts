/**
 * Deterministic figure-completeness evaluation on the lessons stored in the local D1 database: how many of the
 * segments and angles the text names are drawn, which named points/circles are missing, and how many steps
 * highlight everything they name — for the lesson as stored, and after running it through the current verifier
 * (completeFigure: missing segments and angle arcs, merged step highlights). No model call.
 *
 *   npx tsx scripts/figure-coverage.ts [--out ../tools/benchmark/results/figure-coverage.json]
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { figureCoverage, type FigureCoverage } from "../../shared/src/figureComplete";
import { resolveFigure } from "../../shared/src/geometry";
import { ModelLessonSchema } from "../../shared/src/solution";
import { verifyLesson } from "../../shared/src/verify";

const args = process.argv.slice(2);
const flag = (n: string) => (args.includes(`--${n}`) ? args[args.indexOf(`--${n}`) + 1] : undefined);
const dbDir = new URL("../.wrangler/state/v3/d1/miniflare-D1DatabaseObject/", import.meta.url).pathname;
const db = flag("db") ?? `${dbDir}${readdirSync(dbDir).find((f) => f.endsWith(".sqlite") && f !== "metadata.sqlite")}`;
const out = flag("out") ?? new URL("../../tools/benchmark/results/figure-coverage.json", import.meta.url).pathname;

const json = execFileSync("sqlite3", ["-json", db, "SELECT scan_id, question_id, prompt_version, lesson_json FROM solutions WHERE status = 'ready' AND lesson_json IS NOT NULL"], {
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});
const rows: { scan_id: string; question_id: string; prompt_version: string; lesson_json: string }[] = json.trim() ? JSON.parse(json) : [];

type Totals = { lessons: number; segMentioned: number; segDrawn: number; angMentioned: number; angDrawn: number; missing: number; stepsMentioning: number; stepsSynced: number };
const zero = (): Totals => ({ lessons: 0, segMentioned: 0, segDrawn: 0, angMentioned: 0, angDrawn: 0, missing: 0, stepsMentioning: 0, stepsSynced: 0 });
const add = (t: Totals, c: FigureCoverage) => {
  t.lessons++;
  t.segMentioned += c.segments.mentioned;
  t.segDrawn += c.segments.drawn;
  t.angMentioned += c.angles.mentioned;
  t.angDrawn += c.angles.drawn;
  t.missing += c.missing.length;
  t.stepsMentioning += c.steps.mentioning;
  t.stepsSynced += c.steps.synced;
};

const before = zero();
const after = zero();
const perLesson: unknown[] = [];
let skipped = 0;
for (const r of rows) {
  const parsed = ModelLessonSchema.safeParse(JSON.parse(r.lesson_json));
  if (!parsed.success || !parsed.data.figure) continue;
  const stored = parsed.data;
  const storedResolved = resolveFigure(stored.figure!);
  if (storedResolved.errors.length > 0) {
    skipped++;
    continue;
  }
  const b = figureCoverage(stored, storedResolved)!;
  const v = verifyLesson(stored);
  const a = v.lesson.figure && v.resolvedFigure ? figureCoverage(v.lesson, v.resolvedFigure) : null;
  // Compare only lessons that keep a usable figure after re-verification.
  if (!a) {
    skipped++;
    continue;
  }
  add(before, b);
  add(after, a);
  perLesson.push({ id: `${r.scan_id}/${r.question_id}`, promptVersion: r.prompt_version, before: b, after: a });
}

const pct = (n: number, d: number) => (d === 0 ? "—" : `${((100 * n) / d).toFixed(0)}% (${n}/${d})`);
const line = (name: string, t: Totals) =>
  `${name.padEnd(8)} segments ${pct(t.segDrawn, t.segMentioned)} · angles ${pct(t.angDrawn, t.angMentioned)} · missing points/circles ${t.missing} · steps synced ${pct(t.stepsSynced, t.stepsMentioning)}`;
console.log(`${before.lessons} stored lessons with a figure (${skipped} skipped: figure unresolvable)`);
console.log(line("stored", before));
console.log(line("current", after));
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ createdAt: new Date().toISOString(), before, after, skipped, lessons: perLesson }, null, 2) + "\n");
console.log(`→ ${out}`);
