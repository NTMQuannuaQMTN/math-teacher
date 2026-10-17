import {conclusionConsistencyFeedback} from '../../../shared/src/conclusionConsistency';
import {diameterOrthocenterDiagnosis} from '../solver/diameterOrthocenterDiagnosis';
import {geometryHypothesisDiagnosis} from '../solver/geometryHypothesisDiagnosis';
import { servable } from "../../../shared/src/servePolicy";
import { SolveProgressSchema, SolveRequestSchema, VerificationSchema, ModelLessonSchema, type Solution, type SolutionResponse, type SolveProgress } from "../../../shared/src/solution";
import { normalizeProblemText } from "../../../shared/src/mathText";
import type { ErrorCode } from "../../../shared/src/contract";
import { sha256Hex } from "../crypto";
import { nowIso, questionsOf, ScanRepository } from "../db";
import { intVar, isDevelopment, type Env } from "../env";
import { ApiError, getClientIp, json } from "../http";
import { isAbort } from "../ocr/httpErrors";
import { OcrFailure } from "../ocr/provider";
import { consumeRateLimit } from "../rateLimits";
import { VN_GRADE_9 } from "../solver/curriculum";
import { GeminiJsonModel } from "../solver/geminiModel";
import { OpenAiJsonModel, type JsonModel } from "../solver/llm";
import { BudgetedJsonModel } from "../solver/budget";
import { FailoverJsonModel } from "../solver/failover";
import { LocalJsonModel, type LocalModelOptions } from "../solver/localModel";
import { problemKey } from "../solver/problemKey";
import { MOCK_SOLVE_SCENARIOS, MockJsonModel, type MockSolveScenario } from "../solver/mock";
import { latexFeedback } from "../solver/latexCheck";
import { proofDependencyFeedback } from "../../../shared/src/proofDependencies";
import { cleanLanguage } from "../../../shared/src/language";
import { parseLesson, solveProblem } from "../solver/pipeline";
import { SoclaasAgentModel } from "../solver/agent";
import { hostedModelOptions, looksLikeGeometry, problemTier, selectSolverModelIds, soclaasDirectOptions, soclaasModelOptions, soclaasNeedsThinking, soclaasOutlineOptions } from "../solver/routing";
import { PROMPT_VERSION } from "../solver/prompts";
import {hiddenSearchFeedback} from '../../../shared/src/hiddenSearch';
import { withinSignal } from "../solver/deadline";
import { AttemptBudgetJsonModel } from "../solver/attemptBudget";
import type { RouteContext } from "./scans";

interface SolutionRow {
  id: string;
  scan_id: string;
  question_id: string;
  owner_id: string;
  status: "pending" | "ready" | "failed";
  problem_hash: string;
  problem_key: string | null;
  lesson_json: string | null;
  verification_json: string | null;
  error_code: string | null;
  model: string;
  prompt_version: string;
  attempts: number;
  duration_ms: number | null;
  started_at: string | null;
  created_at: string;
  updated_at: string;
  /** Live progress while pending (migration 0005); absent on databases without the column. */
  progress_json?: string | null;
}

const HOUR = 3600;
/** Product latency contract: one question may never spend longer than 30 seconds in solving. */
export const MAX_SOLVE_WALL_CLOCK_MS = 30_000;

/**
 * How long a solve may keep working after the HTTP reply (the reply itself always comes within 26 s: the lesson, or
 * "pending" for the app to poll). Accuracy first: a hard problem gets the full verified pipeline with its corrective
 * retry instead of being cut off. Development default 300 s; production default 26 s, because Cloudflare ends
 * waitUntil work about 30 s after the response (raise it only with a queue/Durable Object behind it).
 */
export const agentOn = (env: Env) => (env.SOLVER_PROVIDER || "").toLowerCase() === "soclaas" && !!env.SOCLAAS_API_KEY && (env.SOLVER_AGENT || "on").toLowerCase() !== "off";
export const agentMs = (env: Env) => Math.min(600_000, Math.max(30_000, intVar(env.SOLVER_AGENT_MS, 120_000)));
export function backgroundSolveMs(env: Env): number {
  if (agentOn(env)) return agentMs(env) + 5_000;
  const fallback = isDevelopment(env) ? 300_000 : 26_000;
  return Math.min(900_000, Math.max(26_000, intVar(env.SOLVE_BACKGROUND_MS, fallback)));
}

