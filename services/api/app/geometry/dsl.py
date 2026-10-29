"""Typed geometry DSL: objects (free points and constructions), givens, goals and measured targets.

The four concerns are kept separate:
- `objects`  : what exists and how it is built (free points, constructions). Order does not matter.
- `givens`   : constraints that free points must satisfy but that are not constructions (e.g. AB = AC).
- `goals`    : relations to prove (never assumed).
- `targets`  : quantities a "tính" question asks for (lengths, angles, ratios).
Derived facts and verification evidence are produced by the engine, never written in the spec.

Anything outside this vocabulary is a validation error, reported as "unsupported" — never approximated.
"""

from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, Field, model_validator

Id = Annotated[str, Field(pattern=r"^[A-Za-z][A-Za-z0-9_']{0,11}$",
                          description="Name as in the problem, e.g. A, M, d1")]


class _Obj(BaseModel):
    id: Id


# --- points ---------------------------------------------------------------------------------------------------

class FreePoint(_Obj):
    kind: Literal["free_point"]
    x: float | None = Field(default=None, description="Optional suggested position (drawing only).")
    y: float | None = None


class PointOnLine(_Obj):
    kind: Literal["point_on_line"]
    line: Id = Field(description="A line, segment or ray id.")
    t: float | None = Field(default=None, description="Optional position parameter along the line.")


class PointOnCircle(_Obj):
    kind: Literal["point_on_circle"]
    circle: Id
    angle: float | None = Field(default=None, description="Optional suggested angle in degrees.")


class Midpoint(_Obj):
    kind: Literal["midpoint"]
    a: Id
    b: Id


class Intersection(_Obj):
    kind: Literal["intersection"]
    of: list[Id] = Field(min_length=2, max_length=2, description="Two lines/segments/rays/circles.")
    exclude: Id | None = Field(default=None, description="With a circle: the other intersection point than this one.")
    near: Id | None = Field(default=None, description="With a circle: the intersection closer to this point.")


class Projection(_Obj):
    kind: Literal["projection"]
    point: Id
    line: Id = Field(description="Foot of the perpendicular from `point` to this line.")


class Reflection(_Obj):
    kind: Literal["reflection"]
    point: Id
    center: Id = Field(description="Point reflection through `center` (đối xứng tâm).")


class Centroid(_Obj):
    kind: Literal["centroid"]
    points: list[Id] = Field(min_length=3, max_length=3)


class Orthocenter(_Obj):
    kind: Literal["orthocenter"]
    points: list[Id] = Field(min_length=3, max_length=3)


class Circumcenter(_Obj):
    kind: Literal["circumcenter"]
    points: list[Id] = Field(min_length=3, max_length=3)


class Incenter(_Obj):
    kind: Literal["incenter"]
    points: list[Id] = Field(min_length=3, max_length=3)


# --- lines ----------------------------------------------------------------------------------------------------

class Line(_Obj):
    kind: Literal["line", "segment", "ray"]
    through: list[Id] = Field(min_length=2, max_length=2, description="For a ray: [origin, point on ray].")


class ParallelLine(_Obj):
    kind: Literal["parallel"]
    through: Id
    to: Id


class PerpendicularLine(_Obj):
    kind: Literal["perpendicular"]
    through: Id
    to: Id


class AngleBisector(_Obj):
    kind: Literal["angle_bisector"]
    vertex: Id
    a: Id
    b: Id


class Tangent(_Obj):
    kind: Literal["tangent"]
    circle: Id
    at: Id = Field(description="A point on the circle; the tangent line there.")


# --- circles --------------------------------------------------------------------------------------------------

class Circle(_Obj):
    kind: Literal["circle"]
    center: Id
    through: Id | None = None
    radius: float | None = Field(default=None, gt=0)

    @model_validator(mode="after")
    def _one(self) -> Circle:
        if (self.through is None) == (self.radius is None):
            raise ValueError("circle needs exactly one of 'through' or 'radius'")
        return self


class Circumcircle(_Obj):
    kind: Literal["circumcircle"]
    points: list[Id] = Field(min_length=3, max_length=3)


