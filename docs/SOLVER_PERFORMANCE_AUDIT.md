# Solver performance audit

Date: 2026-10-01. Branch `sprint/model-research`. Configuration audited: the local web setup
(`worker/.dev.vars`): OCR = PaddleOCR-VL-1.6 on a local llama.cpp server, solver = Nemotron-3-Super-120B-A12B
on the OpenRouter free tier (`SOLVER_PROVIDER=local` with a hosted URL). Gemini is disabled; no paid API.

All numbers below are measured unless marked *estimate*. Sources: worker logs
(`wrangler dev` output), the local D1 `solutions` table, benchmark runs in `tools/benchmark/results/`.

## 1. Architecture and request lifecycle

```
App (Expo web/native)
 │ 1. POST /v1/scans (photo or screenshot/PDF page)                  ── worker/src/routes/scans.ts
 │      → OCR provider (local PaddleOCR-VL, text mode + deterministic parser)   ~1–3 s/photo, ~20 s/exam page
 │ 2. student confirms / edits the text: POST /v1/scans/:id/confirm
 │ 3. POST /v1/scans/:id/questions/:q/solve                          ── worker/src/routes/solve.ts
 │      a. normalise text, problem hash, D1 lookups (own lesson, shared library)        < 50 ms
 │      b. take the per-question lock (D1 upsert)                                        < 20 ms
 │      c. solveProblem (worker/src/solver/pipeline.ts)
 │           attempt 1: ONE structured LLM call → whole lesson JSON (analysis, plan, hints, steps,
 │                      final answer, figure construction, machine-checkable answer checks)
 │           tidy + parse + deterministic verifier (shared/src/verify.ts)               < 50 ms
 │           attempt 2 (only for serious feedback): same model, with the verifier's exact problems
 │      d. store lesson + verification in D1                                             < 20 ms
 │ 4. App renders: hint-first lesson, steps, final answer, verification badge, interactive figure
 │      (figure resolved on the device from the construction — no LLM image generation)
```

There is no separate classification, strategy, hint, geometry, verification or formatting call:
one model call writes the whole lesson, and everything else is deterministic code. The pipeline was
already "single call + deterministic verification" before this sprint; the audit therefore focused on
what happens inside and around that call.

### Model calls per solve (before this sprint)

| Path | Calls |
|---|---|
| Lesson verifies on attempt 1 | 1 |
| Verifier finds a problem | 2 (attempt 2 gets the exact feedback) |
| Hosted output truncated (EXP-010 change) | +1 per attempt (retried at lower reasoning) |
| Hosted 429 (transient) | up to +2 per request, 4–20 s back-off each |
| Worst case | 2 attempts × (1 + 1 truncation retry) × up to 3 min each ≈ **12 min** |

## 2. Measured latency

### Real solves from the website (D1 `solutions`, worker logs, 2026-10-01)

| Problem | Attempts | Output tokens | Time |
|---|---:|---:|---:|
| 3(x − 2) ≤ 5x + 4 − 7x (first try, before fixes) | 2 | 18,198 | 126 s |
| same, after the LaTeX-check fix | 1 | 2,697 | 22 s |
| Câu 1, two quadratics with parameters (regenerate) | 1 (+1 truncation retry) | 19,307 | 232 s |
| Câu 2, quadrilateral with perpendicular diagonals | 2 | 14,256 | 207 s |
| Câu 3, f(n) divisibility | 2 (attempt 1 empty output) | 19,232 | 362 s |
| Câu 1 (an earlier regenerate) | 2 × empty output → **failed** | — | 360 s |

Mean of successful hosted solves: **166 s** (n = 6); local Qwen3.5-9B on this laptop: 1,817 s (n = 1).

### Benchmark (validation split, 11 problems, `experiments/baseline_results.json`)

| System | Median | P90 | Mean output tokens | Requests |
|---|---:|---:|---:|---:|
| Nemotron free, reasoning "low" (EXP-010) | 45.6 s | 113 s | 8,682 | 16 for 11 problems |
| Qwen3.5-9B local, battery (EXP-004b) | 484 s | 1,495 s | 6,609 | 21 |

### Stage costs

| Stage | Time | Source |
|---|---:|---|
| OCR (PaddleOCR-VL, local) | 1–3 s per photo, 19–23 s per dense exam page | OCR-EVAL runs |
| D1 reads/writes, hashing | < 50 ms | logs |
| Prompt construction | < 1 ms (two fixed strings per curriculum) | — |
| Parse + tidy | 0.2 ms median | 144 stored lessons |
| Deterministic verification | 0.6 ms median (no figure), 3.8 ms (figure), max 48 ms | 144 stored lessons |
| **Model call** | **15–250 s per attempt** | logs / benchmark |

## 3. Bottlenecks (in order)

