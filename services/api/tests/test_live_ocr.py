"""Live golden OCR test against the real SoCLaaS API.

Run: SOCLAAS_API_KEY=... uv run pytest -m live tests/test_live_ocr.py -s
Requires config/models.json with a priced vision model routed to the `ocr` tier.
Uses the SYNTHETIC fixture exam; add real photos/handwriting under tests/fixtures/ocr/live/ (see README there).
"""

from __future__ import annotations

import difflib
import json
import os
import unicodedata
from pathlib import Path

import pytest

from app.config import Settings
from app.container import build_container
from app.documents.ingest import render_pages
from app.ocr.engine import LlmPageOcr, PageInput
from app.ocr.segmentation import build_questions
from app.providers.gateway import CallContext
from tests.conftest import FIXTURES

pytestmark = pytest.mark.live


def similarity(a: str, b: str) -> float:
    norm = lambda s: unicodedata.normalize("NFC", " ".join(s.split()))  # noqa: E731
    return difflib.SequenceMatcher(None, norm(a), norm(b)).ratio()


async def test_live_synthetic_exam(database_url: str, tmp_path: Path) -> None:
    if not os.environ.get("SOCLAAS_API_KEY"):
        pytest.skip("SOCLAAS_API_KEY not set")
    settings = Settings(environment="test", database_url=database_url, storage_local_dir=tmp_path)
    c = build_container(settings)
    assert c.gateway is not None, c.config_problems
    try:
        engine = LlmPageOcr(c.gateway)
        data = (FIXTURES / "ocr" / "images" / "synthetic_exam.pdf").read_bytes()
        pages = render_pages(data, "pdf", max_side=2000, pdf_scale=2.0, max_image_pixels=10**8)
        outputs = []
        for page in pages:
            outcome = await engine.extract(PageInput(page.page_number, len(pages), page.data, page.mime_type,
                                                     page.width, page.height, page.sha256),
                                           CallContext(purpose="live_test", user_id=None))
            print(f"page {page.page_number}: cost SGD {outcome.cost_sgd}")
            outputs.append((page.page_number, outcome.page))
        questions = build_questions(outputs)
        expected = json.loads((FIXTURES / "ocr" / "expected" / "synthetic_exam.json").read_text())["questions"]
        report = []
        for exp in expected:
            match = next((q for q in questions if (q.original_number or "").rstrip(".") == exp["number"]), None)
            score = similarity(match.latex, exp["latex"]) if match else 0.0
            report.append((exp["number"], round(score, 3), match.latex if match else None))
        for row in report:
            print(row)
        assert len(questions) == len(expected), [q.original_number for q in questions]
        assert all(score >= 0.9 for _, score, _ in report), report
    finally:
        await c.aclose()
