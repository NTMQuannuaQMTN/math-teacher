# Final optimization report — solver speed and Grade 9 methodology

Date: 2026-10-01 · Branch `sprint/model-research` · Gemini disabled · no paid API calls (0 paid requests).
Companion documents: SOLVER_PERFORMANCE_AUDIT.md (bottlenecks), SOLVER_EVALUATION.md (method),
GRADE_LEVEL_METHODOLOGY.md (policy and rubric), EXPERIMENT_LOG.md (OPT series),
`experiments/baseline_results.json`, `experiments/optimization_results.json`.

**Status of the evidence.** The hosted model's free daily quota ran out at 10:40 UTC, early in the sprint.
Everything below that says *measured* was measured. The full before/after benchmark of the final
configuration on the hosted model (OPT-006) and the held-out test split (OPT-007) **have not been run**.
Their commands are in §15. No improvement in hosted latency or accuracy is claimed without them.

## 1. Original latency and bottlenecks

- Real solves of the user's exam problems: **mean 166 s, max 362 s** (n = 6), plus one failure after
  360 s. Benchmark (validation, 11 problems): median 45.6 s, P90 113 s.
- Non-model stages (D1, hashing, parsing, verification, figure construction) take < 1 s together. The
  verifier needs 0.6 ms median, 48 ms at most (144 lessons).
- **Bottleneck 1: hidden reasoning.** 3–15K reasoning tokens per attempt even at effort "low", at
  ~60–90 tok/s, all invisible to the student.
- **Bottleneck 2: second attempts.** 3 of 6 real solves needed two. Causes: verifier strictness (LaTeX
  checks, duplicate hint ids, malformed figure checks reported as false claims) and truncated or empty
  output.
- **Bottleneck 3: no time bound on retries.** Worst case ≈ 12 min. **4:** nothing visible while
  waiting. **5:** the exhausted free quota surfaced as a generic error after 3 back-off retries.

## 2. Why answers were sometimes too advanced

The curriculum boundary was in the prompt, but nothing checked the output against it, and the prompt
didn't say which method to choose per problem type. Seen on the user's own problem: coordinates plus
calculus for a maximum that Grade 9 solves with Pythagoras and (a − b)² ≥ 0. Seen on ch-2: "hoặc bằng
đạo hàm" ("or by derivatives"). Chuyên problems legitimately use olympiad tools, so a blanket ban would
be wrong.

## 3. Changes implemented

| Area | Change | Files |
|---|---|---|
| Speed | Adaptive reasoning: `problemTier()` classifies simple / standard / complex from the text with no model call. Hosted effort is `minimal` for simple problems and `low` otherwise (`LOCAL_SIMPLE_REASONING_EFFORT`, `LOCAL_REASONING_EFFORT`). | `solver/routing.ts`, `routes/solve.ts` |
| Speed / reliability | A truncated or empty answer gets one retry one effort step lower (low → minimal → none) | `solver/localModel.ts` |
| Speed | Retry budget: after 150 s, a second attempt only for a *wrong* lesson | `solver/pipeline.ts` |
| Speed | Deterministic repairs instead of retries: duplicate hint ids, malformed figure checks, pre-substituted answer checks | `shared/src/verify.ts` |
| Perceived speed | Streaming (SSE) and live progress: thinking → writing (k steps) → checking → fixing, with a dashed **"Bản nháp — chưa kiểm tra"** card showing the problem type and plan | `localModel.ts`, `pipeline.ts`, `routes/solve.ts`, migration `0005`, `mobile/src/app/solve/[id].tsx` |
| Caching | A student's own lesson for the same text is kept across prompt versions (no re-solve after a deploy); a failed Regenerate keeps the previous lesson | `routes/solve.ts` |
| Reliability | Daily quota → `solve_quota_exhausted` (fails in < 1 s, clear message, not retryable); optional failover model (`SOLVER_FAILOVER_URL/MODEL`) | `localModel.ts`, `failover.ts`, `contract.ts`, `strings.ts` |
| Grade level | Deterministic Grade 9 checker. Forbidden methods → retry feedback; grey-zone methods and style → rubric only. | `shared/src/gradeLevel.ts` |
| Grade level | Method-selection policy per problem type in the curriculum and prompt; never mention an advanced alternative | `solver/curriculum.ts`, `prompts.ts` |
| Language | Vietnamese hygiene: Chinese/English/Portuguese insertions replaced; undiacritized body text → retry; undiacritized list items and no-op notes dropped | `shared/src/language.ts` |
| Format | "Dạng bài" (problem type) row; the existing sections map onto Nhận dạng / Hướng giải / Lời giải / Kết luận / Kiểm tra | `LessonParts.tsx` |
| Prompt | solver-v2.0: method policy added, duplicated paragraph removed. solver-v2.1: per-tier lesson size in the user message (simple: 2–4 steps and 2–3 hints; complex: one check per part) | `prompts.ts` |
| Output length | The size target per tier cuts unnecessary output on simple problems (fewer tokens means less waiting) | `prompts.ts`, `pipeline.ts` |
| Tooling | Effort variants, per-row attempt log and sleep detection in the benchmark; `build-results`, `replay-attempts`, `grade-level-scan`, `stream-check`, `probe-hosted` | `worker/scripts/` |

