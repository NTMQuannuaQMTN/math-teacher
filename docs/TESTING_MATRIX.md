# Testing matrix

Each testing requirement from the product specification (section 13) and where it is covered.
Counts are as of 2026-10-29: 340+ pytest tests, 4 Node engine tests and 12 Playwright tests (desktop + mobile).

## Tooling

| Requirement | Where |
| --- | --- |
| pytest unit + integration | `services/api/tests/` (real PostgreSQL, real tool sandbox) |
| Hypothesis property tests | LaTeX normaliser idempotence (`test_latex.py`), budget invariants under random operation sequences (`test_budget.py`), parser robustness and quadratic root sets (`test_tools.py`), geometry drag invariants (`test_geometry.py`) |
| Playwright E2E | `apps/web/e2e/review.spec.ts`: upload → review → confirm → hints → tutoring → reveal; geometry drag; isolation; mobile layout |
| Golden OCR / LaTeX fixtures | `tests/fixtures/ocr/recorded` + `test_segmentation.py` (synthetic, labelled); live golden test `test_live_ocr.py` (`-m live`) |
| Benchmark with vetted solutions | `benchmarks/authentic/` (72 sourced questions, 16 with machine-checkable answers), `scripts/run_benchmark.py`, `benchmarks/REPORT.md` |
| Deterministic verifier suite | `benchmarks/synthetic/verifier_cases.jsonl` (39 synthetic cases) + `test_verifier_suite.py`: a wrong answer is never VERIFIED |
| Geometry invariant tests | `test_geometry.py` (drag invariants, givens kept under drag), `apps/web/lib/geometry/engine.test.ts` (Python parity, branch continuity) |
| Curriculum compliance tests | `test_solving.py` (prohibited / allowed / style rules, declared techniques), `test_tutoring.py` (tutor hints) |
| API security tests | `test_api_auth.py` (tokens, Turnstile, gateway secret, rate limits), cross-user isolation in `test_api_documents.py`, `test_api_solve.py`, `test_geometry.py`, `test_tutoring.py`; upload hardening in `test_ingest.py` |
| Cost-limit and concurrency tests | `test_budget.py` (50 concurrent reservations, per-user cap, restricted mode, stale reservations), `test_gateway.py` (charging rules), `test_queue_admin_config.py` (SKIP LOCKED claims) |
| 200-question benchmark structure | `benchmarks/manifest.json` (targets 50 × 4; 72 authentic so far, synthetic kept separate) |

## Required test cases

| Case | Covered by |
| --- | --- |
| Incorrect OCR | `test_api_documents.py::test_review_edit_confirm_and_conflicts` (edits keep `ocr_latex`), E2E "fix unclear notation" |
| Ambiguous handwriting | `\unclear{}` blocks confirmation (`test_latex.py`, `test_segmentation.py` handwritten/low-confidence flags) |
| Invalid LaTeX | `test_latex.py` (errors and Hypothesis), E2E "invalid LaTeX blocks confirmation" |
| Incorrect classification | Student topic edits (`test_api_documents.py`), model topics over keywords (`test_segmentation.py`), mixed topics (E2E) |
| Multiple valid solutions | Solution-set checks with several roots / systems (`test_tools.py`, verifier suite); the tutor judges the student's own approach (prompt rule). **Gap:** no automated test that a different valid method is accepted |
| Extraneous roots | `test_tools.py`, verifier suite (`radical-extraneous`), tutoring step check (squaring reports the extra root) |
| Invalid algebraic transformations | `test_tutoring.py` step checker (dividing by x, arithmetic slips, wrong expansions) |
| Unsupported mathematical methods | `test_solving.py` (calculus, vectors, complex numbers, matrices, transformations, advanced theorems), tutor hint replacement |
| Impossible geometry constraints | `test_geometry.py::test_impossible_constraints_are_infeasible`, verifier suite `geometry-impossible` |
| Degenerate diagrams | `test_geometry.py` degenerate constructions (culprit named), browser engine `Degenerate`, drag refusal (manual guide) |
| Geometry drag invariants | Hypothesis drag test, givens under drag (Python + TypeScript), Playwright drag keeps OM ⊥ BC |
| Unverifiable proofs | `test_solving.py` (proofs ≤ PARTIALLY_VERIFIED, no template → UNVERIFIED), verifier suite |
| API timeouts | `test_soclaas.py` (timeout → retryable, connect error → released), `test_gateway.py` (bounded retries, timeout charged), job reaper (`test_queue_admin_config.py`) |
| Budget exhaustion | `test_budget.py`, `test_gateway.py`, OCR (`test_api_documents.py`), solving (`test_api_solve.py`), restricted mode fallback (`test_solving.py`) |
| Concurrent requests | `test_budget.py` concurrency tests, `test_queue_admin_config.py` concurrent claims |

## How to run everything

```bash
cd services/api && uv run pytest -q                    # unit + integration + verifier suite
uv run pytest -m live                                   # live SoCLaaS OCR golden test (needs key)
uv run python scripts/run_benchmark.py && uv run python scripts/benchmark_report.py
cd ../../apps/web && npm run test:unit && npm run build && npx playwright test
```
