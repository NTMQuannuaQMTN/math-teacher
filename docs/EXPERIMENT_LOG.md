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
