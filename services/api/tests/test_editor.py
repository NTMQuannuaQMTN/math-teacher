"""The copy editor removes scratch-work leftovers from the final solution and cannot change its mathematics: the model
only decides keep / delete / trim per step, and the code applies those decisions."""

from __future__ import annotations

import json
from typing import Any

from app.agents.critic import CriticIssue, Critique
from app.agents.editor import PartDecisions, apply_decisions, edit_solution, remap_critique
from app.agents.orchestrator import SolveInput
from app.container import Container
from app.providers.base import ChatRequest, ChatResult, ProviderError, Usage
from app.providers.gateway import CallContext
from app.solvers.schemas import ModelSolution
from tests.conftest import ScriptedProvider
from tests.test_solving import FORMAL_REPLY, orchestrator, part, reply, solution

# Seen live (2026-11-17): a leftover remark, a broken fragment and a recheck in the final text.
STEPS = [
    "Ta có $x^2 - 5x + 6 = 0$.",
    "Biểu thức  được viết lại: . Tuy nhiên, cách đặt này chưa tối ưu.",
    "Phân tích: $x^2 - 5x + 6 = (x-2)(x-3)$. Tuy nhiên, cách đặt này chưa tối ưu.",
    "Chờ đã, kiểm tra lại: đúng.",
    "Do đó $(x-2)(x-3) = 0$, nên $x = 2$ hoặc $x = 3$.",
]
DECISIONS = [{"step": 2, "action": "delete"}, {"step": 4, "action": "delete"},
             {"step": 3, "action": "trim", "remove": ["Tuy nhiên, cách đặt này chưa tối ưu."]}]
CLEAN = ["Ta có $x^2 - 5x + 6 = 0$.", "Phân tích: $x^2 - 5x + 6 = (x-2)(x-3)$.",
         "Do đó $(x-2)(x-3) = 0$, nên $x = 2$ hoặc $x = 3$."]


def messy(steps: list[str] = STEPS, label: str = "") -> ModelSolution:
    return solution({**part(label, solutions=[{"x": "2"}, {"x": "3"}]), "steps": steps})


def decide(decisions: list[dict[str, Any]], label: str = "") -> dict[str, PartDecisions]:
    return {label: PartDecisions.model_validate({"label": label, "decisions": decisions})}


def decisions_reply(decisions: list[dict[str, Any]], label: str = "", approach_remove: list[str] | None = None
                    ) -> ChatResult:
    content = json.dumps({"approach_remove": approach_remove or [],
                          "parts": [{"label": label, "decisions": decisions}]}, ensure_ascii=False)
    return ChatResult(content=content, model="fast-test", usage=Usage(prompt_tokens=600, completion_tokens=60),
                      finish_reason="stop", latency_ms=5)


def test_leftovers_are_deleted_or_trimmed_and_step_numbers_are_remapped() -> None:
    cleaned, step_map, count = apply_decisions(messy(), decide(DECISIONS), [])
    assert count == 1 and cleaned.parts[0].steps == CLEAN
    assert cleaned.parts[0].final_answer_latex == messy().parts[0].final_answer_latex
    assert step_map[""] == {1: 1, 3: 2, 5: 3}
    critique = Critique(verdict="has_issues", confidence=0.8, issues=[
        CriticIssue(part="", step=5, severity="gap", explanation_vi="Thiếu lý do."),
        CriticIssue(part="", step=4, severity="presentation", explanation_vi="Tự nói.")])
    remapped = remap_critique(critique, step_map)
    assert remapped is not None and [i.step for i in remapped.issues] == [3, None]


def test_decisions_that_do_not_apply_cleanly_change_nothing() -> None:
    # A quote that is not in the step exactly (the model paraphrased it) is ignored: the step stays.
    paraphrased = [{"step": 3, "action": "trim", "remove": ["Tuy nhiên cách này chưa tối ưu"]}]
    assert apply_decisions(messy(), decide(paraphrased), [])[0].parts[0].steps == STEPS
    # Cutting half a formula would leave an unbalanced "$": ignored.
    half = [{"step": 5, "action": "trim", "remove": ["$(x-2)(x-3) = 0$, nên $x"]}]
    assert apply_decisions(messy(), decide(half), [])[0].parts[0].steps == STEPS
    # "Delete everything": only the steps marked as scratch go; the argument stays. Out-of-range steps are ignored.
    everything = [{"step": i, "action": "delete"} for i in range(1, 7)]
    assert apply_decisions(messy(), decide(everything), [])[0].parts[0].steps == [STEPS[0], STEPS[4]]
    # The approach sentence loses only quoted leftovers.
    assert apply_decisions(messy(), {}, ["xyz"])[0].approach_vi == "Đưa về phương trình bậc hai."


