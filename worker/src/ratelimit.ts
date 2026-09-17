import type { Env } from "./types";

/** Fixed-window per-IP rate limit backed by D1. Not perfectly race-free under
 * heavy concurrency, but more than sufficient to stop casual abuse of an
 * MVP endpoint that fans out to a paid LLM API. */
export async function checkRateLimit(env: Env, ip: string): Promise<boolean> {
  const limit = Number.parseInt(env.RATE_LIMIT_PER_HOUR, 10) || 10;
  const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const row = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM request_log WHERE ip = ? AND created_at > ?"
  )
    .bind(ip, windowStart)
    .first<{ count: number }>();

  if ((row?.count ?? 0) >= limit) {
    return false;
  }

  await env.DB.prepare("INSERT INTO request_log (ip) VALUES (?)").bind(ip).run();
  return true;
}
