# Implementation report — curriculum-aware solver and interactive geometry (2026-10-02)

Branch `sprint/model-research`. Related docs: [SOLVER_AUDIT.md](SOLVER_AUDIT.md),
[CURRICULUM_KNOWLEDGE_BASE.md](CURRICULUM_KNOWLEDGE_BASE.md), [SOLUTION_SCHEMA.md](SOLUTION_SCHEMA.md),
[GEOMETRY_PIPELINE.md](GEOMETRY_PIPELINE.md), [EVALUATION_REPORT.md](EVALUATION_REPORT.md).

## Commits

| Commit | Change |
|---|---|
| `ec9caf3` | Knowledge base A–E in code; domain-scoped prompt; boundary realigned (B2/B5 tools advisory, Jensen/Schur/Hölder/Minkowski and inversion/polar/harmonic/antiparallel/nine-point/Euler line forbidden, induction allowed); prompt `solver-v2.7` |
| `cbc1c45` | Schema: `analysis.techniques`, `step.uses`, `Verification.steps` (per-step status) with repairs and tests |
| (geometry) | `completeFigure`: arcs for mentioned angles, step highlights merged with everything named (incl. circles); `figureCoverage` |
| `40225f3` | App: methods row, "Dựa vào bước …", per-step check badge, tap object → step |
| (eval) | `worker/scripts/figure-coverage.ts` |
| `860806d` | Verifier: answer that denies the question's premise → failed check + retry feedback; docs; EXP-011 |

## Files

- New: `shared/src/knowledgeBase.ts`, `worker/scripts/figure-coverage.ts`, the six docs above.
- Changed: `shared/src/{solution,verify,gradeLevel,figureComplete}.ts`, `worker/src/solver/{prompts,pipeline,curriculum}.ts`,
  `mobile/src/components/lesson/{LessonView,LessonParts}.tsx`, `mobile/src/i18n/strings.ts`, tests.

## Compatibility

Stored lessons parse unchanged (`techniques`/`uses` default to `[]`; `Verification.steps` is optional). The prompt
version changed, so a regenerate produces a v2.7 lesson; an existing lesson is still served until then.

## Not done / follow-ups

1. Run the rest of the chuyên validation split, then the test split once (quota).
2. Proof verification beyond figure measurement (algebraic inequality chains, counting arguments) — not attempted.
3. Domain cues miss acquaintance-counting and rational/irrational-set wording (seen in the test split; deliberately
   not tuned).
4. Production (user action): remote D1 migrations 0005/0006, `ALLOWED_ORIGINS`, secrets; then deploy.