function solveTimeoutMs(env: Env): number {
  // Keep the cap absolute even if an old deployment or secret still contains a larger value.
  return Math.min(MAX_SOLVE_WALL_CLOCK_MS, Math.max(1_000, intVar(env.SOLVE_TIMEOUT_MS, MAX_SOLVE_WALL_CLOCK_MS)));
}

/**
 * Cheap/mid primary plus an optional stronger fallback used only when checks fail.
 * Default provider is Gemini (flash → pro). OpenAI remains available via SOLVER_PROVIDER=openai.
 */
// Opt-in (it cost ≈ $1.5 in one evening of testing): SOLVER_GEMINI_FALLBACK=on.
const geminiFallbackOn = (env: Env) => !!env.GEMINI_API_KEY && (env.SOLVER_GEMINI_FALLBACK || "off").toLowerCase() === "on";

export function createModels(env: Env, request: Request, problemText: string): { model: JsonModel; fallback?: JsonModel; fallbackOnlyOnFailure?: boolean; outlineModel?: JsonModel } {
  const provider = (env.SOLVER_PROVIDER || "gemini").toLowerCase();

  if (provider === "gemini" && env.GEMINI_API_KEY) {
    const key = env.GEMINI_API_KEY;
    // Efforts are Gemini 3 thinking levels: minimal | low | medium | high.
    // (gemini-2.5-* is closed to new API keys and returns 404.)
    const choice = selectSolverModelIds(problemText, {
      cheap: env.SOLVER_MODEL || "gemini-3.5-flash-lite",
      cheapEffort: env.SOLVER_REASONING_EFFORT || "low",
      strong: env.SOLVER_FALLBACK_MODEL || "gemini-3.5-flash",
      strongEffort: env.SOLVER_FALLBACK_REASONING_EFFORT || "medium",
      // Geometry also starts on the cheap model; escalate only when checks fail.
      geometry: env.SOLVER_GEOMETRY_MODEL || env.SOLVER_MODEL || "gemini-3.5-flash-lite",
      geometryEffort: env.SOLVER_GEOMETRY_REASONING_EFFORT || "medium",
    });
    const model = new GeminiJsonModel(key, choice.primary, choice.primaryEffort);
    const fallback =
      choice.fallback && (choice.fallback !== choice.primary || choice.fallbackEffort !== choice.primaryEffort)
        ? new GeminiJsonModel(key, choice.fallback, choice.fallbackEffort || "medium")
        : undefined;
    return { model, fallback };
  }

  if (provider === "openai" && env.OPENAI_API_KEY) {
    const key = env.OPENAI_API_KEY;
    const choice = selectSolverModelIds(problemText, {
      cheap: env.SOLVER_MODEL || "gpt-5.4-mini",
      cheapEffort: env.SOLVER_REASONING_EFFORT || "low",
      strong: env.SOLVER_FALLBACK_MODEL,
      strongEffort: env.SOLVER_FALLBACK_REASONING_EFFORT || "medium",
      geometry: env.SOLVER_GEOMETRY_MODEL || "gpt-5.4",
      geometryEffort: env.SOLVER_GEOMETRY_REASONING_EFFORT || "medium",
    });
    const model = new OpenAiJsonModel(key, choice.primary, choice.primaryEffort);
    const fallback =
      choice.fallback && choice.fallback !== choice.primary
        ? new OpenAiJsonModel(key, choice.fallback, choice.fallbackEffort || "medium")
        : undefined;
    return { model, fallback };
  }

  if (provider === "local") {
    const freeHosted = !!env.LOCAL_LLM_URL && new URL(env.LOCAL_LLM_URL).hostname === "openrouter.ai" && !!env.LOCAL_SOLVER_MODEL?.endsWith(":free");
    // Open model behind an OpenAI-compatible server; no API cost when self-hosted.
    // Adaptive reasoning (hosted reasoning models): hidden reasoning is most of the latency, and a simple
    // problem doesn't need much of it. Local llama.cpp models ignore this (thinking stays off).
    const model = new LocalJsonModel(env.LOCAL_LLM_URL || "http://127.0.0.1:8080", env.LOCAL_SOLVER_MODEL || "local", {
      apiKey: env.LOCAL_LLM_API_KEY,
      thinking: false,
      ...hostedModelOptions(problemText, {
        simpleEffort: env.LOCAL_SIMPLE_REASONING_EFFORT || (freeHosted ? "minimal" : undefined),
        effort: env.LOCAL_REASONING_EFFORT || (freeHosted ? "minimal" : undefined),
        complexMaxTokens: intVar(env.LOCAL_COMPLEX_MAX_TOKENS, freeHosted ? 6_000 : 24_000),
        // With the Gemini fallback on, stop the free model sooner so the fallback (Gemini 3.5 Flash, medium thinking: 145–190 s on a 3-part chuyên geometry proof) still fits; "low" thinking was measured and gave unusable lessons.
        complexRequestTimeoutMs: intVar(env.LOCAL_COMPLEX_REQUEST_TIMEOUT_MS, geminiFallbackOn(env) ? 120_000 : 240_000),
      }),
    });
    if (env.SOLVER_SOCLAAS_FALLBACK === "on" && env.SOCLAAS_API_KEY) {
      const name=env.SOCLAAS_MODEL || "qwen3.6:35b";
      const paid=new LocalJsonModel(env.SOCLAAS_BASE_URL || "https://soclaas-api.comp.nus.edu.sg/v1",name,{
        apiKey:env.SOCLAAS_API_KEY,thinking:false,gatewayThinking:false,maxTokens:3600,requestTimeoutMs:20_000,
      });
      const configured=Number(env.SOLVER_DAILY_BUDGET_USD ?? "1");
      const budget=Number.isFinite(configured) && configured>=0 ? configured : 1;
      return {
        model:new AttemptBudgetJsonModel(model,6000),
        fallback:new BudgetedJsonModel(paid,env.DB,budget, m=>console.log(`[solve] ${m}`),3600,true),
        // Unrenderable/invalid proofs also deserve a fallback, not just provider outages.
        fallbackOnlyOnFailure:false,
      };
    }
    if (env.SOLVER_FAILOVER_URL) {
      const failover = new LocalJsonModel(env.SOLVER_FAILOVER_URL, env.SOLVER_FAILOVER_MODEL || "local", { apiKey: env.SOLVER_FAILOVER_API_KEY, thinking: false });
      return { model: new FailoverJsonModel(model, failover, (m) => console.log(`[solve] ${m}`)) };
    }
    // Temporary (2026-10-06, user decision): Gemini takes over only when the free model fails outright — a timeout,
    // truncated or empty output, a give-up, or an exhausted daily quota. Corrective retries stay on the free model.
    // On with SOLVER_GEMINI_FALLBACK=on (and GEMINI_API_KEY).
    if (geminiFallbackOn(env)) {
      // gemini-3.8-flash: $3.75/M output tokens vs $9 for 3.5-flash. A daily cap bounds the spend (default $0.50/day).
      const gemini = new GeminiJsonModel(env.GEMINI_API_KEY!, env.SOLVER_FALLBACK_MODEL || "gemini-3.8-flash", env.SOLVER_FALLBACK_REASONING_EFFORT || "medium");
      const budget = Number(env.SOLVER_GEMINI_DAILY_BUDGET_USD ?? "0.5");
      const capped = new BudgetedJsonModel(gemini, env.DB, Number.isFinite(budget) ? budget : 0.5, (m) => console.log(`[solve] ${m}`));
      return { model, fallback: capped, fallbackOnlyOnFailure: true };
    }
    return { model };
  }

  // SOCLAAS (NUS, OpenAI-compatible, paid per token): qwen3.6:35b ("default") solved 13/13 PTNK 2025 parts at
  // ≈ $0.03 each (PTNK25-S2). Daily spending cap; on an outright failure the free OpenRouter model gets a turn.
  if (provider === "soclaas" && env.SOCLAAS_API_KEY) {
    const o = soclaasModelOptions(problemText);
    const url = env.SOCLAAS_BASE_URL || "https://soclaas-api.comp.nus.edu.sg/v1";
    const name = env.SOCLAAS_MODEL || "qwen3.6:35b";
    const budget = Number(env.SOLVER_DAILY_BUDGET_USD ?? "1");
    const capped = (m: LocalJsonModel, maxTokens: number) => new BudgetedJsonModel(m, env.DB, Number.isFinite(budget) ? budget : 1, (x) => console.log(`[solve] ${x}`), maxTokens,true);
    // The solver as a tool-using agent (2026-10-16): compute / draw_figure / write_lesson (all checks at once) / revise /
    // finish, inside a hard time limit. Certified modules and the pipeline's checks still run around it.
    if (agentOn(env)) {
      const agent = new SoclaasAgentModel(url, env.SOCLAAS_API_KEY, name, { problemText: normalizeProblemText(problemText), withFigure: looksLikeGeometry(problemText), deadline: Date.now() + agentMs(env) - 4_000, log: (m) => console.log(`[solve] ${m}`) });
      return { model: new BudgetedJsonModel(agent, env.DB, Number.isFinite(budget) ? budget : 1, (x) => console.log(`[solve] ${x}`), 12_000, true) };
    }
    // A hard non-geometry problem needs more than one request's window (reasoning + a long lesson ≈ 40K tokens at
    // ~130 tokens/s > the gateway's 240 s): an outline request thinks, then the lesson is written without long thinking.
    // Two stages for hard problems; for geometry always when it needs an argument (its lesson is written without thinking).
    const twoStage = (o.gatewayThinking || (looksLikeGeometry(problemText) && soclaasNeedsThinking(problemText))) && env.SOLVER_TWO_STAGE !== "off";
    const soclaas = new LocalJsonModel(url, name, { apiKey: env.SOCLAAS_API_KEY, thinking: false, ...o, ...(twoStage ? { gatewayThinking: false, maxTokens: 20_000 } : {}) });
    const model = capped(soclaas, twoStage ? 20_000 : (o.maxTokens ?? 12_000));
    const outlineModel = twoStage
      ? capped(new LocalJsonModel(url, name, { apiKey: env.SOCLAAS_API_KEY, thinking: false, ...soclaasOutlineOptions(problemText) }), 12_000)
      : undefined;
    // A request cut off at the gateway's 120 s limit is retried on the same model without hidden thinking (a direct
    // lesson fits the limit); the free model is weaker and slower, so it is not the retry for SOCLAAS.
    const d = soclaasDirectOptions(problemText);
    const direct = capped(new LocalJsonModel(url, name, { apiKey: env.SOCLAAS_API_KEY, thinking: false, ...d }), d.maxTokens);
    return { model, fallback: direct, fallbackOnlyOnFailure: true, outlineModel };
  }

  if (provider === "mock" && isDevelopment(env)) {
    const requested = request.headers.get("x-mock-scenario");
    const scenario = MOCK_SOLVE_SCENARIOS.includes(requested as MockSolveScenario) ? (requested as MockSolveScenario) : null;
    return { model: new MockJsonModel(scenario, problemText) };
  }
  console.error(`Solver provider "${provider}" is not usable (missing key, unknown, or mock outside development)`);
  throw new ApiError(503, "solve_not_configured", "Solving is temporarily unavailable.", true);
}

