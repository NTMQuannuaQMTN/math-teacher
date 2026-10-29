"""Solve requests: only confirmed questions, cached by content, executed asynchronously as jobs."""

from __future__ import annotations

import hashlib
import uuid
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..billing.entitlements import Decision, solution_reveal_decision
from ..container import Container
from ..curriculum.policy import load_policy
from ..documents.service import get_owned_question
from ..errors import Conflict, NotFound
from ..models import GeometryFigure, Job, Question, Solution, SolutionAccess
from ..workers.queue import enqueue
from .schemas import PIPELINE_VERSION

SOLVE_JOB = "solve_question"
# Only trustworthy results are shared across users through the cache.
CACHEABLE = {"VERIFIED", "PARTIALLY_VERIFIED"}


def problem_text(question: Question) -> str:
    lines = [question.latex.strip()] if question.latex.strip() else []
    lines.extend(f"{sub['label']} {sub['latex']}".strip() for sub in question.subquestions)
    return "\n".join(lines)


def cache_key(question: Question, model_id: str) -> str:
    raw = "|".join([PIPELINE_VERSION, load_policy().version, model_id, problem_text(question),
                    ",".join(sorted(question.topics))])
    return hashlib.sha256(raw.encode()).hexdigest()


@dataclass(frozen=True)
class SolveRequest:
    solution: Solution
    job: Job | None
    cached: bool


async def latest_solution(session: AsyncSession, question_id: uuid.UUID) -> Solution | None:
    found: Solution | None = await session.scalar(
        select(Solution).where(Solution.question_id == question_id).order_by(Solution.created_at.desc()).limit(1))
    return found


async def request_solve(c: Container, session: AsyncSession, owner_id: uuid.UUID, question_id: uuid.UUID,
                        force: bool, before_new_job: Callable[[], Awaitable[None]] | None = None) -> SolveRequest:
    """Return the running/finished solution, a cache copy, or queue a new solve job (calling `before_new_job`
    first, e.g. a rate limit, so refused requests create nothing)."""
    question = await get_owned_question(session, owner_id, question_id)
    if question.review_status != "confirmed":
        raise Conflict("Hãy xác nhận đề bài đúng trước khi giải.", code="question_not_confirmed")
    if c.gateway is None:
        raise Conflict("Dịch vụ AI chưa được cấu hình.", code="solver_not_configured")
    model_id = c.gateway.catalog.for_tier("reasoning").id
    key = cache_key(question, model_id)

    latest = await latest_solution(session, question.id)
    if latest is not None and latest.question_version == question.version:
        if latest.status in ("queued", "running"):
            job = await session.get(Job, latest.job_id) if latest.job_id else None
            return SolveRequest(latest, job, cached=False)
        if latest.status == "done" and not force:
            return SolveRequest(latest, None, cached=latest.from_cache)

    policy = load_policy()
    if not force:
        shared = await session.scalar(
            select(Solution).where(Solution.cache_key == key, Solution.status == "done",
                                   Solution.verification_status.in_(CACHEABLE),
                                   Solution.curriculum_status != "NON_COMPLIANT")
            .order_by(Solution.created_at.desc()).limit(1))
        if shared is not None:
            copy = Solution(question_id=question.id, owner_id=owner_id, question_version=question.version,
                            cache_key=key, status="done", verification_status=shared.verification_status,
                            curriculum_status=shared.curriculum_status, topics=shared.topics, result=shared.result,
                            trace=[{"state": "cache", "source": str(shared.id)}], attempts=0, from_cache=True,
                            pipeline_version=PIPELINE_VERSION, policy_version=policy.version)
            session.add(copy)
            await session.commit()
            await session.refresh(copy)  # server-side timestamps
            return SolveRequest(copy, None, cached=True)

    if before_new_job is not None:
        await before_new_job()
    solution = Solution(question_id=question.id, owner_id=owner_id, question_version=question.version, cache_key=key,
                        status="queued", topics=list(question.topics), trace=[], pipeline_version=PIPELINE_VERSION,
                        policy_version=policy.version)
    session.add(solution)
    await session.flush()
    # One attempt: the gateway already retries transient provider errors, and re-running a whole solve (which may
    # include a multi-minute reasoning call) would double its cost. The student can press "Giải lại".
    job = enqueue(session, kind=SOLVE_JOB, owner_id=owner_id, payload={"solution_id": str(solution.id)},
                  max_attempts=1)
    await session.flush()
    solution.job_id = job.id
    await session.commit()
    await session.refresh(solution)  # server-side timestamps
    await session.refresh(job)
    return SolveRequest(solution, job, cached=False)


