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
      // Thinking tokens count against this cap; a long multi-part proof needs room (40K truncated a 3-part
      // chuyên geometry proof, 2026-10-06). 65,536 is the model maximum.
      maxOutputTokens: 65_536,
      signal,
    });
    onUsage?.(usage);
    return text;
  }
}
