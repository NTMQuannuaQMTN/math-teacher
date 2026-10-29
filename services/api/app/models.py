"""SQLAlchemy ORM models. Schema changes go through Alembic migrations in `migrations/`."""

from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import (
    BigInteger,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

MONEY = Numeric(12, 6)


class Base(DeclarativeBase):
    pass


def _uuid() -> uuid.UUID:
    return uuid.uuid4()


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    kind: Mapped[str] = mapped_column(String(16), default="guest")  # guest | registered


class AuthSession(Base):
    __tablename__ = "auth_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Document(TimestampMixin, Base):
    __tablename__ = "documents"
    __table_args__ = (Index("ix_documents_owner_created", "owner_id", "created_at"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    filename: Mapped[str] = mapped_column(String(255))
    content_type: Mapped[str] = mapped_column(String(64))
    size_bytes: Mapped[int] = mapped_column(BigInteger)
    sha256: Mapped[str] = mapped_column(String(64), index=True)
    storage_key: Mapped[str] = mapped_column(String(512))
    # uploaded | processing | needs_review | failed
    status: Mapped[str] = mapped_column(String(32), default="uploaded")
    page_count: Mapped[int | None] = mapped_column(Integer)
    error_code: Mapped[str | None] = mapped_column(String(64))
    error_message: Mapped[str | None] = mapped_column(Text)
    # Per-page OCR outcome: [{"page": 1, "status": "ok"|"failed"|"cached", "error_code": ...}]
    page_results: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, default=list)


class DocumentPage(Base):
    __tablename__ = "document_pages"
    __table_args__ = (UniqueConstraint("document_id", "page_number"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    document_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("documents.id", ondelete="CASCADE"), index=True)
    page_number: Mapped[int] = mapped_column(Integer)
    storage_key: Mapped[str] = mapped_column(String(512))
    sha256: Mapped[str] = mapped_column(String(64))
    width: Mapped[int] = mapped_column(Integer)
    height: Mapped[int] = mapped_column(Integer)


class Question(TimestampMixin, Base):
    __tablename__ = "questions"
    __table_args__ = (Index("ix_questions_document_order", "document_id", "order_index"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    document_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("documents.id", ondelete="CASCADE"))
    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    order_index: Mapped[int] = mapped_column(Integer)
    original_number: Mapped[str | None] = mapped_column(String(64))
    latex: Mapped[str] = mapped_column(Text)
    # Immutable OCR output for audit and golden comparisons.
    ocr_latex: Mapped[str] = mapped_column(Text)
    subquestions: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, default=list)
    ocr_subquestions: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, default=list)
    source_pages: Mapped[list[int]] = mapped_column(JSONB, default=list)
    # [{"page": 1, "bbox": [x0, y0, x1, y1]}] in 0..1 page coordinates
    regions: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, default=list)
    topics: Mapped[list[str]] = mapped_column(JSONB, default=list)
    topic_source: Mapped[str] = mapped_column(String(16), default="heuristic")  # ai | heuristic | student
    # pending | flagged | confirmed
    review_status: Mapped[str] = mapped_column(String(16), default="pending")
    flags: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, default=list)
    ocr_confidence: Mapped[float | None] = mapped_column(Numeric(4, 3))
    origin: Mapped[str] = mapped_column(String(16), default="ocr")  # ocr | manual
    version: Mapped[int] = mapped_column(Integer, default=1)


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    document_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("documents.id", ondelete="CASCADE"), index=True)
    question_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("questions.id", ondelete="SET NULL"))
    kind: Mapped[str] = mapped_column(String(32))  # figure_crop
    storage_key: Mapped[str] = mapped_column(String(512))
    content_type: Mapped[str] = mapped_column(String(64))
    page_number: Mapped[int | None] = mapped_column(Integer)
    bbox: Mapped[list[float] | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Job(TimestampMixin, Base):
    __tablename__ = "jobs"
    __table_args__ = (Index("ix_jobs_claim", "status", "run_after"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    kind: Mapped[str] = mapped_column(String(32))
    # queued | running | succeeded | failed
    status: Mapped[str] = mapped_column(String(16), default="queued")
    payload: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    progress: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    result: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    error_code: Mapped[str | None] = mapped_column(String(64))
    error_message: Mapped[str | None] = mapped_column(Text)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    max_attempts: Mapped[int] = mapped_column(Integer, default=2)
    run_after: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    locked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    locked_by: Mapped[str | None] = mapped_column(String(128))
    document_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("documents.id", ondelete="CASCADE"))


class OcrCacheEntry(Base):
    __tablename__ = "ocr_cache"

    cache_key: Mapped[str] = mapped_column(String(64), primary_key=True)
    pipeline_version: Mapped[str] = mapped_column(String(32))
    model: Mapped[str] = mapped_column(String(128))
    result: Mapped[dict[str, Any]] = mapped_column(JSONB)
    hits: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class DailyBudget(Base):
    __tablename__ = "daily_budgets"

    day: Mapped[date] = mapped_column(Date, primary_key=True)
    ceiling_sgd: Mapped[Decimal] = mapped_column(MONEY)
    reserved_sgd: Mapped[Decimal] = mapped_column(MONEY, default=Decimal(0))
    spent_sgd: Mapped[Decimal] = mapped_column(MONEY, default=Decimal(0))


class LlmCall(Base):
    """Ledger of every paid model call: reservation → settlement."""

    __tablename__ = "llm_calls"
    __table_args__ = (
        Index("ix_llm_calls_day_user", "day", "user_id"),
        Index("ix_llm_calls_status_created", "status", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    day: Mapped[date] = mapped_column(Date)
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    purpose: Mapped[str] = mapped_column(String(32))
    provider: Mapped[str] = mapped_column(String(32))
    model: Mapped[str] = mapped_column(String(128))
    # reserved | committed | released | expired
    status: Mapped[str] = mapped_column(String(16), default="reserved")
    reserved_sgd: Mapped[Decimal] = mapped_column(MONEY)
    actual_sgd: Mapped[Decimal | None] = mapped_column(MONEY)
    prompt_tokens: Mapped[int | None] = mapped_column(Integer)
    completion_tokens: Mapped[int | None] = mapped_column(Integer)
    usage_reported: Mapped[bool | None] = mapped_column()
    latency_ms: Mapped[int | None] = mapped_column(Integer)
    outcome: Mapped[str | None] = mapped_column(String(32))  # ok | provider_error | timeout | invalid_output
    request_id: Mapped[str | None] = mapped_column(String(64))
    job_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    settled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class RateLimitBucket(Base):
    __tablename__ = "rate_limit_buckets"

    key: Mapped[str] = mapped_column(String(200), primary_key=True)
    window_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), primary_key=True)
    count: Mapped[int] = mapped_column(Integer, default=0)


class Solution(TimestampMixin, Base):
    """One solve request for a confirmed question, with both verdicts and the evidence behind them."""

    __tablename__ = "solutions"
    __table_args__ = (Index("ix_solutions_question_created", "question_id", "created_at"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    question_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("questions.id", ondelete="CASCADE"))
    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    question_version: Mapped[int] = mapped_column(Integer)
    cache_key: Mapped[str] = mapped_column(String(64), index=True)
    # queued | running | done | failed
    status: Mapped[str] = mapped_column(String(16), default="queued")
    # VERIFIED | PARTIALLY_VERIFIED | UNVERIFIED | INCORRECT | UNSOLVED (null until done)
    verification_status: Mapped[str | None] = mapped_column(String(24))
    # COMPLIANT | COMPLIANT_WITH_WARNINGS | NON_COMPLIANT | NOT_CHECKED
    curriculum_status: Mapped[str | None] = mapped_column(String(32))
    topics: Mapped[list[str]] = mapped_column(JSONB, default=list)
    result: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    trace: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, default=list)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    cost_sgd: Mapped[Decimal] = mapped_column(MONEY, default=Decimal(0))
    from_cache: Mapped[bool] = mapped_column(default=False)
    pipeline_version: Mapped[str] = mapped_column(String(32))
    policy_version: Mapped[str] = mapped_column(String(48))
    error_code: Mapped[str | None] = mapped_column(String(64))
    error_message: Mapped[str | None] = mapped_column(Text)
    job_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))