class CircleDiameter(_Obj):
    kind: Literal["circle_diameter"]
    a: Id
    b: Id


GeoObject = Annotated[
    FreePoint | PointOnLine | PointOnCircle | Midpoint | Intersection | Projection | Reflection | Centroid
    | Orthocenter | Circumcenter | Incenter | Line | ParallelLine | PerpendicularLine | AngleBisector | Tangent
    | Circle | Circumcircle | CircleDiameter,
    Field(discriminator="kind"),
]
POINT_KINDS = {"free_point", "point_on_line", "point_on_circle", "midpoint", "intersection", "projection",
               "reflection", "centroid", "orthocenter", "circumcenter", "incenter"}
LINE_KINDS = {"line", "segment", "ray", "parallel", "perpendicular", "angle_bisector", "tangent"}
CIRCLE_KINDS = {"circle", "circumcircle", "circle_diameter"}


# --- relations (givens and goals) ------------------------------------------------------------------------------

Pair = Annotated[list[Id], Field(min_length=2, max_length=2)]
Triple = Annotated[list[Id], Field(min_length=3, max_length=3)]


class Collinear(BaseModel):
    kind: Literal["collinear"]
    points: list[Id] = Field(min_length=3, max_length=6)


class Concyclic(BaseModel):
    kind: Literal["concyclic"]
    points: list[Id] = Field(min_length=4, max_length=6)


class Perpendicular(BaseModel):
    kind: Literal["perpendicular"]
    lines: list[Pair] = Field(min_length=2, max_length=2, description="Two lines given by two points each.")


class Parallel(BaseModel):
    kind: Literal["parallel"]
    lines: list[Pair] = Field(min_length=2, max_length=2)


class EqualLength(BaseModel):
    kind: Literal["equal_length"]
    segments: list[Pair] = Field(min_length=2, max_length=2)


class EqualAngle(BaseModel):
    kind: Literal["equal_angle"]
    angles: list[Triple] = Field(min_length=2, max_length=2, description="[A, B, C] = angle ABC (vertex in middle).")


class OnCircle(BaseModel):
    kind: Literal["on_circle"]
    point: Id
    circle: Id


class OnLine(BaseModel):
    kind: Literal["on_line"]
    point: Id
    line: Id


class AngleValue(BaseModel):
    kind: Literal["angle_value"]
    angle: Triple
    degrees: float = Field(gt=0, lt=180)


class LengthRatio(BaseModel):
    kind: Literal["length_ratio"]
    segments: list[Pair] = Field(min_length=2, max_length=2)
    ratio: float = Field(gt=0, description="|first| / |second|")


class LengthValue(BaseModel):
    kind: Literal["length_value"]
    segment: Pair
    value: float = Field(gt=0, description="Given length, e.g. AB = 6.")


class Tangency(BaseModel):
    kind: Literal["tangent_line"]
    line: Pair
    circle: Id


Relation = Annotated[
    Collinear | Concyclic | Perpendicular | Parallel | EqualLength | EqualAngle | OnCircle | OnLine | AngleValue
    | LengthRatio | LengthValue | Tangency,
    Field(discriminator="kind"),
]


class Target(BaseModel):
    """A quantity a computation question asks for."""

    kind: Literal["length", "angle", "ratio", "area"]
    points: list[Id] = Field(min_length=2, max_length=4,
                             description="length: [A,B]; angle: [A,B,C] in degrees; area: triangle [A,B,C]; "
                                         "ratio: [A,B,C,D] = AB/CD")


class GeometrySpec(BaseModel):
    objects: list[GeoObject] = Field(min_length=1, max_length=60)
    givens: list[Relation] = Field(default_factory=list, max_length=20)
    goals: list[Relation] = Field(default_factory=list, max_length=10)
    targets: list[Target] = Field(default_factory=list, max_length=6)

    @model_validator(mode="after")
    def _references(self) -> GeometrySpec:
        ids = [o.id for o in self.objects]
        if len(ids) != len(set(ids)):
            dupes = sorted({i for i in ids if ids.count(i) > 1})
            raise ValueError(f"duplicate object ids: {dupes}")
        return self
