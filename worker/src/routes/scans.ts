import {
  ConfirmScanRequestSchema,
  IDEMPOTENCY_HEADER,
  LIMITS,
  ListScansQuerySchema,
  OPAQUE_TOKEN_PATTERN,
  ScanSourceSchema,
  type AllowedImageType,
  type OcrResult,
  type ScanListResponse,
  type ScanResponse,
} from "../../../shared/src/contract";
import { normalizeProblemText } from "../../../shared/src/mathText";
import { intVar, type Env } from "../env";
import { ApiError, getClientIp, json, noContent } from "../http";
import { validateImage } from "../images";
import { consumeRateLimit } from "../rateLimits";
import { isUniqueViolation, ScanRepository, toApiScan, type ScanRow } from "../db";
import { createOcrProvider, ocrFailureToApiError, runOcr } from "../ocr/service";
import { OcrFailure, type OcrProvider } from "../ocr/provider";

export interface RouteContext {
  request: Request;
  env: Env;
  ctx: ExecutionContext;
  ownerId: string;
  origin: string;
}

const HOUR = 60 * 60;

function ocrLockTimeoutMs(env: Env): number {
  // A lock older than the OCR timeout (+ margin) belongs to a request that died.
  return intVar(env.OCR_TIMEOUT_MS, 45_000) + 30_000;
}

async function enforceOcrRateLimits(env: Env, request: Request, ownerId: string): Promise<void> {
  await consumeRateLimit(env.DB, `ocr:device:${ownerId}`, intVar(env.OCR_LIMIT_PER_DEVICE_PER_HOUR, 40), HOUR);
  await consumeRateLimit(env.DB, `ocr:ip:${getClientIp(request)}`, intVar(env.OCR_LIMIT_PER_IP_PER_HOUR, 120), HOUR);
}

function inProgressError(): ApiError {
  return new ApiError(409, "ocr_in_progress", "This image is still being read. Please wait a moment.", true);
}

/**
 * Runs OCR for a scan whose lock is held and records the outcome.
 * Wrapped in waitUntil so that if the student leaves the screen (client
 * disconnects), the result is still saved and shows up as an unfinished scan.
 */
async function performOcr(
  rc: RouteContext,
  repo: ScanRepository,
  provider: OcrProvider,
  scanId: string,
  image: { bytes: ArrayBuffer; contentType: AllowedImageType },
): Promise<void> {
  const work = (async () => {
    try {
      const ocr: OcrResult = await runOcr(provider, rc.env, image);
      await repo.saveOcrSuccess(scanId, ocr);
    } catch (err) {
      if (!(err instanceof OcrFailure)) throw err;
      console.error(`OCR failed for scan ${scanId}: ${err.kind}: ${err.message}`);
      await repo.saveOcrFailure(scanId, ocrFailureToApiError(err).code);
    }
  })();
  rc.ctx.waitUntil(work.catch(() => undefined));
  await work;
}

async function respondWithScan(rc: RouteContext, repo: ScanRepository, id: string, status = 200): Promise<Response> {
  const row = await repo.findOwned(rc.ownerId, id);
  if (!row) throw new ApiError(404, "not_found", "Scan not found.");
  const body: ScanResponse = { scan: await toApiScan(rc.env, rc.origin, row) };
  return json(body, status);
}

function readIdempotencyKey(request: Request): string | null {
  const key = request.headers.get(IDEMPOTENCY_HEADER);
  if (key === null) return null;
  if (!OPAQUE_TOKEN_PATTERN.test(key)) {
    throw new ApiError(400, "bad_request", "Invalid idempotency key.");
  }
  return key;
}

function isOcrRunning(row: ScanRow, env: Env): boolean {
  return row.ocr_started_at !== null && Date.parse(row.ocr_started_at) > Date.now() - ocrLockTimeoutMs(env);
}

