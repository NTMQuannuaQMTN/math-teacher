/**
 * Benchmark runner: solves dataset items with one system and grades them deterministically.
 *
 *   npx tsx scripts/benchmark.ts <system> [--split validation|test|train|all] [--ids a,b] [--offline] [--exp EXP-00x]
 *
 * Systems
 *   qwen3-{4b,8b,14b}[-think]   local open model behind an OpenAI-compatible server (LOCAL_LLM_URL,
 *                               default http://127.0.0.1:8080 — llama.cpp llama-server). $0 API cost.
 *   stored-gemini               re-grades Gemini lessons saved by earlier solver-eval runs (no API call).
 *
 * Every model response goes through the response cache (tools/benchmark/cache): re-running an
 * experiment costs nothing; --offline guarantees no model call at all.
 * The test split must be asked for explicitly and is logged as a TEST RUN.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { Agent, setGlobalDispatcher } from "undici";
import type { ModelLesson, Verification } from "../../shared/src/solution";
import { verifyLesson } from "../../shared/src/verify";
import { VN_GRADE_9 } from "../src/solver/curriculum";
import { LocalJsonModel } from "../src/solver/localModel";
import { solveProblem } from "../src/solver/pipeline";
import { hostedModelOptions, soclaasModelOptions } from "../src/solver/routing";
import { PROMPT_VERSION } from "../src/solver/prompts";
import { grade, answerText, type BenchItem, type Grade } from "./lib/grade";
import { CachedModel, OfflineMiss, SPEND } from "./lib/modelCache";

const ROOT = new URL("../../tools/benchmark/", import.meta.url).pathname;
// Node's fetch aborts if response headers take > 300 s; a local model writing a long proof can take
// longer (production Workers have no such limit). The per-problem AbortSignal still bounds each solve.
setGlobalDispatcher(new Agent({ headersTimeout: 0, bodyTimeout: 0 }));
const args = process.argv.slice(2);
const system = args[0] ?? "";
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const split = flag("split") ?? "validation";
const ids = flag("ids")?.split(",");
const offline = args.includes("--offline");
const exp = flag("exp") ?? "EXP-adhoc";
// --techniques: add retrieved method cards to the request (worker/src/solver/techniques.ts)
const withTechniques = args.includes("--techniques");

// Hosted open models (OpenAI-compatible); the key comes from worker/.dev.vars (LOCAL_LLM_API_KEY), never printed.
type Effort = "none" | "minimal" | "low";
const NEMOTRON = "nvidia/nemotron-3-super-120b-a12b:free";
// keyVar: the .dev.vars variable holding the key; prod: per-problem settings exactly as the app (hostedModelOptions).
const SOCLAAS = "https://soclaas-api.comp.nus.edu.sg/v1";
const HOSTED: Record<string, { url: string; model: string; effort?: Effort; keyVar?: string; prod?: boolean }> = {
  "or-qwen3.8-27b": { url: "https://openrouter.ai/api", model: "qwen/qwen3.8-27b:free" },
  "or-nemotron-3-super": { url: "https://openrouter.ai/api", model: NEMOTRON },
  // Reasoning-effort variants (optimisation sprint): hidden reasoning dominates hosted latency.
  "or-nemotron-3-super-min": { url: "https://openrouter.ai/api", model: NEMOTRON, effort: "minimal" },
  "or-nemotron-3-super-none": { url: "https://openrouter.ai/api", model: NEMOTRON, effort: "none" },
  "or-nemotron-3-super-prod": { url: "https://openrouter.ai/api", model: NEMOTRON, prod: true },
  // SOCLAAS (NUS, paid per token; prices in its /v1/models listing).
  "soclaas-qwen3.6-35b-prod": { url: SOCLAAS, model: "qwen3.6:35b", keyVar: "SOCLAAS_API_KEY", prod: true },
  "soclaas-qwen3.8-27b-prod": { url: SOCLAAS, model: "qwen3.8:27b", keyVar: "SOCLAAS_API_KEY", prod: true },
  "soclaas-gemma4-26b-prod": { url: SOCLAAS, model: "gemma4:26b", keyVar: "SOCLAAS_API_KEY", prod: true },
};
const devVar = (name: string) =>
  readFileSync(new URL("../.dev.vars", import.meta.url), "utf8").split("\n").find((l) => l.startsWith(`${name}=`))?.slice(name.length + 1).trim();

const LOCAL: Record<string, { file: string; thinking: boolean; presencePenalty?: number }> = {
  "qwen3-4b": { file: "qwen3-4b-q4_k_m", thinking: false },
  "qwen3-4b-think": { file: "qwen3-4b-q4_k_m", thinking: true },
  "qwen3-8b": { file: "qwen3-8b-q4_k_m", thinking: false },
  "qwen3-8b-think": { file: "qwen3-8b-q4_k_m", thinking: true },
  "qwen3.5-9b": { file: "qwen3.5-9b-q4_k_m", thinking: false },
  "qwen3.5-9b-think": { file: "qwen3.5-9b-q4_k_m", thinking: true },
  // Post-hoc variant (EXP-005 truncations): presence penalty 1.5 as recommended for quantized Qwen.
  "qwen3.5-9b-pp": { file: "qwen3.5-9b-q4_k_m", thinking: false, presencePenalty: 1.5 },
  "gemma-4-12b": { file: "gemma-4-12b-it-q4_k_m", thinking: false },
  "gemma-4-12b-think": { file: "gemma-4-12b-it-q4_k_m", thinking: true },
};
if (!LOCAL[system] && !HOSTED[system] && system !== "stored-gemini") {
  console.error(`unknown system "${system}". Known: ${[...Object.keys(LOCAL), ...Object.keys(HOSTED), "stored-gemini"].join(", ")}`);
  process.exit(2);
}

// --dataset chuyen → tools/benchmark/dataset/chuyen.jsonl (Toán chuyên exams, built by tools/exams/build_dataset.py)
const datasetName = flag("dataset") ?? "problems";
const items: BenchItem[] = readFileSync(`${ROOT}dataset/${datasetName}.jsonl`, "utf8")
  .trim()
  .split("\n")
  .map((l) => JSON.parse(l))
  .filter((i: BenchItem) => (ids ? ids.includes(i.id) : split === "all" || i.split === split));
if (split === "test" || items.some((i) => i.split === "test")) console.log("⚠ TEST RUN — the held-out test split is being evaluated.");

interface Row {
  id: string;
  topic: string;
  difficulty: number;
  format: string;
  grade: Grade;
  answerCorrect: boolean | null;
  status: Verification["status"] | null;
  attempts: number;
  inputTokens: number;
  outputTokens: number;
  modelSeconds: number;
  wallSeconds: number;
  figurePoints: number | null;
  failedChecks: string[];
  answer: string;
  /** The final lesson (for error analysis and fine-tuning export). */
  lesson: ModelLesson | null;
  /** Pipeline log: one line per attempt with the verifier feedback that triggered a retry. */
  log: string[];
  /** The machine slept during this item (macOS: performance.now() pauses in sleep, Date.now() doesn't); timings invalid. */
  slept: boolean;
  error?: string;
}