1. **Hidden reasoning tokens.** Even at `reasoning.effort = "low"` the hosted model spends 3–15K tokens
   thinking before it writes the lesson (probe of ch-1: 4,951 of 7,971 completion tokens were reasoning).
   At the free tier's ~60–90 tokens/s that is most of the wait, and it is invisible to the student.
2. **Second attempts.** Half of the real exam solves needed a second full call. Causes found in the logs:
   - a verifier bug (a LaTeX `\le` check counted as "restating the answer") — fixed earlier;
   - `duplicate hint id` — the model reused an id; a deterministic renumbering is enough;
   - a malformed figure check (`equal_length` with two points) reported as a *false claim*
     ("AC = undefinedundefined"), which also marked a correct lesson unverified;
   - truncated / empty output (the reasoning used the whole budget).
3. **Unbounded retry time.** A retry was started regardless of how long the student had already waited
   or whether the lesson was already correct; with a 3-minute per-request cap the worst case was ≈ 12 min.
4. **Nothing visible while waiting.** The app showed fixed, timer-driven messages for 20 s – 6 min.
5. **Free-tier quota.** ≈ 50 requests/day; when exhausted, every solve failed after 3 back-off retries
   with a generic "service had a problem" message.
6. Not bottlenecks: OCR, D1, prompt building, verification, figure construction (all < 1 s together).
   Input prompt size (≈ 2.7K tokens without the figure rules, ≈ 4.3K with them) matters for local
   llama.cpp prefill but not for the hosted model.

## 4. Why solutions were sometimes too advanced

Evidence: deterministic grade-level scan of 120+ stored lessons (`scripts/grade-level-scan.ts`).

- The curriculum boundary was in the prompt (allowed and forbidden methods), but **nothing checked the
  output against it**. Nemotron solved the user's quadrilateral problem with coordinates and calculus
  ("tối đa hàm bậc hai… calculus (derivative)") where GPT-5.5 and the official solution use Pythagoras and
  (a − b)² ≥ 0; on ch-2 it offered "hoặc bằng đạo hàm" as an alternative.
- The prompt said which methods are allowed but not **which method to choose for each kind of problem**,
  so the model picked whatever it reasoned with (often a university-style route).
- Chuyên (gifted-school) problems legitimately use olympiad tools (congruences, Bunyakovsky); a blanket
  ban would make those lessons worse, so they need a softer rule than calculus or vectors.
- Verbosity: the local Qwen wrote > 6 steps or > 3-sentence explanations for 7 of 11 problems; hints
  sometimes gave the final answer in hint 1 (rubric in docs/GRADE_LEVEL_METHODOLOGY.md).

## 5. Changes (implemented — see FINAL_OPTIMIZATION_REPORT.md for results)

| # | Change | Targets |
|---|---|---|
| 1 | Adaptive reasoning: `problemTier()` (simple / standard / complex, from the text, no model call); hosted effort `minimal` for simple, `low` otherwise (env-configurable) | bottleneck 1 |
| 2 | Truncated *or empty* output → one retry one effort step lower (low → minimal → none) | 1, 2 |
| 3 | Deterministic repairs instead of retries: duplicate hint ids renumbered; malformed figure checks normalised or set aside as minor | 2 |
| 4 | Retry time budget: after 150 s a second attempt only for a wrong lesson, not for presentation feedback | 3 |
| 5 | Daily quota → `solve_quota_exhausted`, no back-off, clear message in the app | 5 |
| 6 | Streaming + live progress (thinking / writing k steps / checking / fixing) with an unverified *draft* of the problem type and plan | 4 |
| 7 | Grade-level checker: forbidden methods → retry feedback; advisory rubric for the benchmark | §4 |
| 8 | Per-topic method-selection policy in the curriculum; never mention advanced alternatives | §4 |
| 9 | Prompt: duplicate paragraph removed (solver-v2.0) | minor |

## 6. Risks and trade-offs

- **Lower reasoning can lower accuracy.** Reasoning off ("none") made ch-3 wrong in OPT-001; the adaptive
  policy only lowers reasoning for *simple* problems, and the verifier still gates every lesson. The
  benefit for simple problems is not yet measured on the benchmark (quota) — see the report.
- **Retry budget**: a lesson with a presentation problem (e.g. a missing figure point) found after 150 s
  is served as is (still honestly marked). Wrong answers are always retried.
- **Grade-level checker** is keyword-based: it catches named methods, not an unnamed advanced idea; a
  method the problem itself names is never flagged.
- **Streaming** shows an unverified draft (problem type, plan) during generation; it is labelled
  "Bản nháp — chưa kiểm tra" and replaced by the checked lesson.
- **Migration 0005** (`progress_json`) must be applied to production D1 before deploying; the save path
  does not depend on it, so a missing column only disables live progress.
