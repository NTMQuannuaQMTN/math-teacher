"""Final copy editor: removes leftovers of the solver's scratch work from the solution a student sees.

Seen live (2026-11-17): "Biểu thức … được viết lại: …. Tuy nhiên, cách đặt này chưa tối ưu." — thinking aloud,
abandoned attempts and broken fragments survive the solver rules and the examiner's presentation notes.

The editor never writes mathematics. A first version let a model rewrite the steps under a guard (every formula
must already be in the original): on real solutions the model kept re-deriving and compressing proofs (a 33-step part
became 5 steps with new \\cot formulas), so the guard refused 3 of 5 edits. Now the model only DECIDES, per numbered
step: keep it, delete it (scratch work), or trim it (remove exact leftover phrases it quotes). The code applies the
decisions: deleting and cutting quoted text cannot change a formula. A trim that does not match the step exactly, or
that would leave an unbalanced "$", is ignored; a part is never emptied. Step numbers are remapped so the examiner's
notes keep pointing at the right step.
"""

from __future__ import annotations

import asyncio
import json
import re
from dataclasses import dataclass
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field

from ..billing.budget import BudgetRestricted, UserBudgetExceeded
from ..errors import BudgetExceeded
from ..providers.base import ChatMessage
from ..providers.gateway import CallContext, InvalidModelOutput, LLMGateway, ModelCallFailed
from ..solvers.schemas import ModelSolution
from .critic import Critique

EDITOR_SYSTEM = """You are the final copy editor of a Vietnamese maths solution (Grade 9, toán chuyên vào 10) before a
student sees it. The mathematics is final. You do not write text: you decide, for each numbered step, what to do.

- "delete": the whole step is scratch work, not part of the final argument: thinking aloud or a self-correction
  ("Chờ đã", "Thử lại", "? Không, …", "Kiểm tra lại:", "Hãy tính lại"), a step of an attempt that the text itself
  abandons ("Không, ta dùng cách khác", "Cách này phức tạp"), a repetition of an earlier step, a re-check of a result
  already proved (e.g. by trying particular numbers after a proof), a remark about the solution itself ("Ta sẽ trình
  bày …", "Vậy phép biến đổi đúng"), or a broken fragment ("Biểu thức  được viết lại: .").
  A case check or a computation that IS the argument for the answer (even long, even by trying values) is never
  deleted. If the only derivation of the answer is long or messy, keep it: rewriting it is not your job.
- "trim": the step is part of the final argument but also contains a leftover phrase or sentence ("Tuy nhiên, cách đặt
  này chưa tối ưu.", "? Chờ đã, kiểm tra lại phép tính."): list each leftover in "remove", copied EXACTLY, character
  for character, from the step.
- Steps you do not list are kept as they are.

Never delete or trim anything the final argument needs. When unsure, keep. A clean solution gets an empty list.
Reply with a single JSON object."""


class StepDecision(BaseModel):
    step: int = Field(ge=1)
    action: Literal["delete", "trim"]
    remove: list[str] = Field(default_factory=list, max_length=8,
                              description="trim: the exact leftover texts to cut out of the step.")


class PartDecisions(BaseModel):
    label: str = Field(max_length=16)
    decisions: list[StepDecision] = Field(default_factory=list, max_length=60)


class EditDecisions(BaseModel):
    approach_remove: list[str] = Field(default_factory=list, max_length=8,
                                       description="Exact leftover texts to cut out of the approach sentence.")
    parts: list[PartDecisions] = Field(max_length=1)


@dataclass(frozen=True)
class EditResult:
    solution: ModelSolution
    step_map: dict[str, dict[int, int]]  # part label -> original step -> edited step (1-based); removed steps absent
    parts_edited: int
    steps_removed: int
    cost_sgd: Decimal


_MATH = re.compile(r"\$\$(.+?)\$\$|\$(.+?)\$", re.S)


def _formula_set(text: str) -> set[str]:
    return {re.sub(r"\s+", "", m.group(1) or m.group(2) or "") for m in _MATH.finditer(text)} - {""}


def _tidy(text: str) -> str:
    text = re.sub(r"[ \t]{2,}", " ", text)
    text = re.sub(r"\s+([.,;:!?])", r"\1", text)
    text = re.sub(r"([.,;:])\1+", r"\1", text)
    return text.strip(" \t,;:")


def _cut(text: str, leftovers: list[str]) -> str | None:
    """The text with each quoted leftover removed, or None when a quote is not in the text exactly or the result would
    break a formula or say nothing."""
    out = text
    for piece in leftovers:
        if not piece or piece not in out:
            return None
        out = out.replace(piece, " ", 1)
    out = _tidy(out)
    if out.count("$") % 2 or not re.search(r"\w", out):
        return None
    return out


