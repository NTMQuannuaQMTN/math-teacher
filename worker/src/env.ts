export interface Env {
  DB: D1Database;
  IMAGES: R2Bucket;

  ENVIRONMENT: string;
  OCR_PROVIDER: string;
  OPENAI_MODEL: string;
  ANTHROPIC_MODEL: string;
  OCR_TIMEOUT_MS: string;
  OCR_LIMIT_PER_DEVICE_PER_HOUR: string;
  OCR_LIMIT_PER_IP_PER_HOUR: string;
  DRAFT_RETENTION_DAYS: string;
  SOLVER_PROVIDER: string;
  SOLVER_MODEL: string;
  SOLVER_REASONING_EFFORT: string;
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
