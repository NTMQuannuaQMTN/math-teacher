"""Curriculum policy, verdict rules and the solve orchestrator (scripted model replies, real tool sandbox)."""

from __future__ import annotations

import json
from decimal import Decimal
from typing import Any

import pytest

from app.agents.orchestrator import Orchestrator, SolveInput, SolveState
from app.container import Container
from app.curriculum.policy import check_curriculum, load_policy
from app.providers.base import ChatResult, ProviderError, Usage
from app.solvers.schemas import Formalization, ModelSolution
from app.tools import checks
from app.verification.verdict import verify_solution
from tests.conftest import ScriptedProvider, solve_requests

# --- curriculum ---------------------------------------------------------------------------------------------


@pytest.mark.parametrize(("text", "rule"), [
    ("Xét đạo hàm $f'(x) = 2x - 4$.", "calculus"),
    ("Ta có $\\int_0^1 x\\,dx$.", "calculus"),
    ("Gọi $\\vec{u}$ là véc-tơ chỉ phương.", "vectors"),
    ("Đặt $z = a + bi$ là số phức.", "complex_numbers"),
    ("Tính định thức của ma trận.", "linear_algebra"),
    ("Dùng phép tịnh tiến theo AB.", "geometric_transformations"),
    ("Xét phép vị tự tâm A tỉ số 2.", "geometric_transformations"),
    ("Theo định lí Brocard ta có…", "projective_advanced"),
])
def test_prohibited_methods_fail(text: str, rule: str) -> None:
    report = check_curriculum([text], [], ["algebra", "geometry"])
    assert report.status == "NON_COMPLIANT"
    assert rule in {f.rule_id for f in report.findings}


@pytest.mark.parametrize("text", [
    "Áp dụng bất đẳng thức Cô-si cho hai số dương.",
    "Theo hệ thức Vi-ét, $x_1 + x_2 = 2$.",
    "Xét tam giác Pascal để đếm số cách chọn.",
    "Phần thực hiện phép tính như sau.",
    "Đồ thị hàm số $y = x^2$ là một parabol.",
    "Trục đối xứng của parabol là $x = 0$.",
    "Khoảng cách bằng $\\frac{d}{2}$.",
])
def test_allowed_methods_pass(text: str) -> None:
    assert check_curriculum([text], [], ["algebra", "combinatorics"]).compliant


def test_rotation_is_grade9_recognition_only() -> None:
    """GDPT 2018, lớp 9 "Đa giác đều": phép quay giữ nguyên đa giác đều is taught; as a proof tool it is a warning."""
    report = check_curriculum(["Phép quay thuận chiều $72^{\\circ}$ tâm O biến ngũ giác đều thành chính nó."], [],
                              ["geometry"])
    assert report.compliant and report.status == "COMPLIANT_WITH_WARNINGS"
    assert {f.rule_id for f in report.findings} == {"rotation_tool"}


def test_a_proved_lemma_is_allowed_and_refusing_is_discouraged() -> None:
    """User request: knowledge beyond Grade 9 is proved as a bổ đề with Grade 9 tools, never a reason to give up."""
    from app.solvers import prompts
    report = check_curriculum(["Bổ đề: Nếu MA.MB = MC.MD thì A, B, C, D cùng thuộc một đường tròn. Chứng minh: …"],
                              ["proved_lemma", "similar_triangles"], ["geometry"])
    assert report.status == "COMPLIANT"
    system = prompts.solve_system(load_policy(), ["geometry"], [])
    assert "NEVER a reason to stop" in system and "proved_lemma" in system
    assert "never just because a step needs knowledge beyond the programme" in system


def test_declared_prohibited_technique_fails_even_if_text_is_clean() -> None:
    report = check_curriculum(["Lời giải sạch."], ["calculus"], ["algebra"])
    assert not report.compliant


def test_unknown_declared_technique_is_a_warning() -> None:
    report = check_curriculum(["Lời giải."], ["magic"], ["algebra"])
    assert report.status == "COMPLIANT_WITH_WARNINGS"


def test_style_rules_from_teacher_reviews() -> None:
    report = check_curriculum(["Chờ đã, ta thử lại. Gọi $P = AB \\cap CD$."], [], ["geometry"])
    assert {"self_talk", "set_intersection_geometry"} <= {f.rule_id for f in report.findings}
    assert report.compliant  # style is a warning, not a curriculum violation
    # Geometry-only style rules do not fire for other topics.
    assert "set_intersection_geometry" not in {f.rule_id for f in check_curriculum(
        ["$A \\cap B$"], [], ["combinatorics"]).findings}


