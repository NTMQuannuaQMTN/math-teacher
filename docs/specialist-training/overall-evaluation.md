**Latest iteration03: [overall evaluation](iteration-03/overall-summary.md), with per-domain weaknesses, confirmed sleep limits and frozen1/16 mathematical passes (0/16 quality). Results below are archived, not current metrics.**

# Overall evaluation — initial specialist run

**90% human satisfaction has not been established.** The held-out results below are actual responses under a frozen free-only configuration, including controlled failures. This is a bounded initial run, not proof of general mathematical capability.

## Timing and budget

Run start: 2026-10-10T11:31:55Z. Latest checkpoint: 2026-10-11T06:01:46.259840+00:00.
Recorded active engineering/testing: approximately 99.3 minutes. Remaining from the four-hour maximum: 140.7 minutes. Approval/continuity gaps excluded: 16.84 hours.
The timer is a conservative checkpoint ledger, not subsecond-accurate activity telemetry. Several approval boundaries are estimated and labelled. The four named specialist phases were bounded workloads with shared validation/integration; they are not claimed to be four completed one-hour phases. Automated test execution while actively reviewing results is testing; extended approval and continuity gaps are excluded.

| Phase | Actual UTC start | Actual UTC end |
|---|---|---|
| phase-0-audit | 2026-10-10T11:31:55Z | 2026-10-10T11:32:32.455433+00:00 |
| algebra | 2026-10-10T12:31:27Z | 2026-10-10T14:30:01.423276+00:00 |
| geometry | 2026-10-10T14:30:01.423276+00:00 | 2026-10-10T14:37:06Z |
| number_theory | 2026-10-10T14:37:06Z | 2026-10-10T14:40:52.401548+00:00 |
| combinatorics-integration | 2026-10-10T14:40:52.401548+00:00 | 2026-10-11T06:01:46.259840+00:00 |

## Metrics and gate definitions

Mathematical pass requires a correct final result, valid substantive reasoning, a complete solution set/proof and no material mathematical error. Controlled failures and incomplete answers count as non-passes in the denominator; a correct final number with a false hint or equality also fails.

The review proxy uses the requested 40/20/15/10/10/5 rubric: correctness, completeness, clarity, method, formatting, and useful verification/uncertainty. Each specialist report records components. A material mathematical error overrides presentation scores. Failed requests receive zero as complete-solution proxy scores. Human satisfaction remains unmeasured and the user’s review is authoritative.

p50 is the sample median; p95 uses the nearest-rank convention. Timing includes complete text confirmation, HTTP solve, relevant parsing, generation, verification, formatting, D1 persistence, full response consumption and final client audits where labelled. Fixture OCR creates a scan before the complete question is supplied, so it is explicitly excluded. Production transport, real image OCR and mobile painting remain unmeasured.

## Actual HTTP batches

| Batch | Questions executed | Ready | Math pass | Quality gate | Proxy mean /100 | p50 s | p95 s | Max s | Timeout rate |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| frozen-development | 19 | 5 | 4/19 | 3/19 | 23.2 | 0.914 | 26.103 | 26.103 | 5/19 |
| frozen-held_out | 16 | 1 | 1/16 | 1/16 | 6.1 | 26.039 | 26.141 | 26.141 | 13/16 |
| validation | 8 | 6 | 6/8 | 2/8 | 68.8 | 23.593 | 26.296 | 26.296 | 2/8 |
| validation-fast | 4 | 4 | 4/4 | 2/4 | 92.2 | 14.193 | 24.500 | 24.500 | 0/4 |
| validation-final | 16 | 13 | 11/16 | 3/16 | 72.3 | 21.844 | 26.055 | 26.055 | 1/16 |
| validation-minimal | 3 | 1 | 1/3 | 1/3 | 32.7 | 26.024 | 26.033 | 26.033 | 2/3 |

Batches contain repeated validation questions and are not pooled as independent accuracy samples. `validation-fast` stopped during an isolated Worker reload; its four completed calls are retained and the setup interruption is described in the run log. Early pipeline-only results and sandbox network failures are archived separately; they are not application latency samples.

## Frozen held-out evaluation

