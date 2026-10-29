"""Reading a student's handwritten work from a photo or scan of their notebook.

The transcription is a draft: it fills the work box, the student checks and corrects it, and only then is it sent
to the tutor. Illegible marks become `\\unclear{...}` and block sending. The image itself is not stored; only a
content-hash cache entry of the transcription is kept, so re-uploading the same page costs nothing.
"""

from __future__ import annotations

import asyncio
import hashlib
import logging
import re
import uuid
from dataclasses import dataclass
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field
from sqlalchemy.dialects.postgresql import insert

from ..container import Container
from ..documents.ingest import InvalidDocument, RenderedPage, inspect_file, render_pages
from ..errors import AppError, Conflict, PayloadTooLarge
from ..models import OcrCacheEntry
from ..ocr.latex import normalize_latex
from ..ocr.schemas import OcrUncertainty
from ..providers.base import ChatMessage, ImagePart, TextPart
from ..providers.gateway import CallContext

logger = logging.getLogger(__name__)

WORK_OCR_VERSION = "work-ocr-2026.10.2"
WORK_OCR_MAX_TOKENS = 4000

WORK_OCR_SYSTEM = """You transcribe a Vietnamese Grade 9 student's handwritten maths work from a photo or scan of \
their notebook, so that a tutor can check it. You transcribe; you never solve, correct, complete or tidy anything.

Rules:
1. Transcribe the student's working exactly as written, top to bottom, one written line per entry of "lines".
2. KEEP EVERY MISTAKE. A wrong sign, a lost root or a wrong conclusion must appear exactly as the student wrote \
it: the tutor's job is to find it. Never use the problem statement to fix what the student wrote.
3. Leave out text the student crossed out, and printed text (a printed problem, page headers). Keep everything \
else the student wrote, including a problem statement they copied by hand: the student must recognise every line.
4. Mathematics in LaTeX inside $...$; Vietnamese words verbatim with correct diacritics. Use the notation of \
Vietnamese answer keys: \\frac, \\sqrt, ^{...}, \\le, \\ge, \\ne, \\Rightarrow, \\Leftrightarrow, \\vdots (chia \
hết), \\equiv ... \\pmod{n}, \\widehat{ABC} (góc), \\triangle, \\backsim, \\perp, // (song song), ^{\\circ}, \
\\begin{cases}...\\end{cases} for a system, \\left[\\begin{array}{l}...\\end{array}\\right. for "hoặc". Never \
Unicode maths symbols such as ≤ √ ².
5. NEVER guess. Any symbol, digit, letter, exponent or word you cannot read with certainty is written as your \
best reading wrapped in \\unclear{...} at that exact place (inside $...$ when it is maths), with an entry in \
"uncertainties". Watch for 1/7, 0/6, 5/S, 2/z, x/×, u/v, n/h, minus/dash, exponent vs coefficient, the length \
of fraction bars and roots.
6. A drawn figure becomes one line "[Hình vẽ]"; do not describe it.
7. page_kind: handwritten, printed, mixed, blank (no writing) or not_math (writing that is not maths work).
8. confidence: your probability (0..1) that every line is transcribed exactly.
Reply with a single JSON object."""


class WorkTranscription(BaseModel):
    page_kind: Literal["handwritten", "printed", "mixed", "blank", "not_math"]
    lines: list[str] = Field(default_factory=list, max_length=200,
                             description="The student's written lines in order; maths in $...$.")
    uncertainties: list[OcrUncertainty] = Field(default_factory=list, max_length=40)
    confidence: float = Field(ge=0, le=1)


@dataclass(frozen=True)
class WorkReading:
    text: str
    pages: int
    unclear: int
    confidence: float
    cost_sgd: Decimal


def _user_prompt(problem: str, page: int, pages: int) -> str:
    return (f"Đề bài (only to help read the student's symbols; do NOT correct the work with it):\n{problem}\n\n"
            f"Trang {page}/{pages} của bài làm. Transcribe the student's work following the rules. Return JSON only.")


