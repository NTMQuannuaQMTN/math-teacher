# Training and evaluation data

## Contents (dataset chuyen-v1)

| Split | Exams | Problems | With computed verification | Teaching records | Use |
|---|---|---:|---:|---:|---|
| train | PTNK 2023, 2024, 2025 (chuyên) | 37 | 24 | 22 | prompt/method-card development, fine-tuning targets |
| validation | PTNK 2026 chuyên, TP.HCM 2025 chuyên | 15 | 12 | — | method selection, before/after comparisons |
| test | Hà Nội 2025 chuyên, KHTN 2025 vòng 2 | 20 | 13 | — | held out: final evaluation only |

Plus dataset v1 (`tools/benchmark/dataset/problems.jsonl`, 40 items): its 15-item PTNK 2026 không chuyên
test split is also held out.

By topic: train = algebra 12, geometry 11, number theory 8, combinatorics 6. Validation and test are listed
in DATASET_SCHEMA.md.

## What a training example contains

`data/training/teaching.jsonl`, one per verified training problem. Each has:
- the original question and its source;
- the problem type (Nhận dạng) and the required knowledge;
- the key idea;
- 2–4 progressive hints;
- a short structured solution (one line per step, LaTeX);
- the final answer;
- a reusable takeaway;
- the technique ids, the expected level, the verification id and the review status.

It is deliberately not a long chain-of-thought transcript: every line can be read and checked by a teacher.
To fine-tune the app's solver, each record is rendered into the app's lesson JSON (analysis, strategy,
hints, steps, finalAnswer) with the serving system prompt. `tools/benchmark/export_sft.py` already does this
for dataset v1 and needs a small adapter for these records (not written yet).

## Rules

- **Only verified problems become training targets.** 24 of the 37 training problems have computed
  verification and 22 of those have a teaching record (PTNK 2024 B5b and 2025 Câu 3c, verified only by search,
  have none yet). The 13 others (geometry proofs, games) wait for a teacher's review.
- **No test material in training.** The method cards' texts come from the knowledge map and general school
  techniques. **Disclosure:** while tightening the cue patterns I printed which cards fire on all 67 items,
  test items included, and three cue changes (geometry exclusion for the inequality card, "đường kính" for
  the orthocentre card, the `\left` boundary) were checked against that full list. No card text or answer
  came from a test problem, but the test set is not perfectly untouched for the card cues; the train/val
  numbers are the cleaner evidence.
- **No synthetic variants yet.** If variants are generated later, they inherit the split of their source exam.
- **Exam-level separation** avoids leakage between sub-parts of the same question and between a problem and
  its rewordings.

## Size, and what it means

22 verified training examples are enough to **test a format** (does a model follow the lesson structure?)
but far too few to **teach reasoning**. Fine-tuning on them would mostly teach the style of 22 lessons and
risk memorising three years of one school's papers. See FINE_TUNING_REPORT.md for the decision and
MODEL_ADAPTATION_PLAN.md for what to do instead.

Growing the set: 2–3 more schools × 3–4 years would give about 300–400 problems. The official PTNK archive
(ptnk.edu.vn, 2023–2026) and the TP.HCM and Hà Nội boards publish yearly; the transcription and verification
pipeline (DATASET_SCHEMA.md) scales linearly, about 15–20 min per paper including computational checks.
