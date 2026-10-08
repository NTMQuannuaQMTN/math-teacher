import { readFileSync } from "node:fs";
import { planProof } from "../../shared/src/proof/planner";
import { planReadability } from "../../shared/src/proof/explain";
import { factText } from "../../shared/src/proof/facts";
const verbose = process.argv.includes("-v");
const only = process.argv.find((a) => a.startsWith("--id="))?.slice(5);
const seen = new Set<string>();
const counts: Record<string, number> = {};
for (const f of ["chuyen.jsonl", "problems.jsonl"]) {
  for (const line of readFileSync(new URL(`../../tools/benchmark/dataset/${f}`, import.meta.url), "utf8").trim().split("\n")) {
    const d = JSON.parse(line);
    if (d.topic !== "geometry" || seen.has(d.id)) continue;
    if (only && !d.id.includes(only)) continue;
    seen.add(d.id);
    const p = planProof(d.problem_text);
    counts[p.status] = (counts[p.status] ?? 0) + 1;
    const rd = planReadability(p);
    console.log(`${p.status.padEnd(24)} ${d.id}: ${p.reason} {${rd.readable ? "readable" : "NOT readable"}: ${rd.steps} steps, max ${rd.maxCited} cited} [${p.stats.givens} givens, ${p.stats.facts} facts, ${p.stats.elapsedMs} ms]`);
    if (verbose) for (const l of p.log) console.log("   · " + l);
    if (verbose && p.unparsed.length) console.log("   unparsed: " + p.unparsed.join(" | "));
    for (const g of p.goals) {
      console.log(`   ${g.proved ? "✓" : "✗"} ${g.label}${g.verification ? ` [verifier: ${g.verification.ok ? "ok" : "REJECTED"}, ${g.proof.length} steps, ${g.verification.perturbations} perturbed figures${g.verification.steps.some((x) => x.configuration.length) ? ", uses configuration" : ""}]` : ""}`);
      if (verbose && g.proved) for (const s of g.proof) console.log(`      #${s.id} ${factText(s.fact)}  ⟸ ${s.method}(${s.premises.join(",")})${s.note ? " — " + s.note : ""}`);
    }
  }
}
console.log(counts);
