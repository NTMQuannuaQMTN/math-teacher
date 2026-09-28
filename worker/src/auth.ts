import { OPAQUE_TOKEN_PATTERN } from "../../shared/src/contract";
import { sha256Hex } from "./crypto";
import { ApiError } from "./http";

/**
 * Anonymous device identity (MVP auth).
 *
 * The app generates a 256-bit random token on first launch, keeps it in the
 * device's secure store, and sends it as `Authorization: Bearer <token>`.
 * The server never stores the token itself — only its SHA-256, which becomes
 * the `owner_id` on every row. Every query is scoped by owner_id, so one
 * device can never read or modify another device's scans.
 *
 * Trade-off (documented in ARCHITECTURE.md): anyone can mint a token, so this
 * is isolation, not identity. Abuse is bounded by per-IP rate limits. Real
 * accounts can later "adopt" a device's owner_id without a data migration.
 */
export async function requireOwner(request: Request): Promise<string> {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer (\S+)$/.exec(header);
  const token = match?.[1];
  if (!token || !OPAQUE_TOKEN_PATTERN.test(token) || token.length < 32) {
    throw new ApiError(401, "unauthorized", "Missing or invalid device token.");
  }
  return sha256Hex(`device:${token}`);
}
