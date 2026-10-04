/**
 * API contract shared by the mobile app and the Worker.
 *
 * Everything that crosses the network boundary is described here as a Zod
 * schema, so both sides validate the same shape: the Worker validates what it
 * sends, and the app validates what it receives (it never trusts the network).
 *
 * Scope note: this is milestone 1 (image → OCR → edit → save). There are
 * deliberately no solution / answer / step fields. A future "solve" milestone
 * should add its own resource keyed by scan id rather than widening `Scan`.
 */
import { z } from "zod";

export const API_VERSION = "v1";

// ---------------------------------------------------------------------------
// Limits (enforced on both sides; the Worker is the authority)
// ---------------------------------------------------------------------------

export const LIMITS = {
  /** Max upload size accepted by the Worker. The app compresses well below this. */
  maxUploadBytes: 8 * 1024 * 1024,
  /** Reject images whose shorter side is below this many pixels. */
  minImageSide: 48,
  /** Reject images with fewer total pixels than this (e.g. 48x48 icons). */
  minImagePixels: 120 * 120,
  /** Reject absurd dimensions (decompression-bomb guard). */
  maxImageSide: 12_000,
  /** Max characters in a problem's text (raw or formatted). */
  maxProblemChars: 6_000,
  /** Page size for history listing. */
  maxPageSize: 50,
  /** Max separate questions one photo can be split into. */
  maxQuestions: 12,
} as const;

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

// ---------------------------------------------------------------------------
// OCR result
// ---------------------------------------------------------------------------

/**
 * - `success`        text was read and looks like a maths problem
 * - `low_quality`    text was read, but the provider flagged problems
 *                    (blur, cut off, uncertain handwriting) — worth checking
 * - `no_math_found`  the image is readable but contains no maths problem
 * - `unreadable`     nothing usable could be read
 */
export const OcrStatusSchema = z.enum(["success", "low_quality", "no_math_found", "unreadable"]);
export type OcrStatus = z.infer<typeof OcrStatusSchema>;

export const OcrLanguageSchema = z.enum(["vi", "en", "mixed", "unknown"]);
export type OcrLanguage = z.infer<typeof OcrLanguageSchema>;

export const OcrIssueSchema = z.enum([
  "blurry",
  "cut_off",
  "multiple_problems",
  "handwriting_uncertain",
  "low_resolution",
  "glare_or_shadow",
  "rotated",
]);
export type OcrIssue = z.infer<typeof OcrIssueSchema>;

/**
 * Confidence is the model's own coarse self-report, NOT a calibrated
 * probability. `source` makes that explicit so nothing downstream treats it
 * as a measured accuracy. It is null when the provider gives no signal.
 */
export const OcrConfidenceSchema = z.object({
  level: z.enum(["high", "medium", "low"]),
  source: z.literal("model_self_report"),
});
export type OcrConfidence = z.infer<typeof OcrConfidenceSchema>;

/** One problem found on the page. `text` uses the same markup as formattedText and includes its own number ("Bài 2. …"). */
export const OcrProblemSchema = z.object({
  /** Short display label, e.g. "Bài 2", "Câu 3", "Exercise 1"; empty if the problem has no number. */
  label: z.string().max(40),
  text: z.string().max(LIMITS.maxProblemChars),
});
export type OcrProblem = z.infer<typeof OcrProblemSchema>;

export const OcrResultSchema = z.object({
  status: OcrStatusSchema,
  /** Plain transcription using Unicode maths symbols (x², √, ≤). Never contains LaTeX. */
  rawText: z.string().max(LIMITS.maxProblemChars),
  /**
   * Display format: plain prose with inline maths in `$…$` and display maths
   * in `$$…$$` (LaTeX inside the delimiters). Rendered by the app's MathText.
   */
  formattedText: z.string().max(LIMITS.maxProblemChars),
  /**
   * The page split into separate problems (one entry when there is only one).
   * Sub-parts a), b)… of one exercise stay together. Defaults to [] for results stored before splitting existed.
   */
  problems: z.array(OcrProblemSchema).max(LIMITS.maxQuestions).default([]),
  language: OcrLanguageSchema,
  confidence: OcrConfidenceSchema.nullable(),
  issues: z.array(OcrIssueSchema).max(OcrIssueSchema.options.length),
  provider: z.string().max(40),
  model: z.string().max(80),
  durationMs: z.number().int().nonnegative(),
});
export type OcrResult = z.infer<typeof OcrResultSchema>;

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export const ErrorCodeSchema = z.enum([
  // request / validation
  "bad_request",
  "unauthorized",
  "not_found",
  "missing_image",
  "unsupported_image_type",
  "image_too_large",
  "image_too_small",
  "invalid_image",
  "text_too_long",
  "empty_text",
  "rate_limited",
  // processing
  "ocr_in_progress",
  "ocr_timeout",
  "ocr_provider_error",
  "ocr_malformed_output",
  "ocr_refused",
  "ocr_not_configured",
  "storage_error",
  "database_error",
  // solving
  "problem_not_confirmed",
  "solve_in_progress",
  "solve_timeout",
  "solve_provider_error",
  "solve_malformed_output",
  "solve_incomplete",
  /** The solving provider's daily quota is used up (free tiers); retrying before the reset can't help. */
  "solve_quota_exhausted",
  "solve_not_configured",
  "internal_error",
]);
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;

