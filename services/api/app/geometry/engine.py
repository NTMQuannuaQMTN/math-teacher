"""Numeric geometry engine for a GeometrySpec.

compile_spec   → dependency order, parameter layout, reference/type errors ("unsupported" never guessed)
evaluate       → coordinates of every object for a parameter vector; raises Degenerate with the culprit
solve_givens   → adjust free parameters so the givens hold (least squares), reject collapsed figures
sample_configs → many independent valid configurations (random starts)
check_spec     → feasibility, goals across configurations (counterexample search), constant targets

One static configuration is never treated as proof: goals are checked on every sampled configuration, and a
symbolic proof is attempted separately (geometry/symbolic.py).
"""

from __future__ import annotations

import math
import random
import re
from dataclasses import dataclass, field
from typing import Any

import numpy as np
from scipy.optimize import least_squares

from .dsl import (
    LINE_KINDS,
    POINT_KINDS,
    AngleBisector,
    AngleValue,
    Centroid,
    Circle,
    CircleDiameter,
    Circumcenter,
    Circumcircle,
    Collinear,
    Concyclic,
    Convex,
    EqualAngle,
    EqualLength,
    FreePoint,
    GeometrySpec,
    Incenter,
    Intersection,
    LengthRatio,
    LengthValue,
    Line,
    Midpoint,
    OnCircle,
    OnLine,
    Orthocenter,
    Parallel,
    ParallelLine,
    Perpendicular,
    PerpendicularLine,
    PointOnCircle,
    PointOnLine,
    Projection,
    Reflection,
    Relation,
    Tangency,
    Tangent,
    Target,
)

EPS = 1e-9
HOLD_TOL = 1e-6  # a goal holds below this residual
GIVEN_TOL = 1e-10  # givens are solved much tighter, so goal residuals reflect the geometry, not solver error
FAIL_TOL = 1e-4


class GeometryError(ValueError):
    """The spec cannot be built (bad reference, wrong type, cycle)."""


class Degenerate(Exception):
    def __init__(self, object_id: str, reason: str) -> None:
        super().__init__(f"{object_id}: {reason}")
        self.object_id = object_id
        self.reason = reason


@dataclass(frozen=True)
class Ln:
    p: np.ndarray  # a point on the line
    d: np.ndarray  # unit direction
    kind: str = "line"  # line | segment | ray
    a: np.ndarray | None = None  # defining points (segment/ray extents, point_on_line parameterisation)
    b: np.ndarray | None = None


@dataclass(frozen=True)
class Cr:
    c: np.ndarray
    r: float


Value = np.ndarray | Ln | Cr


def _refs(obj: Any) -> list[str]:
    fields = ("line", "circle", "a", "b", "point", "center", "through", "to", "vertex", "at", "exclude", "near")
    refs: list[str] = []
    for name in fields:
        value = getattr(obj, name, None)
        if isinstance(value, str):
            refs.append(value)
        elif isinstance(value, list):
            refs.extend(value)
    for name in ("of", "points"):
        refs.extend(getattr(obj, name, None) or [])
    return refs


def _kind_of(obj: Any) -> str:
    if obj.kind in POINT_KINDS:
        return "point"
    if obj.kind in LINE_KINDS:
        return "line"
    return "circle"


_EXPECTED: dict[str, dict[str, str]] = {
    "point_on_line": {"line": "line"}, "point_on_circle": {"circle": "circle"}, "projection": {"line": "line",
                                                                                              "point": "point"},
    "parallel": {"through": "point", "to": "line"}, "perpendicular": {"through": "point", "to": "line"},
    "tangent": {"circle": "circle", "at": "point"}, "circle": {"center": "point", "through": "point"},
    "reflection": {"point": "point", "center": "point", "line": "line"},
}


@dataclass
class Compiled:
    spec: GeometrySpec
    order: list[Any]
    kinds: dict[str, str]  # id → point | line | circle
    params: list[tuple[str, str]] = field(default_factory=list)  # (object id, "x"|"y"|"t"|"angle")
    # The objects the givens depend on: solving the givens evaluates only these (often a fraction of the figure).
    given_objects: frozenset[str] = frozenset()

    def param_index(self, object_id: str) -> list[int]:
        return [i for i, (oid, _) in enumerate(self.params) if oid == object_id]