def test_self_correction_in_the_write_up_is_flagged() -> None:
    # From a reviewed solution: the model redid step 9 inside the student-facing steps.
    for text in ["Đó là sai lầm trong suy luận nhanh. Hãy tính lại: $n^2 + 2n + 8 \\pmod 3$.",
                 "Nhận xét: ta kiểm tra các trường hợp còn lại. Tuy nhiên, cách nhanh hơn là xét $v_3$.",
                 "Lập luận trên là sai, ta làm lại.",
                 "Hmm, để thử lại với $n = 3$.",
                 # Live output 2026-11-03 (Quảng Nam 2025 Câu 7): a question answered by a retraction.
                 "Ta sử dụng $u^2v+v^2w+w^2u \\le u^2+v^2+w^2$? Không, ta dùng đánh giá trực tiếp.",
                 "Ta có $u^2v \\le \\frac{2}{3}(u^2+v^2)$? Không cần phức tạp.",
                 # Live output 2026-11-03 (HCM 2023 Bài 8): the solver argued with itself.
                 "Tổng bằng $180^\\circ + \\widehat{BAC}$. Điều này không đúng, ta cần xem xét lại.",
                 "Thực ra, $\\widehat{ALH} = \\widehat{AFH}$ là không đúng.",
                 "Mà $\\widehat{ACB} = 90^\\circ$ (sai, $\\widehat{ACB}$ không bằng $90^\\circ$)."]:
        assert "self_talk" in {f.rule_id for f in check_curriculum([text], [], ["number_theory"]).findings}, text
    clean = ["Xét $n^2 + 2n + 8 \\pmod 3$: nếu $n \\equiv 2$ thì $n^2 + 2n + 8 \\equiv 1 \\pmod 3$.",
             "Vậy $n^2 + 2n + 8$ không chia hết cho 3, nên $n + 2 \\vdots 9$.",
             "Các nghiệm phân biệt và không có cặp nào trùng nhau.",  # "và không" is not "à không"
             # Official HDC (Quảng Nam 2025, chuyên Tin): substituting candidate roots back is not self-talk.
             "Thử lại vào phương trình (1), ta được $x = \\frac{25}{11}$ là nghiệm duy nhất.",
             "Vậy điều giả sử là sai, nên $a$ không là số chính phương."]  # official key wording (Thái Nguyên 2022)
    assert check_curriculum(clean, [], ["number_theory"]).findings == []


def test_policy_is_versioned_and_lists_allowed_techniques() -> None:
    policy = load_policy()
    assert policy.version.startswith("curriculum-")
    assert "am_gm" in policy.allowed and "vieta" in policy.allowed
    assert "calculus" in {r.id for r in policy.prohibited}


# --- verdicts -----------------------------------------------------------------------------------------------

async def local_run(name: str, payload: dict[str, Any]) -> dict[str, Any]:
    try:
        return {"ok": True, "result": checks.REGISTRY[name](payload)}
    except Exception as exc:
        return {"ok": False, "error": str(exc)}


def formal(*parts: dict[str, Any]) -> Formalization:
    return Formalization.model_validate({"parts": list(parts)})


def solution(*parts: dict[str, Any], solved: bool = True, techniques: list[str] | None = None) -> ModelSolution:
    return ModelSolution.model_validate({
        "solved": solved, "unsolved_reason_vi": None if solved else "Chưa giải được.",
        "approach_vi": "Đưa về phương trình bậc hai.", "techniques": techniques or ["linear_quadratic_equations"],
        "parts": list(parts)})


def part(label: str = "", kind: str = "solution_set", final: str = "Vậy $x=2$ hoặc $x=3$.",
         solutions: list[dict[str, str]] | None = None, value: str | None = None,
         point: dict[str, str] | None = None) -> dict[str, Any]:
    return {"label": label, "answer_kind": kind, "final_answer_latex": final, "steps": ["Bước 1."],
            "machine_answer": {"solutions": solutions, "value": value, "point": point}}


QUAD = {"label": "", "task": "solve", "template": {"kind": "solutions", "variables": ["x"],
                                                     "equations": ["x^2-5*x+6=0"], "conditions": [], "domain": "real"}}


async def test_correct_answer_is_verified() -> None:
    _, evidence, status = await verify_solution(
        formal(QUAD), solution(part(solutions=[{"x": "2"}, {"x": "3"}])), local_run)
    assert status == "VERIFIED" and evidence[0].strength == "exact"


async def test_wrong_answer_is_incorrect() -> None:
    _, _, status = await verify_solution(formal(QUAD), solution(part(solutions=[{"x": "2"}])), local_run)
    assert status == "INCORRECT"


async def test_missing_machine_answer_is_unverified() -> None:
    verdicts, _, status = await verify_solution(formal(QUAD), solution(part(solutions=None)), local_run)
    assert status == "UNVERIFIED" and "chưa nêu" in verdicts[0].reason_vi


async def test_variable_name_mismatch_is_unverified() -> None:
    _, _, status = await verify_solution(formal(QUAD), solution(part(solutions=[{"y": "2"}, {"y": "3"}])), local_run)
    assert status == "UNVERIFIED"