function failureCode(err: unknown): ErrorCode {
  if (err instanceof OcrFailure) {
    if (err.kind === "quota_exhausted") return "solve_quota_exhausted";
    if (err.kind === "incomplete") return "solve_incomplete";
    return err.kind === "timeout" ? "solve_timeout" : err.kind === "malformed_output" ? "solve_malformed_output" : "solve_provider_error";
  }
  return isAbort(err) ? "solve_timeout" : "internal_error";
}

function toApiSolution(row: SolutionRow,problemText?:string): Solution {
  const lesson = row.lesson_json ? ModelLessonSchema.safeParse(JSON.parse(row.lesson_json)) : null;
  const verification = row.verification_json ? VerificationSchema.safeParse(JSON.parse(row.verification_json)) : null;
  const unsafe = lesson?.success && (latexFeedback(lesson.data).length || cleanLanguage(lesson.data).feedback.length || hiddenSearchFeedback(lesson.data,problemText??lesson.data.analysis.statement).length || proofDependencyFeedback(lesson.data,problemText??lesson.data.analysis.statement).length || conclusionConsistencyFeedback(lesson.data,problemText??lesson.data.analysis.statement).length ||
    false);
  // (Removed 2026-10-15: lessons for statements with a degenerate case are no longer hidden; the general solution is shown.)
  void diameterOrthocenterDiagnosis; void geometryHypothesisDiagnosis;
  const status = row.status === "ready" && (!lesson?.success || unsafe) ? "failed" : row.status;
  return {
    id: row.id,
    scanId: row.scan_id,
    questionId: row.question_id,
    status,
    createdAt: row.created_at,
    // The student sees the whole question exactly as confirmed (2026-10-17: the solution view showed the solver's
    // shortened restatement, different from the question view).
    lesson: status === "ready" && lesson?.success ? (problemText ? { ...lesson.data, analysis: { ...lesson.data.analysis, statement: problemText } } : lesson.data) : null,
    verification: verification?.success ? verification.data : null,
    // A ready lesson with an error code is the previous lesson kept after a failed regenerate.
    error:
      status === "ready" && row.error_code
        ? { code: row.error_code as ErrorCode, retryable: row.error_code !== "solve_quota_exhausted" }
        : status === "failed"
        ? { code: unsafe ? "solve_incomplete" : row.error_code ?? "internal_error", retryable: row.error_code !== "problem_not_confirmed" && row.error_code !== "solve_quota_exhausted" }
        : null,
    model: row.model,
    promptVersion: row.prompt_version,
    attempts: row.attempts,
    progress: status === "pending" && row.progress_json ? (SolveProgressSchema.safeParse(JSON.parse(row.progress_json)).data ?? null) : null,
  };
}

