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
const STEP_DOWN_WITHIN_MS = 90_000;
/** Streaming watchdog: checked from this many seconds on, requiring this many characters per second on average. */
const STALL_AFTER_S = 45;
const MIN_CHARS_PER_S = 100;
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
  /**
   * Hosted (OpenRouter) only: route only to providers that declare every parameter we send (default true). Some
   * models honour json_schema without declaring it (Nemotron 3 Ultra): turn this off for them; the schema check
   * after parsing still rejects anything malformed.
   */
  requireParameters?: boolean;
  /** Hosted only: per-request time limit (default 180 s). A bigger output budget needs a longer limit. */
  requestTimeoutMs?: number;
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
    const started = Date.now();
    try {
      return await this.request(args, effort);
    } catch (err) {
      // A hosted reasoning model can spend the whole output budget thinking (EXP-010: g5 truncated at
      // "low", verified at "minimal"; ch-4 truncated even at "minimal"), or finish with an empty answer.
      // Retry once with one step less reasoning; the verifier still gates the result.
      // On a gateway that can't go below "low", a step down would repeat the same request.
      const floor = this.hosted && !/openrouter\.ai/.test(this.baseUrl) && (effort === "low" || effort === "minimal" || effort === "none");
      const lower = floor ? undefined : LOWER_EFFORT[effort];
      const budgetSpent = err instanceof OcrFailure && (err.message === TRUNCATED || err.message === EMPTY);
      // Only after a quick failure: a request that already ran for minutes would make the student wait as long again.
      const quick = Date.now() - started < STEP_DOWN_WITHIN_MS;
      if (!this.hosted || !lower || !budgetSpent || !quick || args.signal.aborted) throw err;
      return this.request(args, lower);
    }
  }

  private async request(
    { messages, schema, schemaName, signal, onUsage, onDelta }: Parameters<JsonModel["complete"]>[0],
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
      // Streaming only feeds the progress display; the result is assembled exactly as without it.
      ...(onDelta ? { stream: true, stream_options: { include_usage: true } } : {}),
      ...(!this.hosted
        ? { chat_template_kwargs: { enable_thinking: thinking } }
        : /openrouter\.ai/.test(this.baseUrl)
          ? // OpenRouter: only route to providers that honour response_format/json_schema; keep reasoning short.
            { provider: { require_parameters: this.options.requireParameters ?? true }, reasoning: { effort } }
          : // Other OpenAI-compatible gateways (SOCLAAS): the standard parameter. Some models accept only
            // low | medium | xhigh (qwen3.8 rejects "minimal"), so nothing below "low" is sent.
            { reasoning_effort: effort === "minimal" || effort === "none" ? "low" : effort }),
    };
    let response!: Response;
    // Watchdog for a congested gateway (SOCLAAS, 2026-10-08: < 8 tokens/s, a lesson could never finish): when streaming,
    // nothing in the first 45 s, or less than ~30 tokens/s after that, ends the request early so the fallback gets the time.
    const stall = new AbortController();
    let streamed = 0;
    const started = Date.now();
    const watchdog = this.hosted && onDelta
      ? setInterval(() => {
          const seconds = (Date.now() - started) / 1000;
          if (seconds >= STALL_AFTER_S && streamed < seconds * MIN_CHARS_PER_S) {
            stall.abort(new Error(`provider too slow: ${Math.round(streamed / Math.max(seconds, 1))} chars/s after ${Math.round(seconds)} s`));
          }
        }, 5_000)
      : null;
    // Hosted free tiers: cap each request (a stuck call fails fast; the pipeline keeps an earlier
    // attempt) and back off briefly on 429 rate limits instead of failing at once.
    const attempts = this.hosted ? 3 : 1;
    for (let attempt = 1; ; attempt++) {
      const perRequest = this.hosted
        ? AbortSignal.any([signal, AbortSignal.timeout(this.options.requestTimeoutMs ?? HOSTED_REQUEST_TIMEOUT_MS), stall.signal])
        : signal;
      try {
        response = await fetch(`${this.baseUrl.replace(/\/$/, "").replace(/\/v1$/, "")}/v1/chat/completions`, {
          method: "POST",
          signal: perRequest,
          headers: { "content-type": "application/json", ...(this.options.apiKey ? { authorization: `Bearer ${this.options.apiKey}` } : {}) },
          body: JSON.stringify(body),
        });
      } catch (err) {
        if (watchdog) clearInterval(watchdog);
        if (stall.signal.aborted) throw new OcrFailure("timeout", String((stall.signal.reason as Error)?.message ?? "provider too slow"), true);
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
    if (!response.ok && watchdog) clearInterval(watchdog);
    if (!response.ok) {
      const detail = (await response.text().catch(() => "")).slice(0, 400);
      if (response.status === 429 && DAILY_QUOTA.test(detail)) throw new OcrFailure("quota_exhausted", "hosted model daily quota exhausted", false);
      throw classifyHttpStatus("local model", response.status, detail);
    }
    const json = onDelta
      ? await readStream(response, (content, reasoningChars) => ((streamed = content.length + reasoningChars), onDelta(content, reasoningChars)))
          .catch((err) => {
            if (stall.signal.aborted) throw new OcrFailure("timeout", String((stall.signal.reason as Error)?.message ?? "provider too slow"), true);
            if (isAbort(err)) throw new OcrFailure("timeout", "local model request timed out", true);
            throw new OcrFailure("provider_error", `local model stream error: ${String(err)}`, true);
          })
          .finally(() => watchdog && clearInterval(watchdog))
      : ((await response.json().catch(() => null)) as CompletionJson | null);
    const choice = json?.choices?.[0];
    const reasoning = choice?.message?.reasoning_content ?? choice?.message?.reasoning ?? "";
    onUsage?.({
      input: json?.usage?.prompt_tokens ?? 0,
      cachedInput: 0,
      output: json?.usage?.completion_tokens ?? 0,
      reasoning: json?.usage?.completion_tokens_details?.reasoning_tokens ?? Math.round(reasoning.length / 3.5),
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

interface CompletionJson {
  choices?: { finish_reason?: string | null; message?: { content?: string | null; reasoning_content?: string | null; reasoning?: string | null } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number; completion_tokens_details?: { reasoning_tokens?: number } };
}

/**
 * Reads an OpenAI-style server-sent event stream into the same shape as a non-streamed completion,
 * reporting the answer text so far (and the amount of hidden reasoning) as it arrives.
 */
async function readStream(response: Response, onDelta: (content: string, reasoningChars: number) => void): Promise<CompletionJson> {
  const reader = response.body!.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  let content = "";
  let reasoning = "";
  let finish: string | null = null;
  let usage: CompletionJson["usage"];
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    let newline: number;
    let changed = false;
    while ((newline = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (!line.startsWith("data:")) continue; // comments (": OPENROUTER PROCESSING"), event names
      const data = line.slice(5).trim();
      if (data === "[DONE]") continue;
      let event: {
        choices?: { delta?: { content?: string | null; reasoning?: string | null; reasoning_content?: string | null }; finish_reason?: string | null }[];
        usage?: CompletionJson["usage"];
        error?: { message?: string };
      };
      try {
        event = JSON.parse(data);
      } catch {
        continue;
      }
      if (event.error) throw new Error(event.error.message ?? "stream error");
      const choice = event.choices?.[0];
      if (choice?.delta?.content) content += choice.delta.content;
      const thought = choice?.delta?.reasoning ?? choice?.delta?.reasoning_content;
      if (thought) reasoning += thought;
      if (choice?.finish_reason) finish = choice.finish_reason;
      if (event.usage) usage = event.usage;
      changed = true;
    }
    if (changed) onDelta(content, reasoning.length);
  }
  return { choices: [{ finish_reason: finish, message: { content, reasoning } }], usage };
}
