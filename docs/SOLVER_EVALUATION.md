# Solver evaluation methodology

How solver accuracy, grade-level suitability and latency are measured. Results:
`experiments/baseline_results.json` (before), `experiments/optimization_results.json` (experiments and after).

## 1. Dataset

`tools/benchmark/dataset/problems.jsonl` (dataset v1, documented in DATASET.md): 40 problems with verified
ground truth (47/47 answers checked by `tools/benchmark/ground_truth.py`, not by an LLM).

| Split | n | Content | Use |
|---|---:|---|---|
| test | 15 | PTNK 2026 Toán (không chuyên), official exam: 10 multiple choice + 5 multi-part (algebra, Vi-ét, word problem, geometry proofs) | Held out. Final evaluation only. |
| validation | 11 | PTNK 2026 chuyên (5) + development problems: algebra, geometry calculation/proof, word problem, adversarial input | Experiments |
| train | 14 | Easy development problems, invalid / out-of-curriculum inputs | Prompt development, SFT export |

Coverage of the requested categories: basic algebra and identities (a1–a6, kc-mcq1/4), equations and
inequalities (a3, a7, kc-mcq7/8), systems (kc-2), quadratics and Vi-ét with parameters (ch-1, kc-2, kc-mcq2),
functions (kc-mcq6), word problems (w1, kc-4), geometry calculations (g1–g3, g5–g7, ch-2), geometry proofs and
circle theorems (g4, g8, g9, ch-4, kc-3, kc-5), number theory (ch-3), combinatorics (ch-5), multi-part
problems (ch-*, kc-1…5), common misconceptions (`common_mistakes` field: e.g. forgetting x ≠ 5, dropping a
root), invalid / ambiguous / out-of-curriculum / prompt-injection input (x1–x3).

Each item records: id, source (exam PDF, Drive id, SHA-256), topic, subtopic, difficulty 1–4, format, problem
text, reference answer, reference (school-level) solution, allowed methods, common mistakes, grading rules.

## 2. Procedure

```bash
cd worker
npx tsx scripts/benchmark.ts <system> --split validation --exp <EXP-ID>   # solve + grade (cached)
npx tsx scripts/benchmark.ts <system> --split validation --offline       # re-grade from the cache only
npx tsx scripts/build-results.ts ../experiments/<out>.json label=<EXP-file> …
```

- Every system uses the same prompt, schema, deterministic verifier and grader; only the model / settings
  differ. Systems: `or-nemotron-3-super` (hosted, reasoning low), `…-min`, `…-none`, local `qwen3.5-9b`,
  `stored-gemini` (re-grades stored lessons, no call).
- Every model response is cached (`tools/benchmark/cache`, keyed by model, settings and the exact
  messages); re-running costs nothing and `--offline` guarantees no call.
- The test split must be named explicitly and is logged as a TEST RUN.
- Each row stores the full lesson, the pipeline log (each attempt and the verifier feedback that caused a
  retry) and a sleep flag.

## 3. Metrics

| Metric | Definition |
|---|---|
| Final-answer accuracy | Correct final answers / gradable problems (proof-only problems have no single answer), graded against the reference answer with the item's `grading` rules — not by the model's own checks |
| Complete-solution accuracy | PASS / n |
| Grades | PASS: correct and verified. PARTIAL: correct but only partly checkable. FAIL: wrong, unverified or no lesson. **CRITICAL: wrong but shown as verified** (must stay 0) |
| Grade-level suitability | Rubric in docs/GRADE_LEVEL_METHODOLOGY.md §4 (deterministic): curriculum fit, familiar methods, concise, no hand-waving, progressive hints; "suitable" = fit and familiar |
| Latency | Model time per problem (all attempts and in-call retries), median and P90 over problems that finished; failed problems are listed separately, never counted as fast |
| Time to first token | Time until the first answer text arrives (streaming; measured from this sprint on) |
| Model calls | Pipeline attempts per problem, and total model requests from the cache (includes truncation and 429 retries) |
| Output length | Completion tokens (hidden reasoning + answer) as reported by the provider |
| Failure category | truncated_output, timeout, rate_limited, wrong_answer, unverified, not_checkable, partially_verified, none |

## 4. Validity rules

- **Measured vs estimated**: results files contain measured values only; anything not measured is null.
  Estimates (e.g. hosted throughput) appear only in the docs and are labelled.
- **Sleep**: this laptop sleeps when the lid is closed on battery; a request that spans a sleep has a
  meaningless wall time. Rows record `slept` (macOS `performance.now()` pauses during sleep while
  `Date.now()` does not) and such timings are excluded.
- **Power**: local inference runs throttled in Low Power Mode on battery (5–9 tok/s for any model size).
  Local latency is reported with that caveat; it is not a serving benchmark.
- **Free-tier quota**: the hosted model allows ≈ 50 requests/day; experiments are sized to fit and a run
  that hits the quota is stopped, not counted.
- **Prompt version**: comparisons state the prompt version; a change of prompt invalidates cached responses,
  so before/after runs at different versions are labelled as such.
- **Development data**: stored Gemini lessons were used to tune the prompt and verifier — reference only.
- **Held-out test**: evaluated once per final configuration; never used for tuning.

## 5. Production telemetry

The worker logs every attempt, its verification status, the feedback that caused a retry, token usage and
duration (`[solve <scan>/<q>] …`), and stores `attempts` and `duration_ms` per solution in D1. These real
solves are reported separately from the benchmark (they are the user's own problems, not a controlled set).
