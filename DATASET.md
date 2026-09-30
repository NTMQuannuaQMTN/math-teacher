# Benchmark dataset (v1)

The dataset is in `tools/benchmark/dataset/problems.jsonl` (40 problems) and the splits in
`tools/benchmark/dataset/splits.json`. Build it with `python3 tools/benchmark/build_dataset.py`,
and verify every ground truth with `python3 tools/benchmark/ground_truth.py` (47/47 checks pass).

## Sources

| Source | Items | Access | Notes |
|---|---|---|---|
| Google Drive folder "2627 - Tuyển sinh 10 - Đề thi chính thức" | — | ✅ public, fetched with curl | 10 PDFs. **Only 2 are maths**: the others are Hóa, Văn, Sinh, Anh, Tin and Lý. **No answer keys** in the folder. |
| PTNK 2026 Toán không chuyên (`2026 - TS10 - Toán KC (Đề thi).pdf`, sha256 `54c5797e…`) | 15 | ✅ | 10 multiple-choice + 5 written questions (3 with sub-parts) |
| PTNK 2026 Toán chuyên (`2026 - TS10 - Toán chuyên (Đề thi).pdf`, sha256 `40bda295…`) | 5 | ✅ | 5 written questions, 2–3 sub-parts each, olympiad-leaning |
| Repo cases (`tools/solver-eval/cases.json`) | 20 | ✅ | written during development: basic algebra, geometry, invalid inputs, prompt injection |

The PDFs were transcribed **by hand** from the page images into the app's text format (LaTeX in
`$…$`). No OCR model was used, so dataset text errors are human transcription errors, not model
errors. Each item keeps `source_file`, `source_drive_id` and `source_sha256` for provenance. The
exam papers are official public documents; they are used for evaluation only and are not
redistributed beyond this repository.

## Ground truth

There was no official answer key. Every answer was **derived by hand and independently checked by
computation** in `tools/benchmark/ground_truth.py`; the `check` field of each item names its checks.

- Algebra: exact SymPy (solve, simplify, discriminant, inequality solving).
- Number theory and combinatorics: brute force (n = 1…5000; exhaustive 3×3 magic-square search up to n = 45).
- Geometry proofs: the statement to prove is measured on **50 random valid configurations** (random
  acute triangles with AB < AC and so on), using explicit constructions: orthocenter, incenter, feet,
  circle intersections.
- Calendar: all years 2000–2099 are enumerated.

The script caught one wrong hand-derived answer, which was corrected: repo case a3 simplifies to
(x − 1)/√x, not x − 1. No ground truth comes from an AI model.

## Schema (per line of problems.jsonl)

`id, source, source_file, source_drive_id, source_sha256, year, language, exam, question, topic,
subtopic, difficulty (1 basic … 4 olympiad), format (multiple_choice | calculation | multi_part |
proof | ambiguous | out_of_curriculum), requires [symbolic, geometry_construction, diagram,
numeric], problem_text, options, diagram, ground_truth_answer, ground_truth_solution, grading {mcq,
accept (groups of regexes, all groups must match), reject, proof_parts, literal}, allowed_methods,
common_mistakes, check, split`

## Splits (why not 70/15/15)

| Split | Items | Content | Rule |
|---|---|---|---|
| **test** | 15 | all of Toán KC 2026 | **never used during development**; each final system is run on it once |
| **validation** | 11 | Toán chuyên 2026 (5) + a3, a7, g5, g8, w1, x3 | used for model comparison and tuning |
| **train** | 14 | the other repo cases | few-shot / fine-tuning examples only |

A stratified 70/15/15 split of 40 items would put ~6 items in test, too few to say anything, and it
would mix in the Toán chuyên questions. Those questions **were used during development** (the
verifier's claim checker and point parser were built and tuned against them on 2026-09-29/30), so
putting any of them in test would be leakage. The Toán KC exam is the only real-exam material never
seen by any system or prompt, so it is the test set.

## Composition

| Split | Algebra | Geometry | Word | Number theory / combinatorics / other | Invalid / adversarial | Difficulty 1 / 2 / 3 / 4 |
|---|---|---|---|---|---|---|
| test | 8 | 5 | 1 | 1 (calendar) | 0 | 5 / 8 / 1 / 1 |
| validation | 3 | 4 | 1 | 2 | 1 | 3 / 3 / 3 / 2 |
| train | 5 | 7 | 0 | 0 | 2 | 13 / 1 / 0 / 0 |

## Known limitations

- **Small.** 40 items, 15 in test: a difference of one item is ~7 percentage points on test.
  Conclusions are given with that uncertainty.
- The train split is basic (mostly difficulty 1). It is **not** enough for fine-tuning; see FINE_TUNING.md.
- Proof problems have no machine-gradable final answer. They are graded by the pipeline's own
  verification (measured claims); the reasoning quality of proofs is reviewed manually on a sample.
- The diagram in Toán chuyên Câu 5 (an empty 3×3 grid) is described in text; no other item has a diagram.
