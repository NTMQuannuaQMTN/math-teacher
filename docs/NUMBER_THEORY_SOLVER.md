# Number theory solver status

Number-theory questions are now represented as a first-class topic (`number_theory`) rather than being forced into generic algebra/arithmetic. Existing integer answer checks use exact bounded evaluation and are useful for regression and candidate validation; they are not by themselves a proof of completeness beyond the justified domain/bound.

The final explanation must state the domain, implication/equivalence direction, modulus or bound, and why the candidate list is complete. Enumeration is discovery or a check only unless the search space is proven exhaustive. General natural-language divisibility proofs remain `not_checkable` until a deterministic claim checker is available.
