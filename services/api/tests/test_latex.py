from __future__ import annotations

import pytest
from hypothesis import given, settings
from hypothesis import strategies as st

from app.ocr.latex import normalize_latex, split_segments


def codes(text: str) -> list[str]:
    return [i.code for i in normalize_latex(text).issues]


@pytest.mark.parametrize(("raw", "expected"), [
    (r"Giải \(x^2-1=0\).", r"Giải $x^2-1=0$."),
    (r"\[x+y=1\]", r"$$x+y=1$$"),
    ("Cho $a ≤ b$ và $c ≥ d$, $a≠0$.", r"Cho $a \le b$ và $c \ge d$, $a\ne 0$."),
    ("$x² + y³$", "$x^{2} + y^{3}$"),
    ("$√2 + √(x+1) + √{y}$", r"$\sqrt{2} + \sqrt{x+1} + \sqrt{y}$"),
    ("$n ⋮ 3$", r"$n \,\vdots\, 3$"),
    ("$∠ABC = 90°$", r"$\angle ABC = 90^\circ$"),
    ("$AB // CD$", r"$AB \parallel CD$"),
    ("$a − b$", "$a - b$"),
    ("Tam   giác  đều\n\n\n\nCâu tiếp", "Tam giác đều\n\nCâu tiếp"),
])
def test_normalization(raw: str, expected: str) -> None:
    report = normalize_latex(raw)
    assert report.text == expected
    assert not report.has_errors, report.issues


def test_vietnamese_is_nfc() -> None:
    decomposed = "Cho tam giác"  # 'á' as a + combining acute
    assert normalize_latex(decomposed).text == "Cho tam giác"


@pytest.mark.parametrize(("raw", "code"), [
    ("Cho $x+1", "unclosed_math"),
    (r"$\frac{1}{2$", "unbalanced_braces"),
    (r"$\left( x \right.$ và $\left( y$", "unbalanced_left_right"),
    (r"$\begin{cases} x \end{array}$", "mismatched_environment"),
    (r"$\begin{cases} x$", "unclosed_environment"),
    (r"$\begin{tikzpicture}\end{tikzpicture}$", "unknown_environment"),
    (r"Tính \frac{1}{2}", "command_outside_math"),
    (r"Cho $x = \unclear{7}$", "unclear_notation"),
    ("   ", "empty"),
    ("Tính √x", "unicode_sqrt"),
])
def test_errors_detected(raw: str, code: str) -> None:
    report = normalize_latex(raw)
    assert code in [i.code for i in report.issues]
    assert report.has_errors


def test_unknown_command_is_warning_only() -> None:
    report = normalize_latex(r"$\foo{x}$")
    assert [i.code for i in report.issues] == ["unknown_command"]
    assert not report.has_errors


def test_escaped_dollar_is_text() -> None:
    segments, issues = split_segments(r"Giá \$5 và $x$")
    assert not issues
    assert [s.kind for s in segments] == ["text", "math"]


def test_superscript_in_text_is_wrapped_with_warning() -> None:
    report = normalize_latex("n² + 1")
    assert report.text == "n$^{2}$ + 1"
    assert codes("n² + 1") == ["math_outside_delimiters"]


def test_unicode_symbol_does_not_fuse_with_following_letter() -> None:
    assert normalize_latex("$a≤b$").text == r"$a\le b$"


_TOKENS = ["\\frac", "\\sqrt", "≤", "²", "√", "ă", "ệ", "\\(", "\\)", "$$", "\\unclear"]
_alphabet = st.sampled_from([*"abxyn0123456789+-=()[]{}^_ $\\.,\n", *_TOKENS])


@settings(max_examples=400, deadline=None)
@given(st.lists(_alphabet, max_size=40).map("".join))
def test_normalize_never_crashes_and_is_idempotent(raw: str) -> None:
    once = normalize_latex(raw)
    twice = normalize_latex(once.text)
    assert twice.text == once.text
    if not once.has_errors:
        assert not twice.has_errors


@settings(max_examples=200, deadline=None)
@given(st.lists(st.sampled_from(["x", "y", "1", "+", "\\cdot ", "\\frac{a}{b}", "^{2}", "\\sqrt{3}"]),
                min_size=1, max_size=12).map("".join))
def test_well_formed_math_has_no_errors(expr: str) -> None:
    report = normalize_latex(f"Tính ${expr}$.")
    assert not report.has_errors, report.issues
    assert report.text.startswith("Tính $")


@pytest.mark.parametrize("raw", ["\\²", "\\≤", "a\\₁"])
def test_backslash_before_converted_symbol_does_not_escape_dollar(raw: str) -> None:
    report = normalize_latex(raw)
    assert "unclosed_math" not in [i.code for i in report.issues]
    assert normalize_latex(report.text).text == report.text
