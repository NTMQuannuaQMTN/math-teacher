import { OcrFailure } from "../ocr/provider";
import { classifyHttpStatus, isAbort } from "../ocr/httpErrors";
import { usageFromOpenAi, type Usage } from "./pricing";

/**
 * A structured-output chat model. The solver only needs "send these
 * messages, get JSON text matching this schema back", so providers are
 * interchangeable. Failures reuse OcrFailure's kinds (timeout,
 * provider_error, refused, malformed_output).
 */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface JsonModel {
  readonly name: string;
  readonly model: string;
  /** Returns the JSON text; reports token usage through `onUsage` when the provider gives it. */
  complete(input: {
    messages: ChatMessage[];
    schema: Record<string, unknown>;
    schemaName: string;
    signal: AbortSignal;
    onUsage?: (usage: Usage) => void;
  }): Promise<string>;
}

const ENDPOINT = "https://api.openai.com/v1/chat/completions";

/**
 * Cap on completion (+ reasoning) tokens per solve attempt. Grade-9 lesson JSON
 * is typically a few thousand tokens; 24k left room for runaway reasoning bills.
 * 16k still fits hard geometry with medium effort; truncation triggers a retry.
 */
export const MAX_LESSON_COMPLETION_TOKENS = 16_000;

function isReasoningModel(model: string): boolean {
  return /^(o\d|gpt-5)/.test(model);
}

export class OpenAiJsonModel implements JsonModel {
  readonly name = "openai";

  constructor(
    private readonly apiKey: string,
    readonly model: string,
    private readonly reasoningEffort: string,
  ) {}

  async complete({ messages, schema, schemaName, signal, onUsage }: Parameters<JsonModel["complete"]>[0]): Promise<string> {
    const body: Record<string, unknown> = {
      model: this.model,
      messages,
      max_completion_tokens: MAX_LESSON_COMPLETION_TOKENS,
      response_format: { type: "json_schema", json_schema: { name: schemaName, strict: true, schema } },
    };
    if (isReasoningModel(this.model)) body.reasoning_effort = this.reasoningEffort;
    else body.temperature = 0.2;

    let response: Response;
    try {
      response = await fetch(ENDPOINT, {
        method: "POST",
        signal,
        headers: { "content-type": "application/json", authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify(body),
      });
    } catch (err) {
      if (isAbort(err)) throw new OcrFailure("timeout", "OpenAI request timed out", true);
      throw new OcrFailure("provider_error", `OpenAI network error: ${String(err)}`, true);
    }
    if (!response.ok) {
      throw classifyHttpStatus("OpenAI", response.status, (await response.text().catch(() => "")).slice(0, 400));
    }
    const json = (await response.json().catch(() => null)) as {
      choices?: { finish_reason?: string; message?: { content?: string | null; refusal?: string | null } }[];
      usage?: unknown;
    } | null;
    if (json?.usage) onUsage?.(usageFromOpenAi(json.usage));
    const choice = json?.choices?.[0];
    if (choice?.message?.refusal) throw new OcrFailure("refused", "model refused", false);
    if (choice?.finish_reason === "length") throw new OcrFailure("malformed_output", "output truncated", true);
    const text = choice?.message?.content;
    if (!text) throw new OcrFailure("malformed_output", "empty model output", true);
    return text;
  }
}
