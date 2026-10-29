"""Deterministic checks of machine-readable claims. Run only inside `app.tools.sandbox` (separate process).

Every check returns an Evidence dict:
  outcome  : confirmed | refuted | inconclusive
  strength : exact | exhaustive | bounded | sampled | none   (what the confirmation rests on)
  detail   : short Vietnamese description shown to students and reviewers
  data     : optional machine data (counterexample, computed set, …)

Strength matters: only `exact` and `exhaustive` can make an answer VERIFIED. `bounded` (integer search in a
box) and `sampled` (random points) can find counterexamples, but never prove a claim.
"""

from __future__ import annotations

import itertools
import math
import random
from collections.abc import Callable
from typing import Any

import sympy as sp

from .expr import ExpressionError, parse

Evidence = dict[str, Any]
Payload = dict[str, Any]

SAMPLES = 1500
MAX_ENUMERATION = 2_000_000
INTEGER_BOX = 60
TOL = 1e-9

_LAMBDA_MODULES: list[Any] = [{"Mod": lambda a, b: a % b, "floor": math.floor, "ceiling": math.ceil,
                               "gcd": math.gcd, "IntGcd": math.gcd, "IntLcm": math.lcm, "factorial": math.factorial,
                               "binomial": math.comb}, "math"]


def _evidence(outcome: str, strength: str, detail: str, **data: Any) -> Evidence:
    return {"outcome": outcome, "strength": strength, "detail": detail, "data": data or None}


def _symbols(names: list[str]) -> dict[str, sp.Symbol]:
    return {name: sp.Symbol(name) for name in names}


def _parse_all(texts: list[str], allowed: set[str]) -> list[Any]:
    return [parse(t, allowed) for t in texts]


def _as_zero(rel: Any) -> Any:
    """`lhs == rhs` → lhs - rhs; a bare expression means `expr == 0`."""
    if isinstance(rel, sp.Equality):
        return rel.lhs - rel.rhs
    if isinstance(rel, sp.core.relational.Relational):
        raise ExpressionError("expected an equation")
    return rel


_Z = sp.Symbol("_z")


def _is_zero(value: Any) -> bool | None:
    """Exact zero test. None = undecided.

    1. SymPy simplification to 0.
    2. For algebraic numbers (radicals, rationals): the minimal polynomial is z exactly when the value is 0.
    3. Otherwise (e.g. involving pi) a 60-digit numeric comparison.
    Always returns Python bools: SymPy's BooleanFalse is not `False`, and callers compare with `is`.
    """
    try:
        simplified = sp.simplify(value)
    except Exception:  # simplification can fail on odd inputs; fall through to the other tests
        simplified = value
    if simplified == 0:
        return True
    if simplified.is_number and not simplified.has(sp.pi, sp.E):
        try:
            return bool(sp.minimal_polynomial(simplified, _Z) == _Z)
        except (NotImplementedError, ValueError, TypeError, sp.polys.polyerrors.PolynomialError):
            pass
    numeric = sp.N(simplified, 60)
    if not numeric.is_number:
        return None
    if numeric.is_real is False:
        return False if bool(abs(sp.im(numeric)) > 1e-50) else None
    return bool(abs(numeric) < 1e-50) if numeric.is_real else None


def _defined_at(expr: Any, point: dict[Any, Any]) -> bool:
    """True when the expression is real and finite at the point (radicands ≥ 0, denominators ≠ 0)."""
    value = sp.N(expr.subs(point), 40)
    return bool(value.is_real and value.is_finite) if value.is_number else False


def _holds(condition: Any, point: dict[Any, Any]) -> bool | None:
    try:
        value = condition.subs(point)
        if value in (sp.true, sp.false):
            return bool(value)
        return bool(sp.N(value, 40))  # relational with numbers
    except (TypeError, ValueError):
        return None


def _domain_ok(value: Any, domain: str) -> bool:
    value = sp.nsimplify(value)
    if domain == "real":
        return bool(value.is_real)
    if domain == "rational":
        return bool(value.is_rational)
    if not value.is_integer:
        return False
    if domain == "positive_integer":
        return bool(value > 0)
    if domain == "natural":
        return bool(value >= 0)
    return True  # integer


def _point(names: list[str], symbols: dict[str, sp.Symbol], values: dict[str, str]) -> dict[Any, Any]:
    missing = [n for n in names if n not in values]
    if missing:
        raise ExpressionError(f"missing value for {', '.join(missing)}")
    return {symbols[n]: parse(values[n], set()) for n in names}


# --- solutions --------------------------------------------------------------------------------------------

