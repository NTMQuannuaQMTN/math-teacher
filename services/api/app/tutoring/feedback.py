"""Adaptive feedback on a student's own work, using the stored solution as the plan (no re-solving).

One model call identifies the approach, judges each step, finds the first error and writes one targeted hint.
Deterministic checks then override the model where they can: consecutive algebra steps are checked in the sandbox
(lost roots, wrong expansions), the hint is checked for answer leaks and prohibited methods.
"""

from __future__ import annotations

import itertools
import logging
from dataclasses import dataclass
from decimal import Decimal
from typing import Any, Literal

from pydantic import BaseModel, Field

from ..curriculum.policy import Policy, check_curriculum
from ..providers.base import ChatMessage
from ..providers.gateway import CallContext, LLMGateway
from ..solvers.schemas import Hint, ModelSolution
from ..tools.sandbox import run_check
from .hints import find_leaks

logger = logging.getLogger(__name__)

StepStatus = Literal["correct", "incorrect", "unclear"]


class StudentStep(BaseModel):
    text: str = Field(max_length=600, description="The student's step, quoted (LaTeX in $...$).")
    math: str | None = Field(max_length=300, description="The step as plain ASCII maths (e.g. x^2-5*x+6=0), or null.")
    status: StepStatus
    note_vi: str | None = Field(max_length=400)


class WorkFeedback(BaseModel):
    approach_vi: str = Field(max_length=500, description="What the student is trying to do, in one sentence.")
    variable: str | None = Field(max_length=16, description="The single unknown of the steps' equations, if any.")
    problem_math: str | None = Field(default=None, max_length=300, description="The problem's starting equation/expression in plain "
                                                                  "ASCII (e.g. x^2 = 2*x), or null.")
    steps: list[StudentStep] = Field(max_length=30)
    first_error_index: int | None = Field(description="0-based index of the first incorrect step, or null.")
    error_explanation_vi: str | None = Field(max_length=800)
    next_hint_vi: str = Field(max_length=600, description="One targeted hint for the next step. Never the answer.")
    student_reached_answer: bool
    encouragement_vi: str = Field(max_length=200)


TUTOR_SYSTEM = """You are a patient Vietnamese maths teacher (Toán chuyên vào 10).
A student shows you their own work on a problem. You also see a complete, checked reference solution: it is for YOU only — never reveal it, its final
answer, or later steps.

Do this:
1. Identify the student's approach (it may differ from the reference; judge it on its own merits).
2. Split their work into steps; for each say "correct", "incorrect" or "unclear", with a short note when needed.
   For equations/expressions also give "math": the RESULT of that step as ONE equation or expression in plain
   ASCII (explicit *, ^), e.g. "x = 2" — never arrows, words or several equations; else null. Also give
   "problem_math": the starting equation of the problem in the same syntax.
3. Point to the FIRST incorrect step only, and explain precisely why it is wrong (e.g. chia hai vế cho x làm mất
   nghiệm x = 0; bình phương hai vế khi chưa có điều kiện).
4. Give ONE hint for what to do next, building on their correct work. Do not give the answer or finish the
   problem. If they already reached a correct final answer, confirm it and suggest checking or presenting it.
5. Keep their correct reasoning; use only Grade 9 methods; Vietnamese; address the student as "em"; LaTeX in $...$.
Reply with a single JSON object."""


def tutor_user(problem: str, solution: ModelSolution, work: str, history: list[str], hints_seen: list[str]) -> str:
    previous = "\n".join(f"- {h}" for h in history[-4:]) or "(chưa có)"
    hints = "\n".join(f"- {h}" for h in hints_seen) or "(chưa có)"
    return (f"Đề bài:\n{problem}\n\nLời giải tham khảo (BÍ MẬT, chỉ để em đối chiếu):\n"
            f"{solution.model_dump_json(include={'approach_vi', 'parts'})}\n\n"
            f"Các gợi ý học sinh đã xem:\n{hints}\n\nPhản hồi trước đó của thầy/cô:\n{previous}\n\n"
            f"Bài làm của học sinh:\n{work}")


