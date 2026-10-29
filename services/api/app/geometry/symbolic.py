"""Exact proof of goals for rational constructions (coordinate method with symbolic free points).

Supported: free points, midpoint, point reflection, centroid, circumcenter, orthocenter, lines/segments/rays,
parallel/perpendicular lines, projections and line–line intersections; no givens. Each goal becomes a rational
function of the free coordinates; it is proven when its numerator simplifies to 0 identically (valid wherever the
construction is non-degenerate). Anything else returns None — the numeric check still applies.
"""

from __future__ import annotations

from typing import Any

import sympy as sp

from .dsl import (
    Centroid,
    Circumcenter,
    Collinear,
    Concyclic,
    EqualLength,
    FreePoint,
    GeometrySpec,
    Intersection,
    Line,
    Midpoint,
    OnLine,
    Orthocenter,
    Parallel,
    ParallelLine,
    Perpendicular,
    PerpendicularLine,
    Projection,
    Reflection,
    Relation,
)
from .engine import compile_spec

Vec = tuple[Any, Any]
SymLine = tuple[Vec, Vec]  # point, direction (not normalised)


def _sub(a: Vec, b: Vec) -> Vec:
    return (a[0] - b[0], a[1] - b[1])


def _cross(u: Vec, v: Vec) -> Any:
    return u[0] * v[1] - u[1] * v[0]


def _dot(u: Vec, v: Vec) -> Any:
    return u[0] * v[0] + u[1] * v[1]


def _circumcenter(a: Vec, b: Vec, c: Vec) -> Vec:
    d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]))
    sa, sb, sc = (_dot(p, p) for p in (a, b, c))
    return ((sa * (b[1] - c[1]) + sb * (c[1] - a[1]) + sc * (a[1] - b[1])) / d,
            (sa * (c[0] - b[0]) + sb * (a[0] - c[0]) + sc * (b[0] - a[0])) / d)


SUPPORTED = (FreePoint, Midpoint, Reflection, Centroid, Circumcenter, Orthocenter, Line, ParallelLine,
             PerpendicularLine, Projection, Intersection)
SUPPORTED_GOALS = (Collinear, Perpendicular, Parallel, EqualLength, Concyclic, OnLine)


def _evaluate(spec: GeometrySpec) -> dict[str, Any] | None:
    compiled = compile_spec(spec)
    values: dict[str, Any] = {}
    for obj in compiled.order:
        if not isinstance(obj, SUPPORTED):
            return None
        oid = obj.id
        if isinstance(obj, FreePoint):
            values[oid] = (sp.Symbol(f"x_{oid}", real=True), sp.Symbol(f"y_{oid}", real=True))
        elif isinstance(obj, Midpoint):
            a, b = values[obj.a], values[obj.b]
            values[oid] = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
        elif isinstance(obj, Reflection):
            p, c = values[obj.point], values[obj.center]
            values[oid] = (2 * c[0] - p[0], 2 * c[1] - p[1])
        elif isinstance(obj, Centroid):
            pts = [values[p] for p in obj.points]
            values[oid] = (sum(p[0] for p in pts) / 3, sum(p[1] for p in pts) / 3)
        elif isinstance(obj, Circumcenter):
            values[oid] = _circumcenter(*(values[p] for p in obj.points))
        elif isinstance(obj, Orthocenter):
            a, b, c = (values[p] for p in obj.points)
            o = _circumcenter(a, b, c)
            values[oid] = (a[0] + b[0] + c[0] - 2 * o[0], a[1] + b[1] + c[1] - 2 * o[1])
        elif isinstance(obj, Line):
            a, b = (values[p] for p in obj.through)
            values[oid] = (a, _sub(b, a))
        elif isinstance(obj, ParallelLine):
            values[oid] = (values[obj.through], values[obj.to][1])
        elif isinstance(obj, PerpendicularLine):
            d = values[obj.to][1]
            values[oid] = (values[obj.through], (-d[1], d[0]))
        elif isinstance(obj, Projection):
            (p0, d), x = values[obj.line], values[obj.point]
            t = _dot(_sub(x, p0), d) / _dot(d, d)
            values[oid] = (p0[0] + t * d[0], p0[1] + t * d[1])
        elif isinstance(obj, Intersection):
            first, second = (values[r] for r in obj.of)
            if not (isinstance(first[0], tuple) and isinstance(second[0], tuple)):
                return None  # circle intersections need square roots
            (p1, d1), (p2, d2) = first, second
            t = _cross(_sub(p2, p1), d2) / _cross(d1, d2)
            values[oid] = (p1[0] + t * d1[0], p1[1] + t * d1[1])
    return values


def _goal_expression(goal: Relation, v: dict[str, Any]) -> list[Any]:
    if isinstance(goal, Collinear):
        a, b = v[goal.points[0]], v[goal.points[1]]
        return [_cross(_sub(b, a), _sub(v[p], a)) for p in goal.points[2:]]
    if isinstance(goal, Perpendicular):
        (a, b), (c, d) = ([v[p] for p in pair] for pair in goal.lines)
        return [_dot(_sub(b, a), _sub(d, c))]
    if isinstance(goal, Parallel):
        (a, b), (c, d) = ([v[p] for p in pair] for pair in goal.lines)
        return [_cross(_sub(b, a), _sub(d, c))]
    if isinstance(goal, EqualLength):
        (a, b), (c, d) = ([v[p] for p in pair] for pair in goal.segments)
        return [_dot(_sub(b, a), _sub(b, a)) - _dot(_sub(d, c), _sub(d, c))]
    if isinstance(goal, Concyclic):
        rows = [[_dot(v[p], v[p]), v[p][0], v[p][1], 1] for p in goal.points]
        return [sp.Matrix([rows[0], rows[1], rows[2], row]).det() for row in rows[3:]]
    if isinstance(goal, OnLine):
        p0, d = v[goal.line]
        return [_cross(d, _sub(v[goal.point], p0))]
    raise ValueError("unsupported goal")


def prove_goals(spec: GeometrySpec) -> list[bool | None] | None:
    """Per goal: True (proven), False (identity fails), None (not attempted). None overall if unsupported."""
    if spec.givens:
        return None
    values = _evaluate(spec)
    if values is None:
        return None
    results: list[bool | None] = []
    for goal in spec.goals:
        if not isinstance(goal, SUPPORTED_GOALS):
            results.append(None)
            continue
        proven = True
        for expression in _goal_expression(goal, values):
            numerator, _ = sp.fraction(sp.together(expression))
            if sp.expand(numerator) != 0:
                proven = False
                break
        results.append(proven)
    return results
