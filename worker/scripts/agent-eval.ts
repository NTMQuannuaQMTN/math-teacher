/**
 * Trial of the SOCLAAS tool-using agent (2026-10-16): each question solved through the real pipeline (certified modules,
 * agent, checks, safety net) with a hard 120 s limit. Writes tools/train-8h/results/agent-eval/<id>.json.
 *   npx tsx scripts/agent-eval.ts [id,id,…]
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { servable } from "../../shared/src/servePolicy";
import { SoclaasAgentModel } from "../src/solver/agent";
import { VN_GRADE_9 } from "../src/solver/curriculum";
import { solveProblem } from "../src/solver/pipeline";
import { looksLikeGeometry } from "../src/solver/routing";
import { normalizeProblemText } from "../../shared/src/mathText";
import { estimateCost } from "../src/solver/pricing";

const root = new URL("../../", import.meta.url).pathname;
const vars = Object.fromEntries(readFileSync(`${root}worker/.dev.vars`, "utf8").split("\n").filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
const LIMIT = 120_000;
const all = ["algebra", "geometry", "number_theory", "combinatorics", "final", "final2"].flatMap((t) => readFileSync(`${root}data/train-8h/${t}.jsonl`, "utf8").trim().split("\n").map((l) => ({ ...JSON.parse(l), type: t })));
const only = process.argv[2]?.split(",");
const rows = only ? only.map((id) => all.find((r) => r.id === id && (r.type !== "final" || id.startsWith("fin-")))!).filter(Boolean) : [];
const out = `${root}tools/train-8h/results/agent-eval/`;
mkdirSync(out, { recursive: true });

async function run(r: { id: string; input: string; reference: string }) {
  const t0 = Date.now(), logs: string[] = [];
  const model = new SoclaasAgentModel(vars.SOCLAAS_BASE_URL!, vars.SOCLAAS_API_KEY!, vars.SOCLAAS_MODEL || "default", { problemText: normalizeProblemText(r.input), withFigure: looksLikeGeometry(r.input), deadline: t0 + LIMIT - 4_000, log: (m) => logs.push(m) });
  let entry: Record<string, unknown>;
  try {
    const res = await solveProblem(model, VN_GRADE_9, r.input, { signal: AbortSignal.timeout(LIMIT), retryBudgetMs: LIMIT, certified: false, log: (m) => logs.push(m) });
    const cost = Object.entries(res.usage).reduce((s, [n, u]) => s + (estimateCost(n, u) ?? estimateCost("qwen3.6:35b", u) ?? 0), 0);
    entry = { id: r.id, ok: true, served: servable(res.verification), producedBy: res.model, status: res.verification.status, seconds: Math.round((Date.now() - t0) / 1000), costUsd: +cost.toFixed(4), final: res.lesson.finalAnswer.text, hints: res.lesson.hints.map((h) => h.question), reference: r.reference, lesson: res.lesson, failed: res.verification.checks.filter((c) => !c.passed).map((c) => c.label), logs };
  } catch (err) {
    entry = { id: r.id, ok: false, seconds: Math.round((Date.now() - t0) / 1000), error: (err as Error).message.slice(0, 200), reference: r.reference, logs };
  }
  writeFileSync(`${out}${r.id.replace(/[^A-Za-z0-9._-]/g, "_")}.json`, JSON.stringify(entry, null, 2));
  console.log(`${r.id.padEnd(24)} ${entry.ok ? `${entry.producedBy} ${entry.status}${entry.served === false ? " (withheld)" : ""}` : `FAILED ${entry.error}`} ${entry.seconds}s $${entry.costUsd ?? 0}`);
}

// Four at a time: each question has its own 120 s limit.
for (let i = 0; i < rows.length; i += 4) await Promise.all(rows.slice(i, i + 4).map(run));
process.exit(0);