@dataclass(frozen=True)
class FeedbackResult:
    feedback: WorkFeedback
    tool_checks: list[dict[str, Any]]
    cost_sgd: Decimal
    hint_replaced: bool


async def analyze_work(gateway: LLMGateway, ctx: CallContext, policy: Policy, *, problem: str,
                       solution: ModelSolution, topics: list[str], work: str, history: list[str],
                       hints_seen: list[Hint], unseen_hints: list[Hint], solution_revealed: bool) -> FeedbackResult:
    result = await gateway.structured(
        tier="reasoning", ctx=ctx, output=WorkFeedback, max_tokens=2500, schema_name="work_feedback",
        thinking=False, temperature=0.1, timeout_seconds=60, max_retries=0, messages=[
            ChatMessage(role="system", content=TUTOR_SYSTEM),
            ChatMessage(role="user", content=tutor_user(problem, solution, work, history,
                                                        [h.text_vi for h in hints_seen]))])
    feedback = result.value

    # 1. Deterministic step checks between consecutive transcribed steps.
    tool_checks: list[dict[str, Any]] = []
    if feedback.variable:
        maths = [(i, s.math) for i, s in enumerate(feedback.steps) if s.math]
        if feedback.problem_math:
            maths.insert(0, (-1, feedback.problem_math))  # step 1 is checked against the problem itself
        for (i, previous), (j, current) in itertools.pairwise(maths):
            check = await run_check("step", {"variables": [feedback.variable], "previous": previous,
                                             "current": current}, limit_seconds=8)
            if not check.get("ok"):
                continue
            evidence = check["result"]
            tool_checks.append({"from": i, "to": j, "outcome": evidence["outcome"], "detail": evidence["detail"],
                                "data": evidence.get("data")})
            step = feedback.steps[j]
            if evidence["outcome"] == "refuted":
                step.status, step.note_vi = "incorrect", evidence["detail"]
                if feedback.first_error_index is None or j < feedback.first_error_index:
                    feedback.first_error_index = j
                    feedback.error_explanation_vi = evidence["detail"]
                    feedback.student_reached_answer = False
            elif evidence["outcome"] == "confirmed" and step.status == "incorrect" and "gained" not in (
                    evidence.get("data") or {}) and not any(s.status == "incorrect" for s in feedback.steps[:j]):
                # Only when no earlier step is wrong: a step that validly carries forward an earlier error (a wrong
                # conclusion) is still wrong as an answer.
                # The model called a valid transformation wrong: trust the exact check, keep the note visible.
                step.status = "correct"
                step.note_vi = (step.note_vi or "") + " (Công cụ kiểm tra: bước biến đổi này đúng.)"
                if feedback.first_error_index == j:
                    feedback.first_error_index = next((k for k, s in enumerate(feedback.steps)
                                                       if s.status == "incorrect"), None)

    # 2. The forward-looking hint must not give the answer away (unless the student found it / revealed it).
    #    The error explanation may name what the student lost or broke (e.g. "bỏ sót nghiệm x = 0"): that is
    #    about their own work, and naming it is the point of the feedback.
    replaced = False
    if not solution_revealed and not feedback.student_reached_answer and \
            find_leaks([Hint(level="strategy", text_vi=feedback.next_hint_vi)], solution):
        replaced = True
        feedback.next_hint_vi = unseen_hints[0].text_vi if unseen_hints else \
            "Em hãy sửa bước vừa được đánh dấu, rồi làm tiếp từ đó."
    # 3. Curriculum: the tutor must not suggest prohibited methods.
    tutor_text = [feedback.next_hint_vi, feedback.error_explanation_vi or ""]
    if not check_curriculum(tutor_text, [], topics, policy).compliant:
        replaced = True
        feedback.next_hint_vi = unseen_hints[0].text_vi if unseen_hints else \
            "Em hãy thử dùng các kiến thức trong chương trình lớp 9 cho bước tiếp theo."
    return FeedbackResult(feedback, tool_checks, result.cost_sgd, replaced)
