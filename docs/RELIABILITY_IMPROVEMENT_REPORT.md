# Reliability improvement report

Date: 2026-10-10.

## Implemented and tested

- Added first-class `number_theory` and `combinatorics` topics to the shared contract.
- Added backward-compatible structured per-step audit fields: facts, operation, result, and verification status.
- Added a leakage-controlled evaluation protocol and manifest covering existing exam assets.
- Documented OCR, algebra, number-theory, combinatorics, answer-format, and independent-verification boundaries.
- Baseline deterministic suite: **411/411 tests passed** across 22 files.

## Implemented but incompletely tested

- OCR normalization and fallback are covered by fixtures and unit tests, but full CER/symbol accuracy is unavailable without gold image transcriptions.
- Deterministic verification covers encoded checks; arbitrary proof completeness is not generally decidable from current model output.

## Baseline versus final metrics

No new model run was fabricated. Historical benchmark evidence remains in `experiments/current_solver_results.json`; it reports 7/8 final-answer accuracy on one local validation run and a PTNK 2026 subset with 3/4 answer-bearing rows correct, while hard proof/geometry rows were unverified or truncated. A frozen held-out run is still required for a defensible post-change comparison.

## Remaining failure cases and next steps

Add human-proofread image/transcription pairs, freeze held-out evaluation, implement deterministic claim checkers for common divisibility and counting proofs, and run the complete image-to-rendered-answer evaluation. Manual smoke testing should upload a Vietnamese multi-part page, inspect each split problem, solve one algebra, one number-theory, and one combinatorics item, and confirm that uncertainty/unverified status is visible rather than silently converted to success.
