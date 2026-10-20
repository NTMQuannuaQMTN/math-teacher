# Phase 2 summary: OCR pipeline and student review

Date: 2026-10-20

## Implemented

**Upload** (`POST /api/v1/documents`, `app/documents/`)
- Accepts JPG, PNG, WebP, and PDF. The type comes from magic bytes only. HEIC gets a specific message.
- Rejected cleanly, with Vietnamese messages: files over 20 MB (refused before the body is parsed, and an
  upload with no length gets 411), PDFs over 20 pages, encrypted PDFs, empty, truncated, or corrupt files,
  and decompression bombs (40 MP limit).
- Filenames are sanitised. Uploads are deduplicated per user by SHA-256, and there is a per-user upload rate
  limit and document quota.
- Files are stored under `users/{owner}/documents/{id}/…` on the local disk or R2.

**Ingestion**
- PDF pages are rendered with pypdfium2. Images get EXIF orientation fixed, metadata stripped, transparency
  flattened, and are capped at 2000 px.
- Scanned and digital pages become PNG, photos become JPEG.

**Asynchronous processing**
- `ocr_document` jobs run on a Postgres `SKIP LOCKED` queue.
- Pages are OCR'd with bounded concurrency, and progress is reported in `GET /api/v1/jobs/{id}`.
- Transient failures retry with backoff, and a reaper handles dead workers.
- If some pages fail, the successful pages are kept and each failed page shows its reason.
- When the budget runs out mid-document, the remaining pages stop and the user sees "hết ngân sách".

**Mathematical OCR** (`app/ocr/engine.py`, `prompts.py`, `schemas.py`)
- One structured vision call per page through the metered gateway (`ocr` tier). The output is validated
  against `OcrPage`: items, numbering, subparts, bounding boxes, figure boxes, uncertainties, and confidence.
- The prompt forbids guessing. Illegible notation must be written as `\unclear{…}` and listed. Invalid
  bounding boxes are dropped, never guessed.
- A content-hash cache (page SHA-256 + pipeline version + model) is shared across users. A cache hit costs
  nothing and makes no model call.

**Segmentation** (`app/ocr/segmentation.py`)
- Headers and instructions are dropped. A question that continues across a page break is merged: text goes
  to the last subpart or the stem, and the source pages and regions are kept.
- A continuation with no previous page is flagged, not merged. Figures are cropped into assets linked to
  their question.

**LaTeX normalisation and validation** (`app/ocr/latex.py`)
- Deterministic and idempotent (checked with Hypothesis).
- Normalises: NFC Vietnamese; `\(…\)`/`\[…\]` → `$…$`/`$$…$$`; about 70 Unicode math symbols → LaTeX
  (≤, ≠, ⋮, ∠, △, ⊥, //, °, …); ² and ₙ scripts; and `√x` / `√(…)` → `\sqrt{…}`.
- Errors: unclosed math, unbalanced braces, unbalanced `\left`/`\right`, mismatched or unknown environments,
  commands outside math, an ambiguous `√`, and `\unclear`.
- Unknown commands only produce a warning, because the browser's KaTeX is the final check.

**Classification** (`app/classification/heuristic.py`)
- Free, deterministic Vietnamese keyword scoring for algebra, geometry, number theory, and combinatorics.
- Supports several topics per question (mixed), and returns "unknown" instead of guessing. Students can
  edit topics.

**Student review**
- Every question starts as `pending`. It becomes `flagged` when there is an error or warning: unclear
  notation, invalid LaTeX, low confidence, a model uncertainty, an orphan continuation, or a figure that
  could not be located. Info flags cover handwriting, figures, and merged pages.
- `PATCH /questions/{id}` edits the LaTeX, subparts, number, and topics. It uses optimistic concurrency
  (`expected_version`, 409 on conflict) and keeps the original `ocr_latex`.
- `confirmed` is refused while any error flag remains. Editing the content reopens a confirmed question;
  whitespace-only edits do not.
- Students can also add a missed question manually, delete a question, rerun OCR (with explicit consent if
  it would discard edits), and run a live `POST /latex/check`.
- `POST /questions/{id}/solve` returns an explicit 501 until Phase 3.

**Web UI**
- Upload page with drag and drop and upload progress.
- Review page with the original page image, clickable question-region overlays, page tabs, and live job
  progress.
- Per question: rendered KaTeX, yellow highlights for unclear notation, a side-by-side LaTeX editor with
  live preview, server and KaTeX error lists, subpart editing, topic chips, and figure crops.
- Question workspace shell, usage page, and admin cost dashboard.
- All text is Vietnamese, and the layout is responsive (tested at Pixel 7 width).

## Tests

- pytest: 135 tests.
  - Golden segmentation from recorded model output, ingestion security, and LaTeX unit and property tests.
  - The full API flow through the real worker, gateway, budget, and cache.
  - Cross-user isolation for 11 endpoints, partial page failure, provider outage, and budget exhaustion.
  - Reprocess consent and deletion.
- Playwright: 8 tests on the real stack.
- Live OCR golden test: `pytest -m live`. Not yet run, because there is no key.

## Known limitations

- **OCR accuracy has not been measured.** It depends entirely on the SoCLaaS vision model. All committed
  fixtures are *synthetic* rendered pages (labelled as such), and real photos and handwriting need
  human-supplied samples (`tests/fixtures/ocr/live/README.md`).
- Bounding boxes come from the model and may be imprecise. Unusable boxes are dropped, so some questions
  will have no overlay.
- One model pass per page with no consensus or second-model cross-check (this would double the cost).
  PDF text layers are not used as a hint.
- Topic classification is keyword-based and preliminary. The model-based classifier comes in Phase 3.
- No in-browser image cropping or rotation, and no camera capture UI beyond the native file picker.

## Remaining work (next phases)

Phase 3: classifier, orchestrator, and solvers using confirmed questions only. Phase 4: geometry figures become a
formal DSL (the figure crops here are only references). Phase 6: OCR golden benchmark on real papers. The
traceable exam papers from the pre-reset commit `91b9065~1:data/exams/` can seed it.
