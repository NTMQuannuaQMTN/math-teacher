# Multi-path verified reasoning — Phase 0 (research and plan) and Phase 1 (candidate generation)

Status: Phase 1 implemented behind a flag that cannot be switched on yet. Nothing changes for students. Phases 2–4
wait for review.

## 1. What NVIDIA did, and what we can reproduce

The source is NVIDIA's blog post (15 Apr 2025) and the team's technical report, *AIMO-2 Winning Solution: Building
State-of-the-Art Mathematical Reasoning Models with OpenMathReasoning dataset* (arXiv 2504.16891). The team won
Kaggle's AI Mathematical Olympiad Progress Prize 2 with 34 of 50 problems on the private set. They had a 5-hour limit
on four L4 GPUs.

| Technique | What they did | Reproducible here? |
| --- | --- | --- |
| Fine-tuned model | Qwen2.5-14B-Base fine-tuned on OpenMathReasoning: 306K problems with 3.2M chain-of-thought and 1.7M tool-integrated solutions. The solutions were distilled from DeepSeek-R1 and QwQ-32B. Weights (`nvidia/OpenMath-Nemotron-14B-Kaggle`) and the dataset (CC-BY-4.0) are public. | No. That needs GPU training or self-hosting. SoCLaaS serves only its own catalogue (Qwen 3.x). The phase plan excludes fine-tuning. |
| Tool-integrated reasoning (TIR) | The model writes Python mid-solution and reads the result. A sandbox ran each execution with a ~2 s timeout and at most 6–8 executions per solution.* | Partly. Our models are not trained for TIR. Running model-written code would need a real sandbox (see §8). We already have the safer half: our own deterministic checks (SymPy, enumeration, geometry engine) run in an isolated process. |
| Many independent samples | Several generations per problem. The blog's example is "12 different times". The report evaluates maj@64.* | Yes. This is Phase 1: N independent solver calls. |
| Consensus answer selection | Majority vote over final answers. GenSelect (a model choosing among candidates) beat majority voting in the report but was **not** used in the Kaggle submission because of time limits. | Yes, as one signal only. Agreement is not proof; Phase 2 adds independent verification. |
| Early stopping | The blog says they stopped "if the model had already converged at the correct answer four or more times". The report summary says they cancelled a batch of 16 when the first 4–5 completions agreed.* | Yes. In Phase 2 it applies only when agreement and independent verification both hold. |
| Inference optimizations | TensorRT-LLM, FP8 (1.5× over FP16), ReDrafter speculative decoding (another 1.8×). | No. These are server-side; SoCLaaS controls serving. Our levers are concurrency, streaming, token caps and early stopping. |

\* These items come from a model-extracted summary of the report's HTML, because the fetch was truncated. Verify them
against the PDF before quoting them as exact.

What this means for us: their gains came mostly from a model trained for this kind of work plus many cheap samples on
their own GPUs. We can borrow the inference strategy: diverse candidates, answer comparison, stopping early when the
answers already agree. We cannot borrow the model or the serving speed. Each of our samples is a metered SoCLaaS
call: about SGD 0.02–0.04, and minutes of wall time at the speed we measured on 2026-11-07/08. Ten-plus samples per
problem would cost several times the current per-question budget, so we start at 3.

## 2. The current solver (baseline)

The pipeline is `app/agents/orchestrator.py`, run as a background job (`workers/solve_job.py`) inside the API
container:

1. **Classify.** The student's confirmed topics are reused; otherwise the fast model classifies the problem.
2. **Formalize.** An independent model writes machine-checkable templates (equations, extremum, geometry DSL) without
   solving. Geometry figures get an engine-driven repair round.
3. **Solve.** One reasoning-tier call. Geometry starts with hidden reasoning.
4. **Verify.** Deterministic sandboxed checks against the formalization (`verification/verdict.py`, `tools/checks.py`):
   substitution, solution sets, extremum, divisibility, geometry goals, and residue tables
   (`verification/tables.py`).
5. **Curriculum.** A policy check (`curriculum/policy_v1.json`): prohibited methods and self-talk.
6. **Examiner.** An independent critic (`agents/critic.py`) marks the solution step by step.
7. **Revise.** Up to 4 rounds with all findings, bounded by time (40 min), question cost (SGD 0.30) and the daily
   budget.
