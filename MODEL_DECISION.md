# Model decision (2026-09-30, updated 2026-10-01)

Evidence: EXPERIMENT_LOG.md (EXP-000…010), MODEL_BENCHMARK.md, DATASET.md, `tools/benchmark/`.
Constraints during the sprint: Gemini disabled, no paid API calls, an Apple M5 laptop, ~1 day.

## Answers

1. **Current Gemini cost.** Measured: easy lesson ≈ $0.004 (flash-lite), standard geometry ≈ $0.01–0.05,
   hard multi-part proof **$0.32** (escalated to `gemini-3.5-flash`), OCR ≈ $0.0008/photo. On a
   60/33/7 easy/standard/hard mix that is **≈ $0.039/problem, $39 per 1,000**. Hard problems are ~7%
   of traffic but ~55% of the cost.
2. **Current Gemini accuracy.** On development data (validation + train, stored lessons, verifier v2):
   24/25 PASS, 0 CRITICAL; the 25th has no stored lesson. This is optimistic: those problems were used
   to tune the prompt and verifier. Before this sprint's verifier work, production showed **2 of 4
   real-exam lessons wrong while marked "verified"** (f(n) parts b and c). A clean Gemini number on
   the held-out test set could not be measured (Gemini disabled).
3. **Major failure modes.** (a) Wrong answers on hard multi-part problems presented as verified,
   because only one part had a check. Fixed: one check per part, and brute-force `integers` checks.
   (b) False geometric steps ("IH ⊥ IK", "∠IDK = ∠IAD"). Now caught by measuring claims on the
   figure. (c) Figures missing points, or drawn inconsistently with the statement. Points are now
   built from their textual definitions, and shape words become checked givens. (d) Small open models:
   schema slips (fixed by grammar constraints + repair), malformed checks (now reported as
   malformed), repetition loops hitting the output limit (open), and weak reasoning (4B).
4. **Candidates evaluated.** Gemini 3.5 flash-lite → flash (stored), Qwen3-4B, Qwen3.5-9B (solver
   and OCR), plus a hybrid Qwen3.5-9B → Gemini (offline simulation). Researched but not run: Gemma-4-12B
   (downloaded; not run for lack of time on the throttled laptop), Gemma-4-26B-A4B, Qwen3.6-35B-A3B
   (too large for 18 GB of Metal memory), DeepSeek-V4-Flash (hosted only), and Vietnamese-specific
   7B models (older bases, gated or low adoption).
5. **Cheapest.** Qwen3.5-9B: $0 locally, and **≈ $0.001–0.002/problem** hosted ($0.10 · $0.15 per M
   tokens), about 20–35× cheaper than the current Gemini mix.
6. **Most accurate.** Qwen3.5-9B and Gemini both get 7/8 of the checkable validation answers
   right (Gemini on development data). Qwen3.5-9B solved the two problems flash-lite failed
   (f(n) divisibility, r + s). On the held-out test: see "Test split" below.
7. **Best accuracy/cost.** A **hybrid**: Qwen3.5-9B (hosted) first, verified by the deterministic
   verifier, with Gemini only when it can't verify. Validation simulation: 11/11 PASS, 0 CRITICAL,
   Gemini on 45% of a hard-heavy set.
8. **Vietnamese.** Qwen3.5-9B writes fluent, correct Vietnamese, follows the "bạn/mình" voice, and
   uses standard notation. Qwen3-4B is adequate but makes more slips. OCR of Vietnamese diacritics
   by Qwen3.5-9B: CER 0 on 13 single-problem fixtures.
9. **Grade 9 mathematics.** Qwen3.5-9B: 7/8 checkable answers correct on validation (the miss is a
   simple word problem, flagged unverified). Qwen3-4B: not viable (4 of 5 checkable answers wrong).
10. **Geometry.** Figures from small models are often incomplete or inconsistent. The verifier now
    rebuilds points from the text and measures claims; the incircle proof by Qwen3.5-9B was
    correctly rejected (three false angle claims). Geometry proofs remain the weakest category for
    every model and the main reason to keep a strong fallback.
11. **Does fine-tuning help?** **Not yet (conclusion B + D).** There are only 14 verified,
    leakage-free training examples, all easy. The observed failures are reasoning capacity and
    format, and the format problems were fixed without training. See FINE_TUNING.md for the
    revisit criteria and the ready pipeline.
