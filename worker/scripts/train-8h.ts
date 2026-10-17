/**
 * 8-hour specialist training run: answers a question set with the production solver and records everything needed
 * for the review file.
 *
 *   npx tsx scripts/train-8h.ts <algebra|geometry|number_theory|combinatorics> <round> <train|heldout|all> [id,id,…]
 *
 * Models: deterministic solvers first (as in production), then SOCLAAS "default" (qwen3.6:35b, approved by the user
 * with a cap) with the production SOCLAAS options; the free OpenRouter model once the cap is reached. A ledger in
 * tools/train-8h/spend.json enforces the cap across runs ($2 for the whole 8 hours); every request goes through the
 * response cache, so an identical request is never paid twice.
 * Output: tools/train-8h/results/<type>-r<round>-<split>.json (+ full lessons).
 */
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { VN_GRADE_9 } from "../src/solver/curriculum";
import type { JsonModel } from "../src/solver/llm";
import { LocalJsonModel } from "../src/solver/localModel";
import { solveProblem } from "../src/solver/pipeline";
import { estimateCost } from "../src/solver/pricing";
import { hostedModelOptions, looksLikeGeometry, soclaasDirectOptions, soclaasModelOptions, soclaasNeedsThinking, soclaasOutlineOptions } from "../src/solver/routing";
import { OcrFailure } from "../src/ocr/provider";
import { CachedModel } from "./lib/modelCache";
import { servable } from "../../shared/src/servePolicy";

const [type = "algebra", round = "1", split = "train", only] = process.argv.slice(2);
const root = new URL("../../", import.meta.url).pathname;
const CAP_USD = 2;
// One ledger per local day: the user approved SOCLAAS with a cap of $2 per day (2026-10-14: $1.74 in spend.json).
const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Singapore" });
const ledgerPath = today === "2026-10-14" ? `${root}tools/train-8h/spend.json` : `${root}tools/train-8h/spend-${today}.json`;
mkdirSync(`${root}tools/train-8h/results/lessons`, { recursive: true });
// One run at a time: overlapping runs overwrite each other's results and race on the spend ledger (happened twice).
const lockPath = `${root}tools/train-8h/run.lock`;
if (existsSync(lockPath)) {
  const pid = Number(readFileSync(lockPath, "utf8"));
  let alive = false;
  try { process.kill(pid, 0); alive = true; } catch { alive = false; }
  if (alive) { console.error(`another training run is active (pid ${pid}); not starting`); process.exit(1); }
}
writeFileSync(lockPath, String(process.pid));
process.on("exit", () => { try { if (readFileSync(lockPath, "utf8") === String(process.pid)) unlinkSync(lockPath); } catch { /* already gone */ } });
const ledger: { spentUsd: number; calls: number } = existsSync(ledgerPath) ? JSON.parse(readFileSync(ledgerPath, "utf8")) : { spentUsd: 0, calls: 0 };
const saveLedger = () => writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2));

const vars = Object.fromEntries(readFileSync(`${root}worker/.dev.vars`, "utf8").split("\n").filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));

/** Stops paid calls once the ledger reaches the cap; records the estimated cost of every paid call. */
class Capped implements JsonModel {
  readonly name: string;
  readonly model: string;
  constructor(private readonly inner: JsonModel) { this.name = inner.name; this.model = inner.model; }
  async complete(req: Parameters<JsonModel["complete"]>[0]): Promise<string> {
    if (ledger.spentUsd >= CAP_USD) throw new OcrFailure("quota_exhausted", `training cap $${CAP_USD} reached`, false);
    return this.inner.complete({ ...req, onUsage: (u) => { const c = estimateCost(this.inner.model, u) ?? 0; ledger.spentUsd += c; ledger.calls++; saveLedger(); req.onUsage?.(u); } });
  }
}

function models(text: string): { model: JsonModel; fallback: JsonModel; outlineModel?: JsonModel } {
  const o = soclaasNeedsThinking(text) ? { ...soclaasModelOptions(text), gatewayThinking: false, maxTokens: 20_000 } : soclaasModelOptions(text);
  const paidInner = new LocalJsonModel(vars.SOCLAAS_BASE_URL!, vars.SOCLAAS_MODEL || "default", { apiKey: vars.SOCLAAS_API_KEY, thinking: false, ...o });
  // Cache outside the cap: a cache hit costs nothing and is not charged to the ledger.
  const paid = new CachedModel(new Capped(paidInner), JSON.stringify(o), false);
  const fo = hostedModelOptions(text, { simpleEffort: "minimal", effort: "minimal", complexMaxTokens: 6_000, complexRequestTimeoutMs: 240_000 });
  const free = new CachedModel(new LocalJsonModel("https://openrouter.ai/api", "nvidia/nemotron-3-super-120b-a12b:free", { apiKey: vars.LOCAL_LLM_API_KEY, thinking: false, ...fo }), JSON.stringify(fo), false);
  // Retry after a failed paid request: the same model without hidden thinking (fits the gateway's 120 s), not the weaker free model.
  const d = soclaasDirectOptions(text);
  const direct = new CachedModel(new Capped(new LocalJsonModel(vars.SOCLAAS_BASE_URL!, vars.SOCLAAS_MODEL || "default", { apiKey: vars.SOCLAAS_API_KEY, thinking: false, ...d })), JSON.stringify(d), false);
  // Geometry needing an argument: think in a short outline request, then write the lesson without thinking (two stages,
  // each inside the gateway's 120 s).
  const oo = soclaasOutlineOptions(text);
  // Two stages for every SOCLAAS problem that needs an argument, as in routes/solve.ts (a thinking lesson request ran past 115 s).
  const outlineModel = soclaasNeedsThinking(text)
    ? new CachedModel(new Capped(new LocalJsonModel(vars.SOCLAAS_BASE_URL!, vars.SOCLAAS_MODEL || "default", { apiKey: vars.SOCLAAS_API_KEY, thinking: false, ...oo })), JSON.stringify(oo), false)
    : undefined;
  return ledger.spentUsd >= CAP_USD ? { model: free, fallback: free } : { model: paid, fallback: direct, outlineModel };
}