async def test_no_template_and_no_formalization_are_unverified() -> None:
    geometry = {"label": "", "task": "prove", "template": None}
    _, _, status = await verify_solution(formal(geometry), solution(part(kind="proof")), local_run)
    assert status == "UNVERIFIED"
    _, _, status = await verify_solution(None, solution(part(solutions=[{"x": "2"}, {"x": "3"}])), local_run)
    assert status == "UNVERIFIED"


async def test_unsolved() -> None:
    _, _, status = await verify_solution(formal(QUAD), solution(solved=False), local_run)
    assert status == "UNSOLVED"


async def test_proof_is_at_most_partially_verified_and_refuted_statement_is_unverified() -> None:
    ineq = {"label": "", "task": "prove", "template": {
        "kind": "inequality", "variables": ["a", "b"], "statement": "1/a+1/b>=2",
        "conditions": ["a>0", "b>0", "a+b=2"], "positive": True, "domain": "real"}}
    _, _, status = await verify_solution(formal(ineq), solution(part(kind="proof", point={"a": "1", "b": "1"})),
                                         local_run)
    assert status == "PARTIALLY_VERIFIED"
    divisible = {"label": "", "task": "prove", "template": {
        "kind": "divisibility", "variables": ["n"], "expression": "n^3-n", "divisor": "6", "conditions": [],
        "domain": "integer"}}
    _, evidence, status = await verify_solution(formal(divisible), solution(part(kind="proof")), local_run)
    assert evidence[0].strength == "exhaustive" and status == "PARTIALLY_VERIFIED"
    false_statement = {**ineq, "template": {**ineq["template"], "statement": "1/a+1/b>=3"}}
    _, _, status = await verify_solution(formal(false_statement), solution(part(kind="proof")), local_run)
    assert status == "UNVERIFIED"


async def test_multi_part_worst_status_wins_and_missing_part_is_unsolved() -> None:
    value = {"label": "b)", "task": "compute", "template": {"kind": "value", "variables": [], "expression": "2+2",
                                                             "relations": []}}
    form = formal({**QUAD, "label": "a)"}, value)
    good = solution(part("a)", solutions=[{"x": "2"}, {"x": "3"}]), part("b)", "value", "Bằng $4$.", value="4"))
    _, _, status = await verify_solution(form, good, local_run)
    assert status == "VERIFIED"
    wrong_b = solution(part("a)", solutions=[{"x": "2"}, {"x": "3"}]), part("b)", "value", "Bằng $5$.", value="5"))
    verdicts, _, status = await verify_solution(form, wrong_b, local_run)
    assert status == "INCORRECT" and [v.status for v in verdicts] == ["VERIFIED", "INCORRECT"]
    missing_b = solution(part("a)", solutions=[{"x": "2"}, {"x": "3"}]))
    _, _, status = await verify_solution(form, missing_b, local_run)
    assert status == "UNSOLVED"


async def test_displayed_answer_must_match_verified_integer() -> None:
    count = {"label": "", "task": "count", "template": {"kind": "count", "ranges": {"a": [1, 9], "b": [0, 9]},
                                                         "conditions": ["a+b=10"], "distinct": False, "ordered": True}}
    _, _, status = await verify_solution(formal(count), solution(part(kind="count", final="Có $9$ số.", value="9")),
                                         local_run)
    assert status == "VERIFIED"
    verdicts, _, status = await verify_solution(
        formal(count), solution(part(kind="count", final="Có $90$ số.", value="9")), local_run)
    assert status == "PARTIALLY_VERIFIED" and "không khớp" in verdicts[0].reason_vi


# --- orchestrator -------------------------------------------------------------------------------------------

def reply(obj: dict[str, Any]) -> str:
    return json.dumps(obj, ensure_ascii=False)


FORMAL_REPLY = reply({"parts": [QUAD]})
GOOD = reply(solution(part(solutions=[{"x": "2"}, {"x": "3"}])).model_dump())
WRONG = reply(solution(part(solutions=[{"x": "2"}], final="Vậy $x=2$.")).model_dump())
NON_COMPLIANT = reply({**solution(part(solutions=[{"x": "2"}, {"x": "3"}])).model_dump(),
                       "approach_vi": "Xét đạo hàm của hàm số."})


def solver_calls(provider: ScriptedProvider) -> list[Any]:
    """The solver's own requests (not formalization, hints or the examiner)."""
    return [r for r in provider.requests if r.schema_name == "solution"]


def orchestrator(c: Container, **kwargs: Any) -> Orchestrator:
    assert c.gateway is not None
    return Orchestrator(c.gateway, run=local_run, **kwargs)


