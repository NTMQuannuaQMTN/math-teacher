"""The single decision point for what a student may open. Monetization plugs in here.

Today: hints are free and the full solution is free once the student has opened the required hints. A paid plan
would change `solution_reveal_decision` only (e.g. check a subscription or a credit balance) — the API already
withholds steps and answers until this decision allows the reveal.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import Settings
from ..models import Solution, SolutionAccess, TutoringMessage, TutoringSession


@dataclass(frozen=True)
class Decision:
    allowed: bool
    grant: str | None = None  # recorded on the access row, e.g. "free"
    reason_vi: str | None = None


def hints_required(settings: Settings, hints_total: int) -> int:
    return min(settings.min_hints_before_solution, hints_total) if settings.hints_before_solution else 0


async def solution_reveal_decision(session: AsyncSession, settings: Settings, user_id: uuid.UUID,
                                   solution: Solution, access: SolutionAccess | None, hints_total: int) -> Decision:
    del session, user_id  # reserved for plan / credit lookups
    if solution.status != "done":
        return Decision(False, reason_vi="Lời giải chưa sẵn sàng.")
    required = hints_required(settings, hints_total)
    opened = access.hints_revealed if access else 0
    if opened < required:
        return Decision(False, reason_vi=f"Hãy thử xem ít nhất {required} gợi ý trước khi xem lời giải.")
    return Decision(True, grant="free")


async def tutoring_turn_decision(session: AsyncSession, settings: Settings, user_id: uuid.UUID) -> Decision:
    """May this student get another feedback turn today? (Plan-specific limits plug in here.)"""
    since = datetime.now(UTC) - timedelta(days=1)
    used = await session.scalar(
        select(func.count()).select_from(TutoringMessage).join(
            TutoringSession, TutoringSession.id == TutoringMessage.session_id).where(
            TutoringSession.user_id == user_id, TutoringMessage.role == "tutor",
            TutoringMessage.created_at >= since)) or 0
    if used >= settings.tutoring_turns_per_day:
        return Decision(False, reason_vi="Em đã dùng hết lượt nhận xét bài làm hôm nay. Hãy quay lại vào ngày mai.")
    return Decision(True, grant="free")
