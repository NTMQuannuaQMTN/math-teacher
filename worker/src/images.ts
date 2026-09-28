import { LIMITS, type AllowedImageType } from "../../shared/src/contract";
import { ApiError } from "./http";

export interface ImageInfo {
  contentType: AllowedImageType;
  width: number;
  height: number;
}

/**
 * Identifies the image from its bytes (never from the client-declared MIME
 * type or file name) and reads its pixel dimensions from the header.
 * Returns null if the bytes are not a well-formed JPEG, PNG, or WebP header.
 */
export function inspectImage(buffer: ArrayBuffer): ImageInfo | null {
  const b = new Uint8Array(buffer);
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return inspectJpeg(b);
  if (
    b.length >= 24 &&
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  ) {
    // IHDR is always the first chunk: width/height are big-endian at offsets 16/20.
    const view = new DataView(buffer);
    return { contentType: "image/png", width: view.getUint32(16), height: view.getUint32(20) };
  }
  if (
    b.length >= 30 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) {
    return inspectWebp(b);
  }
  return null;
}

function inspectJpeg(b: Uint8Array): ImageInfo | null {
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) return null;
    const marker = b[i + 1]!;
    if (marker === 0xff) {
      i += 1; // fill byte
      continue;
    }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2; // markers without a length
      continue;
    }
    const length = (b[i + 2]! << 8) | b[i + 3]!;
    if (length < 2) return null;
    // SOF0..SOF15 except DHT (C4), JPG (C8), DAC (CC) carry the frame size.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      const height = (b[i + 5]! << 8) | b[i + 6]!;
      const width = (b[i + 7]! << 8) | b[i + 8]!;
      return { contentType: "image/jpeg", width, height };
    }
    i += 2 + length;
  }
  return null;
}

function inspectWebp(b: Uint8Array): ImageInfo | null {
  const chunk = String.fromCharCode(b[12]!, b[13]!, b[14]!, b[15]!);
  if (chunk === "VP8X") {
    const width = 1 + (b[24]! | (b[25]! << 8) | (b[26]! << 16));
    const height = 1 + (b[27]! | (b[28]! << 8) | (b[29]! << 16));
    return { contentType: "image/webp", width, height };
  }
  if (chunk === "VP8 ") {
    // Keyframe start code 9d 01 2a at offset 23, then 14-bit width/height.
    if (b[23] !== 0x9d || b[24] !== 0x01 || b[25] !== 0x2a) return null;
    const width = (b[26]! | (b[27]! << 8)) & 0x3fff;
    const height = (b[28]! | (b[29]! << 8)) & 0x3fff;
    return { contentType: "image/webp", width, height };
  }
  if (chunk === "VP8L") {
    if (b[20] !== 0x2f) return null;
    const bits = b[21]! | (b[22]! << 8) | (b[23]! << 16) | (b[24]! << 24);
    const width = (bits & 0x3fff) + 1;
    const height = ((bits >>> 14) & 0x3fff) + 1;
    return { contentType: "image/webp", width, height };
  }
  return null;
}

/** Validates an uploaded image and returns its verified type and dimensions. */
export function validateImage(buffer: ArrayBuffer, maxBytes: number = LIMITS.maxUploadBytes): ImageInfo {
  if (buffer.byteLength === 0) {
    throw new ApiError(400, "invalid_image", "The uploaded file is empty.");
  }
  if (buffer.byteLength > maxBytes) {
    throw new ApiError(413, "image_too_large", `Image is too large. The limit is ${Math.floor(maxBytes / 1024 / 1024)} MB.`);
  }
  const info = inspectImage(buffer);
  if (!info) {
    throw new ApiError(415, "unsupported_image_type", "The file is not a valid JPEG, PNG, or WebP image.");
  }
  if (info.width <= 0 || info.height <= 0 || info.width > LIMITS.maxImageSide || info.height > LIMITS.maxImageSide) {
    throw new ApiError(400, "invalid_image", "The image dimensions are invalid.");
  }
  if (Math.min(info.width, info.height) < LIMITS.minImageSide || info.width * info.height < LIMITS.minImagePixels) {
    throw new ApiError(400, "image_too_small", "The image is too small to read. Take a closer photo of the problem.");
  }
  return info;
}
