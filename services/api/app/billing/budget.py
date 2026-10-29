"""Daily spending ceiling with atomic reservations.

Invariant: for every day, spent + reserved <= ceiling at the moment any reservation is granted.
Reservations are worst-case estimates (input estimate + max_tokens); settlement records the actual
cost reported by the provider. Unknown actual cost is charged at the reserved amount.
"""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from enum import StrEnum
from zoneinfo import ZoneInfo

import httpx
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from ..config import Settings
from ..errors import AppError, BudgetExceeded
from ..models import DailyBudget, LlmCall

logger = logging.getLogger(__name__)


class BudgetState(StrEnum):
    NORMAL = "normal"
    WARNING = "warning"
    RESTRICTED = "restricted"
    BLOCKED = "blocked"


class BudgetRestricted(AppError):
    status_code = 402
    code = "budget_restricted"
    message = ("Hệ thống đang ở chế độ tiết kiệm ngân sách. Tác vụ suy luận nâng cao tạm dừng đến hết hôm nay.")


class UserBudgetExceeded(AppError):
    status_code = 402
    code = "user_budget_exceeded"
    message = "Bạn đã dùng hết hạn mức AI hôm nay. Hãy quay lại vào ngày mai."


@dataclass(frozen=True)
class BudgetStatus:
    day: date
    ceiling_sgd: Decimal
    spent_sgd: Decimal
    reserved_sgd: Decimal
    state: BudgetState
    warning_sgd: Decimal
    restricted_sgd: Decimal

    @property
    def committed_or_reserved(self) -> Decimal:
        return self.spent_sgd + self.reserved_sgd


@dataclass(frozen=True)
class Reservation:
    id: uuid.UUID
    day: date
    amount_sgd: Decimal
    state_after: BudgetState


_ENSURE_DAY = text(
    "INSERT INTO daily_budgets (day, ceiling_sgd, reserved_sgd, spent_sgd) VALUES (:day, :ceiling, 0, 0) "
    "ON CONFLICT (day) DO NOTHING"
)
_RESERVE = text(
    """
    UPDATE daily_budgets SET reserved_sgd = reserved_sgd + :amount
    WHERE day = :day AND spent_sgd + reserved_sgd + :amount <= ceiling_sgd
    RETURNING spent_sgd, reserved_sgd, ceiling_sgd
    """
)
_SETTLE = text(
    """
    UPDATE daily_budgets
    SET reserved_sgd = GREATEST(reserved_sgd - :reserved, 0), spent_sgd = spent_sgd + :actual
    WHERE day = :day
    """
)
_MARK_SETTLED = text(
    """
    UPDATE llm_calls SET status = :status, actual_sgd = :actual, prompt_tokens = :pt, completion_tokens = :ct,
        usage_reported = :usage_reported, latency_ms = :latency, outcome = :outcome, settled_at = now()
    WHERE id = :id AND status = 'reserved'
    RETURNING day, reserved_sgd
    """
)


async def notify_budget_state(settings: Settings, state: BudgetState, day: date) -> None:
    """Best-effort alert to an operator webhook (never blocks or fails the request)."""
    if settings.alert_webhook_url is None or state == BudgetState.NORMAL:
        return
    text = {BudgetState.WARNING: "⚠️ Ngân sách AI đã vượt mức cảnh báo",
            BudgetState.RESTRICTED: "🟠 Ngân sách AI: chế độ tiết kiệm (chỉ mô hình nhanh)",
            BudgetState.BLOCKED: "🔴 Ngân sách AI hôm nay đã hết: các yêu cầu AI bị chặn"}[state]
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            await client.post(settings.alert_webhook_url.get_secret_value(),
                              json={"text": f"{text} ({day}, trần SGD {settings.daily_budget_sgd})."})
    except httpx.HTTPError as exc:
        logger.warning("alert_webhook_failed", extra={"error_type": type(exc).__name__})


