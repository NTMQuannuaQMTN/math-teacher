"""Tutoring sessions: hints and feedback on the student's own work, persisted per student and question."""

from __future__ import annotations

import uuid
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..billing.entitlements import tutoring_turn_decision
from ..container import Container
from ..curriculum.policy import load_policy
from ..errors import AppError, Conflict, NotFound
from ..models import Question, Solution, SolutionAccess, TutoringMessage, TutoringSession
from ..providers.gateway import CallContext
from ..solvers import service as solve_service
from ..solvers.schemas import Hint, ModelSolution
from .feedback import analyze_work
from .work_ocr import WorkReading, read_work

MAX_WORK_CHARS = 4000


class TutoringLocked(AppError):
    status_code = 402
    code = "tutoring_limit"
    message = "Em đã dùng hết lượt nhận xét bài làm hôm nay."


@dataclass(frozen=True)
class SessionView:
    session: TutoringSession
    messages: list[TutoringMessage]
    solution: solve_service.SolutionView


async def _owned(session: AsyncSession, user_id: uuid.UUID, session_id: uuid.UUID) -> TutoringSession:
    found = await session.scalar(select(TutoringSession).where(TutoringSession.id == session_id,
                                                               TutoringSession.user_id == user_id))
    if found is None:
        raise NotFound("Không tìm thấy buổi học.")
    return found


async def _view(c: Container, session: AsyncSession, user_id: uuid.UUID, tutoring: TutoringSession) -> SessionView:
    messages = list(await session.scalars(select(TutoringMessage).where(TutoringMessage.session_id == tutoring.id)
                                          .order_by(TutoringMessage.created_at)))
    return SessionView(tutoring, messages, await solve_service.solution_view(c, session, user_id,
                                                                             tutoring.question_id))


async def start_session(c: Container, session: AsyncSession, user_id: uuid.UUID, question_id: uuid.UUID
                        ) -> SessionView:
    """Open (or resume) the session for the question's current solution."""
    solution, _ = await solve_service.get_solution(session, user_id, question_id)
    if solution.status != "done" or not (solution.result or {}).get("solution", {}).get("solved"):
        raise Conflict("Hãy giải bài trước khi bắt đầu luyện tập với gợi ý.", code="solution_not_ready")
    existing = await session.scalar(select(TutoringSession).where(
        TutoringSession.user_id == user_id, TutoringSession.question_id == question_id,
        TutoringSession.solution_id == solution.id))
    if existing is None:
        existing = TutoringSession(user_id=user_id, question_id=question_id, solution_id=solution.id)
        session.add(existing)
        await session.commit()
        await session.refresh(existing)
    return await _view(c, session, user_id, existing)


async def get_session_view(c: Container, session: AsyncSession, user_id: uuid.UUID, session_id: uuid.UUID
                           ) -> SessionView:
    return await _view(c, session, user_id, await _owned(session, user_id, session_id))


async def session_hint(c: Container, session: AsyncSession, user_id: uuid.UUID, session_id: uuid.UUID
                       ) -> SessionView:
    tutoring = await _owned(session, user_id, session_id)
    await solve_service.reveal_next_hint(c, session, user_id, tutoring.question_id)
    return await _view(c, session, user_id, tutoring)


async def read_work_photo(c: Container, session: AsyncSession, user_id: uuid.UUID, session_id: uuid.UUID,
                          data: bytes) -> WorkReading:
    """Transcribe a photo/scan of the student's notebook into a draft for the work box (nothing is submitted)."""
    tutoring = await _owned(session, user_id, session_id)
    decision = await tutoring_turn_decision(session, c.settings, user_id)
    if not decision.allowed:  # no point reading work that cannot be sent today
        raise TutoringLocked(decision.reason_vi)
    question = await session.get(Question, tutoring.question_id)
    if question is None:
        raise NotFound("Không tìm thấy câu hỏi.")
    return await read_work(c, user_id, solve_service.problem_text(question), data)


async def submit_work(c: Container, session: AsyncSession, user_id: uuid.UUID, session_id: uuid.UUID, work: str
                      ) -> SessionView:
    tutoring = await _owned(session, user_id, session_id)
    work = work.strip()
    if not work:
        raise AppError("Hãy nhập bài làm của em.", code="empty_work")
    if len(work) > MAX_WORK_CHARS:
        raise AppError(f"Bài làm dài quá {MAX_WORK_CHARS} ký tự.", code="work_too_long")
    if "\\unclear{" in work:
        raise AppError("Hãy sửa các chỗ được đánh dấu là đọc chưa chắc trước khi gửi.", code="unclear_work")
    decision = await tutoring_turn_decision(session, c.settings, user_id)
    if not decision.allowed:
        raise TutoringLocked(decision.reason_vi)
    if c.gateway is None:
        raise Conflict("Dịch vụ AI chưa được cấu hình.", code="solver_not_configured")

    solution_row = await session.get(Solution, tutoring.solution_id)
    question = await session.get(Question, tutoring.question_id)
    if solution_row is None or question is None:
        raise NotFound("Không tìm thấy lời giải của câu hỏi.")
    model_solution = ModelSolution.model_validate((solution_row.result or {})["solution"])
    hints = [Hint.model_validate(h) for h in solve_service.solution_hints(solution_row)]
    access = await session.scalar(select(SolutionAccess).where(SolutionAccess.user_id == user_id,
                                                               SolutionAccess.solution_id == solution_row.id))
    opened = access.hints_revealed if access else 0
    history = [m.content for m in await session.scalars(
        select(TutoringMessage).where(TutoringMessage.session_id == tutoring.id, TutoringMessage.role == "tutor")
        .order_by(TutoringMessage.created_at))]

    session.add(TutoringMessage(session_id=tutoring.id, role="student", content=work))
    await session.commit()
    result = await analyze_work(
        c.gateway, CallContext("tutoring", user_id, None), load_policy(), problem=solve_service.problem_text(question),
        solution=model_solution, topics=list(question.topics), work=work, history=history,
        hints_seen=hints[:opened], unseen_hints=hints[opened:],
        solution_revealed=bool(access and access.solution_revealed_at))
    feedback = result.feedback
    session.add(TutoringMessage(session_id=tutoring.id, role="tutor", content=feedback.next_hint_vi,
                                feedback={**feedback.model_dump(), "tool_checks": result.tool_checks,
                                          "hint_replaced": result.hint_replaced},
                                cost_sgd=result.cost_sgd))
    await session.commit()
    return await _view(c, session, user_id, tutoring)
