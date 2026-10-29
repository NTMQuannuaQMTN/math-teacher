"""Public API contracts (v1). The web app's TypeScript types are generated from this OpenAPI schema."""

from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Literal

from pydantic import BaseModel, Field

Topic = Literal["algebra", "geometry", "number_theory", "combinatorics"]
ReviewStatus = Literal["pending", "flagged", "confirmed"]
DocumentStatus = Literal["uploaded", "processing", "needs_review", "failed"]
JobStatus = Literal["queued", "running", "succeeded", "failed"]
BudgetStateName = Literal["normal", "warning", "restricted", "blocked"]


class HealthOut(BaseModel):
    status: Literal["ok"]
    service: str
    version: str


class ReadyOut(BaseModel):
    status: Literal["ready", "degraded"]
    database: bool
    ocr_configured: bool
    problems: list[str]


class GuestSessionIn(BaseModel):
    turnstile_token: str | None = Field(default=None, max_length=2048)


class SessionOut(BaseModel):
    token: str
    user_id: uuid.UUID
    expires_at: datetime


class MeOut(BaseModel):
    user_id: uuid.UUID


class FlagOut(BaseModel):
    code: str
    severity: Literal["error", "warning", "info"]
    message: str


class SubquestionModel(BaseModel):
    label: str = Field(max_length=16)
    latex: str = Field(max_length=8000)


class RegionOut(BaseModel):
    page: int
    bbox: tuple[float, float, float, float]


class AssetOut(BaseModel):
    id: uuid.UUID
    kind: str
    url: str
    page_number: int | None


class QuestionOut(BaseModel):
    id: uuid.UUID
    document_id: uuid.UUID
    order_index: int
    original_number: str | None
    latex: str
    ocr_latex: str
    subquestions: list[SubquestionModel]
    source_pages: list[int]
    regions: list[RegionOut]
    topics: list[Topic]
    topic_source: Literal["ai", "heuristic", "student"]
    review_status: ReviewStatus
    flags: list[FlagOut]
    ocr_confidence: float | None
    origin: Literal["ocr", "manual"]
    version: int
    assets: list[AssetOut]
    updated_at: datetime


class QuestionPatchIn(BaseModel):
    expected_version: int = Field(ge=1)
    latex: str | None = Field(default=None, max_length=20000)
    subquestions: list[SubquestionModel] | None = Field(default=None, max_length=20)
    topics: list[Topic] | None = Field(default=None, max_length=4)
    original_number: str | None = Field(default=None, max_length=64)
    review_status: Literal["pending", "confirmed"] | None = None


class QuestionCreateIn(BaseModel):
    latex: str = Field(min_length=1, max_length=20000)
    original_number: str | None = Field(default=None, max_length=64)
    subquestions: list[SubquestionModel] = Field(default_factory=list, max_length=20)


class PageOut(BaseModel):
    page_number: int
    width: int
    height: int
    image_url: str


class PageResultOut(BaseModel):
    page: int
    status: Literal["ok", "cached", "failed"]
    error_code: str | None = None
    error_message: str | None = None


class JobOut(BaseModel):
    id: uuid.UUID
    kind: str
    status: JobStatus
    progress: dict[str, int | str]
    error_code: str | None
    error_message: str | None
    attempts: int
    created_at: datetime
    updated_at: datetime


class DocumentSummaryOut(BaseModel):
    id: uuid.UUID
    filename: str
    content_type: str
    size_bytes: int
    status: DocumentStatus
    page_count: int | None
    error_code: str | None
    error_message: str | None
    created_at: datetime
    question_count: int | None = None


class DocumentOut(DocumentSummaryOut):
    pages: list[PageOut]
    page_results: list[PageResultOut]
    questions: list[QuestionOut]
    job: JobOut | None


class UploadOut(BaseModel):
    document: DocumentSummaryOut
    job: JobOut | None
    deduplicated: bool


class ReprocessIn(BaseModel):
    discard_edits: bool = False


class LatexCheckIn(BaseModel):
    latex: str = Field(max_length=20000)


class ConfirmAllOut(BaseModel):
    confirmed: list[uuid.UUID]
    blocked: list[uuid.UUID] = Field(description="Questions left unconfirmed because they still have errors.")


class LatexCheckOut(BaseModel):
    normalized: str
    issues: list[FlagOut]
    can_confirm: bool


class BudgetOut(BaseModel):
    day: date
    state: BudgetStateName
    ceiling_sgd: Decimal
    spent_sgd: Decimal
    reserved_sgd: Decimal
    warning_sgd: Decimal
    restricted_sgd: Decimal


class MyUsageOut(BaseModel):
    spent_sgd: Decimal
    calls: int
    daily_cap_sgd: Decimal


class UsageOut(BaseModel):
    budget: BudgetOut
    me: MyUsageOut


class UsageBreakdownRow(BaseModel):
    key: str
    calls: int
    cost_sgd: Decimal
    prompt_tokens: int
    completion_tokens: int


class DailyUsageRow(BaseModel):
    day: date
    ceiling_sgd: Decimal
    spent_sgd: Decimal
    reserved_sgd: Decimal