def check_solutions(p: Payload) -> Evidence:
    """Claimed solution set of equations (+ conditions) over a domain; `complete` = no other solutions."""
    names: list[str] = p["variables"]
    syms = _symbols(names)
    allowed = set(names)
    equations = [_as_zero(e) for e in _parse_all(p["equations"], allowed)]
    conditions = _parse_all(p.get("conditions", []), allowed)
    domain = p.get("domain", "real")
    claimed = [_point(names, syms, s) for s in p.get("solutions", [])]

    # 1. Each claimed solution: in the domain, all expressions defined (no extraneous roots), equations hold.
    for index, point in enumerate(claimed):
        shown = {n: str(point[syms[n]]) for n in names}
        if not all(_domain_ok(v, domain) for v in point.values()):
            return _evidence("refuted", "exact", f"Nghiệm {shown} không thuộc tập xét.", solution=shown)
        for eq in equations:
            if not _defined_at(eq, point) or _is_zero(eq.subs(point)) is not True:
                return _evidence("refuted", "exact",
                                 f"Nghiệm {shown} không thỏa mãn phương trình (hoặc làm biểu thức vô nghĩa).",
                                 solution=shown, index=index)
        for cond in conditions:
            if _holds(cond, point) is False:
                return _evidence("refuted", "exact", f"Nghiệm {shown} không thỏa mãn điều kiện.", solution=shown)

    if not p.get("complete", True):
        return _evidence("confirmed", "exact", "Các nghiệm nêu ra đều thỏa mãn.")

    # 2. Completeness.
    if domain in ("real", "rational"):
        return _complete_real(names, syms, equations, conditions, domain, claimed)
    return _complete_integer(names, syms, equations, conditions, domain, claimed, int(p.get("search_bound", 0)))


def _complete_real(names: list[str], syms: dict[str, sp.Symbol], equations: list[Any], conditions: list[Any],
                   domain: str, claimed: list[dict[Any, Any]]) -> Evidence:
    variables = [syms[n] for n in names]
    try:
        found = sp.solve(equations, variables, dict=True)
    except (NotImplementedError, ValueError, TypeError):
        found = None
    if found is None:
        if len(variables) == 1 and len(equations) == 1:
            return _scan_univariate(equations[0], variables[0], conditions, claimed)
        return _evidence("inconclusive", "none", "Các nghiệm nêu ra thỏa mãn, nhưng chưa kiểm tra được là đủ.")
    if any(len(sol) < len(variables) for sol in found):
        return _evidence("inconclusive", "none", "Phương trình có vô số nghiệm; chưa kiểm tra được tính đầy đủ.")
    valid: list[dict[Any, Any]] = []
    for sol in found:
        point = {v: sol[v] for v in variables}
        if not all(_domain_ok(sp.N(val, 40) if not val.is_real else val, domain) for val in point.values()):
            continue
        if not all(_defined_at(eq, point) for eq in equations):
            continue  # extraneous root of a transformed equation
        if any(_holds(c, point) is False for c in conditions):
            continue
        valid.append(point)
    missing = [pt for pt in valid if not any(_same_point(pt, c, variables) for c in claimed)]
    extra = [c for c in claimed if not any(_same_point(c, pt, variables) for pt in valid)]
    shown = [{str(k): str(v) for k, v in pt.items()} for pt in valid]
    if missing:
        return _evidence("refuted", "exact", "Thiếu nghiệm.", expected=shown)
    if extra:
        return _evidence("refuted", "exact", "Có nghiệm thừa.", expected=shown)
    return _evidence("confirmed", "exact", f"Giải bằng SymPy: đúng {len(valid)} nghiệm như đã nêu.", solutions=shown)


SCAN_LIMIT = 1000.0


