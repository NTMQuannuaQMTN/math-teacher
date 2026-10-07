/**
 * Re-runs the current verifier (figure built from the statement, repairs, checks) on stored lessons, keeping the
 * lesson text: free, no model call. Use after a verifier fix so existing lessons get the corrected figure.
 *
 *   npx tsx scripts/reverify-stored.ts [--id <scan_id>/<question_id>] [--dry-run]
 *
 * Back up the local D1 file first (the script prints where it is).
 */
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { ModelLessonSchema } from "../../shared/src/solution";
import { verifyLesson } from "../../shared/src/verify";

const args = process.argv.slice(2);
const only = args.includes("--id") ? args[args.indexOf("--id") + 1] : undefined;
const dry = args.includes("--dry-run");
const dir = new URL("../.wrangler/state/v3/d1/miniflare-D1DatabaseObject/", import.meta.url).pathname;
const db = dir + readdirSync(dir).find((f) => f.endsWith(".sqlite") && f !== "metadata.sqlite");
console.log(`database: ${db}`);
const rows: { id: string; scan_id: string; question_id: string; lesson_json: string; questions_json: string | null }[] = JSON.parse(
  execFileSync("sqlite3", ["-json", db, "SELECT s.id, s.scan_id, s.question_id, s.lesson_json, c.questions_json FROM solutions s JOIN scans c ON c.id = s.scan_id WHERE s.status = 'ready' AND s.lesson_json IS NOT NULL"], { encoding: "utf8", maxBuffer: 1 << 28 }) || "[]",
);
let changed = 0;
for (const r of rows) {
  if (only && `${r.scan_id}/${r.question_id}` !== only) continue;
  const parsed = ModelLessonSchema.safeParse(JSON.parse(r.lesson_json));
  if (!parsed.success) continue;
  const qs = r.questions_json ? JSON.parse(r.questions_json) : [];
  const text = (Array.isArray(qs) ? qs : qs.questions ?? []).find((q: { id: string }) => q.id === r.question_id)?.text as string | undefined;
  const v = verifyLesson(parsed.data, { problemText: text });
  const lesson = JSON.stringify(v.lesson);
  if (lesson === r.lesson_json) continue;
  if (!ModelLessonSchema.safeParse(v.lesson).success) continue;
  changed++;
  console.log(`${r.scan_id}/${r.question_id}: ${v.verification.status}`);
  if (dry) continue;
  const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
  execFileSync("sqlite3", [db, `UPDATE solutions SET lesson_json = ${q(lesson)}, verification_json = ${q(JSON.stringify(v.verification))} WHERE id = ${q(r.id)}`], { maxBuffer: 1 << 28 });
}
console.log(`${changed} lesson(s) ${dry ? "would change" : "updated"}`);
