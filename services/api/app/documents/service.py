"""Document and question business logic. Every query is scoped to the owner."""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass
from typing import Any

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..classification.heuristic import TOPICS
from ..container import Container
from ..errors import AppError, Conflict, NotFound, PayloadTooLarge
from ..models import Asset, Document, DocumentPage, Job, Question
from ..ocr.latex import normalize_latex
from ..ocr.schemas import Flag
from ..ocr.segmentation import review_status_for
from ..workers.queue import enqueue
from .ingest import CONTENT_TYPES, inspect_file

logger = logging.getLogger(__name__)

OCR_JOB = "ocr_document"

# OCR facts that stay true after the student edits the text.
PERSISTENT_FLAGS = {"figure_present", "figure_not_located", "handwritten", "cross_page"}
# OCR doubts that the student resolves by reviewing (editing or confirming).
REVIEW_FLAGS = {"low_confidence", "model_uncertain", "orphan_continuation"}


def user_prefix(owner_id: uuid.UUID) -> str:
    return f"users/{owner_id}"


def document_prefix(owner_id: uuid.UUID, document_id: uuid.UUID) -> str:
    return f"{user_prefix(owner_id)}/documents/{document_id}"


def safe_filename(name: str | None) -> str:
    cleaned = "".join(c for c in (name or "") if c.isprintable() and c not in '/\\<>:"|?*').strip()
    return (cleaned or "tai-lieu")[:200]


@dataclass(frozen=True)
class UploadResult:
    document: Document
    job: Job | None
    deduplicated: bool


async def upload_document(c: Container, session: AsyncSession, owner_id: uuid.UUID, filename: str | None,
                          data: bytes) -> UploadResult:
    s = c.settings
    if len(data) > s.max_upload_bytes:
        raise PayloadTooLarge(f"Tệp quá lớn (tối đa {s.max_upload_bytes // (1024 * 1024)} MB).")
    info = inspect_file(data, max_pdf_pages=s.max_pdf_pages, max_image_pixels=s.max_image_pixels)

    existing = await session.scalar(select(Document).where(
        Document.owner_id == owner_id, Document.sha256 == info.sha256, Document.status != "failed"))
    if existing is not None:
        return UploadResult(document=existing, job=None, deduplicated=True)

    count = await session.scalar(select(func.count()).select_from(Document).where(Document.owner_id == owner_id))
    if (count or 0) >= s.max_documents_per_user:
        raise AppError("Bạn đã đạt số lượng tài liệu tối đa. Hãy xoá bớt tài liệu cũ.", code="document_quota")

    document_id = uuid.uuid4()
    extension = {"jpeg": "jpg", "png": "png", "webp": "webp", "pdf": "pdf"}[info.kind]
    key = f"{document_prefix(owner_id, document_id)}/original.{extension}"
    await c.store.put(key, data, info.content_type)
    document = Document(id=document_id, owner_id=owner_id, filename=safe_filename(filename),
                        content_type=CONTENT_TYPES[info.kind], size_bytes=len(data), sha256=info.sha256,
                        storage_key=key, status="processing", page_count=info.page_count, page_results=[])
    session.add(document)
    await session.flush()
    job = enqueue(session, kind=OCR_JOB, owner_id=owner_id, payload={"document_id": str(document_id)},
                  document_id=document_id)
    await session.commit()
    logger.info("document_uploaded", extra={"document_id": str(document_id), "pages": info.page_count,
                                            "kind": info.kind, "bytes": len(data)})
    return UploadResult(document=document, job=job, deduplicated=False)


async def get_owned_document(session: AsyncSession, owner_id: uuid.UUID, document_id: uuid.UUID) -> Document:
    document = await session.scalar(select(Document).where(Document.id == document_id,
                                                           Document.owner_id == owner_id))
    if document is None:
        # 404 (not 403) so that other users' ids are indistinguishable from missing ones.
        raise NotFound("Không tìm thấy tài liệu.")
    return document


async def list_documents(session: AsyncSession, owner_id: uuid.UUID, limit: int = 50) -> list[Document]:
    rows = await session.scalars(select(Document).where(Document.owner_id == owner_id)
                                 .order_by(Document.created_at.desc()).limit(limit))
    return list(rows)


