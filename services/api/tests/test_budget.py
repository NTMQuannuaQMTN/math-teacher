from __future__ import annotations

import asyncio
import uuid
from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st
from sqlalchemy import select, update

from app.billing.budget import BudgetRestricted, BudgetState, UserBudgetExceeded
from app.container import Container
from app.errors import BudgetExceeded
from app.models import DailyBudget, LlmCall, User


async def make_user(c: Container) -> uuid.UUID:
    async with c.db.sessionmaker() as session:
        user = User(kind="guest")
        session.add(user)
        await session.commit()
        return user.id


async def reserve(c: Container, amount: str, user: uuid.UUID | None = None, tier: str = "fast"):  # type: ignore[no-untyped-def]
    return await c.budget.reserve(amount_sgd=Decimal(amount), purpose="test", provider="soclaas", model="m",
                                  tier=tier, user_id=user)


async def test_states_follow_thresholds(container: Container) -> None:
    b = container.budget
    assert b.state_for(Decimal("6.99")) == BudgetState.NORMAL
    assert b.state_for(Decimal("7.00")) == BudgetState.WARNING
    assert b.state_for(Decimal("9.00")) == BudgetState.RESTRICTED
    assert b.state_for(Decimal("10.00")) == BudgetState.BLOCKED


async def test_reserve_settle_reconciles_actual_cost(container: Container) -> None:
    r = await reserve(container, "2.000000")
    status = await container.budget.status()
    assert status.reserved_sgd == Decimal("2") and status.spent_sgd == 0
    charged = await container.budget.settle(r, actual_sgd=Decimal("0.25"), prompt_tokens=10, completion_tokens=5,
                                            latency_ms=3, outcome="ok")
    assert charged == Decimal("0.25")
    status = await container.budget.status()
    assert status.reserved_sgd == 0 and status.spent_sgd == Decimal("0.25")


async def test_unknown_actual_cost_charges_full_reservation(container: Container) -> None:
    r = await reserve(container, "1.5")
    await container.budget.settle(r, actual_sgd=None, prompt_tokens=None, completion_tokens=None, latency_ms=None,
                                  outcome="ok")
    assert (await container.budget.status()).spent_sgd == Decimal("1.5")


async def test_release_returns_reservation(container: Container) -> None:
    r = await reserve(container, "3")
    await container.budget.release(r, outcome="provider_connection")
    status = await container.budget.status()
    assert status.reserved_sgd == 0 and status.spent_sgd == 0


async def test_double_settle_is_idempotent(container: Container) -> None:
    r = await reserve(container, "1")
    for _ in range(2):
        await container.budget.settle(r, actual_sgd=Decimal("1"), prompt_tokens=1, completion_tokens=1,
                                      latency_ms=1, outcome="ok")
    assert (await container.budget.status()).spent_sgd == Decimal("1")


async def test_hard_ceiling_blocks(container: Container) -> None:
    await reserve(container, "9.5")
    with pytest.raises(BudgetExceeded):
        await reserve(container, "0.6")
    await reserve(container, "0.5")  # exactly reaches the ceiling
    assert (await container.budget.status()).state == BudgetState.BLOCKED
    with pytest.raises(BudgetExceeded):
        await reserve(container, "0.000001")


async def test_zero_cost_calls_allowed_when_blocked(container: Container) -> None:
    await reserve(container, "10")
    r = await reserve(container, "0")
    assert r.amount_sgd == 0


async def test_restricted_mode_blocks_reasoning_tier_only(container: Container) -> None:
    await reserve(container, "9.1")
    with pytest.raises(BudgetRestricted):
        await reserve(container, "0.1", tier="reasoning")
    await reserve(container, "0.1", tier="fast")
    await reserve(container, "0.1", tier="ocr")


async def test_per_user_cap(container: Container) -> None:
    user = await make_user(container)
    await reserve(container, "4.5", user=user)
    with pytest.raises(UserBudgetExceeded):
        await reserve(container, "0.6", user=user)
    other = await make_user(container)
    await reserve(container, "0.6", user=other)