def compile_spec(spec: GeometrySpec) -> Compiled:
    by_id = {o.id: o for o in spec.objects}
    kinds = {o.id: _kind_of(o) for o in spec.objects}
    errors: list[str] = []
    for obj in spec.objects:
        for ref in _refs(obj):
            if ref not in by_id:
                errors.append(f"{obj.id}: unknown object '{ref}'")
        for field_name, expected in _EXPECTED.get(obj.kind, {}).items():
            target_ref = getattr(obj, field_name, None)
            if isinstance(target_ref, str) and target_ref in kinds and kinds[target_ref] != expected:
                errors.append(f"{obj.id}: '{target_ref}' must be a {expected}")
        if obj.kind == "intersection":
            for ref in obj.of:
                if ref in kinds and kinds[ref] == "point":
                    errors.append(f"{obj.id}: cannot intersect a point '{ref}'")
        if obj.kind in ("midpoint", "centroid", "orthocenter", "circumcenter", "incenter",
                        "line", "segment", "ray", "angle_bisector", "circumcircle", "circle_diameter"):
            for ref in _refs(obj):
                if ref in kinds and kinds[ref] != "point":
                    errors.append(f"{obj.id}: '{ref}' must be a point")

    def check_rel(rel: Relation, where: str) -> None:
        names: list[str] = []
        for attr in ("points", "angle"):
            names.extend(getattr(rel, attr, None) or [])
        for attr in ("lines", "segments", "angles"):
            for group in getattr(rel, attr, None) or []:
                names.extend(group)
        if isinstance(rel, Tangency):
            names.extend(rel.line)
        if isinstance(rel, OnCircle | OnLine):
            names.append(rel.point)
        if isinstance(rel, LengthValue):
            names.extend(rel.segment)
        for name in names:
            if name not in kinds:
                errors.append(f"{where}: unknown point '{name}'")
            elif kinds[name] != "point":
                errors.append(f"{where}: '{name}' must be a point")
        if isinstance(rel, OnCircle | Tangency) and kinds.get(rel.circle) != "circle":
            errors.append(f"{where}: '{rel.circle}' must be a circle")
        if isinstance(rel, OnLine) and kinds.get(rel.line) != "line":
            errors.append(f"{where}: '{rel.line}' must be a line")

    for i, rel in enumerate(spec.givens):
        check_rel(rel, f"given {i + 1}")
    for i, rel in enumerate(spec.goals):
        check_rel(rel, f"goal {i + 1}")
    for i, target in enumerate(spec.targets):
        for name in target.points:
            if kinds.get(name) != "point":
                errors.append(f"target {i + 1}: '{name}' must be a point")
    if errors:
        raise GeometryError("; ".join(errors[:12]))

    # Topological order (constructions depend on earlier objects).
    order: list[Any] = []
    state: dict[str, int] = {}

    def visit(oid: str, stack: list[str]) -> None:
        if state.get(oid) == 2:
            return
        if state.get(oid) == 1:
            raise GeometryError(f"circular construction: {' → '.join([*stack, oid])}")
        state[oid] = 1
        for ref in _refs(by_id[oid]):
            visit(ref, [*stack, oid])
        state[oid] = 2
        order.append(by_id[oid])

    for obj in spec.objects:
        visit(obj.id, [])
    compiled = Compiled(spec=spec, order=order, kinds=kinds)
    for obj in order:
        if isinstance(obj, FreePoint):
            compiled.params += [(obj.id, "x"), (obj.id, "y")]
        elif isinstance(obj, PointOnLine):
            compiled.params.append((obj.id, "t"))
        elif isinstance(obj, PointOnCircle):
            compiled.params.append((obj.id, "angle"))
    by_id = {o.id: o for o in spec.objects}
    needed: set[str] = set()
    stack = [name for rel in spec.givens for name in _relation_names(rel) if name in by_id]
    while stack:
        name = stack.pop()
        if name not in needed:
            needed.add(name)
            stack.extend(ref for ref in _refs(by_id[name]) if ref in by_id)
    compiled.given_objects = frozenset(needed)
    return compiled


def _relation_names(rel: Relation) -> list[str]:
    """Every object id a relation mentions (points, and the line or circle of on_line / on_circle / tangency)."""
    names: list[str] = []
    for attr in ("points", "angle", "segment"):
        names.extend(getattr(rel, attr, None) or [])
    for attr in ("lines", "segments", "angles"):
        for group in getattr(rel, attr, None) or []:
            names.extend(group)
    for attr in ("point", "circle"):
        value = getattr(rel, attr, None)
        if isinstance(value, str):
            names.append(value)
    line = getattr(rel, "line", None)
    names.extend(line if isinstance(line, list) else [line] if isinstance(line, str) else [])
    return names


_LINE_FIELDS = {"point_on_line": ("line",), "projection": ("line",), "parallel": ("to",), "perpendicular": ("to",),
                "intersection": ("of",), "reflection": ("line",)}


def normalize_spec(spec: GeometrySpec) -> GeometrySpec:
    """Exact rewrites of common formalizer slips (nothing is guessed):
    - "A on the circle through A, B, C" (or on the line through A) is circular and always true: A is a free point,
      and such a given is dropped, as is "D on c" when D is constructed on c;
    - a line referenced by the names of two of its points but never defined ("BC", "line_BC" where a line is
      expected) is the line through them: that is what the name says."""
    carriers = {o.id: set(o.points) if isinstance(o, Circumcircle) else set(o.through) if isinstance(o, Line)
                else {o.through} if isinstance(o, Circle) and o.through else set() for o in spec.objects}

    def on_own_carrier(point: str, carrier: str | None) -> bool:
        return carrier is not None and point in carriers.get(carrier, set())

    objects = [FreePoint(kind="free_point", id=o.id)
               if (isinstance(o, PointOnCircle) and on_own_carrier(o.id, o.circle))
               or (isinstance(o, PointOnLine) and on_own_carrier(o.id, o.line)) else o for o in spec.objects]
    built_on = {o.id: o.circle if isinstance(o, PointOnCircle) else o.line for o in objects
                if isinstance(o, PointOnCircle | PointOnLine)}

    def redundant(g: Relation) -> bool:
        if not isinstance(g, OnCircle | OnLine):
            return False
        carrier = g.circle if isinstance(g, OnCircle) else g.line
        return on_own_carrier(g.point, carrier) or built_on.get(g.point) == carrier

    givens = [g for g in spec.givens if not redundant(g)]
    if objects != spec.objects or givens != spec.givens:
        spec = spec.model_copy(update={"objects": objects, "givens": givens})
    points = {o.id for o in spec.objects if o.kind in POINT_KINDS}
    ids = {o.id for o in spec.objects}
    wanted: list[str] = [rel.line for rel in [*spec.givens, *spec.goals]
                         if isinstance(rel, OnLine)]
    for obj in spec.objects:
        for name in _LINE_FIELDS.get(obj.kind, ()):
            value = getattr(obj, name)
            wanted.extend(value if isinstance(value, list) else [value] if value is not None else [])
    added: list[Line] = []
    for ref in dict.fromkeys(wanted):
        if ref in ids:
            continue
        name = ref.removeprefix("line_").removeprefix("line")
        splits = [(name[:i], name[i:]) for i in range(1, len(name))
                  if name[:i] in points and name[i:] in points and name[:i] != name[i:]]
        if len(splits) == 1:  # an ambiguous name ("ABC" with points A, AB, BC, C) is left alone
            added.append(Line(kind="line", id=ref, through=list(splits[0])))
            ids.add(ref)
    return spec.model_copy(update={"objects": [*spec.objects, *added]}) if added else spec


