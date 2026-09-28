import type { ScanSource } from "@shared/contract";
import type { CropRect, LocalImage } from "@/lib/imagePrep";
import { randomToken } from "@/lib/random";

/**
 * The image moving through camera → review → processing. Kept in memory
 * (file URIs are cheap to pass around, but crop suggestions and the
 * idempotency key are not route-param material).
 *
 * If the app restarts mid-flow this is empty and screens send the student
 * home; any upload that already reached the server shows up there as an
 * unfinished scan, so nothing is lost.
 */
export interface ScanDraft {
  source: ScanSource;
  /** The upright, full image the student captured or picked. */
  original: LocalImage;
  /** Crop suggested by the camera guide frame (image pixel coordinates). */
  suggestedCrop: CropRect | null;
  /** The cropped, upload-ready JPEG (set by the review screen). */
  prepared: LocalImage | null;
  /** One key per prepared image: retries of the same upload are deduplicated server-side. */
  idempotencyKey: string | null;
}

let current: ScanDraft | null = null;

export const scanDraft = {
  get(): ScanDraft | null {
    return current;
  },
  start(source: ScanSource, original: LocalImage, suggestedCrop: CropRect | null = null): void {
    current = { source, original, suggestedCrop, prepared: null, idempotencyKey: null };
  },
  replaceOriginal(original: LocalImage): void {
    if (current) current = { ...current, original, suggestedCrop: null, prepared: null, idempotencyKey: null };
  },
  setPrepared(prepared: LocalImage): void {
    if (current) current = { ...current, prepared, idempotencyKey: randomToken(24) };
  },
  clear(): void {
    current = null;
  },
};