8. **Hints.** Progressive hints from the best attempt, checked for answer leaks.

The final status is one of VERIFIED, PARTIALLY_VERIFIED, UNVERIFIED, INCORRECT or UNSOLVED. These map onto the
requested verifier vocabulary: VERIFIED → verified, PARTIALLY_VERIFIED → partially_verified,
INCORRECT → contradicted, UNVERIFIED/UNSOLVED → unverifiable.

**Baseline numbers we have are stale.** The last full run (2026-10-29, 72 items) is in `benchmarks/REPORT.md`:
8 of 16 checkable answers correct, 0 false VERIFIED, mean SGD 0.12, mean 445 s. It predates the examiner loop,
streaming, the accuracy-first time budget and the residue-table check. Phase 3 must re-run the current single solver
on the same held-out items before any comparison.

## 3. Existing solver vs proposed `multi_path_verified`

| | Single (today) | Multi-path verified (proposed) |
| --- | --- | --- |
| Candidates | 1, then revisions of that one | N independent (default 3, cap 5), each with its own method direction and temperature |
| Diversity | Revisions repeat one line of attack | Each candidate is steered to a different method for its topic, e.g. residues vs factorisation vs bounding |
| Selection | Best-scoring attempt of one chain | Phase 2: verified candidates first, answer agreement second; never agreement alone |
| Verification | Tools, curriculum and examiner on one solution | The same, on each candidate independently |
| Early stop | No (revisions until verified, or out of budget/time) | Phase 2: stop once ≥ k candidates agree **and** one of them is verified |
| Cost | ~1 solve + examiner + revisions | ~N solves + N examiner passes (bounded by the same per-question cap) |

## 4. Files

Changed or added in Phase 1:

| File | Change |
| --- | --- |
| `services/api/app/agents/multipath.py` | **New.** Method directions per topic, `MultiPathConfig`, `Candidate`, `CandidateBatch`, `generate_candidates()` with cost cap, deadline, concurrency and daily-budget stop. |
| `services/api/app/agents/orchestrator.py` | `classify()` extracted from `run_solve` (same behaviour). New `generate_candidates()` entry point that reuses classify, formalize and the solver prompt. New trace state `candidates`. |
| `services/api/app/providers/gateway.py` | `StructuredResult` now also reports `prompt_tokens` / `completion_tokens` (additive; default 0). |
| `services/api/app/config.py` | `reasoning_mode` (`single` \| `multi_path_verified`) and `multipath_*` limits. `multi_path_verified` is **refused** until Phase 2. |
| `services/api/scripts/multipath_experiment.py` | **New.** Runs generation on benchmark items. Stratified, question-level dev/held-out split; held-out runs are refused during development. Records per-candidate answers, usage and latency. |
| `services/api/scripts/run_benchmark.py` | Scoring split into `answer_matches(expected, solution)` so each candidate can be scored the same way. |
| `services/api/tests/test_multipath.py` | **New.** 9 tests (§9). |

Expected in later phases: `verification/answers.py` (normalization), `agents/multipath.py` (verification, selection
and early stop), `workers/solve_job.py` and `solvers/service.py` (mode in the cache key and the job path),
`api/v1/schemas.py` (diagnostics for admins only), and `scripts/run_benchmark.py` (A/B/C runs).

## 5. Phased plan

- **Phase 2 — verification and consensus.**
  - Normalize answers: solution sets as SymPy-canonical tuples, values by symbolic equality, extremum value plus
    attaining point.
  - Verify every candidate independently with today's tools, the curriculum policy and the examiner (category rules in
    §6).
  - Selection order: (1) verified and compliant, (2) the agreement-group size of its answer, (3) fewer examiner
    issues, (4) lower cost.
  - Early stop: after the first k candidates, stop when `early_stop_threshold` of them share one normalized answer
    **and** at least one of those is VERIFIED and curriculum-compliant. Otherwise generate up to the cap.
  - If no candidate is verified, the result is uncertain (UNVERIFIED/UNSOLVED shown honestly), never "the majority
    answer".
  - Agreement on a wrong answer is expected to happen: the selector never upgrades a status because of agreement.
