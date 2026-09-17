import { test } from "node:test";
import assert from "node:assert/strict";
import { createAIProvider, ProviderConfigError } from "./factory";
import { OpenAIProvider } from "./openai";
import { AnthropicProvider } from "./anthropic";
import type { Env } from "../types";

function baseEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: {} as Env["DB"],
    IMAGES: {} as Env["IMAGES"],
    AI_PROVIDER: "openai",
    OPENAI_MODEL: "gpt-4o",
    ANTHROPIC_MODEL: "claude-sonnet-5",
    MAX_UPLOAD_BYTES: "8388608",
    RATE_LIMIT_PER_HOUR: "10",
    ...overrides,
  };
}

test("createAIProvider defaults to OpenAI", () => {
  const provider = createAIProvider(baseEnv({ AI_PROVIDER: "", OPENAI_API_KEY: "sk-test" }));
  assert.ok(provider instanceof OpenAIProvider);
});

test("createAIProvider throws a clear config error when the OpenAI key is missing", () => {
  assert.throws(() => createAIProvider(baseEnv({ AI_PROVIDER: "openai" })), ProviderConfigError);
});

test("createAIProvider can select Anthropic explicitly", () => {
  const provider = createAIProvider(
    baseEnv({ AI_PROVIDER: "anthropic", ANTHROPIC_API_KEY: "sk-ant-test" })
  );
  assert.ok(provider instanceof AnthropicProvider);
});

test("createAIProvider throws a clear config error when the Anthropic key is missing", () => {
  assert.throws(() => createAIProvider(baseEnv({ AI_PROVIDER: "anthropic" })), ProviderConfigError);
});

test("createAIProvider rejects an unknown provider name", () => {
  assert.throws(() => createAIProvider(baseEnv({ AI_PROVIDER: "gemini" })), ProviderConfigError);
});
