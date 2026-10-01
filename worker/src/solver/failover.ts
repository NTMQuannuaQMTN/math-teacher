import { OcrFailure } from "../ocr/provider";
import type { JsonModel } from "./llm";

/**
 * Uses `secondary` when `primary` is unavailable for reasons a retry can't fix — an exhausted daily quota
 * (free tiers) or a non-retryable provider error (bad key, model withdrawn). Timeouts, truncation and wrong
 * lessons are left to the pipeline: switching models there would only add latency.
 */
export class FailoverJsonModel implements JsonModel {
  readonly name: string;
  readonly grammarConstrained?: boolean;
  private used: JsonModel;

  constructor(
    private readonly primary: JsonModel,
    private readonly secondary: JsonModel,
    private readonly log: (message: string) => void = () => undefined,
  ) {
    this.name = primary.name;
    this.grammarConstrained = primary.grammarConstrained;
    this.used = primary;
  }

  /** The model that produced the last answer (reported as the lesson's model). */
  get model(): string {
    return this.used.model;
  }

  async complete(input: Parameters<JsonModel["complete"]>[0]): Promise<string> {
    if (this.used === this.primary) {
      try {
        return await this.primary.complete(input);
      } catch (err) {
        const unavailable = err instanceof OcrFailure && (err.kind === "quota_exhausted" || (err.kind === "provider_error" && !err.retryable));
        if (!unavailable || input.signal.aborted) throw err;
        this.log(`${this.primary.model} unavailable (${err.message.slice(0, 80)}); using ${this.secondary.model}`);
        this.used = this.secondary;
      }
    }
    return this.secondary.complete(input);
  }
}
