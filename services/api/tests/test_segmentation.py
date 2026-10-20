"""Golden tests: recorded model output → normalised, flagged, reviewable questions."""

from __future__ import annotations

import json

from app.ocr.schemas import OcrItem, OcrPage
from app.ocr.segmentation import build_questions, review_status_for
from tests.conftest import FIXTURES


def recorded(name: str) -> OcrPage:
    return OcrPage.model_validate(json.loads((FIXTURES / "ocr" / "recorded" / f"{name}.json").read_text()))


def flag_codes(q) -> set[str]:  # type: ignore[no-untyped-def]
    return {f.code for f in q.flags}


def test_synthetic_exam_golden() -> None:
    questions = build_questions([(1, recorded("synthetic_page1")), (2, recorded("synthetic_page2"))])
    expected = json.loads((FIXTURES / "ocr" / "expected" / "synthetic_exam.json").read_text())
    assert [q.original_number for q in questions] == [e["number"] for e in expected["questions"]]
    for q, e in zip(questions, expected["questions"], strict=True):
        if q.original_number == "Câu 3":
            continue  # transcribed with \unclear on purpose; checked below
        assert q.latex == e["latex"]
        assert [(s.label, s.latex) for s in q.subquestions] == [(s["label"], s["latex"]) for s in e["subquestions"]]

    q1, q2, q3, q4, q5 = questions
    assert review_status_for(q1.flags) == "pending"
    assert q1.topics == ["algebra"]
    assert "≥" not in q2.latex and r"\ge" in q2.latex  # Unicode the model emitted was normalised
    assert {"unclear_notation", "low_confidence"} <= flag_codes(q3)
    assert review_status_for(q3.flags) == "flagged"
    assert q3.topics[0] == "number_theory"
    assert len(q4.subquestions) == 2
    assert q5.topics[0] == "geometry"
    assert "figure_present" in flag_codes(q5)
    assert q5.figure_regions[0].page == 2
    assert q5.figure_regions[0].bbox == (0.3, 0.35, 0.7, 0.65)


def test_header_items_are_dropped() -> None:
    questions = build_questions([(1, recorded("synthetic_page1"))])
    assert all("ĐỀ LUYỆN TẬP" not in q.latex for q in questions)


def test_cross_page_continuation_appends_subparts() -> None:
    questions = build_questions([(1, recorded("synthetic_page1")), (2, recorded("handwritten_continuation"))])
    q4 = next(q for q in questions if q.original_number == "Câu 4")
    assert [s.label for s in q4.subquestions] == ["a)", "b)", "c)"]
    assert q4.source_pages == [1, 2]
    assert {"cross_page", "handwritten", "low_confidence"} <= flag_codes(q4)
    assert questions[-1].original_number == "Bài 6"
    assert questions[-1].topics[0] == "combinatorics"


def test_continuation_without_previous_page_is_flagged_not_merged() -> None:
    questions = build_questions([(1, recorded("handwritten_continuation"))])
    assert "orphan_continuation" in flag_codes(questions[0])
    assert len(questions) == 2


def test_figure_without_location_is_flagged() -> None:
    page = OcrPage(page_kind="printed", items=[OcrItem(kind="question", number="Bài 1", stem="Cho tam giác $ABC$.",
                                                       has_figure=True, figure_bbox=None, confidence=0.99)])
    (q,) = build_questions([(1, page)])
    assert "figure_not_located" in flag_codes(q)


def test_invalid_bbox_is_dropped_not_guessed() -> None:
    item = OcrItem(kind="question", stem="x", bbox=[500, 500, 100, 100], confidence=1)
    assert item.bbox is None
