# Toán chuyên vào 10: exam research

Collected 2026-10-01 for the Math Teacher solver. Machine-readable manifest: `data/exam_sources.json` (URL,
type, access date, SHA-256 of every downloaded file). The PDFs themselves are kept locally in
`data/exams/raw/` (git-ignored, third-party copyright).

## 1. What was collected

| Exam | School / board | Year | Paper | Answers / solutions | Source type | Sub-questions |
|---|---|---|---|---|---|---:|
| ptnk-2023-chuyen | Trường Phổ thông Năng khiếu, ĐHQG-HCM | 2023 | ✓ official PDF (ptnk.edu.vn) | ✓ official answer key (ptnk.edu.vn) | official | 14 |
| ptnk-2024-chuyen | Trường Phổ thông Năng khiếu | 2024 | ✓ official (public Drive folder linked from ptnk.edu.vn) | ✓ official answer key (same folder) | official | 13 |
| ptnk-2025-chuyen | Trường Phổ thông Năng khiếu | 2025 | ✓ official (public Drive) | ✗ official key exists but **download disabled by the owner**; not bypassed | official paper; answers derived and computed | 13 |
| ptnk-2026-chuyen | Trường Phổ thông Năng khiếu | 2026 | ✓ official (public Drive) | worked solutions published by thuvienphapluat.vn (author not stated) | official paper + third-party solution | 5 (multi-part; = benchmark ch-1…ch-5) |
| hcm-2025-chuyen | Sở GD&ĐT TP.HCM (chuyên Toán: Lê Hồng Phong, Trần Đại Nghĩa, …) | 2025 | ✓ via toanmath.com and a GitHub mirror | ✓ "Đáp án và hướng dẫn chấm" in the same PDF; teacher solution (GitHub) | marking guide attributed to the Sở, not downloaded from the Sở | 10 |
| hanoi-2025-chuyen | Sở GD&ĐT Hà Nội (chuyên Toán: Hà Nội – Amsterdam, Chu Văn An, …) | 2025 | ✓ via toanmath.com | ✓ teacher solution (CLB Toán Cơ Sở, named teachers) | teacher solution | 12 |
| khtn-2025-vong2 | THPT chuyên Khoa học Tự nhiên, ĐHQG Hà Nội (vòng 2) | 2025 | ✓ via toanmath.com | ✓ teacher solution ("Lớp toán thầy Khánh chuyên Sư Phạm") | teacher solution | 8 |

**Totals: 7 papers, 4 schools/boards, 2 regions, 2023–2026: 72 problem records = 79 sub-questions (the 5
PTNK 2026 records keep their 12 parts together, as in the benchmark).** Also already in the repo: PTNK 2026 Toán (không chuyên), 15 problems (tools/benchmark test split).

## 2. Method

1. Searched for official sources first: the PTNK site (`ptnk.edu.vn/tuyen-sinh-ptnk/de-thi-dap-an/`) links
   official papers and answer keys for 2023–2026. Public Google Drive folders were listed through Drive's
   embedded folder view and downloaded with the public download endpoint (no sign-in).
2. For the Sở exams and KHTN, the boards' own sites don't host the papers; reputable educational
   collections (toanmath.com) and a public GitHub archive (trietptm) carry the papers with solutions.
3. Each PDF was rendered page by page (`data/exams/pages`, PDFKit) because most are scans or have broken
   text layers (the PTNK 2024 layer is OCR garbage; formulas in every text layer are scrambled). Questions
   were **transcribed by Claude from the page images** into `tools/exams/catalog.py` (LaTeX in `$…$`).
   Every record is `ocr_status = transcribed_needs_review` until a person proofreads it.
4. Answers were checked independently by computation (`tools/exams/verify_exams.py`, 43 checks;
   docs/SOLUTION_VERIFICATION.md).

## 3. Reliability of each source

