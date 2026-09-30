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

---

## Environment notes

- Apple M5, 24 GB, llama.cpp b11272 (official macOS arm64 build), models from Hugging Face (Qwen
  official GGUF for Qwen3; Unsloth GGUF for Qwen3.5 / Gemma-4, which have no official GGUF).
- Generation speed, Qwen3-4B Q4_K_M: 19.5 tok/s (llama-bench, battery, Low Power Mode) → 38 tok/s
  (charging). Prompt processing ≈ 300–400 tok/s.
