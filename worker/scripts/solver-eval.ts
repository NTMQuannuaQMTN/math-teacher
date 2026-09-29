/**
 * Solver evaluation over tools/solver-eval/cases.json, calling the pipeline directly.
 *   npx tsx scripts/solver-eval.ts [model] [effort] [concurrency] [caseFilter]
 * Writes tools/solver-eval/results/<timestamp>-<model>.json with full lessons for review.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { mathTextToPlain } from "../../shared/src/mathText";
import { VN_GRADE_9 } from "../src/solver/curriculum";
import { OpenAiJsonModel, type JsonModel } from "../src/solver/llm";
import { GeminiJsonModel } from "../src/solver/geminiModel";
import { solveProblem } from "../src/solver/pipeline";
import { looksLikeGeometry } from "../src/solver/routing";

interface Case { id: string; category: string; text: string; expect?: string[]; reject?: string[]; expectStatus?: string; figure?: boolean }

const root = new URL("../../tools/solver-eval/", import.meta.url);
const vars = Object.fromEntries(
  readFileSync(new URL("../.dev.vars", import.meta.url), "utf8").split("\n").filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
// Usage: solver-eval.ts <model> <effort> [concurrency] [caseFilter] [fallbackModel] [fallbackEffort]
const [model = "gpt-5.4-mini", effort = "low", conc = "5", filter = "", fallbackModel = "", fallbackEffort = "medium"] = process.argv.slice(2);
const cases: Case[] = JSON.parse(readFileSync(new URL("cases.json", root), "utf8")).filter((c: Case) => c.id.includes(filter));
// "gemini-*" models use the Gemini API (effort = thinking level); others use OpenAI.
const make = (name: string, level: string): JsonModel =>
  name.startsWith("gemini") ? new GeminiJsonModel(vars.GEMINI_API_KEY!, name, level) : new OpenAiJsonModel(vars.OPENAI_API_KEY!, name, level);
const llm = make(model, effort);
const fallback = fallbackModel ? make(fallbackModel, fallbackEffort) : undefined;

const norm = (s: string) => s.normalize("NFC").replace(/[−–]/g, "-").replace(/\s+/g, "");
async function run(c: Case) {
  const started = Date.now();
  try {
    // Same routing as the Worker: geometry goes straight to the fallback model.
    const route = fallback && looksLikeGeometry(c.text) ? { primary: fallback, fb: undefined } : { primary: llm, fb: fallback };
    const r = await solveProblem(route.primary, VN_GRADE_9, c.text, { signal: AbortSignal.timeout(240_000), fallback: route.fb });
    const l = r.lesson;
    const answer = norm(`${mathTextToPlain(l.finalAnswer.text)} ${l.finalAnswer.math ? mathTextToPlain(`$${l.finalAnswer.math}$`) : ""}`);
    const everything = JSON.stringify(l);
    const problems: string[] = [];
    if (c.expectStatus) {
      if (l.analysis.status !== c.expectStatus) problems.push(`status ${l.analysis.status}, expected ${c.expectStatus}`);
    } else {
      if (l.analysis.status !== "solvable") problems.push(`status ${l.analysis.status}`);
      for (const e of c.expect ?? []) if (!e.split("|").some((alt) => answer.includes(norm(alt)))) problems.push(`answer lacks "${e}"`);
      if (r.verification.status === "unverified") problems.push("unverified");
      if (c.figure && !l.figure) problems.push(`no figure${r.verification.figureIssue ? " (dropped: invalid)" : ""}`);
      if (l.hints.length < 2 || l.hints.length > 6) problems.push(`${l.hints.length} hints`);
    }
    for (const bad of c.reject ?? []) if (everything.includes(bad)) problems.push(`contains "${bad}"`);
    return { id: c.id, category: c.category, ok: problems.length === 0, problems, verification: r.verification.status, attempts: r.attempts, cost: r.costUsd, producedBy: r.model, seconds: (Date.now() - started) / 1000, hints: l.hints.length, steps: l.steps.length, figure: l.figure ? l.figure.scale : null, answer, lesson: l, checks: r.verification.checks };
  } catch (err) {
    return { id: c.id, category: c.category, ok: false, problems: [`error: ${(err as Error).message}`], seconds: (Date.now() - started) / 1000 };
  }
}

const results: Awaited<ReturnType<typeof run>>[] = [];
const queue = [...cases];
await Promise.all(Array.from({ length: Number(conc) }, async () => {
  for (let c = queue.shift(); c; c = queue.shift()) {
    // PACE_MS spaces out problems to stay under free-tier per-minute limits.
    if (process.env.PACE_MS) await new Promise((r) => setTimeout(r, Number(process.env.PACE_MS)));
    const r = await run(c);
    results.push(r);
    console.log(`${r.ok ? "PASS" : "FAIL"} ${r.id.padEnd(22)} ${String(r.seconds.toFixed(0)).padStart(4)}s ${"verification" in r ? `${r.verification}/${r.attempts}try $${r.cost.toFixed(3)} by:${r.producedBy} h${r.hints} s${r.steps} fig:${r.figure}` : ""} ${r.problems.join("; ")}`);
  }
}));
const passed = results.filter((r) => r.ok).length;
const secs = results.map((r) => r.seconds).sort((a, b) => a - b);
const totalCost = results.reduce((sum, r) => sum + ("cost" in r ? r.cost : 0), 0);
const escalated = results.filter((r) => "producedBy" in r && r.producedBy !== model).length;
console.log(`\n${passed}/${results.length} passed · median ${secs[Math.floor(secs.length / 2)]?.toFixed(0)}s · max ${secs.at(-1)?.toFixed(0)}s · ${model}/${effort}${fallback ? ` → ${fallbackModel}/${fallbackEffort}` : ""}`);
console.log(`cost ≈ $${totalCost.toFixed(3)} total, $${(totalCost / results.length).toFixed(4)} per problem · escalated ${escalated}/${results.length}`);
mkdirSync(new URL("results/", root), { recursive: true });
const out = new URL(`results/${new Date().toISOString().replace(/[:.]/g, "-")}-${model}-${effort}${fallback ? `-fb-${fallbackModel}` : ""}.json`, root);
writeFileSync(out, JSON.stringify({ model, effort, passed, total: results.length, results: results.sort((a, b) => a.id.localeCompare(b.id)) }, null, 2));
console.log(`Saved ${out.pathname}`);
