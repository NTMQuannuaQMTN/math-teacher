import { describe, expect, it } from "vitest";
import { requireOwner } from "../src/auth";
import type { Env } from "../src/env";
import { ApiError } from "../src/http";
import { inspectImage, validateImage } from "../src/images";
import { signImageUrl, verifyImageSignature } from "../src/imageUrls";

function png(width: number, height: number): ArrayBuffer {
  const bytes = new Uint8Array(33);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return bytes.buffer;
}

function jpeg(width: number, height: number): ArrayBuffer {
  // SOI, APP0 (len 16), SOF0 with height/width.
  const app0 = [0xff, 0xe0, 0x00, 0x10, ...new Array(14).fill(0)];
  const sof0 = [0xff, 0xc0, 0x00, 0x11, 0x08, height >> 8, height & 0xff, width >> 8, width & 0xff, 3, ...new Array(9).fill(0)];
  return new Uint8Array([0xff, 0xd8, ...app0, ...sof0, 0xff, 0xd9]).buffer;
}

function webpVp8x(width: number, height: number): ArrayBuffer {
  const b = new Uint8Array(30);
  b.set([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x58]);
  const w = width - 1;
  const h = height - 1;
  b.set([w & 0xff, (w >> 8) & 0xff, (w >> 16) & 0xff, h & 0xff, (h >> 8) & 0xff, (h >> 16) & 0xff], 24);
  return b.buffer;
}

function expectApiError(fn: () => unknown, code: string) {
  try {
    fn();
  } catch (err) {
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).code).toBe(code);
    return;
  }
  throw new Error("expected ApiError");
}

describe("image inspection", () => {
  it("reads PNG, JPEG, and WebP dimensions from bytes", () => {
    expect(inspectImage(png(800, 600))).toEqual({ contentType: "image/png", width: 800, height: 600 });
    expect(inspectImage(jpeg(1600, 1200))).toEqual({ contentType: "image/jpeg", width: 1600, height: 1200 });
    expect(inspectImage(webpVp8x(1024, 768))).toEqual({ contentType: "image/webp", width: 1024, height: 768 });
  });

  it("rejects non-images regardless of what the client claims", () => {
    const html = new TextEncoder().encode("<html><script>alert(1)</script></html>").buffer as ArrayBuffer;
    expect(inspectImage(html)).toBeNull();
    expectApiError(() => validateImage(html), "unsupported_image_type");
  });

  it("rejects truncated JPEGs with no frame header", () => {
    expect(inspectImage(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00]).buffer)).toBeNull();
  });

  it("rejects empty, oversized, tiny, and absurd images", () => {
    expectApiError(() => validateImage(new ArrayBuffer(0)), "invalid_image");
    expectApiError(() => validateImage(png(800, 600), 10), "image_too_large");
    expectApiError(() => validateImage(png(40, 40)), "image_too_small");
    expectApiError(() => validateImage(png(1000, 20)), "image_too_small");
    expectApiError(() => validateImage(png(50_000, 50_000)), "invalid_image");
  });

  it("accepts a normal photo", () => {
    expect(validateImage(jpeg(1600, 1200)).contentType).toBe("image/jpeg");
  });
});

describe("signed image URLs", () => {
  const env = { IMAGE_URL_SECRET: "test-secret-0123456789abcdef" } as Env;
  const id = "8a6e0804-2bd0-4672-b79f-d97900da21a4";

  it("verifies its own signature", async () => {
    const { url } = await signImageUrl(env, "https://api.test", id);
    const parsed = new URL(url);
    expect(await verifyImageSignature(env, id, parsed.searchParams.get("exp"), parsed.searchParams.get("sig"))).toBe(true);
  });

  it("rejects a signature for another scan, a tampered expiry, or an expired link", async () => {
    const { url } = await signImageUrl(env, "https://api.test", id);
    const parsed = new URL(url);
    const exp = parsed.searchParams.get("exp")!;
    const sig = parsed.searchParams.get("sig")!;
    expect(await verifyImageSignature(env, "00000000-0000-0000-0000-000000000000", exp, sig)).toBe(false);
    expect(await verifyImageSignature(env, id, String(Number(exp) + 3600), sig)).toBe(false);
    expect(await verifyImageSignature(env, id, exp, sig, Number(exp) * 1000 + 1)).toBe(false);
    expect(await verifyImageSignature(env, id, null, null)).toBe(false);
  });

  it("produces stable URLs within the same hour (cache friendly)", async () => {
    const t = Date.UTC(2026, 0, 1, 10, 5);
    const a = await signImageUrl(env, "https://api.test", id, t);
    const b = await signImageUrl(env, "https://api.test", id, t + 60_000);
    expect(a.url).toBe(b.url);
  });
});

describe("device auth", () => {
  const token = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ";
  const request = (auth?: string) =>
    new Request("https://api.test/v1/scans", { headers: auth ? { authorization: auth } : {} });

  it("derives a stable owner id that is not the token", async () => {
    const a = await requireOwner(request(`Bearer ${token}`));
    const b = await requireOwner(request(`Bearer ${token}`));
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toContain(token);
  });

  it("gives different devices different owners", async () => {
    const other = await requireOwner(request(`Bearer ${token.replace("a", "b")}`));
    expect(other).not.toBe(await requireOwner(request(`Bearer ${token}`)));
  });

  it("rejects missing, short, or malformed tokens", async () => {
    for (const header of [undefined, "Bearer", "Bearer short", `Basic ${token}`, `Bearer ${token}!`]) {
      await expect(requireOwner(request(header))).rejects.toMatchObject({ code: "unauthorized" });
    }
  });
});
