import type { QuestionExtraction } from "../schema";
import { AIProviderError, type AIProvider } from "./provider";
import { EXTRACTION_PROMPT, GEOMETRY_PROMPT, SOLVE_PROMPT } from "./prompts";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

// Status codes worth retrying: rate limiting and transient upstream failures.
// 4xx client errors (bad request, auth, etc.) are not retried — they won't
// succeed on a second attempt.
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 529]);
const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [300, 900];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Converts bytes to base64 in chunks to avoid blowing the call stack on
 * large images (String.fromCharCode(...hugeArray) can exceed engine limits). */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export class AnthropicProvider implements AIProvider {
  constructor(private readonly apiKey: string, private readonly model: string) {}

  private async callText(params: {
    prompt: string;
    image?: { base64: string; mediaType: string };
    maxTokens?: number;
  }): Promise<string> {
    const content: Record<string, unknown>[] = [];
    if (params.image) {
      content.push({
        type: "image",
        source: { type: "base64", media_type: params.image.mediaType, data: params.image.base64 },
      });
    }
    content.push({ type: "text", text: params.prompt });

    const body = JSON.stringify({
      model: this.model,
      max_tokens: params.maxTokens ?? 2048,
      messages: [{ role: "user", content }],
    });

    let lastError: unknown;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      if (attempt > 0) await sleep(BACKOFF_MS[attempt - 1] ?? 900);

      let response: Response;
      try {
        response = await fetch(ANTHROPIC_API_URL, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": this.apiKey,
            "anthropic-version": ANTHROPIC_VERSION,
          },
          body,
        });
      } catch (err) {
        lastError = new AIProviderError("Failed to reach AI provider", err);
        continue; // network failure — worth retrying
      }

      if (!response.ok) {
        const bodyText = await response.text().catch(() => "");
        lastError = new AIProviderError(
          `AI provider returned ${response.status}: ${bodyText.slice(0, 500)}`
        );
        if (RETRYABLE_STATUS_CODES.has(response.status)) continue;
        throw lastError; // non-retryable (e.g. 401, 400) — fail immediately
      }

      const json = (await response.json()) as {
        content?: { type: string; text?: string }[];
      };
      const textBlock = json.content?.find((block) => block.type === "text");
      if (!textBlock?.text) {
        throw new AIProviderError("AI provider response had no text content");
      }
      return textBlock.text;
    }

    throw lastError instanceof Error ? lastError : new AIProviderError("AI provider request failed");
  }

  async extractQuestion(imageBytes: ArrayBuffer, contentType: string): Promise<string> {
    const base64 = arrayBufferToBase64(imageBytes);
    return this.callText({
      prompt: EXTRACTION_PROMPT,
      image: { base64, mediaType: contentType },
      maxTokens: 1024,
    });
  }

  async generateGeometry(extraction: QuestionExtraction): Promise<string> {
    return this.callText({ prompt: GEOMETRY_PROMPT(extraction.extracted_text), maxTokens: 2048 });
  }

  async solve(extraction: QuestionExtraction): Promise<string> {
    return this.callText({
      prompt: SOLVE_PROMPT(extraction.extracted_text, extraction.topic),
      maxTokens: 2048,
    });
  }
}
