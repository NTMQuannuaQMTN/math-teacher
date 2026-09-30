import Anthropic from "@anthropic-ai/sdk";
import { bytesToBase64 } from "../crypto";
import { MODEL_OCR_JSON_SCHEMA } from "./normalize";
import { OCR_SYSTEM_PROMPT, OCR_USER_INSTRUCTION } from "./prompt";
import { OcrFailure, type OcrInput, type OcrProvider, type ProviderOutput } from "./provider";
import { classifyHttpStatus, isAbort } from "./httpErrors";

export class AnthropicOcrProvider implements OcrProvider {
  readonly name = "anthropic";
  private readonly client: Anthropic;

  constructor(
    apiKey: string,
    private readonly model: string,
    fetchImpl?: typeof fetch,
  ) {
    // The Worker enforces its own overall timeout via AbortSignal; keep SDK retries low
    // so a slow upstream can't multiply the student's wait.
    this.client = new Anthropic({ apiKey, maxRetries: 1, ...(fetchImpl ? { fetch: fetchImpl } : {}) });
  }

  async extract({ bytes, contentType, signal }: OcrInput): Promise<ProviderOutput> {
    let message: Anthropic.Beta.BetaMessage;
    try {
      message = await this.client.beta.messages.create(
        {
          model: this.model,
          max_tokens: 4096,
          system: OCR_SYSTEM_PROMPT,
          // Transcription needs little reasoning; low effort keeps latency down.
          output_config: {
            effort: "low",
            format: { type: "json_schema", schema: MODEL_OCR_JSON_SCHEMA },
          },
          // Re-run a safety-classifier decline on Anthropic's recommended fallback model.
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          messages: [
            {
              role: "user",
              content: [
                { type: "image", source: { type: "base64", media_type: contentType, data: bytesToBase64(bytes) } },
                { type: "text", text: OCR_USER_INSTRUCTION },
              ],
            },
          ],
        },
        { signal },
      );
    } catch (err) {
      if (err instanceof Anthropic.APIConnectionTimeoutError || isAbort(err)) {
        throw new OcrFailure("timeout", "Anthropic request timed out", true);
      }
      if (err instanceof Anthropic.APIError && typeof err.status === "number") {
        throw classifyHttpStatus("Anthropic", err.status, err.message.slice(0, 300));
      }
      throw new OcrFailure("provider_error", `Anthropic error: ${String(err)}`, true);
    }

    if (message.stop_reason === "refusal") {
      throw new OcrFailure("refused", "Anthropic declined the request", false);
    }
    if (message.stop_reason === "max_tokens") {
      throw new OcrFailure("malformed_output", "Anthropic output was truncated", true);
    }
    const text = message.content
      .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");
    if (!text) throw new OcrFailure("malformed_output", "Anthropic returned no text", true);
    return { text, model: message.model };
  }
}
