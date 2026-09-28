import { ApiError } from "./http";

/**
 * Fixed-window counter in D1. The upsert is a single statement, so
 * concurrent requests can't both slip under the limit by reading a stale
 * count. Good enough to stop casual abuse of an endpoint that costs money.
 */
export async function consumeRateLimit(
  db: D1Database,
  bucket: string,
  limit: number,
  windowSeconds: number,
  now = Date.now(),
): Promise<void> {
  const windowStart = Math.floor(now / 1000 / windowSeconds) * windowSeconds;
  const row = await db
    .prepare(
      `INSERT INTO rate_limits (bucket, window_start, count) VALUES (?, ?, 1)
       ON CONFLICT (bucket, window_start) DO UPDATE SET count = count + 1
       RETURNING count`,
    )
    .bind(bucket, windowStart)
    .first<{ count: number }>();

  if ((row?.count ?? 0) > limit) {
    const retryAfter = windowStart + windowSeconds - Math.floor(now / 1000);
    throw new ApiError(
      429,
      "rate_limited",
      "Too many scans in a short time. Please wait a bit and try again.",
      true,
      { "retry-after": String(Math.max(1, retryAfter)) },
    );
  }
}

export async function pruneRateLimits(db: D1Database, olderThanSeconds: number, now = Date.now()): Promise<void> {
  await db
    .prepare("DELETE FROM rate_limits WHERE window_start < ?")
    .bind(Math.floor(now / 1000) - olderThanSeconds)
    .run();
}
