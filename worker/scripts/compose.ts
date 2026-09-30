/**
 * Offline hybrid evaluation: "primary model first; if the verifier does not mark its lesson
 * verified, use the fallback system's lesson". Built purely from saved benchmark results, so a
 * routing policy can be evaluated with zero model calls. The routing decision uses only what the
 * production pipeline knows at run time (the verification status), never the ground truth.
 *
 *   npx tsx scripts/compose.ts <primary-results.json> <fallback-results.json> [--accept verified|verified,partial]
 */
import { readFileSync } from "node:fs";

type Row = { id: string; grade: string; status: string | null; answerCorrect: boolean | null; error?: string; modelSeconds: number };
const [primaryFile, fallbackFile] = process.argv.slice(2);
const acceptIdx = process.argv.indexOf("--accept");
const accept = new Set((acceptIdx > 0 ? process.argv[acceptIdx + 1]! : "verified").split(","));
const load = (f: string) => new Map((JSON.parse(readFileSync(f, "utf8")).rows as Row[]).map((r) => [r.id, r]));
const primary = load(primaryFile!);
const fallback = load(fallbackFile!);

const out: { id: string; used: string; grade: string }[] = [];
for (const [id, p] of primary) {
  const f = fallback.get(id);
  const keep = !p.error && p.status !== null && accept.has(p.status);
  if (keep || !f) out.push({ id, used: keep ? "primary" : "primary (no fallback result)", grade: p.grade });
  else out.push({ id, used: "fallback", grade: f.grade });
}
const count = (g: string) => out.filter((o) => o.grade === g).length;
const fallbackRate = out.filter((o) => o.used === "fallback").length / out.length;
for (const o of out) console.log(`${o.grade.padEnd(8)} ${o.id.padEnd(9)} ${o.used}`);
console.log(JSON.stringify({ n: out.length, pass: count("PASS"), partial: count("PARTIAL"), fail: count("FAIL"), critical: count("CRITICAL"), fallbackRate, accept: [...accept] }));
