**Latest iteration03: [four specialist checkpoints](iteration-03/README.md), [current overall results](iteration-03/overall-summary.md), [frozen held-out16](iteration-03/held-out-frozen-v234.md). 1/16 mathematical passes,0/16 quality passes; human satisfaction unmeasured. Historical runs below are retained.**

# Specialist training — initial run

This run improves four specialist profiles over the existing shared OCR, typed lesson, solver, verifier and mobile rendering architecture. It changes prompts and deterministic solver/verification code; no model weights were trained.

The run uses a maximum of four hours of active engineering/testing. Approval and continuity gaps are excluded conservatively in `run-state.json`. Continuous one-hour phases were not practical during the extended approval interruptions. The recorded phase boundaries describe bounded workloads, not four completed one-hour blocks. Final active time and remaining budget are recorded in the overall evaluation.

## Read and review

- [Algebra](algebra-training.md)
- [Geometry](geometry-training.md)
- [Number Theory](number-theory-training.md)
- [Combinatorics](combinatorics-training.md)
- [Overall evaluation and limitations](overall-evaluation.md)
- [Feedback template](feedback-template.md)

Each report retains actual implementation answers, including unsuccessful outputs, alongside independent mathematical reviews. An independent review proxy is not authoritative human satisfaction. Please write corrections directly in the reports or copy the feedback template and refer to question IDs. No second feedback iteration begins until you request it.

## Architecture and baseline

The original working tree was clean. Baseline: 414 Worker tests across22 files passed in5.34 seconds. Four existing explicit specialist profiles share the same model adapter, schema, verification and rendering. Routing chooses relevant profiles; it does not create four copies of the application.

The existing local llama.cpp endpoint serves an OCR model, not a suitable mathematics solver. Real inference therefore used the already configured OpenRouter `nvidia/nemotron-3-super-120b-a12b:free`. The evaluation scripts reject a non-free model. The isolated Worker uses port8791 and a temporary local D1/R2 state directory. It copies only the free-model credential; paid credentials and paid fallbacks are excluded. Existing production/dev provider settings were not activated or deployed.

Existing past-paper records and old tests include examinations named held-out in the old manifest. Their split is contaminated and cannot support a fresh generalization claim. A new generated set is reserved for one frozen evaluation; development and validation families and any near variants stay together. Question sources are explicitly labelled generated or repository-transcribed past-paper records. Repository official-answer labels are provenance, not a substitute for independent checking.

## Reproduce safely

From the repository root:

```sh
npm run check
npm test --prefix mobile
python3 tools/specialist-training/independent-checks.py
worker/node_modules/.bin/esbuild worker/scripts/lesson-audit.ts --bundle --platform=node --format=esm --packages=external --outfile=worker/scripts/.lesson-audit.mjs
node worker/scripts/free-eval-server.mjs
```

In a second terminal, run `node tools/specialist-training/application-eval.mjs manual validation QUESTION_ID`. This reaches only the isolated free Worker. Re-running writes another append-only evidence file: do not silently pool repeats as independent questions. The harness creates a scan with fixture/mock OCR, replaces its text with the complete question, and then measures confirmation, solve, database writes, response consumption and the final client audit. It does not measure real photo OCR, production network transport, or mobile screen painting.

The archived held-out calls ran against an unchanged frozen source/configuration manifest. Final development-only safety repairs changed the source afterward, so the original frozen guard will intentionally reject a rerun. See final-integration-manifest.json for those differences; do not overwrite the original manifest or tune to held-out failures during this cycle.

Free-provider quota exhaustion ended further live inference in the final development batch. It is recorded as a controlled failure, not a mathematical answer. Existing paid fallbacks remain unused. The initial bounded run ends for report review; unused active budget is preserved in the ledger.

## Manual student checks

Use a mobile/web instance explicitly configured to the isolated free Worker at `http://localhost:8791` (a physical device needs the reachable host address). Submit the full question text from a report; do not use the existing paid-provider development instance for evaluation.

1. Algebra: inspect domain restrictions and equivalent transformations; try the removable-denominator example and a radical equation. Reveal hints before the worked solution.
2. Geometry: use the midpoint theorem or tangent proof; select hints/steps and check their highlights. Drag the existing permitted free points and check that constructions remain attached. No geometry rendering/dragging implementation was replaced.
3. Number Theory: use the finite factor equation and square-impossibility examples; check that negative divisors and proof of completeness appear, not just sampled integers.
4. Combinatorics: check labelled/unlabelled outcomes, exclusion of leading zero, overlap correction and the reason for dividing by repeated orders.
5. Across all four: each subquestion should occupy a separate line, titles/hints/reasons should render LaTeX, and the conclusion should be in the final worked step. There is no separate Final Answer card. Partial/unverified/not-checkable status must remain visible. Record language leakage or skipped reasoning as a failure, even when the final number is correct.

No production deployment, native-device visual QA or teacher review is claimed by the automated checks.

The isolated local evaluation server may remain available on port8791 for manual review. It uses only the free configuration and temporary local state; stop its dedicated process when finished. The existing servers on other ports were not stopped.


## User-requested feedback iteration 02

See [iteration-02.md](iteration-02.md) for upload-only OCR, Vietnamese divisibility, cyclicity prerequisites, LaTeX, SocLaas fallback and the actual $2\times9$ pursuit game. Seven targeted questions pass; the frozen structural transfer result is 0/3 against all product requirements. Archived initial evaluation remains unchanged.

## Current user-reported Q1–Q5 repairs — solver-v2.35

[Full actual answers, reproduced failures, independent checks and manual guide](iteration-03/user-proof-feedback.md). Six application calls with external inference disabled;0.2–2.7s;12 mobile/desktop page views pass. Historical held-out scores remain unchanged. Q3 and Q4a retain honest partial machine verification; full Q4b/c were not rerun.
