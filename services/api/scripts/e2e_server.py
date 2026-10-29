"""Start the API for Playwright E2E tests: fresh `mathtutor_e2e` database, fixture OCR, port 8011.

OCR_PROVIDER=fixture and LLM_PROVIDER=fixture are test-only (refused in production). Everything else is the real
stack: verification tools, curriculum checks, budget ledger, persistence.
"""

from __future__ import annotations

import asyncio
import os
import shutil
from pathlib import Path

import uvicorn
from alembic import command
from alembic.config import Config
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

ROOT = Path(__file__).resolve().parent.parent
ADMIN_URL = os.environ.get("E2E_DATABASE_ADMIN_URL", "postgresql+asyncpg://mathtutor:mathtutor@127.0.0.1:54329/mathtutor")
DB_URL = ADMIN_URL.rsplit("/", 1)[0] + "/mathtutor_e2e"


async def recreate() -> None:
    engine = create_async_engine(ADMIN_URL, isolation_level="AUTOCOMMIT")
    async with engine.connect() as conn:
        await conn.execute(text('DROP DATABASE IF EXISTS "mathtutor_e2e" WITH (FORCE)'))
        await conn.execute(text('CREATE DATABASE "mathtutor_e2e"'))
    await engine.dispose()


def main() -> None:
    asyncio.run(recreate())
    cfg = Config(str(ROOT / "alembic.ini"))
    cfg.set_main_option("script_location", str(ROOT / "migrations"))
    cfg.attributes["database_url"] = DB_URL
    command.upgrade(cfg, "head")
    storage = ROOT / "var" / "e2e-storage"
    shutil.rmtree(storage, ignore_errors=True)
    os.environ.update({
        "ENVIRONMENT": "test", "DATABASE_URL": DB_URL, "OCR_PROVIDER": "fixture", "STORAGE_BACKEND": "local",
        "STORAGE_LOCAL_DIR": str(storage), "WORKER_POLL_SECONDS": "0.2", "ADMIN_DEV_TOKEN": "e2e-admin",
        "GATEWAY_SECRET": "e2e-gateway-secret", "SOCLAAS_API_KEY": "", "LLM_PROVIDER": "fixture",
        "MODEL_CATALOG_JSON": '{"models":[{"id":"fixture-model","structured_output":"json_object","vision":true,'
                              '"pricing":{"currency":"SGD","input_per_mtok":"0","output_per_mtok":"0"}}],'
                              '"routing":{"fast":"fixture-model","reasoning":"fixture-model","ocr":"fixture-model"}}',
        "RATE_LIMIT_REQUESTS_PER_MINUTE": "5000",
        "RATE_LIMIT_GUEST_SESSIONS_PER_HOUR_PER_IP": "1000",
    })
    uvicorn.run("app.main:app_factory", factory=True, host="127.0.0.1", port=8011, log_level="warning")


if __name__ == "__main__":
    main()
