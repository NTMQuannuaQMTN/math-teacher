"""Whitelisted parser from model-written math expressions to SymPy.

Model output is never evaluated as Python. The text is parsed with `ast` and only an explicit set of node
types, operators, names and functions is converted; everything else is rejected. Sizes are bounded so a
hostile expression cannot exhaust CPU or memory (e.g. `9**9**9`).

Syntax: plain ASCII math with explicit `*` (`2*x`, not `2x`), `^` or `**` for powers, comparisons
(`==`, `!=`, `<`, `<=`, `>`, `>=`), `and` / `or` / `not`, tuples `(x, y)`.
"""

from __future__ import annotations

import ast
import math
import re
from collections.abc import Callable
from typing import Any

import sympy as sp

MAX_LENGTH = 600
MAX_NODES = 400
MAX_EXPONENT = 10_000
MAX_RESULT_DIGITS = 5_000
MAX_INT_DIGITS = 60

class IntGcd(sp.Function):  # type: ignore[misc]  # SymPy is untyped
    """Integer gcd that stays unevaluated until every argument is an integer. SymPy's `gcd(a, b)` of two symbols is
    the polynomial gcd, 1, which would make the condition `gcd(a, b) == 1` true before any value is substituted."""

    @classmethod
    def eval(cls, *args: Any) -> Any:
        if args and all(arg.is_Integer for arg in args):
            return sp.Integer(math.gcd(*(int(arg) for arg in args)))
        return None


class IntLcm(sp.Function):  # type: ignore[misc]
    """Integer lcm, unevaluated until the arguments are integers (SymPy's `lcm(a, b)` of symbols is `a*b`)."""

    @classmethod
    def eval(cls, *args: Any) -> Any:
        if args and all(arg.is_Integer for arg in args):
            return sp.Integer(math.lcm(*(int(arg) for arg in args)))
        return None


_NAME = re.compile(r"^[A-Za-z][A-Za-z0-9_]{0,15}$")
_ALLOWED_CHARS = re.compile(r"[A-Za-z0-9_+\-*/^%().,<>=! \t≤≥≠]+")
_CONSTANTS: dict[str, Any] = {"pi": sp.pi, "E": sp.E, "oo": sp.oo, "true": sp.true, "false": sp.false}
_FUNCTIONS: dict[str, Callable[..., Any]] = {
    "sqrt": sp.sqrt, "cbrt": lambda x: sp.root(x, 3), "root": sp.root, "Abs": sp.Abs, "abs": sp.Abs,
    "gcd": IntGcd, "lcm": IntLcm, "factorial": sp.factorial, "binomial": sp.binomial, "floor": sp.floor,
    "ceiling": sp.ceiling, "Min": sp.Min, "Max": sp.Max, "min": sp.Min, "max": sp.Max, "Mod": sp.Mod,
    "sin": sp.sin, "cos": sp.cos, "tan": sp.tan, "cot": sp.cot,
}
# Functions whose cost explodes with the size of a numeric argument.
_BOUNDED = {"factorial": 2000, "binomial": 10_000, "gcd": 10**60, "lcm": 10**60}
# Names that must never become symbols (they read like code, not maths).
_RESERVED = {"lambda", "import", "exec", "eval", "open", "self", "class", "def", "for", "while", "print"}


class ExpressionError(ValueError):
    pass


def _check_int(value: int) -> int:
    if len(str(abs(value))) > MAX_INT_DIGITS:
        raise ExpressionError("integer literal too large")
    return value


