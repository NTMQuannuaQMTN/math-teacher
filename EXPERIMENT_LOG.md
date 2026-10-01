# Experiment log

Every experiment records: ID, date, model, quantisation, prompt version, dataset version, N,
results, critical failures, latency, tokens, cost, verification rate and notes. Raw per-item results
are in `tools/benchmark/results/<EXP>_<system>_<split>.json`, and model responses are cached in
`tools/benchmark/cache/` (re-running costs nothing; `--offline` guarantees no model call).

Grades (deterministic, `worker/scripts/lib/grade.ts`):
- **PASS**: answer matches the verified ground truth (or the item is a proof) and the lesson is "verified".
- **PARTIAL**: answer correct but not fully verified.
- **FAIL**: wrong but not presented as verified, a proof with a detected false claim, or no lesson.
- **CRITICAL**: a wrong answer presented as "verified".

Budget rule for this sprint: **$0 of paid API** (Gemini disabled by the user; no paid APIs).

---

## EXP-000: ground-truth verification

- Date: 2026-09-30 · Dataset v1 (40 items) · `python3 tools/benchmark/ground_truth.py`
- Result: **47/47** ground-truth checks pass (SymPy, brute force, numeric geometry on 50 random
  configurations per proof).
- Found 1 error in a hand-written ground truth (a3: the answer is (x − 1)/√x). It was corrected
  before any model was evaluated.

## EXP-001: stored Gemini lessons, re-graded offline (baseline, development data)

- Date: 2026-09-30 · Models: `gemini-3.5-flash-lite` first attempt, `gemini-3.5-flash` retry
  (production config) · Prompt solver-v1.7 · Dataset v1
- Source: lessons saved by the 2026-09-30 solver-eval runs (no new API call); re-verified with the
  current verifier.
- N = 25 (validation 11 + train 14). Validation: 10 PASS, 1 FAIL (ch-5 was never solved by
  Gemini: no stored lesson). Train: 14/14 PASS. **0 CRITICAL.**
- Cost of those runs: token counts were not logged in them (the merged branch had dropped Gemini
  prices). The measured per-problem costs come from earlier logs: easy ≈ $0.004, geometry
  ≈ $0.01–0.05, and the Toán chuyên incircle proof **$0.316** (128 s).
