"""Expression parser security, claim checkers and the process sandbox."""

from __future__ import annotations

import pytest
from hypothesis import given, settings
from hypothesis import strategies as st

from app.tools import checks
from app.tools.expr import ExpressionError, parse
from app.tools.sandbox import run_check


@pytest.mark.parametrize("text", [
    "__import__('os').system('ls')", "x.__class__", "open('/etc/passwd')", "lambda: 1", "[1, 2]", "{1: 2}",
    "x if y else z", "f(x)", "eval('1')", "a; b", "9**9**9", "10**10**10", "factorial(100000)", "1e400",
    "x" * 700, "exec", "(lambda x: x)(1)", "x[0]", "'abc'", "1 if x else 2",
])
def test_parser_rejects_non_maths(text: str) -> None:
    with pytest.raises(ExpressionError):
        parse(text)


@pytest.mark.parametrize(("text", "expected"), [
    ("x^2-5*x+6=0", "Eq(x**2 - 5*x + 6, 0)"),
    ("sqrt(x_1)+2", "sqrt(x_1) + 2"),
    ("gcd(12, 18)", "6"),
    ("Mod(n^2+1, 5) == 0", "Eq(Mod(n**2 + 1, 5), 0)"),
    ("0.5*x", "x/2"),
    ("x >= 0 and y > 0", "(x >= 0) & (y > 0)"),
    ("(1, 2)", "(1, 2)"),
])
def test_parser_accepts_maths(text: str, expected: str) -> None:
    assert str(parse(text)) == expected


def test_allowed_symbols_enforced() -> None:
    with pytest.raises(ExpressionError, match="unknown variable"):
        parse("x + z", {"x"})


@settings(max_examples=300, deadline=None)
@given(st.text(alphabet=st.characters(codec="utf-8"), max_size=60))
def test_parser_never_crashes_on_arbitrary_text(text: str) -> None:
    try:
        parse(text)
    except ExpressionError:
        pass


# --- checkers -----------------------------------------------------------------------------------------------

def test_extraneous_root_is_refuted() -> None:
    result = checks.check_solutions({"variables": ["x"], "equations": ["sqrt(x+3) = x-3"],
                                     "solutions": [{"x": "6"}, {"x": "1"}]})
    assert result["outcome"] == "refuted" and result["strength"] == "exact"


def test_missing_and_extra_solutions_are_refuted() -> None:
    eq = {"variables": ["x"], "equations": ["x^2-5*x+6=0"]}
    assert checks.check_solutions({**eq, "solutions": [{"x": "2"}]})["detail"] == "Thiếu nghiệm."
    assert checks.check_solutions({**eq, "solutions": [{"x": "2"}, {"x": "3"}, {"x": "4"}]})["outcome"] == "refuted"
    assert checks.check_solutions({**eq, "solutions": [{"x": "3"}, {"x": "2"}]})["outcome"] == "confirmed"


def test_conditions_and_domain() -> None:
    eq = {"variables": ["x"], "equations": ["x^2=4"], "conditions": ["x>0"]}
    assert checks.check_solutions({**eq, "solutions": [{"x": "2"}]})["outcome"] == "confirmed"
    assert checks.check_solutions({**eq, "solutions": [{"x": "-2"}, {"x": "2"}]})["outcome"] == "refuted"
    nat = {"variables": ["x"], "equations": ["2*x=3"], "domain": "integer"}
    assert checks.check_solutions({**nat, "solutions": []})["outcome"] == "confirmed"
    assert checks.check_solutions({**nat, "solutions": [{"x": "3/2"}]})["outcome"] == "refuted"


def test_no_real_solution() -> None:
    result = checks.check_solutions({"variables": ["x"], "equations": ["x^2+1=0"], "solutions": []})
    assert result["outcome"] == "confirmed" and result["strength"] == "exact"


def test_integer_search_is_only_bounded() -> None:
    result = checks.check_solutions({"variables": ["x", "y"], "domain": "integer", "equations": ["x^2-y^2=5"],
                                     "solutions": [{"x": a, "y": b} for a in ("3", "-3") for b in ("2", "-2")]})
    assert result["outcome"] == "confirmed" and result["strength"] == "bounded"


def test_system_of_equations() -> None:
    result = checks.check_solutions({"variables": ["x", "y"], "equations": ["x+y=5", "x*y=6"],
                                     "solutions": [{"x": "2", "y": "3"}, {"x": "3", "y": "2"}]})
    assert result["outcome"] == "confirmed"


def test_value_with_vieta_relations() -> None:
    p = {"variables": ["x1", "x2"], "relations": ["x1+x2=2", "x1*x2=-1"], "expression": "x1^2+x2^2"}
    assert checks.check_value({**p, "expected": "6"})["outcome"] == "confirmed"
    assert checks.check_value({**p, "expected": "4"})["outcome"] == "refuted"


