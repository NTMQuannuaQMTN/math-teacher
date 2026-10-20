# Phase 2 testing guide: OCR and review

Complete the Phase 1 setup first (`PHASE_1_TESTING.md` §1).

## 1. Automated

```bash
cd services/api && uv run pytest -q tests/test_latex.py tests/test_segmentation.py tests/test_ingest.py \
  tests/test_api_documents.py
cd ../../apps/web && npm run build && npx playwright test     # 8 tests, starts its own API on :8011
```

Playwright starts `services/api/scripts/e2e_server.py`: a fresh `mathtutor_e2e` database with
`OCR_PROVIDER=fixture`. This is the only place recorded OCR output replaces the model, and production refuses
that setting.

## 2. Try the review flow without a SoCLaaS key (fixture OCR)

```bash
cd services/api && OCR_PROVIDER=fixture uv run uvicorn app.main:app_factory --factory --port 8000
cd apps/web && npm run dev
```

Every page then returns the recorded transcription of `tests/fixtures/ocr/images/synthetic_page1.png`,
whatever you upload. Use that file.

| # | Do | Expect |
| --- | --- | --- |
| 1 | `/upload` → choose `synthetic_page1.png` → **Nhận dạng đề** | progress bar, then the review page; 4 questions after about 1 s |
| 2 | Look at Câu 2 | the model's `≥` is shown as a rendered `\ge` (normalised) |
| 3 | Look at Câu 3 | badge **Cần sửa**, the exponent is highlighted yellow, the warnings explain why, **Xác nhận đúng** is disabled |
| 4 | Click the Câu 3 box on the page image | the card scrolls into view and is highlighted |
| 5 | Câu 3 → **Sửa** → replace `\unclear{2}` with `2` → **Lưu và xác nhận** | badge **Đã xác nhận**, the flags disappear, **Mở câu hỏi** appears |
| 6 | Câu 1 → **Sửa** → type `$\frac{1}{x$` | the preview shows a red error and the Vietnamese issues list; confirm is disabled |
| 7 | Câu 4 → **Sửa** → **+ Thêm ý** → `Tính $x^3+y^3$.` → **Chỉ lưu** | three subparts render |
| 8 | Toggle the **Số học** chip on any question | the chip toggles; with two chips, "Bài kết hợp nhiều chủ đề." appears |
| 9 | **+ Thêm câu bị thiếu** | a new manual question card appears |
| 10 | **Nhận dạng lại** | asks for confirmation because edits exist; the questions are rebuilt from cache (no new model calls) |
| 11 | Open the same document URL in a private window | "Không tìm thấy tài liệu." |
| 12 | Upload a `.txt` renamed to `.png` | "Định dạng tệp không được hỗ trợ…" |
| 13 | Upload a password-protected PDF (`tests/fixtures/ocr/images/encrypted.pdf`) | "Tệp PDF có mật khẩu…" |
| 14 | Open the review page on a phone (or DevTools device mode) | stacked layout, no horizontal scrolling |

## 3. Real OCR with SoCLaaS

1. Set `SOCLAAS_API_KEY` in `services/api/.env`, and finish `config/models.json` (vision model routed to
   `ocr`, real prices).
2. Restart without `OCR_PROVIDER=fixture` and check `/ready` → `"status":"ready"`.
3. Upload `tests/fixtures/ocr/images/synthetic_exam.pdf` (2 pages, figure on page 2), then real material: a
   phone photo of a printed paper, handwriting, a LaTeX screenshot, and a multi-page PDF.
4. For each, note: missed or extra questions, wrong symbols, Vietnamese diacritics, subparts, how cross-page
   questions were merged, figure crop quality, whether real ambiguities were marked `\unclear`, the time per
   page, and the cost shown on `/admin/usage`.
5. Automated: `SOCLAAS_API_KEY=... uv run pytest -m live tests/test_live_ocr.py -s` prints per-question
   similarity and cost.

## Feedback requested

- OCR quality on your real papers and handwriting (send failing images if you can; they become fixtures).
- Does the review screen make it obvious what to check? Wording and Vietnamese phrasing?
- Should confirming every question be mandatory before solving (current design), or optional for
  high-confidence printed papers?
- Cost and latency per page once measured. That decides whether a second-model cross-check is worth it.