def _scan_univariate(eq: Any, var: Any, conditions: list[Any], claimed: list[dict[Any, Any]]) -> Evidence:
    """Numeric search for real roots on [-1000, 1000] when SymPy cannot solve exactly (bounded strength)."""
    f = _compile(eq, [var])
    cond_fns = [_compile(c, [var]) for c in conditions]

    def value(x: float) -> float | None:
        try:
            y = complex(f(x))
        except (ValueError, ZeroDivisionError, OverflowError, TypeError):
            return None
        if abs(y.imag) > 1e-12 or not math.isfinite(y.real):
            return None
        return y.real

    grid = sorted({round(-10 + i * 0.002, 6) for i in range(10001)} | {
        sign * 10 ** (1 + k / 400) for k in range(801) for sign in (-1, 1)})
    roots: list[float] = []
    previous: tuple[float, float] | None = None
    values = [(x, value(x)) for x in grid]
    for i, (x, y) in enumerate(values):
        if y is None:
            previous = None
            continue
        if previous is not None and previous[1] * y < 0:
            lo, hi, flo = previous[0], x, previous[1]
            for _ in range(80):
                mid = (lo + hi) / 2
                fm = value(mid)
                if fm is None:
                    break
                if flo * fm <= 0:
                    hi = mid
                else:
                    lo, flo = mid, fm
            roots.append((lo + hi) / 2)
        elif abs(y) < 1e-9:
            roots.append(x)
        elif 0 < i < len(values) - 1:  # touching root: local minimum of |f| that reaches ~0
            left, right = values[i - 1][1], values[i + 1][1]
            if left is not None and right is not None and abs(y) <= abs(left) and abs(y) <= abs(right) \
                    and abs(y) < 1e-6:
                roots.append(x)
        previous = (x, y)
    valid: list[float] = []
    for r in roots:
        try:
            if all(bool(c(r)) for c in cond_fns) and not any(abs(r - v) < 1e-6 for v in valid):
                valid.append(r)
        except (ValueError, ZeroDivisionError, OverflowError, TypeError):
            continue
    claimed_values = [float(sp.N(pt[var], 30)) for pt in claimed]
    missing = [r for r in valid if not any(abs(r - c) < 1e-5 for c in claimed_values)]
    if missing:
        return _evidence("refuted", "bounded", f"Tìm được nghiệm khác: x ≈ {missing[0]:.6g}.", missing=missing[:5])
    return _evidence("confirmed", "bounded",
                     f"Các nghiệm nêu ra thỏa mãn; tìm nghiệm số trên đoạn [-{SCAN_LIMIT:g}, {SCAN_LIMIT:g}] "
                     "không thấy nghiệm nào khác (chưa phải chứng minh).", roots=valid[:20])


def _same_point(a: dict[Any, Any], b: dict[Any, Any], variables: list[Any]) -> bool:
    return all(_is_zero(a[v] - b[v]) is True for v in variables)


def _compile(expr: Any, variables: list[Any]) -> Callable[..., Any]:
    compiled: Callable[..., Any] = sp.lambdify(variables, expr, modules=_LAMBDA_MODULES)
    return compiled


def _complete_integer(names: list[str], syms: dict[str, sp.Symbol], equations: list[Any], conditions: list[Any],
                      domain: str, claimed: list[dict[Any, Any]], bound: int) -> Evidence:
    variables = [syms[n] for n in names]
    box = max(5, min(bound or INTEGER_BOX, 2000))
    while (2 * box + 1) ** len(variables) > MAX_ENUMERATION and box > 5:
        box //= 2
    lo = {"positive_integer": 1, "natural": 0}.get(domain, -box)
    numerators = []
    denominators = []
    for eq in equations:
        num, den = sp.fraction(sp.together(eq))
        numerators.append(_compile(num, variables))
        denominators.append(_compile(den, variables))
    cond_fns = [_compile(c, variables) for c in conditions]
    found: list[tuple[int, ...]] = []
    for values in itertools.product(range(lo, box + 1), repeat=len(variables)):
        try:
            if any(abs(f(*values)) > TOL for f in numerators) or any(abs(g(*values)) < TOL for g in denominators):
                continue
            if all(bool(c(*values)) for c in cond_fns):
                found.append(values)
        except (ValueError, ZeroDivisionError, OverflowError, TypeError):
            continue
    claimed_tuples = {tuple(int(pt[v]) for v in variables) for pt in claimed}
    in_box = {t for t in claimed_tuples if all(lo <= x <= box for x in t)}
    missing = sorted(set(found) - in_box)
    if missing:
        return _evidence("refuted", "bounded", f"Tìm thấy nghiệm chưa được nêu: {missing[:5]}.",
                         missing=[list(m) for m in missing[:20]])
    return _evidence("confirmed", "bounded",
                     f"Tìm kiếm mọi bộ số nguyên trong [{lo}, {box}]: không có nghiệm nào khác.",
                     box=[lo, box], found=[list(f) for f in found[:50]])


# --- identity / value -------------------------------------------------------------------------------------