async def get_solution(session: AsyncSession, owner_id: uuid.UUID, question_id: uuid.UUID) -> tuple[Solution, int]:
    question = await get_owned_question(session, owner_id, question_id)
    solution = await latest_solution(session, question.id)
    if solution is None:
        raise NotFound("Câu hỏi này chưa có lời giải.")
    return solution, question.version


# --- hints first, then the solution ---------------------------------------------------------------------------

def solution_hints(solution: Solution) -> list[dict[str, str]]:
    hints: list[dict[str, str]] = (solution.result or {}).get("hints") or []
    return hints


async def get_access(session: AsyncSession, user_id: uuid.UUID, solution: Solution, *, create: bool = False
                     ) -> SolutionAccess | None:
    access: SolutionAccess | None = await session.scalar(select(SolutionAccess).where(
        SolutionAccess.user_id == user_id, SolutionAccess.solution_id == solution.id).with_for_update())
    if access is None and create:
        access = SolutionAccess(user_id=user_id, solution_id=solution.id, hints_revealed=0)
        session.add(access)
        await session.flush()
    return access


@dataclass(frozen=True)
class SolutionView:
    solution: Solution
    question_version: int
    access: SolutionAccess | None
    decision: Decision
    figure_id: uuid.UUID | None = None


async def solution_view(c: Container, session: AsyncSession, user_id: uuid.UUID, question_id: uuid.UUID
                        ) -> SolutionView:
    solution, version = await get_solution(session, user_id, question_id)
    access = await get_access(session, user_id, solution)
    decision = await solution_reveal_decision(session, c.settings, user_id, solution, access,
                                              len(solution_hints(solution)))
    figure_id = await session.scalar(select(GeometryFigure.id).where(GeometryFigure.solution_id == solution.id)
                                     .order_by(GeometryFigure.created_at.desc()).limit(1))
    return SolutionView(solution, version, access, decision, figure_id)


async def reveal_next_hint(c: Container, session: AsyncSession, user_id: uuid.UUID, question_id: uuid.UUID
                           ) -> SolutionView:
    solution, version = await get_solution(session, user_id, question_id)
    if solution.status != "done":
        raise Conflict("Lời giải chưa sẵn sàng.", code="solution_not_ready")
    total = len(solution_hints(solution))
    access = await get_access(session, user_id, solution, create=True)
    assert access is not None
    if access.hints_revealed >= total:
        raise Conflict("Đã xem hết gợi ý.", code="no_more_hints")
    access.hints_revealed += 1
    await session.commit()
    await session.refresh(access)
    decision = await solution_reveal_decision(session, c.settings, user_id, solution, access, total)
    return SolutionView(solution, version, access, decision)


async def reveal_solution(c: Container, session: AsyncSession, user_id: uuid.UUID, question_id: uuid.UUID
                          ) -> SolutionView:
    solution, version = await get_solution(session, user_id, question_id)
    access = await get_access(session, user_id, solution, create=True)
    assert access is not None
    decision = await solution_reveal_decision(session, c.settings, user_id, solution, access,
                                              len(solution_hints(solution)))
    if not decision.allowed:
        raise Conflict(decision.reason_vi, code="solution_locked")
    if access.solution_revealed_at is None:
        access.solution_revealed_at = datetime.now(UTC)
        access.reveal_grant = decision.grant
        await session.commit()
        await session.refresh(access)
    return SolutionView(solution, version, access, decision)
