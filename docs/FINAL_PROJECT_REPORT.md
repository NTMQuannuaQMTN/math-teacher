# Final project report: Toán chuyên vào 10 tutor

Date: 2026-10-01 · Branch `sprint/model-research`. Completed work and proposed work are kept separate
throughout; numbers come from the files cited.

## 1. Initial state

A working local stack: Expo app, Cloudflare Worker, D1 and R2, local PaddleOCR-VL, a one-call lesson
solver with a strong deterministic verifier, and a free hosted solver (Nemotron) with live progress. It
targeted regular Grade 9; there was no chuyên data beyond one PTNK paper. Details:
docs/PROJECT_CURRENT_STATE.md.

## 2–4. Exams researched and collected

- **Researched:**
  - official PTNK archive (ptnk.edu.vn and its public Drive folders);
  - Sở GD TP.HCM and Hà Nội papers;
  - KHTN Hà Nội;
  - public collections (toanmath, a GitHub archive).
- **Collected (7 papers, 4 boards, 2023–2026):** PTNK 2023, 2024, 2025 and 2026 chuyên; TP.HCM 2025
  chuyên; Hà Nội 2025 chuyên Toán; KHTN 2025 vòng 2.
- **Solutions:**
  - official keys for PTNK 2023 and 2024, and the TP.HCM marking guide;
  - teacher solutions for Hà Nội and KHTN;
  - third-party solutions for PTNK 2026.
- **PTNK 2025 official key:** not obtained (the owner disabled downloads; not bypassed).
- **Totals:** 72 problem records (79 sub-questions). Sources, hashes and gaps are in docs/EXAM_RESEARCH.md
  and data/exam_sources.json.

## 5. Extraction and verification

- **Extraction:** page images, then transcription by Claude (all 67 new records flagged for human
  proofreading), then one catalog, then a reproducible build.
- **Verification:** 43/43 independent checks pass (SymPy, exhaustive, bounded, sampled). 49 problems are
  computer-verified; 23 proofs are manually reviewed only.
- **Errors found in the keys:** four, none changing an answer. See docs/SOLUTION_VERIFICATION.md.

## 6. Knowledge and techniques

- **Taxonomy:** 54 concepts with prerequisite edges and 57 techniques. Every problem has a profile:
  concepts, techniques, key insight, difficulty and level.
- **Findings:**
  - Problems: 40 at specialized Grade 9 level, 23 olympiad-style, 9 standard.
  - Geometry proofs run on angle chasing (13) and similar triangles (10).
  - Number theory runs on factorise-and-case and remainders.
  - The olympiad-style third is where models fail.
- **Query tool:** `tools/exams/query_knowledge.py` (prerequisites, frequencies, gaps).
- **Document:** docs/MATHEMATICAL_KNOWLEDGE_MAP.md.

## 7. Dataset

| Split | Exams | Problems | Computer-verified |
|---|---|---:|---:|
| train | PTNK 2023–2025 | 37 | 24 (22 with teaching records) |
| validation | PTNK 2026, TP.HCM 2025 | 15 | 12 |
| test (held out) | Hà Nội 2025, KHTN 2025 | 20 | 13 (10 auto-gradable) |

Exam-level split; no synthetic variants; 22 teaching records exported to the lesson format, 22/22 valid.
One disclosed exposure: card cues were checked against all items, including test items. See
docs/TRAINING_DATASET.md.

## 8. Existing solver performance

On PTNK 2026 chuyên, both systems score 3 PASS · 1 PARTIAL · 1 FAIL · 0 CRITICAL. The incircle proof
fails for both: truncation on the hosted model, false claims on the local one. On TP.HCM 2025, 2 items
were measured: 1 PASS and 1 correct but unverified.
- **Latency:** hosted 46–362 s; local 9–55 min.
- **Not measured:** the held-out test, and most of the validation set.
- **Uncertainty:** n = 5, so the 95% interval on the PASS rate spans roughly 15–95%. Nothing general can
  be claimed. See docs/CURRENT_SOLVER_EVALUATION.md.

## 9. Adaptation strategy

The failures were reasoning capacity on olympiad proofs, verification gaps, language, and output budget.
They were not missing technique knowledge, so the strategy is:
- deterministic verification and repair (done);
- curriculum and method policy (done);
- method cards (built, opt-in, not yet measured);
- a stronger model for the proof tier only (needs authorisation);
- fine-tuning later, once ≥ 200 verified examples exist.

See docs/MODEL_ADAPTATION_PLAN.md.

## 10. Fine-tuning

**Not performed.** Reasons:
- 22 verified examples;
- failures not addressable by SFT;
- no fine-tunable served model;
- the GPU was busy with evaluation, on battery;
- `mlx-lm` not installed.

The data and the export are ready. See docs/FINE_TUNING_REPORT.md.

## 11. Before / after

| Change | Before | After | Evidence |
|---|---|---|---|
| Restatement rule (verifier) | Câu 2 wrong (10√2) shown as **verified** (CRITICAL) | marked not checkable (FAIL, honest); the rule changed no other grade across 8 regraded runs | regrade, tests |
| Curriculum alignment (13 topics) | Cô-si and Bunhiacopxki forbidden; "unsupported" accepted for in-curriculum problems | allowed; "unsupported" sent back unless the problem needs outside maths | tests |
| Check salvage, hint repair (earlier tonight) | OPT-008/009 items PARTIAL | +1 PASS each on EXP-010, EXP-004b, OPT-008; OPT-009 2/2 PASS | regrade |
| Method cards | — | **not measured** (CHB-003 not run) | — |

## 12. Generalisation

- **Unseen schools:** not measured.
- **Retriever:** 20/20 on author-written probes (author-biased).

See docs/GENERALIZATION_EVALUATION.md.

## 13. Latency and cost

- **Served (free hosted):** $0 per problem, median 46 s on validation, minutes on hard problems. Limited to
  ≈ 50 requests/day, so it can't serve users.
- **Method cards:** add 0 calls and 100–300 input tokens.
- **Verification:** milliseconds.
- **Paid open-model endpoint** (proposed, not authorised): ≈ $1–2 per 1,000 problems.

## 14. Architecture

Unchanged: one structured LLM call, deterministic verification and repair, and at most one retry. New
since the earlier state:
- optional method cards (`worker/src/solver/techniques.ts`);
- the restatement rule;
- the 13-topic curriculum.

See docs/AI_SOLVER_CURRENT_STATE.md and docs/SOLVER_PERFORMANCE_AUDIT.md.

## 15–17. Readiness

**Score: 4.95/10. Classification: Internal testing.** The critical blockers:
1. no budgeted production inference;
2. unmeasured held-out accuracy;
3. no privacy disclosure for third-party processing;
4. no monitoring or rollback procedure.

See docs/PRODUCTION_READINESS_AUDIT.md.

## 18. Remaining work

- Run the held-out test and the method-card comparison.
- Proofread the 67 transcriptions and review 30 lessons with a teacher.
- Write teaching records for the 2 search-verified training items.
- Grow the dataset.
- Privacy notice, monitoring, CI, deployment runbook.

## 19. Next milestones

1. **M1, measurement:** authorise an inference endpoint (or wait for quota); run validation ±cards and
   the test split once.
2. **M2, trust:** teacher review loop; privacy notice; monitoring and CI.
3. **M3, hard proofs:** stronger-model fallback for the proof tier; few-shot from verified teaching records.
4. **M4, data:** ≥ 200 verified chuyên problems across ≥ 3 schools; then reconsider fine-tuning a local
   model.