def check_identity(p: Payload) -> Evidence:
    names: list[str] = p.get("variables", [])
    allowed = set(names)
    lhs, rhs = parse(p["lhs"], allowed), parse(p["rhs"], allowed)
    if p.get("positive"):
        positive = {sp.Symbol(n): sp.Symbol(n, positive=True) for n in names}
        lhs, rhs = lhs.subs(positive), rhs.subs(positive)
    try:
        exact_zero = sp.simplify(sp.expand(lhs - rhs)) == 0
    except Exception:  # simplification failed: fall back to sampling below
        exact_zero = False
    if exact_zero:
        return _evidence("confirmed", "exact", "Đẳng thức đúng (rút gọn hiệu hai vế bằng 0).")
    conditions = _parse_all(p.get("conditions", []), allowed)
    variables = [sp.Symbol(n, positive=True) if p.get("positive") else sp.Symbol(n) for n in names]
    sampler = _Sampler(variables, conditions, positive=bool(p.get("positive")), seed=1)
    f = _compile(lhs - rhs, variables)
    checked = 0
    for values in sampler.points():
        try:
            diff = complex(f(*values))
        except (ValueError, ZeroDivisionError, OverflowError):
            continue
        if abs(diff.imag) > 1e-9:
            continue
        checked += 1
        if abs(diff.real) > 1e-7 * max(1.0, abs(diff.real)):
            return _evidence("refuted", "sampled", "Đẳng thức sai tại một điểm cụ thể.",
                             counterexample=dict(zip(names, values, strict=True)))
    if checked < 50:
        return _evidence("inconclusive", "none", "Không đủ điểm hợp lệ để kiểm tra đẳng thức.")
    return _evidence("confirmed", "sampled", f"Đúng tại {checked} điểm ngẫu nhiên (chưa chứng minh tổng quát).")


def _split_relations(relations: list[Any]) -> tuple[list[Any], list[Any]]:
    """Equations (as expr == 0 forms) vs conditions (inequalities, ≠, and/or)."""
    equations, conditions = [], []
    for rel in relations:
        if isinstance(rel, sp.Equality):
            equations.append(rel.lhs - rel.rhs)
        elif isinstance(rel, sp.core.relational.Relational | sp.logic.boolalg.BooleanFunction):
            conditions.append(rel)
        else:
            equations.append(rel)
    return equations, conditions


def check_value(p: Payload) -> Evidence:
    """`expression` equals `expected` under `substitutions`, or for EVERY point satisfying `relations`.

    Finitely many solutions → each is checked exactly. A family of solutions (free parameters) → random points
    of the family are checked numerically (sampled: can refute, cannot prove).
    """
    names: list[str] = p.get("variables", [])
    allowed = set(names)
    expr = parse(p["expression"], allowed)
    expected = parse(p["expected"], set())
    syms = _symbols(names)
    variables = [syms[n] for n in names]
    if p.get("substitutions"):
        points = [_point(names, syms, p["substitutions"])]
    elif p.get("relations"):
        equations, conditions = _split_relations(_parse_all(p["relations"], allowed))
        try:
            solutions = sp.solve(equations, variables, dict=True) if equations else [{}]
        except (NotImplementedError, ValueError, TypeError):
            return _evidence("inconclusive", "none", "Không giải được hệ điều kiện để kiểm tra giá trị.")
        if any(len(sol) < len(variables) for sol in solutions):
            return _value_by_sampling(expr, expected, variables, solutions, conditions, p["expected"])
        points = [sol for sol in solutions
                  if all(_holds(c, sol) is not False for c in conditions)
                  and all(_defined_at(e, sol) for e in equations)]
        if not points:
            return _evidence("inconclusive", "none", "Hệ điều kiện không có nghiệm thỏa mãn để kiểm tra.")
    else:
        points = [{}]
    for point in points:
        verdict = _is_zero(expr.subs(point) - expected)
        if verdict is False:
            return _evidence("refuted", "exact", "Giá trị tính được khác với đáp số.",
                             computed=str(sp.nsimplify(sp.simplify(expr.subs(point)))))
        if verdict is None:
            return _evidence("inconclusive", "none", "Không so sánh được giá trị một cách chính xác.")
    return _evidence("confirmed", "exact", f"Tính trực tiếp: giá trị bằng {p['expected']}.")


def _value_by_sampling(expr: Any, expected: Any, variables: list[Any], solutions: list[dict[Any, Any]],
                       conditions: list[Any], shown: str) -> Evidence:
    rng = random.Random(3)  # noqa: S311 - reproducible sampling, not security
    target = complex(sp.N(expected, 30))
    checked = 0
    for sol in solutions:
        free = [v for v in variables if v not in sol]
        full = {**{v: v for v in free}, **sol}
        value_fn = _compile(expr.subs(full), free)
        dependent = {v: _compile(e, free) for v, e in sol.items()}
        cond_fns = [_compile(c.subs(full), free) for c in conditions]
        for _ in range(600):
            values = [rng.choice([rng.uniform(-5, 5), rng.uniform(0.05, 3), float(rng.randint(-6, 6))])
                      for _ in free]
            try:
                if not all(bool(c(*values)) for c in cond_fns):
                    continue
                deps = [complex(f(*values)) for f in dependent.values()]
                if any(abs(d.imag) > 1e-9 for d in deps):
                    continue
                got = complex(value_fn(*values))
            except (ValueError, ZeroDivisionError, OverflowError, TypeError):
                continue
            if abs(got.imag) > 1e-9 or not math.isfinite(got.real):
                continue
            checked += 1
            if abs(got - target) > 1e-7 * max(1.0, abs(target)):
                return _evidence("refuted", "sampled", "Tại một điểm thỏa mãn đề bài, giá trị khác với đáp số.",
                                 point=dict(zip([str(v) for v in free], values, strict=True)), computed=got.real)
    if checked < 50:
        return _evidence("inconclusive", "none", "Không đủ điểm hợp lệ để kiểm tra giá trị.")
    return _evidence("confirmed", "sampled",
                     f"Giá trị bằng {shown} tại {checked} điểm ngẫu nhiên thỏa mãn đề bài (chưa phải chứng minh).")