- **Caveat: optimistic.** These problems were used to develop the prompt and verifier (ch-1…ch-4
  were the user's own failing problems, fixed on 2026-09-29/30). This is not a clean baseline, and
  a clean Gemini baseline on the test split is **impossible** under the no-Gemini constraint.

## EXP-002: Qwen3-4B (Q4_K_M), non-thinking, 3 validation items

- Date: 2026-09-30 · Local llama.cpp b11272, Metal · JSON-schema grammar (stripped schema) · solver-v1.7
- Items: ch-3 (hard number theory), a3 (radical simplification), g5 (Pythagoras + altitude)
- Result: **0 PASS, 3 FAIL, 0 CRITICAL.** ch-3: wrong answer, not verified (correctly flagged).
  a3 and g5: every attempt rejected by schema validation.
- Diagnosis: the grammar got the schema *without* pattern/length/list-size constraints (they are
  removed for OpenAI strict mode). Qwen3-4B produced empty ids, 7 assignments (max 6) and circle
  labels over 20 characters. Fix: (1) grammar decoders now receive those constraints
  (`toGrammarJsonSchema`); (2) a generic repair step cuts over-long lists and strings and replaces
  bad ids. Re-parsing all 8 cached outputs: **8/8 now valid**.
- Latency: 72–211 s per attempt normally. Three attempts ran at ~2 tok/s (11–15 min each) while
  the machine was on battery at 23–25% in Low Power Mode; that is a machine artefact, not the model.

## EXP-003: Qwen3-4B, non-thinking, grammar schema + repair, validation split (partial: 7/11)

- Date: 2026-09-30 · Qwen3-4B Q4_K_M · llama.cpp · grammar schema with limits + repair · solver-v1.7 · max 2 attempts
- Stopped after 7 items: the harness's background time limit stopped the model server. The 7
  completed items are cached. ch-4 failed on a Node `fetch` 300 s header timeout (a harness bug,
  fixed with an undici dispatcher without that timeout).
- Results (7): **0 PASS**, 2 PARTIAL (ch-1: r + s = −3/2 correct but no check; ch-5: a proof with
  nothing to measure), 5 FAIL (ch-2, ch-3, a3, a7 wrong answers; ch-4 error). **0 CRITICAL.**
- Pattern: almost every lesson was `not_checkable`, because the 4B model rarely writes answerChecks.
  Its wrong answers were therefore never presented as verified. The verifier behaves safely, but the
  model is not useful: 4 of 5 checkable answers were wrong, including the easy radical
  simplification (a3) and the Vieta problem (a7).
- Speed (plugged in): ~38 tok/s generation, 100–390 s per problem (2 attempts).
- **Conclusion: Qwen3-4B is not viable as the solver**, even for difficulty 1–2 items.

## EXP-004: Qwen3.5-9B (Q4_K_M, Unsloth GGUF), non-thinking, validation split (11)

- Date: 2026-09-30 · llama.cpp b11272 + Metal · grammar schema + repair · solver-v1.7 · max 2 attempts
  · plugged in, `caffeinate` (the first item stalled ~20 min while the Mac was idle-sleeping)
- Tokens: mean 9.5K in / 6.6K out per problem (2 attempts). Latency: mean 824 s per problem
  (13–20 tok/s); the incircle proof took 1,495 s and 17K output tokens. API cost **$0**; the hosted
  list price for the same tokens would be ≈ $0.002 (`cost_model.py`).
- **Final answers: 7/8 correct (87.5%)**, including the two problems Gemini flash-lite got wrong
  before escalation: ch-3 f(n) (n ≡ 1 mod 3 and n ≡ 16 mod 18) and ch-1 r + s = −3/2. The one
  wrong answer (w1, garden dimensions) was flagged unverified. **0 CRITICAL.**
- Grades with the verifier at run time (v1): 2 PASS, 6 PARTIAL, 3 FAIL, 0 CRITICAL.

### EXP-004b: same lessons, re-graded with verifier v2 (no model call, `scripts/regrade.ts`)

Verifier changes, all motivated by EXP-004 and applying to every model:
(1) checks that cannot be evaluated (unknown letters) are reported as malformed, not as wrong
answers; (2) `value` checks may be relations with expected true/false, and several values are
compared pairwise; (3) a missing figure is a retry hint, not a mathematical failure; (4) shape words
in the statement ("vuông tại A", "cân", "đều", "hình vuông…") become checked givens, so a wrongly
drawn figure is set aside instead of failing every claim; (5) "tam giác ABC có đường tròn nội tiếp
(I)" builds I and (I) from the text.

- Result on identical lessons: **6 PASS, 3 PARTIAL, 2 FAIL, 0 CRITICAL** (was 2/6/3/0).
- The 2 remaining FAILs are real: w1 has a wrong answer; ch-4 has three false claims measured on a
  figure built only from the statement: "∠IDJ = ∠IDA" (4.6° vs 27.6°), "∠IDJ = 90°" and
  "∠EIF = 180°".
- Regression check: the stored Gemini lessons (EXP-001) grade identically, and all 12 known-good
  Gemini geometry lessons stay verified (no false alarms).

## EXP-006: OCR, local Qwen3.5-9B vision (mmproj F16) vs stored API baselines

- Date: 2026-09-30 · harness `tools/ocr-eval/run.mjs` through the real API (local worker,
  `OCR_PROVIDER=local`) · metric: character error rate (CER) after normalisation; pass at CER ≤ 0.10
  and the right status/problem split.
- Fixtures 01–17 (single problems: print, handwriting, blur, non-maths, injection, a 3-problem worksheet):
  **16/17 PASS.** Every text case scored CER 0.000, except the worksheet at 0.080 (split correctly
  into 3 problems). Blurry and non-maths images were correctly rejected. The one failure (14-injection):
  transcribed verbatim, not obeyed and not solved, but labelled `no_math_found` (safe, wrong status).
  Median latency ≈ 28 s per photo (11–76 s), API cost $0.
- Real exam pages (18–20, dense two-column A4 pages at 1600 px): **0/3.** KC page 1: CER 0.49,
  9 questions merged into 1 (401 s). KC page 2: timeout at 600 s. Chuyên page: split correctly
  into 5, CER 0.22 (323 s).
- Stored baselines on fixtures 01–17 (not re-run; no paid calls): OpenAI gpt-4.1(-mini) **17/17**,
  CER 0.005–0.007, median ≈ 2.2 s, ≈ $0.0011/photo. Gemini 3.1 flash-lite **16/17**, CER 0.012,
  median 3.7 s, ≈ $0.0008/photo. Neither was run on the exam pages (added today).
- **Conclusion:** for one or two problems per photo (the app's main use, since the student crops),
  local Qwen3.5-9B OCR matches the paid APIs on accuracy but is ~10× slower on this Mac. For whole
  dense pages it is not usable; keep a hosted vision model (or crop per question) for those.

## EXP-007: OCR speed — compact format, smaller/specialised models (2026-10-01)

- Problem (user report): local OCR took too long (Qwen3.5-9B: 20–50 s per photo, 5–10 min or a
  failure per exam page). Several earlier timing runs were invalidated because the Mac slept with the
  lid closed on battery. `tools/benchmark/run-ocr-matrix.sh` now marks a run INVALID if the Mac slept.
- Changes: (1) **compact OCR format**: the model writes the transcription once instead of three times
  (raw_text, formatted_text, problems); the server derives the rest. (2) **Text mode for dedicated
  document-OCR models**: Markdown/LaTeX output → problems via a deterministic parser (split at
  "Câu/Bài n", including "Câu n (x điểm)" joined onto the previous line; the exam header and
  instructions before the first question are dropped; a real maths signal is required).
  (3) **Confidence from token log-probabilities**: the mean logprob of the generated tokens. The
  blurry photo scores −0.62 vs ≥ −0.043 for every readable photo; threshold −0.35 → low_quality.
- **PaddleOCR-VL-1.6 (0.9B, Apache-2.0, official GGUF), end to end through the worker: 20/20 PASS,
  mean CER 0.020**. Single photos 2.1–4.6 s; exam pages 19–23 s, each split correctly (9 / 6 / 5
  questions); blurry, non-maths and injection photos all correct. API cost $0.
- Versus Qwen3.5-9B local (EXP-006): 16/17 on single photos at ~28 s, 0/3 exam pages. Versus stored
  API runs (fixtures 01–17 only): OpenAI 17/17, Gemini 16/17.
- **Caveat:** the parser rules and the logprob threshold were developed on these same 20 fixtures,
  so new photos are the real test. GLM-OCR, Qwen3.5-2B/4B and the 9B compact-vs-full comparison are
  downloaded; the matrix script runs them when the Mac is plugged in and awake.

---

## Environment notes

- Apple M5, 24 GB, llama.cpp b11272 (official macOS arm64 build), models from Hugging Face (Qwen
  official GGUF for Qwen3; Unsloth GGUF for Qwen3.5 / Gemma-4, which have no official GGUF).
- Generation speed, Qwen3-4B Q4_K_M: 19.5 tok/s (llama-bench, battery, Low Power Mode) → 38 tok/s
  (charging). Prompt processing ≈ 300–400 tok/s.
