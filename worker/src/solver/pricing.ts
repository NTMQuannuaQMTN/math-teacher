/**
 * Standard paid-tier prices (USD per 1M tokens) for cost logging.
 * OpenAI: developers.openai.com/api/docs/pricing (checked 2026-09-29).
 * Gemini: ai.google.dev/gemini-api/docs/pricing (checked 2026-09-29).
 *
 * Default solve path is Gemini: flash first, pro on verify failure. OCR stays on OpenAI.
 */
const PRICES: Record<string, { input: number; cached: number; output: number }> = {
  // OpenAI
  "gpt-5.5": { input: 5, cached: 0.5, output: 30 },
  "gpt-5.4": { input: 2.5, cached: 0.25, output: 15 },
  "gpt-5.4-mini": { input: 0.75, cached: 0.075, output: 4.5 },
  "gpt-5.4-nano": { input: 0.2, cached: 0.02, output: 1.25 },
  "gpt-5-mini": { input: 0.25, cached: 0.025, output: 2 },
  "gpt-4.1": { input: 2, cached: 0.5, output: 8 },
  "gpt-4.1-mini": { input: 0.4, cached: 0.1, output: 1.6 },
  "gpt-4.1-nano": { input: 0.1, cached: 0.025, output: 0.4 },
  // SOCLAAS (NUS gateway; its /v1/models listing, checked 2026-10-07). "default" is an alias of qwen3.6:35b.
  "qwen3.6:35b": { input: 0.45, cached: 0.45, output: 1.52 },
  default: { input: 0.45, cached: 0.45, output: 1.52 },
  "qwen3.8:27b": { input: 0.41, cached: 0.41, output: 2.32 },
  "gemma4:26b": { input: 0.1, cached: 0.1, output: 0.38 },
  // Gemini (paid tier, prompts ≤ 200k for Pro). Billed output includes thinking tokens.
  "gemini-3.8-flash": { input: 0.75, cached: 0.075, output: 3.75 },
  "gemini-3.7-flash": { input: 0.75, cached: 0.075, output: 3.75 },
  "gemini-3.6-flash": { input: 0.75, cached: 0.075, output: 3.75 },
  "gemini-3.5-flash": { input: 1.5, cached: 0.15, output: 9 },
  "gemini-3.5-flash-lite": { input: 0.3, cached: 0.03, output: 2.5 },
  "gemini-3.1-flash-lite": { input: 0.25, cached: 0.025, output: 1.5 },
  "gemini-3.1-pro-preview": { input: 2, cached: 0.2, output: 12 },
  "gemini-3-flash-preview": { input: 0.5, cached: 0.05, output: 3 },
  "gemini-2.5-pro": { input: 1.25, cached: 0.125, output: 10 },
  "gemini-2.5-flash": { input: 0.3, cached: 0.03, output: 2.5 },
  "gemini-2.5-flash-lite": { input: 0.1, cached: 0.01, output: 0.4 },
};

export interface Usage {
  input: number;
  cachedInput: number;
  output: number;
  reasoning: number;
}

export const emptyUsage = (): Usage => ({ input: 0, cachedInput: 0, output: 0, reasoning: 0 });

export function addUsage(a: Usage, b: Usage): Usage {
  return { input: a.input + b.input, cachedInput: a.cachedInput + b.cachedInput, output: a.output + b.output, reasoning: a.reasoning + b.reasoning };
}

function priceKey(model: string): string | undefined {
  const normalized = model.replace(/^models\//, "");
  return Object.keys(PRICES)
    .sort((x, y) => y.length - x.length)
    .find((k) => normalized === k || normalized.startsWith(`${k}-`));
}

/** Estimated USD cost; null for unknown models. `output` already includes reasoning tokens. */
export function estimateCost(model: string, usage: Usage): number | null {
  const key = priceKey(model);
  const price = key ? PRICES[key] : undefined;
  if (!price) return null;
  const uncached = usage.input - usage.cachedInput;
  return (uncached * price.input + usage.cachedInput * price.cached + usage.output * price.output) / 1e6;
}

export function formatUsage(model: string, usage: Usage): string {
  const cost = estimateCost(model, usage);
  return `model=${model} in=${usage.input} (cached ${usage.cachedInput}) out=${usage.output} (reasoning ${usage.reasoning})${cost === null ? "" : ` ≈ $${cost.toFixed(4)}`}`;
}

/** Parses the `usage` object of an OpenAI Chat Completions response. */
export function usageFromOpenAi(raw: unknown): Usage {
  const u = (raw ?? {}) as {
    prompt_tokens?: number;
    completion_tokens?: number;
    prompt_tokens_details?: { cached_tokens?: number };
    completion_tokens_details?: { reasoning_tokens?: number };
  };
  return {
    input: u.prompt_tokens ?? 0,
    cachedInput: u.prompt_tokens_details?.cached_tokens ?? 0,
    output: u.completion_tokens ?? 0,
    reasoning: u.completion_tokens_details?.reasoning_tokens ?? 0,
  };
}

/** Parses Gemini `usageMetadata` from generateContent. */
export function usageFromGemini(raw: unknown): Usage {
  const u = (raw ?? {}) as {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    thoughtsTokenCount?: number;
    cachedContentTokenCount?: number;
  };
  const thoughts = u.thoughtsTokenCount ?? 0;
  // Gemini bills thinking with output; candidatesTokenCount is the visible completion.
  return {
    input: u.promptTokenCount ?? 0,
    cachedInput: u.cachedContentTokenCount ?? 0,
    output: (u.candidatesTokenCount ?? 0) + thoughts,
    reasoning: thoughts,
  };
}