# --- inequality / extremum (sampling) -----------------------------------------------------------------------

class _Sampler:
    """Random points satisfying the conditions. One linear equality may be used to eliminate a variable."""

    def __init__(self, variables: list[Any], conditions: list[Any], *, positive: bool, seed: int,
                 domain: str = "real") -> None:
        self.rng = random.Random(seed)  # noqa: S311 - reproducible sampling, not security
        self.variables = variables
        self.positive = positive
        self.domain = domain
        self.eliminated: tuple[Any, Callable[..., Any]] | None = None
        inequalities = []
        for cond in conditions:
            if isinstance(cond, sp.Equality) and self.eliminated is None:
                for var in reversed(variables):
                    solved = sp.solve(cond, var)
                    if len(solved) == 1:
                        free = [v for v in variables if v != var]
                        self.eliminated = (var, _compile(solved[0], free))
                        break
                if self.eliminated is None:
                    raise ExpressionError("cannot sample under this equality constraint")
            elif isinstance(cond, sp.Equality):
                raise ExpressionError("only one equality constraint is supported for sampling")
            else:
                inequalities.append(cond)
        self.conditions = [_compile(c, variables) for c in inequalities]

    def _draw(self) -> float:
        r = self.rng.random()
        if self.domain in ("integer", "positive_integer", "natural"):
            low = 1 if self.domain == "positive_integer" else 0 if self.domain == "natural" or self.positive else -30
            return float(self.rng.randint(low, 30))
        if self.positive:
            if r < 0.4:
                return self.rng.uniform(0.01, 3)
            if r < 0.7:
                return math.exp(self.rng.uniform(-4, 4))
            if r < 0.85:
                return float(self.rng.randint(1, 6))
            return self.rng.uniform(1e-4, 0.05)
        if r < 0.6:
            return self.rng.uniform(-5, 5)
        if r < 0.8:
            return float(self.rng.randint(-6, 6))
        return self.rng.uniform(-100, 100)

    def points(self, attempts: int = SAMPLES * 4, wanted: int = SAMPLES) -> Any:
        accepted = 0
        for _ in range(attempts):
            if accepted >= wanted:
                return
            if self.eliminated is None:
                values = [self._draw() for _ in self.variables]
            else:
                var, solve_for = self.eliminated
                free_values = [self._draw() for v in self.variables if v != var]
                try:
                    dependent = float(solve_for(*free_values))
                except (ValueError, ZeroDivisionError, OverflowError, TypeError):
                    continue
                if self.positive and dependent <= 0:
                    continue
                it = iter(free_values)
                values = [dependent if v == var else next(it) for v in self.variables]
            try:
                if not all(bool(c(*values)) for c in self.conditions):
                    continue
            except (ValueError, ZeroDivisionError, OverflowError, TypeError):
                continue
            accepted += 1
            yield values