/** POST /v1/scans — upload an image and run OCR on it. */
export async function createScan(rc: RouteContext): Promise<Response> {
  const { request, env, ownerId } = rc;
  const repo = new ScanRepository(env.DB);
  const idempotencyKey = readIdempotencyKey(request);

  // A retried upload (network blip, double tap) returns the original scan.
  if (idempotencyKey) {
    const existing = await repo.findByIdempotencyKey(ownerId, idempotencyKey);
    if (existing) {
      if (isOcrRunning(existing, env)) throw inProgressError();
      return respondWithScan(rc, repo, existing.id);
    }
  }

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (declaredLength > LIMITS.maxUploadBytes + 64 * 1024) {
    throw new ApiError(413, "image_too_large", "Image is too large. The limit is 8 MB.");
  }

  // Resolve the provider first: if OCR is misconfigured, fail before storing anything.
  const provider = createOcrProvider(env, request);
  await enforceOcrRateLimits(env, request, ownerId);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw new ApiError(400, "bad_request", "Expected a multipart form with an 'image' file.");
  }
  const file = form.get("image");
  if (file === null || typeof file === "string") {
    throw new ApiError(400, "missing_image", "No image was uploaded.");
  }
  const sourceField = form.get("source");
  const source = ScanSourceSchema.catch("library").parse(typeof sourceField === "string" ? sourceField : undefined);

  const bytes = await file.arrayBuffer();
  const info = validateImage(bytes);

  const id = crypto.randomUUID();
  // Owner prefix keeps each device's images grouped (useful for per-user deletion later).
  const imageKey = `scans/${ownerId.slice(0, 16)}/${id}`;

  try {
    await env.IMAGES.put(imageKey, bytes, { httpMetadata: { contentType: info.contentType } });
  } catch (err) {
    console.error("R2 put failed", err);
    throw new ApiError(503, "storage_error", "We couldn't save your image. Please try again.", true);
  }

  try {
    await repo.insertDraft({
      id,
      ownerId,
      idempotencyKey,
      source,
      imageKey,
      imageContentType: info.contentType,
      imageBytes: bytes.byteLength,
      imageWidth: info.width,
      imageHeight: info.height,
    });
  } catch (err) {
    await env.IMAGES.delete(imageKey).catch(() => undefined);
    if (idempotencyKey && isUniqueViolation(err)) {
      // Lost a race with a concurrent duplicate request.
      throw inProgressError();
    }
    throw err;
  }

  await performOcr(rc, repo, provider, id, { bytes, contentType: info.contentType });
  return respondWithScan(rc, repo, id, 201);
}

/** POST /v1/scans/:id/ocr — run OCR again on the stored image. */
export async function retryOcr(rc: RouteContext, id: string): Promise<Response> {
  const { env, ownerId, request } = rc;
  const repo = new ScanRepository(env.DB);
  const row = await repo.findOwned(ownerId, id);
  if (!row) throw new ApiError(404, "not_found", "Scan not found.");
  if (row.status !== "draft") {
    throw new ApiError(400, "bad_request", "This problem is already saved.");
  }

  const provider = createOcrProvider(env, request);
  await enforceOcrRateLimits(env, request, ownerId);
  if (!(await repo.tryLockOcr(ownerId, id, ocrLockTimeoutMs(env)))) throw inProgressError();

  let object: R2ObjectBody | null;
  try {
    object = await env.IMAGES.get(row.image_key);
  } catch (err) {
    console.error("R2 get failed", err);
    await repo.saveOcrFailure(id, "storage_error");
    throw new ApiError(503, "storage_error", "We couldn't load your image. Please try again.", true);
  }
  if (!object) {
    await repo.saveOcrFailure(id, "storage_error");
    throw new ApiError(410, "storage_error", "The original image is no longer available. Please scan it again.");
  }

  const bytes = await object.arrayBuffer();
  await performOcr(rc, repo, provider, id, { bytes, contentType: row.image_content_type as AllowedImageType });
  return respondWithScan(rc, repo, id);
}

