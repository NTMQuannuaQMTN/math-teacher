# Model adaptation plan: Toán chuyên

Decisions follow the failures observed in docs/CURRENT_SOLVER_EVALUATION.md, not a preference for any one
technique.

## 1. Failure pattern → remedy

| Observed failure | Root cause | Remedy | Status |
|---|---|---|---|
| Hard geometry proof truncates (all reasoning, no answer) | reasoning capacity / budget | stronger model for the proof tier; effort step-down (done) | partly done |
| False geometric claims in proofs | reasoning | verifier catches them (done); retry with feedback (done) | done (detection) |
| Wrong answer "verified" by a restating check | verifier gap | restatement rule (done, regression-tested) | **done** |
| Advanced methods (derivatives, coordinates) | method selection | Grade 9 checker + retry (done); method policy (done); **method cards** (built, not yet measured) | partly done |
| Mixed-language output | the free model's Vietnamese | glossary patch + retry (done); better model | partly done |
| Malformed or odd answer checks | output format | deterministic salvage (done) | done |
| Empty or runaway output | budget / sampling | effort step-down, retry budget, per-request cap | done |
| Missing technique knowledge | — | no clear case observed | — |
| OCR losing notation | — | not observed (typed or transcribed input) | — |

## 2. Strategies compared

| Strategy | Expected effect on the observed failures | Cost / latency | Complexity | Decision |
|---|---|---|---|---|
| Curriculum-aware prompt + method policy | method selection ↑ | +0 calls, +~150 tokens | low | **done** (solver-v2.x) |
| Deterministic verification and repair | correctness ↑, false-verified ↓ | ms | medium | **done**, highest value so far |
| Technique retrieval (method cards) | method selection ↑ for cued types | +0 calls, +100–300 input tokens | low | **built, off by default**; measure before enabling |
| Few-shot examples from verified teaching records | format/teaching style ↑, maybe method ↑ | +1–3K input tokens per call | low | next experiment, after the cards |
| RAG over verified solutions (nearest past problem) | method ↑ when a near-duplicate exists | +retrieval index | medium | defer: 72 problems is too few to retrieve from; risks answer copying |
| Lightweight classifier (tier, topic) | routing ↑ | deterministic, ms | low | **done** (problemTier) |
| Stronger model for the proof tier only | hard proofs ↑ | paid, per proof only | low | **recommended**, needs authorisation |
| LoRA / QLoRA fine-tuning | style ↑; reasoning unlikely ↑ with 22 examples | training time; hosting a tuned model | high | **not justified yet** (FINE_TUNING_REPORT.md) |
| Specialised number-theory verification (numeric instances of proof claims) | false proofs ↓ | ms | medium | recommended next verifier work |

## 3. Plan

1. **Measure the method cards** on validation (TP.HCM 2025 + PTNK 2026), with and without:
   `--dataset chuyen --split validation [--techniques]`. Enable them by default only if answer accuracy
   and the grade-level rubric do not drop and at least one method failure disappears.
2. **Proof tier → stronger model** (authorised paid endpoint), keeping the free or cheap model for the
   rest. The pipeline already supports a fallback model.
3. **Few-shot from teaching records**: one verified record of the same technique (by card id) in the
   request; measure the effect on validation.
4. **Grow the dataset** to ≥ 200 verified problems; then reconsider fine-tuning a local model for
   offline use.
5. **Held-out test** once, with the configuration chosen above.

## 4. What changed in the solver during this sprint (all measurable, no fine-tuning)

- Curriculum aligned with the 13 entrance-exam topics; Cô-si and Bunhiacopxki allowed; "unsupported"
  questioned unless the problem itself needs outside maths.
- Verifier:
  - an answer that is only restated doesn't count;
  - malformed checks are salvaged;
  - extra hints are repaired;
  - Grade 9 and language checks.
- Method cards (`worker/src/solver/techniques.ts`, opt-in: `techniqueHints` / benchmark `--techniques`).
- Retry, budget and streaming changes from the speed sprint.