async def test_orchestrator_happy_path(container: Container, provider: ScriptedProvider) -> None:
    provider.push(FORMAL_REPLY)
    provider.push(GOOD)
    outcome = await orchestrator(container).run_solve(SolveInput("Giải $x^2-5x+6=0$.", ["algebra"], None))
    assert outcome.state == SolveState.DONE and outcome.attempts == 1
    assert outcome.best is not None and outcome.best.status == "VERIFIED"
    assert outcome.best.curriculum is not None and outcome.best.curriculum.status == "COMPLIANT"
    assert [t["state"] for t in outcome.trace] == ["classify", "formalize", "solve", "verify", "curriculum",
                                                   "critique", "hints"]
    assert [r.model for r in solve_requests(provider)] == ["fast-test", "reason-test"]  # topics given: no classify
    assert len(outcome.hints) == 3 and outcome.hints[0].level == "concept"
    # The solver sees variable names, never the independent template.
    system = provider.requests[1].messages[0].content
    assert isinstance(system, str) and "x^2-5*x+6=0" not in system and ": x." in system
    assert outcome.cost_sgd > 0


async def test_orchestrator_revises_a_wrong_answer_with_tool_feedback(container: Container,
                                                                     provider: ScriptedProvider) -> None:
    provider.push(FORMAL_REPLY)
    provider.push(WRONG)
    provider.push(GOOD)
    outcome = await orchestrator(container).run_solve(SolveInput("Giải $x^2-5x+6=0$.", ["algebra"], None))
    assert outcome.attempts == 2 and outcome.best is not None and outcome.best.status == "VERIFIED"
    revision = [r for r in provider.requests if r.schema_name == "solution"][1].messages[-1].content
    assert isinstance(revision, str) and "Thiếu nghiệm" in revision


async def test_orchestrator_revises_non_compliant_methods(container: Container, provider: ScriptedProvider) -> None:
    provider.push(FORMAL_REPLY)
    provider.push(NON_COMPLIANT)
    provider.push(GOOD)
    outcome = await orchestrator(container).run_solve(SolveInput("Giải $x^2-5x+6=0$.", ["algebra"], None))
    assert outcome.best is not None and outcome.best.curriculum is not None
    assert outcome.best.curriculum.compliant and outcome.attempts == 2
    revision = [r for r in provider.requests if r.schema_name == "solution"][1].messages[-1].content
    assert isinstance(revision, str) and "ngoài chương trình" in revision


async def test_orchestrator_bounds_revisions_and_keeps_best(container: Container, provider: ScriptedProvider) -> None:
    provider.push(FORMAL_REPLY)
    for _ in range(5):
        provider.push(WRONG)
    outcome = await orchestrator(container, max_revisions=2).run_solve(
        SolveInput("Giải $x^2-5x+6=0$.", ["algebra"], None))
    assert outcome.attempts == 3  # first attempt + 2 revisions
    assert outcome.best is not None and outcome.best.status == "INCORRECT"


async def test_orchestrator_respects_question_budget(container: Container, provider: ScriptedProvider) -> None:
    provider.push(FORMAL_REPLY)
    for _ in range(5):
        provider.push(WRONG)
    outcome = await orchestrator(container, question_budget_sgd=Decimal("0.000001")).run_solve(
        SolveInput("Giải $x^2-5x+6=0$.", ["algebra"], None))
    assert outcome.attempts == 1
    assert any(t.get("skipped") == "question_budget" for t in outcome.trace)


async def test_orchestrator_classifies_only_when_topics_missing(container: Container,
                                                                provider: ScriptedProvider) -> None:
    provider.push(reply({"topics": ["algebra"]}))
    provider.push(FORMAL_REPLY)
    provider.push(GOOD)
    outcome = await orchestrator(container).run_solve(SolveInput("Giải $x^2-5x+6=0$.", [], None))
    assert outcome.topics == ["algebra"] and len(solve_requests(provider)) == 3


async def test_formalization_failure_still_returns_an_unverified_solution(container: Container,
                                                                          provider: ScriptedProvider) -> None:
    provider.push("not json")
    provider.push("still not json")
    provider.push(GOOD)
    outcome = await orchestrator(container).run_solve(SolveInput("Giải $x^2-5x+6=0$.", ["algebra"], None))
    assert outcome.formalization is None
    assert outcome.best is not None and outcome.best.status == "UNVERIFIED"


async def test_solver_failure_escalates_then_is_reported(container: Container, provider: ScriptedProvider) -> None:
    provider.push(FORMAL_REPLY)
    for _ in range(8):
        provider.push("garbage")
    outcome = await orchestrator(container).run_solve(SolveInput("Giải $x^2-5x+6=0$.", ["algebra"], None))
    assert outcome.state == SolveState.FAILED and outcome.error_code == "invalid_model_output"
    solve_requests = solver_calls(provider)
    # Each try + its JSON repair: plain, reasoning, then a plain retry while nothing usable exists (max_revisions=2).
    assert [r.thinking for r in solve_requests] == [False, False, True, False, False, False]
    assert outcome.cost_sgd > 0  # failed calls are still counted


