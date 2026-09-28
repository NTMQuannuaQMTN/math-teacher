import { OcrFailure } from "./provider";

export function isAbort(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err.name === "AbortError" || err.name === "TimeoutError" || /abort/i.test(err.message))
  );
}

/** Maps an upstream HTTP status to an OcrFailure. Details are for logs only. */
export function classifyHttpStatus(provider: string, status: number, detail: string): OcrFailure {
  const retryable = status === 408 || status === 409 || status === 429 || status >= 500;
  return new OcrFailure("provider_error", `${provider} returned HTTP ${status}: ${detail}`, retryable);
}
