import { classifyHttpStatus, isAbort } from "./ocr/httpErrors";
import { OcrFailure } from "./ocr/provider";
import type { Usage } from "./solver/pricing";

/**
 * Minimal client for the Gemini Developer API (generateContent) with
 * structured JSON output. Used by both the OCR provider and the solver.
 * The API key goes in a header (not the URL) so it never appears in logs.
 */
const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export type GeminiPart = { text: string } | { inline_data: { mime_type: string; data: string } };
export interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

export interface GeminiRequest {
  apiKey: string;
  model: string;
  system: string;
  contents: GeminiContent[];
  /** JSON Schema the response must follow. */
  schema: Record<string, unknown>;
  /** Gemini 3+: "minimal" | "low" | "medium" | "high". Older models ignore it. */
  thinkingLevel?: string;
  maxOutputTokens?: number;
  signal: AbortSignal;
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
  usageMetadata?: {
    promptTokenCount?: number;
    cachedContentTokenCount?: number;
    candidatesTokenCount?: number;
    thoughtsTokenCount?: number;
  };
  modelVersion?: string;
}

/** Billed output = visible output + thinking tokens. */
function usageOf(meta: GeminiResponse["usageMetadata"]): Usage {
  const thoughts = meta?.thoughtsTokenCount ?? 0;
  return {
    input: meta?.promptTokenCount ?? 0,
    cachedInput: meta?.cachedContentTokenCount ?? 0,
    output: (meta?.candidatesTokenCount ?? 0) + thoughts,
    reasoning: thoughts,
  };
}

function supportsThinkingLevel(model: string): boolean {
  return /^gemini-(3|[4-9])/.test(model);
}

/** Gemini returns transient 503 ("overloaded") / 429 / 500 fairly often; failed calls aren't billed. */
const TRANSIENT = new Set([429, 500, 503]);
const BACKOFF_MS = [800, 2000];

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("aborted", "AbortError"));
    });
  });
}

async function post(req: GeminiRequest, body: string): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    let response: Response;
    try {
      response = await fetch(`${BASE}/${encodeURIComponent(req.model)}:generateContent`, {
        method: "POST",
        signal: req.signal,
        headers: { "content-type": "application/json", "x-goog-api-key": req.apiKey },
        body,
      });
    } catch (err) {
      if (isAbort(err)) throw new OcrFailure("timeout", "Gemini request timed out", true);
      if (attempt < BACKOFF_MS.length) {
        await sleep(BACKOFF_MS[attempt]!, req.signal);
        continue;
      }
      throw new OcrFailure("provider_error", `Gemini network error: ${String(err)}`, true);
    }
    if (response.ok || !TRANSIENT.has(response.status) || attempt >= BACKOFF_MS.length) return response;
    console.warn(`Gemini ${req.model} returned ${response.status}; retrying`);
    await response.body?.cancel();
    await sleep(BACKOFF_MS[attempt]!, req.signal);
  }
}

export async function geminiJson(req: GeminiRequest): Promise<{ text: string; usage: Usage; model: string }> {
  const generationConfig: Record<string, unknown> = {
    responseMimeType: "application/json",
    responseJsonSchema: req.schema,
    maxOutputTokens: req.maxOutputTokens ?? 16_000,
  };
  if (req.thinkingLevel && supportsThinkingLevel(req.model)) {
    generationConfig.thinkingConfig = { thinkingLevel: req.thinkingLevel };
  }

  const response = await post(
    req,
    JSON.stringify({ systemInstruction: { parts: [{ text: req.system }] }, contents: req.contents, generationConfig }),
  );
  if (!response.ok) {
    throw classifyHttpStatus("Gemini", response.status, (await response.text().catch(() => "")).slice(0, 400));
  }

  const body = (await response.json().catch(() => null)) as GeminiResponse | null;
  const usage = usageOf(body?.usageMetadata);
  if (body?.promptFeedback?.blockReason) {
    throw new OcrFailure("refused", `Gemini blocked the prompt: ${body.promptFeedback.blockReason}`, false);
  }
  const candidate = body?.candidates?.[0];
  const finish = candidate?.finishReason ?? "";
  if (/SAFETY|RECITATION|PROHIBITED|BLOCKLIST|SPII/.test(finish)) {
    throw new OcrFailure("refused", `Gemini stopped: ${finish}`, false);
  }
  if (finish === "MAX_TOKENS") throw new OcrFailure("malformed_output", "Gemini output was truncated", true);
  const text = (candidate?.content?.parts ?? [])
    .filter((p) => !p.thought && typeof p.text === "string")
    .map((p) => p.text)
    .join("");
  if (!text) throw new OcrFailure("malformed_output", "Gemini returned no text", true);
  return { text, usage, model: body?.modelVersion ?? req.model };
}
