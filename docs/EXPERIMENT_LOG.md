# Experiment log — solver speed and grade-level sprint (OPT series)

Earlier experiments (EXP-000…010: dataset, Qwen local, hosted Nemotron, OCR) are in the root
`EXPERIMENT_LOG.md`. Machine-readable results: `experiments/baseline_results.json`,
`experiments/optimization_results.json`. Method: docs/SOLVER_EVALUATION.md.

Constraints for every experiment: Gemini disabled; no paid API; hosted model = OpenRouter free tier
(≈ 50 requests/day — exhausted at 10:40 UTC on 2026-10-01); local model = Qwen3.5-9B Q4_K_M on an
Apple M5 laptop on battery in Low Power Mode (5–9 tok/s), which also sleeps when the lid is closed.

---

## OPT-000 — Baseline

- **Configuration:** Nemotron-3-Super-120B-A12B (free), reasoning `low`, 12K output cap, prompt solver-v1.8,
  2 attempts, retry policy "serious".
- **Dataset:** validation, 11 problems (EXP-010); real solves from the website (D1, worker log).
- **Accuracy:** 5 PASS · 3 PARTIAL · 3 FAIL · 0 CRITICAL; final answers 7/9 (the 2 others truncated).
- **Grade level:** 7/9 suitable (ch-2 mentions derivatives; ch-3 uses congruence notation).
- **Latency:** median 45.6 s, P90 113 s (benchmark); real exam solves mean **166 s**, max 362 s, one failure
  after 360 s.
- **Output:** 8,682 tokens mean (most of it hidden reasoning). Requests: 16 for 11 problems.
- **Time to first token:** not measurable (no streaming).

## OPT-001 — Reasoning off (`effort: none`)

- **Hypothesis:** hidden reasoning is most of the latency, so turning it off cuts latency without hurting accuracy.
- **Change:** benchmark system `or-nemotron-3-super-none`; prompt solver-v1.9.
- **Result (3 of 11, stopped by the daily quota; from the console log):**

  | id | none | low (OPT-000) |
  |---|---|---|
  | ch-1 | PARTIAL, correct, 46 s, 2,921 tokens | PARTIAL, correct, 45.6 s, 4,507 tokens |
  | ch-2 | PARTIAL, correct, 2 attempts, 55 s, 6,750 tokens | PASS, 2 attempts, 249 s, 19,109 tokens |
  | ch-3 | **FAIL, wrong answer**, 13.5 s, 813 tokens | PASS, verified, 76 s, 11,176 tokens |
  | a3 (probe) | first attempt 16 s, 1,560 tokens | 44.5 s, 4,185 tokens |

- **Conclusion:** much faster, but a hard number-theory problem became wrong. **Rejected as a global
  setting.** Led to the adaptive policy (less reasoning only for simple problems).
- **Limitations:** n = 3 + 1 probe.

## OPT-002 — Lower effort after a truncated answer

- **Hypothesis:** when the reasoning uses the whole output budget, a retry with less reasoning still finishes.
- **Result:** g5 verified in 1 attempt (54 s) at `minimal`; ch-4 still truncated (12,000 reasoning tokens) at `minimal`.
- **Change kept:** truncated *or empty* output → one retry one step lower (low → minimal → none). The
  `none` step for ch-4 is not measured yet.

## OPT-003 — Deterministic repairs instead of retries (replay)

- **Hypothesis:** several second attempts are caused by verifier strictness, not wrong mathematics.
- **Method:** the current pipeline with a scripted model that replays the recorded EXP-010 outputs
  (recovered offline from the response cache, `scripts/replay-attempts.ts`), plus the worker log of the
  user's real solves.
- **Result (benchmark outputs):** 11 → 12 calls on 9 problems. ch-2 and g8 are still retried (g8's
  similarity claim is false, so that retry is justified). w1 gets a **new** retry because its hints and
  steps are Vietnamese without diacritics: a deliberate quality-for-latency trade.
