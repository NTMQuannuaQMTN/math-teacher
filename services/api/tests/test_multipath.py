"""Experimental multi-path reasoning, Phase 1: candidate generation (no selection, not used for students)."""

from __future__ import annotations

from decimal import Decimal
from typing import Any

import pytest
from pydantic import ValidationError

from app.agents.multipath import (
    APPROACHES,
    MultiPathConfig,
    _worst_case_cost,
    generate_candidates,
    plan,
)
from app.agents.orchestrator import SolveInput, SolveState
from app.config import Settings
from app.container import Container
from app.errors import BudgetExceeded
from app.providers.base import ProviderError
from app.providers.gateway import CallContext
from tests.conftest import ScriptedProvider
from tests.test_solving import FORMAL_REPLY, GOOD, orchestrator, solver_calls

PROBLEM = "Giải phương trình $x^2-5x+6=0$."


async def test_candidates_differ_in_method_and_temperature_and_reuse_the_single_solver_prompt(
        container: Container, provider: ScriptedProvider) -> None:
    provider.push(FORMAL_REPLY)
    for _ in range(3):
        provider.push(GOOD)
    outcome, batch = await orchestrator(container).generate_candidates(
        SolveInput(PROBLEM, ["algebra"], None), MultiPathConfig(concurrency=1))
    calls = solver_calls(provider)
    assert [c.temperature for c in calls] == [0.2, 0.7, 0.7]
    users = [str(c.messages[-1].content) for c in calls]
    assert "For THIS solution" not in users[0]  # candidate 1 is the single solver's own call
    assert "đặt ẩn phụ" in users[1] and "hằng đẳng thức" in users[2]
    assert all("never use a method outside the allowed list" in u for u in users[1:])
    assert len({str(c.messages[0].content) for c in calls}) == 1  # one system prompt, the solver's
    assert [c.thinking for c in calls] == [False, False, False]
    assert [(c.id, c.approach, c.status) for c in batch.candidates] == [
        ("c1", "standard", "ok"), ("c2", "substitution", "ok"), ("c3", "identities", "ok")]
    assert batch.cost_sgd > 0 and outcome.cost_sgd >= batch.cost_sgd
    assert all(c.prompt_tokens > 0 and c.completion_tokens > 0 for c in batch.candidates)
    entry = next(t for t in outcome.trace if t["state"] == SolveState.CANDIDATES.value)
    assert entry["usable"] == 3 and entry["candidates"][0]["answers"][0]["machine_answer"]["solutions"]
    assert outcome.best is None  # Phase 1 never selects a candidate


def test_count_is_capped_and_every_topic_has_distinct_methods() -> None:
    assert MultiPathConfig(candidate_count=9).count == 5
    assert MultiPathConfig(candidate_count=9, max_candidate_count=8).count == 8
    assert len(plan(["geometry"], 8)) == 8
    with pytest.raises(ValidationError):
        MultiPathConfig(candidate_count=0)
    for topic, approaches in APPROACHES.items():
        names = [name for name, _ in approaches]
        assert names[0] == "standard" and approaches[0][1] is None and len(set(names)) == len(names), topic
        assert [c.approach for c in plan([topic], 3)] == names[:3]
    assert plan(["number_theory", "algebra"], 2)[1].approach == "residues"  # the main topic decides
    assert plan([], 2)[1].approach == "substitution"  # unknown topic: algebra's methods


async def test_an_unusable_or_failed_candidate_does_not_stop_the_others(
        container: Container, provider: ScriptedProvider) -> None:
    provider.push(FORMAL_REPLY)
    provider.push(GOOD)
    provider.push("garbage")
    provider.push("garbage")  # the gateway's one JSON repair round
    provider.push(ProviderError("timeout", "slow"))
    _, batch = await orchestrator(container).generate_candidates(
        SolveInput(PROBLEM, ["algebra"], None), MultiPathConfig(concurrency=1))
    assert [c.status for c in batch.candidates] == ["ok", "invalid_output", "failed"]
    assert batch.candidates[1].cost_sgd > 0  # an unusable reply is still paid for and counted
    assert [c.error_code for c in batch.candidates][1:] == ["invalid_model_output", "model_call_failed"]
    assert len(batch.usable) == 1


