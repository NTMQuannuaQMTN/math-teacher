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
/** Per-request cap for hosted endpoints (free tiers can queue a request for minutes). */
const HOSTED_REQUEST_TIMEOUT_MS = 180_000;
const TRUNCATED = "output truncated";
const DAILY_QUOTA = /per-day|per day|daily/i;
const EMPTY = "empty model output";
const LOWER_EFFORT: Partial<Record<NonNullable<LocalModelOptions["reasoningEffort"]>, NonNullable<LocalModelOptions["reasoningEffort"]>>> = {
  high: "medium",
  medium: "low",
  low: "minimal",
  minimal: "none",
};

export interface LocalModelOptions {
  apiKey?: string;
  thinking?: boolean;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  /** Qwen recommends 0–2 (1.5 for quantized models) against endless repetition; 0 = off. */
  presencePenalty?: number;
  /**
   * true for a local grammar engine (llama.cpp, vLLM): send the fuller schema and llama.cpp extras.
   * Default: true for localhost URLs, false for hosted endpoints (OpenRouter, Groq, …), which get
   * the plain strict schema.
   */
  grammar?: boolean;
  /** Hosted reasoning models (OpenRouter `reasoning.effort`): "low" keeps hidden thinking from eating the output budget. */
  reasoningEffort?: "none" | "minimal" | "low" | "medium" | "high";
}

export class LocalJsonModel implements JsonModel {
  readonly name = "local";
  readonly grammarConstrained: boolean;
  private readonly hosted: boolean;

  constructor(
    private readonly baseUrl: string,
    readonly model: string,
    private readonly options: LocalModelOptions = {},
  ) {
    this.hosted = !/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:|\/|$)/.test(baseUrl);
    this.grammarConstrained = options.grammar ?? !this.hosted;
  }

  async complete(args: Parameters<JsonModel["complete"]>[0]): Promise<string> {
    const effort = this.options.reasoningEffort ?? "low";
    try {
      return await this.request(args, effort);
    } catch (err) {
      // A hosted reasoning model can spend the whole output budget thinking (EXP-010: g5 truncated at
      // "low", verified at "minimal"; ch-4 truncated even at "minimal"), or finish with an empty answer.
      // Retry once with one step less reasoning; the verifier still gates the result.
      const lower = LOWER_EFFORT[effort];
      const budgetSpent = err instanceof OcrFailure && (err.message === TRUNCATED || err.message === EMPTY);
      if (!this.hosted || !lower || !budgetSpent || args.signal.aborted) throw err;
      return this.request(args, lower);
    }
  }

  private async request(
    { messages, schema, schemaName, signal, onUsage }: Parameters<JsonModel["complete"]>[0],
    effort: NonNullable<LocalModelOptions["reasoningEffort"]>,
  ): Promise<string> {
    const thinking = this.options.thinking ?? false;
    const body = {
      model: this.model,
      messages,
      // Hosted: easy lessons are 2–4K tokens, hard multi-part proofs need more; the per-request
      // timeout (not this cap) is what stops a runaway attempt.
      max_tokens: this.options.maxTokens ?? 12_000,
      // Qwen3 recommended sampling: thinking 0.6 / 0.95, non-thinking 0.7 / 0.8.
      temperature: this.options.temperature ?? (this.hosted ? 0.3 : thinking ? 0.6 : 0.7),
      top_p: this.options.topP ?? (thinking ? 0.95 : 0.8),
      ...(this.options.presencePenalty ? { presence_penalty: this.options.presencePenalty } : {}),
      response_format: { type: "json_schema", json_schema: { name: schemaName, strict: true, schema } },
      ...(this.hosted
        ? // OpenRouter: only route to providers that honour response_format/json_schema; keep reasoning short.
          { provider: { require_parameters: true }, reasoning: { effort } }
        : { chat_template_kwargs: { enable_thinking: thinking } }),
    };
    let response!: Response;
    // Hosted free tiers: cap each request (a stuck call fails fast; the pipeline keeps an earlier
    // attempt) and back off briefly on 429 rate limits instead of failing at once.
    const attempts = this.hosted ? 3 : 1;
    for (let attempt = 1; ; attempt++) {
      const perRequest = this.hosted ? AbortSignal.any([signal, AbortSignal.timeout(HOSTED_REQUEST_TIMEOUT_MS)]) : signal;
      try {
        response = await fetch(`${this.baseUrl.replace(/\/$/, "")}/v1/chat/completions`, {
          method: "POST",
          signal: perRequest,
          headers: { "content-type": "application/json", ...(this.options.apiKey ? { authorization: `Bearer ${this.options.apiKey}` } : {}) },
          body: JSON.stringify(body),
        });
      } catch (err) {
        if (isAbort(err)) throw new OcrFailure("timeout", "local model request timed out", true);
        throw new OcrFailure("provider_error", `local model network error: ${String(err)}`, true);
      }
      if (response.status !== 429 || attempt >= attempts || signal.aborted) break;
      // OpenRouter free tier: a daily cap ("free-models-per-day") doesn't clear by waiting seconds.
      const detail = await response.clone().text().catch(() => "");
      if (DAILY_QUOTA.test(detail)) break;
      const retryAfter = Number(response.headers.get("retry-after"));
      await response.body?.cancel();
      await new Promise((r) => setTimeout(r, Math.min(20_000, Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 4_000 * attempt)));
    }
    if (!response.ok) {
      const detail = (await response.text().catch(() => "")).slice(0, 400);
      if (response.status === 429 && DAILY_QUOTA.test(detail)) throw new OcrFailure("quota_exhausted", "hosted model daily quota exhausted", false);
      throw classifyHttpStatus("local model", response.status, detail);
    }
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
    if (choice?.finish_reason === "length") throw new OcrFailure("malformed_output", TRUNCATED, true);
    // Some templates leave the reasoning inline; keep only the JSON object.
    let text = (choice?.message?.content ?? "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    const start = text.indexOf("{");
    if (start > 0) text = text.slice(start);
    if (!text) throw new OcrFailure("malformed_output", EMPTY, true);
    return text;
  }
}