- **Result (real solves, from logs):** of 4 two-attempt solves, 2 were caused by problems now repaired
  without a model call: a duplicate hint id, and a malformed figure check reported as a false claim (which
  also wrongly marked the lesson unverified). One more was an empty output, now retried inside the call at
  lower effort instead of starting a full second attempt.
- **Limitations:** the replay is instant, so the 150 s retry budget isn't exercised.

## OPT-004 — Streaming and live progress

- **Hypothesis:** streaming lets the student see useful content long before the lesson is complete.
- **Method:** `scripts/stream-check.ts`: the real pipeline against the local llama.cpp server (the hosted
  quota was exhausted), problem "Giải phương trình x² − 5x + 6 = 0".
- **Result:** first answer token at 17.6 s; problem type at 24.7 s; plan draft ("Mình sẽ thử phân tích vế
  trái thành nhân tử…") at 47.5 s; steps 1/2/3 at 131/146/162 s; checking at 184 s; correct answer
  (2 and 3). Useful content at 13–26 % of the total time, instead of a spinner. The retry budget applied:
  184 s spent with only presentation feedback, so no second attempt.
- **Found:** an English snake_case problem type in the draft (now hidden for Vietnamese problems), and a
  verifier false negative: a correct pre-substituted check ("2² − 5·2 + 6 = 0") was rejected as a
  restatement. Fixed and tested.

## OPT-005 — Exhausted daily quota

- **Before:** 3 requests with 4–20 s back-off, then a generic retryable "service had a problem".
- **After (live worker):** fails in < 1 s with `solve_quota_exhausted`, not retryable, and a message giving
  the reset time ("Lượt giải miễn phí hôm nay đã hết…").

## OPT-008 — Local before/after on the same problems

- **Configuration:** Qwen3.5-9B local, prompt v2.0 with the new verifier and retry policy; compared with
  EXP-008 (prompt v1.8, same laptop, same items). No sleep during the run.
- **Result:** a3 PARTIAL (264 s vs 246 s); a7 FAIL → PASS (214 s vs 525 s, 1 attempt vs 2); g5 PASS
  (289 s vs 764 s, 1 attempt vs 2). Total 3 calls / 766 s / 6,493 tokens vs 5 / 1,534 s / 10,340.
- **Found:** two answer-check formats the model uses but the verifier couldn't evaluate (a computation
  labelled `substitute`; "10, 4.8" as a list). Both are now salvaged and tested. The regrade turned a7
  PASS, and EXP-010 and EXP-004b each gained one PASS, with no CRITICAL.
- **Trade-off seen:** g5's second attempt (to fix the figure) was skipped by the 150 s budget.

## OPT-009 — Lesson size per tier (prompt v2.1), local

- **Hypothesis:** asking simple problems for 2–4 steps and 2–3 hints shortens the lesson and the output.
- **Result (a3, a7; Qwen3.5-9B local, no sleep):** steps 7 → **4** (a3) and 6 → **4** (a7). Output tokens
  unchanged (a7: 1,907 vs 1,896). a3 needed a second attempt (583 s): the model wrote 5 hints for 4 steps,
  and an extra hint pointing past the last step was a structural error.
- **Change:** an extra hint pointing past the last step is attached to the last step (deterministic; a
  low-numbered hint with a bad reference is still reported). Regrade: OPT-009 → 2/2 PASS.
- **Conclusion:** v2.1 makes simple lessons pass the conciseness rubric (a3 had 7 steps under v2.0). It
  does not reduce the local model's output; its effect on the hosted model's reasoning is unmeasured.

## OPT-010 — No-regression check on harder types, local

- **Configuration:** Qwen3.5-9B local, prompt v2.1 + current verifier, vs EXP-004b (prompt v1.7) on the
  same laptop. No sleep.
- **Result:** w1 (word problem) FAIL with a wrong answer → **PASS**, 1 attempt, 293 s vs 484 s; x3
  (adversarial input) PARTIAL → **PASS**; g8 (geometry proof) PARTIAL → **PASS**, but slower (1,100 s vs
  946 s, 2 attempts both times). Total 3/3 PASS vs 0/3; 5 calls vs 6; 13,240 output tokens vs 17,434.
