"""Experimental multi-path solving (`reasoning_mode = "multi_path_verified"`), Phase 1: candidate generation.

Inspired by NVIDIA's AIMO-2 winning NemoSkills system (arXiv 2504.16891): several independent solutions per problem,
then an answer chosen across them. What we can reproduce on a hosted API is the inference side (independent samples,
answer comparison, early stopping); their fine-tuned model, tool-integrated reasoning and TensorRT-LLM serving are
not available to us. See docs/experiments/multipath-phase1.md.

This module only GENERATES candidates. Nothing here selects or shows a candidate to a student: agreement between
candidates is not proof (several samples can make the same mistake), so selection waits for independent
verification (Phase 2). Each candidate is a normal solver call with
- its own temperature (the first one keeps the single solver's 0.2, the others sample more freely), and
- its own method direction for the problem's main topic, so the candidates differ in method, not just in wording.
The first candidate has no direction: it is the single solver's call, so the baseline is always among them.

Cost and time are bounded before anything starts: a candidate cap, a per-question SGD cap checked before each call
(spent + in flight + this call's worst case), a per-call timeout, a deadline for the whole batch, and a stop on the
first daily/user budget refusal. No retries beyond the gateway's own.
"""

from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any, Literal

from pydantic import BaseModel, Field

from ..billing.budget import BudgetRestricted, UserBudgetExceeded
from ..errors import BudgetExceeded
from ..providers.base import ChatMessage
from ..providers.catalog import ModelNotConfigured, Tier, cost_sgd
from ..providers.gateway import CallContext, InvalidModelOutput, LLMGateway, ModelCallFailed
from ..solvers import prompts
from ..solvers.schemas import ModelSolution

logger = logging.getLogger(__name__)

ReasoningMode = Literal["single", "multi_path_verified"]
CandidateStatus = Literal["ok", "unsolved", "invalid_output", "failed", "skipped_budget", "skipped_deadline"]

# Method directions per main topic. The first entry of every list is the single solver's own call (no direction).
# Every direction stays inside the Grade 9 programme and says so: a direction never licenses a forbidden method.
_ANY = ("If that method does not fit this problem, use another correct method from the allowed list instead; "
        "never force it, and never use a method outside the allowed list.")
APPROACHES: dict[str, list[tuple[str, str | None]]] = {
    "algebra": [
        ("standard", None),
        ("substitution", "đặt ẩn phụ, or symmetric sums with Vi-ét, to reduce the problem to a simpler one"),
        ("identities", "hằng đẳng thức and factorisation first, or a sum of squares / AM-GM estimate"),
        ("cases", "a careful case split on signs, the domain (ĐKXĐ) or the size of the variables"),
        ("graph", "the Grade 9 graph view (parabola y = ax^2 and lines) or a monotonicity/bounding argument"),
    ],
    "number_theory": [
        ("standard", None),
        ("residues", "residues modulo a well-chosen number, written as ONE table of cases"),
        ("factorisation", "factorisation and divisibility (gcd, prime factors, a \\vdots b)"),
        ("bounding", "inequalities that bound the unknowns to finitely many cases, then check each case"),
        ("parity", "parity, or a proof by contradiction / smallest counterexample"),
    ],
    "combinatorics": [
        ("standard", None),
        ("cases", "direct counting split into disjoint cases"),
        ("complement", "complementary counting or a one-to-one correspondence"),
        ("extremal", "an invariant, the extremal principle or the pigeonhole principle (nguyên lý Dirichlet)"),
        ("small_cases", "small cases first, then a general argument that covers every case"),
    ],
    "geometry": [
        ("standard", None),
        ("angles", "angle chasing with cyclic quadrilaterals (tứ giác nội tiếp) and inscribed angles"),
        ("similarity", "similar triangles and ratios (Ta-lét), including power-of-a-point style ratios proved "
                       "with similar triangles"),
        ("construction", "one auxiliary construction (a midpoint, a parallel line, a reflection, a diameter)"),
        ("metric", "metric relations: Py-ta-go, the relations in a right triangle, lengths and areas"),
    ],
}
TEMPERATURES = (0.2, 0.7, 0.7, 0.8, 0.8)


