# Geometry solver architecture

Date: 2026-10-08. Replaces "the model writes the proof, we check it" with "we construct and verify the proof, then
write it up". Background: [GEOMETRY_SOLVER_AUDIT.md](GEOMETRY_SOLVER_AUDIT.md). Details of each stage:
[GEOMETRY_PROOF_PLANNER.md](GEOMETRY_PROOF_PLANNER.md), [GEOMETRY_METHOD_LIBRARY.md](GEOMETRY_METHOD_LIBRARY.md).

## Pipeline

```
problem text
  │
  ├─ 1. parser            figureFromText.ts      exact construction of every named point (statement figure)
  │                       claims.ts, planner.ts  goals: the "chứng minh" claims as facts; shape words as givens
  │                                              not understood → reported (never silently dropped)
  ├─ 2. geometry graph    engine.ts              given facts from each construction (midpoint, foot, tangent,
  │                                              perpendicular bisector, circle membership, …)
  ├─ 3. goal analyzer     engine.ts goalMethods  which methods can conclude each goal type
  ├─ 4. method library    methods.ts             61 methods with grade, difficulty, prerequisites; 5 forbidden
  ├─ 5. proof search      engine.ts search       forward rules + algebra (angle chasing, length ratios as linear
  │                                              systems with provenance); goals tried directly each round
  │                                              (backward); bounded depth/facts/time; per part of the problem
  ├─ 6. proof plan        planner.ts             the derivations each goal needs, premises minimised
  ├─ 7. verifier          verify.ts              independent re-check of every step (see below)
  ├─ 8. repair / retry    planner.ts             iterative deepening; a rejected proof is not used
  ├─ 9. explanation       explain.ts             deterministic Vietnamese templates for each verified step
  └─ 10. figure, highlights                      the statement figure (+ auxiliary points); each step highlights
                                                 the points of its facts; existing completion/highlight code
```

All of 1–10 are deterministic TypeScript in `shared/src/proof/`. **No model call.**

## How the pipeline uses it (`worker/src/solver/pipeline.ts`)

| Planner result | What the student gets | Model calls |
|---|---|---|
| `VERIFIED` and readable (each step cites ≤ 8 facts, ≤ 14 steps) | the planner's lesson | **0** |
| `VERIFIED` but long, `VERIFIED_WITH_CAVEAT`, `NEEDS_REVIEW` | model lesson, with the verified results in the prompt ("đã chứng minh và kiểm tra … hướng: …") | as before |
| `UNSOLVED_WITHIN_BOUNDARY`, `PARSING_UNCERTAIN` | model lesson, as before | as before |

Computation and extremum problems go to the model as before. The planner adds ≤ 200 ms. The option
`proofPlanner: false` turns it off; `onPlan` receives the plan for observability.

## Statuses

| Status | Meaning |
|---|---|
| `VERIFIED` | every claim the statement asks for is parsed, proved and accepted by the verifier |
| `VERIFIED_WITH_CAVEAT` | every claim proved; parts asking to compute/find remain for the solver |
| `NEEDS_REVIEW` | some claims proved and verified; others not proved, or not understood |
| `UNSOLVED_WITHIN_BOUNDARY` | goals understood, none proved within the search bound |
| `PARSING_UNCERTAIN` | the figure couldn't be built exactly, or no claim was understood |

## Rules the design enforces

- **The diagram is never a proof.** The exact figure is an oracle: it proposes which facts are worth trying (a fact
  false on the figure is never tried), orients angles, and settles configuration (which side of a line a point is on,
  whether a point lies between two others). Every fact in a proof is a given or the conclusion of a registered method
  whose premises are earlier facts. Configuration facts used are listed on the step (`configuration`).
- **Independent verification.** `verify.ts` shares no code with the search. For each step it checks: the method
  exists, is allowed and is within grade 9; premises come earlier; givens are recomputed from the construction;
  each rule's premises have the exact shape the rule needs; algebraic steps are re-solved with a fresh linear system
  holding only the cited premises; every fact holds on the figure *and on randomly perturbed copies* (the same
  construction with moved free points, keeping the statement's givens). A goal counts as proved only if all of this
  passes.
- **Auxiliary constructions are justified.** The planner adds a point only to state a goal that refers to an unnamed
  one ("AL, GJ cắt nhau trên (I)" → P = second intersection of AL with (I); "DK đi qua trung điểm IR" → M = midpoint of
  IR). Each is a well-defined construction, listed in the lesson's strategy ("vẽ thêm …").
- **Each part uses only what exists by then.** Part a cannot use a point defined in part c. Results of earlier parts
  are cited as "câu a".
- **Bounded.** Depth ≤ 5 rounds, ≤ 4000 facts, ≤ 4 s per part (in practice ≤ 200 ms per problem).
- **Simple methods first.** Rules are applied cheapest first; the shallowest search depth that proves a goal gives
  its proof; premises of algebraic steps are minimised, dropping the most expensive ones first.

## Cost

No paid API is introduced. Gemini stays disabled. A problem the planner proves (`VERIFIED`, readable) costs $0 and
returns in milliseconds instead of 1–4 minutes.