async def test_wrong_answer_escalates_to_thinking_once(container: Container, provider: ScriptedProvider) -> None:
    provider.push(FORMAL_REPLY)
    provider.push(WRONG)
    provider.push(WRONG)
    provider.push(GOOD)
    outcome = await orchestrator(container, max_revisions=2).run_solve(
        SolveInput("Giải $x^2-5x+6=0$.", ["algebra"], None))
    solve_requests = solver_calls(provider)
    assert [r.thinking for r in solve_requests] == [False, True, False]
    assert solve_requests[1].max_tokens == 12000 and solve_requests[1].timeout_seconds == 300
    assert outcome.best is not None and outcome.best.status == "VERIFIED"


def test_geometry_tiers_fall_back_to_the_reasoning_model(container: Container) -> None:
    from app.providers.catalog import ModelCatalog
    assert container.gateway is not None
    catalog = container.gateway.catalog
    assert catalog.for_tier("geometry_formalize").id == catalog.for_tier("reasoning").id == "reason-test"
    routed = ModelCatalog.model_validate({**catalog.model_dump(), "routing": {
        **catalog.routing, "geometry_reasoning": "fast-test"}})
    assert routed.for_tier("geometry_reasoning").id == "fast-test"  # a stronger model is one config line away


GEO_PROOF = reply(solution(part(kind="proof", final="Vậy tứ giác $ABCD$ nội tiếp.", solutions=None),
                           techniques=["cyclic_quadrilateral"]).model_dump())


async def test_geometry_uses_the_reasoning_model_with_thinking_first(container: Container,
                                                                    provider: ScriptedProvider) -> None:
    """User request: harder models for geometry figures and proofs."""
    provider.push(reply({"parts": [{"label": "", "task": "prove", "template": None}]}))
    provider.push(reply({"parts": [{"label": "", "task": "prove", "template": None}]}))  # the figure repair round
    provider.push(GEO_PROOF)
    await orchestrator(container, geometry_thinking_first=True).run_solve(
        SolveInput("Chứng minh tứ giác ABCD nội tiếp.", ["geometry"], None))
    formalize = next(r for r in provider.requests if r.schema_name == "formalization")
    solve = next(r for r in provider.requests if r.schema_name == "solution")
    assert formalize.model == "reason-test" and solve.model == "reason-test"
    assert solve.thinking is True


async def test_a_failed_geometry_reasoning_call_falls_back_to_one_plain_attempt(container: Container,
                                                                                provider: ScriptedProvider) -> None:
    from app.providers.base import ProviderError
    provider.push(reply({"parts": [{"label": "", "task": "prove", "template": None}]}))
    provider.push(reply({"parts": [{"label": "", "task": "prove", "template": None}]}))  # the figure repair round
    provider.push(ProviderError("timeout", "slow"))
    provider.push(GEO_PROOF)
    outcome = await orchestrator(container, geometry_thinking_first=True).run_solve(
        SolveInput("Chứng minh tứ giác ABCD nội tiếp.", ["geometry"], None))
    assert [r.thinking for r in provider.requests if r.schema_name == "solution"] == [True, False]
    assert outcome.best is not None and outcome.best.solution.solved


def critique(*issues: tuple[str, int | None, str, str]) -> str:
    return reply({"verdict": "has_issues" if issues else "correct", "confidence": 0.8, "issues": [
        {"part": p, "step": st, "severity": sev, "explanation_vi": ex} for p, st, sev, ex in issues]})


async def test_the_examiner_finds_a_mistake_and_the_solver_fixes_it(container: Container,
                                                                   provider: ScriptedProvider) -> None:
    """User request: one agent solves, another checks for mistakes, and the solution is fixed until it is clean."""
    provider.critique_reply = None
    provider.push(FORMAL_REPLY)
    provider.push(GOOD)
    provider.push(critique(("", 1, "gap", "Chưa giải thích vì sao phân tích được thành $(x-2)(x-3)$.")))
    provider.push(GOOD)
    provider.push(critique())
    outcome = await orchestrator(container).run_solve(SolveInput("Giải $x^2-5x+6=0$.", ["algebra"], None))
    solves = [r for r in provider.requests if r.schema_name == "solution"]
    assert len(solves) == 2 and len([r for r in provider.requests if r.schema_name == "critique"]) == 2
    revision = solves[1].messages[-1].content
    assert isinstance(revision, str) and "Giám khảo: Thiếu lập luận (bước 1)" in revision
    assert [t.get("verdict") for t in outcome.trace if t["state"] == "critique"] == ["has_issues", "correct"]
    assert outcome.best is not None and outcome.best.status == "VERIFIED"
    assert outcome.best.critique is not None and outcome.best.critique.verdict == "correct"


