# Geometry improvement loop

The loop, run on the development geometry problems (train + validation splits; the test split stays unseen):

1. **Figure ↔ solution text.** Every point the solution names is drawn, and every point it defines ("Gọi X là …",
   "X = AL ∩ GJ") sits where that definition puts it. If not: find the cause, fix it, remember it.
2. **Steps ↔ figure.** Claims a step makes that are false on the exact figure. If found: find what went wrong (the model's
   reasoning, our figure, or our checker), fix it, remember it.
3. **Grade level.** Methods outside the knowledge base; if found, a grade-level route or a rule to avoid it.

Tools: `worker/scripts/geometry-audit.ts` (the three checks, free — re-verifies existing lessons with the current
code), `worker/scripts/benchmark.ts soclaas-qwen3.6-35b-prod` (solving, paid; the run's cost is in its summary).
Memory: [shared/src/geometryLessons.ts](../shared/src/geometryLessons.ts) — general rules (never answers to a
specific problem), each with its evidence, given to the solver for every geometry problem.

Every flagged item is classified before anything is "remembered": a **model error** becomes a rule; an error in **our
figure** or **our checker** becomes a code fix with a test. Model errors are confirmed independently when possible.

Budget: ≤ $3 for the whole loop (user: "don't waste the API cost"). Re-audits of existing lessons cost nothing; only
prompt/rule changes justify re-solving, and only the items that failed.

## Round 0 — audit of existing lessons (free)

23 geometry lessons (PTNK 2025 Bài 4 by qwen3.6, Câu 4 runs, stored lessons): 15 clean, 8 flagged.

| Finding | Classification | Action |
|---|---|---|
| "ID² = IJ" false (3.58 vs 1.11) — from a restated problem writing "IJ \text{.} IA" | **our checker** split the sentence at the product dot | dot between point names is a product; the problem's claims are read from the confirmed text |
| PTNK 4b flagged "calculus" — from `\frac{DE}{DF}` | **our checker**: case-insensitive `\frac{d…}{d…}` matched point D | derivative pattern made case-sensitive; labels de-duplicated |
| Câu 4 step 7–8: M = midpoint of JI, then M = AL ∩ GJ | model error | rule `one-name-one-point` |
| Câu 4 step 4: "tính chất quen thuộc: JD ∥ BC" (false) | model error | rule `no-unproved-well-known` |
| Câu 4: "∠IJA = 90° ⇒ A, J, H, I concyclic" with J on AI | model error | rule `collinear-not-concyclic` |
| Câu 4: L and G swapped | model error | rule `use-given-definitions` |
| PTNK 4c: "SD ⊥ ID" (SD tangent at D to (O)) | model error | rule `tangent-radius` |
| PTNK 4a "∠EDF = ∠ODE", 4b "∠EDF = ∠EDB" | model error — false in 200/200 independent random configurations | rule `angle-equalities-need-a-source` |
| 3 stored lessons without a figure (Câu 2 quadrilateral, two others) | statement builder has no base for them | open |
| Stored lesson "Giải phương trình x² − 7x + 10 = 0" labelled geometry → "needs a figure" retry | **our verifier** trusted the model's topic label (a paid retry for nothing) | a figure is required only when the problem text describes geometry; geometry cues + "đoạn thẳng", "đường thẳng", "cắt nhau" |
| Câu 2 (convex quadrilateral, BC = 7, DA = 1, perpendicular diagonals) had no figure | **our builder** had no base for it | base "tứ giác … hai đường chéo vuông góc" with given sides exact; statement figures 17/20 complete (was 16) |

## Round 0b — audit of all 61 earlier geometry lessons (free; Gemini, Nemotron, Qwen runs)

| Finding | Classification | Action |
|---|---|---|
| ch-2 (max perimeter): "AB = CD = 5" false on the figure, in every model's lesson | **our checker**: claims about the optimal configuration measured on an arbitrary admissible figure | max/min problems: step claims are not measured on the figure; a figure is "exact" only when the givens fix the shape (adoption takes the statement's verdict) |
| hcm 2b: "GH = EF" false, EF = 0 | model error: E and F both "midpoint of AB" | verifier flags two named points drawn at the same place (retry); rule `distinct-points-distinct-constructions` |
| g8: "△AHE ∽ △ABC", "△ADH ∽ △ABH" | model error: similar, but vertices not in corresponding order | rule `similarity-vertex-order` |
| ch-2 (Nemotron): "(… Cauchy hoặc bằng đạo hàm)" | model error (grade level) | rule `no-out-of-curriculum-alternative` |