async def test_concurrent_reservations_never_exceed_ceiling(container: Container) -> None:
    """50 concurrent reservations of 0.37 against a 10.00 ceiling: exactly 27 succeed."""
    results = await asyncio.gather(*(reserve(container, "0.37") for _ in range(50)), return_exceptions=True)
    granted = [r for r in results if not isinstance(r, BaseException)]
    errors = [r for r in results if isinstance(r, BaseException)]
    assert all(isinstance(e, BudgetExceeded) for e in errors), errors
    assert len(granted) == 27
    status = await container.budget.status()
    assert status.reserved_sgd == Decimal("0.37") * 27
    assert status.reserved_sgd + status.spent_sgd <= Decimal("10")


async def test_concurrent_same_user_respects_user_cap(container: Container) -> None:
    user = await make_user(container)
    results = await asyncio.gather(*(reserve(container, "1", user=user) for _ in range(12)), return_exceptions=True)
    assert sum(not isinstance(r, BaseException) for r in results) == 5


async def test_stale_reservations_expire_at_full_cost(container: Container) -> None:
    r = await reserve(container, "2")
    async with container.db.sessionmaker() as session:
        await session.execute(update(LlmCall).where(LlmCall.id == r.id)
                              .values(created_at=datetime.now(UTC) - timedelta(hours=2)))
        await session.commit()
    assert await container.budget.expire_stale() == 1
    status = await container.budget.status()
    assert status.reserved_sgd == 0 and status.spent_sgd == Decimal("2")
    async with container.db.sessionmaker() as session:
        call = await session.get(LlmCall, r.id)
        assert call is not None and call.status == "expired"


async def test_settlement_applies_to_reservation_day(container: Container) -> None:
    r = await reserve(container, "1")
    yesterday = r.day - timedelta(days=1)
    async with container.db.sessionmaker() as session:
        session.add(DailyBudget(day=yesterday, ceiling_sgd=Decimal(10), reserved_sgd=Decimal(0), spent_sgd=Decimal(0)))
        await session.commit()
    await container.budget.settle(r, actual_sgd=Decimal("0.5"), prompt_tokens=1, completion_tokens=1,
                                  latency_ms=1, outcome="ok")
    async with container.db.sessionmaker() as session:
        days = {d.day: d for d in (await session.scalars(select(DailyBudget))).all()}
    assert days[r.day].spent_sgd == Decimal("0.5")
    assert days[yesterday].spent_sgd == 0


@settings(max_examples=25, deadline=None, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(ops=st.lists(st.tuples(st.sampled_from(["reserve", "settle", "release"]),
                              st.decimals(min_value=0, max_value=4, places=2)), min_size=1, max_size=25))
async def test_random_operation_sequences_keep_invariant(container: Container, ops) -> None:  # type: ignore[no-untyped-def]
    async with container.db.engine.begin() as conn:
        from sqlalchemy import text
        await conn.execute(text("TRUNCATE daily_budgets, llm_calls"))
    open_reservations = []
    expected_spent = Decimal(0)
    for op, amount in ops:
        if op == "reserve":
            try:
                open_reservations.append(await reserve(container, str(amount)))
            except BudgetExceeded:
                pass
        elif open_reservations:
            r = open_reservations.pop(0)
            if op == "settle":
                actual = min(amount, r.amount_sgd)
                await container.budget.settle(r, actual_sgd=actual, prompt_tokens=1, completion_tokens=1,
                                              latency_ms=1, outcome="ok")
                expected_spent += actual
            else:
                await container.budget.release(r, outcome="test")
        status = await container.budget.status()
        assert status.spent_sgd + status.reserved_sgd <= status.ceiling_sgd
        assert status.spent_sgd == expected_spent
        assert status.reserved_sgd == sum((r.amount_sgd for r in open_reservations), Decimal(0))
