import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { LIMITS } from "@shared/contract";

/** A local image ready to show or upload. Always JPEG after `prepareForUpload`. */
export interface LocalImage {
  uri: string;
  width: number;
  height: number;
}

export interface CropRect {
  originX: number;
  originY: number;
  width: number;
  height: number;
}

/**
 * Upload resolution: long side ≤ 1280 px. Vision APIs bill by image patches/tiles,
 * so pixel count drives OCR cost more than JPEG bytes. At 1280 px a textbook line
 * is still ~25–40 px tall (readable for OCR) while patch count drops vs 2000 px.
 * Typical upload is ~100–350 KB instead of 3–12 MB.
 */
export const MAX_UPLOAD_SIDE = 1280;
const JPEG_QUALITY = 0.82;

export class ImagePrepError extends Error {
  constructor(readonly reason: "too_small" | "failed") {
    super(reason);
    this.name = "ImagePrepError";
  }
}

function clampCrop(crop: CropRect, image: LocalImage): CropRect {
  const originX = Math.max(0, Math.min(Math.round(crop.originX), image.width - 1));
  const originY = Math.max(0, Math.min(Math.round(crop.originY), image.height - 1));
  return {
    originX,
    originY,
    width: Math.max(1, Math.min(Math.round(crop.width), image.width - originX)),
    height: Math.max(1, Math.min(Math.round(crop.height), image.height - originY)),
  };
}

/** Crops (optional), downsizes, and re-encodes to JPEG. HEIC/PNG/WebP all come out as JPEG. */
export async function prepareForUpload(image: LocalImage, crop: CropRect | null): Promise<LocalImage> {
  const region = crop ? clampCrop(crop, image) : { originX: 0, originY: 0, width: image.width, height: image.height };
  if (
    Math.min(region.width, region.height) < LIMITS.minImageSide ||
    region.width * region.height < LIMITS.minImagePixels
  ) {
    throw new ImagePrepError("too_small");
  }

  try {
    const context = ImageManipulator.manipulate(image.uri);
    const isFullImage = region.width === image.width && region.height === image.height;
    if (!isFullImage) context.crop(region);
    const longSide = Math.max(region.width, region.height);
    if (longSide > MAX_UPLOAD_SIDE) {
      context.resize(region.width >= region.height ? { width: MAX_UPLOAD_SIDE } : { height: MAX_UPLOAD_SIDE });
    }
    const rendered = await context.renderAsync();
    const saved = await rendered.saveAsync({ compress: JPEG_QUALITY, format: SaveFormat.JPEG });
    return { uri: saved.uri, width: saved.width, height: saved.height };
  } catch (err) {
    console.warn("prepareForUpload failed", err);
    throw new ImagePrepError("failed");
  }
}

/** Rotates 90° clockwise and returns the new image (used by the review screen). */
export async function rotateClockwise(image: LocalImage): Promise<LocalImage> {
  try {
    const rendered = await ImageManipulator.manipulate(image.uri).rotate(90).renderAsync();
    const saved = await rendered.saveAsync({ compress: 0.95, format: SaveFormat.JPEG });
    return { uri: saved.uri, width: saved.width, height: saved.height };
  } catch (err) {
    console.warn("rotate failed", err);
    throw new ImagePrepError("failed");
  }
}

/**
 * Normalizes a freshly captured/picked image: re-encodes it (fixing EXIF
 * orientation and converting HEIC) and caps working resolution, so every
 * later step deals with an upright JPEG of known size.
 */
export async function normalizeSource(uri: string): Promise<LocalImage> {
  try {
    const context = ImageManipulator.manipulate(uri);
    const probe = await context.renderAsync();
    let { width, height } = probe;
    if (!width || !height) throw new Error("image has no dimensions");
    const WORKING_MAX = 3000;
    if (Math.max(width, height) > WORKING_MAX) {
      context.resize(width >= height ? { width: WORKING_MAX } : { height: WORKING_MAX });
    }
    const rendered = await context.renderAsync();
    const saved = await rendered.saveAsync({ compress: 0.92, format: SaveFormat.JPEG });
    width = saved.width;
    height = saved.height;
    return { uri: saved.uri, width, height };
  } catch (err) {
    console.warn("normalizeSource failed", err);
    throw new ImagePrepError("failed");
  }
}
