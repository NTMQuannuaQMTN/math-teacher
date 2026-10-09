/**
 * The compute-first oracle (shared/src/oracle.ts) on every non-geometry dataset problem — no model call.
 *
 *   npx tsx scripts/oracle-eval.ts [--id=substr] [-v]
 */
import { readFileSync } from "node:fs";
import { computeAnswers } from "../../shared/src/oracle";
import { normalizeProblemText } from "../../shared/src/mathText";

const only = process.argv.find((a) => a.startsWith("--id="))?.slice(5);
const verbose = process.argv.includes("-v");
let handled = 0, total = 0;
for (const f of ["chuyen.jsonl", "problems.jsonl"])
  for (const line of readFileSync(new URL(`../../tools/benchmark/dataset/${f}`, import.meta.url), "utf8").trim().split("\n")) {
    const d = JSON.parse(line);
    if (d.topic === "geometry" || (only && !d.id.includes(only))) continue;
    total++;
    const rs = computeAnswers(normalizeProblemText(d.problem_text));
    if (rs.length) handled++;
    console.log(`${rs.length ? "found   " : "—       "} ${d.id.padEnd(24)} truth: ${String(d.ground_truth_answer).slice(0, 60)}`);
    for (const { part, result: r } of rs) {
      console.log(`         ${part ? part + ") " : ""}${r.formal.kind} [${r.formal.vars}] ${r.ms} ms: ${r.summary.slice(0, 240)}`);
      if (verbose) console.log(`         read: ${r.formal.readAs}`);
    }
  }
console.log(`handled ${handled}/${total}`);
