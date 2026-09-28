import { z } from "zod";
import {
  LIMITS,
  OcrIssueSchema,
  OcrLanguageSchema,
  type OcrIssue,
  type OcrResult,
} from "../../../shared/src/contract";
import {
  containsVietnamese,
  isWellFormedMathText,
  mathTextToPlain,
  normalizeProblemText,
} from "../../../shared/src/mathText";
import { OcrFailure } from "./provider";

/**
 * The shape we ask every model to produce. Strict: unknown keys are rejected
 * so a confused model can't smuggle extra fields through.
 */
export const ModelOcrOutputSchema = z.strictObject({
  status: z.enum(["success", "no_math_found", "unreadable"]),
  raw_text: z.string(),
  formatted_text: z.string(),
  language: OcrLanguageSchema,
  confidence: z.enum(["high", "medium", "low"]),
  issues: z.array(OcrIssueSchema),
});
export type ModelOcrOutput = z.infer<typeof ModelOcrOutputSchema>;

/** JSON Schema handed to providers that support constrained decoding. */
export const MODEL_OCR_JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["status", "raw_text", "formatted_text", "language", "confidence", "issues"],
  properties: {
    status: { type: "string", enum: ["success", "no_math_found", "unreadable"] },
    raw_text: { type: "string" },
    formatted_text: { type: "string" },
    language: { type: "string", enum: OcrLanguageSchema.options },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
    issues: { type: "array", items: { type: "string", enum: OcrIssueSchema.options } },
  },
};

/** Issues that mean "the text was read, but the student should double-check it". */
const QUALITY_ISSUES: ReadonlySet<OcrIssue> = new Set([
  "blurry",
  "cut_off",
  "handwriting_uncertain",
  "low_resolution",
  "glare_or_shadow",
]);

function parseJsonLoosely(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(trimmed);
  } catch {
    // Some models wrap JSON in prose despite instructions; take the outermost object.
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start === -1 || end <= start) throw new OcrFailure("malformed_output", "OCR output is not JSON", true);
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      throw new OcrFailure("malformed_output", "OCR output is not JSON", true);
    }
  }
}

/**
 * Detects degenerate output: models occasionally loop and emit the same line
 * or character run over and over, which is never a real problem statement.
 */
export function looksDegenerate(text: string): boolean {
  const compact = text.replace(/\s+/g, "");
  if (compact.length < 40) return false;
  if (new Set(compact).size <= 3) return true;
  if (/(.{1,20})\1{12,}/su.test(compact)) return true;
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length >= 8) {
    const counts = new Map<string, number>();
    for (const line of lines) counts.set(line, (counts.get(line) ?? 0) + 1);
    const max = Math.max(...counts.values());
    if (max / lines.length > 0.6) return true;
  }
  return false;
}

/** Escapes stray dollar signs so text without valid maths still renders verbatim. */
function escapeDollars(text: string): string {
  return text.replace(/(^|[^\\])\$/g, "$1\\$");
}

/**
 * Turns raw provider text into a trusted, validated OcrResult.
 * Throws OcrFailure("malformed_output") if the output can't be trusted.
 */
export function normalizeOcrOutput(
  providerText: string,
  meta: { provider: string; model: string; durationMs: number },
): OcrResult {
  const parsed = ModelOcrOutputSchema.safeParse(parseJsonLoosely(providerText));
  if (!parsed.success) {
    throw new OcrFailure("malformed_output", `OCR output failed validation: ${parsed.error.message.slice(0, 300)}`, true);
  }
  const output = parsed.data;

  let rawText = normalizeProblemText(output.raw_text).slice(0, LIMITS.maxProblemChars);
  let formattedText = normalizeProblemText(output.formatted_text).slice(0, LIMITS.maxProblemChars);
  const issues = new Set<OcrIssue>(output.issues);
  let status: OcrResult["status"] = output.status;

  // Fill a missing representation from the other rather than failing.
  if (!formattedText && rawText) formattedText = escapeDollars(rawText);
  if (!rawText && formattedText) rawText = formattedText.replace(/\$/g, "");

  if (formattedText && isWellFormedMathText(formattedText)) {
    // Derive the plain text from the validated formatted text instead of trusting the
    // model's own plain rendering, which is inconsistent in practice (ASCII-art
    // fractions, "x^2" instead of "x²", placeholder glyphs for braces).
    const derived = normalizeProblemText(mathTextToPlain(formattedText));
    if (derived) rawText = derived.slice(0, LIMITS.maxProblemChars);
  } else if (formattedText) {
    // Broken maths markup would render as garbage; fall back to the plain transcription.
    formattedText = escapeDollars(rawText);
  }

  if (status === "success") {
    if (!rawText.trim()) {
      status = "unreadable";
    } else if (looksDegenerate(rawText) || looksDegenerate(formattedText)) {
      throw new OcrFailure("malformed_output", "OCR output looks degenerate (repeated content)", true);
    } else if (output.confidence === "low" || [...issues].some((issue) => QUALITY_ISSUES.has(issue))) {
      status = "low_quality";
    }
  }
  if (status === "unreadable") {
    rawText = "";
    formattedText = "";
  }

  // The model's language label is a hint; Vietnamese-only letters are a fact.
  let language = output.language;
  if (containsVietnamese(rawText) && (language === "en" || language === "unknown")) {
    language = /\b(the|and|find|solve|if|of)\b/i.test(rawText) ? "mixed" : "vi";
  }

  return {
    status,
    rawText,
    formattedText,
    language,
    confidence: { level: output.confidence, source: "model_self_report" },
    issues: [...issues],
    provider: meta.provider,
    model: meta.model.slice(0, 80),
    durationMs: Math.max(0, Math.round(meta.durationMs)),
  };
}
