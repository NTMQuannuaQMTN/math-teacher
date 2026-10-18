import type { AllowedImageType, OcrResult } from "../../../shared/src/contract";
import { intVar, isDevelopment, type Env } from "../env";
import { ApiError } from "../http";
import { LocalOcrProvider } from "./local";
import { isAbort } from "./httpErrors";
import { MOCK_SCENARIOS, MockOcrProvider, type MockScenario } from "./mock";
import { normalizeOcrOutput } from "./normalize";
import { OcrFailure, type OcrProvider } from "./provider";
import {withinSignal} from '../solver/deadline';

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

/** Production accepts only SocLaas; the deterministic mock is available in development tests. */
export function createOcrProvider(env: Env, request?: Request): OcrProvider {
  const name = (env.OCR_PROVIDER || "soclaas").toLowerCase();
  switch (name) {
    case "soclaas":
      // OCR is only an upload-time operation. The compact result contains the test text and one entry per question;
      // solving later reads the student's current confirmed question and never sends the image again.
      if (!env.SOCLAAS_API_KEY) break;
      return new LocalOcrProvider(env.SOCLAAS_BASE_URL || "https://soclaas-api.comp.nus.edu.sg/v1", env.SOCLAAS_OCR_MODEL || "qwen3-vl:32b", env.SOCLAAS_API_KEY, "compact", "OCR:", "soclaas");
    case "mock": {
      if (!isDevelopment(env)) break;
      const requested = request?.headers.get("x-mock-scenario");
      const scenario = MOCK_SCENARIOS.includes(requested as MockScenario) ? (requested as MockScenario) : null;
      return new MockOcrProvider(scenario);
    }
  }
  console.error(`OCR provider "${name}" is not usable (SocLaas key missing, or mock outside development)`);
  throw new ApiError(503, "ocr_not_configured", "Dịch vụ nhận dạng đề bài tạm thời chưa sẵn sàng.", true);
}

const FAILURE_TO_ERROR: Record<OcrFailure["kind"], ApiError["code"]> = {
  timeout: "ocr_timeout",
  provider_error: "ocr_provider_error",
  refused: "ocr_refused",
  malformed_output: "ocr_malformed_output",
  quota_exhausted: "ocr_provider_error",
  incomplete: "ocr_malformed_output",
};

const FAILURE_MESSAGES: Record<OcrFailure["kind"], string> = {
  timeout: "Nhận dạng ảnh mất quá nhiều thời gian. Vui lòng thử lại.",
  provider_error: "Dịch vụ nhận dạng đề bài gặp sự cố. Vui lòng thử lại.",
  refused: "Không thể xử lý ảnh này. Hãy chụp ảnh chỉ chứa đề toán.",
  malformed_output: "Không thể đọc rõ đề bài. Hãy thử lại hoặc chụp ảnh khác.",
  quota_exhausted: "Hạn mức nhận dạng đề bài hôm nay đã hết. Vui lòng thử lại sau.",
  incomplete: "Không thể đọc đầy đủ đề bài. Hãy thử lại hoặc chụp ảnh khác.",
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
  const timeoutMs = Math.min(20_000,intVar(env.OCR_TIMEOUT_MS, 20_000));
  const signal = AbortSignal.timeout(timeoutMs);
  const started = Date.now();

  for (let attempt = 1; ; attempt++) {
    try {
      const output = await withinSignal(signal,()=>provider.extract({ ...image, signal }));
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
