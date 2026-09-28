import { afterEach, describe, expect, it, vi } from "vitest";
import { AnthropicOcrProvider } from "../src/ocr/anthropic";
import { OpenAiOcrProvider } from "../src/ocr/openai";
import { OcrFailure } from "../src/ocr/provider";

const image = () => ({
  bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]).buffer as ArrayBuffer,
  contentType: "image/jpeg" as const,
  signal: new AbortController().signal,
});
const modelJson = JSON.stringify({
  status: "success",
  raw_text: "x² = 4",
  formatted_text: "$x^{2} = 4$",
  language: "unknown",
  confidence: "high",
  issues: [],
});

async function failureKind(promise: Promise<unknown>): Promise<[string, boolean]> {
  try {
    await promise;
  } catch (err) {
    expect(err).toBeInstanceOf(OcrFailure);
    return [(err as OcrFailure).kind, (err as OcrFailure).retryable];
  }
  throw new Error("expected failure");
}

afterEach(() => vi.unstubAllGlobals());

describe("OpenAiOcrProvider", () => {
  it("sends a strict json_schema request with the image and returns content", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ model: "gpt-x", choices: [{ finish_reason: "stop", message: { content: modelJson } }] }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const out = await new OpenAiOcrProvider("sk-test", "gpt-x").extract(image());
    expect(out).toEqual({ text: modelJson, model: "gpt-x" });
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.response_format.json_schema.strict).toBe(true);
    expect(body.messages[0].role).toBe("system");
    expect(body.messages[1].content[1].image_url.url).toMatch(/^data:image\/jpeg;base64,/);
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer sk-test");
  });

  it("maps refusals, truncation, rate limits, auth errors, and timeouts", async () => {
    const run = (response: Response | Error) => {
      vi.stubGlobal("fetch", vi.fn(async () => {
        if (response instanceof Error) throw response;
        return response;
      }));
      return failureKind(new OpenAiOcrProvider("k", "m").extract(image()));
    };
    expect(await run(Response.json({ choices: [{ message: { refusal: "no" } }] }))).toEqual(["refused", false]);
    expect(await run(Response.json({ choices: [{ finish_reason: "length", message: { content: "{" } }] }))).toEqual(["malformed_output", true]);
    expect(await run(new Response("slow down", { status: 429 }))).toEqual(["provider_error", true]);
    expect(await run(new Response("bad key", { status: 401 }))).toEqual(["provider_error", false]);
    expect(await run(new DOMException("aborted", "AbortError"))).toEqual(["timeout", true]);
    expect(await run(Response.json({ choices: [] }))).toEqual(["malformed_output", true]);
  });
});

describe("AnthropicOcrProvider", () => {
  const message = (overrides: Record<string, unknown>) =>
    Response.json({
      id: "msg_1",
      type: "message",
      role: "assistant",
      model: "claude-opus-5",
      content: [{ type: "text", text: modelJson }],
      stop_reason: "end_turn",
      stop_sequence: null,
      usage: { input_tokens: 1, output_tokens: 1 },
      ...overrides,
    });

  it("sends system prompt, image, json_schema output format and fallback beta", async () => {
    const fetchMock = vi.fn(async (_url: unknown, _init?: RequestInit) => message({}));
    const provider = new AnthropicOcrProvider("sk-ant-test", "claude-opus-5", fetchMock as unknown as typeof fetch);
    const out = await provider.extract(image());
    expect(out.text).toBe(modelJson);
    const init = fetchMock.mock.calls[0]![1]!;
    const body = JSON.parse(init.body as string);
    expect(body.system).toContain("untrusted data");
    expect(body.output_config.format.type).toBe("json_schema");
    expect(body.fallbacks).toBe("default");
    expect(body.messages[0].content[0].source.media_type).toBe("image/jpeg");
    expect(new Headers(init.headers).get("anthropic-beta")).toContain("server-side-fallback-2026-07-01");
  });

  it("maps refusal and truncation stop reasons, and HTTP errors", async () => {
    const run = (response: Response) =>
      failureKind(new AnthropicOcrProvider("k", "m", (async () => response.clone()) as unknown as typeof fetch).extract(image()));
    expect(await run(message({ stop_reason: "refusal" }))).toEqual(["refused", false]);
    expect(await run(message({ stop_reason: "max_tokens" }))).toEqual(["malformed_output", true]);
    expect(await run(message({ content: [] }))).toEqual(["malformed_output", true]);
    expect(await run(Response.json({ type: "error", error: { type: "authentication_error", message: "bad" } }, { status: 401 }))).toEqual(["provider_error", false]);
  });
});
