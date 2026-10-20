# Cloudflare architecture

Verified against Cloudflare docs on 2026-10-20. Phase 7 does the actual deployment. Phases 1–2 build and
validate the artifacts.

```
Browser ─► math-tutor-web (Worker, vinext build of apps/web)
             │  static assets via ASSETS binding
             │  /api/session, /api/v1/*  → fetch(API_ORIGIN) + X-Gateway-Secret
             ▼
           math-tutor-api (Worker) ─► ApiContainer (Durable Object + Cloudflare Container, standard-1)
                                        FastAPI + embedded job worker (services/api/Dockerfile)
                                        ├─► managed PostgreSQL (external; e.g. Neon, ?ssl=require)
                                        ├─► Cloudflare R2 via S3 API
                                        └─► SoCLaaS
```

## Decisions

| Concern | Choice | Why |
| --- | --- | --- |
| Next.js on Workers | **vinext** (`vinext`, `@vinext/cloudflare`, `cf` config) | Cloudflare's current recommendation for new Next.js apps (OpenNext is for existing OpenNext apps). `vinext check`: 100% compatible. vinext is beta, so `next build` is kept as a compatibility baseline. |
| Python runtime | **Cloudflare Containers**, `standard-1` (½ vCPU, 4 GiB), `max_instances: 1` | Python/SymPy/PDFium cannot run in standard Workers. Containers need Workers Paid ($5/mo), are billed per 10 ms while running, and scale to zero. Container disk is not durable, so all state lives in Postgres and R2. |
| Database | External managed PostgreSQL | Cloudflare has no managed Postgres. The container connects over TCP with `enableInternet: true`. |
| Files | R2 through its S3-compatible API (boto3) | The Python process reads and writes pages and crops. Locally, a SeaweedFS S3 server exercises the same code path. |
| Jobs | PostgreSQL `SKIP LOCKED` queue, worker inside the API container | Transactional with documents, no extra infrastructure. Cloudflare Queues is not used yet. It would only wake an idle container, so it gets evaluated in Phase 7. |
| Abuse | Turnstile when creating a guest session, plus per-user and per-IP rate limits in Postgres | |
| Admin | Cloudflare Access on `/admin/*` and `/api/v1/admin/*`. The API verifies the forwarded `Cf-Access-Jwt-Assertion` (RS256, audience, issuer, optional email allow-list). | |
| Secrets | `wrangler secret put` for both Workers. The container gets env vars from its Worker. | The browser never receives the SoCLaaS key, the gateway secret, or the session token. |

## Known operational caveats (Phase 7)

- Cold start: the first request after idle waits for the container to boot (up to 60 s, then 503 with Retry-After).
  The idle timeout is 15 minutes, so queued OCR jobs can finish.
- One container instance means one worker. Scaling out is safe (SKIP LOCKED) but has not been load-tested yet.
- `API_ORIGIN` is a public URL protected by the gateway secret. A Worker service binding would be tighter and
  is a Phase 7 option.
- No CSP header on the web app yet: KaTeX inline styles and Next inline scripts need a nonce-based policy.

## Commands

```bash
cd apps/web && npm run build:vinext && npm run deploy:vinext       # web Worker (Phase 7)
cd infra/cloudflare/api-worker && npx wrangler deploy --dry-run    # validate API Worker + build image
```
