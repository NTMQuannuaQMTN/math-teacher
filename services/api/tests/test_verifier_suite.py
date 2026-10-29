"""Deterministic verifier suite (benchmarks/synthetic/verifier_cases.jsonl, synthetic, no model calls).

Each case pairs an independent formalization with a machine answer that is known to be correct or wrong.
The invariant that matters most: a wrong answer is NEVER labelled VERIFIED.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest

from app.solvers.schemas import Formalization, ModelSolution
from app.tools.sandbox import run_check
from app.verification.verdict import verify_solution

CASES = [json.loads(line) for line in (Path(__file__).resolve().parents[3] / "benchmarks" / "synthetic" /
                                       "verifier_cases.jsonl").read_text(encoding="utf-8").splitlines() if line]


def _inputs(case: dict[str, Any]) -> tuple[Formalization, ModelSolution]:
    formalization = Formalization.model_validate({"parts": [{"label": "", "task": case["task"],
                                                             "template": case["template"]}]})
    value = case["machine_answer"].get("value")
    solution = ModelSolution.model_validate({
        "solved": True, "unsolved_reason_vi": None, "approach_vi": "", "techniques": [],
        "parts": [{"label": "", "answer_kind": "other", "final_answer_latex": f"Đáp số: ${value}$" if value else "",
                   "steps": ["…"], "machine_answer": case["machine_answer"]}]})
    return formalization, solution


@pytest.mark.parametrize("case", CASES, ids=[c["id"] for c in CASES])
async def test_verifier_case(case: dict[str, Any]) -> None:
    formalization, solution = _inputs(case)
    _, _, status = await verify_solution(formalization, solution, run_check)  # real sandbox
    assert status == case["expected"], f"{case['id']}: got {status}"
    if not case["answer_is_correct"]:
        assert status != "VERIFIED"


def test_suite_shape() -> None:
    assert len(CASES) >= 35
    assert all(c["synthetic"] for c in CASES)
    wrong = [c for c in CASES if not c["answer_is_correct"]]
    assert len(wrong) >= 15 and all(c["expected"] != "VERIFIED" for c in wrong)
