/**
 * Web-only ways to get a problem into the app:
 *   - captureScreen: the browser's screen/window/tab picker (getDisplayMedia); one frame is grabbed
 *     and sharing stops immediately.
 *   - pickDocument: an image or a PDF. PDFs are rendered in the browser with pdf.js (served from
 *     /pdfjs, copied at install time); multi-page PDFs are kept open so a page can be chosen.
 * Every result goes through normalizeSource, so the crop/review screen gets the same kind of image
 * as a camera photo.
 */
import { normalizeSource, type LocalImage } from "./imagePrep";

export type SourceOutcome =
  | { kind: "picked"; image: LocalImage }
  | { kind: "pdf"; name: string; pages: number }
  | { kind: "canceled" }
  | { kind: "error"; reason: "unsupported" | "invalid_type" | "too_large" | "too_small" | "corrupted" | "failed" };

const MAX_FILE_BYTES = 40 * 1024 * 1024;
const MIN_SIDE = 100;
const IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif", "image/gif", "image/bmp"]);
/** Rendering width for a chosen PDF page: enough for small print, then capped by normalizeSource. */
const PDF_PAGE_WIDTH = 2000;

export function canCaptureScreen(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.mediaDevices?.getDisplayMedia === "function";
}

async function toImage(source: Blob | string): Promise<SourceOutcome> {
  const url = typeof source === "string" ? source : URL.createObjectURL(source);
  try {
    const image = await normalizeSource(url);
    if (Math.min(image.width, image.height) < MIN_SIDE) return { kind: "error", reason: "too_small" };
    return { kind: "picked", image };
  } catch {
    return { kind: "error", reason: "corrupted" };
  } finally {
    if (typeof source !== "string") URL.revokeObjectURL(url);
  }
}

function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("canvas is empty"))), "image/png"));
}

function blobDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("could not read rendered PDF page"));
    reader.readAsDataURL(blob);
  });
}

export async function captureScreen(): Promise<SourceOutcome> {
  if (!canCaptureScreen()) return { kind: "error", reason: "unsupported" };
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
  } catch (err) {
    // Closing the picker or refusing permission both reject with NotAllowedError / AbortError.
    const name = (err as DOMException)?.name;
    if (name === "NotAllowedError" || name === "AbortError") return { kind: "canceled" };
    return { kind: "error", reason: name === "NotSupportedError" || name === "InvalidStateError" ? "unsupported" : "failed" };
  }
  try {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;
    await video.play();
    // The first frames can still be blank while the capture starts up.
    await new Promise((r) => setTimeout(r, 400));
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    if (!canvas.width || !canvas.height) return { kind: "error", reason: "failed" };
    canvas.getContext("2d")!.drawImage(video, 0, 0);
    return await toImage(await canvasBlob(canvas));
  } catch {
    return { kind: "error", reason: "failed" };
  } finally {
    stream.getTracks().forEach((t) => t.stop());
  }
}

/** Opens the browser file dialog; resolves null if the user closes it without choosing. */
function chooseFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.style.display = "none";
    let settled = false;
    const done = (file: File | null) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(file);
    };
    input.addEventListener("change", () => done(input.files?.[0] ?? null));
    input.addEventListener("cancel", () => done(null));
    document.body.appendChild(input);
    input.click();
  });
}

// ---------------------------------------------------------------- pdf.js

interface PdfPage {
  getViewport(o: { scale: number }): { width: number; height: number };
  render(o: { canvasContext: CanvasRenderingContext2D; canvas: HTMLCanvasElement; viewport: unknown }): { promise: Promise<void> };
}
interface PdfDocument {
  numPages: number;
  getPage(n: number): Promise<PdfPage>;
}
interface PdfLoadingTask {
  promise: Promise<PdfDocument>;
  /** Frees the document and its worker resources (present in every pdf.js version). */
  destroy(): Promise<void>;
}
interface PdfJs {
  getDocument(o: { data: ArrayBuffer; wasmUrl?: string; useWasm?: boolean }): PdfLoadingTask;
}