class BudgetService:
    def __init__(self, settings: Settings, sessionmaker: async_sessionmaker[AsyncSession]) -> None:
        self.settings = settings
        self.sessionmaker = sessionmaker
        self.tz = ZoneInfo(settings.budget_timezone)

    def today(self, now: datetime | None = None) -> date:
        return (now or datetime.now(UTC)).astimezone(self.tz).date()

    def state_for(self, total: Decimal) -> BudgetState:
        s = self.settings
        if total >= s.daily_budget_sgd:
            return BudgetState.BLOCKED
        if total >= s.restricted_budget_sgd:
            return BudgetState.RESTRICTED
        if total >= s.warning_budget_sgd:
            return BudgetState.WARNING
        return BudgetState.NORMAL

    async def status(self, day: date | None = None) -> BudgetStatus:
        day = day or self.today()
        async with self.sessionmaker() as session:
            row = await session.get(DailyBudget, day)
        ceiling = row.ceiling_sgd if row else self.settings.daily_budget_sgd
        spent = row.spent_sgd if row else Decimal(0)
        reserved = row.reserved_sgd if row else Decimal(0)
        return BudgetStatus(day=day, ceiling_sgd=ceiling, spent_sgd=spent, reserved_sgd=reserved,
                            state=self.state_for(spent + reserved), warning_sgd=self.settings.warning_budget_sgd,
                            restricted_sgd=self.settings.restricted_budget_sgd)

    async def user_total(self, session: AsyncSession, user_id: uuid.UUID, day: date) -> Decimal:
        total = await session.scalar(
            select(func.coalesce(func.sum(func.coalesce(LlmCall.actual_sgd, LlmCall.reserved_sgd)), 0)).where(
                LlmCall.user_id == user_id, LlmCall.day == day, LlmCall.status.in_(("reserved", "committed",
                                                                                     "expired"))
            )
        )
        return Decimal(total or 0)

    async def reserve(self, *, amount_sgd: Decimal, purpose: str, provider: str, model: str, tier: str,
                      user_id: uuid.UUID | None, job_id: uuid.UUID | None = None,
                      request_id: str | None = None) -> Reservation:
        if amount_sgd < 0:
            raise ValueError("Reservation amount must be non-negative")
        day = self.today()
        settings = self.settings
        async with self.sessionmaker() as session, session.begin():
            await session.execute(_ENSURE_DAY, {"day": day, "ceiling": settings.daily_budget_sgd})
            if user_id is not None:
                # Serialise reservations per user so the per-user cap cannot be raced past.
                await session.execute(text("SELECT pg_advisory_xact_lock(hashtext(:k))"),
                                      {"k": f"budget:{user_id}:{day}"})
                if amount_sgd > 0 and (await self.user_total(session, user_id, day)) + amount_sgd > \
                        settings.per_user_daily_budget_sgd:
                    raise UserBudgetExceeded()
            current = await session.get(DailyBudget, day, with_for_update=False)
            assert current is not None
            total_before = current.spent_sgd + current.reserved_sgd
            state_before = self.state_for(total_before)
            if tier == "reasoning" and state_before in (BudgetState.RESTRICTED, BudgetState.BLOCKED):
                raise BudgetRestricted()
            if amount_sgd > 0:
                row = (await session.execute(_RESERVE, {"amount": amount_sgd, "day": day})).first()
                if row is None:
                    raise BudgetExceeded()
                total_after = Decimal(row.spent_sgd) + Decimal(row.reserved_sgd)
            else:
                total_after = total_before
            call = LlmCall(day=day, user_id=user_id, purpose=purpose, provider=provider, model=model,
                           status="reserved", reserved_sgd=amount_sgd, job_id=job_id, request_id=request_id)
            session.add(call)
            await session.flush()
            reservation = Reservation(id=call.id, day=day, amount_sgd=amount_sgd,
                                      state_after=self.state_for(total_after))
        if reservation.state_after != state_before:
            logger.warning("budget_state_changed", extra={"state": reservation.state_after.value,
                                                          "day": str(day)})
            await notify_budget_state(self.settings, reservation.state_after, day)
        return reservation

    async def settle(self, reservation: Reservation, *, actual_sgd: Decimal | None, prompt_tokens: int | None,
                     completion_tokens: int | None, latency_ms: int | None, outcome: str) -> Decimal:
        """Commit the actual cost. When the actual cost is unknown the full reservation is charged."""
        charged = reservation.amount_sgd if actual_sgd is None else actual_sgd
        if actual_sgd is not None and actual_sgd > reservation.amount_sgd:
            logger.warning("cost_exceeded_reservation", extra={"reservation_id": str(reservation.id),
                                                                "reserved": str(reservation.amount_sgd),
                                                                "actual": str(actual_sgd)})
        await self._finish(reservation.id, status="committed", actual=charged, pt=prompt_tokens,
                           ct=completion_tokens, usage_reported=actual_sgd is not None, latency=latency_ms,
                           outcome=outcome)
        return charged

    async def release(self, reservation: Reservation, outcome: str) -> None:
        """Release a reservation for a request the provider provably never received."""
        await self._finish(reservation.id, status="released", actual=Decimal(0), pt=None, ct=None,
                           usage_reported=None, latency=None, outcome=outcome)

    async def _finish(self, call_id: uuid.UUID, *, status: str, actual: Decimal, pt: int | None, ct: int | None,
                      usage_reported: bool | None, latency: int | None, outcome: str) -> None:
        async with self.sessionmaker() as session, session.begin():
            row = (await session.execute(_MARK_SETTLED, {
                "status": status, "actual": actual, "pt": pt, "ct": ct, "usage_reported": usage_reported,
                "latency": latency, "outcome": outcome, "id": call_id,
            })).first()
            if row is None:
                logger.warning("reservation_already_settled", extra={"reservation_id": str(call_id)})
                return
            await session.execute(_SETTLE, {"reserved": row.reserved_sgd, "actual": actual, "day": row.day})

    async def expire_stale(self) -> int:
        """Settle reservations left open by crashed processes at their full reserved amount."""
        cutoff = datetime.now(UTC) - timedelta(seconds=self.settings.reservation_ttl_seconds)
        async with self.sessionmaker() as session:
            ids = list((await session.scalars(
                select(LlmCall.id).where(LlmCall.status == "reserved", LlmCall.created_at < cutoff).limit(500)
            )).all())
        for call_id in ids:
            async with self.sessionmaker() as session, session.begin():
                row = (await session.execute(text(
                    "UPDATE llm_calls SET status='expired', actual_sgd=reserved_sgd, outcome='expired', "
                    "settled_at=now() WHERE id=:id AND status='reserved' RETURNING day, reserved_sgd"
                ), {"id": call_id})).first()
                if row is not None:
                    await session.execute(_SETTLE, {"reserved": row.reserved_sgd, "actual": row.reserved_sgd,
                                                    "day": row.day})
        if ids:
            logger.warning("reservations_expired", extra={"count": len(ids)})
        return len(ids)
