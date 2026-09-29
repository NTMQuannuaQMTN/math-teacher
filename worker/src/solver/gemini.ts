import { OcrFailure } from "../ocr/provider";
import { classifyHttpStatus, isAbort } from "../ocr/httpErrors";
import { usageFromGemini, type Usage } from "./pricing";
import { MAX_LESSON_COMPLETION_TOKENS, type ChatMessage, type JsonModel } from "./llm";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

/** Maps our reasoning_effort knobs onto Gemini thinkingBudget (0 = off). */
function thinkingBudget(effort: string): number {
  switch (effort) {
    case "high":
      return 8192;
    case "medium":
      return 4096;
    case "low":
    default:
      return 0;
  }
}

/** Convert OpenAI-style chat messages into Gemini systemInstruction + contents. */
export function toGeminiRequest(messages: ChatMessage[]): {
  systemInstruction?: { parts: { text: string }[] };
  contents: { role: "user" | "model"; parts: { text: string }[] }[];
} {
  const system: string[] = [];
  const contents: { role: "user" | "model"; parts: { text: string }[] }[] = [];
  for (const message of messages) {
    if (message.role === "system") {
      system.push(message.content);
      continue;
    }
    const role = message.role === "assistant" ? "model" : "user";
    const last = contents[contents.length - 1];
    if (last && last.role === role) {
      last.parts[0]!.text += `\n\n${message.content}`;
    } else {
      contents.push({ role, parts: [{ text: message.content }] });
    }
  }
  return {
    ...(system.length ? { systemInstruction: { parts: [{ text: system.join("\n\n") }] } } : {}),
    contents,
  };
}

interface GeminiResponse {
  candidates?: {
    finishReason?: string;
    content?: { parts?: { text?: string }[] };
  }[];
  usageMetadata?: unknown;
  promptFeedback?: { blockReason?: string };
}

/**
 * Gemini generateContent client that returns JSON text matching the lesson schema.
 * Uses the public Generative Language REST API (no SDK) so it runs on Cloudflare Workers.
 */
export class GeminiJsonModel implements JsonModel {
  readonly name = "gemini";

  constructor(
    private readonly apiKey: string,
    readonly model: string,
    private readonly reasoningEffort: string,
  ) {}

  async complete({ messages, schema, signal, onUsage }: Parameters<JsonModel["complete"]>[0]): Promise<string> {
    const { systemInstruction, contents } = toGeminiRequest(messages);
    if (!contents.length) throw new OcrFailure("malformed_output", "no user content for Gemini", true);

    const url = `${API_BASE}/${encodeURIComponent(this.model)}:generateContent`;
    const body: Record<string, unknown> = {
      ...(systemInstruction ? { systemInstruction } : {}),
      contents,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: MAX_LESSON_COMPLETION_TOKENS,
        responseMimeType: "application/json",
        responseJsonSchema: schema,
        thinkingConfig: { thinkingBudget: thinkingBudget(this.reasoningEffort) },
      },
    };

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        signal,
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": this.apiKey,
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      if (isAbort(err)) throw new OcrFailure("timeout", "Gemini request timed out", true);
      throw new OcrFailure("provider_error", `Gemini network error: ${String(err)}`, true);
    }

    if (!response.ok) {
      throw classifyHttpStatus("Gemini", response.status, (await response.text().catch(() => "")).slice(0, 400));
    }

    const json = (await response.json().catch(() => null)) as GeminiResponse | null;
    if (json?.usageMetadata) onUsage?.(usageFromGemini(json.usageMetadata));

    if (json?.promptFeedback?.blockReason) {
      throw new OcrFailure("refused", `Gemini blocked the prompt (${json.promptFeedback.blockReason})`, false);
    }

    const candidate = json?.candidates?.[0];
    const finish = candidate?.finishReason;
    if (finish === "SAFETY" || finish === "RECITATION" || finish === "BLOCKLIST" || finish === "PROHIBITED_CONTENT") {
      throw new OcrFailure("refused", `Gemini refused (${finish})`, false);
    }
    if (finish === "MAX_TOKENS") {
      throw new OcrFailure("malformed_output", "Gemini output was truncated", true);
    }

    const text = candidate?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    if (!text.trim()) throw new OcrFailure("malformed_output", "Gemini returned no content", true);
    return text;
  }
}
