"""Explicit wiring of services. Built once per process in the app lifespan (or by tests)."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path

import httpx

from .billing.budget import BudgetService
from .config import Settings
from .db import Database
from .ocr.engine import CachedPageOcr, FixturePageOcr, LlmPageOcr, PageOcrEngine
from .providers.base import ChatProvider
from .providers.catalog import ModelCatalog
from .providers.fixture import FixtureChatProvider
from .providers.gateway import LLMGateway
from .providers.soclaas import SoclaasProvider
from .security.access import AccessVerifier
from .security.rate_limit import RateLimiter
from .storage.store import ObjectStore, build_store
from .workers.queue import JobQueue

logger = logging.getLogger(__name__)

FIXTURE_DIR = Path(__file__).resolve().parent.parent / "tests" / "fixtures" / "ocr" / "responses"
LLM_FIXTURE_DIR = Path(__file__).resolve().parent.parent / "tests" / "fixtures" / "llm"


@dataclass
class Container:
    settings: Settings
    db: Database
    store: ObjectStore
    budget: BudgetService
    rate_limiter: RateLimiter
    queue: JobQueue
    http: httpx.AsyncClient
    access: AccessVerifier
    gateway: LLMGateway | None
    ocr: PageOcrEngine | None
    provider: ChatProvider | None
    config_problems: list[str]

    async def aclose(self) -> None:
        await self.http.aclose()
        if self.provider is not None:
            await self.provider.aclose()
        await self.db.dispose()


def build_container(settings: Settings, *, provider: ChatProvider | None = None,
                    catalog: ModelCatalog | None = None, store: ObjectStore | None = None,
                    ocr: PageOcrEngine | None = None) -> Container:
    db = Database(settings)
    budget = BudgetService(settings, db.sessionmaker)
    problems: list[str] = []

    if catalog is None:
        try:
            catalog = (ModelCatalog.model_validate_json(settings.model_catalog_json) if settings.model_catalog_json
                       else ModelCatalog.load(settings.model_catalog_path))
        except FileNotFoundError:
            problems.append(f"Model catalogue not found at {settings.model_catalog_path}")
        except ValueError as exc:
            problems.append(f"Invalid model catalogue: {exc}")
    if provider is None and settings.llm_provider == "fixture":
        # Settings validation refuses this in production.
        logger.warning("llm_fixture_provider_enabled")
        provider = FixtureChatProvider(LLM_FIXTURE_DIR)
    elif provider is None and settings.soclaas_api_key is not None:
        provider = SoclaasProvider(settings.soclaas_base_url, settings.soclaas_api_key.get_secret_value(),
                                   settings.soclaas_timeout_seconds)
    elif provider is None:
        problems.append("SOCLAAS_API_KEY is not set")

    gateway = LLMGateway(settings, provider, catalog, budget) if provider and catalog else None

    if ocr is None:
        if settings.ocr_provider == "fixture":
            # Settings validation refuses this in production.
            logger.warning("ocr_fixture_provider_enabled")
            ocr = CachedPageOcr(FixturePageOcr(FIXTURE_DIR), db.sessionmaker)
        elif gateway is not None:
            ocr = CachedPageOcr(LlmPageOcr(gateway), db.sessionmaker)
    if problems:
        logger.warning("configuration_incomplete", extra={"problems": problems})

    return Container(
        settings=settings, db=db, store=store or build_store(settings), budget=budget,
        rate_limiter=RateLimiter(db.sessionmaker), queue=JobQueue(db.sessionmaker), http=httpx.AsyncClient(),
        access=AccessVerifier(settings), gateway=gateway, ocr=ocr, provider=provider, config_problems=problems,
    )