class _Converter:
    def __init__(self, allowed_symbols: set[str] | None) -> None:
        self.allowed = allowed_symbols
        self.symbols: dict[str, sp.Symbol] = {}

    def symbol(self, name: str) -> sp.Symbol:
        if name in _RESERVED or not _NAME.match(name):
            raise ExpressionError(f"invalid name: {name}")
        if self.allowed is not None and name not in self.allowed:
            raise ExpressionError(f"unknown variable: {name}")
        return self.symbols.setdefault(name, sp.Symbol(name))

    def convert(self, node: ast.AST) -> Any:
        match node:
            case ast.Expression(body=body):
                return self.convert(body)
            case ast.Constant(value=bool()):
                return sp.true if node.value else sp.false
            case ast.Constant(value=int() as value):
                return sp.Integer(_check_int(value))
            case ast.Constant(value=float() as value):
                if value != value or value in (float("inf"), float("-inf")) or abs(value) > 1e30:
                    raise ExpressionError("number out of range")
                return sp.nsimplify(repr(value), rational=True)
            case ast.Name(id=name):
                if name in _CONSTANTS:
                    return _CONSTANTS[name]
                return self.symbol(name)
            case ast.UnaryOp(op=ast.USub(), operand=operand):
                return -self.convert(operand)
            case ast.UnaryOp(op=ast.UAdd(), operand=operand):
                return self.convert(operand)
            case ast.UnaryOp(op=ast.Not(), operand=operand):
                return sp.Not(self.convert(operand))
            case ast.BinOp(left=left, op=op, right=right):
                return self.binop(left, op, right)
            case ast.BoolOp(op=ast.And(), values=values):
                return sp.And(*(self.convert(v) for v in values))
            case ast.BoolOp(op=ast.Or(), values=values):
                return sp.Or(*(self.convert(v) for v in values))
            case ast.Compare(left=left, ops=ops, comparators=comparators):
                return self.compare(left, ops, comparators)
            case ast.Call(func=ast.Name(id=name), args=args, keywords=[]) if name in _FUNCTIONS:
                if not 1 <= len(args) <= 4:
                    raise ExpressionError(f"bad argument count for {name}")
                converted = [self.convert(a) for a in args]
                if name in _BOUNDED and any(a.is_number and abs(a) > _BOUNDED[name] for a in converted):
                    raise ExpressionError(f"argument too large for {name}")
                return _FUNCTIONS[name](*converted)
            case ast.Tuple(elts=elts):
                return sp.Tuple(*(self.convert(e) for e in elts))
        raise ExpressionError(f"unsupported syntax: {type(node).__name__}")

    def binop(self, left: ast.AST, op: ast.operator, right: ast.AST) -> Any:
        a, b = self.convert(left), self.convert(right)
        match op:
            case ast.Add():
                return a + b
            case ast.Sub():
                return a - b
            case ast.Mult():
                return a * b
            case ast.Div():
                return a / b
            case ast.Mod():
                return sp.Mod(a, b)
            case ast.FloorDiv():
                return sp.floor(a / b)
            case ast.Pow():
                if b.is_number and (not b.is_finite or abs(b) > MAX_EXPONENT):
                    raise ExpressionError("exponent too large")
                # A numeric power is evaluated immediately: bound the size of the result, not the exponent.
                if a.is_number and b.is_number and abs(a) > 1 and \
                        float(abs(b)) * math.log10(float(abs(a))) > MAX_RESULT_DIGITS:
                    raise ExpressionError("power too large")
                return a**b
        raise ExpressionError(f"unsupported operator: {type(op).__name__}")

    def compare(self, left: ast.AST, ops: list[ast.cmpop], comparators: list[ast.expr]) -> Any:
        relations = []
        current = self.convert(left)
        for op, comp in zip(ops, comparators, strict=True):
            other = self.convert(comp)
            match op:
                case ast.Eq():
                    relations.append(sp.Eq(current, other, evaluate=False))
                case ast.NotEq():
                    relations.append(sp.Ne(current, other, evaluate=False))
                case ast.Lt():
                    relations.append(sp.Lt(current, other, evaluate=False))
                case ast.LtE():
                    relations.append(sp.Le(current, other, evaluate=False))
                case ast.Gt():
                    relations.append(sp.Gt(current, other, evaluate=False))
                case ast.GtE():
                    relations.append(sp.Ge(current, other, evaluate=False))
                case _:
                    raise ExpressionError("unsupported comparison")
            current = other
        return relations[0] if len(relations) == 1 else sp.And(*relations)


def _prepare(text: str) -> str:
    if not isinstance(text, str):
        raise ExpressionError("expression must be a string")
    text = text.strip()
    if not text:
        raise ExpressionError("empty expression")
    if len(text) > MAX_LENGTH:
        raise ExpressionError("expression too long")
    if not _ALLOWED_CHARS.fullmatch(text) or "!" in text.replace("!=", ""):
        raise ExpressionError("unsupported characters")
    # `=` alone means equality in maths; keep `==`, `<=`, `>=`, `!=` intact.
    text = re.sub(r"(?<![=<>!])=(?!=)", "==", text)
    return text.replace("^", "**").replace("≤", "<=").replace("≥", ">=").replace("≠", "!=")


def _implicit_multiplication(source: str, allowed: set[str] | None) -> str:
    """`2x` → `2*x`; and, when every variable is a single letter, `ab^2` → `a*b^2` (only for known variables)."""
    number_before_name = (r"(?<![A-Za-z_\d.])(\d+(?:\.\d+)?)\s*"  # a number not part of a name …
                          r"(?![eE][+-]?\d)(?!(?:and|or|not|if|else|in|is)\b)(?=[A-Za-z(])")  # … before a name
    source = re.sub(number_before_name, r"\1*", source)
    if not allowed or any(len(name) != 1 for name in allowed):
        return source

    def split(match: re.Match[str]) -> str:
        word = match.group(0)
        if word in allowed or word in _FUNCTIONS or word in _CONSTANTS or word in ("and", "or", "not"):
            return word
        if all(ch in allowed for ch in word):
            return "*".join(word)
        return word

    return re.sub(r"[A-Za-z]{2,}", split, source)


def parse(text: str, allowed_symbols: set[str] | None = None) -> Any:
    """Parse `text` into a SymPy object. Raises ExpressionError for anything outside the whitelist."""
    source = _implicit_multiplication(_prepare(text), allowed_symbols)
    try:
        tree = ast.parse(source, mode="eval")
    except SyntaxError as exc:
        raise ExpressionError(f"syntax error: {exc.msg}") from exc
    if sum(1 for _ in ast.walk(tree)) > MAX_NODES:
        raise ExpressionError("expression too complex")
    try:
        return _Converter(allowed_symbols).convert(tree)
    except (TypeError, ValueError, ZeroDivisionError, OverflowError) as exc:
        if isinstance(exc, ExpressionError):
            raise
        raise ExpressionError(f"invalid expression: {exc}") from exc