12. **Recommended architecture.** Keep one structured LLM call for the lesson, but surround it with
    deterministic machinery:
    `OCR → problem text → [shared-library cache] → cheap open model (hosted Qwen3.5-9B) →
    repair → deterministic verifier (answer checks, point construction, claim measurement,
    statement givens) → verified? serve : retry with verifier feedback → still not verified?
    stronger model (Gemini flash) → still not verified? show "unverified" honestly`.
    A symbolic solver replacing the LLM was **not** justified: on the real exam, almost every item
    needs language understanding before any algebra, and easy items already cost < $0.004. Symbolic
    tools are more valuable as *verifiers* (done) than as solvers.
13. **Cost per 1,000 problems.** Hosted Qwen3.5-9B alone ≈ **$1–2**. Hybrid with a Gemini fallback on
    30% ≈ $14 (the fallback dominates; lowering the fallback rate is the main lever). Current: ≈ $39.
    OCR: +$0.80 per 1,000 photos (Gemini) or $0 (local).
14. **Fallback strategy.** Retry once on the same cheap model with the verifier's exact feedback. Then
    escalate to Gemini flash only if the lesson is still not verified. Never present an unverified
    lesson as verified: the UI shows "unverified", and CRITICAL stayed at 0 in every run.
15. **Next steps.** See the end of this document.

## Test split (held out, Toán KC 2026, 15 problems): Qwen3.5-9B

Incomplete: the run was paused at 10 of 15 problems because the throttled laptop took 5–30 min
per problem (kc-3…kc-5 not run). No result file was written; numbers are from the run's console log.

- PASS: mcq2, mcq4, mcq8. PARTIAL: mcq1, mcq5, mcq7.
- FAIL: mcq6, wrong answer, **flagged unverified** (not CRITICAL).
- No lesson: mcq3, mcq10, kc-1 (output truncated, repetition loops); mcq9, kc-2 (timeout).

So on the held-out exam: **6 of 10 attempted got a correct, usable lesson; 0 CRITICAL.** The main
local failure mode is not wrong answers but not finishing (5 of 10) on this hardware.
The hosted Nemotron solver (below) has not been run on the test split yet (free-tier quota).

## Next steps

**Recommendation (2026-10-01): use a free hosted open model now, keep the verifier as the gate.**

What the app runs today (local worker, `worker/.dev.vars`):
`photo → PaddleOCR-VL-1.6 (local, ≈ 3 s/photo, 20/20 fixtures) → confirm → Nemotron-3-Super-120B-A12B
(OpenRouter free tier) → deterministic verifier → retry once on serious feedback → "verified" or
an honest "unverified"`. API cost: **$0**.

Evidence: EXP-010 validation, 5 PASS · 3 PARTIAL · 3 FAIL · 0 CRITICAL, every produced answer
correct, mean 58 s (vs ≈ 14 min locally on this laptop, with similar accuracy).

Known limits and what to do about them:
1. **Hard geometry proofs don't finish** (ch-4, g5 truncated at 12K, ≈ 5K is hidden reasoning).
   Next: retry a truncated attempt with `reasoning.effort = minimal` or a higher cap; measure on
   ch-4/g5 only.
2. **Free tier**: rate limits and ≈ 50 requests/day without credit; the provider may change or
   withdraw the free model. For production, switch `LOCAL_LLM_URL`/`LOCAL_SOLVER_MODEL` to a paid
   open-model endpoint (same code path; Qwen3.5-9B hosted ≈ $1–2 per 1,000 problems) or keep Gemini
   as a paid fallback for lessons that don't verify (§7, §14).
3. **Privacy**: the problem text (not the photo) goes to OpenRouter and the model host.
4. **Held-out test**: run `scripts/benchmark.ts or-nemotron-3-super --split test --exp EXP-011` on a
   day with fresh quota (≈ 25 requests), and finish EXP-005 (kc-3…kc-5) on mains power.
5. **Production deploy** (user action): set `ALLOWED_ORIGINS`, the provider variables and the
   OpenRouter key as a Cloudflare secret (`wrangler secret put LOCAL_LLM_API_KEY`), never in
   `wrangler.toml`. PaddleOCR-VL needs a host for production OCR; until then keep Gemini/OpenAI OCR
   there (≈ $0.0008/photo).
6. **Fine-tuning** stays deferred (FINE_TUNING.md); revisit once ≥ 200 verified lessons are logged.