async def test_a_flawed_proof_does_not_beat_an_honest_unsolved_attempt(container: Container,
                                                                       provider: ScriptedProvider) -> None:
    from app.agents.critic import Critique
    from app.agents.orchestrator import Attempt
    flawed = Attempt(solution(part(kind="proof", solutions=None)), [], [], "UNVERIFIED", None,
                     Critique.model_validate({"verdict": "has_issues", "confidence": 0.9, "issues": [{
                         "part": "", "step": 2, "severity": "error", "explanation_vi": "Kết luận không suy ra."}]}))
    honest = Attempt(solution(solved=False), [], [], "UNSOLVED", None)
    assert honest.score() > flawed.score()


async def test_remaining_examiner_errors_are_shown_and_downgrade_verified(container: Container,
                                                                          provider: ScriptedProvider) -> None:
    provider.critique_reply = critique(("", 2, "error", "Bước 2 chia hai vế cho $x$ mà chưa xét $x = 0$."))
    provider.push(FORMAL_REPLY)
    for _ in range(4):
        provider.push(GOOD)
    outcome = await orchestrator(container, max_revisions=1).run_solve(
        SolveInput("Giải $x^2-5x+6=0$.", ["algebra"], None))
    best = outcome.best
    assert best is not None and best.status == "PARTIALLY_VERIFIED"
    assert "Kiểm tra chéo còn phát hiện: Sai (bước 2)" in best.verdicts[0].reason_vi


async def test_a_solver_stuck_in_a_loop_is_caught_without_any_model(container: Container,
                                                                    provider: ScriptedProvider) -> None:
    from app.agents.orchestrator import repeated_steps
    loop = "Ta có $\\widehat{ALH} = \\widehat{ACH}$ và $\\widehat{AFH} = 90^\\circ$, không bằng nhau."
    looping = solution(part(kind="proof", solutions=None, final="Vậy tứ giác nội tiếp."))
    stuck = looping.parts[0].model_copy(update={"steps": ["Bước đầu.", loop, loop, loop]})
    looping = looping.model_copy(update={"parts": [stuck]})
    assert repeated_steps(looping) and "bước 3, bước 4" in repeated_steps(looping)[0]
    assert repeated_steps(solution(part())) == []
    provider.push(FORMAL_REPLY)
    provider.push(reply(looping.model_dump()))
    provider.push(GOOD)
    outcome = await orchestrator(container).run_solve(SolveInput("Giải $x^2-5x+6=0$.", ["algebra"], None))
    revision = solver_calls(provider)[1].messages[-1].content
    assert isinstance(revision, str) and "lặp lại nguyên văn" in revision
    assert outcome.best is not None and outcome.best.status == "VERIFIED" and not outcome.best.defects


async def test_geometry_revisions_stay_plain_and_fast(container: Container, provider: ScriptedProvider) -> None:
    provider.critique_reply = None
    provider.push(reply({"parts": [{"label": "", "task": "prove", "template": None}]}))
    provider.push(GEO_PROOF)
    provider.push(critique(("", 2, "error", "Hai góc này không bằng nhau.")))
    provider.push(GEO_PROOF)
    provider.push(critique())
    await orchestrator(container).run_solve(SolveInput("Chứng minh tứ giác ABCD nội tiếp.", ["geometry"], None))
    assert [r.thinking for r in solver_calls(provider)] == [False, False]


async def test_a_failed_reasoning_revision_falls_back_to_a_plain_one(container: Container,
                                                                     provider: ScriptedProvider) -> None:
    from app.providers.base import ProviderError
    provider.push(FORMAL_REPLY)
    provider.push(WRONG)
    provider.push(ProviderError("timeout", "slow"))
    provider.push(GOOD)
    outcome = await orchestrator(container).run_solve(SolveInput("Giải $x^2-5x+6=0$.", ["algebra"], None))
    assert [r.thinking for r in solver_calls(provider)] == [False, True, False]
    assert outcome.best is not None and outcome.best.status == "VERIFIED"


async def test_an_unavailable_examiner_does_not_block_the_solve(container: Container,
                                                                provider: ScriptedProvider) -> None:
    provider.critique_reply = "not json"
    provider.push(FORMAL_REPLY)
    provider.push(GOOD)
    outcome = await orchestrator(container).run_solve(SolveInput("Giải $x^2-5x+6=0$.", ["algebra"], None))
    assert outcome.best is not None and outcome.best.status == "VERIFIED" and outcome.attempts == 1
    assert [t.get("verdict") for t in outcome.trace if t["state"] == "critique"] == ["unavailable"]


