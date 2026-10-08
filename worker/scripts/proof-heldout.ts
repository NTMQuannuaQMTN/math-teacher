/**
 * The proof planner on the held-out grade-9 set (tools/solver-eval/geometry-heldout.json). No model call.
 *
 *   npx tsx scripts/proof-heldout.ts [-v]
 */
import { readFileSync } from "node:fs";
import { normalizeProblemText } from "../../shared/src/mathText";
import { planReadability } from "../../shared/src/proof/explain";
import { factText } from "../../shared/src/proof/facts";
import { planProof } from "../../shared/src/proof/planner";

const verbose = process.argv.includes("-v");
const set = JSON.parse(readFileSync(new URL("../../tools/solver-eval/geometry-heldout.json", import.meta.url), "utf8")) as { problems: { id: string; text: string }[] };
const counts: Record<string, number> = {};
let goals = 0, proved = 0;
for (const p of set.problems) {
  const plan = planProof(normalizeProblemText(p.text));
  const rd = planReadability(plan);
  counts[plan.status] = (counts[plan.status] ?? 0) + 1;
  goals += plan.goals.length;
  proved += plan.goals.filter((g) => g.proved).length;
  console.log(`${plan.status.padEnd(24)} ${p.id}: ${plan.reason}${plan.goals.some((g) => g.proved) ? ` {${rd.readable ? "readable" : "NOT readable"}, ${rd.steps} steps}` : ""} [${plan.stats.elapsedMs} ms]`);
  for (const g of plan.goals) {
    console.log(`   ${g.proved ? "✓" : "✗"} ${g.label}`);
    if (verbose && g.proved) for (const s of g.proof) console.log(`      #${s.id} ${factText(s.fact)} ⟸ ${s.method}(${s.premises.join(",")})`);
  }
  if (verbose) for (const l of plan.log.filter((x) => x.includes("rejected"))) console.log("   · " + l);
}
console.log(counts, `goals proved ${proved}/${goals}`);
