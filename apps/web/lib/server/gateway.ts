// Server-only helpers for the web gateway. Never import from client components:
// API_GATEWAY_SECRET must not reach the browser.
import "server-only";

export const SESSION_COOKIE = "mt_session";

export function apiOrigin(): string {
  const origin = process.env.API_ORIGIN;
  if (!origin) throw new Error("API_ORIGIN is not configured");
  return origin.replace(/\/$/, "");
}

/** Headers added to every request forwarded to the Python API. */
export function gatewayHeaders(request: Request): Headers {
  const headers = new Headers();
  const secret = process.env.API_GATEWAY_SECRET;
  if (secret) headers.set("X-Gateway-Secret", secret);
  const ip = request.headers.get("cf-connecting-ip");
  if (ip) headers.set("CF-Connecting-IP", ip);
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID().replace(/-/g, "");
  headers.set("X-Request-ID", requestId);
  return headers;
}

/** Reject cross-site state-changing requests (defence in depth on top of SameSite=Lax cookies). */
export function sameOrigin(request: Request): boolean {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD") return true;
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export function sessionCookie(token: string, expires: Date): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax${secure}; Expires=${expires.toUTCString()}`;
}

export function clearedSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function errorJson(status: number, code: string, message: string): Response {
  return Response.json({ error: { code, message, request_id: null, details: null } }, { status });
}
