# Generalisation evaluation

**Summary: generalisation of the solver to unseen schools is not yet measured.** What was measured is the
generalisation of the deterministic components (the method-card retriever and the verifier) to problems
they were not built from.

## 1. Design

| Test | Data | Status |
|---|---|---|
| Unseen schools and region | test split: Hà Nội 2025 chuyên, KHTN 2025 vòng 2 (20 problems, 10 auto-gradable) | **not run** (hosted quota exhausted; local stopped at low battery) |
| Unseen year, same school | validation: PTNK 2026 vs train PTNK 2023–2025 | measured for 2 systems (CURRENT_SOLVER_EVALUATION.md): 3 PASS · 1 PARTIAL · 1 FAIL each |
| Same city, different board | validation: TP.HCM 2025 | 2 of 5 items measured locally |
| Rephrasings, misleading similarity, distractors, invalid premise, missing assumption, ambiguous diagram, multiple methods (retriever) | `data/generalization/retrieval_probes.jsonl`, 20 hand-written items not from any exam | **measured**: 20/20 behave as expected |
| Adversarial input (solver) | dataset v1: x1 ambiguous, x2 out of curriculum, x3 prompt injection | earlier runs: handled (EXP-004/010) |

## 2. Retriever probes (deterministic, `npx tsx worker/scripts/retrieval-probes.ts`)

| Kind | Result |
|---|---|
| rephrased familiar types | 11/11 |
| misleading surface similarity (an ordinary quadratic, a triangle-sides inequality, "ước chung lớn nhất") | 3/3 (no wrong card) |
| distracting information | 2/2 |
| invalid premise (x² + 1 = 0 "has two roots") | 1/1: the Vi-ét card fires and tells the model to check Δ first |
| missing assumption ("minimise a + b" without constraints) | 1/1 fires the extremum card. Whether the model then reports the problem as ambiguous is **not tested** |
| ambiguous diagram ("cho hình vẽ bên") | 1/1 (no card) |
| multiple valid methods | 1/1 |

**Caveat.** The probes were written by the same author who wrote the cue patterns, after the patterns
existed. 20/20 shows the cues are not brittle to simple rephrasing. It is not an independent estimate.
One probe hides a real limitation: the symmetric system x + y = 5, x² + y² = 13 gets no card, though the
sum–product technique applies. The probe expects nothing, so it "passes".

## 3. Memorisation risk

No fine-tuning was done, so there is no memorisation from training. The method cards name techniques, not
answers (a unit test guards against answer-like text such as "đáp số" or "= p/q" in a card). The verified-lesson library reuses an
answer only for the identical problem text, which is the intended behaviour, not generalisation.

## 4. Next

Run the test split with the served model, with and without the method cards (commands in
CURRENT_SOLVER_EVALUATION.md §5). Report per school, topic and level, with the sample-size caveat
(n = 20).
