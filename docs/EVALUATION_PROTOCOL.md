# Evaluation protocol

## Splits and leakage controls

The source of truth is `data/evaluation_manifest.json`; exam records remain in `data/exams/`. Each row has a stable exam/question id, source reference, transcription status, topic, answer status, and split. Related subquestions and near-duplicate variants stay in the same split.

- **development**: prompt, parser, schema, and verifier development.
- **validation**: configuration comparison and failure analysis.
- **held_out_test**: frozen until implementation decisions are complete.

Reference answers may be used to score a run, never injected into the solver prompt for held-out questions. Retrieval is disabled for held-out scoring. A held-out result is invalid if the input contains an exact reference solution, if a benchmark answer was added to a prompt example, or if the question was used to tune a special case.

If a paper has too few independent questions, the manifest records the limitation and uses question-level holdout; no claim of statistical generalization is made from that paper alone.

## Metrics

Report per question and aggregate by exam and topic:

- OCR: character error rate, significant-symbol accuracy, expression exact match, segmentation accuracy, and uncertainty recall.
- Solver: final-answer correctness, complete-solution correctness, proof validity, solution-set completeness, classification, curriculum fit, and domain handling.
- Formatting: schema validity, render success, ordering, Vietnamese display, and raw-markup leakage.
- Performance: OCR/solve latency, model calls, retries, and measured output size/cost.

OCR and reasoning failures are reported separately. `not_checkable` is not counted as mathematically verified. Missing source or reference data is reported as unavailable, never as a pass.

## Reproduction

Run `npm test --prefix worker` for the deterministic regression suite. Run `npm run ocr:eval` only when the configured OCR provider and fixture expectations are available. Model benchmark results must include model, prompt version, schema version, split, timestamp, latency, attempts, and the per-question status.
