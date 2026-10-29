"""Figure job: formalize a confirmed geometry question (no solving) and store the validated figure."""

from __future__ import annotations

import uuid
from typing import Any

from ..agents.orchestrator import SolveInput
from ..billing.budget import BudgetRestricted, UserBudgetExceeded
from ..container import Container
from ..errors import BudgetExceeded
from ..geometry.service import build_figure
from ..models import GeometryFigure, Job, Question
from ..solvers.service import problem_text
from .ocr_job import JobError
from .solve_job import build_orchestrator


async def run_figure_job(c: Container, job: Job) -> dict[str, Any]:
    figure_id = uuid.UUID(job.payload["figure_id"])
    async with c.db.sessionmaker() as session:
        question = await session.get(Question, uuid.UUID(job.payload["question_id"]))
        if question is None or question.owner_id != job.owner_id:
            raise JobError("question_missing", "Câu hỏi không còn tồn tại.", retryable=False)
        session.expunge(question)
    if c.gateway is None:
        raise JobError("solver_not_configured", "Dịch vụ AI chưa được cấu hình.", retryable=False)
    try:
        outcome = await build_orchestrator(c).figure_only(
            SolveInput(problem_text(question), list(question.topics), job.owner_id, job.id))
    except (BudgetExceeded, BudgetRestricted, UserBudgetExceeded) as exc:
        raise JobError(exc.code, exc.message, retryable=False) from exc
    figure = await build_figure(c, job.owner_id, question, outcome.formalization, figure_id=figure_id)
    return {"figure_id": str(figure_id), "status": figure.status if figure else "unsupported",
            "cost_sgd": str(outcome.cost_sgd)}


async def mark_figure_failed(c: Container, job: Job, code: str, message: str) -> None:
    async with c.db.sessionmaker() as session:
        figure = await session.get(GeometryFigure, uuid.UUID(job.payload["figure_id"]))
        if figure is not None:
            figure.status, figure.detail = "failed", message
            await session.commit()