class RecentCallRow(BaseModel):
    id: uuid.UUID
    created_at: datetime
    purpose: str
    model: str
    status: str
    outcome: str | None
    reserved_sgd: Decimal
    actual_sgd: Decimal | None
    prompt_tokens: int | None
    completion_tokens: int | None
    latency_ms: int | None


class AdminUsageOut(BaseModel):
    budget: BudgetOut
    days: list[DailyUsageRow]
    by_model: list[UsageBreakdownRow]
    by_purpose: list[UsageBreakdownRow]
    recent_calls: list[RecentCallRow]
    ocr_cache_entries: int
    ocr_cache_hits: int
    open_reservations: int
    admin_email: str


# --- Solutions (Phase 3) ------------------------------------------------------------------------

VerificationStatusName = Literal["VERIFIED", "PARTIALLY_VERIFIED", "UNVERIFIED", "INCORRECT", "UNSOLVED"]
CurriculumStatusName = Literal["COMPLIANT", "COMPLIANT_WITH_WARNINGS", "NON_COMPLIANT", "NOT_CHECKED"]


class SolveIn(BaseModel):
    force: bool = Field(default=False, description="Solve again even if a finished solution exists.")


class FigureIn(BaseModel):
    force: bool = Field(default=False, description="Draw again even if a figure exists for this question version.")


class VerdictOut(BaseModel):
    status: VerificationStatusName
    reason_vi: str


class SolutionPartOut(BaseModel):
    label: str
    answer_kind: str
    final_answer_latex: str
    steps: list[str]
    verdict: VerdictOut | None


class EvidenceItemOut(BaseModel):
    part: str
    kind: str
    outcome: Literal["confirmed", "refuted", "inconclusive", "error"]
    strength: Literal["exact", "exhaustive", "bounded", "sampled", "none"]
    detail: str


class CurriculumFindingItemOut(BaseModel):
    rule_id: str
    severity: Literal["prohibited", "discouraged", "style"]
    message: str
    excerpt: str | None = None


class HintOut(BaseModel):
    level: Literal["concept", "observation", "strategy", "key_step"]
    text_vi: str


class SolutionOut(BaseModel):
    """Before the student reveals the solution, steps, answers, evidence and the main idea are withheld (empty)."""

    id: uuid.UUID
    question_id: uuid.UUID
    status: Literal["queued", "running", "done", "failed"]
    verification_status: VerificationStatusName | None
    curriculum_status: CurriculumStatusName | None
    topics: list[Topic]
    solved: bool | None
    unsolved_reason_vi: str | None
    approach_vi: str | None
    techniques: list[str]
    parts: list[SolutionPartOut]
    evidence: list[EvidenceItemOut]
    curriculum_findings: list[CurriculumFindingItemOut]
    attempts: int
    cost_sgd: Decimal
    from_cache: bool
    stale: bool = Field(description="The question was edited after this solution was produced.")
    figure_id: uuid.UUID | None = Field(default=None, description="Interactive figure for geometry questions.")
    hints: list[HintOut] = Field(description="Hints opened so far, in order.")
    hints_total: int
    solution_revealed: bool
    can_reveal_solution: bool
    reveal_locked_reason: str | None
    policy_version: str
    pipeline_version: str
    error_code: str | None
    error_message: str | None
    created_at: datetime
    updated_at: datetime


class FigureOut(BaseModel):
    """A validated construction: `spec` (DSL), engine status, and an initial configuration for JSXGraph."""

    id: uuid.UUID
    question_id: uuid.UUID
    status: Literal["pending", "ok", "infeasible", "invalid", "unsupported", "failed"]
    detail: str | None
    spec: dict[str, Any] | None
    initial: dict[str, Any] | None
    stale: bool
    job: JobOut | None = None
    created_at: datetime


class SolveRequestOut(BaseModel):
    solution: SolutionOut
    job: JobOut | None
    cached: bool


# --- Tutoring sessions (Phase 5) -----------------------------------------------------------------

class SessionCreateIn(BaseModel):
    question_id: uuid.UUID


class SessionMessageIn(BaseModel):
    content: str = Field(min_length=1, max_length=4000, description="The student's work (text and LaTeX).")


class WorkPhotoOut(BaseModel):
    text: str = Field(description="Transcribed work for the student to check; illegible marks are \\unclear{...}.")
    pages: int
    unclear: int = Field(description="Number of \\unclear{...} marks the student must fix before sending.")
    confidence: float


class StudentStepOut(BaseModel):
    text: str
    status: Literal["correct", "incorrect", "unclear"]
    note_vi: str | None


class TutorFeedbackOut(BaseModel):
    approach_vi: str
    steps: list[StudentStepOut]
    first_error_index: int | None
    error_explanation_vi: str | None
    next_hint_vi: str
    student_reached_answer: bool
    encouragement_vi: str
    tool_checked_steps: int


class SessionMessageOut(BaseModel):
    id: uuid.UUID
    role: Literal["student", "tutor"]
    content: str
    feedback: TutorFeedbackOut | None
    created_at: datetime


class TutoringSessionOut(BaseModel):
    id: uuid.UUID
    question_id: uuid.UUID
    messages: list[SessionMessageOut]
    solution: SolutionOut