export const ApiErrorBodySchema = z.object({
  error: z.object({
    code: ErrorCodeSchema,
    /** User-safe English message. The app shows its own localized copy per code. */
    message: z.string(),
    /** Whether repeating the same request could plausibly succeed. */
    retryable: z.boolean(),
  }),
});
export type ApiErrorBody = z.infer<typeof ApiErrorBodySchema>;

// ---------------------------------------------------------------------------
// Scan resource
// ---------------------------------------------------------------------------

export const ScanSourceSchema = z.enum(["camera", "library"]);
export type ScanSource = z.infer<typeof ScanSourceSchema>;

export const ScanImageSchema = z.object({
  /** Short-lived signed URL. No auth header needed; expires at `urlExpiresAt`. */
  url: z.string(),
  urlExpiresAt: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

/** One confirmed question of a scan; each question is solved separately. */
export const QuestionSchema = z.object({
  /** Stable within the scan: "q1", "q2", … */
  id: z.string().regex(/^q\d{1,2}$/),
  label: z.string().max(40),
  text: z.string().max(LIMITS.maxProblemChars),
});
export type Question = z.infer<typeof QuestionSchema>;

export const ScanSchema = z.object({
  id: z.string(),
  /** `draft` until the student confirms the text; then `confirmed`. */
  status: z.enum(["draft", "confirmed"]),
  source: ScanSourceSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  confirmedAt: z.string().nullable(),
  image: ScanImageSchema,
  /** Latest OCR attempt, or null if OCR has not succeeded yet. */
  ocr: OcrResultSchema.nullable(),
  /** Why the latest OCR attempt failed, if it did (ocr is then null). */
  ocrError: z
    .object({ code: ErrorCodeSchema, retryable: z.boolean() })
    .nullable(),
  ocrAttempts: z.number().int().nonnegative(),
  /** The student-confirmed problem. Null while a draft. */
  problem: z
    .object({
      /** Same format as OcrResult.formattedText. */
      text: z.string(),
      /** True if the student changed the OCR output before confirming. */
      edited: z.boolean(),
      /** The problem split into separately solvable questions (at least one). */
      questions: z.array(QuestionSchema).min(1).max(LIMITS.maxQuestions),
    })
    .nullable(),
});
export type Scan = z.infer<typeof ScanSchema>;

export const ScanResponseSchema = z.object({ scan: ScanSchema });
export type ScanResponse = z.infer<typeof ScanResponseSchema>;

export const ScanListResponseSchema = z.object({
  items: z.array(ScanSchema),
  nextCursor: z.string().nullable(),
});
export type ScanListResponse = z.infer<typeof ScanListResponseSchema>;

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

/**
 * Either one problem (`text`) or several separately solvable questions.
 * Questions are what the student kept (and possibly edited) from the OCR split.
 */
export const ConfirmScanRequestSchema = z
  .object({
    text: z.string().max(LIMITS.maxProblemChars).optional(),
    questions: z
      .array(z.object({ label: z.string().max(40), text: z.string().max(LIMITS.maxProblemChars) }))
      .min(1)
      .max(LIMITS.maxQuestions)
      .optional(),
  })
  .refine((body) => (body.text === undefined) !== (body.questions === undefined), {
    message: "Provide either text or questions",
  });
export type ConfirmScanRequest = z.infer<typeof ConfirmScanRequestSchema>;

export const ListScansQuerySchema = z.object({
  status: z.enum(["draft", "confirmed"]).default("confirmed"),
  limit: z.coerce.number().int().min(1).max(LIMITS.maxPageSize).default(20),
  cursor: z.string().max(200).optional(),
});
export type ListScansQuery = z.infer<typeof ListScansQuerySchema>;

/** Header carrying a client-generated key that makes scan creation idempotent. */
export const IDEMPOTENCY_HEADER = "Idempotency-Key";
/** Format of device tokens and idempotency keys: 22–128 url-safe chars. */
export const OPAQUE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{22,128}$/;

/** Re-exported so consumers (the app) share this package's zod types instead of installing their own. */
export type { z };
