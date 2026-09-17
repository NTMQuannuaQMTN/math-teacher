export interface Env {
  DB: D1Database;
  IMAGES: R2Bucket;
  ANTHROPIC_API_KEY: string;
  ANTHROPIC_MODEL: string;
  MAX_UPLOAD_BYTES: string;
  RATE_LIMIT_PER_HOUR: string;
}
