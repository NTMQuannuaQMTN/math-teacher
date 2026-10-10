# Algebra Bot training report

## Responsibility

Algebra Bot handles identities, factorisation, rational/radical expressions, equations, systems, Viète, inequalities, and optimisation. It must track domain restrictions and independently substitute candidate answers.

## Actual repository examples

| ID | Source | Topic | Verification evidence |
|---|---|---|---|
| `ptnk-2025-chuyen/1a` | `data/exams/ptnk-2025-chuyen.json` | quadratic discriminant | `data/exams/verification.json`, exact claim |
| `ptnk-2025-chuyen/1b` | same | inequality in roots | verification record, sampled/exact evidence as recorded |
| `a3` | `data/validation/problems.jsonl` / benchmark records | radical/rational simplification | existing answer-check regression |

## Implemented

The specialist profile requires domain tracking, original-equation substitution, and completeness. The shared oracle and verifier remain the source of deterministic checks. No new model run was available for this checkpoint, so no generated answer or accuracy improvement is claimed.

## Known gap

Arbitrary symbolic proofs are not fully verified by the current deterministic layer. They remain partial or unverified rather than being accepted because the prose sounds correct.
