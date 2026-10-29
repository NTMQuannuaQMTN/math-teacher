"""OCR job: render pages → OCR each page (cached, metered) → segment → normalise → persist for review."""

from __future__ import annotations

import asyncio
import logging
import uuid
from dataclasses import dataclass
from decimal import Decimal
from typing import Any

from sqlalchemy import delete, select

from ..billing.budget import BudgetRestricted, UserBudgetExceeded
from ..container import Container
from ..documents.ingest import InvalidDocument, crop_region, detect_kind, render_pages
from ..documents.service import document_prefix
from ..errors import AppError, BudgetExceeded
from ..models import Asset, Document, DocumentPage, Job, Question
from ..ocr.engine import PageInput
from ..ocr.schemas import OcrPage
from ..ocr.segmentation import build_questions, review_status_for
from ..providers.catalog import ModelNotConfigured
from ..providers.gateway import CallContext, InvalidModelOutput, ModelCallFailed

logger = logging.getLogger(__name__)


class JobError(Exception):
    def __init__(self, code: str, message: str, *, retryable: bool) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.retryable = retryable


@dataclass
class _PageOutcome:
    page_number: int
    page: OcrPage | None
    status: str  # ok | cached | failed
    error_code: str | None = None
    error_message: str | None = None
    cost: Decimal = Decimal(0)


_BUDGET_ERRORS = (BudgetExceeded, BudgetRestricted, UserBudgetExceeded)


async def _ensure_pages(c: Container, document: Document) -> list[DocumentPage]:
    async with c.db.sessionmaker() as session:
        existing = list(await session.scalars(select(DocumentPage).where(DocumentPage.document_id == document.id)
                                              .order_by(DocumentPage.page_number)))
    if existing:
        return existing
    original = await c.store.get(document.storage_key)
    s = c.settings
    try:
        rendered = await asyncio.to_thread(render_pages, original, detect_kind(original),
                                           max_side=s.ocr_image_max_side, pdf_scale=s.pdf_render_scale,
                                           max_image_pixels=s.max_image_pixels)
    except InvalidDocument as exc:
        raise JobError(exc.code, exc.message, retryable=False) from exc
    pages: list[DocumentPage] = []
    prefix = document_prefix(document.owner_id, document.id)
    for page in rendered:
        ext = "png" if page.mime_type == "image/png" else "jpg"
        key = f"{prefix}/pages/{page.page_number}.{ext}"
        await c.store.put(key, page.data, page.mime_type)
        pages.append(DocumentPage(document_id=document.id, page_number=page.page_number, storage_key=key,
                                  sha256=page.sha256, width=page.width, height=page.height))
    async with c.db.sessionmaker() as session:
        session.add_all(pages)
        await session.commit()
    return pages


