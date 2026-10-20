# Phase 1 summary: project foundation

Date: 2026-10-20 · Plan: `PHASE_1_2_PLAN.md`

## Implemented

- **Monorepo**: `apps/web` (Next.js 16.4, React 19.3, strict TypeScript, Tailwind 4, KaTeX 0.19),
  `services/api` (Python 3.12, FastAPI, Pydantic 2, SQLAlchemy 2 async, Alembic), and
  `infra/cloudflare/api-worker`. `docker-compose.yml` runs PostgreSQL 17 and SeaweedFS (S3 API).
- **Database**: initial Alembic migration `0001`. Tables: users, auth_sessions, documents, document_pages,
  questions, assets, jobs, ocr_cache, daily_budgets, llm_calls, rate_limit_buckets.
- **SoCLaaS adapter** (`app/providers/soclaas.py`): OpenAI-compatible `/chat/completions` with text and image
  parts and `json_schema`/`json_object` response formats. HTTP errors map to typed `ProviderError`s, and the
  adapter records whether the request reached the provider (this decides charge vs. release).
- **Provider abstraction**: `ChatProvider` protocol plus a model catalogue (`config/models.json` or
  `MODEL_CATALOG_JSON`) with tiers `ocr`/`fast`/`reasoning`, capabilities, and prices. Changing models is a
  config change.
- **Metered LLM gateway** (`app/providers/gateway.py`): route by tier → worst-case cost estimate → atomic
  budget reservation → call → settle the actual cost from reported usage. Missing usage, timeouts, and
  cancellations are charged at the reserved amount. Requests that provably never reached the provider are
  released. Transient-error retries are bounded (`SOCLAAS_MAX_RETRIES=1`), and each retry is metered. Output
  is validated with Pydantic, with at most one metered repair call. Truncated output is not repaired.
- **Cost controls** (`app/billing/budget.py`): SGD ceiling per Asia/Singapore day, enforced by a single
  conditional `UPDATE` (spent + reserved + x ≤ ceiling).
  - States: warning at ≥ 7, restricted at ≥ 9 (the `reasoning` tier is refused and `max_tokens` halved),
    blocked at 10.
  - A per-user daily cap is serialised with an advisory lock.
  - Stale reservations are settled at full cost, never released.
  - Models with no configured price, or USD prices without an FX rate, are refused.
  - Every call is recorded in the `llm_calls` ledger.
- **Auth and security**:
  - Anonymous guest accounts with opaque tokens (only the SHA-256 is stored), created behind Turnstile and
    kept in an httpOnly, SameSite=Lax cookie by the web gateway.
  - All document, question, job, and asset queries are scoped to the owner, and other users' ids return 404.
  - Gateway shared secret, an Origin check on state-changing requests, per-user and per-IP rate limits, and
    Cloudflare Access JWT verification for admin endpoints.
  - Consistent JSON error envelope with Vietnamese messages and a request id.
  - Structured JSON logs with request, job, and user ids, and no student content.
- **Settings guards**: production refuses to start without a gateway secret, Turnstile, Cloudflare Access,
  and R2 storage. It also refuses the dev admin token and the fixture OCR provider.
- **Usage**: `GET /api/v1/usage` (own spend and system state) and `GET /api/v1/admin/usage` (per-day, model,
  and task breakdown, recent calls, cache stats, open reservations) with web pages `/usage` and `/admin/usage`.
- **Cloudflare**: web app built with vinext (`cloudflare.config.ts`, `npm run build:vinext`). The built Worker
  was run locally in workerd and did session → upload → OCR → review against the API. The API container
  Worker (`infra/cloudflare/api-worker`) passes `wrangler deploy --dry-run`, image build included.
  Nothing is deployed.
- **API contract**: `services/api/openapi.json` is generated and committed, and TypeScript types are generated
  from it (`npm run gen:api`). A test fails if the snapshot is stale.

## Architecture decisions

See `infra/cloudflare/README.md` for the full table. In short:
- vinext rather than OpenNext, because it is Cloudflare's current recommendation for new apps.
- Cloudflare Containers for Python, with external managed Postgres and R2 over the S3 API.
- A Postgres job queue rather than Cloudflare Queues for now.
- Retries live in the metered gateway, not the adapter, so every attempt is paid for from the budget.
- Prices are configuration and fail closed. SoCLaaS publishes none.

## Changed files

`docker-compose.yml`, `Makefile`, `package.json`, `.gitignore`, `README.md`; `services/api/**` (new app, tests,
migrations, Dockerfile, scripts, `.env.example`, `config/models.example.json`); `apps/web/**` (rebuilt);
`infra/cloudflare/**`; `docs/phases/*`. The earlier untracked scaffold was replaced.

## Known limitations

- **No SoCLaaS key was available**, so no live model call has run. Model ids in `models.example.json` come from
  public SoCLaaS labs and are unverified. Prices are `null`, which blocks calls until you set them.
  Cost per question has not been measured.
- Accounts are anonymous guests only, with no email login or cross-device account. Admin access depends on
  Cloudflare Access in production.
- The reservation estimate is a conservative heuristic (characters/2, Qwen-style 28 px image patches, 256-token
  overhead). If a provider reports more tokens than reserved, the true cost is recorded, which can overshoot
  the ceiling by that difference. This is logged as `cost_exceeded_reservation`.
- No CSP header on the web app yet. There is no dashboard alerting, only logs.
- vinext is beta. `next build` and `vinext build` both pass today.

## Remaining work

Phase 7: real deployment (Workers, container, R2 bucket, managed Postgres, secrets, Access policies,
monitoring and alerts) and the Queues decision. Benchmark actual SoCLaaS cost per question once a key is
available.