- **Phase 3 — benchmark.** On the held-out split, run three arms:
  - **A:** single solver (current pipeline).
  - **B:** multi-path with consensus only (selection by agreement; measured, never shipped).
  - **C:** multi-path with verification and early stopping.

  Report everything in §7, by topic, with failure cases. Grow the reference-answer items first (§7, limitations).
- **Phase 4 — integration.**
  - Hints and the student-facing solution come from the selected candidate, through the existing hint generator.
  - The mode goes into the solution cache key.
  - Diagnostics are stored in the solution trace and shown to admins only.
  - Fallback: if multi-path fails or runs out of budget, run the single solver.
  - Enabled per environment only after Phase 3 meets the criteria, and deployed only with your approval.

## 6. Verification per category (Phase 2)

- **Algebra.** Substitution of every claimed root into the original equation, domain (ĐKXĐ) and extraneous roots,
  symbolic equivalence of the answer set, extremum value and attaining point. All of these exist today in
  `verification/verdict.py`.
- **Number theory.** Divisibility checks over ranges, residue tables recomputed cell by cell (`verification/tables.py`),
  and a counterexample search over small values.
- **Combinatorics.** Enumeration where the formalization is a finite count (`count` template). Small cases are brute
  forced, and the answer must match.
- **Geometry.** The DSL engine checks every goal on 24 random configurations. This is evidence, never presented as a
  proof. The examiner checks the written Euclidean argument and theorem prerequisites.
- **Curriculum.** `curriculum/policy_v1.json` (prohibited methods such as derivatives, vectors and complex numbers,
  plus advanced named theorems) applies to every candidate. A correct answer with a non-compliant proof fails.

## 7. Benchmark and acceptance criteria

**Data.** 118 authentic items (`benchmarks/authentic/exams-2023-2026.jsonl`). The split is by whole question,
stratified by topic, ~25% held out:

| Split | Algebra | Number theory | Combinatorics | Geometry | Other |
| --- | --- | --- | --- | --- | --- |
| Dev | 36 | 18 | 11 | 19 | 7 |
| Held-out | 12 | 6 | 3 | 3 | 3 |

Items with machine-checkable answers: 47 dev, 15 held-out.

**Limitations.** 15 held-out items with reference answers is too few to detect small differences: one item is
~7 points. Geometry and combinatorics have 1–3 checkable held-out items each. Before Phase 3, I recommend adding at
least ~30 more checkable items from the papers already sourced (`benchmarks/authentic/sources.json`) to the
held-out side.

**Metrics.** Final-answer accuracy (all and per topic); explanation validity (examiner errors and gaps, plus a manual
read of a sample); curriculum compliance; unjustified steps; uncertainty precision and recall (a wrong answer must be
flagged uncertain); mean and p95 latency; tokens; SGD per problem.

**Proposed criteria for making C the default:**

1. Accuracy of C ≥ A on held-out, with no topic worse by more than one item.
2. **Zero** wrong answers labelled VERIFIED.
3. Curriculum compliance of C ≥ A.
4. Every wrong final answer in C is flagged uncertain.
5. Mean cost ≤ SGD 0.30 per problem and p95 ≤ SGD 0.45.
6. p95 latency within the solve time budget (40 min).

If C only beats A by agreement, without verification, it is not enabled.

## 8. Python execution

NVIDIA's tool-integrated reasoning executes model-written code. We should not do that inside the API container: it
holds the database credentials and the SoCLaaS key. The existing sandbox (`tools/sandbox.py`) runs only our own
registered check functions, in a separate process with a time limit, never model-written code.

**Recommendation.** Phase 2 stays with deterministic checks the server writes: substitution, enumeration, residue
tables, the geometry engine. Executing model-written code needs a separate container with no network, no secrets and
CPU/memory/time limits (rlimits, a seccomp profile). Evaluate that only if the benchmark shows that the remaining
failures are computational.

## 9. Phase 1 — what was built and how it was tested