/** POST /v1/scans/:id/confirm — save the student-verified problem text. */
export async function confirmScan(rc: RouteContext, id: string): Promise<Response> {
  const { request, env, ownerId } = rc;
  const repo = new ScanRepository(env.DB);

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    throw new ApiError(400, "bad_request", "Expected a JSON body.");
  }
  const parsed = ConfirmScanRequestSchema.safeParse(payload);
  if (!parsed.success) {
    const tooLong = parsed.error.issues.some((issue) => issue.code === "too_big");
    throw tooLong
      ? new ApiError(400, "text_too_long", `The problem is too long (max ${LIMITS.maxProblemChars} characters).`)
      : new ApiError(400, "bad_request", "Invalid request body.");
  }

  // One problem, or the questions the student kept from the OCR split (empty ones dropped).
  const kept = (parsed.data.questions ?? [{ label: "", text: parsed.data.text ?? "" }])
    .map((q) => ({ label: normalizeProblemText(q.label).slice(0, 40), text: normalizeProblemText(q.text) }))
    .filter((q) => q.text.length > 0);
  if (kept.length === 0) throw new ApiError(400, "empty_text", "The problem text is empty.");
  const questions = kept.map((q, i) => ({ id: `q${i + 1}`, ...q }));
  const text = questions.map((q) => q.text).join("\n\n");
  if (text.length > LIMITS.maxProblemChars * 2) {
    throw new ApiError(400, "text_too_long", `The problem is too long (max ${LIMITS.maxProblemChars} characters).`);
  }

  const row = await repo.findOwned(ownerId, id);
  if (!row) throw new ApiError(404, "not_found", "Scan not found.");

  const ocr = row.ocr_json ? (JSON.parse(row.ocr_json) as OcrResult) : null;
  const ocrTexts = ocr?.problems?.length ? ocr.problems.map((p) => p.text) : [ocr?.formattedText ?? ""];
  const edited =
    questions.length !== ocrTexts.length || questions.some((q, i) => q.text !== normalizeProblemText(ocrTexts[i] ?? ""));
  await repo.confirm(ownerId, id, text, questions, edited);
  return respondWithScan(rc, repo, id);
}

/** GET /v1/scans/:id */
export async function getScan(rc: RouteContext, id: string): Promise<Response> {
  return respondWithScan(rc, new ScanRepository(rc.env.DB), id);
}

/** DELETE /v1/scans/:id */
export async function deleteScan(rc: RouteContext, id: string): Promise<Response> {
  const repo = new ScanRepository(rc.env.DB);
  const row = await repo.findOwned(rc.ownerId, id);
  if (!row) throw new ApiError(404, "not_found", "Scan not found.");
  await repo.delete(rc.ownerId, id);
  // Best effort: an orphaned object is harmless (unreachable without a row) and cheap.
  rc.ctx.waitUntil(rc.env.IMAGES.delete(row.image_key).catch((err) => console.error("R2 delete failed", err)));
  return noContent();
}

function encodeCursor(time: string, id: string): string {
  return btoa(`${time}|${id}`).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeCursor(cursor: string): { time: string; id: string } {
  try {
    const decoded = atob(cursor.replace(/-/g, "+").replace(/_/g, "/"));
    const [time, id] = decoded.split("|");
    if (time && id && !Number.isNaN(Date.parse(time))) return { time, id };
  } catch {
    // fall through
  }
  throw new ApiError(400, "bad_request", "Invalid cursor.");
}

/** GET /v1/scans?status=confirmed|draft&limit=&cursor= */
export async function listScans(rc: RouteContext): Promise<Response> {
  const url = new URL(rc.request.url);
  const parsed = ListScansQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) throw new ApiError(400, "bad_request", "Invalid query.");
  const { status, limit, cursor } = parsed.data;

  const repo = new ScanRepository(rc.env.DB);
  // Drafts are only useful as "continue where you left off"; hide stale ones.
  const draftWindowStart =
    status === "draft" ? new Date(Date.now() - 24 * HOUR * 1000).toISOString() : null;
  const rows = await repo.list(rc.ownerId, status, limit + 1, cursor ? decodeCursor(cursor) : null, draftWindowStart);

  const page = rows.slice(0, limit);
  const last = page.at(-1);
  const nextCursor =
    rows.length > limit && last
      ? encodeCursor(status === "confirmed" ? last.confirmed_at ?? last.created_at : last.created_at, last.id)
      : null;

  const body: ScanListResponse = {
    items: await Promise.all(page.map((row) => toApiScan(rc.env, rc.origin, row))),
    nextCursor,
  };
  return json(body);
}