const rows = readFileSync(`${root}data/train-8h/${type}.jsonl`, "utf8").trim().split("\n").map((l) => JSON.parse(l))
  .filter((r) => (split === "all" || r.split === split) && (!only || only.split(",").includes(r.id)));
const results = [];
/** A network outage (2026-10-15 11:35: every request "fetch failed" in 0 s) must not be recorded as the model's result. */
async function waitForNetwork(): Promise<void> {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`${vars.SOCLAAS_BASE_URL!.replace(/\/$/, "").replace(/\/v1$/, "")}/v1/models`, { headers: { Authorization: `Bearer ${vars.SOCLAAS_API_KEY}` }, signal: AbortSignal.timeout(10_000) });
      if (res.status < 500) return;
    } catch { /* still down */ }
    console.log(`network/gateway unreachable; waiting (${i + 1})`);
    await new Promise((ok) => setTimeout(ok, 30_000));
  }
}
const networkFailure = (e: Record<string, unknown>) => !e.ok && /network error|fetch failed|ECONN|ENOTFOUND|ETIMEDOUT/i.test(`${e.message} ${(e.logs as string[] | undefined)?.join(" ")}`);
for (const r of rows) for (let tries = 0; tries < 3; tries++) {
  await waitForNetwork();
  const { model, fallback, outlineModel } = models(r.input);
  const logs: string[] = [];
  const t0 = Date.now();
  const spentBefore = ledger.spentUsd;
  let entry: Record<string, unknown>;
  try {
    // Hard wall-clock guard: a stalled stream can starve the event loop past the signal (round 1: 681 s on a 300 s budget).
    const res = await Promise.race([
      solveProblem(model, VN_GRADE_9, r.input, {
        fallback, outlineModel, fallbackOnlyOnFailure: true, escalateOnGiveUp: false, signal: AbortSignal.timeout(300_000), retryBudgetMs: 180_000, log: (m) => { logs.push(m); if (process.env.TRAIN_VERBOSE) console.error(`  · ${m.slice(0, 300)}`); },
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new OcrFailure("timeout", "wall-clock guard (330 s)", true)), 330_000)),
    ]);
    entry = { id: r.id, ok: true, served: servable(res.verification), producedBy: res.model, status: res.verification.status, attempts: res.attempts, ms: Date.now() - t0, finalAnswer: res.lesson.finalAnswer.text };
    writeFileSync(`${root}tools/train-8h/results/lessons/${type}-r${round}-${r.id.replace(/[^A-Za-z0-9._-]/g, "_")}.json`, JSON.stringify({ question: r, ...res, logs }, null, 2));
  } catch (err) {
    entry = { id: r.id, ok: false, error: err instanceof OcrFailure ? err.kind : (err as Error).name, message: (err as Error).message.slice(0, 240), ms: Date.now() - t0, logs: logs.slice(-6) };
  }
  entry.costUsd = +(ledger.spentUsd - spentBefore).toFixed(4);
  if (networkFailure(entry) && tries < 2) { console.log(`${String(r.id).padEnd(26)} network failure; retrying after the network is back`); continue; }
  results.push(entry);
  console.log(`${String(r.id).padEnd(26)} ${entry.ok ? `${entry.producedBy} ${entry.status}` : `FAILED ${entry.error}`} ${Math.round((entry.ms as number) / 1000)}s $${entry.costUsd} (total $${ledger.spentUsd.toFixed(3)})`);
  break;
}
const file = `${root}tools/train-8h/results/${type}-r${round}-${split}.json`;
writeFileSync(file, JSON.stringify({ type, round, split, createdAt: new Date().toISOString(), spentTotalUsd: ledger.spentUsd, results }, null, 2));
console.log(`wrote ${file}`);
// Abandoned streams and the wall-clock guard timer would keep Node alive (a chained next run then never starts).
process.exit(0);