let pdfjs: Promise<PdfJs> | null = null;
let current: { doc: PdfDocument; task: PdfLoadingTask; name: string } | null = null;

/** Loads pdf.js as an ES module from the app's own origin (only when a PDF is actually opened). */
function loadPdfJs(): Promise<PdfJs> {
  pdfjs ??= new Promise<PdfJs>((resolve, reject) => {
    const w = window as unknown as { __pdfjsLib?: PdfJs };
    if (w.__pdfjsLib) return resolve(w.__pdfjsLib);
    const base = `${location.origin}/pdfjs`;
    const timer = setTimeout(() => reject(new Error("pdf.js did not load")), 20_000);
    window.addEventListener(
      "pdfjs-ready",
      () => {
        clearTimeout(timer);
        resolve(w.__pdfjsLib!);
      },
      { once: true },
    );
    // Load a real module file instead of using an inline module. Inline module
    // code is rejected by the CSP used by production hosts, which previously
    // left the app on a blank screen after a PDF was selected.
    const script = document.createElement("script");
    script.type = "module";
    script.src = `${base}/pdf-loader.js`;
    script.onerror = () => {
      clearTimeout(timer);
      pdfjs = null;
      reject(new Error("pdf.js did not load"));
    };
    document.head.appendChild(script);
  }).catch((err) => {
    pdfjs = null;
    throw err;
  });
  return pdfjs;
}

async function renderPage(n: number, width: number): Promise<Blob> {
  if (!current) throw new Error("no PDF open");
  const page = await current.doc.getPage(n);
  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: width / base.width });
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff"; // PDFs are often transparent; the OCR wants paper, not black.
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, canvas, viewport }).promise;
  return canvasBlob(canvas);
}

/** The open PDF (for the page picker). */
export function openPdf(): { name: string; pages: number } | null {
  return current ? { name: current.name, pages: current.doc.numPages } : null;
}

/** Small preview of page `n` (1-based) as an object URL; the caller revokes it. */
export async function pdfThumbnail(n: number, width = 360): Promise<string> {
  return URL.createObjectURL(await renderPage(n, width));
}

/** Renders page `n` at reading resolution and normalizes it like a photo. */
export async function pdfPageImage(n: number): Promise<SourceOutcome> {
  try {
    // Use a data URL here. On web, expo-image-manipulator can silently produce
    // a white image when its input is a canvas object URL, which then makes OCR
    // appear broken even though pdf.js rendered the page correctly.
    return await toImage(await blobDataUrl(await renderPage(n, PDF_PAGE_WIDTH)));
  } catch {
    return { kind: "error", reason: "corrupted" };
  }
}

export async function closePdf(): Promise<void> {
  const open = current;
  current = null;
  await open?.task.destroy().catch(() => undefined);
}

export async function pickDocument(): Promise<SourceOutcome> {
  const file = await chooseFile("image/*,application/pdf,.pdf");
  if (!file) return { kind: "canceled" };
  if (file.size > MAX_FILE_BYTES) return { kind: "error", reason: "too_large" };
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  if (!isPdf) {
    if (file.type && !IMAGE_TYPES.has(file.type.toLowerCase())) return { kind: "error", reason: "invalid_type" };
    return toImage(file);
  }
  try {
    const lib = await loadPdfJs();
    await closePdf();
    const task = lib.getDocument({
      data: await file.arrayBuffer(),
      // Scanned PDFs often use JBIG2 images. pdf.js 6 loads the decoder from
      // this directory; without it the worker renders the page as blank.
      wasmUrl: `${location.origin}/pdfjs/wasm/`,
      useWasm: true,
    });
    current = { doc: await task.promise, task, name: file.name };
  } catch {
    return { kind: "error", reason: "corrupted" };
  }
  if (current.doc.numPages === 1) return pdfPageImage(1);
  return { kind: "pdf", name: current.name, pages: current.doc.numPages };
}