POINT_NAME = re.compile(r"^[A-Z](?:'{1,2}|[0-9])?$")
_SPARE_LETTERS = "MNPQKIEFHJLRSTUVXYZGDCBAOW"


def name_points(spec: GeometrySpec) -> GeometrySpec:
    """Points carry the names a student writes on a figure: a capital letter, optionally with ' or a digit (M, A',
    A1). Any other point id (midAB, H_A, footD) is renamed consistently everywhere: the foot of the perpendicular
    from A becomes A' (or A1, A2 …), any other point the next unused letter. Lines and circles keep their ids."""
    used = {o.id for o in spec.objects}
    names: dict[str, str] = {}
    for obj in spec.objects:
        if obj.kind not in POINT_KINDS or POINT_NAME.match(obj.id):
            continue
        base = getattr(obj, "point", None) if obj.kind == "projection" else None
        options = [f"{base}'", *(f"{base}{i}" for i in range(1, 10))] if base and POINT_NAME.match(base) else []
        options += [c for c in _SPARE_LETTERS] + [f"{c}{i}" for i in range(1, 10) for c in _SPARE_LETTERS]
        name = next(n for n in options if n not in used)
        names[obj.id] = name
        used.add(name)
    if not names:
        return spec

    def rename(node: Any, key: str = "") -> Any:
        if isinstance(node, dict):
            return {k: rename(v, k) for k, v in node.items()}
        if isinstance(node, list):
            return [rename(v, key) for v in node]
        return names.get(node, node) if isinstance(node, str) and key != "kind" else node

    return GeometrySpec.model_validate(rename(spec.model_dump(mode="json")))


def drawable(spec: GeometrySpec) -> GeometrySpec | None:
    """For drawing only (never for verification): the part of a spec that builds. Objects with unknown, mistyped or
    circular references are left out with everything built on them, then each relation that no longer checks."""
    objects = list(normalize_spec(spec).objects)
    for _ in range(len(objects) + 1):
        ids = {o.id for o in objects}
        kept = [o for o in objects if all(ref in ids for ref in _refs(o))]
        if len(kept) < len(objects):
            objects = kept
            continue
        if not objects:
            return None
        try:
            compile_spec(spec.model_copy(update={"objects": objects, "givens": [], "goals": [], "targets": []}))
            break
        except GeometryError as exc:
            message = str(exc)
            bad = set(message.removeprefix("circular construction: ").split(" → ")) \
                if message.startswith("circular construction") else {part.split(":")[0] for part in message.split("; ")}
            if not bad & ids:
                return None
            objects = [o for o in objects if o.id not in bad]
    else:
        return None
    base = spec.model_copy(update={"objects": objects, "givens": [], "goals": [], "targets": []})
    for field_name in ("givens", "goals", "targets"):
        for item in getattr(spec, field_name):
            candidate = base.model_copy(update={field_name: [*getattr(base, field_name), item]})
            try:
                compile_spec(candidate)
            except GeometryError:
                continue
            base = candidate
    return base


def _segment_pairs(spec: GeometrySpec) -> list[tuple[str, str]]:
    """Segments the problem talks about: in a given or goal (AC ⊥ BD, BC = 7), a length target, a convex
    polygon's sides."""
    pairs: list[list[str]] = []
    for rel in [*spec.givens, *spec.goals]:
        if isinstance(rel, Perpendicular | Parallel):
            pairs.extend(rel.lines)
        elif isinstance(rel, EqualLength | LengthRatio):
            pairs.extend(rel.segments)
        elif isinstance(rel, LengthValue):
            pairs.append(rel.segment)
        elif isinstance(rel, Tangency):
            pairs.append(rel.line)
        elif isinstance(rel, Convex):
            pairs.extend([rel.points[i], rel.points[(i + 1) % len(rel.points)]] for i in range(len(rel.points)))
    pairs.extend(t.points[:2] for t in spec.targets if t.kind == "length")
    out: dict[frozenset[str], tuple[str, str]] = {}
    for a, b in pairs:
        if a != b:
            out.setdefault(frozenset((a, b)), (a, b))
    return list(out.values())


def with_named_segments(spec: GeometrySpec) -> GeometrySpec:
    """For drawing only: a segment the problem talks about (AC ⊥ BD, BC = 7) is drawn even when the formalizer did
    not declare it, unless a declared line already passes through both points."""
    kinds = {o.id: _kind_of(o) for o in spec.objects}
    on_line: dict[str, set[str]] = {o.id: set() for o in spec.objects if kinds[o.id] == "line"}
    for obj in spec.objects:
        if isinstance(obj, Line):
            on_line[obj.id].update(obj.through)
        elif isinstance(obj, ParallelLine | PerpendicularLine):
            on_line[obj.id].add(obj.through)
        elif isinstance(obj, Tangent):
            on_line[obj.id].add(obj.at)
        elif isinstance(obj, AngleBisector):
            on_line[obj.id].add(obj.vertex)
        elif isinstance(obj, PointOnLine | Projection) and obj.line in on_line:
            on_line[obj.line].add(obj.id)
        elif isinstance(obj, Intersection):
            for ref in obj.of:
                if ref in on_line:
                    on_line[ref].add(obj.id)
    ids = set(kinds)
    added: list[Line] = []
    for a, b in _segment_pairs(spec):
        if kinds.get(a) != "point" or kinds.get(b) != "point" or any({a, b} <= pts for pts in on_line.values()):
            continue
        name = next(n for n in (f"{a}{b}", *(f"s{a}{b}{'' if i == 0 else i}" for i in range(20))) if n not in ids)
        if len(added) + len(spec.objects) >= 60 or len(name) > 24:
            break
        ids.add(name)
        added.append(Line(kind="segment", id=name, through=[a, b]))
    return spec.model_copy(update={"objects": [*spec.objects, *added]}) if added else spec


