import type { AllowedImageType } from "../../../shared/src/contract";

export interface OcrInput {
  bytes: ArrayBuffer;
  contentType: AllowedImageType;
  signal: AbortSignal;
}

/**
 * What a provider returns: the raw model text, before any validation.
 * Parsing, validation, and sanitizing happen once, in `normalize.ts`, so
 * every provider is held to exactly the same standard.
 */
export interface ProviderOutput {
  text: string;
  model: string;
}

/**
 * The only thing the rest of the Worker knows about OCR. Adding a provider
 * (Gemini, Mathpix, a self-hosted model…) means implementing this interface
 * and registering it in `factory.ts` — no route or client changes.
 */
export interface OcrProvider {
  readonly name: string;
  extract(input: OcrInput): Promise<ProviderOutput>;
}

export type OcrFailureKind = "timeout" | "provider_error" | "refused" | "malformed_output" | "quota_exhausted";

export class OcrFailure extends Error {
  constructor(
    readonly kind: OcrFailureKind,
    message: string,
    /** Whether trying the same image again could plausibly help. */
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "OcrFailure";
  }
}
