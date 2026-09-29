import type { AllowedImageType, OcrResult } from "../../../shared/src/contract";
import { intVar, isDevelopment, type Env } from "../env";
import { ApiError } from "../http";
import { AnthropicOcrProvider } from "./anthropic";
import { isAbort } from "./httpErrors";
import { MOCK_SCENARIOS, MockOcrProvider, type MockScenario } from "./mock";
import { normalizeOcrOutput } from "./normalize";
import { OpenAiOcrProvider } from "./openai";
import { GeminiOcrProvider } from "./gemini";
import { OcrFailure, type OcrProvider } from "./provider";

/**
 * Tries the primary provider; if it fails for a transient reason (overloaded,
 * quota, timeout), the photo is read by the fallback provider instead. Lets a
 * cheap/free provider be primary without students seeing its outages.
 */
export class FallbackOcrProvider implements OcrProvider {
  readonly name: string;
  constructor(
    private readonly primary: OcrProvider,
    private readonly fallback: OcrProvider,
  ) {
    this.name = primary.name;
  }

  async extract(input: Parameters<OcrProvider["extract"]>[0]): ReturnType<OcrProvider["extract"]> {
    try {
      return await this.primary.extract(input);
    } catch (err) {
      const transient = err instanceof OcrFailure && err.retryable && (err.kind === "provider_error" || err.kind === "timeout");
      if (!transient || input.signal.aborted) throw err;
      console.warn(`OCR primary (${this.primary.name}) failed (${err.message.slice(0, 80)}); using ${this.fallback.name}`);
      return this.fallback.extract(input);
    }
  }
}

/** Picks the provider from configuration (plus optional OCR_FALLBACK_PROVIDER). Misconfiguration is a server error, never a crash. */
export function createOcrProvider(env: Env, request?: Request): OcrProvider {
  const primary = buildOcrProvider(env, (env.OCR_PROVIDER || "openai").toLowerCase(), request);
  const fallbackName = env.OCR_FALLBACK_PROVIDER?.trim().toLowerCase();
  const fallback = fallbackName && fallbackName !== primary.name ? tryBuild(env, fallbackName, request) : null;
  return fallback ? new FallbackOcrProvider(primary, fallback) : primary;
}

function tryBuild(env: Env, name: string, request?: Request): OcrProvider | null {
  try {
    return buildOcrProvider(env, name, request);
  } catch {
    return null;
  }
}

function buildOcrProvider(env: Env, name: string, request?: Request): OcrProvider {
  switch (name) {
    case "openai":
      if (!env.OPENAI_API_KEY) break;
      return new OpenAiOcrProvider(env.OPENAI_API_KEY, env.OPENAI_MODEL || "gpt-4.1-mini");
    case "gemini":
      if (!env.GEMINI_API_KEY) break;
      return new GeminiOcrProvider(env.GEMINI_API_KEY, env.GEMINI_OCR_MODEL || "gemini-3.1-flash-lite");
    case "anthropic":
      if (!env.ANTHROPIC_API_KEY) break;
      return new AnthropicOcrProvider(env.ANTHROPIC_API_KEY, env.ANTHROPIC_MODEL || "claude-opus-5");
    case "mock": {
      if (!isDevelopment(env)) break;
      const requested = request?.headers.get("x-mock-scenario");
      const scenario = MOCK_SCENARIOS.includes(requested as MockScenario) ? (requested as MockScenario) : null;
      return new MockOcrProvider(scenario);
    }
  }
  console.error(`OCR provider "${name}" is not usable (missing key, unknown name, or mock outside development)`);
  throw new ApiError(503, "ocr_not_configured", "Text recognition is temporarily unavailable.", true);
}

const FAILURE_TO_ERROR: Record<OcrFailure["kind"], ApiError["code"]> = {
  timeout: "ocr_timeout",
  provider_error: "ocr_provider_error",
  refused: "ocr_refused",
  malformed_output: "ocr_malformed_output",
};

const FAILURE_MESSAGES: Record<OcrFailure["kind"], string> = {
  timeout: "Reading the image took too long. Please try again.",
  provider_error: "The text recognition service had a problem. Please try again.",
  refused: "This image couldn't be processed. Try a photo that shows only the maths problem.",
  malformed_output: "We couldn't read the problem clearly. Please try again or retake the photo.",
};

export function ocrFailureToApiError(failure: OcrFailure): ApiError {
  return new ApiError(502, FAILURE_TO_ERROR[failure.kind], FAILURE_MESSAGES[failure.kind], failure.retryable);
}

/**
 * Runs one OCR attempt end to end: provider call under a hard timeout, then
 * validation/sanitizing. A malformed response gets exactly one automatic
 * retry (models are non-deterministic; a second try usually parses).
 * Returns a validated OcrResult or throws OcrFailure.
 */
export async function runOcr(
  provider: OcrProvider,
  env: Env,
  image: { bytes: ArrayBuffer; contentType: AllowedImageType },
): Promise<OcrResult> {
  const timeoutMs = intVar(env.OCR_TIMEOUT_MS, 45_000);
  const signal = AbortSignal.timeout(timeoutMs);
  const started = Date.now();

  for (let attempt = 1; ; attempt++) {
    try {
      const output = await provider.extract({ ...image, signal });
      return normalizeOcrOutput(output.text, {
        provider: provider.name,
        model: output.model,
        durationMs: Date.now() - started,
      });
    } catch (err) {
      const failure =
        err instanceof OcrFailure
          ? err
          : isAbort(err) || signal.aborted
            ? new OcrFailure("timeout", "OCR timed out", true)
            : new OcrFailure("provider_error", `Unexpected OCR error: ${String(err)}`, true);
      const canRetry = failure.kind === "malformed_output" && attempt < 2 && !signal.aborted;
      console.warn(`OCR attempt ${attempt} failed (${failure.kind}): ${failure.message}`);
      if (!canRetry) throw failure;
    }
  }
}
