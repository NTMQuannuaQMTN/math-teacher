import { bytesToBase64 } from "../crypto";
import { MODEL_OCR_JSON_SCHEMA } from "./normalize";
import { OCR_SYSTEM_PROMPT, OCR_USER_INSTRUCTION } from "./prompt";
import { OcrFailure, type OcrInput, type OcrProvider, type ProviderOutput } from "./provider";
import { classifyHttpStatus, isAbort } from "./httpErrors";
import { formatUsage, usageFromOpenAi } from "../solver/pricing";

const ENDPOINT = "https://api.openai.com/v1/chat/completions";

interface ChatCompletionResponse {
  model?: string;
  usage?: unknown;
  choices?: { finish_reason?: string; message?: { content?: string | null; refusal?: string | null } }[];
}

export class OpenAiOcrProvider implements OcrProvider {
  readonly name = "openai";

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async extract({ bytes, contentType, signal }: OcrInput): Promise<ProviderOutput> {
    let response: Response;
    try {
      response = await fetch(ENDPOINT, {
        method: "POST",
        signal,
        headers: { "content-type": "application/json", authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify({
          model: this.model,
          temperature: 0,
          max_tokens: 4096,
          response_format: {
            type: "json_schema",
            json_schema: { name: "ocr_result", strict: true, schema: MODEL_OCR_JSON_SCHEMA },
          },
          messages: [
            { role: "system", content: OCR_SYSTEM_PROMPT },
            {
              role: "user",
              content: [
                { type: "text", text: OCR_USER_INSTRUCTION },
                {
                  type: "image_url",
                  image_url: { url: `data:${contentType};base64,${bytesToBase64(bytes)}`, detail: "high" },
                },
              ],
            },
          ],
        }),
      });
    } catch (err) {
      if (isAbort(err)) throw new OcrFailure("timeout", "OpenAI request timed out", true);
      throw new OcrFailure("provider_error", `OpenAI network error: ${String(err)}`, true);
    }

    if (!response.ok) {
      const detail = (await response.text().catch(() => "")).slice(0, 300);
      throw classifyHttpStatus("OpenAI", response.status, detail);
    }

    const body = (await response.json().catch(() => null)) as ChatCompletionResponse | null;
    if (body?.usage) console.log(`[ocr] usage: ${formatUsage(this.model, usageFromOpenAi(body.usage))}`);
    const choice = body?.choices?.[0];
    if (choice?.message?.refusal) {
      throw new OcrFailure("refused", "OpenAI refused the request", false);
    }
    if (choice?.finish_reason === "length") {
      throw new OcrFailure("malformed_output", "OpenAI output was truncated", true);
    }
    const text = choice?.message?.content;
    if (!text) throw new OcrFailure("malformed_output", "OpenAI returned no content", true);
    return { text, model: body?.model ?? this.model };
  }
}
