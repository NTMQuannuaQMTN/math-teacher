export const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json",
      // Locked-down defaults: this API is same-purpose (one mobile app), not a public
      // browser-facing API, so we don't need a permissive CORS story here.
      "x-content-type-options": "nosniff",
      ...(init?.headers ?? {}),
    },
  });
}

export function errorResponse(status: number, message: string, code?: string): Response {
  return jsonResponse({ error: message, code: code ?? "error" }, { status });
}

/** Duck-typed check instead of `instanceof File`: zod's internals declare an
 * ambient global `File` shim that collides with Workers' own `File` class
 * type under `types: ["@cloudflare/workers-types"]`, making `instanceof`
 * unreliable at the type level. This checks the shape we actually need. */
export function isUploadedFile(value: File | string | null): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as File).arrayBuffer === "function" &&
    typeof (value as File).size === "number" &&
    typeof (value as File).type === "string"
  );
}

/** The multipart `Content-Type` field is attacker-controlled metadata, not a
 * guarantee about the actual bytes. This checks real magic bytes so a file
 * mislabeled (accidentally or deliberately) as an allowed image type can't
 * slip past the extension/MIME check before being forwarded to the AI
 * provider or stored in R2. */
export function sniffImageType(bytes: ArrayBuffer): string | null {
  const b = new Uint8Array(bytes.slice(0, 12));
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (
    b.length >= 8 &&
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && // "RIFF"
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 // "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("CF-Connecting-IP") ??
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