def test_value_with_radicals() -> None:
    p = {"variables": [], "expression": "sqrt(3+2*sqrt(2))"}
    assert checks.check_value({**p, "expected": "1+sqrt(2)"})["outcome"] == "confirmed"


def test_identity_exact_and_counterexample() -> None:
    assert checks.check_identity({"variables": ["a", "b"], "lhs": "a^3-b^3",
                                  "rhs": "(a-b)*(a^2+a*b+b^2)"})["strength"] == "exact"
    assert checks.check_identity({"variables": ["a", "b"], "lhs": "(a+b)^2", "rhs": "a^2+b^2"})["outcome"] == "refuted"


def test_inequality_counterexample_and_equality_case() -> None:
    base = {"variables": ["a", "b"], "conditions": ["a>0", "b>0", "a+b=2"], "positive": True}
    good = checks.check_inequality({**base, "statement": "1/a+1/b>=2", "equality_case": {"a": "1", "b": "1"}})
    assert good["outcome"] == "confirmed" and good["strength"] == "sampled"
    assert checks.check_inequality({**base, "statement": "1/a+1/b>=3"})["outcome"] == "refuted"
    assert checks.check_inequality({**base, "statement": "1/a+1/b>=2",
                                    "equality_case": {"a": "1/2", "b": "3/2"}})["outcome"] == "refuted"


def test_extremum() -> None:
    p = {"variables": ["x"], "objective": "x^2-4*x+7", "kind": "min"}
    assert checks.check_extremum({**p, "value": "3", "attained_at": {"x": "2"}})["outcome"] == "confirmed"
    assert checks.check_extremum({**p, "value": "4", "attained_at": {"x": "1"}})["outcome"] == "refuted"
    assert checks.check_extremum({**p, "value": "3", "attained_at": {"x": "1"}})["outcome"] == "refuted"


def test_divisibility_by_residues_is_exhaustive() -> None:
    assert checks.check_divisibility({"variables": ["n"], "expression": "n^3-n", "divisor": "6"})["strength"] \
        == "exhaustive"
    refuted = checks.check_divisibility({"variables": ["n"], "expression": "n^2+1", "divisor": "5"})
    assert refuted["outcome"] == "refuted"
    two_vars = checks.check_divisibility({"variables": ["a", "b"], "expression": "a^2*b-a*b^2", "divisor": "2"})
    assert two_vars["outcome"] == "confirmed" and two_vars["strength"] == "exhaustive"


def test_count_and_example() -> None:
    assert checks.check_count({"ranges": {"a": [1, 9], "b": [0, 9]}, "conditions": ["a+b=10"], "count": 9})[
        "strength"] == "exhaustive"
    assert checks.check_count({"ranges": {"a": [1, 9], "b": [0, 9]}, "conditions": ["a+b=10"],
                               "count": 10})["outcome"] == "refuted"
    perms = {"ranges": {v: [1, 4] for v in "abcd"}, "distinct": True, "count": 24}
    assert checks.check_count(perms)["outcome"] == "confirmed"
    combos = {"ranges": {v: [1, 5] for v in "abc"}, "distinct": True, "ordered": False, "count": 10}
    assert checks.check_count(combos)["outcome"] == "confirmed"
    assert checks.check_example({"values": {"n": "2"}, "conditions": ["Mod(n^2+1, 5) = 0"]})["outcome"] == "confirmed"
    assert checks.check_example({"values": {"n": "4"}, "conditions": ["Mod(n^2+1, 5) = 0"]})["outcome"] == "refuted"


@settings(max_examples=40, deadline=None)
@given(a=st.integers(-20, 20), b=st.integers(-20, 20))
def test_quadratic_with_integer_roots_property(a: int, b: int) -> None:
    """For (x-a)(x-b)=0 the root set {a, b} is confirmed and any wrong set is refuted."""
    eq = {"variables": ["x"], "equations": [f"(x-({a}))*(x-({b}))=0"]}
    roots = [{"x": str(a)}] if a == b else [{"x": str(a)}, {"x": str(b)}]
    assert checks.check_solutions({**eq, "solutions": roots})["outcome"] == "confirmed"
    assert checks.check_solutions({**eq, "solutions": [{"x": str(a + 100)}]})["outcome"] == "refuted"


# --- sandbox ------------------------------------------------------------------------------------------------

async def test_sandbox_runs_checks_in_a_separate_process() -> None:
    result = await run_check("value", {"variables": [], "expression": "2+2", "expected": "4"})
    assert result == {"ok": True, "result": result["result"]} and result["result"]["outcome"] == "confirmed"


async def test_sandbox_reports_invalid_expressions_without_crashing() -> None:
    result = await run_check("value", {"variables": [], "expression": "__import__('os')", "expected": "1"})
    assert result["ok"] is False and "ExpressionError" in result["error"]


