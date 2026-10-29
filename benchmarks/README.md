# Benchmarks

## Contents

| Path | What |
| --- | --- |
| `authentic/exams-2023-2026.jsonl` | 72 questions from published entrance papers: PTNK 2023–2026, Hà Nội 2025, HCM 2025, KHTN 2025 (vòng 2). One JSON object per question. |
| `authentic/sources.json` | Source of each paper: official URL, access date, SHA-256 of the downloaded file. |
| `manifest.json` | Target (50 per topic, 200 total) and current counts. |
| `synthetic/verifier_cases.jsonl` | 39 labelled synthetic cases for the deterministic verifier (`tests/test_verifier_suite.py`). Never mixed into the authentic set or its scores. |
| `results/` | Raw output of `services/api/scripts/run_benchmark.py`, one file per run. |

Each authentic item records its provenance (`exam`, `school`, `year`, `source_url`, `page`), the reference answer
and its status (`official` = from the published answer key, `teacher` = from a teacher's solution, `derived` = worked
out during collection), and its transcription status. `expected` holds a machine-checkable answer for 16 items, used
for automatic scoring. The remaining items (mostly proofs) are scored on verification and curriculum status only.

Coverage against the 200-question target: algebra 21/50, geometry 21/50, number theory 16/50,
combinatorics 10/50, plus 4 items outside the four topics. Phase 6 fills the rest from real papers.

## Running

```bash
cd services/api
uv run python scripts/run_benchmark.py --only-expected --concurrency 4
uv run python scripts/run_benchmark.py --topic number_theory
```

Calls the real SoCLaaS API; every call is reserved and charged in the budget ledger like the app.

## Results so far (16 machine-checkable items)

| Run (2026-10-21) | Correct | VERIFIED | Partially | Unverified | False VERIFIED | Mean cost | Mean time |
| --- | --- | --- | --- | --- | --- | --- | --- |
| no reasoning escalation | 6 | 1 | 0 | 15 (10 failed runs) | 0 | SGD 0.009 | 99 s |
| + reasoning escalation | 15 | 3 | 2 | 11 | 0 | SGD 0.039 | 144 s |
| + verification fixes | 13 | 4 | 7 | 5 | 0 | SGD 0.048 | 181 s |

Run-to-run variance on the hardest items is real (15 vs 13 correct). The wrong answers in the last run were all
labelled UNVERIFIED, never VERIFIED.