| Source | Reliability | Notes |
|---|---|---|
| ptnk.edu.vn PDFs and its linked Drive folders | High (issuing school) | Official keys contain typos (see verification doc) |
| toanmath.com PDFs | Medium–high | Reproduces the official paper; solutions by named teachers or clubs |
| thuvienphapluat.vn (PTNK 2026 solutions) | Medium | Author unknown; all answers agree with our verified ground truth |
| GitHub trietptm archives | Medium | No licence; mirrors toanmath files and screenshots |

## 4. Gaps and limitations

- **PTNK 2025 official answer key**: listed on ptnk.edu.vn but the Drive owner disabled downloads. We did
  not work around it; 2025 answers are derived and verified by computation, proofs are unreviewed.
- **Older PTNK years (≤ 2022)**: the posts embed images only (no files); the GitHub archive has screenshots.
  Not collected in this pass.
- **Lê Hồng Phong, Trần Đại Nghĩa as separate schools**: TP.HCM uses one chuyên Toán paper set by the
  Sở (collected). Hà Nội – Amsterdam likewise sits the Sở's chuyên Toán paper (collected).
- **ĐHSP Hà Nội, Đà Nẵng, Huế, other provinces**: not collected (time); reachable through the same
  collections.
- **Diagrams**: geometry papers have no diagram in the statement (PTNK, Hà Nội, KHTN), so the text is
  complete. TP.HCM 2025 Bài 2b and Hà Nội 2025 Câu I.1 need their figures; the needed values are written
  into the transcription and the record is flagged `diagram`.
- **Years**: 2023–2026 only. Too few papers to measure year-over-year trends.
- **Copyright**: papers and solutions are not redistributed. The repository keeps transcribed question
  statements (needed for evaluation) and its own short annotations, not the solution texts.

## 5. Sources (URLs)

- PTNK de-thi/dap-an index: https://ptnk.edu.vn/tuyen-sinh-ptnk/de-thi-dap-an/
- PTNK 2023 papers: https://ptnk.edu.vn/ky-thi-tuyen-sinh-lop-10-nam-hoc-2023-2024-de-thi-cac-mon-chuyen/ and https://ptnk.edu.vn/ky-thi-tuyen-sinh-10-nam-hoc-2023-2024-dap-an-cac-mon-chuyen/
- PTNK 2024: https://ptnk.edu.vn/cong-bo-de-thi-chinh-thuc-tuyen-sinh-lop-10-nam-hoc-2024-2025/ and https://ptnk.edu.vn/dap-an-huong-dan-cham-cac-mon-thi-ky-thi-tuyen-sinh-lop-10-nam-hoc-2024-2025/
- PTNK 2025: https://ptnk.edu.vn/de-thi-chinh-thuc-ky-thi-tuyen-sinh-lop-10-nam-2025/ and https://ptnk.edu.vn/dap-an-cac-de-thi-ky-thi-tuyen-sinh-lop-10-nam-2025/
- PTNK 2026: https://ptnk.edu.vn/de-thi-chinh-thuc-ky-thi-tuyen-sinh-vao-lop-10-nam-2026-cua-truong-ptnk/ ; solutions https://cdn.thuvienphapluat.vn/uploads/Hoidapphapluat/2026/LNMK/THANG5/23/toann.pdf
- TP.HCM 2025: https://thcs.toanmath.com/2025/09/de-tuyen-sinh-lop-10-mon-toan-chuyen-nam-2025-2026-so-gddt-tp-ho-chi-minh.html ; https://github.com/trietptm/De-Thi-Toan-Chuyen-Tuyen-Sinh-Lop-10-Chuyen-Toan-Trung-Hoc-Pho-Thong-TP.HCM
- Hà Nội 2025: https://thcs.toanmath.com/2025/06/de-tuyen-sinh-lop-10-mon-toan-chuyen-nam-2025-2026-so-gddt-ha-noi.html
- KHTN 2025 vòng 2: https://thcs.toanmath.com/2025/06/de-tuyen-sinh-lop-10-mon-toan-vong-2-nam-2025-truong-chuyen-khtn-ha-noi.html
