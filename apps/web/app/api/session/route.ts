// Guest session: Turnstile token in, httpOnly session cookie out. The token never reaches page scripts.
import {
  SESSION_COOKIE,
  apiOrigin,
  clearedSessionCookie,
  errorJson,
  gatewayHeaders,
  readCookie,
  sameOrigin,
  sessionCookie,
} from "@/lib/server/gateway";

export async function GET(request: Request): Promise<Response> {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return Response.json({ authenticated: false });
  const headers = gatewayHeaders(request);
  headers.set("Authorization", `Bearer ${token}`);
  try {
    const response = await fetch(`${apiOrigin()}/api/v1/auth/me`, { headers, cache: "no-store" });
    if (response.ok) return Response.json({ authenticated: true });
    return Response.json({ authenticated: false }, { headers: { "Set-Cookie": clearedSessionCookie() } });
  } catch {
    return errorJson(502, "api_unreachable", "Không kết nối được máy chủ. Hãy thử lại sau.");
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return errorJson(403, "forbidden", "Yêu cầu không hợp lệ.");
  let turnstileToken: string | null = null;
  try {
    const body = (await request.json()) as { turnstileToken?: unknown };
    turnstileToken = typeof body.turnstileToken === "string" ? body.turnstileToken : null;
  } catch {
    // empty body is allowed when Turnstile is disabled (development)
  }
  const headers = gatewayHeaders(request);
  headers.set("Content-Type", "application/json");
  let upstream: Response;
  try {
    upstream = await fetch(`${apiOrigin()}/api/v1/auth/guest`, {
      method: "POST",
      headers,
      body: JSON.stringify({ turnstile_token: turnstileToken }),
      cache: "no-store",
    });
  } catch {
    return errorJson(502, "api_unreachable", "Không kết nối được máy chủ. Hãy thử lại sau.");
  }
  if (!upstream.ok) {
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { "content-type": "application/json" },
    });
  }
  const session = (await upstream.json()) as { token: string; expires_at: string };
  return Response.json(
    { authenticated: true },
    { status: 201, headers: { "Set-Cookie": sessionCookie(session.token, new Date(session.expires_at)) } },
  );
}

export async function DELETE(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return errorJson(403, "forbidden", "Yêu cầu không hợp lệ.");
  const token = readCookie(request, SESSION_COOKIE);
  if (token) {
    const headers = gatewayHeaders(request);
    headers.set("Authorization", `Bearer ${token}`);
    await fetch(`${apiOrigin()}/api/v1/auth/logout`, { method: "POST", headers }).catch(() => undefined);
  }
  return new Response(null, { status: 204, headers: { "Set-Cookie": clearedSessionCookie() } });
}