| Specialist | n | Ready | Mathematical pass | Quality gate | Proxy mean /100 | p95 s | Max s | Critical math errors |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| algebra | 4 | 0 | 0/4 | 0/4 | 0.0 | 26.033 | 26.033 | 0 |
| geometry | 4 | 0 | 0/4 | 0/4 | 0.0 | 26.044 | 26.044 | 0 |
| number_theory | 4 | 0 | 0/4 | 0/4 | 0.0 | 26.090 | 26.090 | 0 |
| combinatorics | 4 | 1 | 1/4 | 1/4 | 24.5 | 26.141 | 26.141 | 0 |

The frozen source/configuration and dataset hashes are in `tools/specialist-training/frozen-configuration.json`. The fresh generated held-out set contains four structural families per specialist. It was created and sealed after configuration freeze; no held-out answer was inserted into prompts or algorithms. The set is small and deliberately cannot establish population generalization. Existing repository held-out exam labels were contaminated by training/test use, so those exams were not used for this claim. Four repository-transcribed PTNK2025 questions are development stress tests and never count as fresh held-out questions.

Controlled response availability is separate from mathematical success. No returned math answer is not evidence of a correct proof or zero risk. Provider queueing, hidden reasoning and output generation cannot be separated reliably from these route-level timeout traces; congestion is a hypothesis, not an established cause. No paid fallback was activated.

## Final integration after evaluation

The archived frozen evaluation finished before the final integration repairs. Its original manifest and answers are unchanged. Subsequent development-only review found an invalid PTNK2025 circle proof: an intersection can lie beyond A, changing equal-angle relations into supplementary-angle cases. The final verifier rejects undirected angle chases through unrestricted line intersections until point order or all cases are established. This also conservatively reduces coverage on the existing incircle problem (four checked claims retained, two angle-dependent claims withheld). No held-out question was rerun or used for prompt/model tuning. The final source differences are recorded separately in final-integration-manifest.json; frozen metrics describe the earlier source state.

A separate deterministic schema audit found10 invalid oversized factor tables among363 matched examples in a401-constant family. The final solver declines those tables instead of returning a broken typed lesson;353 accepted examples all pass the schema. These are local deterministic checks, not363 model requests. The mobile not_checkable warning was also restored.

The frozen development batch includes free-provider quota exhaustion. Exact counts are in metrics.json under quotaFailures. No paid provider was enabled to work around the quota.

## Findings and unresolved work

- Algebra: original-domain snapping and hint-coefficient checks now have regressions. Principal-square-root sign assumptions, false floor/division equalities and semantically misleading interpretation notes still require deeper checking. A handful of sampled identities do not prove all algebraic reasoning.
- Geometry: midpoint theorem and tangent proofs can use independently checked deterministic plans with existing constructions/highlights. Numeric geometry and difficult circle/Ceva/Menelaus questions remain heavily dependent on free inference; controlled failure is honest but not an adequate tutoring result.
- Number Theory: exact finite factor equations and one modular impossibility family are complete and fast; unsupported conditions fall through. General modular proofs, perfect powers and prime exceptions still need stronger formal checks.
- Combinatorics: small combination arithmetic and counting/profile cues improved. Counting model, overlap and exhaustive cases must still be independently inspected; a correct count does not excuse false intermediate divisions or unclear order assumptions.
- Language: all displayed fields are scanned for observed scripts/terms and known leakage is repaired or rejected. Unseen Latin foreign words, natural phrasing and valid Vietnamese terms require teacher review. A heuristic detector is not a language guarantee.
- Formatting: schema and KaTeX checks cover returned final lessons. KaTeX logged missing Vietnamese character metrics in some math text; native layout/glyph rendering and full XeLaTeX/LuaLaTeX document compilation remain unmeasured. Reports preserve actual invalid outputs as failures rather than replacing them with ideal answers.
- Deadline: observed local responses are measured below30s where shown. Route and unresponsive-provider regression tests support the timeout architecture. This is not a universal production guarantee against event-loop stalls, transport delays or every future question.

## Validation and review

Final engineering checks: 471 Worker tests across30 files, two mobile tests, shared/Worker/mobile typechecks and mobile lint. Geometry dragging/construction regressions are included. The midpoint verifier rejects a corrupted one-third-length conclusion; finite integer tests include a positive square counterexample to an overbroad proposed rule.

See [meaningful code changes](changes.md), [manual test guide](README.md#manual-student-checks), the four specialist reports and [feedback template](feedback-template.md). No deployment or model-weight training was performed. Read the reports and write feedback before requesting the next iteration; held-out failures should move into later development with a new sealed evaluation set.
