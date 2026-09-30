/**
 * Native stub: screen capture and document (PDF) upload are web-only features.
 * On iOS/Android the camera and photo picker are used instead. See webSources.web.ts.
 */
import type { LocalImage } from "./imagePrep";

export type SourceOutcome =
  | { kind: "picked"; image: LocalImage }
  | { kind: "pdf"; name: string; pages: number }
  | { kind: "canceled" }
  | { kind: "error"; reason: "unsupported" | "invalid_type" | "too_large" | "too_small" | "corrupted" | "failed" };

const unsupported = async (): Promise<SourceOutcome> => ({ kind: "error", reason: "unsupported" });

export const canCaptureScreen = (): boolean => false;
export const captureScreen = unsupported;
export const pickDocument = unsupported;
export const pdfPageImage = (_n: number) => unsupported();
export const pdfThumbnail = async (_n: number, _width?: number): Promise<string> => "";
export const openPdf = (): { name: string; pages: number } | null => null;
export const closePdf = async (): Promise<void> => undefined;
