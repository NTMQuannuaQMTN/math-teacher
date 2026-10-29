"""Progressive hints, generated once from the finished solution and checked so they never reveal the answer.

Hints are derived from the solution (not a fresh solve), so they follow the same method and cost one cheap call.
A deterministic leak check removes any hint that states a final value; prohibited-method hints are removed too.
"""

from __future__ import annotations

import logging
import re
import unicodedata
from dataclasses import dataclass
from decimal import Decimal

from ..curriculum.policy import Policy, check_curriculum
from ..providers.base import ChatMessage
from ..providers.gateway import CallContext, InvalidModelOutput, LLMGateway, ModelCallFailed
from ..solvers import prompts
from ..solvers.schemas import Hint, HintSet, ModelSolution

logger = logging.getLogger(__name__)


def _norm(text: str) -> str:
    text = unicodedata.normalize("NFC", text).lower()
    text = re.sub(r"\\(d|t)?frac\{([^{}]*)\}\{([^{}]*)\}", r"\2/\3", text)  # \frac{1}{3} → 1/3
    text = re.sub(r"\\sqrt\{([^{}]*)\}", r"sqrt(\1)", text)
    text = text.replace("\\left", "").replace("\\right", "")
    return re.sub(r"[\s${}\\]", "", text)


# Spaces are removed before matching, so a value may touch letters; it must not continue as a longer number.
_END = r"(?![\d/]|\.\d)"


def _value_forms(value: str) -> list[str]:
    v = _norm(value)
    return [v] if v else []


def answer_markers(solution: ModelSolution) -> list[tuple[str, re.Pattern[str]]]:
    """Patterns whose presence in a hint would reveal a final answer."""
    markers: list[tuple[str, re.Pattern[str]]] = []

    def add_value(shown: str) -> None:
        for form in _value_forms(shown):
            if re.fullmatch(r"-?\d", form):
                # A single digit appears everywhere ("bậc 2"): only an explicit result statement counts.
                markers.append((shown, re.compile(rf"(=|bằng|là){re.escape(form)}{_END}")))
            else:
                markers.append((shown, re.compile(rf"(?<![\d/.]){re.escape(form)}{_END}")))

    for part in solution.parts:
        answer = part.machine_answer
        if answer.value:
            add_value(answer.value)
        for item in answer.solutions or []:
            for var, value in item.items():
                form = _norm(value)
                markers.append((f"{var} = {value}", re.compile(rf"{re.escape(var.lower())}=({re.escape(form)}){_END}")))
        for var, value in (answer.point or {}).items():
            form = _norm(value)
            markers.append((f"{var} = {value}", re.compile(rf"{re.escape(var.lower())}=({re.escape(form)}){_END}")))
        final = _norm(part.final_answer_latex)
        if len(final) >= 12:
            markers.append((part.final_answer_latex[:40], re.compile(re.escape(final))))
    return markers


def find_leaks(hints: list[Hint], solution: ModelSolution) -> dict[int, list[str]]:
    markers = answer_markers(solution)
    leaks: dict[int, list[str]] = {}
    for index, hint in enumerate(hints):
        text = _norm(hint.text_vi)
        found = [shown for shown, pattern in markers if pattern.search(text)]
        if found:
            leaks[index] = found
    return leaks


@dataclass(frozen=True)
class HintResult:
    hints: list[Hint]
    cost_sgd: Decimal
    dropped: int


async def generate_hints(gateway: LLMGateway, ctx: CallContext, problem: str, solution: ModelSolution,
                         topics: list[str], policy: Policy) -> HintResult:
    """3–5 checked hints, or none if generation fails (the student can still reveal the solution)."""
    if not solution.solved or not solution.parts:
        return HintResult([], Decimal(0), 0)
    solution_json = solution.model_dump_json(include={"approach_vi", "parts"})
    cost = Decimal(0)
    leaked: list[str] | None = None
    hints: list[Hint] = []
    for _attempt in range(2):
        try:
            result = await gateway.structured(
                tier="fast", ctx=ctx, output=HintSet, max_tokens=1500, schema_name="hints", thinking=False,
                messages=[ChatMessage(role="system", content=prompts.HINTS_SYSTEM),
                          ChatMessage(role="user", content=prompts.hints_user(problem, solution_json, leaked))])
        except (InvalidModelOutput, ModelCallFailed) as exc:
            cost += exc.cost_sgd
            logger.warning("hint_generation_failed", extra={"code": exc.code})
            return HintResult([], cost, 0)
        cost += result.cost_sgd
        hints = list(result.value.hints)
        leaks = find_leaks(hints, solution)
        if not leaks:
            break
        leaked = sorted({value for values in leaks.values() for value in values})
    leaks = find_leaks(hints, solution)
    kept = [h for i, h in enumerate(hints) if i not in leaks
            and check_curriculum([h.text_vi], [], topics, policy).compliant]
    return HintResult(kept, cost, len(hints) - len(kept))
