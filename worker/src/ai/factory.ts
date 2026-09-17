import type { Env } from "../types";
import type { AIProvider } from "./provider";
import { AnthropicProvider } from "./anthropic";
import { OpenAIProvider } from "./openai";

export class ProviderConfigError extends Error {}

/** Picks the active AI backend from `AI_PROVIDER` (defaults to "openai").
 * This is what the AIProvider interface was built for — swapping providers
 * is a config change, not a route-handler change. See docs/DECISIONS.md. */
export function createAIProvider(env: Env): AIProvider {
  const provider = (env.AI_PROVIDER || "openai").toLowerCase();

  if (provider === "openai") {
    if (!env.OPENAI_API_KEY) {
      throw new ProviderConfigError("OPENAI_API_KEY is not configured on the server.");
    }
    return new OpenAIProvider(env.OPENAI_API_KEY, env.OPENAI_MODEL || "gpt-4o");
  }

  if (provider === "anthropic") {
    if (!env.ANTHROPIC_API_KEY) {
      throw new ProviderConfigError("ANTHROPIC_API_KEY is not configured on the server.");
    }
    return new AnthropicProvider(env.ANTHROPIC_API_KEY, env.ANTHROPIC_MODEL || "claude-sonnet-5");
  }

  throw new ProviderConfigError(`Unknown AI_PROVIDER "${provider}". Expected "openai" or "anthropic".`);
}
