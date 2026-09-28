import type { Env } from "./env";
import { hmacHex, timingSafeEqualHex } from "./crypto";
import { ApiError } from "./http";

/**
 * Signed, expiring image URLs.
 *
 * Images are private (R2 has no public access). Instead of requiring an auth
 * header on every <Image> request — which not every platform's image loader
 * supports — list/detail responses include a URL signed with HMAC over
 * (scan id, expiry). Expiry is rounded to the hour so URLs stay stable across
 * refreshes and image caches work.
 */
const TTL_SECONDS = 2 * 60 * 60;
const ROUND_SECONDS = 60 * 60;

function requireSecret(env: Env): string {
  const secret = env.IMAGE_URL_SECRET;
  if (!secret || secret.length < 16) {
    console.error("IMAGE_URL_SECRET is missing or too short");
    throw new ApiError(500, "internal_error", "Server is misconfigured.");
  }
  return secret;
}

export async function signImageUrl(
  env: Env,
  origin: string,
  scanId: string,
  now = Date.now(),
): Promise<{ url: string; expiresAt: string }> {
  const nowSeconds = Math.floor(now / 1000);
  const expires = Math.ceil((nowSeconds + TTL_SECONDS) / ROUND_SECONDS) * ROUND_SECONDS;
  const sig = await hmacHex(requireSecret(env), `${scanId}.${expires}`);
  return {
    url: `${origin}/v1/images/${encodeURIComponent(scanId)}?exp=${expires}&sig=${sig}`,
    expiresAt: new Date(expires * 1000).toISOString(),
  };
}

export async function verifyImageSignature(
  env: Env,
  scanId: string,
  exp: string | null,
  sig: string | null,
  now = Date.now(),
): Promise<boolean> {
  if (!exp || !sig || !/^\d{1,12}$/.test(exp) || !/^[0-9a-f]{64}$/.test(sig)) return false;
  if (Number(exp) * 1000 < now) return false;
  const expected = await hmacHex(requireSecret(env), `${scanId}.${exp}`);
  return timingSafeEqualHex(expected, sig);
}
