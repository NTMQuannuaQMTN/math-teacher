# AI Math Tutor (Toán chuyên vào 10)

Vietnamese AI mathematics tutor for students preparing for the Grade 10 specialised mathematics entrance exam.

**Status:** Phases 1–2 are done (foundation, OCR and review). Solving, the geometry engine, tutoring, and
verification are Phases 3–6. Production deployment is Phase 7. See `docs/phases/`.

## Layout

```
apps/web                    Next.js 16 App Router (TypeScript, Tailwind, KaTeX). Built for Cloudflare Workers with vinext.
  app/api/session           guest session → httpOnly cookie (Turnstile)
  app/api/v1/[...path]      gateway: forwards to the Python API with the session token and gateway secret
services/api                FastAPI + PostgreSQL + embedded job worker
  app/providers             SoCLaaS adapter, model catalogue, metered LLM gateway
  app/billing               daily SGD budget with atomic reservations
  app/documents             upload validation, page rendering, document/question services
  app/ocr                   page OCR, cache, segmentation, LaTeX normalisation
  app/classification        preliminary topic classification
  app/workers               Postgres job queue and worker
  app/security              guest tokens, Turnstile, Cloudflare Access, rate limits
  migrations                Alembic
infra/cloudflare/api-worker Worker + Durable Object that runs the API image on Cloudflare Containers
docs/phases                 per-phase plan, summary and testing guide
```

## Quick start

Prerequisites: Docker, [uv](https://docs.astral.sh/uv/), Node 22+.

```bash
make services                                   # PostgreSQL :54329, S3-compatible store :58333
cd services/api && cp .env.example .env         # add SOCLAAS_API_KEY for real OCR
cp config/models.example.json config/models.json  # verify model ids and set prices (see below)
uv sync && uv run alembic upgrade head
uv run uvicorn app.main:app_factory --factory --reload --port 8000

cd apps/web && cp .env.example .env.local && npm install && npm run dev   # http://localhost:3000
```

Without a SoCLaaS key and model catalogue, the app still runs, but OCR jobs fail with an explicit
"not configured" error. `GET /ready` lists what is missing.

### SoCLaaS configuration

SoCLaaS (NUS SoC, `https://soclaas-api.comp.nus.edu.sg/v1`) is OpenAI-compatible, and its model list depends on
the key. Run `uv run python scripts/soclaas_probe.py` to list your models and test JSON and vision support.
Then fill in `config/models.json`. **A model without a price cannot be called.** SoCLaaS publishes no price
list, so set the real prices, or `0` if you have confirmed your key is free.

## Tests

```bash
make test-api     # pytest: 135 tests against real PostgreSQL (unit, Hypothesis, concurrency, security, S3)
make lint         # ruff + mypy --strict + tsc --strict
make e2e          # Playwright: real API + Postgres + Next.js; OCR uses recorded output (test-only provider)
make test-web     # Next build, client-bundle secret scan, vinext (Workers) build
make cf-check     # wrangler dry-run of the API container Worker
SOCLAAS_API_KEY=... uv run pytest -m live   # live OCR golden test (in services/api)
```
