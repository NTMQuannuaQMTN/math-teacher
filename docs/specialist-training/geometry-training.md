# Geometry Bot training report

## Responsibility

Geometry Bot handles Euclidean configurations, circles, ratios, lengths, constructions, and multi-step proofs. The existing proof planner and figure checker remain shared infrastructure.

## Actual repository examples

| ID | Source | Topic | Verification evidence |
|---|---|---|---|
| `ptnk-2026-chuyen` subset | `experiments/current_solver_results.json` | specialized geometry proofs | historical rows include verified, unverified, and truncated cases |
| `g5`, `g8` | benchmark result files | right-triangle calculation / circle proof | answer or proof status recorded per row |

## Implemented

The profile requires separating givens from derived claims, theorem preconditions, and complete intermediate constructions. Figure measurements cannot substitute for proof. Existing deterministic figure checks remain authoritative.

## Known gap

Hard geometry proofs can exceed the 30-second budget and may return unverified/partial status. No new held-out geometry run was performed in this checkpoint.
