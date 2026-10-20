# Phase 1 testing guide: foundation

## 1. Set up

```bash
make services                       # docker compose: postgres :54329, s3 :58333
cd services/api
cp .env.example .env
uv sync
uv run alembic upgrade head
```

## 2. Automated checks

```bash
cd services/api
uv run pytest -q                    # expect: 135 passed, 1 deselected (live)
uv run ruff check app tests scripts migrations && uv run mypy app
cd ../../apps/web && npm install && npm run typecheck && npm run build
npm run check:bundle -- .next/static        # no server-only values in browser assets
npm run build:vinext                         # Cloudflare Workers build
cd ../../infra/cloudflare/api-worker && npm install && npx wrangler deploy --dry-run --outdir dist
```

Key tests to look at: `tests/test_budget.py` (50 concurrent reservations exactly fill the ceiling; random
operation sequences never break `spent + reserved ≤ ceiling`), `tests/test_gateway.py` (charge, release,
retry, and repair rules), and `tests/test_api_auth.py` (Turnstile, gateway secret, rate limits).

## 3. Manual checks

Start the API (`uv run uvicorn app.main:app_factory --factory --reload --port 8000`) and the web app
(`cd apps/web && cp .env.example .env.local && npm run dev`).

| # | Do | Expect |
| --- | --- | --- |
| 1 | `curl localhost:8000/health` | `{"status":"ok",…}` |
| 2 | `curl localhost:8000/ready` | `degraded` plus the missing pieces (key, catalogue) until you configure them |
| 3 | Open http://localhost:3000 | Vietnamese dashboard. DevTools → Application → Cookies: `mt_session` is HttpOnly, SameSite=Lax |
| 4 | DevTools console: `document.cookie` | does not contain `mt_session` |
| 5 | Open `/usage` | your spend (0) and the system budget bar |
| 6 | Open `/admin/usage` | cost dashboard. Works locally because `.env.local` sets `ADMIN_DEV_TOKEN`. Remove it, restart, and you should see "Cần đăng nhập quản trị." |
| 7 | Set `GATEWAY_SECRET=x` in `services/api/.env` and restart, then `curl -X POST localhost:8000/api/v1/auth/guest` | 403. With `API_GATEWAY_SECRET=x` in `apps/web/.env.local` the web app works again |
| 8 | `ENVIRONMENT=production uv run python -c "from app.config import Settings; Settings()"` | refuses to start and lists the missing production settings |

### Budget behaviour (no API key needed)

```bash
cd services/api && uv run python - <<'EOF'
import asyncio
from decimal import Decimal
from app.config import Settings
from app.container import build_container
async def main():
    c = build_container(Settings())
    for amount in ["6.5", "1.0", "1.6", "1.0"]:
        try:
            r = await c.budget.reserve(amount_sgd=Decimal(amount), purpose="manual", provider="soclaas",
                                       model="m", tier="fast", user_id=None)
            print(amount, "→ granted, state", r.state_after)
        except Exception as e:
            print(amount, "→", type(e).__name__, e)
    print(await c.budget.status())
    await c.aclose()
asyncio.run(main())
EOF
```

Expected: normal → warning → restricted → `BudgetExceeded` (the last 1.0 would take the total to 10.10). Afterwards `/usage` shows the
bar, and the dashboard shows the restricted-mode banner. Clear it with
`docker compose exec postgres psql -U mathtutor -c "truncate daily_budgets, llm_calls"`.

### SoCLaaS (once you have a key)

```bash
cd services/api && SOCLAAS_API_KEY=... uv run python scripts/soclaas_probe.py
```

Please send back the `/models` list and whether `json_schema`, `json_object`, and vision worked, along with the
`usage` fields. I need these, plus the real prices, to finish `config/models.json`.

## Feedback requested

1. Are anonymous guest sessions acceptable for now, or do you want email login (and which provider)?
2. The SoCLaaS model list and pricing for your key (see above).
3. Is managed Postgres outside Cloudflare (e.g. Neon) acceptable?
4. Per-user daily cap: is the default SGD 1.50 right?
