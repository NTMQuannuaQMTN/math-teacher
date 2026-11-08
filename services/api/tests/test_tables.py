"""Residue tables in solutions are recomputed cell by cell (deterministic, no model)."""

from __future__ import annotations

from app.solvers.schemas import ModelSolution
from app.verification.tables import check_table, table_defects

LIVE = (r"\hline n \pmod 9 & 0 & 1 & 2 & 3 & 4 & 5 & 6 & 7 & 8 \\ "
        r"\hline A = n+2 \pmod 9 & 2 & 3 & 4 & 5 & 6 & 7 & 8 & 0 & 1 \\ "
        r"\hline B = n^2+4n+8 \pmod 9 & 8 & 4 & 2 & 2 & 4 & 8 & 5 & {b7} & 5 \\ "
        r"\hline A \cdot B \pmod 9 & 7 & 3 & 8 & 1 & 6 & 2 & 4 & 0 & 5 \\ \hline")


def test_the_wrong_cell_seen_live_is_found_and_a_correct_table_passes() -> None:
    wrong = check_table(LIVE.replace("{b7}", "8"))
    assert len(wrong) == 1 and "n \\equiv 7" in wrong[0] and "phải là $4$" in wrong[0]
    assert check_table(LIVE.replace("{b7}", "4")) == []


def test_rows_with_their_own_modulus_negative_cells_and_unreadable_rows() -> None:
    body = (r"n \bmod 3 & 0 & 1 & 2 \\ \hline n^2 \pmod{3} & 0 & 1 & 1 \\ n^3 - n (\text{mod } 3) & 0 & 0 & 0 \\ "
            r"f(n) \pmod 3 & 9 & 9 & 9 \\ 2n \pmod 3 & 0 & -1 & 1 \\")
    assert check_table(body) == []  # f(n) is unknown: skipped; -1 ≡ 2
    assert check_table(r"x & 1 & 2 \\ x^2 & 1 & 4 \\") == []  # no modulus: not a residue table


def test_defects_name_the_part_and_step() -> None:
    step = f"$$\\begin{{array}}{{|c|c|c|c|c|c|c|c|c|c|}}{LIVE.replace('{b7}', '8')}\\end{{array}}$$"
    solution = ModelSolution.model_validate({
        "solved": True, "unsolved_reason_vi": None, "approach_vi": "Xét số dư.", "techniques": [],
        "parts": [{"label": "c)", "answer_kind": "other", "final_answer_latex": "…",
                   "machine_answer": {"solutions": None, "value": None, "point": None},
                   "steps": ["Xét $n$ theo modulo $9$:", step]}]})
    defects = table_defects(solution)
    assert len(defects) == 1 and defects[0].startswith("Bảng ở ý c) bước 2 có ô tính sai")


def _solution(steps: list[str]) -> ModelSolution:
    return ModelSolution.model_validate({
        "solved": True, "unsolved_reason_vi": None, "approach_vi": "x", "techniques": [],
        "parts": [{"label": "b)", "answer_kind": "other", "final_answer_latex": "x",
                   "machine_answer": {"solutions": None, "value": None, "point": None}, "steps": steps}]})


def test_cases_written_line_by_line_get_a_presentation_note() -> None:
    from app.verification.tables import case_list_notes

    seen_live = ["Xét 3 trường hợp:", "TH1: $n \\equiv 0 \\pmod 3$. …", "TH2: $n \\equiv 1 \\pmod 3$. …",
                 "TH3: $n \\equiv 2 \\pmod 3$. …", "Vậy …"]
    notes = case_list_notes(_solution(seen_live))
    assert len(notes) == 1 and "bước 2–4" in notes[0] and "MỘT bảng" in notes[0]
    assert case_list_notes(_solution(["Nếu $n \\equiv 0$, …", "Nếu $n \\equiv 1$, …", "Nếu $n \\equiv 2$, …"]))
    assert case_list_notes(_solution(seen_live[:3])) == []  # two cases: no table needed
    assert case_list_notes(_solution(["Nếu $m \\ne 0$ thì …", "Nếu $m = 0$ thì …", "Vậy …"])) == []