# --- primitives -------------------------------------------------------------------------------------------------

def _unit(v: np.ndarray, oid: str, what: str) -> np.ndarray:
    n = float(np.hypot(v[0], v[1]))
    if n < EPS:
        raise Degenerate(oid, what)
    return v / n


def _cross(u: np.ndarray, v: np.ndarray) -> float:
    return float(u[0] * v[1] - u[1] * v[0])


def _line_through(a: np.ndarray, b: np.ndarray, oid: str, kind: str = "line") -> Ln:
    return Ln(p=a, d=_unit(b - a, oid, "hai điểm xác định đường thẳng trùng nhau"), kind=kind, a=a, b=b)


def _intersect_lines(l1: Ln, l2: Ln, oid: str) -> np.ndarray:
    det = _cross(l1.d, l2.d)
    if abs(det) < 1e-9:
        raise Degenerate(oid, "hai đường thẳng song song hoặc trùng nhau, không có giao điểm")
    t = _cross(l2.p - l1.p, l2.d) / det
    return l1.p + t * l1.d


def _on_extent(line: Ln, x: np.ndarray) -> bool:
    if line.kind == "line" or line.a is None or line.b is None:
        return True
    span = line.b - line.a
    t = float(np.dot(x - line.a, span) / max(np.dot(span, span), EPS))
    return t >= -1e-9 and (line.kind == "ray" or t <= 1 + 1e-9)


def _line_circle(line: Ln, circle: Cr, oid: str) -> list[np.ndarray]:
    w = line.p - circle.c
    b = float(np.dot(line.d, w))
    c = float(np.dot(w, w)) - circle.r ** 2
    disc = b * b - c
    if disc < -1e-12:
        raise Degenerate(oid, "đường thẳng không cắt đường tròn")
    root = math.sqrt(max(disc, 0.0))
    return [line.p + (-b - root) * line.d, line.p + (-b + root) * line.d]  # ordered along the line


def _circle_circle(c1: Cr, c2: Cr, oid: str) -> list[np.ndarray]:
    delta = c2.c - c1.c
    dist = float(np.hypot(*delta))
    if dist < EPS or dist > c1.r + c2.r + 1e-12 or dist < abs(c1.r - c2.r) - 1e-12:
        raise Degenerate(oid, "hai đường tròn không cắt nhau")
    a = (c1.r ** 2 - c2.r ** 2 + dist ** 2) / (2 * dist)
    h = math.sqrt(max(c1.r ** 2 - a * a, 0.0))
    base = c1.c + a * delta / dist
    perp = np.array([-delta[1], delta[0]]) / dist
    return [base + h * perp, base - h * perp]  # left of c1→c2 first


def _circumcenter(a: np.ndarray, b: np.ndarray, c: np.ndarray, oid: str) -> np.ndarray:
    d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]))
    scale = max(np.ptp(np.array([a, b, c]), axis=0).max(), 1.0)
    if abs(d) < 1e-9 * scale ** 2:
        raise Degenerate(oid, "ba điểm thẳng hàng, không xác định đường tròn")
    sa, sb, sc = (float(np.dot(p, p)) for p in (a, b, c))
    ux = (sa * (b[1] - c[1]) + sb * (c[1] - a[1]) + sc * (a[1] - b[1])) / d
    uy = (sa * (c[0] - b[0]) + sb * (a[0] - c[0]) + sc * (b[0] - a[0])) / d
    return np.array([ux, uy])


def _choose(points: list[np.ndarray], obj: Intersection, values: dict[str, Value], lines: list[Ln]
            ) -> np.ndarray:
    scale = max(1.0, float(np.max(np.abs(np.array(points)))))
    if obj.exclude:
        x = values[obj.exclude]
        assert isinstance(x, np.ndarray)
        dists = [float(np.hypot(*(p - x))) for p in points]
        if min(dists) > 1e-6 * scale:
            raise Degenerate(obj.id, f"{obj.exclude} không phải là một giao điểm")
        return points[int(np.argmax(dists))]
    if obj.near:
        x = values[obj.near]
        assert isinstance(x, np.ndarray)
        return min(points, key=lambda p: float(np.hypot(*(p - x))))
    inside = [p for p in points if all(_on_extent(line, p) for line in lines)]
    if len(inside) == 1:
        return inside[0]
    return points[0]


