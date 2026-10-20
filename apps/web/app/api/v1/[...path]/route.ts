// Gateway: forwards /api/v1/* to the Python API with the session token and gateway secret.
import {
  SESSION_COOKIE,
  apiOrigin,
  errorJson,
  gatewayHeaders,
  readCookie,
  sameOrigin,
} from "@/lib/server/gateway";

const FORWARD_REQUEST_HEADERS = ["content-type", "accept", "cf-access-jwt-assertion"];
const FORWARD_RESPONSE_HEADERS = [
  "content-type",
  "cache-control",
  "content-disposition",
  "retry-after",
  "x-request-id",
  "x-content-type-options",
  "content-security-policy",
];
const MAX_BODY_BYTES = 21 * 1024 * 1024;
const TIMEOUT_MS = 60_000;

async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }): Promise<Response> {
  if (!sameOrigin(request)) {
    return errorJson(403, "forbidden", "Yêu cầu không hợp lệ (khác nguồn gốc).");
  }
  const { path } = await context.params;
  if (path.some((segment) => segment === ".." || segment.includes("/"))) {
    return errorJson(400, "bad_request", "Đường dẫn không hợp lệ.");
  }
  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > MAX_BODY_BYTES) {
    return errorJson(413, "payload_too_large", "Tệp quá lớn.");
  }

  const url = new URL(request.url);
  const target = `${apiOrigin()}/api/v1/${path.map(encodeURIComponent).join("/")}${url.search}`;
  const headers = gatewayHeaders(request);
  for (const name of FORWARD_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const token = readCookie(request, SESSION_COOKIE);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  // Development convenience only: the API refuses dev admin tokens when ENVIRONMENT=production,
  // and production deployments must not set ADMIN_DEV_TOKEN (Cloudflare Access is used instead).
  if (path[0] === "admin" && process.env.ADMIN_DEV_TOKEN) {
    headers.set("X-Admin-Token", process.env.ADMIN_DEV_TOKEN);
  }

  const hasBody = !["GET", "HEAD"].includes(request.method);
  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: "manual",
      cache: "no-store",
    });
  } catch {
    return errorJson(502, "api_unreachable", "Không kết nối được máy chủ. Hãy thử lại sau.");
  }

  const responseHeaders = new Headers();
  for (const name of FORWARD_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}

export { proxy as GET, proxy as POST, proxy as PATCH, proxy as PUT, proxy as DELETE };
