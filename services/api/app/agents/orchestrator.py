"""Solve orchestrator: an explicit state machine over typed stages.

CLASSIFY → FORMALIZE → SOLVE → VERIFY → CURRICULUM → (REVISE → VERIFY → CURRICULUM)* → DONE

- FORMALIZE (fast model) and SOLVE (reasoning model) are independent: the solver only learns the variable
  names, never the templates, so verification is not the solver grading itself.
- Every model call goes through the metered gateway (budget reservation, bounded retries).
- Revisions are bounded (`max_revisions`) and stop early when the per-question budget would be exceeded.
- The best attempt is kept: correctness first, then curriculum compliance, then fewer warnings.
"""

from __future__ import annotations

import logging
import time
import uuid
from dataclasses import dataclass, field
from decimal import Decimal
from enum import StrEnum
from typing import Any, Literal

from pydantic import BaseModel, Field

from ..billing.budget import BudgetRestricted, UserBudgetExceeded
from ..curriculum.policy import CurriculumReport, Policy, check_curriculum, load_policy
from ..errors import BudgetExceeded
from ..providers.base import ChatMessage
from ..providers.catalog import ModelNotConfigured, Tier, cost_sgd
from ..providers.gateway import CallContext, InvalidModelOutput, LLMGateway, ModelCallFailed
from ..solvers import prompts
from ..solvers.schemas import (
    EvidenceOut,
    Formalization,
    FormalizationReply,
    Hint,
    ModelSolution,
    PartVerdict,
    VerificationStatus,
)
from ..tools.sandbox import run_check
from ..tutoring.hints import generate_hints
from ..verification.verdict import (
    CheckRunner,
    drop_invalid_templates,
    inherit_geometry,
    template_errors,
    verify_solution,
)

logger = logging.getLogger(__name__)

TOPICS = ("algebra", "geometry", "number_theory", "combinatorics")
THINKING_CALL_SECONDS = 300  # typical duration of a reasoning escalation on SoCLaaS (measured 2026-10)
_RANK: dict[VerificationStatus, int] = {"INCORRECT": 0, "UNSOLVED": 1, "UNVERIFIED": 2, "PARTIALLY_VERIFIED": 3,
                                        "VERIFIED": 4}


class SolveState(StrEnum):
    CLASSIFY = "classify"
    FORMALIZE = "formalize"
    SOLVE = "solve"
    VERIFY = "verify"
    CURRICULUM = "curriculum"
    REVISE = "revise"
    HINTS = "hints"
    DONE = "done"
    FAILED = "failed"


class Classification(BaseModel):
    topics: list[Literal["algebra", "geometry", "number_theory", "combinatorics"]] = Field(min_length=1,
                                                                                          max_length=2)


@dataclass(frozen=True)
class SolveInput:
    problem_text: str
    topics: list[str]
    user_id: uuid.UUID | None
    job_id: uuid.UUID | None = None


@dataclass
class Attempt:
    solution: ModelSolution
    verdicts: list[PartVerdict]
    evidence: list[EvidenceOut]
    status: VerificationStatus
    curriculum: CurriculumReport | None

    def score(self) -> tuple[int, int, int]:
        compliant = 1 if self.curriculum is None or self.curriculum.compliant else 0
        warnings = -len(self.curriculum.findings) if self.curriculum else 0
        return (_RANK[self.status], compliant, warnings)


@dataclass
class SolveOutcome:
    state: SolveState
    topics: list[str]
    formalization: Formalization | None = None
    # Every geometry part as written (before invalid templates are dropped), for the figure only.
    drawing: Formalization | None = None
    best: Attempt | None = None
    attempts: int = 0
    cost_sgd: Decimal = Decimal(0)
    trace: list[dict[str, Any]] = field(default_factory=list)
    error_code: str | None = None
    error_message: str | None = None
    policy_version: str = ""
    hints: list[Hint] = field(default_factory=list)


def _templates(formalization: Formalization) -> int:
    return sum(p.template is not None for p in formalization.parts)


def solution_texts(solution: ModelSolution) -> list[str]:
    texts = [solution.approach_vi]
    for part in solution.parts:
        texts.extend(part.steps)
        texts.append(part.final_answer_latex)
    return texts


