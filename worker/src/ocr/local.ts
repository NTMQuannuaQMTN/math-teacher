import { bytesToBase64 } from "../crypto";
import { MODEL_OCR_COMPACT_JSON_SCHEMA, MODEL_OCR_JSON_SCHEMA } from "./normalize";
import { OCR_SYSTEM_PROMPT, OCR_SYSTEM_PROMPT_COMPACT, OCR_USER_INSTRUCTION } from "./prompt";
import { OcrFailure, type OcrInput, type OcrProvider, type ProviderOutput } from "./provider";
import { classifyHttpStatus, isAbort } from "./httpErrors";
import { ocrTextToCompactJson } from "./textFormat";

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
    /**
     * "compact" (default): JSON with the text written once instead of three times — ~2–3× fewer output tokens.
     * "full": the original raw_text + formatted_text + problems JSON.
     * "text": a dedicated document-OCR model (PaddleOCR-VL, GLM-OCR…) returns Markdown/LaTeX for the
     * task prompt `textPrompt`; the structure is recovered deterministically (textFormat.ts).
     */
    private readonly format: "compact" | "full" | "text" = "compact",
    private readonly textPrompt = "OCR:",
  ) {}

  async extract({ bytes, contentType, signal }: OcrInput): Promise<ProviderOutput> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl.replace(/\/$/, "")}/v1/chat/completions`, {
        method: "POST",
        signal,
        headers: { "content-type": "application/json", ...(this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {}) },
        body: JSON.stringify(this.format === "text" ? this.textRequest(bytes, contentType) : {
          model: this.model,
          temperature: 0,
          max_tokens: 4096,
          chat_template_kwargs: { enable_thinking: false },
          response_format: {
            type: "json_schema",
            json_schema: { name: "ocr_result", strict: true, schema: this.format === "compact" ? MODEL_OCR_COMPACT_JSON_SCHEMA : MODEL_OCR_JSON_SCHEMA },
          },
          messages: [
            { role: "system", content: this.format === "compact" ? OCR_SYSTEM_PROMPT_COMPACT : OCR_SYSTEM_PROMPT },
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
    return { text: this.format === "text" ? ocrTextToCompactJson(text) : text, model: this.model };
  }

  /** Document-OCR models take the image plus a fixed task tag, and no system prompt or grammar. */
  private textRequest(bytes: ArrayBuffer, contentType: string): Record<string, unknown> {
    return {
      model: this.model,
      temperature: 0,
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:${contentType};base64,${bytesToBase64(bytes)}` } },
            { type: "text", text: this.textPrompt },
          ],
        },
      ],
    };
  }
}
