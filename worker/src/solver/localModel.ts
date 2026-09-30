import { classifyHttpStatus, isAbort } from "../ocr/httpErrors";
import { OcrFailure } from "../ocr/provider";
import type { JsonModel } from "./llm";

/**
 * Any OpenAI-compatible chat server — llama.cpp's llama-server, vLLM, SGLang, LM Studio,
 * Ollama, or a hosted open-model endpoint. Output is constrained to the lesson JSON schema
 * (`response_format: json_schema`), so small open models can't return malformed JSON.
 *
 * `thinking` toggles the model's reasoning phase (Qwen3: chat_template_kwargs.enable_thinking).
 * With thinking on, the server returns the reasoning separately and only the answer is parsed.
 */
export interface LocalModelOptions {
  apiKey?: string;
  thinking?: boolean;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  /** Qwen recommends 0–2 (1.5 for quantized models) against endless repetition; 0 = off. */
  presencePenalty?: number;
}

export class LocalJsonModel implements JsonModel {
  readonly name = "local";
  readonly grammarConstrained = true;

  constructor(
    private readonly baseUrl: string,
    readonly model: string,
    private readonly options: LocalModelOptions = {},
  ) {}

  async complete({ messages, schema, schemaName, signal, onUsage }: Parameters<JsonModel["complete"]>[0]): Promise<string> {
    const thinking = this.options.thinking ?? false;
    const body = {
      model: this.model,
      messages,
      max_tokens: this.options.maxTokens ?? 12_000,
      // Qwen3 recommended sampling: thinking 0.6 / 0.95, non-thinking 0.7 / 0.8.
      temperature: this.options.temperature ?? (thinking ? 0.6 : 0.7),
      top_p: this.options.topP ?? (thinking ? 0.95 : 0.8),
      ...(this.options.presencePenalty ? { presence_penalty: this.options.presencePenalty } : {}),
      response_format: { type: "json_schema", json_schema: { name: schemaName, strict: true, schema } },
      chat_template_kwargs: { enable_thinking: thinking },
    };
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl.replace(/\/$/, "")}/v1/chat/completions`, {
        method: "POST",
        signal,
        headers: { "content-type": "application/json", ...(this.options.apiKey ? { authorization: `Bearer ${this.options.apiKey}` } : {}) },
        body: JSON.stringify(body),
      });
    } catch (err) {
      if (isAbort(err)) throw new OcrFailure("timeout", "local model request timed out", true);
      throw new OcrFailure("provider_error", `local model network error: ${String(err)}`, true);
    }
    if (!response.ok) throw classifyHttpStatus("local model", response.status, (await response.text().catch(() => "")).slice(0, 400));
    const json = (await response.json().catch(() => null)) as {
      choices?: { finish_reason?: string; message?: { content?: string | null; reasoning_content?: string | null } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    } | null;
    const choice = json?.choices?.[0];
    const reasoning = choice?.message?.reasoning_content ?? "";
    onUsage?.({
      input: json?.usage?.prompt_tokens ?? 0,
      cachedInput: 0,
      output: json?.usage?.completion_tokens ?? 0,
      reasoning: Math.round(reasoning.length / 3.5),
    });
    if (choice?.finish_reason === "length") throw new OcrFailure("malformed_output", "output truncated", true);
    // Some templates leave the reasoning inline; keep only the JSON object.
    let text = (choice?.message?.content ?? "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    const start = text.indexOf("{");
    if (start > 0) text = text.slice(start);
    if (!text) throw new OcrFailure("malformed_output", "empty model output", true);
    return text;
  }
}
