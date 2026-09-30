import { bytesToBase64 } from "../crypto";
import { MODEL_OCR_JSON_SCHEMA } from "./normalize";
import { OCR_SYSTEM_PROMPT, OCR_USER_INSTRUCTION } from "./prompt";
import { OcrFailure, type OcrInput, type OcrProvider, type ProviderOutput } from "./provider";
import { classifyHttpStatus, isAbort } from "./httpErrors";

/**
 * OCR with a vision-capable open model behind an OpenAI-compatible server (llama.cpp llama-server
 * with --mmproj, vLLM, SGLang, LM Studio, or a hosted open-model endpoint). Same prompt, schema and
 * normalisation as the other providers; output is constrained to the OCR JSON schema.
 */
export class LocalOcrProvider implements OcrProvider {
  readonly name = "local";

  constructor(
    private readonly baseUrl: string,
    private readonly model: string,
    private readonly apiKey?: string,
  ) {}

  async extract({ bytes, contentType, signal }: OcrInput): Promise<ProviderOutput> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl.replace(/\/$/, "")}/v1/chat/completions`, {
        method: "POST",
        signal,
        headers: { "content-type": "application/json", ...(this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {}) },
        body: JSON.stringify({
          model: this.model,
          temperature: 0,
          max_tokens: 4096,
          chat_template_kwargs: { enable_thinking: false },
          response_format: { type: "json_schema", json_schema: { name: "ocr_result", strict: true, schema: MODEL_OCR_JSON_SCHEMA } },
          messages: [
            { role: "system", content: OCR_SYSTEM_PROMPT },
            {
              role: "user",
              content: [
                { type: "text", text: OCR_USER_INSTRUCTION },
                { type: "image_url", image_url: { url: `data:${contentType};base64,${bytesToBase64(bytes)}` } },
              ],
            },
          ],
        }),
      });
    } catch (err) {
      if (isAbort(err)) throw new OcrFailure("timeout", "local OCR model timed out", true);
      throw new OcrFailure("provider_error", `local OCR model network error: ${String(err)}`, true);
    }
    if (!response.ok) throw classifyHttpStatus("local OCR model", response.status, (await response.text().catch(() => "")).slice(0, 300));
    const body = (await response.json().catch(() => null)) as {
      choices?: { finish_reason?: string; message?: { content?: string | null } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    } | null;
    if (body?.usage) console.log(`[ocr] usage: model=${this.model} (local) in=${body.usage.prompt_tokens} out=${body.usage.completion_tokens} ≈ $0`);
    const choice = body?.choices?.[0];
    if (choice?.finish_reason === "length") throw new OcrFailure("malformed_output", "local OCR output was truncated", true);
    const text = choice?.message?.content?.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    if (!text) throw new OcrFailure("malformed_output", "local OCR model returned no content", true);
    return { text, model: this.model };
  }
}