class SolutionAccess(TimestampMixin, Base):
    """What a student has opened of a solution: hints one by one, then (optionally) the full solution.

    The API sends steps and answers only after `solution_revealed_at` is set, so access can later be gated by an
    entitlement (see app/billing/entitlements.py) without trusting the browser.
    """

    __tablename__ = "solution_access"
    __table_args__ = (UniqueConstraint("user_id", "solution_id"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    solution_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("solutions.id", ondelete="CASCADE"), index=True)
    hints_revealed: Mapped[int] = mapped_column(Integer, default=0)
    solution_revealed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # How the reveal was granted (e.g. "free"); a paid plan would record its own reason here.
    reveal_grant: Mapped[str | None] = mapped_column(String(32))


class GeometryFigure(Base):
    """A validated geometry construction for a question (drawn with JSXGraph, checked by the engine)."""

    __tablename__ = "geometry_figures"
    __table_args__ = (Index("ix_geometry_figures_question_created", "question_id", "created_at"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    question_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("questions.id", ondelete="CASCADE"))
    solution_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("solutions.id", ondelete="SET NULL"))
    question_version: Mapped[int] = mapped_column(Integer)
    # pending | ok | infeasible | invalid | unsupported | failed
    status: Mapped[str] = mapped_column(String(16))
    detail: Mapped[str | None] = mapped_column(Text)
    spec: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    initial: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    job_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class TutoringSession(TimestampMixin, Base):
    """A student working on one question with the tutor; reuses the question's solution as the plan."""

    __tablename__ = "tutoring_sessions"
    __table_args__ = (Index("ix_tutoring_sessions_user_question", "user_id", "question_id"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    question_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("questions.id", ondelete="CASCADE"))
    solution_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("solutions.id", ondelete="CASCADE"))


class TutoringMessage(Base):
    __tablename__ = "tutoring_messages"
    __table_args__ = (Index("ix_tutoring_messages_session_created", "session_id", "created_at"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tutoring_sessions.id", ondelete="CASCADE"))
    role: Mapped[str] = mapped_column(String(16))  # student | tutor
    content: Mapped[str] = mapped_column(Text)  # student work, or the tutor's hint text
    feedback: Mapped[dict[str, Any] | None] = mapped_column(JSONB)  # tutor: steps, first error, tool checks
    cost_sgd: Mapped[Decimal] = mapped_column(MONEY, default=Decimal(0))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
