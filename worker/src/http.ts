import type { ApiErrorBody, ErrorCode } from "../../shared/src/contract";

/**
 * An error that is safe to show the client. Anything thrown that is NOT an
 * ApiError becomes a generic 500 — internal messages never reach the client.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly retryable = false,
    readonly headers: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const SECURITY_HEADERS: Record<string, string> = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  "cache-control": "no-store",
};

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...SECURITY_HEADERS, ...headers },
  });
}

export function errorResponse(error: ApiError): Response {
  const body: ApiErrorBody = {
    error: { code: error.code, message: error.message, retryable: error.retryable },
  };
  return json(body, error.status, error.headers);
}

export function noContent(): Response {
  return new Response(null, { status: 204, headers: SECURITY_HEADERS });
}

/**
 * CORS is only needed for the Expo web build during development; native apps
 * don't send Origin. Only explicitly configured origins are echoed back.
 */
export function corsHeaders(request: Request, allowedOrigins: string): Record<string, string> {
  const origin = request.headers.get("origin");
  if (!origin) return {};
  const allowed = allowedOrigins
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  if (!allowed.includes(origin)) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
    "access-control-allow-headers": "authorization, content-type, idempotency-key",
    "access-control-max-age": "600",
    vary: "origin",
  };
}

export function withHeaders(response: Response, headers: Record<string, string>): Response {
  if (Object.keys(headers).length === 0) return response;
  const copy = new Response(response.body, response);
  for (const [key, value] of Object.entries(headers)) copy.headers.set(key, value);
  return copy;
}

export function getClientIp(request: Request): string {
  // On Cloudflare, CF-Connecting-IP is set by the edge and cannot be spoofed by the client.
  return request.headers.get("cf-connecting-ip") ?? "local";
}
