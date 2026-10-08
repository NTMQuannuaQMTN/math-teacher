/**
 * Builds every geometry problem's figure from its statement alone (figureFromText.ts) and checks it:
 * named points that couldn't be built, givens that fail, and the "chứng minh" claims measured on the figure.
 *
 *   npx tsx scripts/statement-figures.ts [--verbose]
 */
import { readFileSync } from "node:fs";
import { checkClaims, statementGivens, statementParts } from "../../shared/src/claims";
import { figureFromStatement } from "../../shared/src/figureFromText";
import { evaluateFigureCheck } from "../../shared/src/geometry";

const verbose = process.argv.includes("--verbose");
const seen = new Set<string>();
const items: { id: string; text: string }[] = [];
for (const f of ["chuyen.jsonl", "problems.jsonl"]) {
  for (const line of readFileSync(new URL(`../../tools/benchmark/dataset/${f}`, import.meta.url), "utf8").trim().split("\n")) {
    const d = JSON.parse(line) as { id: string; topic: string; problem_text: string };
    if (d.topic !== "geometry" || !/tam giác|đường tròn|tứ giác|hình (vuông|chữ nhật|bình hành|thoi)/.test(d.problem_text)) continue;
    // Every sub-question: parts share an opening but each has its own claims (PTNK 2023 5b's "∠BAD = ∠CAH" caught a
    // wrong tangent point that 5a, with no measurable claim, could not).
    if (seen.has(d.id)) continue;
    seen.add(d.id);
    items.push({ id: d.id, text: d.problem_text });
  }
}
// The user's Câu 4 (incircle) is in the dataset as ch-4; the PTNK 2025 Bài 4 full statement includes part c.
let built = 0, complete = 0, claimsTrue = 0, claimsFalse = 0, givensFailed = 0;
for (const { id, text } of items) {
  const r = figureFromStatement(text);
  if (!r) { console.log(`✗ ${id}: no base shape recognised`); continue; }
  built++;
  const pointIds = new Set(r.figure.points.map((p) => p.id));
  const givens = statementGivens(text, pointIds).map((g) => ({ g, res: evaluateFigureCheck(g, r.resolved) }));
  const failedGivens = givens.filter((x) => !x.res.passed);
  givensFailed += failedGivens.length;
  const claims = statementParts(text)
    .filter((p) => /chứng minh|prove/i.test(p.text))
    .flatMap((p) => checkClaims([p.text.replace(/^.*?(chứng minh|prove)/is, "")], r.resolved, { exact: true }));
  const t = claims.filter((c) => c.passed).length;
  claimsTrue += t;
  claimsFalse += claims.length - t;
  if (r.unbuilt.length === 0) complete++;
  const errors = r.resolved.errors.length ? ` errors[${r.resolved.errors.join("; ")}]` : "";
  console.log(
    `${r.unbuilt.length === 0 && failedGivens.length === 0 && claims.every((c) => c.passed) ? "✓" : "·"} ${id}: ${r.figure.points.filter((p) => !p.hidden).length} points` +
      `${r.unbuilt.length ? `, NOT BUILT [${r.unbuilt.join(",")}]` : ""}` +
      `${failedGivens.length ? `, givens failing [${failedGivens.map((x) => `${x.g.kind}(${x.g.refs.join(",")})`).join("; ")}]` : ""}` +
      `, claims ${t}/${claims.length} true${claims.some((c) => !c.passed) ? ` (false: ${claims.filter((c) => !c.passed).map((c) => c.label).join("; ")})` : ""}${errors}`,
  );
  if (verbose) console.log("   ", r.figure.points.map((p) => `${p.id}=${p.kind}(${p.refs.join(",")}${p.value !== null ? `;${p.value}` : ""})`).join(" "));
}
console.log(`\n${items.length} geometry problems (all sub-questions): base built ${built}, all named points built ${complete}, givens failing ${givensFailed}, claims true ${claimsTrue}, false ${claimsFalse}`);
