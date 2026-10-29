# Production deployment runbook (Phase 7)

Nothing in this file has been run against a real account yet. Every step that creates a billed resource or
publishes something is marked **[approve]**.

## 0. Prerequisites (owner decisions)

| Item | Recommendation | Notes |
| --- | --- | --- |
| Cloudflare account | Workers Paid ($5/month) | Required for Containers |
| Domain | e.g. `toanchuyen.example` on Cloudflare DNS | web at `@`, API Worker at `api.` |
| PostgreSQL | Neon (Singapore region, free/launch tier) or Supabase | Must accept TLS; set `?ssl=require` |
| SoCLaaS key | the production key, with its own spending limit | Keep separate from the development key |
| Alerts | a Slack/Discord/Google Chat incoming webhook | Optional (`ALERT_WEBHOOK_URL`) |

## 1. Cloudflare resources [approve]

```bash
npx wrangler login
npx wrangler r2 bucket create math-tutor                    # originals, page renders, figure crops
# R2 → Manage R2 API tokens → create an S3 token scoped to the bucket (Object Read & Write)
```

Turnstile: create a widget for the web domain and note the site key and secret key.
Zero Trust → Access: create an application for `https://<domain>/admin/*` and `https://api.<domain>/api/v1/admin/*`
with an email policy. Note the team domain and the application audience (AUD) tag.

## 2. Database

```bash
cd services/api
DATABASE_URL='postgresql+asyncpg://…/mathtutor?ssl=require' uv run alembic upgrade head   # migrations 0001–0005
```

Migrations run explicitly at deploy time, never on container start.

## 3. API Worker + container [approve]

```bash
cd infra/cloudflare/api-worker
npm install
for name in DATABASE_URL GATEWAY_SECRET TURNSTILE_SECRET_KEY SOCLAAS_API_KEY MODEL_CATALOG_JSON \
            CF_ACCESS_TEAM_DOMAIN CF_ACCESS_AUDIENCE S3_ENDPOINT_URL S3_ACCESS_KEY_ID S3_SECRET_ACCESS_KEY \
            FX_USD_TO_SGD ADMIN_EMAILS; do npx wrangler secret put "$name"; done
npx wrangler secret put ALERT_WEBHOOK_URL        # optional
npx wrangler deploy                               # builds services/api/Dockerfile (linux/amd64), pushes, deploys
```

- `MODEL_CATALOG_JSON` is the contents of `services/api/config/models.json`, minified.
- `GATEWAY_SECRET` is a long random string (`openssl rand -hex 32`), shared with the web Worker.
- `ADMIN_EMAILS` is a JSON list, e.g. `["you@example.com"]`.
- Smoke test: `curl https://api.<domain>/health` returns `ok`. Through the gateway only, `/ready` returns `ready`.

## 4. Web Worker [approve]

```bash
cd apps/web
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<site key> npm run build:vinext
npx wrangler secret put API_ORIGIN               # https://api.<domain>
npx wrangler secret put API_GATEWAY_SECRET       # same value as GATEWAY_SECRET
npm run deploy:vinext
```

## 5. Verify in production

1. Open the site; Turnstile appears once; the `mt_session` cookie is HttpOnly and Secure.
2. Upload a real paper, confirm a question, solve it, open hints, reveal.
3. `/admin/usage` asks for Cloudflare Access login, then shows real costs.
4. A direct request to `https://api.<domain>/api/v1/documents` without the gateway secret returns 403.
5. Watch the first day's spend on `/admin/usage`. The SGD 10 ceiling is enforced in the database, independent of
   SoCLaaS's own key limit.

## Decisions taken for production

- **Cloudflare Queues: not used.** Jobs live in PostgreSQL (`SKIP LOCKED`) and are created in the same transaction
  as the rows they act on; the container's embedded worker polls them. A Queue would only add a second source of
  truth. Revisit if solve volume needs several containers.
- **Service binding vs public API origin:** the public origin protected by the gateway secret is kept, because the
  vinext build reads `API_ORIGIN` through `process.env`. A service binding is a later hardening step.
- **Cold starts:** the API container sleeps after 15 idle minutes. The first request after that waits for boot
  (Retry-After 503 while starting). Keep-warm pings would cost container time for no student benefit at low traffic.
- **Logs and monitoring:** JSON logs go to Workers Logs (`observability.enabled`). Budget state changes go to the
  alert webhook. Use `/admin/usage` for cost per call, cache hits and open reservations.