async def document_questions(session: AsyncSession, document_id: uuid.UUID) -> list[Question]:
    rows = await session.scalars(select(Question).where(Question.document_id == document_id)
                                 .order_by(Question.order_index))
    return list(rows)


async def document_pages(session: AsyncSession, document_id: uuid.UUID) -> list[DocumentPage]:
    rows = await session.scalars(select(DocumentPage).where(DocumentPage.document_id == document_id)
                                 .order_by(DocumentPage.page_number))
    return list(rows)


async def latest_job(session: AsyncSession, document_id: uuid.UUID) -> Job | None:
    job: Job | None = await session.scalar(select(Job).where(Job.document_id == document_id)
                                .order_by(Job.created_at.desc()).limit(1))
    return job


async def delete_document(c: Container, session: AsyncSession, owner_id: uuid.UUID, document_id: uuid.UUID
                          ) -> None:
    document = await get_owned_document(session, owner_id, document_id)
    job = await latest_job(session, document_id)
    if job is not None and job.status in ("queued", "running"):
        raise Conflict("Tài liệu đang được xử lý. Hãy đợi xử lý xong rồi xoá.")
    await session.delete(document)
    await session.commit()
    await c.store.delete_prefix(document_prefix(owner_id, document_id))


async def reprocess_document(session: AsyncSession, owner_id: uuid.UUID, document_id: uuid.UUID,
                             discard_edits: bool) -> Job:
    document = await get_owned_document(session, owner_id, document_id)
    job = await latest_job(session, document_id)
    if job is not None and job.status in ("queued", "running"):
        raise Conflict("Tài liệu đang được xử lý.")
    edited = await session.scalar(select(func.count()).select_from(Question).where(
        Question.document_id == document_id,
        (Question.version > 1) | (Question.origin == "manual") | (Question.review_status == "confirmed")))
    if edited and not discard_edits:
        raise Conflict("Nhận dạng lại sẽ xoá các chỉnh sửa của bạn. Hãy xác nhận nếu muốn tiếp tục.",
                       code="edits_would_be_lost", details={"edited_questions": edited})
    document.status = "processing"
    document.error_code = None
    document.error_message = None
    new_job = enqueue(session, kind=OCR_JOB, owner_id=owner_id, payload={"document_id": str(document_id)},
                      document_id=document_id)
    await session.commit()
    return new_job


async def get_owned_question(session: AsyncSession, owner_id: uuid.UUID, question_id: uuid.UUID,
                             *, for_update: bool = False) -> Question:
    stmt = select(Question).where(Question.id == question_id, Question.owner_id == owner_id)
    if for_update:
        stmt = stmt.with_for_update()
    question = await session.scalar(stmt)
    if question is None:
        raise NotFound("Không tìm thấy câu hỏi.")
    return question


def _latex_flags(latex: str, subquestions: list[dict[str, str]]) -> tuple[str, list[dict[str, str]], list[Flag]]:
    flags: list[Flag] = []
    stem = normalize_latex(latex)
    issues = [i for i in stem.issues if not (i.code == "empty" and subquestions)]
    normalized_subs: list[dict[str, str]] = []
    for sub in subquestions:
        report = normalize_latex(sub["latex"])
        issues.extend(report.issues)
        normalized_subs.append({"label": sub["label"].strip()[:16], "latex": report.text})
    seen: set[str] = set()
    for issue in issues:
        if issue.message not in seen:
            seen.add(issue.message)
            flags.append(Flag(code=issue.code, severity=issue.severity, message=issue.message))
    return stem.text, normalized_subs, flags


@dataclass(frozen=True)
class QuestionChanges:
    expected_version: int
    latex: str | None = None
    subquestions: list[dict[str, str]] | None = None
    topics: list[str] | None = None
    original_number: str | None = None
    set_original_number: bool = False
    review_status: str | None = None


class ConfirmBlocked(AppError):
    status_code = 422
    code = "confirm_blocked"
    message = "Chưa thể xác nhận: hãy sửa các lỗi được đánh dấu trước."