async def run_ocr_job(c: Container, job: Job) -> dict[str, Any]:
    document_id = uuid.UUID(job.payload["document_id"])
    async with c.db.sessionmaker() as session:
        document = await session.get(Document, document_id)
    if document is None or document.owner_id != job.owner_id:
        raise JobError("document_missing", "Tài liệu không còn tồn tại.", retryable=False)
    if c.ocr is None:
        raise JobError("ocr_not_configured",
                       "Dịch vụ nhận dạng chưa được cấu hình (thiếu khoá SoCLaaS hoặc danh mục mô hình).",
                       retryable=False)

    pages = await _ensure_pages(c, document)
    total = len(pages)
    await c.queue.progress(job.id, {"pages_total": total, "pages_done": 0, "stage": "ocr"})
    semaphore = asyncio.Semaphore(c.settings.ocr_page_concurrency)
    done = 0
    budget_stop = asyncio.Event()
    ctx = CallContext(purpose="ocr_page", user_id=job.owner_id, job_id=job.id)
    ocr = c.ocr

    async def process(page: DocumentPage) -> _PageOutcome:
        nonlocal done
        async with semaphore:
            if budget_stop.is_set():
                return _PageOutcome(page.page_number, None, "failed", "budget_exceeded", BudgetExceeded.message)
            data = await c.store.get(page.storage_key)
            mime = "image/png" if page.storage_key.endswith(".png") else "image/jpeg"
            page_input = PageInput(page_number=page.page_number, page_count=total, data=data, mime_type=mime,
                                   width=page.width, height=page.height, sha256=page.sha256)
            try:
                result = await ocr.extract(page_input, ctx)
                outcome = _PageOutcome(page.page_number, result.page, "cached" if result.cached else "ok",
                                       cost=result.cost_sgd)
            except _BUDGET_ERRORS as exc:
                budget_stop.set()
                outcome = _PageOutcome(page.page_number, None, "failed", exc.code, exc.message)
            except (ModelCallFailed, InvalidModelOutput, ModelNotConfigured) as exc:
                outcome = _PageOutcome(page.page_number, None, "failed", exc.code, exc.message)
            except AppError as exc:
                outcome = _PageOutcome(page.page_number, None, "failed", exc.code, exc.message)
            done += 1
            await c.queue.progress(job.id, {"pages_total": total, "pages_done": done, "stage": "ocr"})
            return outcome

    outcomes = sorted(await asyncio.gather(*(process(p) for p in pages)), key=lambda o: o.page_number)
    succeeded = [(o.page_number, o.page) for o in outcomes if o.page is not None]
    page_results = [{"page": o.page_number, "status": o.status, "error_code": o.error_code,
                     "error_message": o.error_message} for o in outcomes]

    if not succeeded:
        first = outcomes[0]
        retryable = all(o.error_code == "model_call_failed" for o in outcomes)
        async with c.db.sessionmaker() as session:
            doc = await session.get(Document, document_id)
            if doc is not None:
                doc.page_results = page_results
                await session.commit()
        raise JobError(first.error_code or "ocr_failed", first.error_message or "Nhận dạng thất bại.",
                       retryable=retryable)

    extracted = build_questions([(n, p) for n, p in succeeded if p is not None])
    page_by_number = {p.page_number: p for p in pages}
    page_bytes: dict[int, bytes] = {}
    prefix = document_prefix(document.owner_id, document.id)

    async with c.db.sessionmaker() as session:
        # Reprocessing replaces earlier OCR output (the API requires explicit consent if edits exist).
        await session.execute(delete(Question).where(Question.document_id == document_id))
        await session.execute(delete(Asset).where(Asset.document_id == document_id))
        for index, q in enumerate(extracted, start=1):
            question = Question(
                document_id=document_id, owner_id=document.owner_id, order_index=index,
                original_number=q.original_number, latex=q.latex, ocr_latex=q.latex,
                subquestions=[s.model_dump() for s in q.subquestions],
                ocr_subquestions=[s.model_dump() for s in q.subquestions],
                source_pages=q.source_pages, regions=[r.model_dump(mode="json") for r in q.regions],
                topics=q.topics, topic_source=q.topic_source, review_status=review_status_for(q.flags),
                flags=[f.model_dump() for f in q.flags], ocr_confidence=q.confidence, origin="ocr", version=1,
            )
            session.add(question)
            await session.flush()
            for figure in q.figure_regions:
                page = page_by_number.get(figure.page)
                if page is None:
                    continue
                if figure.page not in page_bytes:
                    page_bytes[figure.page] = await c.store.get(page.storage_key)
                crop = await asyncio.to_thread(crop_region, page_bytes[figure.page], figure.bbox)
                asset_id = uuid.uuid4()
                key = f"{prefix}/figures/{asset_id}.png"
                await c.store.put(key, crop, "image/png")
                session.add(Asset(id=asset_id, owner_id=document.owner_id, document_id=document_id,
                                  question_id=question.id, kind="figure_crop", storage_key=key,
                                  content_type="image/png", page_number=figure.page, bbox=list(figure.bbox)))
        doc = await session.get(Document, document_id)
        if doc is not None:
            doc.status = "needs_review"
            doc.page_results = page_results
            doc.error_code = None
            doc.error_message = None
        await session.commit()

    cost = sum((o.cost for o in outcomes), Decimal(0))
    logger.info("ocr_document_done", extra={"document_id": str(document_id), "pages": total,
                                            "failed_pages": sum(o.status == "failed" for o in outcomes),
                                            "cached_pages": sum(o.status == "cached" for o in outcomes),
                                            "questions": len(extracted), "cost_sgd": str(cost)})
    return {"questions": len(extracted), "pages": page_results, "cost_sgd": str(cost)}


async def mark_document_failed(c: Container, job: Job, code: str, message: str) -> None:
    document_id = job.payload.get("document_id")
    if not document_id:
        return
    async with c.db.sessionmaker() as session:
        doc = await session.get(Document, uuid.UUID(document_id))
        if doc is not None:
            doc.status = "failed"
            doc.error_code = code
            doc.error_message = message
            await session.commit()
