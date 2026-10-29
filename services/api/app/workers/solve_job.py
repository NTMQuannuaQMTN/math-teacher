"""Solve job: run the orchestrator for one Solution row and persist the result."""

from __future__ import annotations

import logging
import uuid
from typing import Any

from ..agents.orchestrator import Orchestrator, SolveInput, SolveState
from ..billing.budget import BudgetRestricted, UserBudgetExceeded
from ..container import Container
from ..errors import BudgetExceeded
from ..geometry.service import build_figure, geometry_spec
from ..models import Job, Question, Solution
from ..providers.catalog import ModelNotConfigured
from ..solvers.schemas import CurriculumFindingOut
from ..solvers.service import problem_text
from .ocr_job import JobError

logger = logging.getLogger(__name__)


def build_orchestrator(c: Container) -> Orchestrator:
    assert c.gateway is not None
    return Orchestrator(c.gateway, max_revisions=c.settings.solve_max_revisions,
                        question_budget_sgd=c.settings.question_budget_sgd,
                        escalate_thinking=c.settings.solve_escalate_thinking)


async def run_solve_job(c: Container, job: Job) -> dict[str, Any]:
    solution_id = uuid.UUID(job.payload["solution_id"])
    async with c.db.sessionmaker() as session:
        solution = await session.get(Solution, solution_id)
        if solution is None or solution.owner_id != job.owner_id:
            raise JobError("solution_missing", "Yêu cầu giải không còn tồn tại.", retryable=False)
        question = await session.get(Question, solution.question_id)
        if question is None:
            raise JobError("question_missing", "Câu hỏi không còn tồn tại.", retryable=False)
        if c.gateway is None:
            raise JobError("solver_not_configured", "Dịch vụ AI chưa được cấu hình.", retryable=False)
        solution.status = "running"
        text, topics = problem_text(question), list(question.topics)
        await session.commit()

    try:
        outcome = await build_orchestrator(c).run_solve(SolveInput(text, topics, job.owner_id, job.id))
    except (BudgetExceeded, BudgetRestricted, UserBudgetExceeded, ModelNotConfigured) as exc:
        raise JobError(exc.code, exc.message, retryable=False) from exc

    if outcome.state == SolveState.FAILED or outcome.best is None:
        retryable = outcome.error_code == "model_call_failed"
        raise JobError(outcome.error_code or "solve_failed",
                       outcome.error_message or "Không giải được câu hỏi này lúc này.", retryable=retryable)

    best = outcome.best
    findings = [CurriculumFindingOut(rule_id=f.rule_id, severity=f.severity, message=f.message,
                                     excerpt=f.excerpt).model_dump() for f in (best.curriculum.findings
                                                                               if best.curriculum else [])]
    result = {
        "solution": best.solution.model_dump(mode="json"),
        "verdicts": [v.model_dump() for v in best.verdicts],
        "evidence": [e.model_dump(mode="json") for e in best.evidence],
        "curriculum_findings": findings,
        "formalization": outcome.formalization.model_dump(mode="json") if outcome.formalization else None,
        "hints": [h.model_dump() for h in outcome.hints],
    }
    async with c.db.sessionmaker() as session:
        row = await session.get(Solution, solution_id)
        if row is None:
            raise JobError("solution_missing", "Yêu cầu giải không còn tồn tại.", retryable=False)
        row.status = "done"
        row.verification_status = best.status
        row.curriculum_status = best.curriculum.status if best.curriculum else "NOT_CHECKED"
        row.topics = outcome.topics
        row.result = result
        row.trace = outcome.trace
        row.attempts = outcome.attempts
        row.cost_sgd = outcome.cost_sgd
        row.error_code = row.error_message = None
        await session.commit()
    # A geometry formalization doubles as the interactive figure.
    async with c.db.sessionmaker() as session:
        question_row = await session.get(Question, row.question_id)
        if question_row is not None:
            session.expunge(question_row)
    if question_row is not None and geometry_spec(outcome.formalization) is not None:
        await build_figure(c, job.owner_id, question_row, outcome.formalization, solution_id=solution_id)
    return {"solution_id": str(solution_id), "verification_status": best.status,
            "curriculum_status": row.curriculum_status, "cost_sgd": str(outcome.cost_sgd)}


async def mark_solution_failed(c: Container, job: Job, code: str, message: str) -> None:
    solution_id = job.payload.get("solution_id")
    if not solution_id:
        return
    async with c.db.sessionmaker() as session:
        row = await session.get(Solution, uuid.UUID(solution_id))
        if row is not None:
            row.status = "failed"
            row.error_code = code
            row.error_message = message
            await session.commit()
