# Specialist training checkpoint

Date: 2026-10-10. This checkpoint uses one shared solver pipeline with four explicit specialist profiles. OCR, typed lesson validation, rendering, retries, and deterministic verification remain shared; the profile supplies domain responsibility and mandatory checks.

## Baseline

Before this checkpoint, the deterministic Worker suite had 414 passing tests across 22 files. No model-weight training was performed. Changes here are solver engineering and prompt policy, not fine-tuning. The application-level solve timeout is hard-capped at 30 seconds, independent of API-key/provider selection; a fresh production latency distribution is not available in this environment.

## Specialist mapping

| Specialist | Shared domain | Primary guardrails |
|---|---|---|
| Algebra Bot | `algebra` | domains, extraneous roots, substitution, completeness |
| Geometry Bot | `geometry` | givens vs claims, theorem preconditions, complete proof, figure consistency |
| Number Theory Bot | `number_theory` | integer domain, modular implication direction, justified bounds, completeness |
| Combinatorics Bot | `combinatorics` | outcome model, order/repetition, disjoint exhaustive cases, overcounting |

## Evidence status

Implemented and type-checked: specialist profiles and prompt integration. Tested: shared and Worker typechecks plus the existing regression suite. Not yet measured: fresh model-generated per-question accuracy, human satisfaction, and p50/p95 production latency. Those require an available inference provider and must not be fabricated.

## Manual test

Submit one Vietnamese question from each domain, confirm the routed profile in Worker logs, inspect that every step contains a deduction and reason, and confirm that an invalid or unverified proof is labelled accordingly. Record elapsed time from complete question receipt to response; timeout cases must be reported separately.
