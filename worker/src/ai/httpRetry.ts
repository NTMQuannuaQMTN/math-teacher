import { AIProviderError } from "./provider";

// Status codes worth retrying: rate limiting and transient upstream failures.
// 4xx client errors (bad request, auth, etc.) are not retried — they won't
// succeed on a second attempt. Shared across providers so retry behavior
// stays consistent regardless of which AI backend is configured.
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 529]);
const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [300, 900];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** POSTs with retry/backoff on transient failures. Returns the successful
 * Response; throws AIProviderError on a non-retryable failure or once
 * attempts are exhausted. Caller is responsible for parsing the body. */
export async function fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) await sleep(BACKOFF_MS[attempt - 1] ?? 900);

    let response: Response;
    try {
      response = await fetch(url, init);
    } catch (err) {
      lastError = new AIProviderError("Failed to reach AI provider", err);
      continue; // network failure — worth retrying
    }

    if (response.ok) return response;

    const bodyText = await response.text().catch(() => "");
    const error = new AIProviderError(`AI provider returned ${response.status}: ${bodyText.slice(0, 500)}`);
    if (!RETRYABLE_STATUS_CODES.has(response.status)) {
      throw error; // non-retryable (e.g. 401, 400) — fail immediately
    }
    lastError = error;
  }

  throw lastError instanceof Error ? lastError : new AIProviderError("AI provider request failed");
}
