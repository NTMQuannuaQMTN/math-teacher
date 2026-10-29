// Front Worker for the Python API running in a Cloudflare Container (services/api/Dockerfile).
// One named instance ("api") runs FastAPI plus the embedded job worker; scale-out is a Phase 7 decision.
import { DurableObject } from "cloudflare:workers";

interface Env {
  API_CONTAINER: DurableObjectNamespace<ApiContainer>;
  // Forwarded to the container process as environment variables.
  DATABASE_URL: string;
  GATEWAY_SECRET: string;
  TURNSTILE_SECRET_KEY: string;
  SOCLAAS_API_KEY: string;
  MODEL_CATALOG_JSON: string;
  CF_ACCESS_TEAM_DOMAIN: string;
  CF_ACCESS_AUDIENCE: string;
  S3_ENDPOINT_URL: string;
  S3_BUCKET: string;
  S3_ACCESS_KEY_ID: string;
  S3_SECRET_ACCESS_KEY: string;
  FX_USD_TO_SGD: string;
  ADMIN_EMAILS: string;
  ALERT_WEBHOOK_URL: string;
}

const PORT = 8080;
const IDLE_SHUTDOWN_MS = 15 * 60 * 1000; // keep warm long enough for queued OCR jobs to finish

export class ApiContainer extends DurableObject<Env> {
  private async ensureRunning(): Promise<void> {
    const container = this.ctx.container;
    if (!container) throw new Error("Container binding missing");
    if (!container.running) {
      const e = this.env;
      container.start({
        enableInternet: true, // SoCLaaS, managed PostgreSQL and R2 are external
        env: {
          ENVIRONMENT: "production",
          PORT: String(PORT),
          STORAGE_BACKEND: "s3",
          RUN_EMBEDDED_WORKER: "true",
          DATABASE_URL: e.DATABASE_URL,
          GATEWAY_SECRET: e.GATEWAY_SECRET,
          TURNSTILE_SECRET_KEY: e.TURNSTILE_SECRET_KEY,
          SOCLAAS_API_KEY: e.SOCLAAS_API_KEY,
          MODEL_CATALOG_JSON: e.MODEL_CATALOG_JSON,
          CF_ACCESS_TEAM_DOMAIN: e.CF_ACCESS_TEAM_DOMAIN,
          CF_ACCESS_AUDIENCE: e.CF_ACCESS_AUDIENCE,
          S3_ENDPOINT_URL: e.S3_ENDPOINT_URL,
          S3_BUCKET: e.S3_BUCKET,
          S3_ACCESS_KEY_ID: e.S3_ACCESS_KEY_ID,
          S3_SECRET_ACCESS_KEY: e.S3_SECRET_ACCESS_KEY,
          FX_USD_TO_SGD: e.FX_USD_TO_SGD,
          ADMIN_EMAILS: e.ADMIN_EMAILS,
          ...(e.ALERT_WEBHOOK_URL ? { ALERT_WEBHOOK_URL: e.ALERT_WEBHOOK_URL } : {}),
        },
      });
    }
    // start() returns before the server is ready: poll /health with a bounded wait.
    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
      try {
        const health = await container.getTcpPort(PORT).fetch("http://container/health");
        if (health.ok) return;
      } catch {
        // not listening yet
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    throw new Error("API container did not become healthy in time");
  }

  override async fetch(request: Request): Promise<Response> {
    try {
      await this.ensureRunning();
    } catch {
      return Response.json(
        { error: { code: "service_unavailable", message: "Máy chủ đang khởi động. Hãy thử lại sau ít giây." } },
        { status: 503, headers: { "Retry-After": "5" } },
      );
    }
    this.ctx.container?.setInactivityTimeout?.(IDLE_SHUTDOWN_MS);
    return this.ctx.container!.getTcpPort(PORT).fetch(request);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const stub = env.API_CONTAINER.get(env.API_CONTAINER.idFromName("api"));
    return stub.fetch(request);
  },
} satisfies ExportedHandler<Env>;
