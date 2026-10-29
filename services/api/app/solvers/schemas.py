"""Typed contracts between the orchestrator stages and the models.

Two model outputs are kept independent on purpose:
- `Formalization` (fast model) turns the problem statement into checkable templates, WITHOUT solving it.
- `ModelSolution` (reasoning model) solves it and gives each answer in machine-readable form.
Verification plugs the solver's answer into the independent template, so a solver cannot "verify" itself
with a true but irrelevant claim.
"""

from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, Field, field_validator

from ..geometry.dsl import GeometrySpec

PIPELINE_VERSION = "solve-2026.10.1"

Domain = Literal["real", "rational", "integer", "positive_integer", "natural"]
Expr = Annotated[str, Field(max_length=400, description="Plain ASCII maths, explicit *, ^ for powers, e.g. 2*x^2-3")]
Assignment = dict[str, Expr]


class _Template(BaseModel):
    variables: list[str] = Field(default_factory=list, max_length=8)

    @field_validator("variables")
    @classmethod
    def _names(cls, value: list[str]) -> list[str]:
        for name in value:
            if not name.replace("_", "").isalnum() or not name[:1].isalpha() or len(name) > 16:
                raise ValueError(f"invalid variable name: {name}")
        return value


class SolveTemplate(_Template):
    kind: Literal["solutions"]
    equations: list[Expr] = Field(min_length=1, max_length=8)
    conditions: list[Expr] = Field(default_factory=list, max_length=8)
    domain: Domain = "real"


class ValueTemplate(_Template):
    kind: Literal["value"]
    expression: Expr
    relations: list[Expr] = Field(default_factory=list, max_length=6,
                                  description="Equations the variables satisfy (empty if none).")


class CountTemplate(BaseModel):
    kind: Literal["count"]
    ranges: dict[str, list[int]] = Field(description="Each integer variable → [low, high] inclusive.")
    conditions: list[Expr] = Field(default_factory=list, max_length=10)
    distinct: bool = False
    ordered: bool = True


class ExtremumTemplate(_Template):
    kind: Literal["extremum"]
    objective: Expr
    sense: Literal["min", "max"]
    conditions: list[Expr] = Field(default_factory=list, max_length=8)
    positive: bool = False
    domain: Domain = "real"


class InequalityTemplate(_Template):
    kind: Literal["inequality"]
    statement: Expr = Field(description="The inequality to prove, e.g. 1/a+1/b>=2")
    conditions: list[Expr] = Field(default_factory=list, max_length=8)
    positive: bool = False
    domain: Domain = "real"


class IdentityTemplate(_Template):
    kind: Literal["identity"]
    lhs: Expr
    rhs: Expr
    conditions: list[Expr] = Field(default_factory=list, max_length=6)
    positive: bool = False


class DivisibilityTemplate(_Template):
    kind: Literal["divisibility"]
    expression: Expr
    divisor: Expr
    conditions: list[Expr] = Field(default_factory=list, max_length=6)
    domain: Domain = "integer"


class GeometryTemplate(BaseModel):
    kind: Literal["geometry"]
    spec: GeometrySpec


class ExampleTemplate(_Template):
    kind: Literal["example"]
    conditions: list[Expr] = Field(min_length=1, max_length=10)


Template = Annotated[
    SolveTemplate | ValueTemplate | CountTemplate | ExtremumTemplate | InequalityTemplate | IdentityTemplate
    | DivisibilityTemplate | ExampleTemplate | GeometryTemplate,
    Field(discriminator="kind"),
]
TaskKind = Literal["solve", "compute", "count", "extremum", "prove", "construct", "other"]


class PartFormalization(BaseModel):
    label: str = Field(max_length=16, description="Subpart label as in the problem ('a)'), or '' if none.")
    task: TaskKind
    template: Template | None = Field(description="null when the part cannot be expressed by a template.")


class Formalization(BaseModel):
    parts: list[PartFormalization] = Field(min_length=1, max_length=12)


AnswerKind = Literal["solution_set", "value", "count", "extremum", "proof", "construction", "other"]


class MachineAnswer(BaseModel):
    solutions: list[Assignment] | None = Field(
        description="Every solution as {variable: value}; [] means no solution. null if not a solution set.")
    value: Expr | None = Field(description="The number/expression/count/optimum, as plain maths. null if none.")
    point: Assignment | None = Field(description="Where an optimum is attained, or a construction's witness.")


class PartSolution(BaseModel):
    label: str = Field(max_length=16, description="Subquestion label exactly as in the problem ('a)'); '' if the "
                                                  "problem has no subquestions.")
    answer_kind: AnswerKind
    final_answer_latex: str = Field(max_length=2000, description="Vietnamese answer sentence with LaTeX in $...$.")
    machine_answer: MachineAnswer
    steps: list[str] = Field(min_length=1, max_length=40,
                             description="Numbered-in-order Vietnamese steps with LaTeX in $...$.")


class ModelSolution(BaseModel):
    solved: bool
    unsolved_reason_vi: str | None = Field(max_length=500)
    approach_vi: str = Field(max_length=1200, description="One or two sentences: the main idea of the solution.")
    techniques: list[str] = Field(max_length=12, description="Ids from the allowed-technique list.")
    parts: list[PartSolution] = Field(max_length=12)


HintLevel = Literal["concept", "observation", "strategy", "key_step"]


class Hint(BaseModel):
    level: HintLevel
    text_vi: str = Field(max_length=800, description="Vietnamese hint with LaTeX in $...$.")


class HintSet(BaseModel):
    hints: list[Hint] = Field(min_length=1, max_length=5)


# --- results ------------------------------------------------------------------------------------------------

VerificationStatus = Literal["VERIFIED", "PARTIALLY_VERIFIED", "UNVERIFIED", "INCORRECT", "UNSOLVED"]
CurriculumStatus = Literal["COMPLIANT", "COMPLIANT_WITH_WARNINGS", "NON_COMPLIANT", "NOT_CHECKED"]


class EvidenceOut(BaseModel):
    part: str
    source: Literal["formalization"]
    kind: str
    outcome: Literal["confirmed", "refuted", "inconclusive", "error"]
    strength: Literal["exact", "exhaustive", "bounded", "sampled", "none"]
    detail: str
    data: dict[str, object] | None = None


class PartVerdict(BaseModel):
    label: str
    status: VerificationStatus
    reason_vi: str


class CurriculumFindingOut(BaseModel):
    rule_id: str
    severity: Literal["prohibited", "discouraged", "style"]
    message: str
    excerpt: str | None = None