def evaluate(compiled: Compiled, params: np.ndarray, only: frozenset[str] | None = None) -> dict[str, Value]:
    """Every object's value; with `only`, just those objects (the others still consume their parameters)."""
    values: dict[str, Value] = {}
    index = 0

    def pt(name: str) -> np.ndarray:
        value = values[name]
        assert isinstance(value, np.ndarray)
        return value

    def ln(name: str) -> Ln:
        value = values[name]
        assert isinstance(value, Ln)
        return value

    def cr(name: str) -> Cr:
        value = values[name]
        assert isinstance(value, Cr)
        return value

    for obj in compiled.order:
        oid = obj.id
        if only is not None and oid not in only:
            index += 2 if isinstance(obj, FreePoint) else 1 if isinstance(obj, PointOnLine | PointOnCircle) else 0
            continue
        if isinstance(obj, FreePoint):
            values[oid] = np.array([params[index], params[index + 1]], dtype=float)
            index += 2
        elif isinstance(obj, PointOnLine):
            line, t = ln(obj.line), float(params[index])
            index += 1
            if line.a is not None and line.b is not None:
                values[oid] = line.a + t * (line.b - line.a)
            else:
                values[oid] = line.p + t * 4.0 * line.d
        elif isinstance(obj, PointOnCircle):
            circle, angle = cr(obj.circle), float(params[index])
            index += 1
            values[oid] = circle.c + circle.r * np.array([math.cos(angle), math.sin(angle)])
        elif isinstance(obj, Midpoint):
            values[oid] = (pt(obj.a) + pt(obj.b)) / 2
        elif isinstance(obj, Reflection):
            if obj.center is not None:
                values[oid] = 2 * pt(obj.center) - pt(obj.point)
            else:  # mirror image in a line: twice the foot of the perpendicular, minus the point
                mirror, p = ln(obj.line or ""), pt(obj.point)
                values[oid] = 2 * (mirror.p + float(np.dot(p - mirror.p, mirror.d)) * mirror.d) - p
        elif isinstance(obj, Centroid):
            values[oid] = sum((pt(p) for p in obj.points), np.zeros(2)) / 3
        elif isinstance(obj, Circumcenter):
            a, b, c = (pt(p) for p in obj.points)
            values[oid] = _circumcenter(a, b, c, oid)
        elif isinstance(obj, Orthocenter):
            a, b, c = (pt(p) for p in obj.points)
            values[oid] = a + b + c - 2 * _circumcenter(a, b, c, oid)
        elif isinstance(obj, Incenter):
            a, b, c = (pt(p) for p in obj.points)
            la, lb, lc = (float(np.hypot(*v)) for v in (b - c, c - a, a - b))
            if min(la, lb, lc) < EPS or abs(_cross(b - a, c - a)) < 1e-12:
                raise Degenerate(oid, "tam giác suy biến")
            values[oid] = (la * a + lb * b + lc * c) / (la + lb + lc)
        elif isinstance(obj, Projection):
            line, x = ln(obj.line), pt(obj.point)
            values[oid] = line.p + float(np.dot(x - line.p, line.d)) * line.d
        elif isinstance(obj, Intersection):
            first, second = (values[r] for r in obj.of)
            if isinstance(first, Ln) and isinstance(second, Ln):
                values[oid] = _intersect_lines(first, second, oid)
            elif isinstance(first, Cr) and isinstance(second, Cr):
                values[oid] = _choose(_circle_circle(first, second, oid), obj, values, [])
            elif isinstance(first, Ln) and isinstance(second, Cr):
                values[oid] = _choose(_line_circle(first, second, oid), obj, values, [first])
            elif isinstance(first, Cr) and isinstance(second, Ln):
                values[oid] = _choose(_line_circle(second, first, oid), obj, values, [second])
            else:
                raise GeometryError(f"{oid}: cannot intersect these objects")
        elif isinstance(obj, Line):
            values[oid] = _line_through(pt(obj.through[0]), pt(obj.through[1]), oid, obj.kind)
        elif isinstance(obj, ParallelLine):
            values[oid] = Ln(p=pt(obj.through), d=ln(obj.to).d)
        elif isinstance(obj, PerpendicularLine):
            d = ln(obj.to).d
            values[oid] = Ln(p=pt(obj.through), d=np.array([-d[1], d[0]]))
        elif isinstance(obj, AngleBisector):
            v = pt(obj.vertex)
            u1 = _unit(pt(obj.a) - v, oid, "đỉnh góc trùng với một điểm trên cạnh")
            u2 = _unit(pt(obj.b) - v, oid, "đỉnh góc trùng với một điểm trên cạnh")
            s = u1 + u2
            direction = np.array([-u1[1], u1[0]]) if float(np.hypot(*s)) < 1e-9 else s / float(np.hypot(*s))
            values[oid] = Ln(p=v, d=direction)
        elif isinstance(obj, Tangent):
            circle, at = cr(obj.circle), pt(obj.at)
            radial = at - circle.c
            if abs(float(np.hypot(*radial)) - circle.r) > 1e-7 * max(1.0, circle.r):
                raise Degenerate(oid, f"{obj.at} không nằm trên đường tròn")
            values[oid] = Ln(p=at, d=_unit(np.array([-radial[1], radial[0]]), oid, "bán kính bằng 0"))
        elif isinstance(obj, Circle):
            center = pt(obj.center)
            radius = obj.radius if obj.radius is not None else float(np.hypot(*(pt(obj.through or "") - center)))
            if radius < EPS:
                raise Degenerate(oid, "bán kính bằng 0")
            values[oid] = Cr(c=center, r=radius)
        elif isinstance(obj, Circumcircle):
            a, b, c = (pt(p) for p in obj.points)
            center = _circumcenter(a, b, c, oid)
            values[oid] = Cr(c=center, r=float(np.hypot(*(a - center))))
        elif isinstance(obj, CircleDiameter):
            a, b = pt(obj.a), pt(obj.b)
            radius = float(np.hypot(*(b - a))) / 2
            if radius < EPS:
                raise Degenerate(oid, "hai đầu đường kính trùng nhau")
            values[oid] = Cr(c=(a + b) / 2, r=radius)
    return values