def _cache_key(page_sha256: str, model: str) -> str:
    return hashlib.sha256(f"{WORK_OCR_VERSION}|{model}|{page_sha256}".encode()).hexdigest()


async def _read_page(c: Container, ctx: CallContext, problem: str, page: RenderedPage, pages: int
                     ) -> tuple[WorkTranscription, Decimal]:
    assert c.gateway is not None
    model = c.gateway.catalog.for_tier("ocr").id
    key = _cache_key(page.sha256, model)
    async with c.db.sessionmaker() as session:
        entry = await session.get(OcrCacheEntry, key)
        if entry is not None:
            try:
                return WorkTranscription.model_validate(entry.result), Decimal(0)
            except ValueError:
                pass
    result = await c.gateway.structured(
        tier="ocr", ctx=ctx, output=WorkTranscription, max_tokens=WORK_OCR_MAX_TOKENS, schema_name="work_ocr",
        # The student is waiting on this request: no hidden reasoning, one bounded attempt.
        thinking=False, timeout_seconds=75, max_retries=0,
        messages=[ChatMessage(role="system", content=WORK_OCR_SYSTEM),
                  ChatMessage(role="user", content=[
                      TextPart(text=_user_prompt(problem, page.page_number, pages)),
                      ImagePart(data=page.data, mime_type=page.mime_type, width=page.width, height=page.height)])])
    reading = result.value
    if reading.lines or reading.page_kind in ("blank", "not_math"):
        async with c.db.sessionmaker() as session:
            await session.execute(insert(OcrCacheEntry).values(
                cache_key=key, pipeline_version=WORK_OCR_VERSION, model=result.model,
                result=reading.model_dump(mode="json"), hits=0).on_conflict_do_nothing(index_elements=["cache_key"]))
            await session.commit()
    return reading, result.cost_sgd


async def read_work(c: Container, user_id: uuid.UUID, problem: str, data: bytes) -> WorkReading:
    """Transcribe a photo (JPG/PNG/WebP) or scanned PDF of the student's work into editable text."""
    s = c.settings
    if c.gateway is None:
        raise Conflict("Dịch vụ AI chưa được cấu hình.", code="solver_not_configured")
    if len(data) > s.max_upload_bytes:
        raise PayloadTooLarge(f"Tệp quá lớn (tối đa {s.max_upload_bytes // (1024 * 1024)} MB).")
    info = inspect_file(data, max_pdf_pages=s.work_photo_max_pages, max_image_pixels=s.max_image_pixels)
    pages = render_pages(data, info.kind, max_side=s.ocr_image_max_side, pdf_scale=s.pdf_render_scale,
                         max_image_pixels=s.max_image_pixels)
    ctx = CallContext("work_ocr", user_id, None)
    readings = await asyncio.gather(*(_read_page(c, ctx, problem, p, len(pages)) for p in pages))
    cost = sum((cost for _, cost in readings), Decimal(0))

    if all(r.page_kind in ("blank", "not_math") or not r.lines for r, _ in readings):
        raise InvalidDocument("Không thấy bài làm toán trong ảnh. Hãy chụp rõ trang vở có bài làm.",
                              code="no_work_found")
    raw = "\n\n".join("\n".join(line.strip() for line in r.lines if line.strip()) for r, _ in readings)
    text = normalize_latex(raw).text.strip()
    if len(text) > s.work_photo_max_chars:
        raise AppError("Bài làm trong ảnh dài quá mức cho một lượt. Hãy chụp từng phần.", code="work_too_long")
    unclear = len(re.findall(r"\\unclear\{", text))
    logger.info("work_ocr_done", extra={"pages": len(pages), "unclear": unclear, "cost_sgd": str(cost)})
    return WorkReading(text=text, pages=len(pages), unclear=unclear,
                       confidence=min(r.confidence for r, _ in readings), cost_sgd=cost)
