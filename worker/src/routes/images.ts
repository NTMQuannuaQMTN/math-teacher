import type { Env } from "../env";
import { ApiError } from "../http";
import { verifyImageSignature } from "../imageUrls";
import { ScanRepository } from "../db";

/** GET /v1/images/:id?exp=&sig= — serves a private image to holders of a valid signed URL. */
export async function serveImage(request: Request, env: Env, id: string): Promise<Response> {
  const url = new URL(request.url);
  const valid = await verifyImageSignature(env, id, url.searchParams.get("exp"), url.searchParams.get("sig"));
  if (!valid) throw new ApiError(403, "unauthorized", "This image link is invalid or has expired.");

  const meta = await new ScanRepository(env.DB).findImage(id);
  if (!meta) throw new ApiError(404, "not_found", "Image not found.");

  let object: R2ObjectBody | null;
  try {
    object = await env.IMAGES.get(meta.image_key);
  } catch (err) {
    console.error("R2 get failed", err);
    throw new ApiError(503, "storage_error", "Image temporarily unavailable.", true);
  }
  if (!object) throw new ApiError(404, "not_found", "Image not found.");

  return new Response(object.body, {
    headers: {
      // Content type comes from our own byte sniffing at upload, never from the client.
      "content-type": meta.image_content_type,
      "content-length": String(object.size),
      "cache-control": "private, max-age=3600",
      "content-disposition": "inline",
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'",
      etag: object.httpEtag,
    },
  });
}
