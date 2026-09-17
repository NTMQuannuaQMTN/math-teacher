import type { GeometrySpec, QuestionExtraction, Solution } from "../schema";

/** Anything that talks to an external multimodal LLM implements this.
 * Route handlers depend only on this interface, so swapping providers
 * later (or adding a fallback) never touches request-handling code. */
export interface AIProvider {
  extractQuestion(imageBytes: ArrayBuffer, contentType: string): Promise<string>;
  generateGeometry(extraction: QuestionExtraction): Promise<string>;
  solve(extraction: QuestionExtraction): Promise<string>;
}

export class AIProviderError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "AIProviderError";
  }
}

export type { GeometrySpec, QuestionExtraction, Solution };
