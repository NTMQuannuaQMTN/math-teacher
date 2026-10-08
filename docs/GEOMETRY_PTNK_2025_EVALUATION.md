# Geometry proof planner: PTNK 2025 evaluation, held-out check, baseline comparison

Date: 2026-10-08. Planner: commit `287650a` ([GEOMETRY_PROOF_PLANNER.md](GEOMETRY_PROOF_PLANNER.md)). Baseline: the
LLM-only pipeline at the end of the geometry loop ([GEOMETRY_SOLVER_AUDIT.md](GEOMETRY_SOLVER_AUDIT.md)).
Reproduce: `npx tsx worker/scripts/proof-plan.ts [-v]`, `proof-heldout.ts`, `proof-lesson.ts <id>` (no model call).

## 1. Leakage — read first

**PTNK 2025 Bài 4 is not held out for the planner.** I ran the planner on every dataset geometry problem while
building it, and several features were written because a PTNK 2025 statement needed them:

- the perpendicular-bisector construction fact (4a);
- "đường tròn này đi qua tâm O" (4a);
- "△X và △Y đồng dạng" (4b);
- the "đi qua trung điểm" auxiliary point (4c).

The same holds for PTNK 2026 Câu 4, which is the user's "Câu 4" (`ch-4`), and for every other dataset problem. The
planner has no learned parameters, but its rule set was shaped by these problems.

The only clean check is §3: 12 standard grade-9 proofs written for this purpose before the planner was ever run on
them. Their **first run is reported as is**. One later change, a soundness fix that is not specific to any problem,
is reported separately.

## 2. PTNK 2025 Bài 4 (Toán chuyên, 26/5/2025)

| Part | Claims | Baseline (LLM-only, best of 3 paid rounds) | Planner | Served by (new pipeline) |
|---|---|---|---|---|
| 4a | A, D, E, F concyclic; the circle passes through O | **wrong**: "∠AED = ∠EBD" in every attempt (true: ∠AED = 2∠EBD) | **VERIFIED**, 2/2, 11 steps, 4 ms | planner, $0, no model call |
| 4b | △DBE ∽ △DCF; the altitude from D of △DEF and from A of △ABC meet on (O) | partial (claims false on the figure) | **NEEDS_REVIEW**: similarity proved (5 steps); the second claim not understood | model + verified similarity as a hint (§2.1) |
| 4c | ∠RKD = 90°; DK passes through the midpoint of IR | **wrong** (false claims) | UNSOLVED_WITHIN_BOUNDARY (see the note) | model (as baseline) |

**Note on 4c.** An earlier build reported 4c as VERIFIED. That proof relied on a bug: the angle algebra divided
congruences mod 180° by 2, which is unsound. The fix (pivot only on ±1 coefficients) also applies to the verifier, so
under the sound version no proof of 4c is found and the claim is withdrawn. Every other result in this document was
re-run after the fix.

### 2.1 Through the full pipeline

Run `PLAN-1` (`worker/scripts/benchmark.ts soclaas-qwen3.6-35b-prod --dataset chuyen --split all --ids
ptnk-2025-chuyen_4a,4b,4c`), cost **$0.065**:

| Part | Result |
|---|---|
| 4a | the planner's lesson, **0 model attempts, $0**. Graded "partial" only because a proof has no answer to grade and the figure remark "CD > AB: make the difference clearer" (the statement figure, not the proof) |
| 4b | no lesson: the SOCLAAS gateway timed out (the same failure the loop saw on 4 of 8 requests); not retried, to save cost |
| 4c | unverified after 2 attempts (277 s). **This run is contaminated**: it started before the soundness fix, so its prompt carried hints from the withdrawn 4c proof. With the fixed planner, 4c gets no hints and the pipeline behaves as the baseline (which failed it in three rounds), so it was not re-run |

Honest summary for PTNK 2025 Bài 4: the new pipeline gets **4a fully right** (the baseline never did), proves 4b's
similarity (but no complete 4b lesson was produced in this run), and does not solve 4c.

## 3. Held-out set (written for this check; never seen by the planner)

`tools/solver-eval/geometry-heldout.json`: 12 standard grade-9 proofs (orthic quadrilaterals, right-triangle altitude
relations, intersecting chords, tangent at the end of a diameter, the midline, equal altitudes of an isosceles
triangle, tangent–secant, the isogonal diameter, two tangents, feet of altitudes, a semicircle projection, a bisector
meeting the circle).