/** Stored Gemini lessons from solver-eval runs, newest first, keyed by dataset id. */
function storedGemini(): Map<string, { lesson: ModelLesson; model: string }> {
  const dir = new URL("../../tools/solver-eval/results/", import.meta.url).pathname;
  const alias: Record<string, string> = { "r2-common-root-vi": "ch-1", "r3-quadrilateral-vi": "ch-2", "r1-divisibility-vi": "ch-3", "r4-incircle-vi": "ch-4" };
  const out = new Map<string, { lesson: ModelLesson; model: string }>();
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".json")).sort().reverse()) {
    const run = JSON.parse(readFileSync(dir + f, "utf8")) as { results?: { id: string; lesson?: ModelLesson; producedBy?: string }[] };
    for (const r of run.results ?? []) {
      const id = alias[r.id] ?? r.id.split("-")[0]!;
      if (r.lesson && r.producedBy?.startsWith("gemini") && !out.has(id)) out.set(id, { lesson: r.lesson, model: r.producedBy });
    }
  }
  return out;
}

const rows: Row[] = [];
const stored = system === "stored-gemini" ? storedGemini() : null;
const local = LOCAL[system];
const hosted = HOSTED[system];
// "-prod": exactly what the app gets — per-problem effort and budget (hostedModelOptions) and the local server's
// solve time limit (SOLVE_TIMEOUT_MS in .dev.vars, 420 s).
const production = !!hosted?.prod;
const solveLimitMs = production ? Number(devVar("SOLVE_TIMEOUT_MS") ?? 170_000) : 40 * 60_000;
const modelFor = (problemText: string) => {
  if (!production) return cached!;
  const o = hosted!.keyVar === "SOCLAAS_API_KEY" ? soclaasModelOptions(problemText) : hostedModelOptions(problemText);
  return new CachedModel(
    new LocalJsonModel(hosted!.url, hosted!.model, { apiKey: devVar(hosted!.keyVar ?? "LOCAL_LLM_API_KEY"), ...o }),
    `hosted;prompt=${PROMPT_VERSION};effort=${o.reasoningEffort};max=${o.maxTokens ?? 12_000}${"gatewayThinking" in o && o.gatewayThinking === false ? ";think=off" : ""}`,
    offline,
  );
};
const cached = hosted
  ? new CachedModel(
      new LocalJsonModel(hosted.url, hosted.model, { apiKey: devVar(hosted.keyVar ?? "LOCAL_LLM_API_KEY"), reasoningEffort: hosted.effort }),
      `hosted;prompt=${PROMPT_VERSION}${hosted.effort ? `;effort=${hosted.effort}` : ""}`,
      offline,
    )
  : local
  ? new CachedModel(
      new LocalJsonModel(process.env.LOCAL_LLM_URL ?? "http://127.0.0.1:8080", local.file, { thinking: local.thinking, maxTokens: local.thinking ? 16_000 : 12_000, presencePenalty: local.presencePenalty }),
      `thinking=${local.thinking};prompt=${PROMPT_VERSION}${local.presencePenalty ? `;pp=${local.presencePenalty}` : ""}`,
      offline,
    )
  : null;

