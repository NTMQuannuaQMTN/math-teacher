import { intVar, type Env } from "./env";
import { ScanRepository } from "./db";
import { pruneRateLimits } from "./rateLimits";

/**
 * Deletes drafts (scans the student never confirmed) older than the retention
 * window, along with their images, and prunes old rate-limit counters.
 * Confirmed problems are never deleted automatically.
 */
export async function cleanupExpiredDrafts(env: Env, now = Date.now()): Promise<number> {
  const repo = new ScanRepository(env.DB);
  const days = intVar(env.DRAFT_RETENTION_DAYS, 7);
  const cutoff = new Date(now - days * 24 * 60 * 60 * 1000).toISOString();
  let deleted = 0;

  for (let batch = 0; batch < 10; batch++) {
    const expired = await repo.listExpiredDrafts(cutoff, 500);
    if (expired.length === 0) break;
    await env.IMAGES.delete(expired.map((row) => row.image_key));
    await repo.deleteByIds(expired.map((row) => row.id));
    deleted += expired.length;
  }

  await pruneRateLimits(env.DB, 2 * 24 * 60 * 60, now);
  console.log(`Cleanup removed ${deleted} expired drafts`);
  return deleted;
}
