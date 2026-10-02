import { requireOwner } from "./auth";
import { cleanupExpiredDrafts } from "./cleanup";
import type { Env } from "./env";
import { ApiError, corsHeaders, errorResponse, json, withHeaders } from "./http";
import { serveImage } from "./routes/images";
import { createFeedback, listFeedback } from "./routes/feedback";
import { getSolution, solveScan } from "./routes/solve";
import {
  confirmScan,
  createScan,
  deleteScan,
  getScan,
  listScans,
  retryOcr,
  type RouteContext,
} from "./routes/scans";

const SCAN_ID = "([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})";
const SCAN_PATH = new RegExp(`^/v1/scans/${SCAN_ID}$`);
const SCAN_ACTION_PATH = new RegExp(`^/v1/scans/${SCAN_ID}/(ocr|confirm|solve)$`);
const SOLUTION_PATH = new RegExp(`^/v1/scans/${SCAN_ID}/solution$`);
const QUESTION_PATH = new RegExp(`^/v1/scans/${SCAN_ID}/questions/(q\\d{1,2})/(solve|solution|feedback)$`);
const IMAGE_PATH = new RegExp(`^/v1/images/${SCAN_ID}$`);

async function route(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  const { pathname } = url;
  const method = request.method;

  if (pathname === "/health" && method === "GET") {
    return json({ ok: true, api: "v1" });
  }

  // Signed URL is the credential here; no auth header (image loaders can't send one everywhere).
  const imageMatch = IMAGE_PATH.exec(pathname);
  if (imageMatch && method === "GET") return serveImage(request, env, imageMatch[1]!);

  if (!pathname.startsWith("/v1/")) throw new ApiError(404, "not_found", "Not found.");

  const rc: RouteContext = { request, env, ctx, ownerId: await requireOwner(request), origin: url.origin };

  if (pathname === "/v1/feedback" && method === "GET") return listFeedback(rc);
  if (pathname === "/v1/scans") {
    if (method === "POST") return createScan(rc);
    if (method === "GET") return listScans(rc);
  }
  const scanMatch = SCAN_PATH.exec(pathname);
  if (scanMatch) {
    if (method === "GET") return getScan(rc, scanMatch[1]!);
    if (method === "DELETE") return deleteScan(rc, scanMatch[1]!);
  }
  const actionMatch = SCAN_ACTION_PATH.exec(pathname);
  if (actionMatch && method === "POST") {
    const [, scanId, action] = actionMatch;
    if (action === "ocr") return retryOcr(rc, scanId!);
    if (action === "solve") return solveScan(rc, scanId!);
    return confirmScan(rc, scanId!);
  }
  const solutionMatch = SOLUTION_PATH.exec(pathname);
  if (solutionMatch && method === "GET") return getSolution(rc, solutionMatch[1]!);
  // Per-question lessons (a photo can hold several questions). The routes above are aliases for q1.
  const questionMatch = QUESTION_PATH.exec(pathname);
  if (questionMatch) {
    const [, scanId, questionId, action] = questionMatch;
    if (action === "solve" && method === "POST") return solveScan(rc, scanId!, questionId!);
    if (action === "solution" && method === "GET") return getSolution(rc, scanId!, questionId!);
    if (action === "feedback" && method === "POST") return createFeedback(rc, scanId!, questionId!);
  }
  throw new ApiError(404, "not_found", "Not found.");
}

function toErrorResponse(err: unknown): Response {
  if (err instanceof ApiError) return errorResponse(err);
  // D1 errors surface as plain Errors whose message starts with "D1_".
  if (err instanceof Error && /^D1_|SQLITE/i.test(err.message)) {
    console.error("Database error", err.message);
    return errorResponse(new ApiError(503, "database_error", "Something went wrong saving your data. Please try again.", true));
  }
  console.error("Unhandled error", err);
  return errorResponse(new ApiError(500, "internal_error", "Something went wrong. Please try again.", true));
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const cors = corsHeaders(request, env.ALLOWED_ORIGINS ?? "");
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    let response: Response;
    try {
      response = await route(request, env, ctx);
    } catch (err) {
      response = toErrorResponse(err);
    }
    return withHeaders(response, cors);
  },

  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(cleanupExpiredDrafts(env));
  },
} satisfies ExportedHandler<Env>;
