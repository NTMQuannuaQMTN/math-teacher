/**
 * Re-runs the current verifier on stored lessons in the local D1 (no model call) and prints SQL
 * updates for the rows whose lesson or verification changed. Pipe the output into sqlite3.
 *   npx tsx scripts/reverify-stored.ts <d1.sqlite> | sqlite3 <d1.sqlite>
 */
import { execFileSync } from "node:child_process";
import { verifyLesson } from "../../shared/src/verify";

const db = process.argv[2]!;
const rows = JSON.parse(execFileSync("sqlite3", ["-json", db, "select id, lesson_json, verification_json from solutions where lesson_json is not null"], { encoding: "utf8" }) || "[]") as {
  id: string;
  lesson_json: string;
  verification_json: string | null;
}[];
const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
for (const row of rows) {
  const { lesson, verification } = verifyLesson(JSON.parse(row.lesson_json));
  const before = row.verification_json ? JSON.parse(row.verification_json).status : null;
  if (lesson.analysis.status === JSON.parse(row.lesson_json).analysis.status && verification.status === before) continue;
  console.error(`${row.id}: ${JSON.parse(row.lesson_json).analysis.status}/${before} → ${lesson.analysis.status}/${verification.status}`);
  console.log(`update solutions set lesson_json = ${q(JSON.stringify(lesson))}, verification_json = ${q(JSON.stringify(verification))} where id = ${q(row.id)};`);
}