async def test_sandbox_kills_long_running_checks() -> None:
    # ~1.9 million tuples, each with a large binomial coefficient: far longer than the limit.
    payload = {"ranges": {v: [1, 37] for v in "abcd"}, "conditions": ["binomial(a*b*c, d) > 0"], "count": 1}
    result = await run_check("count", payload, limit_seconds=0.5)
    assert result == {"ok": False, "error": "timeout"}


def test_numeric_fallback_returns_python_bools_both_ways() -> None:
    """Regression: SymPy's BooleanFalse is not `False`; wrong values must be refuted, right ones confirmed."""
    import sympy as sp

    from app.tools.checks import _is_zero
    assert _is_zero((1 - sp.sqrt(2)) ** 2 + (1 + sp.sqrt(2)) ** 2 - 4) is False
    assert _is_zero(sp.sqrt(5 + 2 * sp.sqrt(6)) - sp.sqrt(2) - sp.sqrt(3)) is True
    p = {"variables": [], "expression": "sqrt(5+2*sqrt(6))"}
    assert checks.check_value({**p, "expected": "sqrt(2)+sqrt(3)"})["outcome"] == "confirmed"
    assert checks.check_value({**p, "expected": "sqrt(2)+sqrt(3)+1/10^30"})["outcome"] == "refuted"


@pytest.mark.parametrize(("text", "allowed", "expected"), [
    ("2x+3", {"x"}, "2*x + 3"),
    ("3(x+1)", {"x"}, "3*x + 3"),
    ("ab^2+bc", {"a", "b", "c"}, "a*b**2 + b*c"),
    ("x1+x2", {"x1", "x2"}, "x1 + x2"),
    ("1e3", None, "1000"),
])
def test_implicit_multiplication_only_for_known_variables(text: str, allowed: set[str] | None, expected: str) -> None:
    assert str(parse(text, allowed)) == expected


def test_unknown_juxtaposition_is_not_split() -> None:
    with pytest.raises(ExpressionError):
        parse("xy + 1", {"x"})  # 'y' is unknown: never guessed


def test_value_relations_may_mix_equations_and_conditions() -> None:
    p = {"variables": ["a", "b"], "expression": "sqrt((4*a+5)^2+(3*b)^2)-sqrt((4*a-5)^2+(3*b)^2)",
         "relations": ["(a+b)*(a-b)=1", "a>0", "b>0"]}
    good = checks.check_value({**p, "expected": "8"})
    assert good["outcome"] == "confirmed" and good["strength"] == "sampled"  # a family of (a, b): sampled only
    assert checks.check_value({**p, "expected": "7"})["outcome"] == "refuted"


def test_value_with_finitely_many_solutions_is_exact_and_filtered_by_conditions() -> None:
    p = {"variables": ["a", "b", "c"], "expression": "a^2025 + b^2025 + c^2025",
         "relations": ["a + b = 4", "a * b = c", "11 * (-a)^2 - (-a) + 2 * c = 0", "c != 0"]}
    result = checks.check_value({**p, "expected": "-1"})
    assert result["outcome"] == "confirmed" and result["strength"] == "exact"


def test_univariate_numeric_scan_when_sympy_cannot_solve() -> None:
    eq = {"variables": ["x"], "equations": [
        "(x+1)^(1/4) + (3*x^2-2*x+1)^(1/4) = (2*x^2-x+1)^(1/4) + (x^2+1)^(1/4)"]}
    full = checks.check_solutions({**eq, "solutions": [{"x": "0"}, {"x": "1"}]})
    assert full["outcome"] == "confirmed" and full["strength"] == "bounded"
    assert checks.check_solutions({**eq, "solutions": [{"x": "0"}]})["outcome"] == "refuted"


def test_large_symbolic_exponents_allowed_but_huge_numbers_rejected() -> None:
    assert str(parse("a^2025", {"a"})) == "a**2025"
    with pytest.raises(ExpressionError):
        parse("10^6000")


def test_gcd_and_lcm_wait_for_numbers() -> None:
    # SymPy's own gcd(a, b) of two symbols is 1 and lcm(a, b) is a*b: as conditions they were always true.
    assert parse("gcd(a, b)", {"a", "b"}) != 1 and parse("lcm(a, b)", {"a", "b"}) != parse("a*b", {"a", "b"})
    assert parse("gcd(12, 18)", set()) == 6 and parse("lcm(4, 6)", set()) == 12
    coprime = checks.REGISTRY["count"]({"ranges": {"a": [1, 6], "b": [1, 6]}, "conditions": ["gcd(a, b) == 1"],
                                        "count": 23})
    assert coprime["outcome"] == "confirmed"
    lcm = checks.REGISTRY["count"]({"ranges": {"a": [1, 6], "b": [1, 6]}, "conditions": ["lcm(a, b) == a*b"],
                                    "count": 23})
    assert lcm["outcome"] == "confirmed"
    wrong = checks.REGISTRY["count"]({"ranges": {"a": [1, 6], "b": [1, 6]}, "conditions": ["gcd(a, b) == 1"],
                                      "count": 36})
    assert wrong["outcome"] == "refuted"
