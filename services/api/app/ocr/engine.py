"""Page OCR engines and the content-hash cache in front of them."""

from __future__ import annotations

import hashlib
import json
import logging
from dataclasses import dataclass
from decimal import Decimal
from pathlib import Path
from typing import Protocol

from sqlalchemy import update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from ..models import OcrCacheEntry
from ..providers.base import ChatMessage, ImagePart, TextPart
from ..providers.gateway import CallContext, LLMGateway
from .prompts import OCR_SYSTEM_PROMPT, ocr_user_prompt
from .schemas import PIPELINE_VERSION, OcrPage

logger = logging.getLogger(__name__)

OCR_MAX_OUTPUT_TOKENS = 6000


@dataclass(frozen=True)
class PageInput:
    page_number: int
    page_count: int
    data: bytes
    mime_type: str
    width: int
    height: int
    sha256: str


@dataclass(frozen=True)
class PageOcrOutcome:
    page: OcrPage
    model: str
    cost_sgd: Decimal
    cached: bool


class PageOcrEngine(Protocol):
    @property
    def model_id(self) -> str: ...

    async def extract(self, page: PageInput, ctx: CallContext) -> PageOcrOutcome: ...


class LlmPageOcr:
    """Vision-model OCR through the metered gateway (tier `ocr`)."""

    def __init__(self, gateway: LLMGateway) -> None:
        self.gateway = gateway

    @property
    def model_id(self) -> str:
        return self.gateway.catalog.for_tier("ocr").id

    async def extract(self, page: PageInput, ctx: CallContext) -> PageOcrOutcome:
        messages = [
            ChatMessage(role="system", content=OCR_SYSTEM_PROMPT),
            ChatMessage(role="user", content=[
                TextPart(text=ocr_user_prompt(page.page_number, page.page_count)),
                ImagePart(data=page.data, mime_type=page.mime_type, width=page.width, height=page.height),
            ]),
        ]
        result = await self.gateway.structured(tier="ocr", ctx=ctx, messages=messages, output=OcrPage,
                                               max_tokens=OCR_MAX_OUTPUT_TOKENS, schema_name="ocr_page")
        return PageOcrOutcome(page=result.value, model=result.model, cost_sgd=result.cost_sgd, cached=False)


class FixturePageOcr:
    """Test/E2E-only engine: returns recorded model output keyed by page SHA-256.

    Settings refuse `OCR_PROVIDER=fixture` in production, so it can never stand in for real OCR there.
    """

    def __init__(self, directory: Path) -> None:
        self.directory = directory

    @property
    def model_id(self) -> str:
        return "fixture"

    async def extract(self, page: PageInput, ctx: CallContext) -> PageOcrOutcome:
        path = self.directory / f"{page.sha256}.json"
        if not path.exists():
            path = self.directory / "default.json"
        if not path.exists():
            raise FileNotFoundError(f"No OCR fixture for page {page.sha256}")
        return PageOcrOutcome(page=OcrPage.model_validate(json.loads(path.read_text(encoding="utf-8"))),
                              model="fixture", cost_sgd=Decimal(0), cached=False)


def cache_key(page_sha256: str, model: str) -> str:
    return hashlib.sha256(f"{PIPELINE_VERSION}|{model}|{page_sha256}".encode()).hexdigest()


class CachedPageOcr:
    def __init__(self, inner: PageOcrEngine, sessionmaker: async_sessionmaker[AsyncSession]) -> None:
        self.inner = inner
        self.sessionmaker = sessionmaker

    @property
    def model_id(self) -> str:
        return self.inner.model_id

    async def extract(self, page: PageInput, ctx: CallContext) -> PageOcrOutcome:
        model = self.inner.model_id
        key = cache_key(page.sha256, model)
        async with self.sessionmaker() as session:
            entry = await session.get(OcrCacheEntry, key)
            if entry is not None:
                try:
                    cached_page = OcrPage.model_validate(entry.result)
                except ValueError:
                    cached_page = None
                if cached_page is not None:
                    await session.execute(update(OcrCacheEntry).where(OcrCacheEntry.cache_key == key)
                                          .values(hits=OcrCacheEntry.hits + 1))
                    await session.commit()
                    return PageOcrOutcome(page=cached_page, model=model, cost_sgd=Decimal(0), cached=True)
        outcome = await self.inner.extract(page, ctx)
        async with self.sessionmaker() as session:
            await session.execute(insert(OcrCacheEntry).values(
                cache_key=key, pipeline_version=PIPELINE_VERSION, model=outcome.model,
                result=outcome.page.model_dump(mode="json"), hits=0,
            ).on_conflict_do_nothing(index_elements=["cache_key"]))
            await session.commit()
        return outcome
