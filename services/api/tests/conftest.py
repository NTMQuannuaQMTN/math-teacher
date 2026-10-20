"""Test fixtures. Tests run against a real PostgreSQL database (docker compose up -d postgres).

Model calls go to a scripted in-process provider (`ScriptedProvider`), which exercises the real gateway,
budget, cache and OCR code. Live SoCLaaS tests are marked `live` and skipped by default.
"""

from __future__ import annotations

import asyncio
import json
import os
import uuid
from collections.abc import AsyncIterator, Callable
from decimal import Decimal
from pathlib import Path
from typing import Any

import httpx
import pytest
import pytest_asyncio
from alembic import command
from alembic.config import Config
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.config import Settings
from app.container import Container, build_container
from app.main import create_app
from app.models import Base
from app.providers.base import ChatRequest, ChatResult, ProviderError, Usage
from app.providers.catalog import ModelCatalog

API_DIR = Path(__file__).resolve().parent.parent
FIXTURES = Path(__file__).resolve().parent / "fixtures"
ADMIN_URL = os.environ.get("TEST_DATABASE_ADMIN_URL",
                           "postgresql+asyncpg://mathtutor:mathtutor@127.0.0.1:54329/mathtutor")
TEST_DB = f"mathtutor_test_{os.getpid()}"
TEST_URL = ADMIN_URL.rsplit("/", 1)[0] + f"/{TEST_DB}"


def make_catalog(price_in: str = "1.00", price_out: str = "4.00", currency: str = "SGD") -> ModelCatalog:
    pricing = {"currency": currency, "input_per_mtok": price_in, "output_per_mtok": price_out}
    return ModelCatalog.model_validate({
        "models": [
            {"id": "vision-test", "vision": True, "structured_output": "json_schema", "max_output_tokens": 6000,
             "context_window": 32768, "pricing": pricing},
            {"id": "fast-test", "vision": False, "structured_output": "json_object", "max_output_tokens": 4000,
             "context_window": 32768, "pricing": pricing},
            {"id": "reason-test", "vision": False, "structured_output": "none", "max_output_tokens": 8000,
             "context_window": 65536, "pricing": pricing},
        ],
        "routing": {"ocr": "vision-test", "fast": "fast-test", "reasoning": "reason-test"},
    })


class ScriptedProvider:
    """In-process provider returning scripted replies (or raising scripted errors)."""

    name = "soclaas"

    def __init__(self) -> None:
        self.replies: list[Callable[[ChatRequest], ChatResult] | ProviderError | str] = []
        self.default: Callable[[ChatRequest], ChatResult] | None = None
        self.requests: list[ChatRequest] = []
        self.delay = 0.0

    def push(self, reply: Callable[[ChatRequest], ChatResult] | ProviderError | str) -> None:
        self.replies.append(reply)

    async def chat(self, request: ChatRequest) -> ChatResult:
        self.requests.append(request)
        if self.delay:
            await asyncio.sleep(self.delay)
        reply = self.replies.pop(0) if self.replies else self.default
        if reply is None:
            raise ProviderError("server_error", "no scripted reply")
        if isinstance(reply, ProviderError):
            raise reply
        if isinstance(reply, str):
            return ChatResult(content=reply, model=request.model, usage=Usage(prompt_tokens=200, completion_tokens=50),
                              finish_reason="stop", latency_ms=5)
        return reply(request)

    async def aclose(self) -> None:
        return None


def ocr_reply(page: dict[str, Any], prompt_tokens: int = 2000, completion_tokens: int = 800
              ) -> Callable[[ChatRequest], ChatResult]:
    def make(request: ChatRequest) -> ChatResult:
        return ChatResult(content=json.dumps(page, ensure_ascii=False), model=request.model,
                          usage=Usage(prompt_tokens=prompt_tokens, completion_tokens=completion_tokens),
                          finish_reason="stop", latency_ms=12)
    return make


@pytest.fixture(scope="session")
def database_url() -> str:
    async def create() -> None:
        engine = create_async_engine(ADMIN_URL, isolation_level="AUTOCOMMIT")
        async with engine.connect() as conn:
            await conn.execute(text(f'DROP DATABASE IF EXISTS "{TEST_DB}"'))
            await conn.execute(text(f'CREATE DATABASE "{TEST_DB}"'))
        await engine.dispose()

    asyncio.run(create())
    cfg = Config(str(API_DIR / "alembic.ini"))
    cfg.set_main_option("script_location", str(API_DIR / "migrations"))
    cfg.attributes["database_url"] = TEST_URL
    cfg.attributes["configure_logger"] = False
    command.upgrade(cfg, "head")
    yield TEST_URL

    async def drop() -> None:
        engine = create_async_engine(ADMIN_URL, isolation_level="AUTOCOMMIT")
        async with engine.connect() as conn:
            await conn.execute(text(f'DROP DATABASE IF EXISTS "{TEST_DB}" WITH (FORCE)'))
        await engine.dispose()

    asyncio.run(drop())


@pytest.fixture
def settings(database_url: str, tmp_path: Path) -> Settings:
    return Settings(
        environment="test", database_url=database_url, storage_backend="local",
        storage_local_dir=tmp_path / "storage", admin_dev_token="test-admin-token",  # type: ignore[arg-type]
        daily_budget_sgd=Decimal("10"), restricted_budget_sgd=Decimal("9"), warning_budget_sgd=Decimal("7"),
        per_user_daily_budget_sgd=Decimal("5"), soclaas_max_retries=1, worker_poll_seconds=0.05,
        rate_limit_requests_per_minute=10_000, rate_limit_uploads_per_hour=1000,
        rate_limit_question_edits_per_minute=1000, rate_limit_guest_sessions_per_hour_per_ip=1000,
        db_pool_size=10,
    )


@pytest.fixture
def provider() -> ScriptedProvider:
    return ScriptedProvider()


@pytest_asyncio.fixture
async def container(settings: Settings, provider: ScriptedProvider) -> AsyncIterator[Container]:
    c = build_container(settings, provider=provider, catalog=make_catalog())
    async with c.db.engine.begin() as conn:
        tables = ", ".join(f'"{t.name}"' for t in Base.metadata.sorted_tables)
        await conn.execute(text(f"TRUNCATE {tables} RESTART IDENTITY CASCADE"))
    try:
        yield c
    finally:
        await c.aclose()


@pytest_asyncio.fixture
async def client(container: Container, settings: Settings) -> AsyncIterator[httpx.AsyncClient]:
    app = create_app(settings, container, start_worker=False)
    app.state.container = container
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as http:
        yield http


async def new_user(client: httpx.AsyncClient) -> dict[str, str]:
    response = await client.post("/api/v1/auth/guest", json={})
    assert response.status_code == 201, response.text
    return {"Authorization": f"Bearer {response.json()['token']}"}


@pytest_asyncio.fixture
async def auth(client: httpx.AsyncClient) -> dict[str, str]:
    return await new_user(client)


def fixture_bytes(name: str) -> bytes:
    return (FIXTURES / name).read_bytes()


def random_id() -> str:
    return str(uuid.uuid4())
