# Algebra solver status

The current algebra path is model-generated but schema-constrained, curriculum-checked, and independently checked where an answer check can express substitution, identity, inequality, value, or integer conditions. Domain constraints belong in `analysis.constraints` and should be repeated in the derivation when denominators, radicals, squaring, or cancellation are involved.

Implemented and tested: structured lesson validation, answer-check verification, grade-level/method checks, and regression tests for extraneous roots and malformed lessons. Incomplete: a general symbolic derivation engine for every specialized Grade 9 algebra proof. Such proofs remain explicitly partial/unverified unless deterministic checks cover them.