async def test_style_only_feedback_does_not_escalate(container: Container, provider: ScriptedProvider) -> None:
    styled = reply({**solution(part(solutions=[{"x": "2"}, {"x": "3"}])).model_dump(),
                    "approach_vi": "Chờ đã, ta giải lại."})
    provider.push(FORMAL_REPLY)
    provider.push(styled)
    provider.push(GOOD)
    await orchestrator(container).run_solve(SolveInput("Giải $x^2-5x+6=0$.", ["algebra"], None))
    assert [r.thinking for r in solver_calls(provider)] == [False, False]


async def test_restricted_budget_degrades_to_fast_model(container: Container, provider: ScriptedProvider) -> None:
    await container.budget.reserve(amount_sgd=Decimal("9.2"), purpose="x", provider="soclaas", model="m",
                                   tier="fast", user_id=None)
    provider.push(FORMAL_REPLY)
    provider.push(GOOD)
    outcome = await orchestrator(container).run_solve(SolveInput("Giải $x^2-5x+6=0$.", ["algebra"], None))
    assert outcome.best is not None and outcome.best.status == "VERIFIED"
    assert [r.model for r in solve_requests(provider)] == ["fast-test", "fast-test"]
    assert any(t.get("degraded") == "budget_restricted" for t in outcome.trace)


def test_template_errors_and_dropping() -> None:
    from app.verification.verdict import drop_invalid_templates, template_errors
    bad = formal({"label": "a)", "task": "solve", "template": {"kind": "solutions", "variables": ["x"],
                                                                "equations": ["x^2=4"], "conditions": ["x in integer"],
                                                                "domain": "real"}},
                 {**QUAD, "label": "b)"})
    problems = template_errors(bad)
    assert len(problems) == 1 and "x in integer" in problems[0]
    cleaned = drop_invalid_templates(bad)
    assert cleaned.parts[0].template is None and cleaned.parts[1].template is not None


async def test_optimum_point_with_wrong_variable_names_is_unverified() -> None:
    ext = {"label": "", "task": "extremum", "template": {"kind": "extremum", "variables": ["a", "b"],
                                                          "objective": "a+b", "sense": "max",
                                                          "conditions": ["a+b<=10"], "positive": True,
                                                          "domain": "real"}}
    verdicts, _, status = await verify_solution(formal(ext), solution(part(kind="extremum", value="10",
                                                                          point={"x": "5", "y": "5"})), local_run)
    assert status == "UNVERIFIED" and "không khớp" in verdicts[0].reason_vi


async def test_invalid_formalization_gets_one_repair(container: Container, provider: ScriptedProvider) -> None:
    broken = {"parts": [{**QUAD, "template": {**QUAD["template"], "conditions": ["x in integer"]}}]}
    provider.push(reply(broken))
    provider.push(FORMAL_REPLY)
    provider.push(GOOD)
    outcome = await orchestrator(container).run_solve(SolveInput("Giải $x^2-5x+6=0$.", ["algebra"], None))
    assert outcome.best is not None and outcome.best.status == "VERIFIED"
    repair_prompt = provider.requests[1].messages[-1].content
    assert isinstance(repair_prompt, str) and "x in integer" in repair_prompt
    assert any(t.get("repaired") for t in outcome.trace)


async def test_unrepairable_formalization_part_is_dropped_not_guessed(container: Container,
                                                                     provider: ScriptedProvider) -> None:
    broken = reply({"parts": [{**QUAD, "template": {**QUAD["template"], "conditions": ["x in integer"]}}]})
    provider.push(broken)
    provider.push(broken)
    provider.push(GOOD)
    outcome = await orchestrator(container).run_solve(SolveInput("Giải $x^2-5x+6=0$.", ["algebra"], None))
    assert outcome.formalization is not None and outcome.formalization.parts[0].template is None
    assert outcome.best is not None and outcome.best.status == "UNVERIFIED"



async def test_failed_formalization_repair_keeps_the_valid_parts(container: Container,
                                                                provider: ScriptedProvider) -> None:
    """Live failure: the repair of a long reply hit the output limit, and the whole formalization was lost."""
    broken = {"label": "b)", "task": "solve", "template": {**QUAD["template"], "conditions": ["x in integer"]}}
    provider.push(reply({"parts": [{**QUAD, "label": "a)"}, broken]}))
    provider.push(lambda r: ChatResult(content='{"parts": [', model=r.model, finish_reason="length", latency_ms=5,
                                       usage=Usage(prompt_tokens=200, completion_tokens=6000)))
    outcome = await orchestrator(container).figure_only(SolveInput("Giải $x^2-5x+6=0$.", ["algebra"], None))
    assert outcome.formalization is not None
    assert [p.template is not None for p in outcome.formalization.parts] == [True, False]
    assert outcome.trace[-1]["repair_error"] == "invalid_model_output" and outcome.cost_sgd > 0


