# Answer format specification

The model source of truth is `ModelLessonSchema` in `shared/src/solution.ts`. The API never uses free-form prose to reconstruct steps. A lesson contains analysis, strategy, ordered hints, ordered steps, a final answer, answer checks, and an optional figure.

Each step now also carries `factsUsed`, `operation`, `result`, and a verification record (`verified`, `failed`, or `not_checked`, with method and reason). These fields are optional at the wire boundary through defaults for backward compatibility, but new generation should populate them.

The server validates before persistence and computes the independent `Verification` status. `verified` means all available deterministic checks passed; `partial` means some claims remain unchecked; `unverified` means a check failed; `not_checkable` means no available machine check exists. The client must preserve ordering and render text/math through the math-text component. It must not execute model HTML, display raw JSON as a successful answer, or treat `not_checkable` as verified.