async def test_the_solve_shows_the_cleaned_solution(container: Container, provider: ScriptedProvider) -> None:
    def cleaner(request: ChatRequest) -> ChatResult:
        assert "Tuy nhiên, cách đặt này chưa tối ưu" in str(request.messages[-1].content)
        return decisions_reply(DECISIONS)

    provider.edit_reply = cleaner
    provider.push(FORMAL_REPLY)
    provider.push(reply(messy().model_dump()))
    outcome = await orchestrator(container).run_solve(SolveInput("Giải $x^2-5x+6=0$.", ["algebra"], None))
    assert outcome.best is not None and outcome.best.status == "VERIFIED"
    assert outcome.best.solution.parts[0].steps == CLEAN
    assert outcome.best.curriculum is not None and outcome.best.curriculum.status == "COMPLIANT"  # self-talk gone
    entry = next(t for t in outcome.trace if t["state"] == "edit")
    assert entry["parts_edited"] == 1 and entry["steps_removed"] == 2


async def test_an_editor_failure_keeps_the_solution(container: Container, provider: ScriptedProvider) -> None:
    def broken(request: ChatRequest) -> ChatResult:
        raise ProviderError("bad_request", "nope")

    provider.edit_reply = broken
    provider.push(FORMAL_REPLY)
    provider.push(reply(messy().model_dump()))
    outcome = await orchestrator(container).run_solve(SolveInput("Giải $x^2-5x+6=0$.", ["algebra"], None))
    assert outcome.best is not None and outcome.best.solution.parts[0].steps == STEPS
    assert next(t for t in outcome.trace if t["state"] == "edit")["edited"] is False


async def test_each_part_is_decided_on_its_own_and_a_failed_part_keeps_its_text(
        container: Container, provider: ScriptedProvider) -> None:
    """Seen live: a long three-part solution overflowed the editor's output limit when handled whole."""
    def per_part(request: ChatRequest) -> ChatResult:
        if '"label": "b)"' in str(request.messages[-1].content):
            return ChatResult(content='{"parts": [', model=request.model, finish_reason="length", latency_ms=5,
                              usage=Usage(prompt_tokens=500, completion_tokens=3000))
        return decisions_reply(DECISIONS, label="a)")

    provider.edit_reply = per_part
    assert container.gateway is not None
    two = solution({**part("a)"), "steps": STEPS}, {**part("b)"), "steps": STEPS})
    result, cost = await edit_solution(container.gateway, CallContext("edit", None, None), "Bài toán.", two)
    assert result is not None and cost > 0
    assert result.solution.parts[0].steps == CLEAN
    assert result.solution.parts[1].steps == STEPS  # its call was truncated: unchanged
    assert len([r for r in provider.requests if r.schema_name == "edited_solution"]) == 2


def test_deleting_an_argument_nothing_marks_as_scratch_is_refused() -> None:
    """Seen live: a 22-step case check that was the only derivation of the answer was deleted."""
    case_check = ["Gọi $a, b, c$ là số kẹo.", "Từ (1), ta có $b = 96 - a - c$."] + \
        [f"Xét $a = {k}$: $y = \\frac{{{248 - 14 * k}}}{{{96 - 6 * k}}}$." for k in range(1, 9)] + \
        ["So sánh các giá trị, $y$ lớn nhất khi $a = 8$."]
    sol = messy(steps=case_check)
    wipe = [{"step": i, "action": "delete"} for i in range(2, 12)]
    assert apply_decisions(sol, decide(wipe), [])[0].parts[0].steps == case_check
    # A deleted run announced as a re-check, or a repeated formula, is scratch work and goes.
    recheck = ["Ta có $x = 2$.", "Chờ đã, kiểm tra lại:", "Thay $x = 3$: sai.", "Thay $x = 4$: sai.",
               "Thay $x = 5$: sai.", "Lặp lại: $x = 2$.", "Vậy $x = 2$."]
    drop = [{"step": i, "action": "delete"} for i in (2, 3, 4, 5, 6)]
    only_two = solution({**part(final="Vậy $x = 2$."), "steps": recheck})
    assert apply_decisions(only_two, decide(drop), [])[0].parts[0].steps == ["Ta có $x = 2$.", "Vậy $x = 2$."]