# Words that mark a step as scratch work. A deleted step must carry one, follow one in the same deleted run (an
# announced re-check or abandoned attempt), or repeat formulas kept elsewhere; otherwise it may be part of the argument.
_SCRATCH = re.compile(r"chờ đã|kiểm tra lại|thử lại|tính lại|\?\s*không|không,\s*(?:ta|dùng)|cách khác|chưa tối ưu|"
                      r"sai lầm|nhầm|quay lại|hãy thử|thử (?:một|với)|phức tạp|được viết lại:\s*\.|"
                      r"phép biến đổi (?:đúng|chính xác)|ta sẽ trình bày|cần kiểm tra|có vẻ như|sửa lại", re.IGNORECASE)


_CONCLUSION = re.compile(r"^\s*(?:vậy|do đó|suy ra|kết luận|kết quả|ta có điều phải chứng minh)", re.IGNORECASE)


def _unexplained_deletions(steps: list[str], deleted: set[int], final: str = "") -> set[int]:
    """Deleted steps (1-based) that nothing shows to be scratch work; such a deletion is not applied. A deleted step
    is scratch work when it carries a scratch word, or repeats only formulas of EARLIER kept steps, or belongs to a
    deleted run that starts with a scratch word (an abandoned attempt) — unless some step of that run derives a result
    a LATER kept step uses: then the run's unmarked steps are the derivation and stay. Seen live: a 22-step case check
    that was the only derivation of the answer; two justification steps of a geometry proof; and a corrected
    derivation ("$\\frac{HD}{HC} = \\frac{\\tan \\widehat{PCD}}{\\tan \\widehat{PDC}}$") inside a run of dead ends,
    whose result the kept text used three steps later."""
    unexplained: set[int] = set()
    # The part's last concluding step stays unless it is itself marked as scratch work (seen live: a tail run of
    # re-checks that started with "Chờ đã" also swept away "Vậy … suy ra $M = \\sqrt{2026}$").
    last_conclusion = max((i for i, text in enumerate(steps, start=1) if _CONCLUSION.search(text)), default=None)
    if last_conclusion in deleted and not _SCRATCH.search(steps[last_conclusion - 1]):
        unexplained.add(last_conclusion)  # runs below are still taken as proposed, so its derivation stays with it
    # The final answer counts as a later kept step: a run that derives what it states is the derivation.
    formulas = [_formula_set(text) for text in steps] + [_formula_set(final)]
    kept = [i not in deleted for i in range(1, len(steps) + 1)] + [True]

    def kept_formulas(indices: range) -> set[str]:
        return {f for j in indices if kept[j] for f in formulas[j]}

    i = 1
    while i <= len(steps):
        if i not in deleted:
            i += 1
            continue
        run = []
        while i in deleted:
            run.append(i)
            i += 1
        announced = bool(_SCRATCH.search(steps[run[0] - 1]))
        # A NEW result of the run (not already in an earlier kept step) that a later kept step uses.
        used_later = any((formulas[k - 1] - kept_formulas(range(0, k - 1))) & kept_formulas(range(k, len(steps) + 1))
                         for k in run if not _SCRATCH.search(steps[k - 1]))
        for k in run:
            marked = bool(_SCRATCH.search(steps[k - 1]))
            repeated = bool(formulas[k - 1]) and formulas[k - 1] <= kept_formulas(range(0, k - 1))
            if not (marked or repeated or (announced and not used_later)):
                unexplained.add(k)
    return unexplained


def apply_decisions(solution: ModelSolution, decisions: dict[str, PartDecisions], approach_remove: list[str]
                    ) -> tuple[ModelSolution, dict[str, dict[int, int]], int]:
    parts = []
    step_map: dict[str, dict[int, int]] = {}
    edited_count = 0
    for part in solution.parts:
        given = decisions[part.label].decisions if part.label in decisions else []
        chosen = {d.step: d for d in given if 1 <= d.step <= len(part.steps)}
        deleted = {i for i, d in chosen.items() if d.action == "delete"}
        for i in _unexplained_deletions(part.steps, deleted, part.final_answer_latex):
            del chosen[i]  # a deletion nothing marks as scratch work is not applied: the step stays
        new_steps: list[str] = []
        mapping: dict[int, int] = {}
        for index, text in enumerate(part.steps, start=1):
            decision = chosen.get(index)
            if decision is not None and decision.action == "delete":
                continue
            if decision is not None and decision.action == "trim":
                # A trim cuts only text marked as scratch work (seen live: a trim proposed to cut "Do đó M nằm trên
                # tia đối của tia AD", the justification of the next equality); one that does not apply cleanly is
                # ignored.
                leftovers = [r for r in decision.remove if _SCRATCH.search(r)]
                if leftovers:
                    text = _cut(text, leftovers) or text
            new_steps.append(text)
            mapping[index] = len(new_steps)
        if not new_steps:  # never empty a part
            new_steps, mapping = list(part.steps), {i: i for i in range(1, len(part.steps) + 1)}
        if new_steps != part.steps:
            edited_count += 1
        step_map[part.label] = mapping
        parts.append(part.model_copy(update={"steps": new_steps}))
    approach_leftovers = [r for r in approach_remove if _SCRATCH.search(r)]
    approach = (_cut(solution.approach_vi, approach_leftovers) if approach_leftovers else None) or solution.approach_vi
    return solution.model_copy(update={"parts": parts, "approach_vi": approach}), step_map, edited_count


