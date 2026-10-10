# Number Theory Bot training report

## Responsibility

Number Theory Bot handles divisibility, congruences, integer equations, bounds, perfect powers, and completeness of integer solution sets.

## Actual repository examples

| ID | Source | Topic | Verification evidence |
|---|---|---|---|
| `ptnk-2025-chuyen/3a-c` | `data/exams/ptnk-2025-chuyen.json` | divisibility and congruences | `data/exams/verification.json`, bounded/exact claims as recorded |
| `ch-3` | benchmark records | modular conditions | historical result marked verified |

## Implemented

The profile requires an explicit domain, correct implication/equivalence handling, justified enumeration bounds, and a completeness argument. Existing exact integer checks are retained.

## Known gap

Bounded checking is not a general proof unless the bound is derived. General natural-language divisibility proofs still need additional deterministic claim handlers.
