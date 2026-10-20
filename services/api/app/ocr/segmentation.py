"""Turn per-page OCR output into reviewable questions: merge cross-page items, normalise, flag."""

from __future__ import annotations

from dataclasses import dataclass, field

from ..classification.heuristic import classify
from .latex import normalize_latex
from .schemas import ExtractedQuestion, ExtractedRegion, ExtractedSubquestion, Flag, OcrItem, OcrPage

LOW_CONFIDENCE = 0.85


@dataclass
class _Draft:
    number: str | None
    stem_parts: list[str]
    subquestions: list[tuple[str, str]]
    pages: list[int]
    regions: list[ExtractedRegion]
    figures: list[ExtractedRegion]
    confidences: list[float]
    uncertainties: list[str]
    page_kinds: set[str]
    extra_flags: list[Flag] = field(default_factory=list)


def _region(page: int, bbox: list[int] | None) -> ExtractedRegion | None:
    if bbox is None:
        return None
    x0, y0, x1, y1 = (v / 1000 for v in bbox)
    return ExtractedRegion(page=page, bbox=(x0, y0, x1, y1))


def _start(page_number: int, item: OcrItem, page_kind: str) -> _Draft:
    draft = _Draft(number=item.number, stem_parts=[item.stem], subquestions=[(s.label, s.content)
                                                                             for s in item.subquestions],
                   pages=[page_number], regions=[], figures=[], confidences=[item.confidence],
                   uncertainties=[u.excerpt for u in item.uncertainties], page_kinds={page_kind})
    _attach_regions(draft, page_number, item)
    return draft


def _attach_regions(draft: _Draft, page_number: int, item: OcrItem) -> None:
    region = _region(page_number, item.bbox)
    if region:
        draft.regions.append(region)
    if item.has_figure:
        figure = _region(page_number, item.figure_bbox)
        if figure:
            draft.figures.append(figure)
        else:
            draft.extra_flags.append(Flag(code="figure_not_located", severity="warning",
                                          message="Câu hỏi có hình vẽ nhưng chưa xác định được vị trí hình."))


def merge_pages(pages: list[tuple[int, OcrPage]]) -> list[_Draft]:
    drafts: list[_Draft] = []
    for page_number, page in sorted(pages, key=lambda p: p[0]):
        for index, item in enumerate(page.items):
            if item.kind != "question":
                continue
            if not item.stem.strip() and not item.subquestions:
                continue
            continues = (index == 0 and item.continues_previous_page and drafts
                         and drafts[-1].pages[-1] == page_number - 1)
            if continues:
                draft = drafts[-1]
                if item.stem.strip():
                    if item.subquestions or not draft.subquestions:
                        draft.stem_parts.append(item.stem)
                    else:
                        # Continuation text belongs to the last subpart that was cut off.
                        label, content = draft.subquestions[-1]
                        draft.subquestions[-1] = (label, f"{content} {item.stem}")
                draft.subquestions.extend((s.label, s.content) for s in item.subquestions)
                draft.pages.append(page_number)
                draft.confidences.append(item.confidence)
                draft.uncertainties.extend(u.excerpt for u in item.uncertainties)
                draft.page_kinds.add(page.page_kind)
                _attach_regions(draft, page_number, item)
                draft.extra_flags.append(Flag(code="cross_page", severity="info",
                                              message="Câu hỏi được ghép từ nhiều trang; hãy kiểm tra chỗ nối."))
                continue
            if item.continues_previous_page:
                item_flag = Flag(code="orphan_continuation", severity="warning",
                                 message="Đoạn này có vẻ là phần tiếp của một câu ở trang trước.")
                draft = _start(page_number, item, page.page_kind)
                draft.extra_flags.append(item_flag)
                drafts.append(draft)
                continue
            drafts.append(_start(page_number, item, page.page_kind))
    return drafts


def build_questions(pages: list[tuple[int, OcrPage]]) -> list[ExtractedQuestion]:
    questions: list[ExtractedQuestion] = []
    for draft in merge_pages(pages):
        flags = list(draft.extra_flags)
        stem = normalize_latex("\n".join(p.strip() for p in draft.stem_parts if p.strip()))
        reports = [stem]
        subquestions: list[ExtractedSubquestion] = []
        for label, content in draft.subquestions:
            report = normalize_latex(content)
            reports.append(report)
            subquestions.append(ExtractedSubquestion(label=label.strip()[:16], latex=report.text))
        if not draft.stem_parts or not "".join(draft.stem_parts).strip():
            # A question with only subparts: keep the stem empty without flagging it as an error.
            reports[0].issues = [i for i in reports[0].issues if i.code != "empty"]
        for report in reports:
            for issue in report.issues:
                flags.append(Flag(code=issue.code, severity=issue.severity, message=issue.message))
        if draft.uncertainties and not any(r.has_unclear for r in reports):
            flags.append(Flag(code="model_uncertain", severity="warning",
                              message="AI chưa chắc chắn ở: " + "; ".join(draft.uncertainties[:5])))
        confidence = min(draft.confidences) if draft.confidences else 0.0
        if confidence < LOW_CONFIDENCE:
            flags.append(Flag(code="low_confidence", severity="warning",
                              message="Độ tin cậy nhận dạng thấp; hãy so sánh kỹ với đề gốc."))
        if draft.page_kinds & {"handwritten", "mixed"}:
            flags.append(Flag(code="handwritten", severity="info",
                              message="Chữ viết tay: hãy kiểm tra kỹ từng ký hiệu."))
        if draft.figures:
            flags.append(Flag(code="figure_present", severity="info",
                              message="Câu hỏi có hình vẽ kèm theo."))
        full_text = " ".join([stem.text, *(s.latex for s in subquestions)])
        topics, _ = classify(full_text)
        if not topics:
            flags.append(Flag(code="topic_unknown", severity="info", message="Chưa xác định được chủ đề."))
        questions.append(ExtractedQuestion(
            original_number=draft.number, latex=stem.text, subquestions=subquestions, source_pages=draft.pages,
            regions=draft.regions, figure_regions=draft.figures, confidence=round(confidence, 3), flags=flags,
            topics=topics,
        ))
    return questions


def review_status_for(flags: list[Flag]) -> str:
    return "flagged" if any(f.severity in ("error", "warning") for f in flags) else "pending"
