import { bytesToBase64 } from "../crypto";
import { geminiJson } from "../gemini";
import { formatUsage } from "../solver/pricing";
import { MODEL_OCR_JSON_SCHEMA } from "./normalize";
import { OCR_SYSTEM_PROMPT, OCR_USER_INSTRUCTION } from "./prompt";
import type { OcrInput, OcrProvider, ProviderOutput } from "./provider";

export class GeminiOcrProvider implements OcrProvider {
  readonly name = "gemini";

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async extract({ bytes, contentType, signal }: OcrInput): Promise<ProviderOutput> {
    const { text, usage, model } = await geminiJson({
      apiKey: this.apiKey,
      model: this.model,
      system: OCR_SYSTEM_PROMPT,
      contents: [
        {
          role: "user",
          parts: [{ inline_data: { mime_type: contentType, data: bytesToBase64(bytes) } }, { text: OCR_USER_INSTRUCTION }],
        },
      ],
      schema: MODEL_OCR_JSON_SCHEMA,
      // Transcription needs little reasoning; keep thinking (billed as output) to a minimum.
      thinkingLevel: "minimal",
      maxOutputTokens: 8_000,
      signal,
    });
    console.log(`[ocr] usage: ${formatUsage(this.model, usage)}`);
    return { text, model };
  }
}