- **Notes:** g8's first attempt pointed every hint at a step called "Now", so the retry was justified.
  w1's malformed figure check was set aside without a retry.

## OPT-006 / OPT-007 — Pending (need hosted quota)

The final configuration on validation, the simple tier at `minimal`, and the held-out test split.
Commands and request budgets are in `experiments/optimization_results.json`. Each needs about one day of
free quota.

---

# Toán chuyên sprint (2026-10-01, evening)

Dataset chuyen-v1 (docs/EXAM_RESEARCH.md, DATASET_SCHEMA.md). Hosted quota exhausted; local Qwen3.5-9B on
battery, Low Power Mode, with the Mac sleeping intermittently.

## CHB-001: Current solver on TP.HCM 2025 chuyên (validation), local, no method cards. Stopped.

- hcm-2025-chuyen_1a: PASS, 2 attempts, 652 s, 5,178 output tokens.
- hcm-2025-chuyen_1b: PARTIAL (correct, unverified), 2 attempts, 538 s.
- hcm-2025-chuyen_2a: stopped after > 7,500 output tokens (runaway); 2b, 5a not run.
- Stopped at 24% battery so the documentation could be finished; source: console log.

## CHB-002 (train items) and CHB-003 (method cards on the same validation items): not run

Battery. Commands: `--dataset chuyen --ids … [--techniques]`.

## RET-001: Method-card retriever on 20 hand-written probes

20/20 as expected (rephrasings 11/11, misleading similarity 3/3, distractors 2/2, premise, missing
assumption, diagram, multiple methods 1/1 each). Author-biased (docs/GENERALIZATION_EVALUATION.md).
On the 67 chuyên items: 57 get at least one card, 10 none.

## SFT-001: Teaching records → lesson-format SFT examples

22/22 valid against the production lesson schema and structure checks after fixing one mapping bug in
the exporter (topic enum). No training run (docs/FINE_TUNING_REPORT.md).

## VER-001: Independent verification of exam answers

43/43 checks pass (`tools/exams/verify_exams.py`): exact, exhaustive (2¹⁶ colourings; 1,034,817 boxes),
bounded, sampled. Four errors found in official or teacher keys; none changes an answer
(docs/SOLUTION_VERIFICATION.md).

---

# Curriculum-aware sprint (2026-10-02)

## DOM-001: `problemDomains` vs the chuyên-v1 topic labels (deterministic)

The labelled domain is detected for 63/67 items (word problem, optimisation → algebra; probability, statistics →
combinatorics). Misses, all in the test split and **not** tuned for: hanoi-2025 I.1 (statistics chart), V.1 and V.2
(acquaintance counting), khtn-2025 IV (rational/irrational set). 17/67 items get an extra non-algebra domain,
which only adds topic lines to the prompt.

## FIG-001: Figure coverage on stored lessons (deterministic, `worker/scripts/figure-coverage.ts`)

13 stored lessons with a figure (local D1, 2026-09-29 → 10-02), as stored vs after the current verifier:
segments drawn 43/43 → 43/43; mentioned angles with an arc 16/20 → 20/20; named points/circles missing 0 → 0;
steps whose highlight covers everything they name 17/33 → 33/33. Highlight size after: median 3, p90 6, max 9
targets per step. Caveat: "mentioned" and "synced" use the same pattern detector the repair uses, so the
"after" numbers show the repair works as designed, not that a human would judge the figure complete.

## EXP-011: Hosted Nemotron 3 Super, solver-v2.7, chuyên-v1 validation (10 items). Quota-limited.

Only 3/10 items ran before the free daily quota ran out (the other 7 errored at once with
`quota_exhausted`; they say nothing about quality). The summary file's "answerAccuracy 0.2" counts the errors;
on the items that ran: **2/3 PASS (verified)**, 1 FAIL.

| Item | Result | Attempts | Model time | Output tokens |
|---|---|---|---|---|
| hcm-2025-chuyen_1a | PASS, verified | 1 | 62.5 s | 6,133 |
| hcm-2025-chuyen_1b | PASS, verified | 2 | 161.9 s | 20,549 |
| hcm-2025-chuyen_2a | FAIL (said "vô nghiệm"; answer 14 giờ 45 phút), not_checkable | 2 | 73.7 s | 12,620 |

