"""Prompt texts are Python strings: a single backslash before f, b, t, r or n silently becomes a control character
(this happened twice: "\\frac" became a form feed). Every prompt the models see must be free of them."""

from __future__ import annotations

import re

from app.agents.critic import CRITIC_SYSTEM
from app.curriculum.policy import load_policy
from app.solvers import prompts
from app.tutoring.feedback import TUTOR_SYSTEM

TOPICS = ["algebra", "geometry", "number_theory", "combinatorics"]


def test_no_prompt_contains_control_characters_from_latex() -> None:
    texts = {"solve": prompts.solve_system(load_policy(), TOPICS, ["x"]), "formalize": prompts.FORMALIZE_SYSTEM,
             "critic": CRITIC_SYSTEM, "tutor": TUTOR_SYSTEM, "hints": prompts.HINTS_SYSTEM}
    for name, text in texts.items():
        bad = re.findall(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", text)
        assert not bad, f"{name} prompt has control characters {bad!r} (a LaTeX backslash that was not doubled?)"
        assert not re.search(r"\t[a-z]", text), f"{name} prompt has a tab before letters (\\t… not doubled?)"
