export interface Env {
  DB: D1Database;
  IMAGES: R2Bucket;
  // Which AI backend is active: "openai" (default) or "anthropic". Swapping
  // providers is a config change — see worker/src/ai/factory.ts.
  AI_PROVIDER: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL: string;
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_MODEL: string;
  MAX_UPLOAD_BYTES: string;
  RATE_LIMIT_PER_HOUR: string;
}