def test_a_single_unmarked_justification_step_is_never_deleted() -> None:
    """Seen live: two justification steps of a geometry proof were proposed for deletion among real leftovers."""
    proof = ["Vì $PA \\perp AD$ nên $\\widehat{PAD} = 90^\\circ$.",
             "Do đó $M$ nằm trên tia đối của tia $AD$, nên $\\widehat{BAM} = 180^\\circ - \\widehat{BAD}$.",
             "? Không, ta dùng cách khác.",
             "Suy ra $\\widehat{ABM} = 90^\\circ - \\widehat{DCB}$."]
    proposed = [{"step": 2, "action": "delete"}, {"step": 3, "action": "delete"}]
    assert apply_decisions(messy(steps=proof), decide(proposed), [])[0].parts[0].steps == [proof[0], proof[1],
                                                                                            proof[3]]


def test_a_trim_cuts_only_text_marked_as_scratch_work() -> None:
    """Seen live: a trim proposed to cut "Do đó M nằm trên tia đối của tia AD", the justification of the next step."""
    step = ("Vì $\\widehat{DAB} > 90^\\circ$. Do đó $M$ nằm trên tia đối của tia $AD$. Khi đó "
            "$\\widehat{BAM} = 180^\\circ - \\widehat{BAD}$. Tuy nhiên, cách đặt này chưa tối ưu.")
    proposed = [{"step": 1, "action": "trim", "remove": ["Do đó $M$ nằm trên tia đối của tia $AD$.",
                                                          "Tuy nhiên, cách đặt này chưa tối ưu."]}]
    cleaned = apply_decisions(messy(steps=[step]), decide(proposed), [])[0].parts[0].steps[0]
    assert "tia đối" in cleaned and "chưa tối ưu" not in cleaned


def test_a_derivation_whose_result_is_used_later_stays_even_inside_a_dead_end_run() -> None:
    """Seen live: the corrected derivation of HD/HC sat in a run of dead ends; the kept text used it later."""
    proof = ["Đặt các góc như trên.",
             "Nhận xét: $\\widehat{PDC} = \\widehat{PDA}$? Không, $P$ trong tứ giác.",
             "Trong tam giác vuông: $HD = \\frac{PH}{\\tan \\widehat{PDC}}$, $HC = \\frac{PH}{\\tan \\widehat{PCD}}$.",
             "Vậy $\\frac{HD}{HC} = \\frac{\\tan \\widehat{PCD}}{\\tan \\widehat{PDC}}$.",
             "Mặt khác $\\frac{HD}{HC} = \\frac{\\tan \\widehat{PCD}}{\\tan \\widehat{PDC}}$, điều phải chứng minh."]
    proposed = [{"step": i, "action": "delete"} for i in (2, 3, 4)]
    steps = apply_decisions(messy(steps=proof), decide(proposed), [])[0].parts[0].steps
    assert steps == [proof[0], proof[2], proof[3], proof[4]]  # only the marked dead end goes


def test_the_conclusion_and_the_derivation_of_the_answer_are_never_swept_away() -> None:
    """Seen live: a tail run starting with "Chờ đã, kiểm tra lại" also removed "Vậy … suy ra M = √2026"."""
    steps = ["Ta có $M^2 = \\frac{2026S^2}{S^2}$.", "Chờ đã, kiểm tra lại phép tính.", "Thay lại: đúng.",
             "Vậy $M^2 = 2026$, suy ra $M = \\sqrt{2026}$.", "Thử $a = 1$: $b = 1012$.", "Kết quả đúng."]
    sol = solution({**part(final="Vậy $M = \\sqrt{2026}$."), "steps": steps})
    proposed = [{"step": i, "action": "delete"} for i in range(2, 7)]
    kept = apply_decisions(sol, decide(proposed), [])[0].parts[0].steps
    assert "Chờ đã, kiểm tra lại phép tính." not in kept
    assert "Vậy $M^2 = 2026$, suy ra $M = \\sqrt{2026}$." in kept
