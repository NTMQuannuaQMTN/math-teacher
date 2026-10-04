# PTNK 2025–2026 Toán chuyên: real-exam evaluation

Status: **interim**. 6 of 13 sub-questions were solved and graded on 2026-10-04 before the free daily quota ran
out. Bài 3b–3c, 4 (geometry) and 5 (combinatorics) are pending (§8).

## 1. Source

| | |
|---|---|
| Reference | STAR Education, "Đáp án tham khảo đề thi tuyển sinh lớp 10 PTNK 2025–2026, môn Toán chuyên": https://star-education.net/hot-news/dap-an-de-thi-toan-chuyen-ptnk-2025-2026/ |
| Exam | Trường Phổ thông Năng khiếu (ĐHQG-HCM), thi ngày 26/5/2025, Toán chuyên, 150 phút |
| Retrieved | 2026-10-04 — page with curl; exam + solutions are 6 PNG images (1654×2339), read visually |
| Available | all 5 bài / 13 sub-questions with solutions; two figures (Bài 4), colourings (Bài 5) |
| Stored | locally only (`data/exams/raw/ptnk-2025-star/`, gitignored), checksums in `data/exam_sources.json` |

**Transcription check against the official paper** (`ptnk-2025-chuyen-de`, ptnk.edu.vn). STAR notes their copy was
collected from students. Differences:

- Bài 4: STAR omits "nhọn" (acute).
- Bài 5: STAR reorders a turn. Officially An moves to a new adjacent cell first, then Bình asks; in STAR's version
  Bình asks first. The exact search below gives the same bounds either way.
- Bài 2: the conditions are paraphrased.

The solver input is the official wording (dataset `chuyen-v1`); STAR is used only as the reference.

**Independent check of the reference answers** (`tools/exams/verify_ptnk2025.py`):

| Item | Result |
|---|---|
| 1b | holds; numerically the minimum of $x_1^4+x_2^4$ is ≈ 6.05 (the bound 9/2 is not tight) |
| 1c | $m=-1$ is the only value in [−5, 5] |
| 2b | $T_{\min}=19/4$, reached by **two** writings — STAR's conclusion names one |
| 3a–3c | match (exhaustive for $m\le 3000$, $n\le 200$) |
| 4a–4c | hold in 2,000 random configurations satisfying the hypotheses (worst deviation 3·10⁻⁷°) |
| 5 | exact search over An's possible cells: Bình wins within 6 turns for k = 4 (bound 8), and within exactly 16 for k = 2 (tight) |

## 2. Leakage — read before using these numbers

**This is not an unseen exam.** All 13 sub-questions are in the **train** split of `chuyen-v1`. During the chuyên
sprint (2026-10-01), teaching records were written for 1a–3b (7 items) and exported as SFT examples; no model was
trained on them. The solver's input contains nothing from this exam (checked: prompt, knowledge base, method cards;
method cards were off for this run). The fixes in §6 were found on this exam. **Results after those fixes are
development-set performance, not independent evaluation.** Unseen evaluation needs the test split or a new exam
(e.g. PTNK 2026, already in `data/exams`).

## 3. Conditions

- System `or-nemotron-3-super-prod`: the free hosted model with exactly the app's settings (`hostedModelOptions`:
  effort by tier, 24K tokens / 240 s per request for complex problems) and the local server's 420 s limit.
- Prompt `solver-v2.8`. At most 2 attempts. Run `PTNK25-1` (`tools/benchmark/results/PTNK25-1_*.json`).
- Graded by hand against the independent checks, reading every hint and step (`worker/scripts/review-dump.ts`).

## 4. Per-question results (run PTNK25-1, as served)

| ID | Domain | Concepts | Techniques (declared) | Curriculum | Final answer | Reasoning | Vietnamese | Verification (served → after §6) | Failure notes |
|---|---|---|---|---|---|---|---|---|---|
| 1a | algebra | Δ, two distinct roots | discriminant | pass | correct | complete | needs improvement | verified → **partial** | "verified" came from evaluating Δ at m = 0 only, which overclaims a "với mọi m" proof; calques "phép mở rộng", "hạng tử đồng loại"; ∀ in a formula |
| 1b | algebra (A4) | Viète, Bunhiacopxki, completing the square, equality case | vieta, cauchy_schwarz, complete_square, equality_case | **fail** | correct | complete (equality cases m = −1 vs m = −½ handled) | needs improvement | not_checkable → **unverified** | Bunhiacopxki explained "với vectơ (1,1) và (x₁², x₂²)"; the retry for it was the last attempt (attempt 1 truncated at 24K tokens). The school route $(a-b)^2\ge0 \Rightarrow a^2+b^2\ge\frac{(a+b)^2}{2}$ exists; "hạn chế dưới" |
| 1c | algebra | Viète, $f(t)=t+\sqrt{t^2+1}$ | substitution, vieta, domain_conditions | uncertain | correct ($m=-1$) | **invalid** | **unsuitable** | not_checkable | step 2 claims $\sqrt{b^2+1}>\sqrt{a^2+1}$ for $a<b$ "vì hàm căn tăng" — false for negative numbers; argued through monotone/injective functions (beyond Grade 9, where an elementary rearrangement works); "tăngStrict", "injective", "diferen"; typo $\sqrt{x_2+1}$; answer check malformed |
| 2a | algebra (system, mixed) | system of linear equations, distinctness | substitution | pass | correct (2, −2, 3, 0) | complete | suitable (one `\text{with}`) | verified | — |
| 2b | algebra (A5) | completing the square, case analysis | substitution, complete_square | pass | correct ($19/4$, **both** writings) | complete | needs improvement | unverified → **verified** | served as unverified because of a **false positive in our derivation check** (two labelled cases read as one derivation), which also cost a retry; "feit", "corresponding". "Verified" covers the value at the optimum, not minimality |
| 3a | number theory | divisibility, quadratic in m, Δ a perfect square | substitution, discriminant, factorization, case_analysis | pass | correct (no m) | complete (minor: omits the symmetric factor pairs, which give the same values) | **unsuitable** | not_checkable | Chinese "項" and "vše" kept: the retry that would have removed them hit the quota. Longer than needed: $3m \mid m^2+m+9 \Rightarrow m \mid 9$ settles it |
| 3b, 3c | number theory | — | — | — | not run | — | — | — | daily quota exhausted |
| 4a–4c | geometry | — | — | — | not run | — | — | — | daily quota exhausted |
| 5a, 5b | combinatorics | — | — | — | not run | — | — | — | daily quota exhausted |

