// Typed browser client for the same-origin gateway. Types are generated from the API's OpenAPI schema.
import type { components } from "./api-types";

export type Schemas = components["schemas"];
export type DocumentOut = Schemas["DocumentOut"];
export type DocumentSummary = Schemas["DocumentSummaryOut"];
export type QuestionOut = Schemas["QuestionOut"];
export type QuestionPatch = Schemas["QuestionPatchIn"];
export type JobOut = Schemas["JobOut"];
export type UsageOut = Schemas["UsageOut"];
export type AdminUsageOut = Schemas["AdminUsageOut"];
export type FlagOut = Schemas["FlagOut"];
export type LatexCheckOut = Schemas["LatexCheckOut"];
export type UploadOut = Schemas["UploadOut"];
export type Topic = QuestionOut["topics"][number];

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details: unknown = null,
  ) {
    super(message);
  }
}

async function parse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const body: unknown = isJson ? await response.json() : null;
  if (!response.ok) {
    const error = (body as { error?: { code?: string; message?: string; details?: unknown } } | null)?.error;
    throw new ApiError(
      response.status,
      error?.code ?? "http_error",
      error?.message ?? "Đã xảy ra lỗi. Hãy thử lại.",
      error?.details ?? null,
    );
  }
  return body as T;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/v1${path}`, { ...init, credentials: "same-origin", cache: "no-store" });
  } catch {
    throw new ApiError(0, "network_error", "Mất kết nối mạng. Hãy kiểm tra Internet và thử lại.");
  }
  return parse<T>(response);
}

export function jsonBody(method: string, body: unknown): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

export async function ensureSession(turnstileToken: string | null): Promise<void> {
  const response = await fetch("/api/session", jsonBody("POST", { turnstileToken }));
  await parse<unknown>(response);
}

export async function hasSession(): Promise<boolean> {
  const response = await fetch("/api/session", { cache: "no-store" });
  const body = await parse<{ authenticated: boolean }>(response);
  return body.authenticated;
}

/** Upload with progress (fetch has no upload progress events). */
export function uploadDocument(file: File, onProgress: (fraction: number) => void): Promise<UploadOut> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/v1/documents");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onerror = () => reject(new ApiError(0, "network_error", "Mất kết nối mạng khi tải lên."));
    xhr.onload = () => {
      let body: unknown = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        // non-JSON error body
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body as UploadOut);
      } else {
        const error = (body as { error?: { code?: string; message?: string } } | null)?.error;
        reject(new ApiError(xhr.status, error?.code ?? "http_error", error?.message ?? "Tải lên thất bại."));
      }
    };
    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  });
}

export const TOPIC_LABELS: Record<Topic, string> = {
  algebra: "Đại số",
  geometry: "Hình học",
  number_theory: "Số học",
  combinatorics: "Tổ hợp",
};

export const STATUS_LABELS: Record<QuestionOut["review_status"], string> = {
  pending: "Chờ kiểm tra",
  flagged: "Cần sửa",
  confirmed: "Đã xác nhận",
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentSummary["status"], string> = {
  uploaded: "Đã tải lên",
  processing: "Đang nhận dạng",
  needs_review: "Chờ kiểm tra",
  failed: "Lỗi",
};

export function formatSgd(value: string | number): string {
  return `${Number(value).toFixed(4)} SGD`;
}