def directive(approach: str | None) -> str:
    if approach is None:
        return ""
    return (f"\n\nFor THIS solution, use a different method from the most common textbook one: prefer {approach}. "
            f"{_ANY}")


class MultiPathConfig(BaseModel):
    """Per-run limits. Costs are in SGD: the budget ledger's currency (≈ USD × the configured FX rate)."""

    candidate_count: int = Field(default=3, ge=1)
    max_candidate_count: int = Field(default=5, ge=1, le=8)
    concurrency: int = Field(default=2, ge=1, le=5)
    max_cost_sgd: Decimal = Field(default=Decimal("0.30"), gt=0)
    max_tokens: int = Field(default=8000, ge=500, le=24000)
    thinking: bool = False
    timeout_seconds: float | None = Field(default=None, gt=0, description="Per candidate call; None = solver's.")
    deadline_seconds: float = Field(default=1800, gt=0, description="For the whole batch.")

    @property
    def count(self) -> int:
        return min(self.candidate_count, self.max_candidate_count)

    @classmethod
    def from_settings(cls, settings: Any, **overrides: Any) -> MultiPathConfig:
        values: dict[str, Any] = {
            "candidate_count": settings.multipath_candidate_count,
            "max_candidate_count": settings.multipath_max_candidate_count,
            "concurrency": settings.multipath_concurrency, "max_cost_sgd": settings.multipath_max_cost_sgd,
            "timeout_seconds": settings.solve_call_timeout_seconds}
        return cls(**{**values, **overrides})


@dataclass
class Candidate:
    id: str
    approach: str
    temperature: float
    status: CandidateStatus = "skipped_deadline"
    solution: ModelSolution | None = None
    cost_sgd: Decimal = Decimal(0)
    calls: int = 0
    prompt_tokens: int = 0
    completion_tokens: int = 0
    latency_ms: int = 0
    error_code: str | None = None

    def diagnostics(self) -> dict[str, Any]:
        """For logs and the experiment report: final answers and usage only (the model's hidden reasoning is never
        kept by the gateway; the steps stay in `solution`)."""
        answers = [{"part": p.label, "answer_kind": p.answer_kind, "machine_answer": p.machine_answer.model_dump()}
                   for p in self.solution.parts] if self.solution else []
        return {"id": self.id, "approach": self.approach, "temperature": self.temperature, "status": self.status,
                "answers": answers, "cost_sgd": str(self.cost_sgd), "calls": self.calls,
                "prompt_tokens": self.prompt_tokens, "completion_tokens": self.completion_tokens,
                "latency_ms": self.latency_ms, "error_code": self.error_code}


@dataclass
class CandidateBatch:
    candidates: list[Candidate]
    config: MultiPathConfig
    elapsed_ms: int = 0
    stopped: str | None = None  # why later candidates were not started ("budget", "deadline", "daily_budget")
    extra: dict[str, Any] = field(default_factory=dict)

    @property
    def cost_sgd(self) -> Decimal:
        return sum((c.cost_sgd for c in self.candidates), Decimal(0))

    @property
    def usable(self) -> list[Candidate]:
        return [c for c in self.candidates if c.status == "ok"]

    def diagnostics(self) -> dict[str, Any]:
        return {"mode": "multi_path_verified", "phase": 1, "requested": self.config.candidate_count,
                "generated": self.config.count, "usable": len(self.usable), "stopped": self.stopped,
                "elapsed_ms": self.elapsed_ms, "cost_sgd": str(self.cost_sgd),
                "prompt_tokens": sum(c.prompt_tokens for c in self.candidates),
                "completion_tokens": sum(c.completion_tokens for c in self.candidates),
                "candidates": [c.diagnostics() for c in self.candidates]}


def plan(topics: list[str], count: int) -> list[Candidate]:
    """The candidates to generate: distinct method directions for the main topic, then distinct temperatures."""
    main = next((t for t in topics if t in APPROACHES), "algebra")
    approaches = APPROACHES[main]
    return [Candidate(id=f"c{i + 1}", approach=approaches[i % len(approaches)][0],
                      temperature=TEMPERATURES[i % len(TEMPERATURES)]) for i in range(count)]


