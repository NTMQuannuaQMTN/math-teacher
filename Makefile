.PHONY: services api-install migrate api web-install web test test-api test-web e2e lint openapi cf-check

services:            ## Start PostgreSQL and the S3-compatible store
	docker compose up -d

api-install:
	cd services/api && uv sync

migrate:
	cd services/api && uv run alembic upgrade head

api:                 ## FastAPI + embedded worker on :8000
	cd services/api && uv run uvicorn app.main:app_factory --factory --reload --port 8000

web-install:
	cd apps/web && npm install

web:                 ## Next.js dev server on :3000
	cd apps/web && npm run dev

test: test-api test-web e2e

test-api:
	cd services/api && uv run pytest -q

lint:
	cd services/api && uv run ruff check app tests scripts migrations && uv run mypy app
	cd apps/web && npm run typecheck

test-web:
	cd apps/web && npm run typecheck && npm run build && npm run check:bundle -- .next/static && npm run build:vinext

e2e:
	cd apps/web && npm run build && npx playwright test

openapi:             ## Regenerate the API contract and the web app's TypeScript types
	cd services/api && uv run python scripts/export_openapi.py
	cd apps/web && npm run gen:api

cf-check:            ## Validate the API container Worker config (builds the image, deploys nothing)
	cd infra/cloudflare/api-worker && npm install && npx wrangler deploy --dry-run --outdir dist
