"""Geometry figures: built from the independent formalization, validated by the engine, served to JSXGraph."""

from __future__ import annotations

import uuid
from collections.abc import Awaitable, Callable
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..container import Container
from ..documents.service import get_owned_question
from ..errors import Conflict, NotFound
from ..models import GeometryFigure, Question
from ..solvers.schemas import Formalization, GeometryTemplate
from ..tools.sandbox import run_check
from ..workers.queue import enqueue

FIGURE_JOB = "figure_question"


def geometry_spec(formalization: Formalization | None) -> dict[str, Any] | None:
    if formalization is None:
        return None
    for part in formalization.parts:
        if isinstance(part.template, GeometryTemplate):
            spec: dict[str, Any] = part.template.spec.model_dump(mode="json")
            return spec
    return None


async def build_figure(c: Container, owner_id: uuid.UUID, question: Question, formalization: Formalization | None,
                       *, solution_id: uuid.UUID | None = None, figure_id: uuid.UUID | None = None
                       ) -> GeometryFigure | None:
    """Validate the formalization's geometry spec in the sandbox and store (or update) the figure."""
    spec = geometry_spec(formalization)
    if spec is None and figure_id is None:
        return None
    status: str = "unsupported"
    detail: str | None = "Chưa chuyển được đề bài thành hình vẽ."
    initial: dict[str, Any] | None = None
    if spec is not None:
        result = await run_check("figure", {"spec": spec}, limit_seconds=20)
        if result.get("ok"):
            data = result["result"]["data"]
            status = data["status"]
            detail = result["result"]["detail"] or None
            initial = {"values": (data.get("initial") or {}).get("values"),
                       "params": (data.get("initial") or {}).get("params"), "layout": data.get("layout")}
        else:
            status, detail = "failed", "Không dựng được hình (quá thời gian)."
    async with c.db.sessionmaker() as session:
        figure = await session.get(GeometryFigure, figure_id) if figure_id else None
        if figure is None:
            figure = GeometryFigure(owner_id=owner_id, question_id=question.id, question_version=question.version)
            session.add(figure)
        figure.solution_id = solution_id or figure.solution_id
        figure.status, figure.detail, figure.spec, figure.initial = status, detail, spec, initial
        await session.commit()
        await session.refresh(figure)
        return figure


async def latest_figure(session: AsyncSession, question_id: uuid.UUID) -> GeometryFigure | None:
    figure: GeometryFigure | None = await session.scalar(
        select(GeometryFigure).where(GeometryFigure.question_id == question_id)
        .order_by(GeometryFigure.created_at.desc()).limit(1))
    return figure


async def get_owned_figure(session: AsyncSession, owner_id: uuid.UUID, figure_id: uuid.UUID) -> GeometryFigure:
    figure = await session.scalar(select(GeometryFigure).where(GeometryFigure.id == figure_id,
                                                               GeometryFigure.owner_id == owner_id))
    if figure is None:
        raise NotFound("Không tìm thấy hình vẽ.")
    return figure


async def request_figure(session: AsyncSession, owner_id: uuid.UUID, question_id: uuid.UUID,
                         before_new_job: Callable[[], Awaitable[None]] | None = None, *, force: bool = False
                         ) -> GeometryFigure:
    """Return the current figure for this question version, or queue a formalize-only job to draw one.
    `force` draws again (a fresh formalization) unless a drawing is already in progress."""
    question = await get_owned_question(session, owner_id, question_id)
    if question.review_status != "confirmed":
        raise Conflict("Hãy xác nhận đề bài đúng trước khi vẽ hình.", code="question_not_confirmed")
    existing = await latest_figure(session, question.id)
    if existing is not None and existing.question_version == question.version and existing.status != "failed" \
            and (existing.status == "pending" or not force):
        return existing
    if before_new_job is not None:
        await before_new_job()
    figure = GeometryFigure(owner_id=owner_id, question_id=question.id, question_version=question.version,
                            status="pending")
    session.add(figure)
    await session.flush()
    job = enqueue(session, kind=FIGURE_JOB, owner_id=owner_id,
                  payload={"figure_id": str(figure.id), "question_id": str(question.id)}, max_attempts=1)
    await session.flush()
    figure.job_id = job.id
    await session.commit()
    await session.refresh(figure)
    return figure