def check_inequality(p: Payload) -> Evidence:
    names: list[str] = p["variables"]
    allowed = set(names)
    relation = parse(p["statement"], allowed)
    if not isinstance(relation, sp.core.relational.Relational) or isinstance(relation, sp.Equality | sp.Unequality):
        raise ExpressionError("statement must be an inequality")
    conditions = _parse_all(p.get("conditions", []), allowed)
    variables = [sp.Symbol(n) for n in names]
    big_minus_small = (relation.lhs - relation.rhs if isinstance(relation, sp.GreaterThan | sp.StrictGreaterThan)
                       else relation.rhs - relation.lhs)
    strict = isinstance(relation, sp.StrictGreaterThan | sp.StrictLessThan)
    f = _compile(big_minus_small, variables)

    if p.get("equality_case"):
        point = _point(names, _symbols(names), p["equality_case"])
        value = big_minus_small.subs(point)
        if _is_zero(value) is not True:
            return _evidence("refuted", "exact", "Dấu bằng không xảy ra tại điểm đã nêu.",
                             value=str(sp.nsimplify(sp.simplify(value))))
        if any(_holds(c, point) is False for c in conditions):
            return _evidence("refuted", "exact", "Điểm xảy ra dấu bằng không thỏa mãn điều kiện.")
    sampler = _Sampler(variables, conditions, positive=bool(p.get("positive")), seed=7,
                       domain=p.get("domain", "real"))
    checked = 0
    for values in sampler.points():
        try:
            gap = float(f(*values))
        except (ValueError, ZeroDivisionError, OverflowError, TypeError):
            continue
        checked += 1
        scale = max(1.0, abs(gap))
        if gap < -TOL * scale or (strict and gap < 0):
            return _evidence("refuted", "sampled", "Tìm được phản ví dụ cho bất đẳng thức.",
                             counterexample=dict(zip(names, values, strict=True)))
    if checked < 100:
        return _evidence("inconclusive", "none", "Không đủ điểm hợp lệ để kiểm tra bất đẳng thức.")
    detail = f"Đúng tại {checked} điểm ngẫu nhiên"
    detail += ", dấu bằng kiểm tra chính xác" if p.get("equality_case") else ""
    return _evidence("confirmed", "sampled", detail + " (chưa phải chứng minh).")


def check_extremum(p: Payload) -> Evidence:
    names: list[str] = p["variables"]
    allowed = set(names)
    objective = parse(p["objective"], allowed)
    value = parse(p["value"], set())
    conditions = _parse_all(p.get("conditions", []), allowed)
    kind = p["kind"]
    point = _point(names, _symbols(names), p["attained_at"])
    if any(_holds(c, point) is False for c in conditions):
        return _evidence("refuted", "exact", "Điểm đạt cực trị không thỏa mãn điều kiện đề bài.")
    if _is_zero(objective.subs(point) - value) is not True:
        return _evidence("refuted", "exact", "Tại điểm đã nêu, biểu thức không bằng giá trị cực trị.",
                         computed=str(sp.nsimplify(sp.simplify(objective.subs(point)))))
    variables = [sp.Symbol(n) for n in names]
    f = _compile(objective, variables)
    target = float(value)
    sampler = _Sampler(variables, conditions, positive=bool(p.get("positive")), seed=11,
                       domain=p.get("domain", "real"))
    checked = 0
    for values in sampler.points():
        try:
            current = float(f(*values))
        except (ValueError, ZeroDivisionError, OverflowError, TypeError):
            continue
        checked += 1
        better = current < target - TOL * max(1, abs(target)) if kind == "min" else \
            current > target + TOL * max(1, abs(target))
        if better:
            word = "nhỏ hơn" if kind == "min" else "lớn hơn"
            return _evidence("refuted", "sampled", f"Tìm được điểm cho giá trị {word} {p['value']}.",
                             counterexample=dict(zip(names, values, strict=True)), value=current)
    if checked < 100:
        return _evidence("inconclusive", "none", "Không đủ điểm hợp lệ để kiểm tra cực trị.")
    return _evidence("confirmed", "sampled",
                     f"Giá trị đạt được chính xác tại điểm đã nêu; không điểm nào trong {checked} điểm ngẫu nhiên "
                     "vượt qua (chưa phải chứng minh).")


# --- number theory ------------------------------------------------------------------------------------------

def check_divisibility(p: Payload) -> Evidence:
    """For all integers in the domain satisfying conditions: `divisor` divides `expression`.

    With a polynomial of integer coefficients and a constant divisor d, checking all residues mod d is a proof.
    """
    names: list[str] = p["variables"]
    allowed = set(names)
    expr = parse(p["expression"], allowed)
    divisor = parse(p["divisor"], allowed)
    conditions = _parse_all(p.get("conditions", []), allowed)
    domain = p.get("domain", "integer")
    variables = [sp.Symbol(n) for n in names]
    poly_ok = divisor.is_Integer and divisor != 0 and not conditions and expr.is_polynomial(*variables)
    if poly_ok:
        poly = sp.Poly(expr, *variables)
        if all(c.is_integer for c in poly.coeffs()):
            d = abs(int(divisor))
            if d ** len(variables) <= MAX_ENUMERATION:
                f = _compile(expr, variables)
                for residues in itertools.product(range(d), repeat=len(variables)):
                    if int(f(*residues)) % d != 0:
                        return _evidence("refuted", "exhaustive", f"Không chia hết cho {d} khi {residues} (mod {d}).",
                                         counterexample=dict(zip(names, residues, strict=True)))
                return _evidence("confirmed", "exhaustive",
                                 f"Xét đủ mọi số dư modulo {d}: biểu thức luôn chia hết cho {d}.")
    f_expr, f_div = _compile(expr, variables), _compile(divisor, variables)
    cond_fns = [_compile(c, variables) for c in conditions]
    box = 200 if len(variables) == 1 else 30
    lo = {"positive_integer": 1, "natural": 0}.get(domain, -box)
    for values in itertools.product(range(lo, box + 1), repeat=len(variables)):
        try:
            if not all(bool(c(*values)) for c in cond_fns):
                continue
            d, e = f_div(*values), f_expr(*values)
            if d == 0 or e != int(e) or d != int(d):
                continue
            if int(e) % int(d) != 0:
                return _evidence("refuted", "bounded", f"Phản ví dụ: {dict(zip(names, values, strict=True))}.",
                                 counterexample=dict(zip(names, values, strict=True)))
        except (ValueError, ZeroDivisionError, OverflowError, TypeError):
            continue
    return _evidence("confirmed", "bounded", f"Đúng với mọi giá trị nguyên trong [{lo}, {box}] (chưa phải chứng minh).")


