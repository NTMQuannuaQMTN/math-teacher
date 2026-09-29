/**
 * OpenAI standard prices (USD per 1M tokens), from developers.openai.com/api/docs/pricing
 * (checked 2026-09-29). Used only to log an estimated cost per call; update when prices change.
 *
 * Geometry lessons default to gpt-5.4 first (then gpt-5.5 on verify failure): gpt-5.4 is
 * about half the $/token of gpt-5.5, so a verified mid-tier lesson costs roughly half a
 * strong-only one; escalations pay mid + strong.
 */
const PRICES: Record<string, { input: number; cached: number; output: number }> = {
  "gpt-5.5": { input: 5, cached: 0.5, output: 30 },
  "gpt-5.4": { input: 2.5, cached: 0.25, output: 15 },
  "gpt-5.4-mini": { input: 0.75, cached: 0.075, output: 4.5 },
  "gpt-5.4-nano": { input: 0.2, cached: 0.02, output: 1.25 },
  "gpt-5-mini": { input: 0.25, cached: 0.025, output: 2 },
  "gpt-4.1": { input: 2, cached: 0.5, output: 8 },
  "gpt-4.1-mini": { input: 0.4, cached: 0.1, output: 1.6 },
  "gpt-4.1-nano": { input: 0.1, cached: 0.025, output: 0.4 },
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

/** Estimated USD cost; null for unknown models. `output` already includes reasoning tokens. */
export function estimateCost(model: string, usage: Usage): number | null {
  const key = Object.keys(PRICES).sort((x, y) => y.length - x.length).find((k) => model === k || model.startsWith(`${k}-2`));
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
