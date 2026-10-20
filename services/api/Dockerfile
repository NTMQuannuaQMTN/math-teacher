# FastAPI + embedded job worker. Target: Cloudflare Containers (wrangler builds linux/amd64) or any container host.
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy
COPY --from=ghcr.io/astral-sh/uv:0.12 /uv /usr/local/bin/uv
WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY app ./app
COPY migrations ./migrations
COPY alembic.ini ./
COPY config/models.example.json ./config/models.example.json
RUN uv sync --frozen --no-dev && useradd --create-home --uid 10001 app && mkdir -p var && chown app var
USER app

ENV PATH="/app/.venv/bin:$PATH" ENVIRONMENT=production PORT=8080
EXPOSE 8080
# Migrations run explicitly at deploy time (`alembic upgrade head`), not on every container start.
CMD ["sh", "-c", "uvicorn app.main:app_factory --factory --host 0.0.0.0 --port ${PORT} --proxy-headers --timeout-graceful-shutdown 25"]