# --- combinatorics ------------------------------------------------------------------------------------------

def check_count(p: Payload) -> Evidence:
    """Count integer tuples in the given ranges that satisfy all conditions, by exhaustive enumeration."""
    ranges: dict[str, list[int]] = p["ranges"]
    names = list(ranges)
    allowed = set(names)
    conditions = _parse_all(p.get("conditions", []), allowed)
    variables = [sp.Symbol(n) for n in names]
    spans = [range(int(lo), int(hi) + 1) for lo, hi in ranges.values()]
    total = math.prod(len(s) for s in spans)
    if total > MAX_ENUMERATION:
        return _evidence("inconclusive", "none", f"Không gian quá lớn để liệt kê ({total} trường hợp).")
    cond_fns = [_compile(c, variables) for c in conditions]
    distinct = bool(p.get("distinct"))
    unordered = p.get("ordered", True) is False
    count = 0
    for values in itertools.product(*spans):
        if distinct and len(set(values)) != len(values):
            continue
        if unordered and any(values[i] > values[i + 1] for i in range(len(values) - 1)):
            continue
        try:
            if all(bool(c(*values)) for c in cond_fns):
                count += 1
        except (ValueError, ZeroDivisionError, OverflowError, TypeError):
            continue
    expected = int(p["count"])
    if count != expected:
        return _evidence("refuted", "exhaustive", f"Liệt kê đầy đủ được {count}, không phải {expected}.",
                         computed=count)
    return _evidence("confirmed", "exhaustive", f"Liệt kê đủ {total} trường hợp: đúng {count}.")


def check_example(p: Payload) -> Evidence:
    """A concrete witness satisfies every condition (for 'tồn tại' / construction claims)."""
    names = list(p["values"])
    syms = _symbols(names)
    point = _point(names, syms, p["values"])
    for text in p["conditions"]:
        cond = parse(text, set(names))
        if _holds(cond, point) is not True:
            return _evidence("refuted", "exact", f"Ví dụ không thỏa mãn: {text}.")
    return _evidence("confirmed", "exact", "Ví dụ cụ thể thỏa mãn mọi điều kiện.")


REGISTRY: dict[str, Callable[[Payload], Evidence]] = {
    "solutions": check_solutions,
    "identity": check_identity,
    "value": check_value,
    "inequality": check_inequality,
    "extremum": check_extremum,
    "divisibility": check_divisibility,
    "count": check_count,
    "example": check_example,
}