**Behaviour.**
- `Orchestrator.generate_candidates(data, config)` classifies, formalizes and builds the **same system prompt** as the
  single solver. It then runs `config.count` candidate calls with up to `config.concurrency` in parallel.
- Candidate 1 is exactly the single solver's call: no direction, temperature 0.2.
- Candidates 2… add one method direction for the main topic, at temperature 0.7–0.8. Every direction says to use
  another allowed method if it doesn't fit and never to leave the allowed list.
- Before each call, spent cost + worst-case cost of calls in flight + this call's worst case must stay within
  `max_cost_sgd`. Otherwise the candidate is `skipped_budget`.
- A batch deadline and a per-call timeout bound the wall clock. The first daily/user budget refusal stops the batch.
- There are no retries beyond the gateway's own (`max_retries=0`).
- Each candidate records its status (`ok`, `unsolved`, `invalid_output`, `failed`, `skipped_budget`,
  `skipped_deadline`), final answers, cost, tokens and latency.
- The model's hidden reasoning is never kept (the gateway strips it).
- **No candidate is selected or shown.** `REASONING_MODE=multi_path_verified` is refused at startup until Phase 2.

**Tests** (`tests/test_multipath.py`, 9 tests, all passing):
- Candidates differ in method and temperature, and share the solver's system prompt.
- Candidate 1 equals the single solver's call.
- Usage is recorded, and the trace entry is present.
- The candidate count is capped, and every topic has distinct methods.
- A malformed reply or a provider failure fails only that candidate.
- An unexpected exception fails only that candidate.
- The question cost cap counts calls in flight at their worst case.
- The batch deadline bounds wall time.
- A daily budget refusal stops the batch.
- The mode can't be enabled.
- Diagnostics hold answers and usage, not steps.

**Full suite.** 400 backend tests pass, plus ruff and mypy. The S3 test needs `docker compose up -d s3`.

**Review findings, fixed before this report.**
1. An unexpected exception in one candidate would have aborted `asyncio.gather` and left the other calls running
   unobserved. It now fails only that candidate and is logged.
2. `MultiPathConfig.from_settings` broke when an override repeated a settings field. Fixed.
3. The first dev/held-out split was unbalanced (2 geometry and 2 number-theory items held out). It is now stratified
   by topic.

SMOKE_RESULTS

**Manual testing.**

```bash
docker compose up -d postgres s3
cd services/api
uv run pytest tests/test_multipath.py -q
# live (metered, ~SGD 0.1 per item with 3 candidates):
uv run python scripts/multipath_experiment.py --only-expected --topic number_theory --limit 2
```

Results are written to `benchmarks/results/multipath-phase1-<timestamp>.jsonl`.

## 10. Latency and cost trade-offs (estimates; Phase 3 will measure)

**Inputs measured on SoCLaaS:**
- ~13 output tokens/s on a long streamed call (2026-11-07).
- Formalization averages 65 s (2026-11-08).
- Output price is USD 2.37 per million tokens, so a full 8k-token plain solution is ≈ SGD 0.025. The worst case,
  including the prompt, is ≈ SGD 0.03.
- An examiner pass is ≈ SGD 0.01.

**Cost per problem.**
- The single solver adds revisions and sometimes a reasoning call. The 2026-10-29 mean was SGD 0.12, but the pipeline
  has changed since.
- Multi-path with 3 candidates: ≈ 3 × (0.02–0.03) for generation + 3 × 0.01 for examiners + formalization ≈
  **SGD 0.10–0.13** before any revision. Early stopping saves only the candidates not yet started.
- At the SGD 10/day ceiling that is roughly 75–100 problems a day across all users, versus the per-user SGD 1.50 cap.

**Latency.**
- If SoCLaaS serves calls in parallel, 3 concurrent candidates take about the time of one: minutes per problem today.
- If it queues them, latency approaches 3×. The smoke run measures this.
- Candidate concurrency is a setting (default 2).

**Runtime.** Long calls run in the API container's background worker. The Cloudflare Worker only proxies requests
(Workers have no wall-clock limit while waiting on a subrequest; CPU time is what's limited), and students poll the
job. So multi-path changes nothing about Cloudflare limits. The container's job timeout (3000 s) already covers the
40-minute solve budget.