| | First run | After the soundness fix |
|---|---|---|
| VERIFIED (every claim proved and verified) | 5/12 | 6/12 |
| NEEDS_REVIEW (some claims) | 1 | 0 |
| UNSOLVED_WITHIN_BOUNDARY | 1 (h7 tangent–secant: no tangent–chord rule) | 1 (h7) |
| PARSING_UNCERTAIN | 5 (figure builder: h3, h4, h8, h11; h12's D built on the wrong line, so its claim was false on the figure and refused) | 5 |
| Claims proved / understood | 9/11 | 10/11 |
| Planner time | ≤ 18 ms per problem | ≤ 18 ms |

The h9 change ("OA² = OH·OM") comes from the soundness fix: the invalid division had corrupted an angle row, which
also blocked a valid inference. **No held-out problem was proved wrongly**: every failure was a refusal
(PARSING_UNCERTAIN or UNSOLVED), never a wrong VERIFIED. I checked each proof that looked surprising by hand. The
midline is proved by SAS similarity (AM/AB = AN/AC), and BH = CK by △BCH ∽ △CBK with ratio BC/CB = 1; both are
valid textbook arguments.

## 4. All dataset geometry problems (development set — not held out)

35 geometry items (`chuyen.jsonl` + `problems.jsonl`), sound build:

| Status | Count | Items |
|---|---|---|
| VERIFIED | 5 | g4, g8, g9, PTNK 2025 4a, Câu 4 (ch-4, 6/6 claims; too long to show as is) |
| NEEDS_REVIEW | 4 | PTNK 2024 4a (1/4), PTNK 2025 4b, HCM 2025 3a (1/2), kc-5 |
| UNSOLVED_WITHIN_BOUNDARY | 11 | 6 chuyên proofs (PTNK 2023 5b, 5c; 2024 4d; 2025 4c; HCM 3b; Hà Nội IV.1) + 5 computation-only problems (left to the solver) |
| PARSING_UNCERTAIN | 15 | figure not fully built: Hà Nội IV.2–3, KHTN III.1–3, kc-mcq3, kc-mcq9, g2, g7; no claim understood: PTNK 2023 5a, 5d, PTNK 2024 4b, 4c, kc-3, kc-mcq5 |

### Baseline vs planner on the proof items the planner understands

"Proof validity" for the baseline is an **upper bound**: the old checker only knew that no measured claim was false,
not that the inferences were valid. For the planner it means every step passed the independent verifier.

| Item | Baseline: lesson with no false claim | Planner: claims proved and verified |
|---|---|---|
| g4 | yes | 3/3 |
| g8 | yes | 1/1 |
| g9 | yes | 2/2 |
| Câu 4 (ch-4) | yes (one round) | 6/6 (long proof: handed to the model as verified facts) |
| PTNK 2025 4a | **no** | 2/2 |
| PTNK 2025 4b | **no** | 1/2 (one claim not understood) |
| PTNK 2025 4c | **no** | 0/2 |
| PTNK 2024 4a | no lesson (gateway) | 1/4 |
| HCM 2025 3a | **no** | 1/2 |
| PTNK 2023 5b, 5c; 2024 4d; HCM 3b; Hà Nội IV.1 | no (5b, 5c, 4d), yes (3b) | 0 |

## 5. Metrics

| Metric | Baseline (LLM only) | New pipeline |
|---|---|---|
| Proof validity of shown proofs | unknown; ≤ 14/24 lessons free of false claims | 100% of planner-served proofs pass the step verifier; model-written lessons as before |
| Hard chuyên claims correct (PTNK 2025 Bài 4, 5 claims) | 0/5 | 3/5 proved (4a ×2, 4b similarity) |
| Problems answered with no model call (dataset + held-out) | 0 | 4 dataset (g4, g8, g9, PTNK 2025 4a) + 6 held-out |
| Cost per planner-served problem | ≈ $0.03–0.06 | $0 |
| Latency per planner-served problem | 50–260 s | < 0.2 s (planner ≤ 120 ms + lesson checks) |
| Added latency for other geometry problems | — | ≤ 200 ms |
