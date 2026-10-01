# Solution verification

Historical answer keys are not ground truth by default. Every answer in the chuyên dataset was checked
independently, and every record states how far that check goes.

```bash
python3 tools/exams/verify_exams.py     # 43 checks, ~1 min; writes data/exams/verification.json
python3 tools/benchmark/ground_truth.py # PTNK 2026 items (ch-1 … ch-5) and the rest of dataset v1
```

## 1. Status vocabulary

| `answer_status` | Meaning | Count |
|---|---|---:|
| official | answer taken from the issuing school's key or marking guide (incl. PTNK 2026 = benchmark ch-1…ch-5) | 39 |
| teacher | answer from a named teacher's published solution | 20 |
| derived | no source answer obtained (PTNK 2025): derived here | 13 |

`profile.solution_verified` combines the source with the check:

| Check | Meaning |
|---|---|
| `+computed` | an automated check in `verify_exams.py` (or `ground_truth.py`) confirms the answer |
| `+manual_review` | a proof, geometry or game strategy: no automated check; the source argument was read, not machine-verified |

Counts: 49 records `+computed` (official 28, teacher 13, derived 8); 23 `+manual_review` (official 11,
teacher 7, derived 5). Neither label means "teacher-verified": no teacher has reviewed this dataset yet.

## 2. Methods

| Method | Used for | Strength |
|---|---|---|
| Exact (SymPy) | systems, identities, extrema with a closed form, the PTNK 2025 Câu 2 minimum | proof-level for the stated claim |
| Exhaustive search | finite combinatorics: all 2¹⁶ colourings (PTNK 2023 B3), all 1,034,817 square-sum-free boxes (PTNK 2024 B5b), the probability in TP.HCM B5a | proof-level |
| Bounded search | number theory "for all n" claims (m < 200,000; n < 400; …) | strong evidence, not a proof |
| Random sampling of the constraint set | inequalities to prove (100k–200k samples) | evidence only; catches a false statement, cannot prove a true one |
| Witness check | an example attaining the bound (KHTN IV set, PTNK 2024 B5a, Hà Nội III.1b) | proves attainability only |

## 3. Results

43/43 checks pass (`data/exams/verification.json`). Every official and teacher answer that a computation
can test agrees with the computation. Highlights:

- **PTNK 2023 B3b**: the official maxima (4 good pairs by columns, 11 by rows) are confirmed over all 2¹⁶
  colourings. The tempting answer 12 for rows is impossible.
- **PTNK 2024 B5b**: the statement is confirmed for every one of the 1,034,817 ways to fill one box without
  a square sum.
- **KHTN 2025 I.1**: the solutions x = 0 and x = 1 are points where the function touches zero without
  crossing, so a sign-change root search finds none. That is a useful warning for our own numerical
  verifier: substitution catches these roots, root-finding does not.
- **PTNK 2025** (no official key): all algebra and number-theory answers derived and confirmed. Câu 4
  (geometry) and Câu 5 (search game) are unreviewed proofs.

## 4. Errors found in the sources

| Source | Location | Error | Effect |
|---|---|---|---|
| PTNK 2023 official key | Bài 3a | "0 + 1 + 2 + 3 + 4 = 22" (the sum is 10) | none: 10 ≡ 2 (mod 4) too, so the conclusion stands |
| PTNK 2024 official key | Bài 3b | the odd case is labelled "nếu n chẵn" | none for the answer (n odd) |
| PTNK 2024 official key | Bài 1.1 | "Do y² + yz + z² ≥ 0 nên y = z" omits the "+ 1" that makes the factor positive | gap in the argument; the answer is correct |
| KHTN 2025 teacher solution | Câu IV | "(ab + ac)/(b + c) = 2a" — it equals a | the argument still holds (a would be rational) |
| TP.HCM 2025 text layer | Bài 1b | the PDF's text layer renders the answer as "1"; the page reads −1 | transcription risk, avoided by reading page images |

None of these changes a final answer. They show why a training target should be a checked teaching
solution, not a copy of the key.

## 5. Official answer, verified solution, teaching solution

For each problem the dataset keeps these separate:

- **official_answer**: the source's final answer, verbatim in meaning (null when no source answer was obtained);
- **answer**: the answer used for grading, which agrees with the official one wherever both exist;
- **key_insight / techniques**: Claude's annotation of the reusable idea (not copied from the key);
- **teaching solution**: written per problem only for the training set, from the verified answer and the
  insight, in the app's lesson format. The key's wording is not used as a target. See TRAINING_DATASET.md
  for how much of this exists so far.

## 6. What still needs a person

- Proofread the 67 transcriptions against the page images (`ocr_status = transcribed_needs_review`).
- Review the 23 proof, geometry and game records that only have `manual_review`.
- Review the knowledge annotations (`annotation_status = claude_annotated_needs_teacher_review`).