## 4. Configurations tested

| ID | Configuration | Status |
|---|---|---|
| OPT-000 | Nemotron free, effort low, prompt v1.8 (baseline, EXP-010) | measured, validation 11/11 |
| OPT-001 | effort none, prompt v1.9 | measured on 3/11 + 1 probe (quota) |
| OPT-002 | step-down after truncation (minimal) | measured on 2 problems |
| OPT-003 | current verifier and retry policy replayed on recorded outputs | measured (offline, 9 problems) + log analysis of the real solves |
| OPT-004 | streaming and progress, end to end (local llama.cpp) | measured, 1 problem |
| OPT-005 | quota fail-fast | measured (live worker) |
| OPT-008 | local Qwen3.5-9B, prompt v2.0 + new verifier vs v1.8 (EXP-008) | see §5 |
| OPT-006/007 | final config on validation / held-out test (hosted) | **not run** (quota) |

## 5. Before / after latency (measured)

| What | Before | After |
|---|---|---|
| Reasoning off (OPT-001), per problem | ch-1 45.6 s · ch-2 249 s · ch-3 76 s | ch-1 46 s · ch-2 55 s · ch-3 13.5 s, **but ch-3 wrong** → rejected as global; used only for the simple tier |
| Truncated hard problem (OPT-002, g5) | 2 × truncated, no lesson | verified in 54 s |
| Exhausted quota (OPT-005) | 3 requests + back-off, generic error | < 1 s, explicit message |
| Reopening a solved problem after a deploy | full re-solve (20 s – 6 min, uses quota) | < 1 s, no model call (measured on the live worker) |
| First useful content on screen (OPT-004, local) | only at the end (184 s) | problem type at 24.7 s, plan at 47.5 s, step count live |
| Real-solve second attempts with a deterministic fix (OPT-003) | 2 of 4 | 0 of those 2 (repaired without a model call) |
| Final hosted configuration, validation (OPT-006) | median 45.6 s / P90 113 s | **not measured** |

OPT-008, measured on the same laptop with the same model (Qwen3.5-9B local), the same three problems and no
sleep. Before is prompt v1.8 with the old verifier (EXP-008); after is prompt v2.0 with the new verifier:

| Problem | Before | After |
|---|---|---|
| a3 (simplify) | PARTIAL, 1 attempt, 246 s, 2,237 tokens | PARTIAL, 1 attempt, 264 s, 2,350 tokens |
| a7 (Vi-ét parameter) | **FAIL**, 2 attempts, 525 s, 3,709 tokens | **PASS** (after the check salvage), 1 attempt, 214 s, 1,896 tokens |
| g5 (right triangle) | PASS, 2 attempts, 764 s, 4,394 tokens | PASS, 1 attempt, 289 s, 2,247 tokens |
| **Total** | 5 calls, 1,534 s, 10,340 tokens | **3 calls, 766 s (−50 %), 6,493 tokens (−37 %)** |

n = 3, single samples (sampling noise). g5's second attempt was skipped by the 150 s budget, so its
lesson was served without the figure (the figure contradicted a given angle; the answer was verified).
On the hosted model attempts take 15–90 s, so the budget rarely applies there.