# --- relations ----------------------------------------------------------------------------------------------------

def _as_point(value: Value) -> np.ndarray:
    assert isinstance(value, np.ndarray)
    return value


def _angle(values: dict[str, Value], names: list[str]) -> float:
    a, b, c = (values[n] for n in names)
    assert isinstance(a, np.ndarray) and isinstance(b, np.ndarray) and isinstance(c, np.ndarray)
    u, v = a - b, c - b
    nu, nv = float(np.hypot(*u)), float(np.hypot(*v))
    if nu < EPS or nv < EPS:
        raise Degenerate(names[1], "góc có cạnh độ dài bằng 0")
    return math.acos(max(-1.0, min(1.0, float(np.dot(u, v)) / (nu * nv))))


def _length(values: dict[str, Value], pair: list[str]) -> float:
    a, b = values[pair[0]], values[pair[1]]
    assert isinstance(a, np.ndarray) and isinstance(b, np.ndarray)
    return float(np.hypot(*(a - b)))


def _direction(values: dict[str, Value], pair: list[str]) -> np.ndarray:
    a, b = values[pair[0]], values[pair[1]]
    assert isinstance(a, np.ndarray) and isinstance(b, np.ndarray)
    return _unit(b - a, pair[0], f"{pair[0]} trùng {pair[1]}")


def residuals(rel: Relation, values: dict[str, Value]) -> list[float]:
    """Scale-invariant residuals; all ≈ 0 exactly when the relation holds."""
    if isinstance(rel, Collinear):
        a, b = (values[n] for n in rel.points[:2])
        assert isinstance(a, np.ndarray) and isinstance(b, np.ndarray)
        u = _unit(b - a, rel.points[0], "hai điểm trùng nhau")
        out = []
        for name in rel.points[2:]:
            p = values[name]
            assert isinstance(p, np.ndarray)
            scale = max(float(np.hypot(*(p - a))), float(np.hypot(*(b - a))), EPS)
            out.append(_cross(u, p - a) / scale)
        return out
    if isinstance(rel, Concyclic):
        pts = [_as_point(values[n]) for n in rel.points]
        center = _circumcenter(pts[0], pts[1], pts[2], rel.points[0])
        r = float(np.hypot(*(pts[0] - center)))
        return [(float(np.hypot(*(p - center))) - r) / r for p in pts[3:]]
    if isinstance(rel, Perpendicular):
        return [float(np.dot(_direction(values, rel.lines[0]), _direction(values, rel.lines[1])))]
    if isinstance(rel, Parallel):
        return [_cross(_direction(values, rel.lines[0]), _direction(values, rel.lines[1]))]
    if isinstance(rel, EqualLength):
        l1, l2 = _length(values, rel.segments[0]), _length(values, rel.segments[1])
        return [(l1 - l2) / max((l1 + l2) / 2, EPS)]
    if isinstance(rel, EqualAngle):
        return [_angle(values, rel.angles[0]) - _angle(values, rel.angles[1])]
    if isinstance(rel, AngleValue):
        return [_angle(values, rel.angle) - math.radians(rel.degrees)]
    if isinstance(rel, LengthRatio):
        return [_length(values, rel.segments[0]) / max(_length(values, rel.segments[1]), EPS) - rel.ratio]
    if isinstance(rel, LengthValue):
        return [_length(values, rel.segment) / rel.value - 1]
    if isinstance(rel, OnCircle):
        p, circle = values[rel.point], values[rel.circle]
        assert isinstance(p, np.ndarray) and isinstance(circle, Cr)
        return [(float(np.hypot(*(p - circle.c))) - circle.r) / circle.r]
    if isinstance(rel, OnLine):
        p, line = values[rel.point], values[rel.line]
        assert isinstance(p, np.ndarray) and isinstance(line, Ln)
        return [_cross(line.d, p - line.p) / max(float(np.hypot(*(p - line.p))), 1.0)]
    if isinstance(rel, Tangency):
        circle = values[rel.circle]
        assert isinstance(circle, Cr)
        a, b = _as_point(values[rel.line[0]]), _as_point(values[rel.line[1]])
        d = _direction(values, rel.line)
        # Distance-to-centre is maximal at tangency, so (dist − r) is quadratic in the error and ill-conditioned.
        # When the line passes through a point of the circle, use "radius ⊥ line" there instead (linear).
        for touch in (b, a):
            if abs(float(np.hypot(*(touch - circle.c))) - circle.r) < 1e-6 * circle.r:
                return [float(np.dot(_unit(touch - circle.c, rel.circle, "bán kính bằng 0"), d))]
        return [(abs(_cross(d, circle.c - a)) - circle.r) / circle.r]
    if isinstance(rel, Convex):
        return convex_residuals([_as_point(values[n]) for n in rel.points])
    raise GeometryError(f"unsupported relation {rel.kind}")


CONVEX_MARGIN = 0.02  # each turn must exceed ~1° (relative to the mean side), so a convex figure is visibly convex


def convex_residuals(pts: list[np.ndarray]) -> list[float]:
    """Zero when the polygon (vertices in order) is convex: every turn has the same sign, at least a small margin,
    and the turns add up to one full turn (a star pentagon also turns one way). A hinge per vertex, so it is
    exactly 0 on every convex figure and pushes a dented one outwards."""
    n = len(pts)
    sides = [pts[(i + 1) % n] - pts[i] for i in range(n)]
    scale = max(float(np.mean([np.hypot(*s) for s in sides])) ** 2, EPS)
    turns = [_cross(sides[i], sides[(i + 1) % n]) for i in range(n)]
    sign = 1.0 if sum(turns) >= 0 else -1.0
    out = [min(0.0, sign * t / scale - CONVEX_MARGIN) for t in turns]
    if n >= 5:
        total = sum(math.atan2(_cross(sides[i], sides[(i + 1) % n]), float(np.dot(sides[i], sides[(i + 1) % n])))
                    for i in range(n))
        out.append((abs(total) - 2 * math.pi) / (2 * math.pi))
    return out