for (const item of items) {
  const started = Date.now();
  const startedMono = performance.now();
  const log: string[] = [];
  let lesson: ModelLesson | null = null;
  let verification: Verification | null = null;
  let attempts = 0;
  let usage = { input: 0, output: 0 };
  let error: string | undefined;
  const itemModel = stored ? null : modelFor(item.problem_text);
  const before = itemModel?.stats.modelMs ?? 0;
  try {
    if (stored) {
      const s = stored.get(item.id);
      if (!s) throw new Error("no stored Gemini lesson");
      const v = verifyLesson(s.lesson);
      lesson = v.lesson;
      verification = v.verification;
      attempts = 1;
    } else {
      const r = await solveProblem(itemModel!, VN_GRADE_9, item.problem_text, { signal: AbortSignal.timeout(solveLimitMs), ...(production ? { onProgress: () => undefined } : {}), maxAttempts: 2, log: (m) => log.push(m), techniqueHints: withTechniques });
      lesson = r.lesson;
      verification = r.verification;
      attempts = r.attempts;
      for (const u of Object.values(r.usage)) usage = { input: usage.input + u.input, output: usage.output + u.output };
    }
  } catch (err) {
    error = err instanceof OfflineMiss ? "offline cache miss" : (err as Error).message.slice(0, 200);
  }
  const g = grade(item, lesson, verification);
  const row: Row = {
    id: item.id,
    topic: item.topic,
    difficulty: item.difficulty,
    format: item.format,
    grade: g.grade,
    answerCorrect: g.answerCorrect,
    status: verification?.status ?? null,
    attempts,
    inputTokens: usage.input,
    outputTokens: usage.output,
    modelSeconds: Math.round(((itemModel?.stats.modelMs ?? 0) - before) / 100) / 10,
    wallSeconds: Math.round((Date.now() - started) / 100) / 10,
    figurePoints: lesson?.figure ? lesson.figure.points.filter((p) => !p.hidden).length : null,
    failedChecks: verification?.checks.filter((c) => !c.passed).map((c) => c.label.slice(0, 80)) ?? [],
    answer: lesson ? answerText(lesson).slice(0, 160) : "",
    lesson,
    log,
    slept: Date.now() - started - (performance.now() - startedMono) > 5_000,
    ...(error ? { error } : {}),
  };
  rows.push(row);
  console.log(
    `${row.grade.padEnd(8)} ${row.id.padEnd(9)} ${String(row.status).padEnd(13)} ans=${String(row.answerCorrect).padEnd(5)} ${row.attempts}try ${row.modelSeconds}s in=${row.inputTokens} out=${row.outputTokens}${row.slept ? " SLEPT(timing invalid)" : ""}${error ? ` ERROR ${error}` : ""}`,
  );
}

const count = (g: Grade) => rows.filter((r) => r.grade === g).length;
const gradable = rows.filter((r) => r.answerCorrect !== null);
const summary = {
  exp,
  system,
  split,
  promptVersion: PROMPT_VERSION,
  techniqueHints: withTechniques,
  dataset: datasetName === "problems" ? "v1" : datasetName,
  n: rows.length,
  pass: count("PASS"),
  partial: count("PARTIAL"),
  fail: count("FAIL"),
  critical: count("CRITICAL"),
  answerAccuracy: gradable.length ? gradable.filter((r) => r.answerCorrect).length / gradable.length : null,
  gradableN: gradable.length,
  verifiedRate: rows.filter((r) => r.status === "verified").length / rows.length,
  errors: rows.filter((r) => r.error).length,
  meanModelSeconds: rows.reduce((s, r) => s + r.modelSeconds, 0) / rows.length,
  meanInputTokens: rows.reduce((s, r) => s + r.inputTokens, 0) / rows.length,
  meanOutputTokens: rows.reduce((s, r) => s + r.outputTokens, 0) / rows.length,
  cache: cached?.stats ?? null,
  /** Paid in this run (cache misses only). */
  costUsd: Math.round(SPEND.usd * 10000) / 10000,
  createdAt: new Date().toISOString(),
};
console.log(JSON.stringify(summary));
if (!existsSync(`${ROOT}results`)) mkdirSync(`${ROOT}results`, { recursive: true });
writeFileSync(`${ROOT}results/${exp}_${system}_${datasetName === "problems" ? "" : `${datasetName}_`}${ids ? "ids" : split}.json`, JSON.stringify({ summary, rows }, null, 1));
