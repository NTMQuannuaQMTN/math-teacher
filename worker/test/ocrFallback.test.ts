import { describe, expect, it } from "vitest";
import { OcrFailure, type OcrProvider } from "../src/ocr/provider";
import { FallbackOcrProvider } from "../src/ocr/service";

const input = () => ({ bytes: new ArrayBuffer(4), contentType: "image/jpeg" as const, signal: new AbortController().signal });
const provider = (name: string, behaviour: () => Promise<string>): OcrProvider & { calls: number } => {
  const p = {
    name,
    calls: 0,
    async extract() {
      p.calls++;
      return { text: await behaviour(), model: name };
    },
  };
  return p;
};

describe("OCR provider fallback", () => {
  it("uses only the primary when it works", async () => {
    const primary = provider("gemini", async () => "ok");
    const backup = provider("openai", async () => "backup");
    expect((await new FallbackOcrProvider(primary, backup).extract(input())).model).toBe("gemini");
    expect(backup.calls).toBe(0);
  });

  it("falls back when the primary is overloaded or out of quota", async () => {
    const primary = provider("gemini", async () => {
      throw new OcrFailure("provider_error", "Gemini returned HTTP 503", true);
    });
    const backup = provider("openai", async () => "backup");
    expect((await new FallbackOcrProvider(primary, backup).extract(input())).model).toBe("openai");
  });

  it("does not fall back on refusals (the backup would refuse too, and it costs money)", async () => {
    const primary = provider("gemini", async () => {
      throw new OcrFailure("refused", "blocked", false);
    });
    const backup = provider("openai", async () => "backup");
    await expect(new FallbackOcrProvider(primary, backup).extract(input())).rejects.toBeInstanceOf(OcrFailure);
    expect(backup.calls).toBe(0);
  });
});
