"""Adaptive feedback on a student's own work, judged on its own merits (no re-solving).

A problem has many valid solutions, so the work is never compared step by step with the stored solution: one model
call checks whether each of the student's steps is true and follows, finds the first error, says what could be
better (a missing reason, presentation, a shorter way) and, once the work is finished, whether the student's method
is better than the reference. The stored solution only tells the model the correct final answer and what must not be
revealed. Deterministic checks then override the model where they can: consecutive algebra steps are checked in the
sandbox (lost roots, wrong expansions); the hint and suggestions are checked for answer leaks and prohibited methods.
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

StepStatus = Literal["correct", "gap", "incorrect", "unclear"]


class StudentStep(BaseModel):
    text: str = Field(max_length=600, description="The student's step, quoted (LaTeX in $...$).")
    math: str | None = Field(max_length=300, description="The step as plain ASCII maths (e.g. x^2-5*x+6=0), or null.")
    status: StepStatus
    note_vi: str | None = Field(max_length=400)


class Improvement(BaseModel):
    kind: Literal["rigor", "presentation", "method"] = Field(
        description="rigor: a reason or condition a marker would require; presentation: how it is written; "
                    "method: a shorter or cleaner way (only when the work is finished).")
    text_vi: str = Field(min_length=1, max_length=400)


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
    improvements: list[Improvement] = Field(default_factory=list, max_length=4,
                                            description="What could be better, most important first; [] if nothing.")
    comparison: Literal["better", "as_good", "reference_better"] | None = Field(
        default=None, description="Only when the work is finished and correct: the student's method against the "
                                  "reference. null otherwise.")
    comparison_vi: str | None = Field(default=None, max_length=500,
                                      description="Why, in one or two sentences (what makes one method better).")


TUTOR_SYSTEM = """You are a patient, rigorous Vietnamese maths teacher (Toán chuyên vào 10) checking a student's own
work. A problem has many valid solutions: judge the work ON ITS OWN — is each step true, and does it follow from the
problem and the earlier steps? Never mark a step wrong because it differs from the reference (another method, order,
notation, or a routine computation a marker accepts without detail). You also see a checked reference solution: it is
for YOU only — to know the correct final answer and what not to reveal. Never reveal it, its final answer, or later
steps.

Do this:
1. Identify the student's approach, in one sentence.
2. Split their work into steps; for each give a status, with a short note when needed:
   "correct" = true and justified as a marker requires; "gap" = true, but a reason or condition the marker requires is
   missing (an angle equality or a similarity stated without a reason, ĐKXĐ not stated, the equality case of an
   inequality not checked) — the note says what is missing; "incorrect" = false or does not follow (wrong computation,
   lost or extraneous root, invalid inference, circular reasoning, using what must be proved); "unclear" = unreadable,
   or built on an earlier incorrect step.
   Say "incorrect" only when you can say exactly what is false. If the student's final answer differs from the
   reference, find the step in THEIR work that is wrong; do not call a step wrong just because the answer differs.
   For equations/expressions also give "math": the RESULT of that step as ONE equation or expression in plain
   ASCII (explicit *, ^), e.g. "x = 2" — never arrows, words or several equations; else null. Also give
   "problem_math": the starting equation of the problem in the same syntax.
3. Point to the FIRST incorrect step only, and explain precisely why it is wrong (e.g. chia hai vế cho x làm mất
   nghiệm x = 0; bình phương hai vế khi chưa có điều kiện).
   A later step that builds on an incorrect one is not "correct" even if its own algebra is right: mark it "unclear"
   with a note that it rests on the earlier error (official marking guides give 0 to such steps).
4. Give ONE hint for what to do next, building on THEIR approach (if it works, do not steer them to the reference's
   method). Do not give the answer or finish the problem. If they already reached a correct final answer, confirm it
   and say what to check or how to present it.
5. "improvements": up to 4 things that would make the work better, most important first — "rigor" (a missing reason
   or condition: these cost marks), "presentation" (clearer writing, a conclusion sentence, notation the official keys
   use), "method" (a shorter or cleaner way; ONLY when the work is finished). [] when there is nothing real to improve:
   never invent criticism of good work.
6. When the work is finished and correct, compare the student's method with the reference: "better" (shorter, more
   elegant or more general — say so honestly: students sometimes find a better solution), "as_good", or
   "reference_better"; explain why in "comparison_vi". Otherwise comparison = null.
7. Keep their correct reasoning; use only Grade 9 methods; Vietnamese; address the student as "em"; LaTeX in $...$.
8. Teach the exam's marking habits (official hướng dẫn chấm) when the work shows the problem, at most one per
   reply: a geometry answer with no figure, or a wrong one, gets no marks for that part ("nhớ vẽ hình vào bài
   làm"); a claim stated without a reason (an angle equality, a similarity) loses its points; answers found by
   trying values, without solving, earn almost nothing; steps after the first error earn nothing, so fix that step
   before going on.
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

    # 2. The comparison and "a shorter way" are about finished work only; before that they would show the reference's
    #    method. Every suggestion is checked for leaks like the hint.
    finished = feedback.student_reached_answer and feedback.first_error_index is None
    if not finished:
        feedback.comparison, feedback.comparison_vi = None, None
    shielded = not solution_revealed and not feedback.student_reached_answer
    feedback.improvements = [
        i for i in feedback.improvements
        if (finished or i.kind != "method") and not (shielded and find_leaks([Hint(level="strategy", text_vi=i.text_vi)],
                                                                             solution))
        and check_curriculum([i.text_vi], [], topics, policy).compliant]
    if feedback.comparison == "better":
        logger.info("student_better_method", extra={"comparison_vi": feedback.comparison_vi})

    # 3. The forward-looking hint must not give the answer away (unless the student found it / revealed it).
    #    The error explanation may name what the student lost or broke (e.g. "bỏ sót nghiệm x = 0"): that is
    #    about their own work, and naming it is the point of the feedback.
    replaced = False
    if not solution_revealed and not feedback.student_reached_answer and \
            find_leaks([Hint(level="strategy", text_vi=feedback.next_hint_vi)], solution):
        replaced = True
        feedback.next_hint_vi = unseen_hints[0].text_vi if unseen_hints else \
            "Em hãy sửa bước vừa được đánh dấu, rồi làm tiếp từ đó."
    # 4. Curriculum: the tutor must not suggest prohibited methods.
    tutor_text = [feedback.next_hint_vi, feedback.error_explanation_vi or ""]
    if not check_curriculum(tutor_text, [], topics, policy).compliant:
        replaced = True
        feedback.next_hint_vi = unseen_hints[0].text_vi if unseen_hints else \
            "Em hãy thử dùng các kiến thức trong chương trình lớp 9 cho bước tiếp theo."
    return FeedbackResult(feedback, tool_checks, result.cost_sgd, replaced)
