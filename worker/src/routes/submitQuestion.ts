import type { Env } from "../types";
import {
  ALLOWED_IMAGE_TYPES,
  errorResponse,
  getClientIp,
  isUploadedFile,
  jsonResponse,
  sniffImageType,
} from "../utils";
import { checkRateLimit } from "../ratelimit";
import { AnthropicProvider } from "../ai/anthropic";
import { AIProviderError } from "../ai/provider";
import {
  GeometrySpecSchema,
  QuestionExtractionSchema,
  SolutionSchema,
  parseAndValidate,
} from "../schema";
import {
  insertProcessingQuestion,
  markQuestionComplete,
  markQuestionFailed,
  saveExtraction,
  saveGeometrySpec,
  saveSolution,
} from "../db";
import { toClientQuestion } from "../responses";
import { getQuestion, getGeometrySpecForQuestion, getSolutionForQuestion } from "../db";

export async function handleSubmitQuestion(request: Request, env: Env): Promise<Response> {
  const ip = getClientIp(request);
  const withinLimit = await checkRateLimit(env, ip);
  if (!withinLimit) {
    return errorResponse(429, "Too many submissions. Please try again later.", "rate_limited");
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse(400, "Expected multipart/form-data with an 'image' field.", "bad_request");
  }

  const file = formData.get("image");
  if (!isUploadedFile(file)) {
    return errorResponse(400, "Missing 'image' file field.", "missing_image");
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return errorResponse(
      415,
      `Unsupported image type '${file.type || "unknown"}'. Use JPEG, PNG, or WebP.`,
      "unsupported_type"
    );
  }

  const maxBytes = Number.parseInt(env.MAX_UPLOAD_BYTES, 10) || 8 * 1024 * 1024;
  if (file.size <= 0) {
    return errorResponse(400, "Uploaded file is empty.", "empty_file");
  }
  if (file.size > maxBytes) {
    return errorResponse(
      413,
      `Image too large (${Math.round(file.size / 1024)}KB). Max is ${Math.round(maxBytes / 1024)}KB.`,
      "file_too_large"
    );
  }

  const imageBytes = await file.arrayBuffer();

  const sniffedType = sniffImageType(imageBytes);
  if (!sniffedType) {
    return errorResponse(
      415,
      "This file doesn't look like a valid JPEG, PNG, or WebP image.",
      "invalid_image_content"
    );
  }
  // Trust the sniffed type over the client-declared one from here on — it's
  // derived from the actual bytes, not attacker-controlled request metadata.
  const contentType = sniffedType;

  const questionId = crypto.randomUUID();
  const r2Key = `questions/${questionId}`;

  try {
    await env.IMAGES.put(r2Key, imageBytes, { httpMetadata: { contentType } });
  } catch (err) {
    return errorResponse(502, "Failed to store image. Please try again.", "storage_failed");
  }

  await insertProcessingQuestion(env, questionId, r2Key, contentType);

  if (!env.ANTHROPIC_API_KEY) {
    await markQuestionFailed(env, questionId, "Server is missing AI provider credentials.");
    return errorResponse(500, "AI provider is not configured on the server.", "provider_unconfigured");
  }

  const ai = new AnthropicProvider(env.ANTHROPIC_API_KEY, env.ANTHROPIC_MODEL);

  try {
    // 1. Understand + classify.
    const rawExtraction = await ai.extractQuestion(imageBytes, contentType);
    const extractionResult = parseAndValidate(rawExtraction, QuestionExtractionSchema);
    if (!extractionResult.ok) {
      console.error("Extraction validation failed", extractionResult.error);
      const safeMessage = "Could not understand the question in this image.";
      await markQuestionFailed(env, questionId, safeMessage);
      return errorResponse(422, safeMessage, "extraction_failed");
    }
    const extraction = extractionResult.data;

    if (extraction.not_a_math_question) {
      await saveExtraction(env, questionId, extraction);
      await markQuestionFailed(env, questionId, "Image does not appear to contain a math question.");
      return jsonResponse(
        {
          id: questionId,
          status: "failed",
          error: "This doesn't look like a math question. Try a clearer photo of the problem.",
          classification: null,
          geometry: null,
          solution: null,
        },
        { status: 200 }
      );
    }

    await saveExtraction(env, questionId, extraction);

    // 2. Geometry diagram, only if needed. Failures here (malformed output OR
    // a thrown/network error) are non-fatal: we still solve and explain, just
    // without an interactive figure. This favors a usable answer over a hard
    // failure when only the optional diagram step misbehaves.
    if (extraction.is_geometry && extraction.diagram_required) {
      try {
        const rawGeometry = await ai.generateGeometry(extraction);
        const geometryResult = parseAndValidate(rawGeometry, GeometrySpecSchema);
        if (geometryResult.ok) {
          await saveGeometrySpec(env, questionId, geometryResult.data);
        } else {
          console.error("Geometry validation failed", geometryResult.error);
        }
      } catch (err) {
        console.error("Geometry generation error", err instanceof AIProviderError ? err.message : err);
      }
    }

    // 3. Solve + explain.
    const rawSolution = await ai.solve(extraction);
    const solutionResult = parseAndValidate(rawSolution, SolutionSchema);
    if (!solutionResult.ok) {
      console.error("Solution validation failed", solutionResult.error);
      const safeMessage = "Could not solve this question.";
      await markQuestionFailed(env, questionId, safeMessage);
      return errorResponse(422, safeMessage, "solve_failed");
    }
    await saveSolution(env, questionId, solutionResult.data);
    await markQuestionComplete(env, questionId);
  } catch (err) {
    console.error("AI pipeline error", err instanceof AIProviderError ? err.message : err);
    const safeMessage = "The AI service failed to process this question. Please try again.";
    await markQuestionFailed(env, questionId, safeMessage);
    return errorResponse(502, safeMessage, "ai_failure");
  }

  const [row, geometry, solution] = await Promise.all([
    getQuestion(env, questionId),
    getGeometrySpecForQuestion(env, questionId),
    getSolutionForQuestion(env, questionId),
  ]);
  if (!row) {
    return errorResponse(500, "Question vanished after processing.", "internal_error");
  }

  return jsonResponse(toClientQuestion(row, geometry?.spec_json ?? null, solution ?? null));
}
