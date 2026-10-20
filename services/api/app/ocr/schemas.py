"""Typed contracts for OCR model output and the extraction result."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator

PIPELINE_VERSION = "ocr-2026.10.1"

ItemKind = Literal["question", "header", "instructions", "other"]
PageKind = Literal["printed", "handwritten", "mixed", "screenshot", "blank", "not_math"]


class OcrSubquestion(BaseModel):
    label: str = Field(max_length=16, description="Label exactly as printed, e.g. 'a)', 'b.', '1)'.")
    content: str = Field(max_length=8000, description="Text of the subpart with LaTeX in $...$.")


class OcrUncertainty(BaseModel):
    excerpt: str = Field(max_length=200, description="The uncertain text as transcribed.")
    reason: str = Field(max_length=300)


class OcrItem(BaseModel):
    kind: ItemKind
    number: str | None = Field(default=None, max_length=32,
                               description="Question numbering exactly as printed, e.g. 'Câu 1', 'Bài 3', '2.'")
    continues_previous_page: bool = Field(
        default=False, description="True if this item continues a question started on the previous page.")
    stem: str = Field(max_length=12000, description="Main text with LaTeX in $...$ (inline) or $$...$$ (display).")
    subquestions: list[OcrSubquestion] = Field(default_factory=list, max_length=20)
    bbox: list[int] | None = Field(default=None, description="[x0, y0, x1, y1] in 0..1000 page coordinates.")
    has_figure: bool = False
    figure_bbox: list[int] | None = Field(default=None, description="[x0, y0, x1, y1] in 0..1000 coordinates.")
    uncertainties: list[OcrUncertainty] = Field(default_factory=list, max_length=30)
    confidence: float = Field(ge=0, le=1)

    @field_validator("bbox", "figure_bbox")
    @classmethod
    def _bbox(cls, value: list[int] | None) -> list[int] | None:
        if value is None:
            return None
        if len(value) != 4 or not all(0 <= v <= 1000 for v in value) or value[0] >= value[2] or \
                value[1] >= value[3]:
            return None  # an unusable box is dropped, never guessed
        return value


class OcrPage(BaseModel):
    page_kind: PageKind
    language: Literal["vi", "en", "mixed", "none"] = "vi"
    items: list[OcrItem] = Field(default_factory=list, max_length=40)
    notes: str | None = Field(default=None, max_length=500)


class ExtractedSubquestion(BaseModel):
    label: str
    latex: str


class ExtractedRegion(BaseModel):
    page: int
    bbox: tuple[float, float, float, float]


class Flag(BaseModel):
    code: str
    severity: Literal["error", "warning", "info"]
    message: str


class ExtractedQuestion(BaseModel):
    original_number: str | None
    latex: str
    subquestions: list[ExtractedSubquestion]
    source_pages: list[int]
    regions: list[ExtractedRegion]
    figure_regions: list[ExtractedRegion]
    confidence: float
    flags: list[Flag]
    topics: list[str]
