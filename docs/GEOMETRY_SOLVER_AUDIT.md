# Geometry solver audit (before the proof planner)

Date: 2026-10-08. Scope: how geometry problems were solved up to commit `59546fd` (end of the geometry loop,
[GEOMETRY_LOOP.md](GEOMETRY_LOOP.md)), and why hard proofs kept failing. The proof planner that replaces the first
stage for proof problems is described in [GEOMETRY_PROOF_PLANNER.md](GEOMETRY_PROOF_PLANNER.md).

## 1. What existed

```
problem text ──► one LLM call (qwen3.6-35b via SOCLAAS; JSON lesson: analysis, hints, steps, figure)
                    │  prompt: curriculum KB, statement-figure notes, 14 geometry lessons
                    ▼
             verifyLesson (shared/src/verify.ts)
                    • figure: the statement's own construction (figureFromText.ts) replaces the model's
                    • claims in each step measured on that exact figure (claims.ts)
                    • grade level (gradeLevel.ts), LaTeX, structure
                    ▼
             feedback ──► at most one corrective retry (same model) ──► best attempt stored
```

The model wrote the proof freely. Everything after it was a **checker**, not a reasoner: it could catch a step whose
*conclusion* is false on the figure, but never establish that a true conclusion follows from what came before.

## 2. Evidence

From the geometry loop (six paid rounds, ≈ $1.43, 24 development problems; numbers re-audited with the current
checker in `scripts/geometry-audit.ts`):

| | Result |
|---|---|
| Lessons produced | 23/24 (from 15/24 in round 1) |
| Lessons with every check passing ("clean") | 14/24 |
| Chuyên proof parts never solved correctly in any round | 9: PTNK 2023 5b, 5c, 5d; PTNK 2024 4b, 4d; PTNK 2025 4a, 4b, 4c; HCM 2025 3a |
| Mean time per solve | 100–260 s; several requests truncated or stalled at the gateway |
| Cost | ≈ $0.03 per lesson, ×2 with a retry |

The same mistakes repeated despite explicit feedback. In PTNK 2025 4a the model wrote "∠AED = ∠EBD" in every attempt,
even after the retry message said "in fact ∠AED = 2·∠EBD". In 2023 5c it wrote "∠HAD = ∠HID" where the angles are
supplementary.

## 3. Why it failed

1. **Generation and reasoning were one step.** The model was asked to solve the problem and write the lesson at once.
   On a hard chuyên proof it had to find the idea, keep a long chain of angle relations consistent, and format JSON
   in one pass. It ran out of tokens or wrote a plausible-looking but wrong relation.
2. **The checker checked conclusions, not inferences.** A step "∠A = ∠B (góc nội tiếp cùng chắn cung …)" passed if
   ∠A = ∠B on the figure, even if the cited reason does not give it. A "verified" lesson meant "no claim we could
   measure is false", not "the proof is valid". *Proof validity was never measured.*
3. **Configuration errors are invisible to a model that has no figure.** Equal vs. supplementary inscribed angles,
   interior vs. exterior bisectors, which side of a chord a point lies on: the model guessed. Most of the false claims
   in the loop were exactly this.
4. **Retries were expensive and not targeted.** A retry re-sent the whole problem. Feedback named the false claim but
   could not supply a correct route.
5. **Every geometry problem paid for at least one model call**, including textbook proofs whose solution is two lines.

## 4. What was kept

The deterministic pieces built during the loop are the foundation of the new design:

- the statement figure builder (`figureFromText.ts`, `pointDefinitions.ts`): exact constructions from the text;
- the claim parser (`claims.ts`), now also producing structured goals for the planner;
- the lesson verifier (`verify.ts`), the grade-level check and the figure completion/highlighting;
- the knowledge base and geometry lessons given to the model when the model is still used.

## 5. Baseline numbers used for comparison

The per-problem baseline (best lesson over all loop rounds, re-audited) is in
[GEOMETRY_PTNK_2025_EVALUATION.md](GEOMETRY_PTNK_2025_EVALUATION.md) §4. Baseline proof validity is reported as an
upper bound ("no false measured claim"), since the old pipeline could not check inferences.