async function findSolution(db: D1Database, ownerId: string, scanId: string, questionId: string): Promise<SolutionRow | null> {
  return db
    .prepare("SELECT * FROM solutions WHERE scan_id = ? AND question_id = ? AND owner_id = ?")
    .bind(scanId, questionId, ownerId)
    .first<SolutionRow>();
}

function isFresh(row: SolutionRow, env: Env): boolean {
  return row.status === "pending" && row.started_at !== null && Date.parse(row.started_at) > Date.now() - Math.max(solveTimeoutMs(env), backgroundSolveMs(env)) - 5_000;
}

/** GET /v1/scans/:id/questions/:qid/solution — 202 while pending, so clients know to keep polling. */
export async function getSolution(rc: RouteContext, scanId: string, questionId = "q1"): Promise<Response> {
  const row = await findSolution(rc.env.DB, rc.ownerId, scanId, questionId);
  if (!row) throw new ApiError(404, "not_found", "No solution yet.");
  // A pending row whose generator died is reported as a retryable failure.
  const effective = row.status === "pending" && !isFresh(row, rc.env) ? { ...row, status: "failed" as const, error_code: "solve_timeout" } : row;
  const scan = await new ScanRepository(rc.env.DB).findOwned(rc.ownerId, scanId);
  const question = scan ? questionsOf(scan).find((q) => q.id === questionId) : undefined;
  const problemText = question ? normalizeProblemText(question.text) || undefined : undefined;
  return json({ solution: toApiSolution(effective, problemText) } satisfies SolutionResponse, effective.status === "pending" ? 202 : 200);
}

