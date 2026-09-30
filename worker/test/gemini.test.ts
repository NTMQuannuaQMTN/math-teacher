import { afterEach, describe, expect, it, vi } from "vitest";
import { OcrFailure } from "../src/ocr/provider";
import { GeminiJsonModel, toGeminiRequest } from "../src/solver/gemini";

afterEach(() => vi.unstubAllGlobals());

const schema = {
  type: "object",
  properties: { ok: { type: "boolean" } },
  required: ["ok"],
  additionalProperties: false,
};

describe("toGeminiRequest", () => {
  it("lifts system messages and maps assistant → model", () => {
    const out = toGeminiRequest([
      { role: "system", content: "sys" },
      { role: "user", content: "u1" },
      { role: "assistant", content: "a1" },
      { role: "user", content: "u2" },
    ]);
    expect(out.systemInstruction).toEqual({ parts: [{ text: "sys" }] });
    expect(out.contents).toEqual([
      { role: "user", parts: [{ text: "u1" }] },
      { role: "model", parts: [{ text: "a1" }] },
      { role: "user", parts: [{ text: "u2" }] },
    ]);
  });

  it("merges consecutive turns of the same role", () => {
    const out = toGeminiRequest([
      { role: "user", content: "a" },
      { role: "user", content: "b" },
    ]);
    expect(out.contents).toEqual([{ role: "user", parts: [{ text: "a\n\nb" }] }]);
  });
});

describe("GeminiJsonModel", () => {
  it("POSTs generateContent with JSON schema and returns text", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        candidates: [{ finishReason: "STOP", content: { parts: [{ text: '{"ok":true}' }] } }],
        usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5, thoughtsTokenCount: 2 },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const usages: unknown[] = [];
    const model = new GeminiJsonModel("key-test", "gemini-2.5-flash", "low");
    const text = await model.complete({
      messages: [
        { role: "system", content: "Be careful" },
        { role: "user", content: "Solve x" },
      ],
      schema,
      schemaName: "lesson",
      signal: new AbortController().signal,
      onUsage: (u) => usages.push(u),
    });

    expect(text).toBe('{"ok":true}');
    expect(usages).toEqual([{ input: 10, cachedInput: 0, output: 7, reasoning: 2 }]);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/models/gemini-2.5-flash:generateContent");
    expect(new Headers(init.headers).get("x-goog-api-key")).toBe("key-test");
    const body = JSON.parse(init.body as string);
    expect(body.systemInstruction.parts[0].text).toBe("Be careful");
    expect(body.generationConfig.responseMimeType).toBe("application/json");
    expect(body.generationConfig.responseJsonSchema).toEqual(schema);
    expect(body.generationConfig.thinkingConfig.thinkingBudget).toBe(0);
    expect(body.generationConfig.maxOutputTokens).toBe(16_000);
  });

  it("uses a non-zero thinking budget for medium effort", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) =>
      Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: "{}" }] } }] }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await new GeminiJsonModel("k", "gemini-2.5-pro", "medium").complete({
      messages: [{ role: "user", content: "x" }],
      schema,
      schemaName: "lesson",
      signal: new AbortController().signal,
    });
    const init = fetchMock.mock.calls[0]![1] as RequestInit | undefined;
    expect(init).toBeDefined();
    const body = JSON.parse(init!.body as string);
    expect(body.generationConfig.thinkingConfig.thinkingBudget).toBe(4096);
  });

  it("maps safety blocks, truncation, HTTP errors, and timeouts", async () => {
    const run = async (response: Response | Error) => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => {
          if (response instanceof Error) throw response;
          return response;
        }),
      );
      try {
        await new GeminiJsonModel("k", "m", "low").complete({
          messages: [{ role: "user", content: "x" }],
          schema,
          schemaName: "lesson",
          signal: new AbortController().signal,
        });
      } catch (err) {
        expect(err).toBeInstanceOf(OcrFailure);
        return [(err as OcrFailure).kind, (err as OcrFailure).retryable] as const;
      }
      throw new Error("expected failure");
    };

    expect(await run(Response.json({ candidates: [{ finishReason: "SAFETY", content: { parts: [] } }] }))).toEqual([
      "refused",
      false,
    ]);
    expect(await run(Response.json({ candidates: [{ finishReason: "MAX_TOKENS", content: { parts: [{ text: "{" }] } }] }))).toEqual([
      "malformed_output",
      true,
    ]);
    expect(await run(new Response("slow", { status: 429 }))).toEqual(["provider_error", true]);
    expect(await run(new Response("bad key", { status: 401 }))).toEqual(["provider_error", false]);
    expect(await run(new DOMException("aborted", "AbortError"))).toEqual(["timeout", true]);
    expect(await run(Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [] } }] }))).toEqual([
      "malformed_output",
      true,
    ]);
  });
});