def _worst_case_cost(gateway: LLMGateway, tier: Tier, max_tokens: int, thinking: bool) -> Decimal:
    """Upper bound of one candidate call (a ~4k-token prompt and the whole output allowance)."""
    spec = gateway.catalog.for_tier(tier)
    output = (spec.thinking_max_output_tokens or spec.max_output_tokens) if thinking else \
        min(max_tokens, spec.max_output_tokens)
    try:
        return cost_sgd(spec, 4000, output, gateway.settings.fx_usd_to_sgd)
    except ModelNotConfigured:
        return Decimal(0)


async def generate_candidates(gateway: LLMGateway, ctx: CallContext, *, problem: str, system: str,
                              topics: list[str], tier: Tier, config: MultiPathConfig,
                              timeout_seconds: float | None = None) -> CandidateBatch:
    candidates = plan(topics, config.count)
    main = next((t for t in topics if t in APPROACHES), "algebra")
    directions = dict(APPROACHES[main])
    batch = CandidateBatch(candidates, config)
    started = time.monotonic()
    worst = _worst_case_cost(gateway, tier, config.max_tokens, config.thinking)
    gate = asyncio.Semaphore(config.concurrency)
    lock = asyncio.Lock()
    in_flight: dict[str, Decimal] = {}

    async def run(candidate: Candidate) -> None:
        async with gate:
            async with lock:  # the budget check and the reservation of this call's worst case are one step
                remaining = config.deadline_seconds - (time.monotonic() - started)
                if batch.stopped:
                    candidate.status = "skipped_budget" if "budget" in batch.stopped else "skipped_deadline"
                    return
                if remaining <= 1:
                    candidate.status, batch.stopped = "skipped_deadline", "deadline"
                    return
                committed = sum((c.cost_sgd for c in candidates), Decimal(0)) + sum(in_flight.values(), Decimal(0))
                if committed + worst > config.max_cost_sgd:
                    candidate.status = "skipped_budget"
                    return
                in_flight[candidate.id] = worst
            call_started = time.monotonic()
            timeout = min(timeout_seconds or remaining, remaining)
            messages = [ChatMessage(role="system", content=system),
                        ChatMessage(role="user", content=prompts.solve_user(problem)
                                    + directive(directions.get(candidate.approach)))]
            try:
                result = await gateway.structured(
                    tier=tier, ctx=ctx, output=ModelSolution, max_tokens=config.max_tokens, schema_name="solution",
                    messages=messages, temperature=candidate.temperature, thinking=config.thinking,
                    timeout_seconds=timeout, max_retries=0)
            except (BudgetExceeded, BudgetRestricted, UserBudgetExceeded) as exc:
                candidate.status, candidate.error_code = "skipped_budget", getattr(exc, "code", "budget")
                batch.stopped = "daily_budget"
            except InvalidModelOutput as exc:
                candidate.status, candidate.error_code, candidate.cost_sgd = "invalid_output", exc.code, exc.cost_sgd
            except ModelCallFailed as exc:
                candidate.status, candidate.error_code, candidate.cost_sgd = "failed", exc.code, exc.cost_sgd
            except Exception as exc:  # one broken candidate must not abort the batch and orphan the others
                logger.exception("multipath_candidate_error", extra={"candidate": candidate.id})
                candidate.status, candidate.error_code = "failed", type(exc).__name__
            else:
                candidate.solution, candidate.cost_sgd, candidate.calls = result.value, result.cost_sgd, result.calls
                candidate.prompt_tokens, candidate.completion_tokens = result.prompt_tokens, result.completion_tokens
                candidate.status = "ok" if result.value.solved else "unsolved"
            finally:
                candidate.latency_ms = int((time.monotonic() - call_started) * 1000)
                in_flight.pop(candidate.id, None)

    await asyncio.gather(*(run(c) for c in candidates))
    batch.elapsed_ms = int((time.monotonic() - started) * 1000)
    if batch.stopped is None and any(c.status == "skipped_budget" for c in candidates):
        batch.stopped = "budget"
    return batch