## 5. Summary (6 evaluated sub-questions; no combined score)

| Dimension | Algebra (1a–2b, 5) | Number theory (3a, 1) | Geometry (0) | Combinatorics (0) |
|---|---|---|---|---|
| Final answer correct | 5/5 | 1/1 | — | — |
| Reasoning complete and valid | 4/5 (1c invalid) | 1/1 | — | — |
| Curriculum: pass / fail / uncertain | 3 / 1 / 1 | 1 / 0 / 0 | — | — |
| Vietnamese: suitable / needs improvement / unsuitable | 1 / 3 / 1 | 0 / 0 / 1 | — | — |
| Verification label honest as served | 3/5 (1a overclaimed; 2b wrongly unverified) | 1/1 | — | — |

Fully successful (correct, complete, in the curriculum, suitable Vietnamese): **2a only (1/6)**. Correct final
answers: 6/6. The gap between the two is the main finding.

Time: 29–54 s of model time per item; 4 of 6 needed a second attempt.

## 6. Fixes made from these failures (general rules, not exam-specific answers)

| Failure | Fix | Test |
|---|---|---|
| 2b false positive (our own regression from the derivation check) | a line with its own leading label ("Trường hợp 2: …") starts a new statement and is not compared with the line above | `optimization.test.ts` |
| 1a "verified" for a proof | a problem that only asks for a proof is at most "partial" | ✓ |
| 1b kept a forbidden method after its last retry | a surviving out-of-curriculum method adds a failed check, so the lesson is "unverified" | ✓ |
| 1c / 2b / 3a foreign words | glossary fixes (項 → hạng tử, "tăngStrict", "corresponding", calques "hạng tử đồng loại", "phép mở rộng", "hạn chế dưới"); remaining English words are sent back for a retry. On all 173 stored/benchmark lessons this flags 4, all genuine (incl. one HCM lesson with an English strategy) | ✓ |

**Not fixed:** 1c's invalid monotonicity step. No deterministic check can judge that argument; it needs a better
model or human review. This is exactly the kind of error the "Báo lỗi" button is for.

Re-checking the same six lessons with the fixed verifier (no new model call): 1a verified → partial, 1b →
unverified, 2b → verified. This is a **re-verification**, not a re-solve; whether the retries now produce better
lessons needs a new run under the same conditions.

## 7. Geometry (Bài 4)

Not yet run. The configuration was checked independently (§1): all three claims hold in 2,000 random valid
configurations. When it runs, the plan is to check each of these with the review dump and `figureCoverage`:

- the construction order (O, A, B, C → D on the minor arc AC with CD > AB → E, F on the perpendicular bisectors →
  I → S → R, K);
- every object named in a step is drawn, and selecting the step highlights it;
- the givens (Â > B̂ > Ĉ, acute, CD > AB) hold in the drawn figure;
- each claim (A, D, E, F, O concyclic; the altitude point on (O); ∠RKD = 90°; DK through the midpoint of IR) is
  measured on the exact figure.

## 8. To finish

After the quota resets (08:00 local):

```
cd worker && npx tsx scripts/benchmark.ts or-nemotron-3-super-prod --dataset chuyen \
  --ids ptnk-2025-chuyen_1a,…,ptnk-2025-chuyen_5b --exp PTNK25-2
npx tsx scripts/review-dump.ts ../tools/benchmark/results/PTNK25-2_or-nemotron-3-super-prod_chuyen_ids.json
```

PTNK25-2 runs with the §6 fixes. Report it separately from PTNK25-1, and label it **development-set**.

## 9. What this does and does not show

Passing this exam is not production readiness. With n = 6, all from one exam the system has seen during
development, these numbers can't support an accuracy claim. Two things are clear even at this size: the free model
usually reaches the right answer, and a correct answer was accompanied by invalid reasoning, out-of-curriculum
wording or foreign words in 4 of 6 cases. The verifier can now flag the wording and labelling problems; it can't
judge whether an argument is valid.