async def test_a_malformed_part_costs_only_its_own_template(container: Container, provider: ScriptedProvider) -> None:
    """Live failure: one relation listed as an object (or an over-long id) failed the whole formalization."""
    bad = {"label": "b)", "task": "prove", "template": {"kind": "geometry", "spec": {
        "objects": [{"kind": "free_point", "id": "A"}, {"kind": "on_circle", "id": "F_on_w", "point": "A"}]}}}
    provider.push(reply({"parts": [{**QUAD, "label": "a)"}, bad]}))
    provider.push(reply({"parts": [{**QUAD, "label": "a)"}, bad]}))
    outcome = await orchestrator(container).figure_only(SolveInput("Giải $x^2-5x+6=0$.", ["algebra"], None))
    assert outcome.formalization is not None
    assert [(p.label, p.template is not None) for p in outcome.formalization.parts] == [("a)", True), ("b)", False)]
    repair_prompt = provider.requests[1].messages[-1].content
    assert isinstance(repair_prompt, str) and "part 'b)': does not match the schema" in repair_prompt
    assert "on_circle" in repair_prompt
    schema_prompt = str(provider.requests[0].messages)
    assert "point_on_circle" in schema_prompt  # the model still sees the strict schema


async def test_no_revision_is_started_past_the_time_budget(container: Container, provider: ScriptedProvider) -> None:
    provider.push(FORMAL_REPLY)
    provider.push(WRONG)
    provider.delay = 0.05
    outcome = await orchestrator(container, time_budget_seconds=0.01).run_solve(
        SolveInput("Giải $x^2-5x+6=0$.", ["algebra"], None))
    assert len(solver_calls(provider)) == 1
    assert any(t.get("skipped") == "time_budget" for t in outcome.trace)


async def test_thinking_needs_time_and_revisions_are_not_retried(container: Container,
                                                                 provider: ScriptedProvider) -> None:
    # Too little time left for a ~5 minute thinking call: a plain revision instead, and its timeout is final.
    provider.push(FORMAL_REPLY)
    provider.push(WRONG)
    provider.push(ProviderError("timeout", "slow"))
    outcome = await orchestrator(container, time_budget_seconds=200).run_solve(
        SolveInput("Giải $x^2-5x+6=0$.", ["algebra"], None))
    assert [r.thinking for r in solver_calls(provider)] == [False, False]
    assert outcome.best is not None and outcome.best.status == "INCORRECT"


async def test_hints_that_leak_the_answer_are_regenerated_then_dropped(container: Container,
                                                                      provider: ScriptedProvider) -> None:
    leaky = reply({"hints": [{"level": "concept", "text_vi": "Phân tích thành nhân tử."},
                             {"level": "key_step", "text_vi": "Ta được $x = 2$ hoặc $x = 3$."}]})
    provider.hints_reply = None  # script hint replies explicitly
    provider.push(FORMAL_REPLY)
    provider.push(GOOD)
    provider.push(leaky)
    provider.push(leaky)
    outcome = await orchestrator(container).run_solve(SolveInput("Giải $x^2-5x+6=0$.", ["algebra"], None))
    assert [h.text_vi for h in outcome.hints] == ["Phân tích thành nhân tử."]
    hint_calls = [r for r in provider.requests if r.schema_name == "hints"]
    assert len(hint_calls) == 2
    retry = hint_calls[1].messages[-1].content
    assert isinstance(retry, str) and "x = 2" in retry
    assert any(t.get("dropped") == 1 for t in outcome.trace)


async def test_no_hints_for_incorrect_or_unsolved(container: Container, provider: ScriptedProvider) -> None:
    provider.push(FORMAL_REPLY)
    for _ in range(4):
        provider.push(WRONG)
    outcome = await orchestrator(container, max_revisions=1).run_solve(
        SolveInput("Giải $x^2-5x+6=0$.", ["algebra"], None))
    assert outcome.best is not None and outcome.best.status == "INCORRECT" and outcome.hints == []


def test_leak_detection_patterns() -> None:
    from app.solvers.schemas import Hint
    from app.tutoring.hints import find_leaks
    value_solution = solution(part(kind="value", final="Vậy $P = \\frac{4}{201}$.", value="4/201"))
    hints = [Hint(level="key_step", text_vi="Xác suất là $\\frac{4}{201}$."),
             Hint(level="concept", text_vi="Tập $S$ có $201$ phần tử."),
             Hint(level="observation", text_vi="Xét $4/2010$.")]
    assert find_leaks(hints, value_solution) == {0: ["4/201"]}
    digit_solution = solution(part(kind="value", final="Vậy giá trị bằng $6$.", value="6"))
    assert find_leaks([Hint(level="concept", text_vi="Đây là phương trình bậc 2 với 6 số hạng.")], digit_solution) == {}
    assert find_leaks([Hint(level="key_step", text_vi="Ta tính được tổng bằng 6.")], digit_solution) == {0: ["6"]}
