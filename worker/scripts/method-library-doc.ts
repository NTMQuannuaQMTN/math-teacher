/**
 * Prints the method library (shared/src/proof/methods.ts) as the Markdown tables of docs/GEOMETRY_METHOD_LIBRARY.md.
 *
 *   npx tsx scripts/method-library-doc.ts
 */
import { METHODS } from "../../shared/src/proof/methods";

const cats = [...new Set(METHODS.map((m) => m.category))];
for (const c of cats) {
  console.log(`\n### ${c}\n`);
  console.log("| id | name (vi) | grade | difficulty | allowed | used by the search | needs → produces | prerequisites |");
  console.log("|---|---|---|---|---|---|---|---|");
  for (const m of METHODS.filter((x) => x.category === c)) {
    const allowed = m.allowed ? (m.advanced ? "advanced" : "yes") : "**no**";
    console.log(`| \`${m.id}\` | ${m.vi} | ${m.grade} | ${m.difficulty} | ${allowed} | ${m.search ? "yes" : "—"} | ${m.needs.join(", ") || "—"} → ${m.produces.join(", ")} | ${m.prerequisites.replace(/\|/g, "\\|")} |`);
  }
}
console.log(`\n${METHODS.length} methods; ${METHODS.filter((m) => m.search).length} applied by the search; ${METHODS.filter((m) => !m.allowed).length} outside the curriculum.`);
