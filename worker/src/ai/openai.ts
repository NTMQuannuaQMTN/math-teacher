import type { QuestionExtraction } from "../schema";
import { AIProviderError, type AIProvider } from "./provider";
import { EXTRACTION_PROMPT, GEOMETRY_PROMPT, SOLVE_PROMPT } from "./prompts";
import { fetchWithRetry } from "./httpRetry";
import { arrayBufferToBase64 } from "./encoding";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export class OpenAIProvider implements AIProvider {
  constructor(private readonly apiKey: string, private readonly model: string) {}

  private async callText(params: {
    prompt: string;
    image?: { base64: string; mediaType: string };
    maxTokens?: number;
  }): Promise<string> {
    const content: Record<string, unknown>[] = [{ type: "text", text: params.prompt }];
    if (params.image) {
      content.push({
        type: "image_url",
        image_url: { url: `data:${params.image.mediaType};base64,${params.image.base64}` },
      });
    }

    const response = await fetchWithRetry(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: params.maxTokens ?? 2048,
        // Our prompts already instruct "respond with only a JSON object";
        // json_object mode makes the API enforce that the output parses as
        // JSON. It does not validate our specific shape, so parseAndValidate
        // (Zod) downstream still does the real work.
        response_format: { type: "json_object" },
        messages: [{ role: "user", content }],
      }),
    });

    const json = (await response.json()) as {
      choices?: { message?: { content?: string | null } }[];
    };
    const text = json.choices?.[0]?.message?.content;
    if (!text) {
      throw new AIProviderError("AI provider response had no text content");
    }
    return text;
  }

  async extractQuestion(imageBytes: ArrayBuffer, contentType: string): Promise<string> {
    const base64 = arrayBufferToBase64(imageBytes);
    return this.callText({
      prompt: EXTRACTION_PROMPT,
      image: { base64, mediaType: contentType },
      maxTokens: 1024,
    });
  }

  async generateGeometry(extraction: QuestionExtraction): Promise<string> {
    return this.callText({ prompt: GEOMETRY_PROMPT(extraction.extracted_text), maxTokens: 2048 });
  }

  async solve(extraction: QuestionExtraction): Promise<string> {
    return this.callText({
      prompt: SOLVE_PROMPT(extraction.extracted_text, extraction.topic),
      maxTokens: 2048,
    });
  }
}