def target_value(target: Target, values: dict[str, Value]) -> float:
    if target.kind == "length":
        return _length(values, target.points[:2])
    if target.kind == "angle":
        return math.degrees(_angle(values, target.points[:3]))
    if target.kind == "ratio":
        return _length(values, target.points[:2]) / max(_length(values, target.points[2:4]), EPS)
    a, b, c = (values[n] for n in target.points[:3])
    assert isinstance(a, np.ndarray) and isinstance(b, np.ndarray) and isinstance(c, np.ndarray)
    return abs(_cross(b - a, c - a)) / 2


# --- configurations -----------------------------------------------------------------------------------------------

def _random_params(compiled: Compiled, rng: random.Random, hinted: bool) -> np.ndarray:
    by_id: dict[str, Any] = {o.id: o for o in compiled.spec.objects}
    out = []
    for oid, role in compiled.params:
        obj = by_id[oid]
        if role in ("x", "y"):
            hint = getattr(obj, role, None)
            out.append(float(hint) if hinted and hint is not None else rng.uniform(-5, 5))
        elif role == "t":
            line_obj = by_id[obj.line]
            if hinted and obj.t is not None:
                out.append(float(obj.t))
            elif getattr(line_obj, "kind", "") == "segment":
                out.append(rng.uniform(0.15, 0.85))
            elif getattr(line_obj, "kind", "") == "ray":
                out.append(rng.uniform(0.2, 2.5))
            else:
                out.append(rng.uniform(-1.5, 2.5))
        else:
            out.append(math.radians(obj.angle) if hinted and obj.angle is not None else rng.uniform(0, 2 * math.pi))
    return np.array(out, dtype=float)


def _point_ids(compiled: Compiled) -> list[str]:
    return [oid for oid, kind in compiled.kinds.items() if kind == "point"]


def _collapsed_pair(compiled: Compiled, values: dict[str, Value]) -> tuple[str, str] | None:
    """Two differently-named points at the same place (unless the spec says they coincide)."""
    pts = [(oid, _as_point(values[oid])) for oid in _point_ids(compiled)]
    coords = np.array([p for _, p in pts])
    scale = max(float(np.ptp(coords, axis=0).max()) if len(coords) > 1 else 1.0, EPS)
    for i in range(len(pts)):
        for j in range(i + 1, len(pts)):
            if float(np.hypot(*(pts[i][1] - pts[j][1]))) < 1e-4 * scale:
                return pts[i][0], pts[j][0]
    return None


def _collapsed(compiled: Compiled, values: dict[str, Value]) -> str | None:
    pair = _collapsed_pair(compiled, values)
    return f"{pair[0]} trùng {pair[1]}" if pair else None


def culprit(spec: GeometrySpec, tries: int = 12, seed: int = 7) -> tuple[str, str] | None:
    """The object that breaks every figure, and why: the one a construction cannot be built at (a line through two
    points that always coincide), or the later-built of two points that always coincide (e.g. "G = the other
    intersection of DJ with (S)" when J is that intersection). Givens are ignored here: they have their own fallback.
    None when random figures build."""
    compiled = compile_spec(spec)
    position = {o.id: i for i, o in enumerate(compiled.order)}
    free = {o.id for o in spec.objects if isinstance(o, FreePoint)}
    rng = random.Random(seed)  # noqa: S311 - reproducible sampling, not security
    found: list[tuple[str, str]] = []
    for _ in range(tries):
        try:
            values = evaluate(compiled, _random_params(compiled, rng, hinted=False))
        except Degenerate as exc:
            found.append((exc.object_id, exc.reason))
            continue
        pair = _collapsed_pair(compiled, values)
        if pair is None:
            return None  # this one builds
        later = max((p for p in pair if p not in free), key=lambda p: position.get(p, -1), default=None)
        if later is not None:
            found.append((later, f"{pair[0]} trùng {pair[1]}"))
    if not found:
        return None
    ids = [f[0] for f in found]
    best = max(set(ids), key=ids.count)
    return best, next(reason for oid, reason in found if oid == best)


def without(spec: GeometrySpec, object_id: str) -> GeometrySpec | None:
    """The drawable rest of the spec once an object (and everything built on it, and every relation using it) is
    left out."""
    objects = [o for o in spec.objects if o.id != object_id]
    if len(objects) == len(spec.objects) or not objects:
        return None
    return drawable(spec.model_copy(update={"objects": objects}))


def _given_residuals(compiled: Compiled, params: np.ndarray) -> np.ndarray:
    try:
        values = evaluate(compiled, params, only=compiled.given_objects)
        res = [r for rel in compiled.spec.givens for r in residuals(rel, values)]
    except Degenerate:
        res = [10.0] * max(1, sum(len(getattr(g, "points", [None, None, None])) for g in compiled.spec.givens))
    return np.array(res or [0.0], dtype=float)