Audit after the fixes: 40/61 clean (was 35); false-claim steps 59 (was 68) — every removed flag was a false alarm of ours.
Round 1 (24 dev problems, qwen3.6) did not run: the SOCLAAS gateway was congested (< 8 tokens/s; a 1,500-token request
got no answer in 200 s). Spent $0.015. Added a streaming watchdog so a congested provider is abandoned after 45 s.

## Round 1 — 24 development problems solved by qwen3.6 (GEO-R1b, $0.55)

Results: 13 lessons, 11 failed to produce one (truncated at 12K/24K tokens — the benchmark had not used the SOCLAAS
settings — or the gateway slowed). Audit of the 15 lessons: 7 clean (incl. Câu 4 and g1–g6).

| Finding | Classification | Action |
|---|---|---|
| Truncation on ordinary problems (g3, g5, g6, g9) — paid and wasted | **ours**: the benchmark used the free model's limits; 12K is too small for this model | `soclaasModelOptions` shared by the route and the benchmark (16K/24K/40K, 230 s) |
| "hint_1 points to unknown step hint_2" (g2, g4, 4b, 4c) → a paid retry | **ours**: a structural slip treated as a failure | hints with unknown steps are matched to the steps in order |
| 2023 5d: "KJ" used but K, J undefined (the model said so) | **our dataset**: 5d omitted the definitions from 5c | 5d text now includes them (source + dataset) |
| Points the solution introduces not drawn (10) | **our parser** | "AH là đường cao của △ABC", "Kẻ EH ⊥ BC", "giao điểm của đường phân giác góc BAD với cạnh BD": 10 → 3 |
| hcm 3b: "∠QAB = ∠ACB", "QB·DC = QC·DB" false | **our parser**: Q (tangent at A ∩ BC) was the model's AO ∩ BC | "tiếp tuyến tại A của (O) cắt BC tại Q" — with the right Q every claim of the lesson is true |
| hcm 3b: "Đặt gốc vectơ tại A" | model error (grade) | rule `synthetic-not-vectors` |
| 2024 4b: "Vì △ABD cân tại A" (not given) → false right angles | model error | rule `no-unstated-special-case` |
| 2025 4c: "I, O, D, S concyclic" (S on the tangent at D to (O)) | model error, covered by `tangent-radius` | — |

## Rounds 2–3 — cost and retries ($0.02 + $0.11, plus ≈ $0.07 of diagnostic requests)

Round 2 was lost to the gateway ("fetch failed", stalls); g8 became clean. Round 3 tested hidden thinking:

| Finding | Classification | Action |
|---|---|---|
| g9 (4-step tangent proof): 13.5K output tokens, 10K of them hidden reasoning, truncated at 24K in the pipeline | cost: "reasoning_effort: low" barely limits qwen3.6 | thinking off (`enable_thinking: false`) for plain computations: g1–g6 still verified at ~¼ of the tokens (g3 21.8K → 5.3K, g5 21.9K → 5.5K, g6 17.6K → 5.0K) |
| ch-2 without thinking: perimeter 16 instead of 18 | thinking matters for arguments | thinking stays on for extremum / proof / inequality / "tìm tất cả" problems and the complex tier |
| "(B, C là các tiếp điểm)" read as a circle (B) → "missing circle" retry | **our parser** | circle names only "(O)", "(O; R)", "(O, R)" |
| Second attempts caused by the model's own figure checks: swapped givens (g1 "∠ABC = 65°" for Â = 65°; g5 "∠ABC = 90°" for "vuông tại A"), "equal_length A, D, 4", "perpendicular B, M, A", a cyclic definition (g6) | **ours**: repairable slips rejected the correct statement figure / the model figure | checks normalised before the structure check; an exact statement figure wins over a contradicting model "given" (dropped, no retry); replayed offline: g1, g5, g6 now verified at the first attempt |
| A verified answer with only minor drawing remarks still retried | cost policy | no retry when the answer is verified, a figure remains, and only minor drawing remarks are left |
