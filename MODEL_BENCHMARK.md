# Model benchmark

Measured results only; "—" means not measured. Same prompt (solver-v1.7), same lesson schema, same
deterministic verifier (v2) and grader for every system. Grades: PASS / PARTIAL / FAIL / CRITICAL
(see EXPERIMENT_LOG.md). Dataset v1 (DATASET.md). Raw rows are in `tools/benchmark/results/`.

## Solver: candidate matrix

| Model | Params | Vietnamese | Math: final answers correct (validation) | Reasoning (validation grades, verifier v2) | Vision (OCR) | JSON | Hosting | Cost / problem | Test split (held out) |
|---|---:|---|---|---|---|---|---|---:|---|
| Gemini 3.5 flash-lite → 3.5 flash (current prod) | — | good (fluent, "bạn") | 10/10 (dev data*) | 10 PASS · 0 PARTIAL · 1 FAIL (no lesson stored) · **0 CRITICAL** (dev data*) | yes: 3.1 flash-lite 16/17 | native strict | API | **≈ $0.039** (model mix); $0.004 easy … $0.32 hard proof | not measurable (Gemini disabled) |
| Qwen3-4B Q4_K_M (local) | 4B | adequate | 1/5 checkable (7 of 11 run) | 0 PASS · 2 PARTIAL · 5 FAIL · 0 CRITICAL | no | grammar + repair needed | local / self-host | $0 API; hosted n/a | not run (not viable) |
| **Qwen3.5-9B Q4_K_M (local)** | 9B | good (fluent Vietnamese, followed "bạn") | **7/8** | **6 PASS · 3 PARTIAL · 2 FAIL · 0 CRITICAL** | yes: 16/17 single problems (CER 0); 0/3 dense exam pages | grammar + repair | local / hosted ($0.10 · $0.15 per M) | $0 local; **≈ $0.002 hosted** (measured 9.5K in / 6.6K out) | EXP-005 (running) |
| Gemma-4-12B-it Q4_K_M | 12B | — | — | — | yes (not run) | — | local / hosted | — | — |
| Hybrid: Qwen3.5-9B → Gemini when not verified (offline simulation) | — | — | — | **11 PASS · 0 CRITICAL**; Gemini used on 5/11 (45%) | — | — | hosted + API | ≈ $0.002 + 45% × Gemini (validation is hard-heavy) | Gemini part not measurable |

\* Development data: these problems were used to tune the prompt and verifier, so Gemini's validation
numbers are optimistic. Qwen models never saw them during development.

Latency on this Mac (Apple M5, 24 GB, llama.cpp Metal, Q4_K_M): Qwen3-4B 38 tok/s; Qwen3.5-9B
12–20 tok/s → **mean 14 min per validation problem** (2 attempts, long proofs up to 25 min). This is
a development machine, not a serving setup. A hosted endpoint or GPU serves the same model at
100+ tok/s per stream.

## OCR

| Provider / model | Fixtures 01–17 (single problems) | Mean CER | Median latency | Dense exam pages (18–20) | Cost / photo |
|---|---|---|---|---|---|
| OpenAI gpt-4.1(-mini) (stored run) | 17/17 | 0.005–0.007 | 2.2 s | — | ≈ $0.0011 |
| Gemini 3.1 flash-lite (stored run, current prod) | 16/17 | 0.012 | 3.7 s | — | ≈ $0.0008 |
| Qwen3.5-9B + mmproj (local) | 16/17 (injection transcribed correctly, wrong status) | ≈ 0.005 | 28 s | 0/3 (CER 0.49 / timeout / 0.22) | $0 local |
| **PaddleOCR-VL-1.6, 0.9B (local, text mode + deterministic parser, logprob confidence)** | **17/17** | **≈ 0.011** | **3.1 s** | **3/3** (CER 0.014 / 0.091 / 0.096; split 9 / 6 / 5 questions), 19–23 s per page | $0 local |

PaddleOCR-VL numbers are end to end through the worker on the same machine (battery, Low Power Mode).
Caveat: its page parser and blur threshold were tuned on these 20 fixtures, so new photos are the
real test.

## Cost per volume (from `tools/benchmark/cost_model.py`; tier mix 60% easy / 33% standard / 7% hard)

| Option | 1 | 10 | 100 | 1,000 | 10,000 |
|---|---:|---:|---:|---:|---:|
| Current Gemini (flash-lite → flash) | $0.039 | $0.39 | $3.91 | $39.06 | $390.61 |
| Gemini flash-lite only | $0.012 | $0.12 | $1.18 | $11.80 | $118.04 |
| Hosted Qwen3.5-9B only | $0.001 | $0.011 | $0.11 | $1.05 | $10.54 |
| Hosted Qwen3.5-9B → Gemini flash on 30% | $0.014 | $0.14 | $1.43 | $14.33 | $143.34 |
| Self-hosted GPU, always on (assumed $0.80/h) | $576/month fixed; below hosted APIs only above ~550K problems/month | | | | |

OCR adds ≈ $0.0008/photo with Gemini ($0 with a local model); repeat problems cost $0 thanks to the
shared lesson library.
