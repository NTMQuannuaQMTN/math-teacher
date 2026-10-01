/**
 * Generalisation probe for technique retrieval (deterministic; no model): hand-written problems that are NOT
 * from any exam — rephrasings, misleading surface similarity, distractors, invalid premises, missing assumptions.
 *   npx tsx scripts/retrieval-probes.ts
 */
import { readFileSync } from "node:fs";
import { selectTechniques } from "../src/solver/techniques";

const rows = readFileSync(new URL("../../data/generalization/retrieval_probes.jsonl", import.meta.url), "utf8").trim().split("\n").map((l) => JSON.parse(l));
const byKind: Record<string, [number, number]> = {};
let ok = 0;
for (const r of rows) {
  const got = selectTechniques(r.text).map((c) => c.id);
  const hit = r.expect.every((e: string) => got.includes(e)) && !r.not.some((n: string) => got.includes(n));
  ok += hit ? 1 : 0;
  const k = (byKind[r.kind] ??= [0, 0]);
  k[0] += hit ? 1 : 0;
  k[1] += 1;
  console.log(`${hit ? "OK  " : "MISS"} ${r.id.padEnd(15)} got [${got.join(", ")}] expected [${r.expect.join(", ")}]${r.not.length ? ` not [${r.not.join(", ")}]` : ""}`);
}
console.log(`${ok}/${rows.length} probes as expected`);
for (const [k, [a, b]] of Object.entries(byKind)) console.log(`  ${k}: ${a}/${b}`);
