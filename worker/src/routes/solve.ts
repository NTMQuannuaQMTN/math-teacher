import { SolveRequestSchema, VerificationSchema, ModelLessonSchema, type Solution, type SolutionResponse } from "../../../shared/src/solution";
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
import { GeminiJsonModel } from "../solver/gemini";
import { OpenAiJsonModel, type JsonModel } from "../solver/llm";
import { MOCK_SOLVE_SCENARIOS, MockJsonModel, type MockSolveScenario } from "../solver/mock";
import { solveProblem } from "../solver/pipeline";
import { selectSolverModelIds } from "../solver/routing";
import { PROMPT_VERSION } from "../solver/prompts";
import type { RouteContext } from "./scans";

interface SolutionRow {
  id: string;
  scan_id: string;
  question_id: string;
  owner_id: string;
  status: "pending" | "ready" | "failed";
  problem_hash: string;
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
    const choice = selectSolverModelIds(problemText, {
      cheap: env.SOLVER_MODEL || "gemini-2.5-flash",
      cheapEffort: env.SOLVER_REASONING_EFFORT || "low",
      strong: env.SOLVER_FALLBACK_MODEL || "gemini-2.5-pro",
      strongEffort: env.SOLVER_FALLBACK_REASONING_EFFORT || "medium",
      // Geometry also starts on flash; escalate to pro only when checks fail.
      geometry: env.SOLVER_GEOMETRY_MODEL || env.SOLVER_MODEL || "gemini-2.5-flash",
      geometryEffort: env.SOLVER_GEOMETRY_REASONING_EFFORT || "medium",
    });
    const model = new GeminiJsonModel(key, choice.primary, choice.primaryEffort);
    const fallback =
      choice.fallback && choice.fallback !== choice.primary
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
        ? { code: row.error_code ?? "internal_error", retryable: row.error_code !== "problem_not_confirmed" }
        : null,
    model: row.model,
    promptVersion: row.prompt_version,
    attempts: row.attempts,
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
  if (existing && existing.status === "ready" && existing.problem_hash === problemHash && !regenerate) {
    return json({ solution: toApiSolution(existing) } satisfies SolutionResponse);
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

  const work = (async () => {
    try {
      const result = await solveProblem(model, VN_GRADE_9, problemText, {
        fallback,
        signal: AbortSignal.timeout(solveTimeoutMs(env)),
        log: (m) => console.log(`[solve ${scanId}/${questionId}] ${m}`),
      });
      await env.DB.prepare(
        `UPDATE solutions SET status = 'ready', lesson_json = ?, verification_json = ?, error_code = NULL, model = ?,
           attempts = ?, duration_ms = ?, started_at = NULL, created_at = ?, updated_at = ? WHERE scan_id = ? AND question_id = ?`,
      )
        .bind(JSON.stringify(result.lesson), JSON.stringify(result.verification), result.model, result.attempts, result.durationMs, nowIso(), nowIso(), scanId, questionId)
        .run();
    } catch (err) {
      console.error(`[solve ${scanId}] failed`, err instanceof Error ? err.message : err);
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

  const row = await findSolution(env.DB, ownerId, scanId, questionId);
  if (!row) throw new ApiError(500, "internal_error", "Solution vanished.");
  return json({ solution: toApiSolution(row) } satisfies SolutionResponse);
}
