from __future__ import annotations

from typing import Any

from ...models import Asset, Document, DocumentPage, Job, Question
from .schemas import (
    AssetOut,
    DocumentOut,
    DocumentSummaryOut,
    JobOut,
    PageOut,
    PageResultOut,
    QuestionOut,
)

API = "/api/v1"


def job_out(job: Job) -> JobOut:
    progress: dict[str, Any] = {k: v for k, v in (job.progress or {}).items() if isinstance(v, int | str)}
    return JobOut(id=job.id, kind=job.kind, status=job.status,
                  progress=progress, error_code=job.error_code, error_message=job.error_message,
                  attempts=job.attempts, created_at=job.created_at, updated_at=job.updated_at)


def asset_out(asset: Asset) -> AssetOut:
    return AssetOut(id=asset.id, kind=asset.kind, url=f"{API}/assets/{asset.id}", page_number=asset.page_number)


def question_out(question: Question, assets: list[Asset] | None = None) -> QuestionOut:
    return QuestionOut.model_validate({
        "id": question.id, "document_id": question.document_id, "order_index": question.order_index,
        "original_number": question.original_number, "latex": question.latex, "ocr_latex": question.ocr_latex,
        "subquestions": question.subquestions, "source_pages": question.source_pages, "regions": question.regions,
        "topics": question.topics, "topic_source": question.topic_source, "review_status": question.review_status,
        "flags": question.flags,
        "ocr_confidence": float(question.ocr_confidence) if question.ocr_confidence is not None else None,
        "origin": question.origin, "version": question.version,
        "assets": [asset_out(a) for a in assets or []], "updated_at": question.updated_at,
    })


def document_summary(document: Document, question_count: int | None = None) -> DocumentSummaryOut:
    return DocumentSummaryOut.model_validate({
        "id": document.id, "filename": document.filename, "content_type": document.content_type,
        "size_bytes": document.size_bytes, "status": document.status, "page_count": document.page_count,
        "error_code": document.error_code, "error_message": document.error_message,
        "created_at": document.created_at, "question_count": question_count,
    })


def document_out(document: Document, pages: list[DocumentPage], questions: list[Question],
                 assets: dict[Any, list[Asset]], job: Job | None) -> DocumentOut:
    summary = document_summary(document, len(questions))
    return DocumentOut(
        **summary.model_dump(),
        pages=[PageOut(page_number=p.page_number, width=p.width, height=p.height,
                       image_url=f"{API}/documents/{document.id}/pages/{p.page_number}/image") for p in pages],
        page_results=[PageResultOut.model_validate(r) for r in document.page_results or []],
        questions=[question_out(q, assets.get(q.id)) for q in questions],
        job=job_out(job) if job else None,
    )
