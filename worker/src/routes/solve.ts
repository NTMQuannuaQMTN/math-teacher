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
import { FailoverJsonModel } from "../solver/failover";
import { LocalJsonModel, type LocalModelOptions } from "../solver/localModel";
import { problemKey } from "../solver/problemKey";
import { MOCK_SOLVE_SCENARIOS, MockJsonModel, type MockSolveScenario } from "../solver/mock";
import { solveProblem } from "../solver/pipeline";
import { problemTier, selectSolverModelIds } from "../solver/routing";
import { PROMPT_VERSION } from "../solver/prompts";
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

function solveTimeoutMs(env: Env): number {
  return intVar(env.SOLVE_TIMEOUT_MS, 170_000);
}

/**
 * Cheap/mid primary plus an optional stronger fallback used only when checks fail.
 * Default provider is Gemini (flash → pro). OpenAI remains available via SOLVER_PROVIDER=openai.
 */
function createModels(env: Env, request: Request, problemText: string): { model: JsonModel; fallback?: JsonModel } {
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
    // Open model behind an OpenAI-compatible server; no API cost when self-hosted.
    // Adaptive reasoning (hosted reasoning models): hidden reasoning is most of the latency, and a simple
    // problem doesn't need much of it. Local llama.cpp models ignore this (thinking stays off).
    const tier = problemTier(problemText);
    const effort = (tier === "simple" ? env.LOCAL_SIMPLE_REASONING_EFFORT || "minimal" : env.LOCAL_REASONING_EFFORT || "low") as LocalModelOptions["reasoningEffort"];
    const model = new LocalJsonModel(env.LOCAL_LLM_URL || "http://127.0.0.1:8080", env.LOCAL_SOLVER_MODEL || "local", {
      apiKey: env.LOCAL_LLM_API_KEY,
      thinking: false,
      reasoningEffort: effort,
    });
    if (env.SOLVER_FAILOVER_URL) {
      const failover = new LocalJsonModel(env.SOLVER_FAILOVER_URL, env.SOLVER_FAILOVER_MODEL || "local", { apiKey: env.SOLVER_FAILOVER_API_KEY, thinking: false });
      return { model: new FailoverJsonModel(model, failover, (m) => console.log(`[solve] ${m}`)) };
    }
    return { model };
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

function toApiSolution(row: SolutionRow): Solution {
  const lesson = row.lesson_json ? ModelLessonSchema.safeParse(JSON.parse(row.lesson_json)) : null;
  const verification = row.verification_json ? VerificationSchema.safeParse(JSON.parse(row.verification_json)) : null;
  const status = row.status === "ready" && !lesson?.success ? "failed" : row.status;
  return {
    id: row.id,
    scanId: row.scan_id,
    questionId: row.question_id,
    status,
    createdAt: row.created_at,
    lesson: lesson?.success ? lesson.data : null,
    verification: verification?.success ? verification.data : null,
    error:
      status === "failed"
        ? { code: row.error_code ?? "internal_error", retryable: row.error_code !== "problem_not_confirmed" && row.error_code !== "solve_quota_exhausted" }
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
  return row.status === "pending" && row.started_at !== null && Date.parse(row.started_at) > Date.now() - solveTimeoutMs(env) - 30_000;
}

/** GET /v1/scans/:id/questions/:qid/solution — 202 while pending, so clients know to keep polling. */
export async function getSolution(rc: RouteContext, scanId: string, questionId = "q1"): Promise<Response> {
  const row = await findSolution(rc.env.DB, rc.ownerId, scanId, questionId);
  if (!row) throw new ApiError(404, "not_found", "No solution yet.");
  // A pending row whose generator died is reported as a retryable failure.
  const effective = row.status === "pending" && !isFresh(row, rc.env) ? { ...row, status: "failed" as const, error_code: "solve_timeout" } : row;
  return json({ solution: toApiSolution(effective) } satisfies SolutionResponse, effective.status === "pending" ? 202 : 200);
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
  if (existing && isFresh(existing, env)) {
    throw new ApiError(409, "solve_in_progress", "This problem is already being solved.", true);
  }
  const key = await problemKey(problemText);
  // The student's own finished lesson for the same text is kept across prompt versions: re-solving it
  // after every deploy would spend quota on something they already have ("Regenerate" asks for a new one).
  const sameText = existing?.problem_hash === problemHash || (existing?.problem_key != null && existing.problem_key === key);
  if (existing && existing.status === "ready" && sameText && !regenerate) {
    return json({ solution: toApiSolution(existing) } satisfies SolutionResponse);
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
    if (row) return json({ solution: toApiSolution(row) } satisfies SolutionResponse);
  }

  const { model, fallback } = createModels(env, request, problemText);
  await consumeRateLimit(env.DB, `solve:device:${ownerId}`, intVar(env.SOLVE_LIMIT_PER_DEVICE_PER_HOUR, 30), HOUR);
  await consumeRateLimit(env.DB, `solve:ip:${getClientIp(request)}`, intVar(env.SOLVE_LIMIT_PER_IP_PER_HOUR, 90), HOUR);

  // Take the lock atomically: insert, or reclaim a row that isn't being generated right now.
  const id = existing?.id ?? crypto.randomUUID();
  const ts = nowIso();
  const staleBefore = new Date(Date.now() - solveTimeoutMs(env) - 30_000).toISOString();
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
  const work = (async () => {
    try {
      const result = await solveProblem(model, VN_GRADE_9, problemText, {
        fallback,
        signal: AbortSignal.timeout(solveTimeoutMs(env)),
        log: (m) => console.log(`[solve ${scanId}/${questionId}] ${m}`),
        onProgress,
      });
      await writes;
      // Never store a lesson the app can't read: it would surface as a generic failure on every reload.
      const valid = ModelLessonSchema.safeParse(result.lesson);
      if (!valid.success) {
        console.error(`[solve ${scanId}/${questionId}] lesson fails the schema: ${valid.error.issues.slice(0, 3).map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
        throw new OcrFailure("malformed_output", "lesson fails the schema", true);
      }
      await env.DB.prepare(
        `UPDATE solutions SET status = 'ready', lesson_json = ?, verification_json = ?, error_code = NULL, model = ?, problem_key = ?,
           attempts = ?, duration_ms = ?, started_at = NULL, created_at = ?, updated_at = ? WHERE scan_id = ? AND question_id = ?`,
      )
        .bind(JSON.stringify(result.lesson), JSON.stringify(result.verification), result.model, key, result.attempts, result.durationMs, nowIso(), nowIso(), scanId, questionId)
        .run();
    } catch (err) {
      console.error(`[solve ${scanId}] failed`, err instanceof Error ? err.message : err);
      await writes;
      // A failed Regenerate (quota, timeout…) must not take away the lesson the student already had.
      if (existing?.status === "ready" && existing.lesson_json && sameText) {
        await env.DB.prepare(
          `UPDATE solutions SET status = 'ready', error_code = NULL, problem_hash = ?, model = ?, prompt_version = ?, started_at = NULL, updated_at = ?
           WHERE scan_id = ? AND question_id = ?`,
        )
          .bind(existing.problem_hash, existing.model, existing.prompt_version, nowIso(), scanId, questionId)
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
  // Keep generating (and save the result) even if the student leaves the screen.
  ctx.waitUntil(work);
  await work;
  if (keptPrevious) {
    // Tell the app the regenerate failed; the previous lesson is still there when the student reopens it.
    throw new ApiError(503, keptPrevious, "Regenerating failed; the previous lesson was kept.", keptPrevious !== "solve_quota_exhausted");
  }

  const row = await findSolution(env.DB, ownerId, scanId, questionId);
  if (!row) throw new ApiError(500, "internal_error", "Solution vanished.");
  return json({ solution: toApiSolution(row) } satisfies SolutionResponse);
}
