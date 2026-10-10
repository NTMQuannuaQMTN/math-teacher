# Mathematical verification

Verification is separate from generation. The Worker validates schema and structure, then runs deterministic checks for answer substitutions, identities, inequalities, values, integer conditions, and geometry claims. It records step-level statuses where claims are measurable. A second fluent model response is not considered independent verification.

When a check fails, the repair path must preserve the original problem, identify the failed check, request a bounded alternative, and re-run validation. If no candidate passes, the result stays unverified and is not presented as mathematically confirmed. Proof-only claims without a deterministic checker remain explicitly `not_checkable` or `partial`.