def solve_givens(compiled: Compiled, start: np.ndarray, fixed: list[int] | None = None) -> np.ndarray | None:
    """Parameters satisfying the givens, starting near `start`; `fixed` indices are held (e.g. a dragged point)."""
    if not compiled.spec.givens or not len(start):
        return start
    free_idx = [i for i in range(len(start)) if not fixed or i not in fixed]
    if not free_idx:
        return start if float(np.max(np.abs(_given_residuals(compiled, start)))) < GIVEN_TOL else None

    def fun(sub: np.ndarray) -> np.ndarray:
        full = start.copy()
        full[free_idx] = sub
        return _given_residuals(compiled, full)

    count = len(fun(start[free_idx]))
    method = "lm" if count >= len(free_idx) else "trf"
    try:
        # Solvable starts converge within ~75 evaluations (measured on 16 benchmark figures, 2026-11-08); a start that
        # needs more almost never converges, and 4000 evaluations made one figure check take ~50 s.
        result = least_squares(fun, start[free_idx], method=method, xtol=1e-14, ftol=1e-14, gtol=1e-14,
                               max_nfev=400)
    except ValueError:
        return None
    full = start.copy()
    full[free_idx] = result.x
    if float(np.max(np.abs(_given_residuals(compiled, full)))) > GIVEN_TOL:
        return None
    return full


@dataclass
class Config:
    params: np.ndarray
    values: dict[str, Value]


def sample_configs(compiled: Compiled, count: int, seed: int = 1, attempts: int = 400, hinted_first: bool = False
                   ) -> tuple[list[Config], list[str]]:
    rng = random.Random(seed)  # noqa: S311 - reproducible sampling, not security
    configs: list[Config] = []
    problems: list[str] = []
    for attempt in range(attempts):
        if len(configs) >= count:
            break
        start = _random_params(compiled, rng, hinted=hinted_first and attempt == 0)
        params = solve_givens(compiled, start)
        if params is None:
            problems.append("givens")
            continue
        try:
            values = evaluate(compiled, params)
        except Degenerate as exc:
            problems.append(exc.reason)
            continue
        collapsed = _collapsed(compiled, values)
        if collapsed:
            problems.append(collapsed)
            continue
        configs.append(Config(params, values))
    return configs, problems


# --- the check ----------------------------------------------------------------------------------------------------

def _serialize(values: dict[str, Value]) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for oid, value in values.items():
        if isinstance(value, np.ndarray):
            out[oid] = {"type": "point", "x": round(float(value[0]), 9), "y": round(float(value[1]), 9)}
        elif isinstance(value, Ln):
            out[oid] = {"type": "line", "kind": value.kind, "p": [float(value.p[0]), float(value.p[1])],
                        "d": [float(value.d[0]), float(value.d[1])]}
        else:
            out[oid] = {"type": "circle", "c": [float(value.c[0]), float(value.c[1])], "r": float(value.r)}
    return out


def point_spread(values: dict[str, Value]) -> float:
    """How readable a configuration is: the smallest distance between two points, relative to the figure's size
    (points and circles). A figure whose points crowd together scores near 0."""
    points = [v for v in values.values() if isinstance(v, np.ndarray)]
    if len(points) < 2:
        return 1.0
    xs = [float(p[0]) for p in points]
    ys = [float(p[1]) for p in points]
    for v in values.values():
        if isinstance(v, Cr):
            xs += [float(v.c[0] - v.r), float(v.c[0] + v.r)]
            ys += [float(v.c[1] - v.r), float(v.c[1] + v.r)]
    size = max(max(xs) - min(xs), max(ys) - min(ys), EPS)
    closest = min(float(np.hypot(*(p - q))) for i, p in enumerate(points) for q in points[i + 1:])
    return closest / size


def check_spec(spec: GeometrySpec, samples: int = 24) -> dict[str, Any]:
    """Feasibility, goals over many configurations, and constant targets. JSON-serialisable result."""
    try:
        compiled = compile_spec(spec)
    except GeometryError as exc:
        return {"status": "invalid", "detail": str(exc)}
    configs, problems = sample_configs(compiled, samples, hinted_first=True)
    if len(configs) < max(3, samples // 3):
        reason = max(set(problems), key=problems.count) if problems else "không dựng được"
        return {"status": "infeasible", "detail": f"Không dựng được hình thỏa mãn đề bài ({reason}).",
                "valid_configs": len(configs)}

    goals: list[dict[str, Any]] = []
    for index, goal in enumerate(spec.goals):
        worst, failing = 0.0, None
        degenerate = 0
        for config in configs:
            try:
                res = max(abs(r) for r in residuals(goal, config.values))
            except Degenerate:
                degenerate += 1
                continue
            if res > worst:
                worst, failing = res, config
        if degenerate == len(configs):
            outcome = "inconclusive"
        elif worst > FAIL_TOL:
            outcome = "refuted"
        elif worst < HOLD_TOL:
            outcome = "holds"
        else:
            outcome = "inconclusive"
        goals.append({"index": index, "kind": goal.kind, "outcome": outcome, "max_residual": worst,
                      "counterexample": _serialize(failing.values) if outcome == "refuted" and failing else None})

    targets: list[dict[str, Any]] = []
    for index, target in enumerate(spec.targets):
        observed = []
        for config in configs:
            try:
                observed.append(target_value(target, config.values))
            except Degenerate:
                continue
        if not observed:
            targets.append({"index": index, "constant": False, "value": None})
            continue
        mean = sum(observed) / len(observed)
        spread = max(abs(v - mean) for v in observed)
        targets.append({"index": index, "constant": spread < 1e-6 * max(1.0, abs(mean)), "value": mean,
                        "spread": spread})
    # The figure first shows the configuration whose points are best spread out (no crowded labels).
    shown = max(configs, key=lambda c: point_spread(c.values))
    return {"status": "ok", "valid_configs": len(configs), "goals": goals, "targets": targets,
            "initial": {"params": [float(p) for p in shown.params], "values": _serialize(shown.values)}}