- New schema fields: all 3 lessons declared valid technique ids (e.g. `substitution, factorization,
  complete_square, domain_conditions`) and step dependencies that point only to earlier steps.
- 2a: distances written without |…| (the truck has passed the junction by 15:00) → "a = 0, contradiction".
  Follow-up (found on validation, general rule): a question that asks for one value but gets "no solution / does
  not exist" is now a failed check with retry feedback. False-positive check: 0/15 presupposing dataset questions
  have such a ground truth; 0/53 stored lessons flagged. The rest of the split runs after the quota resets
  (08:00 local): `npx tsx scripts/benchmark.ts or-nemotron-3-super --dataset chuyen --split validation --exp EXP-011b`.

## USR-002: Fixes from the user's first app test of solver-v2.7 (2026-10-04)

Reports ("Báo lỗi"): `\[2pt]` in a formula (Câu 2), a literal `\n` with prose in a formula (Câu 3), Câu 4 shown as
beyond Grade 9, a miscounted `e` in the magic-square derivation (Câu 5, step 8).
- KaTeX audit (`worker/scripts/latex-audit.ts`, 53 stored lessons, 1,816 formulas): 4 fail as stored (all from this
  test); 0 after the server's tidy; 0 as the app now renders stored lessons.
- Câu 4: attempt 1 truncated (27K reasoning tokens), attempt 2 answered "unsupported"; no attempt was left, so the
  give-up was stored. Now a give-up on an in-curriculum problem scores below any lesson and is never stored
  (`solve_incomplete`, retryable; a previous lesson is kept).
- Derivation check (`shared/src/derivations.ts`) over 699 steps (stored lessons + benchmark results): flags the 2
  slips of Câu 5 step 8 and nothing else.

## PTNK25-1: PTNK 2025 Toán chuyên, production settings (2026-10-04). Quota-limited; development set.

6/13 sub-questions ran (1a–3a); the rest hit the daily quota. Hand-graded (docs/PTNK_2025_EVALUATION.md):
answers 6/6 correct, fully successful 1/6. Issues: invalid monotonicity step (1c), vectors wording (1b), foreign
words (1c, 2b, 3a), an overclaimed "verified" (1a), and a false positive of our derivation check (2b). These items are
in the train split and were seen in development (teaching records for 1a–3b).
- GEM-002 (same day): the first fallback run truncated at Gemini's 40K output cap (thinking counts) after 187 s →
  cap raised to the model maximum 65,536. "low" thinking measured on Câu 4: 20 s but unverified (hand-waved step);
  with one corrective retry, 29 s and no usable figure → kept "medium". The free model now hands off after 120 s on
  complex problems when the fallback is on, leaving Gemini ~5 min within the 420 s solve limit.

## PTNK25-S2: SOCLAAS models on PTNK 2025, app settings, streaming (2026-10-07). Development set.

| | qwen3.6:35b ("default") | qwen3.8:27b |
|---|---|---|
| Lessons produced | 13/13 | 9/13 (4a–4c timed out, 5b truncated) |
| Computed answers (2b, 3b) | both correct, verified | both correct (2b partial) |
| Verified / partial-or-not-checkable / unverified | 3 / 8 / 2 | 3 / 6 / 0 (+4 no lesson) |
| Geometry (Bài 4) | lessons, but no usable figure; 4b keeps calculus wording | none |
| Output tokens (13 items) | ≈ 214K (≈ $0.37 total at $1.52/M) | — |

The first pass (PTNK25-S) exposed two bugs, fixed before S2: qwen3.8 rejects reasoning_effort "minimal"
(gateway floor is "low"), and an answer check written as "a == b and c == d" crashed verifyLesson. qwen3.6 1c is a
valid elementary proof (Nemotron's 1c had an invalid step). Chosen as the solver: SOLVER_PROVIDER=soclaas.
