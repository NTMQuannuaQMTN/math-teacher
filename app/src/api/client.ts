import type { ApiErrorBody, QuestionResult } from "./types";

// Expo embeds EXPO_PUBLIC_* vars at build time; this is a URL, not a secret,
// so it's safe to ship in the client bundle. No AI API key ever lives here.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8787";

export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
    this.name = "ApiError";
  }
}

export class NetworkError extends Error {
  constructor(message = "Could not reach the server. Check your connection and try again.") {
    super(message);
    this.name = "NetworkError";
  }
}

// The pipeline runs up to 3 sequential LLM calls (extract, optional geometry,
// solve), each with its own retry/backoff on the server (see
// worker/src/ai/anthropic.ts) — comfortably fits under 2 minutes even with a
// couple of retried calls, but not under the previous 60s budget.
const SUBMIT_TIMEOUT_MS = 120_000;

export async function submitQuestionImage(
  image: { uri: string; mimeType: string; fileName: string },
  signal?: AbortSignal
): Promise<QuestionResult> {
  const formData = new FormData();
  // React Native's FormData accepts this { uri, name, type } shape directly;
  // it is not a spec-compliant web File/Blob.
  formData.append("image", {
    uri: image.uri,
    name: image.fileName,
    type: image.mimeType,
  } as unknown as Blob);

  const timeoutController = new AbortController();
  const timeout = setTimeout(() => timeoutController.abort(), SUBMIT_TIMEOUT_MS);
  const combinedSignal = mergeSignals(signal, timeoutController.signal);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/questions`, {
      method: "POST",
      body: formData,
      signal: combinedSignal,
    });
  } catch (err) {
    if (isAbortError(err)) throw err;
    throw new NetworkError();
  } finally {
    clearTimeout(timeout);
  }

  return parseResponse(response);
}

export async function fetchQuestion(id: string, signal?: AbortSignal): Promise<QuestionResult> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/questions/${id}`, { signal });
  } catch (err) {
    if (isAbortError(err)) throw err;
    throw new NetworkError();
  }
  return parseResponse(response);
}

async function parseResponse(response: Response): Promise<QuestionResult> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiError("Server returned an unexpected response.", response.status);
  }

  if (!response.ok) {
    const errorBody = body as ApiErrorBody;
    throw new ApiError(errorBody.error ?? "Something went wrong.", response.status, errorBody.code);
  }

  return body as QuestionResult;
}

function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === "AbortError";
}

function mergeSignals(a?: AbortSignal, b?: AbortSignal): AbortSignal | undefined {
  if (!a) return b;
  if (!b) return a;
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  a.addEventListener("abort", onAbort);
  b.addEventListener("abort", onAbort);
  if (a.aborted || b.aborted) controller.abort();
  return controller.signal;
}