OPT-009 (prompt v2.1, the per-tier size target): a3 and a7 lessons shrank from 7 and 6 steps to 4 and 4,
with output tokens unchanged on the local model. An extra hint pointing past the last step is now
repaired deterministically (it had caused a3's retry).

Verifier-only regrade of the stored lessons (same model output, current verifier): EXP-010 hosted
5 → **6 PASS**; EXP-004b local 6 → **7 PASS**; OPT-008 1 → **2 PASS**; CRITICAL stays 0 everywhere.

## 6. Before / after accuracy

- Baseline (OPT-000): 5 PASS · 3 PARTIAL · 3 FAIL · **0 CRITICAL**; final answers 7/9.
- The final configuration's accuracy on the hosted model is **not measured** (OPT-006).
- Accuracy safeguards that are measured: the replay (OPT-003) changes no correct/incorrect outcome; every
  new rule only adds checks or repairs a format; CRITICAL stays 0 in every run; the regression suite
  passes (§13).

## 7. Grade-level suitability

Deterministic rubric (GRADE_LEVEL_METHODOLOGY.md §4) on the baseline lessons (validation):

| System | Suitable | Curriculum fit | Concise | No hand-waving | Hints progressive |
|---|---|---|---|---|---|
| Nemotron free (OPT-000) | 7/9 | 8/9 | 9/9 | 9/9 | 9/9 |
| Qwen3.5-9B local | 9/11 | 11/11 | 4/11 | 10/11 | 8/11 |
| Gemini (stored, development data) | 9/10 | 10/10 | 5/10 | 9/10 | 6/10 |

Across all 120+ stored lessons the checker found 3 real forbidden-method uses: Nemotron with calculus
and coordinates on the user's quadrilateral problem, and Nemotron mentioning derivatives on ch-2. The one
false positive (a magic square typeset with `\begin{matrix}`) was fixed. Each of these is now sent back
for a Grade 9 solution.

Manual review of five Nemotron lessons against the reference solutions (by Claude, not a teacher):
- **ch-1, w1:** the methods are exactly the textbook route (discriminant, Vi-ét; set up an equation, Δ,
  reject the negative root).
- **a3:** standard t = √x substitution.
- **g8:** AA similarity. Grade 9, but the right-triangle relation is the more direct textbook route; the
  wrong correspondence it wrote was caught by the verifier.
- **ch-3:** congruences and the Chinese remainder theorem, where the reference uses plain divisibility.
  Advisory.
- **Main weakness: Vietnamese language quality** (mixed Chinese/English/Portuguese words, missing
  diacritics), not methodology.

## 8. Model calls

- Before: 1 call per attempt; up to 2 attempts; plus up to 2 in-call retries per request for 429s and 1
  for truncation.
- After: still 1 call per attempt and at most 2 attempts.
  - The second attempt is **only** for serious feedback, and after 150 s only for a wrong lesson.
  - Format problems that used to force a retry are repaired deterministically.
  - The exhausted quota makes no back-off retries; a truncated or empty answer is retried once.
- Replay on the recorded benchmark outputs: 11 → 12 calls on 9 problems. The extra call is the new
  language rule (w1 is entirely without diacritics), a deliberate quality-over-latency trade.

## 9. Tokens

Baseline mean output 8,682 tokens per validation problem (hosted), most of it hidden reasoning. Effort
"none" measured 813–6,750 tokens (OPT-001). Reasoning tokens are now recorded per call
(`completion_tokens_details.reasoning_tokens`; before, the logs showed 0). Input prompt: ≈ 2.7K tokens
without the figure rules, ≈ 4.3K with them. Hosted input is not a latency factor.

## 10. Verification

New:
- the Grade 9 checker;
- language hygiene;
- normalisation of malformed figure checks (never counted as a false claim);
- duplicate hint ids renumbered;
- pre-substituted numeric checks evaluated;
- status reconciliation (a complete lesson labelled "ambiguous" is verified, from the earlier session).

States stay passed (verified) / failed (unverified) / inconclusive (partial) / not applicable
(not_checkable). A model's confidence is never used.

## 11. Hints

Unchanged schema: a guiding question, a concept cue, an explanation revealed on request, a level, the
step it leads to — all in the single lesson call. New: the rubric checks that hint 1 doesn't give the
answer away, and limits ≤ 4 hints for simple problems and ≤ 6 otherwise. A duplicate hint id no longer
costs a retry.

## 12. Geometry

Unchanged pipeline: the model writes a construction, and the device resolves and renders it. The figure
is the last field of the lesson, so with streaming the text steps arrive first. Figure construction
measured 3.8 ms median in verification. Malformed figure checks are repaired or set aside (minor) instead
of marking the lesson unverified. No new geometry engine.

## 13. Tests

- `worker`: **270 tests pass** (`npx vitest run`), 17 files, including `test/optimization.test.ts`:
  - grade-level rubric and forbidden methods;
  - tiers;
  - figure-check normalisation;
  - truncation / empty output / quota / timeout / 503;
  - streaming and progress;
  - retry budget;
  - failover;
  - ambiguous input and OCR-slip notes;
  - API compatibility.
- `worker` and `mobile` typecheck clean; `mobile` lint clean.
- End to end on the live local worker: a quota-exhausted solve (< 1 s, correct code), lesson reuse
  across prompt versions (< 1 s), a failed regenerate keeping the lesson (503 + lesson kept). Streaming
  against local llama.cpp passed.

## 14. Remaining weaknesses

1. **The hosted before/after is not measured** (OPT-006/007). The adaptive "minimal" for simple problems
   rests on 2 data points (g5 verified at minimal; reasoning *off* broke ch-3).
2. **Free tier**: ≈ 50 requests/day, shared by benchmarks and the website. A day of testing can exhaust it.
3. **Nemotron's Vietnamese** is the main quality gap. The glossary covers the observed insertions only;
   new ones still need a retry.
4. **Hard proofs (ch-4)** can spend the whole budget reasoning; the `none` step-down is untested on them.
5. The grade-level checker is keyword-based: it catches named methods, not an unnamed advanced idea.
6. The 150 s retry budget means a presentation issue found late is served as is (honestly marked).

## 15. How to run and configure

```bash
# Worker (local web setup): keys live only in worker/.dev.vars
cd worker
npx wrangler d1 migrations apply math_teacher_db --local      # adds progress_json (0005)
npx wrangler dev --port 8787

# Relevant variables (worker/.dev.vars or Cloudflare secrets/vars)
SOLVER_PROVIDER=local
LOCAL_LLM_URL=https://openrouter.ai/api          LOCAL_SOLVER_MODEL=nvidia/nemotron-3-super-120b-a12b:free
LOCAL_LLM_API_KEY=…                              # secret; never in wrangler.toml
LOCAL_SIMPLE_REASONING_EFFORT=minimal            # simple tier (default)
LOCAL_REASONING_EFFORT=low                       # standard / complex (default)
SOLVER_FAILOVER_URL=http://127.0.0.1:8080        # optional: local llama.cpp when the quota is exhausted
SOLVER_FAILOVER_MODEL=qwen3.5-9b-q4_k_m

# Tests
npx vitest run && npx tsc --noEmit -p .
cd ../mobile && npx tsc --noEmit -p . && npx expo lint

# Pending measurements (need fresh free quota; resets 00:00 UTC)
cd worker
npx tsx scripts/benchmark.ts or-nemotron-3-super --split validation --exp OPT-006
npx tsx scripts/build-results.ts ../experiments/opt006.json final=OPT-006_or-nemotron-3-super_validation
npx tsx scripts/benchmark.ts or-nemotron-3-super --split test --exp OPT-007     # held out, once
npx tsx scripts/stream-check.ts --url https://openrouter.ai/api --model nvidia/nemotron-3-super-120b-a12b:free --effort minimal  # hosted time to first token
```

Production (user action): apply migration 0005 to the remote D1 (`--remote`), set `ALLOWED_ORIGINS`,
and store the OpenRouter key with `wrangler secret put LOCAL_LLM_API_KEY`. The save path does not depend
on 0005; without it, live progress is simply off.

## 16. Recommended next steps

1. Run OPT-006 on fresh quota. Keep `minimal` for the simple tier only if accuracy holds; otherwise set
   `LOCAL_SIMPLE_REASONING_EFFORT=low`.
2. Run OPT-007 (held-out test) once, with the final configuration.
3. For a better Vietnamese writer at $0: retry `qwen/qwen3.8-27b:free` (rate-limited earlier). For
   production, consider a paid open-model endpoint (~$1–2 per 1,000 problems, MODEL_DECISION.md); the
   free quota can't serve real users.
4. Enable `SOLVER_FAILOVER_URL` only on a machine where the local model is fast (mains power, not Low
   Power Mode).
5. Have a Grade 9 teacher review ~20 lessons against GRADE_LEVEL_METHODOLOGY.md §4 to calibrate the
   automatic rubric.