def remap_critique(critique: Critique | None, step_map: dict[str, dict[int, int]]) -> Critique | None:
    """The examiner's notes point at the edited step numbers; a note on a removed step keeps its part only."""
    if critique is None:
        return None
    issues = []
    for issue in critique.issues:
        mapping = step_map.get(issue.part) or (next(iter(step_map.values())) if len(step_map) == 1 else {})
        step = mapping.get(issue.step) if issue.step else None
        issues.append(issue.model_copy(update={"step": step}))
    return critique.model_copy(update={"issues": issues})


def _payload(problem: str, solution: ModelSolution, index: int) -> str:
    """One part per call (long solutions overflowed the output limit); the approach sentence goes with the first."""
    part = solution.parts[index]
    body = {"approach_vi": solution.approach_vi if index == 0 else "",
            "parts": [{"label": part.label, "steps": {str(i): s for i, s in enumerate(part.steps, start=1)}}]}
    return (f"Đề bài:\n{problem}\n\nLời giải cần biên tập (các bước được đánh số):\n"
            f"{json.dumps(body, ensure_ascii=False)}\n\n"
            "Return JSON: {\"approach_remove\": [exact leftover texts in approach_vi], \"parts\": [{\"label\": …, "
            "\"decisions\": [{\"step\": 3, \"action\": \"delete\"}, {\"step\": 5, \"action\": \"trim\", \"remove\": "
            "[\"exact leftover text\"]}]}]}.")


async def _decide(gateway: LLMGateway, ctx: CallContext, problem: str, solution: ModelSolution, index: int,
                  timeout_seconds: float | None) -> tuple[EditDecisions | None, Decimal]:
    try:
        result = await gateway.structured(
            tier="fast", ctx=ctx, output=EditDecisions, max_tokens=3000, schema_name="edited_solution",
            temperature=0.0, thinking=False, timeout_seconds=timeout_seconds, max_retries=0, messages=[
                ChatMessage(role="system", content=EDITOR_SYSTEM),
                ChatMessage(role="user", content=_payload(problem, solution, index))])
    except (InvalidModelOutput, ModelCallFailed) as exc:
        return None, exc.cost_sgd
    except (BudgetExceeded, BudgetRestricted, UserBudgetExceeded):
        return None, Decimal(0)
    return result.value, result.cost_sgd


async def edit_solution(gateway: LLMGateway, ctx: CallContext, problem: str, solution: ModelSolution,
                        timeout_seconds: float | None = None) -> tuple[EditResult | None, Decimal]:
    """One decision call per part (fast tier, no hidden reasoning, two at a time) and the total cost. A part whose call
    fails keeps its text; None when no call answered."""
    gate = asyncio.Semaphore(2)

    async def one(index: int) -> tuple[EditDecisions | None, Decimal]:
        async with gate:
            return await _decide(gateway, ctx, problem, solution, index, timeout_seconds)

    results = await asyncio.gather(*(one(i) for i in range(len(solution.parts))))
    cost = sum((r[1] for r in results), Decimal(0))
    if all(r[0] is None for r in results):
        return None, cost
    decisions: dict[str, PartDecisions] = {}
    for part, (answer, _) in zip(solution.parts, results, strict=True):
        if answer is not None and answer.parts:
            decisions[part.label] = answer.parts[0]
    first = results[0][0]
    approach_remove = first.approach_remove if first is not None else []
    edited, step_map, parts_edited = apply_decisions(solution, decisions, approach_remove)
    removed = sum(len(a.steps) - len(b.steps) for a, b in zip(solution.parts, edited.parts, strict=True))
    return EditResult(edited, step_map, parts_edited, removed, cost), cost
