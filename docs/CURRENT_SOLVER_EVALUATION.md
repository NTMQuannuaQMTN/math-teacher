# Current solver on Toán chuyên papers

Results: `experiments/current_solver_results.json` (measured only). Method: docs/SOLVER_EVALUATION.md
(deterministic grading, no LLM judge).

**Headline: there is not enough evidence to say the solver handles chuyên papers.** Complete measurements
exist for **one** chuyên paper (PTNK 2026, 5 multi-part questions, 2 systems), three real website solves
of the same paper, and **two** items of a second paper. The held-out test papers (Hà Nội, KHTN) were
**not run**: the hosted free quota was exhausted at 10:40 UTC, and the local run was stopped at 24%
battery with the laptop sleeping.

## 1. What was measured

### PTNK 2026 chuyên (validation): 5 questions, 12 parts

| Question | Topic, level | Hosted Nemotron free (EXP-010) | Local Qwen3.5-9B (EXP-004b) |
|---|---|---|---|
| Câu 1 quadratics with parameters | algebra, specialized | PARTIAL: correct, not checkable, 46 s | PARTIAL: correct, not checkable, 3,314 s |
| Câu 2 quadrilateral max perimeter | geometry calc., specialized | PASS, 249 s (but mentions derivatives) | PASS, 415 s; **another run (EXP-008) answered 10√2 (wrong) and was shown as verified** — fixed by the restatement rule |
| Câu 3 f(n) divisibility | number theory, specialized | PASS, 76 s | PASS, 587 s |
| Câu 4 incircle proof | geometry proof, olympiad | **FAIL: truncated** (all reasoning, no answer) | **FAIL: unverified** (false angle claims caught) |
| Câu 5 magic-square numbers | combinatorics proof | PASS, 58 s | PASS, 488 s |
| **Total** | | 3 PASS · 1 PARTIAL · 1 FAIL · 0 CRITICAL | 3 PASS · 1 PARTIAL · 1 FAIL · 0 CRITICAL |

### Real website solves (hosted, PTNK 2026 Câu 1–3, D1 + logs)

All three ended verified and correct, in 232 s, 207 s and 362 s (1–2 attempts). Problems found:
- one earlier Câu 1 solve failed after 360 s with two empty outputs;
- Câu 2 was solved with coordinates and calculus;
- the Vietnamese mixed in Chinese words and lost diacritics.

All three are now handled: effort step-down, the grade-level retry, and the language fixes.

### TP.HCM 2025 chuyên (validation): local Qwen, stopped (CHB-001)

| Item | Result |
|---|---|
| 1a radicals with constraint (P = 8) | PASS, verified, 2 attempts, 652 s |
| 1b Vi-ét elimination (−1) | PARTIAL: correct but unverified, 2 attempts, 538 s |
| 2a motion word problem | stopped after > 7,500 output tokens (a runaway on a short problem) |
| 2b, 5a | not run |

## 2. Breakdown (what the small sample suggests)

| Slice | Evidence | Reading |
|---|---|---|
| Algebra / number theory (computational) | 6 of 6 correct answers across systems | the models know the methods; verification often PARTIAL because checks are malformed or missing |
| Geometry calculation | Câu 2: correct in 3 of 4 runs; one wrong-but-"verified" (fixed) | correct answer, risky methods (coordinates/calculus) |
| Geometry proof (olympiad) | Câu 4: 0 of 2 | the main failure: truncation (hosted) or false claims (local) |
| Combinatorics proof | Câu 5: 2 of 2 PASS | sample of one problem |
| Calculation vs proof | calculation answers correct; hard proofs fail | |
| Standard vs specialized vs olympiad | specialized: mostly correct; olympiad: failed | |
| School / year | one complete paper | no cross-school comparison possible |

## 3. Failure categories observed (all runs today, chuyên problems)

| Category | Count | Example |
|---|---:|---|
| Timeout / truncation (output budget) | 2 | Câu 4 hosted (12K tokens of reasoning, twice); TP.HCM 2a local runaway |
| Invalid proof (false claim) | 1 | Câu 4 local: three false angle claims, caught by the verifier |
| Incorrect final answer | 1 | Câu 2 local (EXP-008): 10√2, wrong inequality direction |
| Wrong answer shown as verified (CRITICAL) | 1 → 0 | the same; fixed by the restatement rule |
| Excessive sophistication | 2 | Câu 2 hosted: derivatives / coordinates |
| Output formatting (language) | 3 | Chinese / Portuguese words, missing diacritics |
| Output formatting (checks) | several | value checks with variables, comma lists (partly salvaged now) |
| Empty output | 2 | website Câu 1, Câu 3 first attempts |
| OCR / parsing | 0 | inputs were typed or transcribed |
| Missing knowledge / wrong technique | 0 clear cases | the methods chosen were school methods, except the "excessive sophistication" cases |

## 4. Latency and cost

Hosted: 46–249 s per question in the benchmark, 207–362 s on the website, $0 (free tier, ≈ 50 requests/day).
Local: 7–55 min per question on this laptop (battery, Low Power Mode). Not a serving option here.

## 5. Uncertainty

With n = 5 questions on one paper, a 3/5 PASS rate has a 95% interval of roughly 15–95%. Nothing here
supports a claim about chuyên papers in general. The next measurement that matters is the held-out test
(Hà Nội + KHTN, 20 problems, 10 auto-gradable) with the served model:

```bash
cd worker
npx tsx scripts/benchmark.ts or-nemotron-3-super --dataset chuyen --split test --exp CHT-001               # ≈ 25 requests
npx tsx scripts/benchmark.ts or-nemotron-3-super --dataset chuyen --split test --techniques --exp CHT-002  # method cards
```