/**
 * POST /v1/scans/:id/solve  { regenerate?: boolean }
 *
 * Returns the stored lesson when one exists for the same problem text and
 * prompt version (solving is expensive; revealing hints never re-solves).
 * Otherwise generates one. Concurrent requests for the same scan get 409
 * and should poll GET …/solution.
 */
export async function solveScan(rc: RouteContext, scanId: string, questionId = "q1"): Promise<Response> {
  // Start at request receipt, before parsing, hashing, database reads, model selection,
  // verification, persistence and response serialization. Reserve one second for HTTP delivery.
  const responseSignal = AbortSignal.timeout(Math.min(29_000, solveTimeoutMs(rc.env)));
  // The reply is due at 26 s; generation itself may continue in the background (backgroundSolveMs).
  const replyAfterMs = Math.min(26_000, solveTimeoutMs(rc.env));
  try {
    return await withinSignal(responseSignal, () => solveScanWithinDeadline(rc, scanId, questionId, replyAfterMs));
  } catch (err) {
    if (err instanceof OcrFailure && err.kind === "timeout") throw new ApiError(503, "solve_timeout", "Không thể hoàn thành lời giải trong thời gian cho phép. Vui lòng thử lại.", true);
    throw err;
  }
}

async function solveScanWithinDeadline(rc: RouteContext, scanId: string, questionId: string, replyAfterMs: number): Promise<Response> {
  const requestStarted = Date.now();
  const { env, request, ownerId, ctx } = rc;
  let body: unknown = {};
  if (request.headers.get("content-type")?.includes("application/json")) {
    body = await request.json().catch(() => {
      throw new ApiError(400, "bad_request", "Invalid JSON body.");
    });
  }
  const { regenerate } = SolveRequestSchema.parse(body ?? {});

  const scan = await new ScanRepository(env.DB).findOwned(ownerId, scanId);
  if (!scan) throw new ApiError(404, "not_found", "Scan not found.");
  if (scan.status !== "confirmed" || !scan.problem_text) {
    throw new ApiError(400, "problem_not_confirmed", "Save the problem before solving it.");
  }
  const question = questionsOf(scan).find((q) => q.id === questionId);
  if (!question) throw new ApiError(404, "not_found", "Question not found.");
  const problemText = normalizeProblemText(question.text);
  if (!problemText) throw new ApiError(400, "empty_text", "The problem text is empty.");
  const problemHash = await sha256Hex(`${PROMPT_VERSION}\n${problemText}`);

  const existing = await findSolution(env.DB, ownerId, scanId, questionId);
  // Already being solved (a second tap, or the app re-posting): answer "still working" so the app keeps polling the
  // running solve, instead of a 409 the browser reports as an error.
  if (existing && isFresh(existing, env)) {
    return json({ solution: toApiSolution(existing, problemText) } satisfies SolutionResponse, 202);
  }
  const key = await problemKey(problemText);
  // The student's own finished lesson for the same text is kept across prompt versions: re-solving it
  // after every deploy would spend quota on something they already have ("Regenerate" asks for a new one).
  const sameText = existing?.problem_hash === problemHash || (existing?.problem_key != null && existing.problem_key === key);
  if (existing && existing.status === "ready" && sameText && existing.prompt_version === PROMPT_VERSION && !regenerate && toApiSolution(existing,problemText).status === "ready") {
    return json({ solution: toApiSolution(existing,problemText) } satisfies SolutionResponse);
  }

  // Shared library: if anyone already has a verified lesson for this exact problem, reuse it —
  // no AI call, no cost, no rate-limit use. Unverified lessons are never shared.
  const shared = regenerate ? null : await env.DB.prepare(
    `SELECT lesson_json, verification_json, model FROM solutions
     WHERE problem_key = ? AND prompt_version = ? AND status = 'ready' AND lesson_json IS NOT NULL
       AND json_extract(verification_json, '$.status') IN ('verified', 'partial')
     ORDER BY updated_at DESC LIMIT 1`,
  )
    .bind(key, PROMPT_VERSION)
    .first<{ lesson_json: string; verification_json: string; model: string }>();
  if (shared) {
    const ts = nowIso();
    await env.DB.prepare(
      `INSERT INTO solutions (id, scan_id, question_id, owner_id, status, problem_hash, problem_key, lesson_json, verification_json,
         model, prompt_version, attempts, duration_ms, started_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'ready', ?, ?, ?, ?, ?, ?, 0, 0, NULL, ?, ?)
       ON CONFLICT (scan_id, question_id) DO UPDATE SET status = 'ready', problem_hash = excluded.problem_hash,
         problem_key = excluded.problem_key, lesson_json = excluded.lesson_json, verification_json = excluded.verification_json,
         model = excluded.model, prompt_version = excluded.prompt_version, attempts = 0, duration_ms = 0, error_code = NULL,
         started_at = NULL, created_at = excluded.created_at, updated_at = excluded.updated_at
       WHERE solutions.owner_id = excluded.owner_id`,
    )
      .bind(existing?.id ?? crypto.randomUUID(), scanId, questionId, ownerId, problemHash, key, shared.lesson_json, shared.verification_json, shared.model, PROMPT_VERSION, ts, ts)
      .run();
    console.log(`[solve ${scanId}/${questionId}] reused a shared lesson (no AI call)`);
    const row = await findSolution(env.DB, ownerId, scanId, questionId);
    if (row) return json({ solution: toApiSolution(row,problemText) } satisfies SolutionResponse);
  }

  const { model, fallback, fallbackOnlyOnFailure, outlineModel } = createModels(env, request, problemText);
  await consumeRateLimit(env.DB, `solve:device:${ownerId}`, intVar(env.SOLVE_LIMIT_PER_DEVICE_PER_HOUR, 30), HOUR);
  await consumeRateLimit(env.DB, `solve:ip:${getClientIp(request)}`, intVar(env.SOLVE_LIMIT_PER_IP_PER_HOUR, 90), HOUR);

  // Take the lock atomically: insert, or reclaim a row that isn't being generated right now.
  const id = existing?.id ?? crypto.randomUUID();
  const ts = nowIso();
  const staleBefore = new Date(Date.now() - Math.max(solveTimeoutMs(env), backgroundSolveMs(env)) - 5_000).toISOString();
  const lock = await env.DB.prepare(
    `INSERT INTO solutions (id, scan_id, question_id, owner_id, status, problem_hash, model, prompt_version, attempts, started_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, 0, ?, ?, ?)
     ON CONFLICT (scan_id, question_id) DO UPDATE SET status = 'pending', problem_hash = excluded.problem_hash, model = excluded.model,
       prompt_version = excluded.prompt_version, started_at = excluded.started_at, updated_at = excluded.updated_at,
       error_code = NULL
     WHERE solutions.owner_id = excluded.owner_id
       AND (solutions.status != 'pending' OR solutions.started_at < ?)`,
  )
    .bind(id, scanId, questionId, ownerId, problemHash, model.model, PROMPT_VERSION, ts, ts, ts, staleBefore)
    .run();
  if ((lock.meta.changes ?? 0) === 0) {
    const running = await findSolution(env.DB, ownerId, scanId, questionId);
    if (running?.status === "pending") return json({ solution: toApiSolution(running, problemText) } satisfies SolutionResponse, 202);
    throw new ApiError(409, "solve_in_progress", "This problem is already being solved.", true);
  }

  // Progress is only read while the row is pending, so it is never written into the statements that save
  // the lesson (they must work on a database without migration 0005); a previous run's progress is
  // cleared best-effort here.
  await env.DB.prepare(`UPDATE solutions SET progress_json = NULL WHERE scan_id = ? AND question_id = ?`)
    .bind(scanId, questionId)
    .run()
    .catch(() => undefined);

  // Progress for the app's loading screen: at most one write every 2 s (or on a stage change), in order,
  // never blocking generation. A failed write (e.g. a database without migration 0005) is ignored.
  let lastWrite = 0;
  let lastStage = "";
  let writes = Promise.resolve();
  const onProgress = (p: SolveProgress) => {
    const now = Date.now();
    if (p.stage === lastStage && now - lastWrite < 2_000) return;
    lastWrite = now;
    lastStage = p.stage;
    writes = writes
      .then(() =>
        env.DB.prepare(`UPDATE solutions SET progress_json = ? WHERE scan_id = ? AND question_id = ? AND status = 'pending'`)
          .bind(JSON.stringify(p), scanId, questionId)
          .run(),
      )
      .then(
        () => undefined,
        () => undefined,
      );
  };

  let keptPrevious: ErrorCode | null = null;
  const backgroundMs = backgroundSolveMs(env);
  const generationSignal = AbortSignal.timeout(Math.max(1_000, backgroundMs - (Date.now() - requestStarted)));
  const work = (async () => {
    try {
      const result = await solveProblem(model, VN_GRADE_9, problemText, {
        // SoCLaaS for everything (2026-10-17): with the agent, no built-in solver answers on its own.
        certified: !agentOn(env),
        fallback,
        fallbackOnlyOnFailure,
        outlineModel,
        // SOCLAAS first: its fallback (the free model) is weaker, so a give-up is corrected on SOCLAAS itself.
        escalateOnGiveUp: (env.SOLVER_PROVIDER || "").toLowerCase() !== "soclaas",
        signal: generationSignal,
        // Accuracy first: a corrective retry stays allowed for most of the background budget, not only the first 25 s.
        retryBudgetMs: Math.max(25_000, Math.round(backgroundMs * 0.6)),
        log: (m) => console.log(`[solve ${scanId}/${questionId}] ${m}`),
        onProgress,
      });
      await writes;
      // Accuracy first: a lesson in which a check found something false is never shown (servePolicy.ts).
      if (!servable(result.verification)) throw new OcrFailure("incomplete", "every lesson found contains a step or answer the checks found false", true);
      // Never store a lesson the app can't read: it would surface as a generic failure on every reload.
      // A size slip introduced after parsing (a repair that made a text too long) is cut the same way as at parse time,
      // rather than failing a solve that has already been paid for.
      let valid = ModelLessonSchema.safeParse(result.lesson);
      if (!valid.success) {
        const repaired = parseLesson(JSON.stringify(result.lesson));
        if ("lesson" in repaired) valid = ModelLessonSchema.safeParse(repaired.lesson);
      }
      if (!valid.success) {
        console.error(`[solve ${scanId}/${questionId}] lesson fails the schema: ${valid.error.issues.slice(0, 3).map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
        throw new OcrFailure("malformed_output", "lesson fails the schema", true);
      }
      await env.DB.prepare(
        `UPDATE solutions SET status = 'ready', lesson_json = ?, verification_json = ?, error_code = NULL, model = ?, problem_key = ?,
           attempts = ?, duration_ms = ?, started_at = NULL, created_at = ?, updated_at = ? WHERE scan_id = ? AND question_id = ?`,
      )
        .bind(JSON.stringify(valid.data), JSON.stringify(result.verification), result.model, key, result.attempts, result.durationMs, nowIso(), nowIso(), scanId, questionId)
        .run();
    } catch (err) {
      console.error(`[solve ${scanId}] failed`, err instanceof Error ? err.message : err);
      await writes;
      // A failed Regenerate (quota, timeout…) must not take away the lesson the student already had.
      // The row may say "pending"/"failed" after an interrupted earlier attempt (a reload, a closed tab) while still holding
      // the student's previous lesson: keep that lesson whenever it is still servable for the same text.
      const previousServable = !!existing?.lesson_json && sameText && toApiSolution({ ...existing, status: "ready", error_code: null }, problemText).status === "ready";
      if (previousServable && existing) {
        await env.DB.prepare(
          `UPDATE solutions SET status = 'ready', error_code = ?, problem_hash = ?, model = ?, prompt_version = ?, started_at = NULL, updated_at = ?
           WHERE scan_id = ? AND question_id = ?`,
        )
          // error_code on a ready row = "the last regenerate failed, this is the previous lesson" (read by polling clients).
          .bind(failureCode(err), existing.problem_hash, existing.model, existing.prompt_version, nowIso(), scanId, questionId)
          .run();
        keptPrevious = failureCode(err);
        console.log(`[solve ${scanId}/${questionId}] kept the previous lesson after a failed regenerate (${keptPrevious})`);
        return;
      }
      await env.DB.prepare(
        `UPDATE solutions SET status = 'failed', error_code = ?, started_at = NULL, updated_at = ? WHERE scan_id = ? AND question_id = ?`,
      )
        .bind(failureCode(err), nowIso(), scanId, questionId)
        .run();
    }
  })();
  // Keep generating (and save the result) even if the student leaves the screen or the reply has gone.
  ctx.waitUntil(work);
  // Reply within the deadline: the finished lesson, or "pending" (202) while it is still being worked out and checked.
  const finished = await Promise.race([
    work.then(() => true),
    new Promise<false>((resolve) => setTimeout(() => resolve(false), Math.max(0, replyAfterMs - (Date.now() - requestStarted)))),
  ]);
  if (!finished) {
    const pending = await findSolution(env.DB, ownerId, scanId, questionId);
    if (!pending) throw new ApiError(500, "internal_error", "Solution vanished.");
    console.log(`[solve ${scanId}/${questionId}] still working after ${Math.round((Date.now() - requestStarted) / 1000)} s; replying "pending", continuing in the background (≤ ${Math.round(backgroundMs / 1000)} s)`);
    return json({ solution: toApiSolution(pending, problemText) } satisfies SolutionResponse, 202);
  }
  // A failed regenerate returns the previous lesson (200) with the failure in `error`: the app shows it with a notice
  // instead of an error response.

  const row = await findSolution(env.DB, ownerId, scanId, questionId);
  if (!row) throw new ApiError(500, "internal_error", "Solution vanished.");
  return json({ solution: toApiSolution(row,problemText) } satisfies SolutionResponse);
}