async def update_question(session: AsyncSession, owner_id: uuid.UUID, question_id: uuid.UUID,
                          changes: QuestionChanges) -> Question:
    question = await get_owned_question(session, owner_id, question_id, for_update=True)
    if question.version != changes.expected_version:
        raise Conflict(details={"current_version": question.version})

    latex = changes.latex if changes.latex is not None else question.latex
    subs: list[dict[str, Any]] = (changes.subquestions if changes.subquestions is not None
                                  else list(question.subquestions))
    if changes.topics is not None:
        unknown = [t for t in changes.topics if t not in TOPICS]
        if unknown:
            raise AppError("Chủ đề không hợp lệ.", code="invalid_topic", details={"topics": unknown})
        question.topics = list(dict.fromkeys(changes.topics))
        question.topic_source = "student"
    if changes.set_original_number:
        question.original_number = (changes.original_number or "").strip()[:64] or None

    text, normalized_subs, latex_flags = _latex_flags(latex, subs)
    # Compare normalised forms so whitespace-only edits do not reopen a confirmed question.
    content_changed = text != question.latex or normalized_subs != question.subquestions
    reviewed = content_changed or changes.review_status == "confirmed" or question.version > 1
    old = [Flag.model_validate(f) for f in question.flags]
    flags = [f for f in old if f.code in PERSISTENT_FLAGS]
    if not reviewed:
        flags += [f for f in old if f.code in REVIEW_FLAGS]
    flags += latex_flags
    if not question.topics:
        flags.append(Flag(code="topic_unknown", severity="info", message="Chưa xác định được chủ đề."))

    if changes.review_status == "confirmed":
        if any(f.severity == "error" for f in flags):
            raise ConfirmBlocked(details={"flags": [f.model_dump() for f in flags if f.severity == "error"]})
        status = "confirmed"
    elif changes.review_status == "pending" or content_changed:
        status = review_status_for(flags)
    else:
        status = question.review_status if question.review_status == "confirmed" else review_status_for(flags)

    question.latex = text
    question.subquestions = normalized_subs
    question.flags = [f.model_dump() for f in flags]
    question.review_status = status
    question.version += 1
    await session.commit()
    await session.refresh(question)
    return question


async def create_manual_question(session: AsyncSession, owner_id: uuid.UUID, document_id: uuid.UUID,
                                 latex: str, original_number: str | None,
                                 subquestions: list[dict[str, str]]) -> Question:
    await get_owned_document(session, owner_id, document_id)
    text, subs, flags = _latex_flags(latex, subquestions)
    from ..classification.heuristic import classify

    topics, _ = classify(" ".join([text, *(s["latex"] for s in subs)]))
    if not topics:
        flags.append(Flag(code="topic_unknown", severity="info", message="Chưa xác định được chủ đề."))
    max_order = await session.scalar(select(func.max(Question.order_index)).where(
        Question.document_id == document_id))
    question = Question(document_id=document_id, owner_id=owner_id, order_index=(max_order or 0) + 1,
                        original_number=(original_number or "").strip()[:64] or None, latex=text, ocr_latex="",
                        subquestions=subs, ocr_subquestions=[], source_pages=[], regions=[], topics=topics,
                        topic_source="heuristic", review_status=review_status_for(flags),
                        flags=[f.model_dump() for f in flags], origin="manual", version=1)
    session.add(question)
    await session.commit()
    await session.refresh(question)
    return question


async def delete_question(session: AsyncSession, owner_id: uuid.UUID, question_id: uuid.UUID) -> None:
    question = await get_owned_question(session, owner_id, question_id)
    await session.execute(delete(Asset).where(Asset.question_id == question.id))
    await session.delete(question)
    await session.commit()


async def question_assets(session: AsyncSession, question_ids: list[uuid.UUID]) -> dict[uuid.UUID, list[Asset]]:
    if not question_ids:
        return {}
    rows = await session.scalars(select(Asset).where(Asset.question_id.in_(question_ids)))
    result: dict[uuid.UUID, list[Asset]] = {}
    for asset in rows:
        if asset.question_id is not None:
            result.setdefault(asset.question_id, []).append(asset)
    return result
