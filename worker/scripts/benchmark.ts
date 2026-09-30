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
import type { ModelLesson, Verification } from "../../shared/src/solution";
import { verifyLesson } from "../../shared/src/verify";
import { VN_GRADE_9 } from "../src/solver/curriculum";
import { LocalJsonModel } from "../src/solver/localModel";
import { solveProblem } from "../src/solver/pipeline";
import { PROMPT_VERSION } from "../src/solver/prompts";
import { grade, answerText, type BenchItem, type Grade } from "./lib/grade";
import { CachedModel, OfflineMiss } from "./lib/modelCache";

const ROOT = new URL("../../tools/benchmark/", import.meta.url).pathname;
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

const LOCAL: Record<string, { file: string; thinking: boolean }> = {
  "qwen3-4b": { file: "qwen3-4b-q4_k_m", thinking: false },
  "qwen3-4b-think": { file: "qwen3-4b-q4_k_m", thinking: true },
  "qwen3-8b": { file: "qwen3-8b-q4_k_m", thinking: false },
  "qwen3-8b-think": { file: "qwen3-8b-q4_k_m", thinking: true },
  "qwen3-14b": { file: "qwen3-14b-q4_k_m", thinking: false },
  "qwen3-14b-think": { file: "qwen3-14b-q4_k_m", thinking: true },
};
if (!LOCAL[system] && system !== "stored-gemini") {
  console.error(`unknown system "${system}". Known: ${[...Object.keys(LOCAL), "stored-gemini"].join(", ")}`);
  process.exit(2);
}

const items: BenchItem[] = readFileSync(`${ROOT}dataset/problems.jsonl`, "utf8")
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
const cached = local
  ? new CachedModel(
      new LocalJsonModel(process.env.LOCAL_LLM_URL ?? "http://127.0.0.1:8080", local.file, { thinking: local.thinking, maxTokens: local.thinking ? 16_000 : 12_000 }),
      `thinking=${local.thinking};prompt=${PROMPT_VERSION}`,
      offline,
    )
  : null;

for (const item of items) {
  const started = Date.now();
  let lesson: ModelLesson | null = null;
  let verification: Verification | null = null;
  let attempts = 0;
  let usage = { input: 0, output: 0 };
  let error: string | undefined;
  const before = cached?.stats.modelMs ?? 0;
  try {
    if (stored) {
      const s = stored.get(item.id);
      if (!s) throw new Error("no stored Gemini lesson");
      const v = verifyLesson(s.lesson);
      lesson = v.lesson;
      verification = v.verification;
      attempts = 1;
    } else {
      const r = await solveProblem(cached!, VN_GRADE_9, item.problem_text, { signal: AbortSignal.timeout(40 * 60_000), maxAttempts: 2 });
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
    modelSeconds: Math.round(((cached?.stats.modelMs ?? 0) - before) / 100) / 10,
    wallSeconds: Math.round((Date.now() - started) / 100) / 10,
    figurePoints: lesson?.figure ? lesson.figure.points.filter((p) => !p.hidden).length : null,
    failedChecks: verification?.checks.filter((c) => !c.passed).map((c) => c.label.slice(0, 80)) ?? [],
    answer: lesson ? answerText(lesson).slice(0, 160) : "",
    lesson,
    ...(error ? { error } : {}),
  };
  rows.push(row);
  console.log(
    `${row.grade.padEnd(8)} ${row.id.padEnd(9)} ${String(row.status).padEnd(13)} ans=${String(row.answerCorrect).padEnd(5)} ${row.attempts}try ${row.modelSeconds}s in=${row.inputTokens} out=${row.outputTokens}${error ? ` ERROR ${error}` : ""}`,
  );
}

const count = (g: Grade) => rows.filter((r) => r.grade === g).length;
const gradable = rows.filter((r) => r.answerCorrect !== null);
const summary = {
  exp,
  system,
  split,
  promptVersion: PROMPT_VERSION,
  dataset: "v1",
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
  createdAt: new Date().toISOString(),
};
console.log(JSON.stringify(summary));
if (!existsSync(`${ROOT}results`)) mkdirSync(`${ROOT}results`, { recursive: true });
writeFileSync(`${ROOT}results/${exp}_${system}_${ids ? "ids" : split}.json`, JSON.stringify({ summary, rows }, null, 1));
