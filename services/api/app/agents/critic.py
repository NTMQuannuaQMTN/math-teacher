"""Independent verifier ("critic"): a second agent reads a finished solution like an examiner and lists its mistakes.

The solver and the critic never share reasoning: the critic sees only the problem and the written solution, so it
judges what a marker would read. Its issues are fed back to the solver for the next round; the loop lives in the
orchestrator.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field

from ..billing.budget import BudgetRestricted, UserBudgetExceeded
from ..errors import BudgetExceeded
from ..providers.base import ChatMessage
from ..providers.gateway import CallContext, InvalidModelOutput, LLMGateway, ModelCallFailed
from ..solvers.schemas import ModelSolution

CRITIC_SYSTEM = """You are a strict examiner marking a Vietnamese Grade 9 → lớp 10 chuyên maths solution with the
official marking rules (hướng dẫn chấm). You did not write it. Check it step by step and report every real problem.

Report as "error": a false statement, a wrong computation, a wrong or incomplete final answer, a missed case, a lost
or extraneous root, a conclusion that does not follow, circular reasoning, using what must be proved.
Report as "gap": a claim stated without a reason that a marker would not accept (an angle equality, a similarity, a
cyclic quadrilateral, an inequality step, a fact outside the Grade 9 programme used without proof), a missing
condition (ĐKXĐ, Δ ≥ 0, the equality case of an inequality), a part of the question not answered.
Report as "presentation": self-talk or corrections left in the text ("Chờ đã", "? Không, …", "Tuy nhiên, cách …"),
notation the official keys do not use, steps out of order, a finite case check (remainders, last digits) written
one line per case instead of one table. A table of cases is the required layout, never an issue in itself: check
every entry of it.

Rules: judge only what is written; do not solve the problem again in your reply; do not report a step as wrong
unless you can say exactly why; a correct step written differently from your own method is correct. Point to the
part label and the 1-based step number. Explanations in Vietnamese, short and precise, maths in $...$.
verdict = "correct" only when there is no error and no gap. Reply with a single JSON object."""


class CriticIssue(BaseModel):
    part: str = Field(max_length=16, description="Part label as in the solution ('a)'), or '' for the whole.")
    step: int | None = Field(default=None, ge=1, description="1-based step number, or null for the whole part.")
    severity: Literal["error", "gap", "presentation"]
    explanation_vi: str = Field(min_length=1, max_length=1500)


class Critique(BaseModel):
    verdict: Literal["correct", "has_issues"]
    issues: list[CriticIssue] = Field(default_factory=list, max_length=25)
    confidence: float = Field(ge=0, le=1)

    @property
    def blocking(self) -> list[CriticIssue]:
        """Issues that make the solution wrong or incomplete (presentation issues alone do not)."""
        return [i for i in self.issues if i.severity in ("error", "gap")]


@dataclass(frozen=True)
class CritiqueResult:
    critique: Critique
    cost_sgd: Decimal


def critic_user(problem: str, solution: ModelSolution) -> str:
    parts = [{"label": p.label, "steps": {str(i): s for i, s in enumerate(p.steps, start=1)},
              "final_answer": p.final_answer_latex} for p in solution.parts]
    return (f"Đề bài:\n{problem}\n\nLời giải cần chấm (các bước được đánh số):\n"
            f"{json.dumps({'approach': solution.approach_vi, 'parts': parts}, ensure_ascii=False)}\n\n"
            "Chấm lời giải này theo các quy tắc. Return JSON only.")


async def critique_solution(gateway: LLMGateway, ctx: CallContext, problem: str, solution: ModelSolution,
                            timeout_seconds: float = 150) -> CritiqueResult | None:
    """One examiner pass (a second try if the first reply is unusable); None when the critic could not answer, and
    the solve then continues on the tool checks alone."""
    cost = Decimal(0)
    for _ in range(2):
        try:
            result = await gateway.structured(
                tier="reasoning", ctx=ctx, output=Critique, max_tokens=4000, schema_name="critique", temperature=0.0,
                thinking=False, timeout_seconds=timeout_seconds, max_retries=0, messages=[
                    ChatMessage(role="system", content=CRITIC_SYSTEM),
                    ChatMessage(role="user", content=critic_user(problem, solution))])
        except (InvalidModelOutput, ModelCallFailed) as exc:
            cost += exc.cost_sgd
            continue
        except (BudgetExceeded, BudgetRestricted, UserBudgetExceeded):
            return None  # no budget for an examiner: the solve goes on with the tool checks
        return CritiqueResult(result.value, cost + result.cost_sgd)
    return None


def issue_text(issue: CriticIssue) -> str:
    where = f"Ý {issue.part} " if issue.part else ""
    if issue.step:
        where += f"bước {issue.step}"
    label = {"error": "Sai", "gap": "Thiếu lập luận", "presentation": "Trình bày"}[issue.severity]
    return f"{label} ({where.strip() or 'toàn bài'}): {issue.explanation_vi}"
