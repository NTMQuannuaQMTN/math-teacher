import { geminiJson, type GeminiContent } from "../gemini";
import type { ChatMessage, JsonModel } from "./llm";

/** Solver model on the Gemini Developer API (same JsonModel contract as OpenAI). */
export class GeminiJsonModel implements JsonModel {
  readonly name = "gemini";

  constructor(
    private readonly apiKey: string,
    readonly model: string,
    private readonly thinkingLevel: string,
  ) {}

  async complete({ messages, schema, signal, onUsage }: Parameters<JsonModel["complete"]>[0]): Promise<string> {
    const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const contents: GeminiContent[] = messages
      .filter((m): m is ChatMessage & { role: "user" | "assistant" } => m.role !== "system")
      .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
    const { text, usage } = await geminiJson({
      apiKey: this.apiKey,
      model: this.model,
      system,
      contents,
      schema,
      thinkingLevel: this.thinkingLevel,
      maxOutputTokens: 24_000,
      signal,
    });
    onUsage?.(usage);
    return text;
  }
}
