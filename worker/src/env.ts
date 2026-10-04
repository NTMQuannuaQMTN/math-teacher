export interface Env {
  DB: D1Database;
  IMAGES: R2Bucket;

  ENVIRONMENT: string;
  OCR_PROVIDER: string;
  /** Used for a photo only when the primary OCR provider fails transiently (overload, quota, timeout). */
  OCR_FALLBACK_PROVIDER?: string;
  OPENAI_MODEL: string;
  ANTHROPIC_MODEL: string;
  GEMINI_OCR_MODEL?: string;
  /** OpenAI-compatible server for OCR_PROVIDER / SOLVER_PROVIDER = "local" (llama.cpp, vLLM, a hosted open model…). */
  LOCAL_LLM_URL?: string;
  LOCAL_LLM_API_KEY?: string;
  LOCAL_OCR_MODEL?: string;
  /** Separate server for OCR (e.g. a small document-OCR model); defaults to LOCAL_LLM_URL. */
  LOCAL_OCR_URL?: string;
  /** Local OCR output: "compact" (default; text written once) or "full" (raw + formatted + problems). */
  OCR_OUTPUT_FORMAT?: string;
  /** Task tag for OCR_OUTPUT_FORMAT=text models, e.g. "OCR:" (PaddleOCR-VL) or "Text Recognition:" (GLM-OCR). */
  LOCAL_OCR_PROMPT?: string;
  LOCAL_SOLVER_MODEL?: string;
  OCR_TIMEOUT_MS: string;
  OCR_LIMIT_PER_DEVICE_PER_HOUR: string;
  OCR_LIMIT_PER_IP_PER_HOUR: string;
  DRAFT_RETENTION_DAYS: string;
  SOLVER_PROVIDER: string;
  SOLVER_MODEL: string;
  SOLVER_REASONING_EFFORT: string;
  /** Hosted open model (SOLVER_PROVIDER=local, hosted URL): reasoning effort for standard/complex problems (default "low"). */
  LOCAL_REASONING_EFFORT?: string;
  /** Output-token budget and per-request timeout for the complex tier (defaults 24000 and 240000). */
  LOCAL_COMPLEX_MAX_TOKENS?: string;
  LOCAL_COMPLEX_REQUEST_TIMEOUT_MS?: string;
  /** …and for simple problems (one question, no figure, no proof; default "minimal"). */
  LOCAL_SIMPLE_REASONING_EFFORT?: string;
  /** Optional second OpenAI-compatible server used when the solver model is unavailable (quota, bad key). */
  SOLVER_FAILOVER_URL?: string;
  SOLVER_FAILOVER_MODEL?: string;
  SOLVER_FAILOVER_API_KEY?: string;
  FEEDBACK_LIMIT_PER_DEVICE_PER_HOUR?: string;
  SOLVER_FALLBACK_MODEL?: string;
  SOLVER_FALLBACK_REASONING_EFFORT?: string;
  SOLVER_GEOMETRY_MODEL?: string;
  SOLVER_GEOMETRY_REASONING_EFFORT?: string;
  SOLVE_TIMEOUT_MS: string;
  SOLVE_LIMIT_PER_DEVICE_PER_HOUR: string;
  SOLVE_LIMIT_PER_IP_PER_HOUR: string;
  ALLOWED_ORIGINS: string;

  // Secrets
  IMAGE_URL_SECRET?: string;
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  GEMINI_API_KEY?: string;
}

export function isDevelopment(env: Env): boolean {
  return env.ENVIRONMENT === "development";
}

export function intVar(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
