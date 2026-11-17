"""Deterministic presentation checks that ask for a revision."""

from __future__ import annotations

from typing import Any

from app.solvers.schemas import ModelSolution
from app.verification.style import degree_notes

# Steps of the live solution (2026-11-13) that expanded to degree 4 instead of lowering the degree first.
LIVE_STEPS = [
    "Theo định lí Vi-ét, ta có $x_1 + x_2 = 2(m+1)$, $x_1x_2 = 2m$.",
    "Ta có $x_1^4 + x_2^4 = (x_1^2 + x_2^2)^2 - 2x_1^2x_2^2 = 16(m^2 + m + 1)^2 - 8m^2$.",
    "Ta có $16(m^2 + m + 1)^2 = 16m^4 + 32m^3 + 48m^2 + 32m + 16$.",
    "Do đó $H = 16m^4 + 32m^3 + 40m^2 + 32m + \\frac{23}{2}$.",
]
LOW_DEGREE = [
    "Ta có $x_1^2 + x_2^2 = 4(m^2 + m + 1) = 4\\left(m + \\frac{1}{2}\\right)^2 + 3 \\ge 3$.",
    "Áp dụng $a^2 + b^2 \\ge \\frac{(a+b)^2}{2}$: $x_1^4 + x_2^4 \\ge \\frac{(x_1^2 + x_2^2)^2}{2} \\ge \\frac{9}{2}$.",
]


def solution(steps: list[str], final: str = "Vậy $x_1^4 + x_2^4 > \\frac{9}{2}$.", kind: str = "proof") -> Any:
    return ModelSolution.model_validate({
        "solved": True, "unsolved_reason_vi": None, "approach_vi": "x", "techniques": [],
        "parts": [{"label": "b)", "answer_kind": kind, "final_answer_latex": final,
                   "machine_answer": {"solutions": None, "value": None, "point": None}, "steps": steps}]})


def test_a_degree_four_expansion_in_an_inequality_gets_a_lower_the_degree_note() -> None:
    notes = degree_notes(solution(LIVE_STEPS))
    assert len(notes) == 1 and "ý b) bước 3, 4" in notes[0] and "$m$" in notes[0] and "Cô-si" in notes[0]


def test_lowering_the_degree_first_and_quartic_equations_pass() -> None:
    assert degree_notes(solution(LOW_DEGREE)) == []  # x_1^4 is the problem's own expression, not an expansion
    quartic = ["Ta có $x^4 - 5x^2 + 4 = 0 \\Leftrightarrow (x^2 - 1)(x^2 - 4) = 0$."]
    assert degree_notes(solution(quartic, final="Vậy $x \\in \\{\\pm 1; \\pm 2\\}$.", kind="solution_set")) == []
    assert degree_notes(solution(["$m^4 + m^2 = 2$"], final="Vậy $m = 1$.", kind="value")) == []  # no inequality


def test_angles_named_by_greek_letters_get_a_note_and_direct_relations_pass() -> None:
    from app.verification.style import angle_letter_notes

    seen_live = ["Gọi $\\widehat{BAC} = \\alpha, \\widehat{ABC} = \\beta, \\widehat{ACB} = \\gamma$. Vì "
                 "$\\widehat{ADC} = 180^\\circ - \\beta$ và $\\widehat{ADB} = 180^\\circ - \\gamma$.",
                 "Suy ra $\\widehat{BDC} = \\alpha$."]
    notes = angle_letter_notes(solution(seen_live, final="Vậy tứ giác nội tiếp."))
    assert len(notes) == 1 and "ý b) bước 1" in notes[0] and "180^\\circ - \\widehat{ABC}" in notes[0]
    assert angle_letter_notes(solution(["Gọi góc BAC = α."], final="Vậy …"))
    direct = ["$\\widehat{ADC} = 180^\\circ - \\widehat{ABC}$ (tứ giác $ABCD$ nội tiếp).",
              "$\\widehat{ADB} = \\widehat{ACB}$ (cùng chắn cung $AB$).", "Biệt thức $\\Delta = 4m^2 + 4 > 0$."]
    assert angle_letter_notes(solution(direct, final="Vậy …")) == []


def test_equations_between_sets_get_a_note_but_membership_and_solution_sets_pass() -> None:
    from app.verification.style import set_equation_notes

    seen_live = ["Đặt $x = b + c, y = c + d, z = d + a$. Theo (iii), $\\{x, y, z\\} = \\{1, 2, 3\\}$.",
                 "Ta có $x + z = y$.", "Vì $y$ bằng tổng của $x$ và $z$, nên $y = 3$ và $\\{x, z\\} = \\{1, 2\\}$."]
    notes = set_equation_notes(solution(seen_live, final="Vậy …"))
    assert len(notes) == 1 and "ý b) bước 1, 3" in notes[0] and "x \\\\in" not in notes[0]
    fine = ["Ta có $x \\in \\{1; 2; 3\\}$.", "Vậy tập nghiệm của phương trình là $S = \\{1; 2\\}$."]
    assert set_equation_notes(solution(fine, final="Vậy $S = \\{1; 2\\}$.")) == []
