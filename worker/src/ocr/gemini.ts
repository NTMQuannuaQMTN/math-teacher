import { bytesToBase64 } from "../crypto";
import { formatUsage, usageFromGemini } from "../solver/pricing";
import { MODEL_OCR_JSON_SCHEMA } from "./normalize";
import { OCR_SYSTEM_PROMPT, OCR_USER_INSTRUCTION } from "./prompt";
import { OcrFailure, type OcrInput, type OcrProvider, type ProviderOutput } from "./provider";
import { classifyHttpStatus, isAbort } from "./httpErrors";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

interface GeminiResponse {
  modelVersion?: string;
  candidates?: {
    finishReason?: string;
    content?: { parts?: { text?: string }[] };
  }[];
  usageMetadata?: unknown;
  promptFeedback?: { blockReason?: string };
}

/**
 * Gemini vision OCR via generateContent + responseJsonSchema.
 * Same MODEL_OCR_JSON_SCHEMA as OpenAI/Anthropic; normalization stays shared.
 */
export class GeminiOcrProvider implements OcrProvider {
  readonly name = "gemini";

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async extract({ bytes, contentType, signal }: OcrInput): Promise<ProviderOutput> {
    const url = `${API_BASE}/${encodeURIComponent(this.model)}:generateContent`;
    const body = {
      systemInstruction: { parts: [{ text: OCR_SYSTEM_PROMPT }] },
      contents: [
        {
          role: "user",
          parts: [
            { text: OCR_USER_INSTRUCTION },
            { inlineData: { mimeType: contentType, data: bytesToBase64(bytes) } },
          ],
        },
      ],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 4096,
        // OCR is transcription: keep thinking off to cut cost/latency.
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: "application/json",
        responseJsonSchema: MODEL_OCR_JSON_SCHEMA,
      },
    };

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        signal,
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": this.apiKey,
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      if (isAbort(err)) throw new OcrFailure("timeout", "Gemini OCR request timed out", true);
      throw new OcrFailure("provider_error", `Gemini OCR network error: ${String(err)}`, true);
    }

    if (!response.ok) {
      throw classifyHttpStatus("Gemini", response.status, (await response.text().catch(() => "")).slice(0, 300));
    }

    const json = (await response.json().catch(() => null)) as GeminiResponse | null;
    if (json?.usageMetadata) {
      console.log(`[ocr] usage: ${formatUsage(this.model, usageFromGemini(json.usageMetadata))}`);
    }

    if (json?.promptFeedback?.blockReason) {
      throw new OcrFailure("refused", `Gemini blocked the image (${json.promptFeedback.blockReason})`, false);
    }

    const candidate = json?.candidates?.[0];
    const finish = candidate?.finishReason;
    if (finish === "SAFETY" || finish === "RECITATION" || finish === "BLOCKLIST" || finish === "PROHIBITED_CONTENT") {
      throw new OcrFailure("refused", `Gemini OCR refused (${finish})`, false);
    }
    if (finish === "MAX_TOKENS") {
      throw new OcrFailure("malformed_output", "Gemini OCR output was truncated", true);
    }

    const text = candidate?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    if (!text.trim()) throw new OcrFailure("malformed_output", "Gemini OCR returned no content", true);
    return { text, model: json?.modelVersion ?? this.model };
  }
}
