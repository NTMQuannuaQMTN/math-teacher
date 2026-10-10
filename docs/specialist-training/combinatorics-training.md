# Combinatorics Bot training report

## Responsibility

Combinatorics Bot handles counting, arrangements, cases, inclusion-exclusion, pigeonhole, invariants, double counting, and elementary probability.

## Actual repository examples

| ID | Source | Topic | Verification evidence |
|---|---|---|---|
| `ptnk-2025-chuyen/5` | `data/exams/ptnk-2025-chuyen.json` | magic-square construction and bounds | benchmark result includes verified status for encoded checks |
| `ptnk-2023_3` | `data/exams/verification.json` | colouring/counting | exhaustive finite verification recorded |

## Implemented

The profile requires defining the outcome space, order, repetition, disjoint/exhaustive cases, and overcounting controls. Small-instance enumeration remains an independent check, not a replacement for proof.

## Known gap

The current application does not yet contain a general symbolic case-coverage checker. New generated combinatorics answers must therefore be labelled partial/unverified when no deterministic check exists.
