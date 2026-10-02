# Evaluation report — curriculum-aware sprint (2026-10-02)

Every number below comes from a run logged in [EXPERIMENT_LOG.md](EXPERIMENT_LOG.md) or from the test suite.
No paid API was called; Gemini stayed disabled.

## Summary

| Dimension | Evidence | Result | Confidence |
|---|---|---|---|
| Answer correctness (chuyên) | EXP-011, hosted Nemotron, validation | 2/3 items that ran are correct and verified; 7/10 did not run (daily quota) | **Low** — n = 3 |
| Verification honesty | EXP-011 | the wrong answer (2a) was `not_checkable`, never shown as verified; it is now a failed check | Medium |
| Curriculum boundary | scan of 53 stored lessons | 0 forbidden, 0 advisory methods under the new knowledge base | Medium (text scan only) |
| Method classification | EXP-011 | 3/3 lessons declared valid technique ids; 0 unknown ids dropped | Low — n = 3 |
| Step dependencies | EXP-011 | 3/3 lessons: every `uses` points to an earlier step (none dropped) | Low — n = 3 |
| Domain scoping | DOM-001, 67 chuyên items | labelled domain detected 63/67; 17/67 get an extra domain | Medium |
| Figure completeness | FIG-001, 13 stored geometry lessons | angle arcs 16/20 → 20/20; segments 43/43 → 43/43; missing points/circles 0 | Medium (see caveat) |
| Step ↔ figure sync | FIG-001 | steps highlighting everything they name 17/33 → 33/33; median 3 targets per step, max 9 | Medium (see caveat) |
| Regression safety | `npx vitest run` (worker) | 326/326 pass; mobile typecheck, lint and web bundle clean | High |

## Caveats

- **Sample size.** EXP-011 is three solved items from one exam (TP.HCM 2025). It cannot show an improvement or a
  regression over earlier prompts; it shows the new prompt and schema work end to end on a hosted model.
- **Circular figure metric.** FIG-001's "mentioned" objects come from the same pattern detector that the repair
  uses, so the "after" column shows the repair does what it was built to do. It does not measure objects
  described only in words, single-letter angles (`\widehat{A}`) or whether a human finds the figure complete.
- **The presupposition rule** was motivated by a validation item (2a). It is a general rule (an exam question
  asking for one value has one), checked against all ground truths in both datasets (0 false positives) and the
  53 stored lessons (0 flagged). Its effect on accuracy is unmeasured until 2a is re-run.
- **Proofs** remain unverified beyond figure measurement and hand-waving heuristics (SOLVER_AUDIT.md).

## Not run, and how to run it

| What | Why not | Command |
|---|---|---|
| Remaining 7 validation items (EXP-011b) | free quota exhausted (resets 08:00 local) | `npx tsx scripts/benchmark.ts or-nemotron-3-super --dataset chuyen --split validation --exp EXP-011b` (cached items are free) |
| Held-out test split | should be run once, after validation is complete | `… --split test --exp EXP-012` (logged as a TEST RUN) |
| Human review of figures / teaching quality | needs the user | use "Báo lỗi" in the app, then `npx tsx scripts/feedback-recap.ts` |
