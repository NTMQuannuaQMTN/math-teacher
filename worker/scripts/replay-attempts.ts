/**
 * Replays recorded model outputs (one JSON file of {id, problem_text, attempts:[{text}]}) through the
 * CURRENT pipeline with a scripted model: measures which retries the current verifier and retry policy
 * would request on the same outputs. No model call. (The time budget is not exercised: replay is instant.)
 *   npx tsx scripts/replay-attempts.ts <attempts.json>
 */
import { readFileSync } from "node:fs";
import { gradeLevelReport } from "../../shared/src/gradeLevel";
import { VN_GRADE_9 } from "../src/solver/curriculum";
import type { JsonModel } from "../src/solver/llm";
import { solveProblem } from "../src/solver/pipeline";

const rows = JSON.parse(readFileSync(process.argv[2]!, "utf8")) as { id: string; problem_text: string; attempts: { text: string }[] }[];
let before = 0;
let after = 0;
for (const row of rows) {
  if (row.attempts.length === 0) {
    console.log(`${row.id.padEnd(6)} no recorded output (truncated in the original run)`);
    continue;
  }
  let calls = 0;
  const log: string[] = [];
  const model: JsonModel = {
    name: "local",
    model: "replay",
    async complete() {
      const a = row.attempts[Math.min(calls, row.attempts.length - 1)]!;
      calls++;
      return a.text;
    },
  };
  const r = await solveProblem(model, VN_GRADE_9, row.problem_text, { signal: AbortSignal.timeout(60_000), log: (m) => log.push(m) });
  before += row.attempts.length;
  after += calls;
  const gl = gradeLevelReport(r.lesson);
  const reason = log.filter((l) => /attempt 1: /.test(l)).map((l) => l.replace(/^attempt 1: /, "").slice(0, 150));
  console.log(`${row.id.padEnd(6)} attempts ${row.attempts.length} → ${calls}  ${r.verification.status.padEnd(13)} ${gl.forbidden.length ? `FORBIDDEN:${gl.forbidden.join("/")}` : ""} ${reason.join(" | ")}`);
}
console.log(`model calls on recorded outputs: before ${before}, now ${after}`);