def revision_feedback(attempt: Attempt) -> list[str]:
    problems: list[str] = []
    for verdict in attempt.verdicts:
        label = f"Ý {verdict.label}: " if verdict.label else ""
        if verdict.status == "INCORRECT":
            problems.append(f"{label}{verdict.reason_vi}")
        elif verdict.status == "UNVERIFIED" and ("chưa nêu" in verdict.reason_vi or "không khớp" in verdict.reason_vi):
            problems.append(f"{label}{verdict.reason_vi} Hãy điền machine_answer đúng định dạng.")
        elif verdict.status == "UNSOLVED" and "bỏ sót" in verdict.reason_vi:
            problems.append(f"{label}{verdict.reason_vi}")
    for item in attempt.evidence:
        if item.outcome == "refuted" and item.data:
            problems.append(f"Dữ liệu kiểm tra ({item.kind}): {prompts.compact_json(item.data)[:400]}")
    if attempt.curriculum:
        for finding in attempt.curriculum.findings:
            where = f" (đoạn: “{finding.excerpt}”)" if finding.excerpt else ""
            problems.append(f"{finding.message}{where}")
    return problems


class Orchestrator:
    def __init__(self, gateway: LLMGateway, *, policy: Policy | None = None, run: CheckRunner | None = None,
                 max_revisions: int = 2, question_budget_sgd: Decimal = Decimal("0.30"),
                 solve_max_tokens: int = 8000, formalize_max_tokens: int = 6000,
                 escalate_thinking: bool = True, time_budget_seconds: float = 480,
                 geometry_thinking_first: bool = True) -> None:
        self.gateway = gateway
        self.policy = policy or load_policy()
        self.run = run or run_check
        self.max_revisions = max_revisions
        self.question_budget = question_budget_sgd
        self.solve_max_tokens = solve_max_tokens
        self.formalize_max_tokens = formalize_max_tokens
        self.escalate_thinking = escalate_thinking
        self.time_budget = time_budget_seconds
        self.geometry_thinking_first = geometry_thinking_first

    def _can_escalate(self, thinking_used: bool, calls: int, outcome: SolveOutcome, elapsed: float) -> bool:
        return (self.escalate_thinking and not thinking_used and calls <= self.max_revisions
                and outcome.cost_sgd + self._next_cost(True, Decimal(0)) <= self.question_budget
                and elapsed + THINKING_CALL_SECONDS <= self.time_budget)

    def _next_cost(self, thinking: bool, last_cost: Decimal) -> Decimal:
        """Upper-bound estimate of the next solve call (a thinking call may use its whole output allowance)."""
        if not thinking:
            return last_cost
        spec = self.gateway.catalog.for_tier("reasoning")
        try:
            return cost_sgd(spec, 4000, spec.thinking_max_output_tokens or spec.max_output_tokens,
                            self.gateway.settings.fx_usd_to_sgd)
        except ModelNotConfigured:
            return Decimal(0)

    def _log(self, outcome: SolveOutcome, state: SolveState, started: float, **detail: Any) -> None:
        outcome.trace.append({"state": state.value, "ms": int((time.monotonic() - started) * 1000), **detail})

    async def formalize(self, data: SolveInput, outcome: SolveOutcome, temperature: float = 0.0) -> None:
        """Independent formalization with one parser-guided repair; invalid parts are dropped, never guessed."""
        outcome.state = SolveState.FORMALIZE
        started = time.monotonic()
        ctx = CallContext("formalize", data.user_id, data.job_id)
        # Geometry figures need a careful construction: a stronger model than the fast tier (configurable).
        tier: Tier = "geometry_formalize" if "geometry" in (outcome.topics or data.topics) else "fast"
        messages = [ChatMessage(role="system", content=prompts.FORMALIZE_SYSTEM),
                    ChatMessage(role="user", content=prompts.formalize_user(data.problem_text))]
        try:
            formal = await self.gateway.structured(tier=tier, ctx=ctx, output=FormalizationReply,
                                                   max_tokens=self.formalize_max_tokens, temperature=temperature,
                                                   thinking=False,
                                                   schema_name="formalization", messages=messages)
        except (InvalidModelOutput, ModelCallFailed) as exc:
            outcome.cost_sgd += exc.cost_sgd
            self._log(outcome, SolveState.FORMALIZE, started, error=exc.code)
            return
        outcome.cost_sgd += formal.cost_sgd
        parsed, problems = formal.value.split()
        if parsed is None:
            self._log(outcome, SolveState.FORMALIZE, started, error="invalid_model_output")
            return
        first = inherit_geometry(parsed)
        problems += template_errors(first)
        formalization, drawing = drop_invalid_templates(first), first
        repair_error = None
        if problems:
            # One repair round with the parser's errors; whatever still does not parse is dropped. A failed or worse
            # repair keeps the valid parts of the first reply.
            try:
                repaired = await self.gateway.structured(
                    tier=tier, ctx=ctx, output=FormalizationReply, max_tokens=self.formalize_max_tokens,
                    temperature=temperature, thinking=False,
                    schema_name="formalization", messages=[
                        *messages, ChatMessage(role="assistant", content=formal.value.model_dump_json()),
                        ChatMessage(role="user", content=prompts.formalize_repair(problems))])
                outcome.cost_sgd += repaired.cost_sgd
                again, _ = repaired.value.split()
                if again is not None:
                    again = inherit_geometry(again)
                    candidate = drop_invalid_templates(again)
                    if _templates(candidate) >= _templates(formalization):
                        formalization, drawing = candidate, again
            except (InvalidModelOutput, ModelCallFailed) as exc:
                outcome.cost_sgd += exc.cost_sgd
                repair_error = exc.code
        outcome.formalization, outcome.drawing = formalization, drawing
        self._log(outcome, SolveState.FORMALIZE, started, parts=len(formalization.parts), repaired=bool(problems),
                  templates=[p.template.kind if p.template else None for p in formalization.parts],
                  **({"repair_error": repair_error} if repair_error else {}))

    async def figure_only(self, data: SolveInput, *, redraw: bool = False) -> SolveOutcome:
        """Formalize without solving (used to draw a geometry figure before any hint or solution). A redraw samples
        (temperature 0.4): at 0 the provider returns the same formalization, so "Vẽ lại hình" would change nothing."""
        outcome = SolveOutcome(state=SolveState.FORMALIZE, topics=list(data.topics),
                               policy_version=self.policy.version)
        await self.formalize(data, outcome, temperature=0.4 if redraw else 0.0)
        outcome.state = SolveState.DONE
        return outcome

    async def run_solve(self, data: SolveInput) -> SolveOutcome:
        outcome = SolveOutcome(state=SolveState.CLASSIFY, topics=[t for t in data.topics if t in TOPICS],
                               policy_version=self.policy.version)
        ctx = CallContext(purpose="solve", user_id=data.user_id, job_id=data.job_id)
        run_started = time.monotonic()

        # CLASSIFY: confirmed topics are reused; the fast model is only asked when none are set.
        started = time.monotonic()
        if not outcome.topics:
            try:
                result = await self.gateway.structured(
                    tier="fast", ctx=CallContext("classify", data.user_id, data.job_id), output=Classification,
                    max_tokens=200, schema_name="classification", messages=[
                        ChatMessage(role="system", content="Classify this Vietnamese maths problem into one or two "
                                    "of: algebra, geometry, number_theory, combinatorics. Main topic first."),
                        ChatMessage(role="user", content=data.problem_text)])
                outcome.topics = list(result.value.topics)
                outcome.cost_sgd += result.cost_sgd
            except (InvalidModelOutput, ModelCallFailed):
                outcome.topics = []
        self._log(outcome, SolveState.CLASSIFY, started, topics=outcome.topics)

        # FORMALIZE (independent of the solver). A failure only means less verification.
        await self.formalize(data, outcome)

        variables = prompts.variable_names(outcome.formalization)
        system = prompts.solve_system(self.policy, outcome.topics, variables)
        messages = [ChatMessage(role="system", content=system),
                    ChatMessage(role="user", content=prompts.solve_user(data.problem_text))]
        geometry = "geometry" in outcome.topics
        tier: Tier = "geometry_reasoning" if geometry else "reasoning"

        # Escalation: the first attempt runs without hidden reasoning (fast, cheap). One attempt may switch it on
        # when the answer is wrong, missing, unsolved, or the reply was unusable. Geometry proofs start with it: the
        # non-reasoning attempt rarely finds the auxiliary construction, and a failed reasoning call falls back to
        # one plain attempt.
        thinking: bool | None = False if self.escalate_thinking else None
        thinking_used = False
        if geometry and self.escalate_thinking and self.geometry_thinking_first:
            thinking, thinking_used = True, True
        calls = 0
        while True:
            outcome.state = SolveState.SOLVE if calls == 0 else SolveState.REVISE
            calls += 1
            started = time.monotonic()
            # A failed thinking call is not repeated (it can take minutes), nor is a revision: one solution exists.
            retries = 0 if thinking or outcome.best is not None else None
            try:
                try:
                    solved = await self.gateway.structured(tier=tier, ctx=ctx, output=ModelSolution,
                                                           max_tokens=self.solve_max_tokens, schema_name="solution",
                                                           messages=messages, temperature=0.2, thinking=thinking,
                                                           max_retries=retries)
                except BudgetRestricted:
                    # Restricted budget mode refuses the reasoning tier: degrade to the fast model.
                    tier = "fast"
                    self._log(outcome, outcome.state, started, degraded="budget_restricted")
                    solved = await self.gateway.structured(tier=tier, ctx=ctx, output=ModelSolution,
                                                           max_tokens=self.solve_max_tokens, schema_name="solution",
                                                           messages=messages, temperature=0.2, thinking=False,
                                                           max_retries=retries)
            except (BudgetExceeded, UserBudgetExceeded):
                if outcome.best is None:
                    raise
                self._log(outcome, outcome.state, started, stopped="budget")
                break
            except (InvalidModelOutput, ModelCallFailed) as exc:
                outcome.cost_sgd += exc.cost_sgd
                self._log(outcome, outcome.state, started, error=exc.code, thinking=thinking,
                          cost_sgd=str(exc.cost_sgd))
                if self._can_escalate(thinking_used, calls, outcome, time.monotonic() - run_started):
                    thinking, thinking_used = True, True
                    continue
                if thinking and outcome.best is None and calls == 1:
                    thinking = False  # geometry started with reasoning and it failed (often a timeout): one plain try
                    continue
                if outcome.best is None:
                    outcome.state = SolveState.FAILED
                    outcome.error_code, outcome.error_message = exc.code, exc.message
                    return outcome
                break
            if thinking:
                thinking_used = True
            call_seconds = time.monotonic() - started
            outcome.attempts += 1
            outcome.cost_sgd += solved.cost_sgd
            self._log(outcome, outcome.state, started, model=solved.model, thinking=thinking,
                      cost_sgd=str(solved.cost_sgd))

            started = time.monotonic()
            verdicts, evidence, status = await verify_solution(outcome.formalization, solved.value, self.run)
            self._log(outcome, SolveState.VERIFY, started, status=status)

            started = time.monotonic()
            curriculum = None
            if solved.value.solved:
                curriculum = check_curriculum(solution_texts(solved.value), solved.value.techniques, outcome.topics,
                                              self.policy)
            self._log(outcome, SolveState.CURRICULUM, started,
                      status=curriculum.status if curriculum else "NOT_CHECKED")

            attempt = Attempt(solved.value, verdicts, evidence, status, curriculum)
            if outcome.best is None or attempt.score() > outcome.best.score():
                outcome.best = attempt

            feedback = revision_feedback(attempt)
            hard = status in ("INCORRECT", "UNSOLVED") or not solved.value.solved or any(
                "chưa nêu" in v.reason_vi for v in verdicts)
            escalate = hard and self._can_escalate(thinking_used, calls, outcome, time.monotonic() - run_started)
            if not solved.value.solved and escalate:
                feedback = ["Lời giải trước chưa giải được bài. Hãy suy nghĩ kỹ và giải lại từ đầu."]
            if not feedback or calls > self.max_revisions:
                break
            if outcome.cost_sgd + self._next_cost(escalate, solved.cost_sgd) > self.question_budget:
                self._log(outcome, SolveState.REVISE, time.monotonic(), skipped="question_budget")
                break
            # The student is waiting: a revision that would likely end past the time budget is not started.
            if not escalate and time.monotonic() - run_started + call_seconds > self.time_budget:
                self._log(outcome, SolveState.REVISE, time.monotonic(), skipped="time_budget")
                break
            thinking = True if escalate else (False if self.escalate_thinking else None)
            messages = [messages[0], ChatMessage(role="user", content=prompts.revise_user(
                data.problem_text, solved.value.model_dump_json(), feedback))]

        # HINTS: derived once from the best solution, checked so they never reveal the answer.
        if outcome.best is not None and outcome.best.solution.solved and outcome.best.status != "INCORRECT":
            outcome.state = SolveState.HINTS
            started = time.monotonic()
            try:
                generated = await generate_hints(self.gateway, CallContext("hints", data.user_id, data.job_id),
                                                 data.problem_text, outcome.best.solution, outcome.topics, self.policy)
                outcome.hints = generated.hints
                outcome.cost_sgd += generated.cost_sgd
                self._log(outcome, SolveState.HINTS, started, hints=len(generated.hints), dropped=generated.dropped)
            except (BudgetExceeded, UserBudgetExceeded, BudgetRestricted):
                self._log(outcome, SolveState.HINTS, started, skipped="budget")

        outcome.state = SolveState.DONE
        logger.info("solve_done", extra={"attempts": outcome.attempts, "cost_sgd": str(outcome.cost_sgd),
                                         "status": outcome.best.status if outcome.best else None})
        return outcome
