# Reliability audit

Date: 2026-10-10. This is an evidence-based audit of the current repository, not a claim that every mathematical proof is machine-checkable.

## Architecture

Images enter the Worker image route, are sent to the configured OCR provider (`gemini` by default, with OpenAI, Anthropic, local, and development mock providers), then pass through `normalizeOcrOutput`. The normalized transcription is split into numbered problems and used by the solve route. A model returns a Zod-validated `ModelLesson`; structure, language, curriculum, claims, figures, and answer checks are validated before persistence. The mobile client renders the validated lesson with the shared math-text renderer.

## Baseline

The baseline test command was `npm test --prefix worker`: **22 files, 411 tests passed** in 3.45 seconds on 2026-10-10. A first attempted command included the unsupported Vitest flag `--runInBand`; it was not treated as a test result.

Existing benchmark evidence in `experiments/current_solver_results.json` reports, among other runs, 7/8 final-answer accuracy on the local validation subset and a PTNK 2026 chuyên subset with 3/4 answer-bearing rows correct; the hard geometry proof remains unverified/truncated in the recorded runs. These are historical benchmark results, not a fresh model evaluation.

## Findings

1. OCR already has constrained JSON, Vietnamese/math-preservation instructions, retries, fallback providers, problem splitting, and malformed-output tests. Remaining risk is expression-level accuracy: self-reported confidence is not calibrated and no complete image-to-ground-truth corpus is present.
2. The lesson contract was robust for algebra/geometry but did not name number theory or combinatorics as first-class topics. This can force generic routing and makes topic metrics incomplete.
3. Deterministic verification is strong for substitutions, identities, inequalities, numeric checks, integer bounded checks, and geometry claims. General proof transitions are frequently `not_checkable`; fluent prose must not be treated as proof.
4. Existing benchmark files contain train/validation/test-like data, but there was no single manifest documenting provenance, grouping, uncertainty, and leakage controls.
5. Rendering and schema validation are separate concerns and are tested, but malformed or duplicated display text remains a model-quality issue rather than a mathematical-verification issue.

## Root-cause priority

| Priority | Root cause | Evidence | Action |
|---|---|---|---|
| P0 | Proofs outside deterministic checks can be shown as unverified/partial | benchmark rows and verifier statuses | Preserve explicit status; add step audit fields and never label unverified work correct |
| P0 | Evaluation provenance/splits are scattered | multiple JSONL/JSON assets | Add `docs/EVALUATION_PROTOCOL.md` and `data/evaluation_manifest.json` |
| P1 | Number theory/combinatorics are not first-class lesson topics | shared `TopicSchema` | Add enum values and regression coverage |
| P1 | OCR confidence is provider self-report | `OcrConfidenceSchema` | Document it as non-calibrated; measure symbol/expression accuracy when gold data exists |
| P2 | Latency and truncation affect hard proofs | historical benchmark results | Keep bounded retries and record incomplete evaluation instead of inflating accuracy |

## Scope status

Implemented and tested: taxonomy extension, structured step audit fields, evaluation protocol, manifest, and regression coverage.

Implemented but incompletely tested: independent verification of arbitrary natural-language proof transitions and image-level OCR accuracy, because no gold image transcription set is available for every paper.

Planned: teacher-reviewed transcription and proof labels for a held-out image corpus; deterministic domain-aware algebra/number-theory/combinatorics engines beyond the existing answer-check infrastructure.
