# Solver audit (2026-10-02)

What the solver does today, measured against the principles of the curriculum-aware sprint, and what this sprint
changed. Earlier state: [AI_SOLVER_CURRENT_STATE.md](AI_SOLVER_CURRENT_STATE.md).

## Flow of one solve

```
photo → OCR (PaddleOCR-VL, local) → student confirms text
      → routing: tier (simple / standard / complex) + domains (knowledge base)
      → ONE structured LLM call (OpenRouter free Nemotron 3 Super; Gemini disabled)
          system prompt = role + security + level + knowledge base (domain-scoped) + method policy
                          + language + lesson rules + per-tier size + figure rules
      → tidy (language clean-up, notation) → verifyLesson (repairs + checks)
      → retry once with the verifier's feedback if it found a serious problem (budget 150 s)
      → store only a schema-valid lesson; stream progress to the app meanwhile
```

## Principle-by-principle

| Principle | Before this sprint | Gap | Now |
|---|---|---|---|
| Curriculum-constrained | Grade 9 topic list + forbidden list; olympiad geometry tools all forbidden | Did not match the agreed KB: Ceva/Menelaus/Simson/homothety/radical axis are *in* B2/B5; Jensen/Schur were only advisory; induction was flagged | KB A–E in code; prompt lists the problem's domains; B5 tools advisory; Jensen/Schur/Hölder/Minkowski, inversion, pole/polar, harmonic, cross-ratio, antiparallel, nine-point, Euler line forbidden |
| Problem understanding | analysis: topic, subtopic, concepts, givens, unknowns, constraints, status | No machine-readable method classification | `analysis.techniques` (KB ids, validated) + deterministic `problemDomains` |
| Simplest valid method | Method policy and preferences in the prompt; optional method cards | — | unchanged; the KB lists "advanced — only when the problem calls for it" |
| Vietnamese first | Language rule, glossary clean-up, diacritics/Chinese detection and retry | — | unchanged |
| No skipped reasoning | Proof rule (one deduction per step, never "dễ thấy"); `proofGapFeedback` heuristic | Dependencies between steps implicit | `step.uses` (validated: earlier steps only), shown as "Dựa vào bước …" |
| Verification | Answer checks (5 kinds, executed), figure givens, geometric claims measured on the exact figure, hand-waving heuristic | Status was lesson-level only; student couldn't see which step was checked | per-step status: checked / failed / answer / not_checked |
| Complete diagrams | Missing segments added; missing points/circles sent back | Mentioned angles without arcs; steps with a partial highlight didn't light up everything they named | arcs for mentioned angles; step highlights merged with everything named; coverage measure |
| Interactive sync | step/hint → highlight; constructions revealed by step | No object → step | tap object → step (or revealed hint), with scroll |
| No paid API | Gemini disabled; free OpenRouter tier; local OCR | — | unchanged; no paid call was made |

## What is honestly not verified

- **Proofs** are not formally checked. Geometric claims are measured numerically on one exact figure (a claim true on
  that figure can still be unproven in the text); algebraic and number-theory proofs get only the hand-waving
  heuristic and any answer checks the model wrote.
- **Inequalities (A4/A5)**: the `inequality` check verifies a solution set, not a proof of an inequality; AM-GM or
  Cauchy–Schwarz chains are not checked step by step.
- **Combinatorics (D)**: there is no counting checker; only a `value` check if the model recomputes the number.
- **Method boundary**: a text scan for named methods; an unnamed advanced argument is not detected.
- **Self-reported fields** (`techniques`, `uses`) are validated for form, not for truth.

The app says this: steps without a machine check carry "Chưa kiểm tra tự động", and the lesson badge stays
"partial" or "not checkable" when nothing could be checked.

## Operational findings

- The free hosted model is the main quality limit: slow (≈ 1–5 min per hard problem) and ~50 requests/day.
- A solve that "took 810 s" on 2026-10-02 coincided with the laptop sleeping (pmset log 18:07–18:36); timers
  pause during sleep — not a timeout bug.
- Production still needs (user action): remote D1 migrations 0005/0006, `ALLOWED_ORIGINS`, secrets.