def check_geometry(p: Payload) -> Evidence:
    """Goals: exact if the coordinate proof succeeds, else checked on many random valid configurations.
    Targets: must be the same in every configuration and equal the expected answer (sampled strength)."""
    from ..geometry.dsl import GeometrySpec
    from ..geometry.engine import check_spec
    from ..geometry.symbolic import prove_goals

    spec = GeometrySpec.model_validate(p["spec"])
    result = check_spec(spec)
    figure = {"status": result["status"], "detail": result.get("detail"), "initial": result.get("initial")}
    if result["status"] == "invalid":
        return _evidence("inconclusive", "none", f"Hình vẽ không hợp lệ: {result['detail']}", figure=figure)
    if result["status"] == "infeasible":
        return _evidence("inconclusive", "none", result["detail"], figure=figure)
    goals = result["goals"]
    if any(g["outcome"] == "refuted" for g in goals):
        bad = next(g for g in goals if g["outcome"] == "refuted")
        return _evidence("refuted", "sampled", f"Có cấu hình hình vẽ mà kết luận {bad['kind']} không đúng.",
                         figure=figure, goal=bad["index"])
    expected = p.get("expected")
    targets = result["targets"]
    if expected is not None:
        if not targets or not targets[0]["constant"] or targets[0]["value"] is None:
            return _evidence("inconclusive", "none", "Đại lượng cần tính không cố định trên các hình vẽ hợp lệ "
                             "(có thể đề bài thiếu dữ kiện độ dài).", figure=figure)
        want = float(sp.N(parse(expected, set()), 30))
        got = float(targets[0]["value"])
        if abs(got - want) > 1e-6 * max(1.0, abs(want)):
            return _evidence("refuted", "sampled", f"Đo trên hình được {got:.6g}, khác đáp số {expected}.",
                             figure=figure, measured=got)
        return _evidence("confirmed", "sampled",
                         f"Đo trên {result['valid_configs']} hình vẽ hợp lệ: luôn bằng {expected} "
                         "(chưa phải chứng minh).",
                         figure=figure, measured=got)
    if not goals:
        return _evidence("inconclusive", "none", "Không có kết luận nào để kiểm tra.", figure=figure)
    if any(g["outcome"] != "holds" for g in goals):
        return _evidence("inconclusive", "none", "Không kiểm tra được kết luận trên hình vẽ.", figure=figure)
    proofs = prove_goals(spec)
    if proofs is not None and all(proofs):
        return _evidence("confirmed", "exact", "Chứng minh được bằng tọa độ (chỉ dùng để kiểm chứng): kết luận đúng.",
                         figure=figure)
    return _evidence("confirmed", "sampled",
                     f"Kết luận đúng trên {result['valid_configs']} hình vẽ ngẫu nhiên thỏa mãn đề bài "
                     "(chưa phải chứng minh).", figure=figure)


REGISTRY["geometry"] = check_geometry


def build_figure(p: Payload) -> Evidence:
    """Initial configuration + parameter layout for the interactive figure (not a verification)."""
    from ..geometry.dsl import GeometrySpec
    from ..geometry.engine import check_spec, compile_spec

    spec = GeometrySpec.model_validate(p["spec"])
    result = check_spec(spec, samples=6)
    layout = [{"object": oid, "role": role} for oid, role in compile_spec(spec).params] \
        if result["status"] != "invalid" else []
    return {"outcome": "confirmed", "strength": "none", "detail": result.get("detail") or "", "data": {
        "status": result["status"], "initial": result.get("initial"), "layout": layout}}


REGISTRY["figure"] = build_figure


def check_step(p: Payload) -> Evidence:
    """Is `current` a valid consequence of `previous` (both equations in one unknown, or both expressions)?

    - expressions: must be identical as functions (exact simplification, else sampling).
    - equations: the solution set of `current` must contain every real solution of `previous` (no lost roots).
      Extra solutions (e.g. after squaring) are allowed but reported, since they must be checked later.
    """
    names: list[str] = p.get("variables", [])
    allowed = set(names)
    prev, cur = parse(p["previous"], allowed), parse(p["current"], allowed)
    prev_eq, cur_eq = isinstance(prev, sp.Equality), isinstance(cur, sp.Equality)
    if not prev_eq and not cur_eq:
        return check_identity({"variables": names, "lhs": p["previous"], "rhs": p["current"]})
    if prev_eq != cur_eq:
        return _evidence("inconclusive", "none", "Hai bước không cùng dạng (phương trình và biểu thức).")
    if len(names) != 1:
        return _evidence("inconclusive", "none", "Chỉ kiểm tra tự động được bước biến đổi một ẩn.")
    x = sp.Symbol(names[0])

    def real_solutions(eq: Any) -> set[Any] | None:
        try:
            sols = sp.solve(eq.lhs - eq.rhs, x)
        except (NotImplementedError, ValueError, TypeError):
            return None
        out = set()
        for s in sols:
            value = sp.N(s, 40)
            if value.is_real and _defined_at(eq.lhs - eq.rhs, {x: s}):
                out.add(sp.nsimplify(s))
        return out

    before, after = real_solutions(prev), real_solutions(cur)
    if before is None or after is None:
        return _evidence("inconclusive", "none", "Không giải được để so sánh hai bước.")
    lost = [s for s in before if not any(_is_zero(s - t) is True for t in after)]
    gained = [t for t in after if not any(_is_zero(t - s) is True for s in before)]
    if lost:
        return _evidence("refuted", "exact", f"Bước biến đổi làm mất nghiệm {', '.join(str(s) for s in lost)}.",
                         lost=[str(s) for s in lost])
    if gained:
        return _evidence("confirmed", "exact", "Bước biến đổi đúng nhưng có thể sinh nghiệm ngoại lai "
                         f"({', '.join(str(s) for s in gained)}); cần thử lại vào phương trình ban đầu.",
                         gained=[str(s) for s in gained])
    return _evidence("confirmed", "exact", "Hai bước tương đương.")


REGISTRY["step"] = check_step