async def test_the_question_cap_counts_calls_in_flight_at_their_worst_case(
        container: Container, provider: ScriptedProvider) -> None:
    assert container.gateway is not None
    worst = _worst_case_cost(container.gateway, "reasoning", 8000, False)
    assert worst > 0
    provider.push(FORMAL_REPLY)
    provider.default = None
    for _ in range(3):
        provider.push(GOOD)
    provider.delay = 0.05  # candidate 1 is still running when the others are considered
    _, batch = await orchestrator(container).generate_candidates(
        SolveInput(PROBLEM, ["algebra"], None), MultiPathConfig(concurrency=3, max_cost_sgd=worst * Decimal("1.5")))
    assert [c.status for c in batch.candidates] == ["ok", "skipped_budget", "skipped_budget"]
    assert len(solver_calls(provider)) == 1 and batch.stopped == "budget"
    provider.replies.clear()
    provider.push(FORMAL_REPLY)
    _, nothing = await orchestrator(container).generate_candidates(
        SolveInput(PROBLEM, ["algebra"], None), MultiPathConfig(max_cost_sgd=worst / 2))
    assert {c.status for c in nothing.candidates} == {"skipped_budget"} and nothing.cost_sgd == 0


async def test_the_batch_deadline_bounds_the_wall_clock(container: Container, provider: ScriptedProvider) -> None:
    provider.push(FORMAL_REPLY)
    for _ in range(3):
        provider.push(GOOD)
    provider.delay = 0.6
    _, batch = await orchestrator(container).generate_candidates(
        SolveInput(PROBLEM, ["algebra"], None), MultiPathConfig(concurrency=1, deadline_seconds=1.8))
    statuses = [c.status for c in batch.candidates]
    assert statuses[0] == "ok" and statuses[-1] == "skipped_deadline" and batch.stopped == "deadline"
    assert batch.elapsed_ms < 3000


async def test_a_daily_budget_refusal_stops_the_batch(container: Container) -> None:
    assert container.gateway is not None
    real = container.gateway
    calls: list[float] = []

    class Refusing:
        catalog, settings = real.catalog, real.settings

        async def structured(self, **kwargs: Any) -> Any:
            calls.append(kwargs["temperature"])
            raise BudgetExceeded()

    batch = await generate_candidates(Refusing(), CallContext("solve", None, None),  # type: ignore[arg-type]
                                      problem=PROBLEM, system="sys", topics=["algebra"], tier="reasoning",
                                      config=MultiPathConfig(concurrency=1))
    assert len(calls) == 1 and batch.stopped == "daily_budget"
    assert [c.status for c in batch.candidates] == ["skipped_budget"] * 3
    assert batch.candidates[0].error_code == "budget_exceeded"


def test_the_mode_cannot_be_switched_on_before_verification_exists() -> None:
    assert Settings().reasoning_mode == "single"
    with pytest.raises(ValidationError, match="Phase 2"):
        Settings(reasoning_mode="multi_path_verified")
    config = MultiPathConfig.from_settings(Settings(), concurrency=1)
    assert config.count == 3 and config.max_cost_sgd == Decimal("0.30") and config.concurrency == 1


def test_diagnostics_hold_answers_and_usage_but_no_steps() -> None:
    batch_candidate = plan(["algebra"], 1)[0]
    keys = set(batch_candidate.diagnostics())
    assert keys == {"id", "approach", "temperature", "status", "answers", "cost_sgd", "calls", "prompt_tokens",
                    "completion_tokens", "latency_ms", "error_code"}


async def test_an_unexpected_error_fails_only_that_candidate(container: Container) -> None:
    assert container.gateway is not None
    real = container.gateway
    seen: list[float] = []

    class Flaky:
        catalog, settings = real.catalog, real.settings

        async def structured(self, **kwargs: Any) -> Any:
            seen.append(kwargs["temperature"])
            if len(seen) == 2:
                raise RuntimeError("unexpected")
            return await real.structured(**kwargs)

    provider = real.provider
    assert isinstance(provider, ScriptedProvider)
    provider.push(GOOD)
    provider.push(GOOD)
    batch = await generate_candidates(Flaky(), CallContext("solve", None, None),  # type: ignore[arg-type]
                                      problem=PROBLEM, system="sys", topics=["algebra"], tier="reasoning",
                                      config=MultiPathConfig(concurrency=1))
    assert [c.status for c in batch.candidates] == ["ok", "failed", "ok"]
    assert batch.candidates[1].error_code == "RuntimeError"
