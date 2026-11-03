# Past-paper research loop: state

Loop window: 2026-11-02 21:48 → 2026-11-03 05:48 (+08); the session sat idle overnight after iteration 1, so on
the user's "continue" the window was extended to 2026-11-03 17:00 (+08). Live-model budget for the loop: SGD 2.00.
Evidence goes to [PAST_PAPER_FINDINGS.md](PAST_PAPER_FINDINGS.md). A finding changes the pipeline only when it is seen
in at least two independent official (or official + reputable) sources.

## Queue (take 1–2 per iteration)

1. [x] Curriculum baseline: Chương trình GDPT 2018 môn Toán, lớp 9 content list (MOET), what moved in/out vs the
   old programme (e.g. phép quay, xác suất, căn bậc ba, hàm số y=ax²). Exams from 2025 follow it.
2. [x] Marking-guide structure (Hà Nội 2025 + HCM 2025 đại trà; figure rule S10+S11+S14; 'công nhận ý trên' contradicts between S10 and S14; first-error rule still S10 only): Sở GD HCM / Hà Nội hướng dẫn chấm (general rules: "cách khác đúng vẫn cho đủ điểm",
   splitting points, what loses points).
3. [x] Algebra (radicals, equations, systems): official keys Hà Nội, HCM, ĐHSP, KHTN vòng 1.
4. [x] Inequalities / extrema: KHTN, PTNK, ĐHSP keys: named inequalities used (Cô-si, Bunhiacopxki, Schur?, SOS?),
   whether lemmas are proved inline, equality-case write-up.
5. [x] Number theory: Fermat nhỏ / đồng dư / Legendre / Viète jumping in official keys? Phrasing of chia hết.
6. [~] Combinatorics (S4, S5, S9 read; more keys welcome): Dirichlet, bất biến, cực hạn, tô màu, counting; do keys use graph language?
7. [x] Geometry: theorems cited without proof (Menelaus, Ceva, Ptolemy, phương tích, Simson, Euler line?),
   cyclic-quadrilateral criteria phrasing, figure conventions.
8. [x] Functions / parabola (P): y = ax², (d), giao điểm (non-chuyên Sở papers).
9. [x] Vi-ét with parameter (S2 + S14 Thanh Hóa: condition from Δ, Vi-ét system, thỏa mãn/loại — applied, F19): conditions write-up (Δ ≥ 0 / Δ > 0, a ≠ 0), "đối chiếu điều kiện".
10. [x] Systems of equations: substitution / symmetric systems write-up.
11. [x] Word problems (bài toán thực tế, giải bài toán bằng cách lập phương trình): required structure.
12. [x] Probability / statistics (new in GDPT 2018 lớp 9).

## Remaining work (after iteration 24)

The research questions are answered (see the summary at the top of PAST_PAPER_FINDINGS.md). Remaining iterations mine
official keys (2022–2025, chuyên and đại trà) for benchmark items with machine-checkable official answers, re-deriving
each answer, and watch for a second source on the open items.

## Pipeline targets

- `services/api/app/curriculum/policy_v1.json` (allowed / discouraged / prohibited / style) + tests in `tests/test_solving.py`
- `services/api/app/solvers/<topic>/__init__.py` GUIDANCE
- `services/api/app/solvers/prompts.py` SOLVE_SYSTEM, hint prompts
- `docs/NOTATION.md`
- `benchmarks/authentic/*.jsonl` + `sources.json` (official answers only)

## Log

| Iteration | Time (+08) | Done | SGD spent (loop total) |
| --- | --- | --- | --- |
| 1 | 21:48–23:00, 09:40–10:00 | S1 GDPT 2018 lớp 9 programme, S2 Hà Nội 2025 official đáp án. Applied: phép quay → discouraged (policy v1.2), ≈ in symbol bar + NOTATION, probability/statistics + measurement guidance. Tests 359 pass. | 0.00 |
| 2 | 09:56–10:01 | S3 HCM 2025 đại trà official hướng dẫn chấm. Applied: SOLVE_SYSTEM rule 6 (official notation), algebra guidance (Vi-ét, word problems), geometry guidance (reasons, cyclic via diameter circle); 4 benchmark items with official answers (76 items, 20 machine-checkable). Tests 359 pass. | 0.00 |
| 3 | 10:02–10:05 | S4 HCM 2025 chuyên official HDC, S5 PTNK 2023 official đáp án. Applied: algebra (elementary inequality forms), number theory (factor/parity/TH cases/divisibility bound/contradiction), geometry (bổ đề + proof, area ratios). Tests 359 pass. | 0.00 |
| 4 | 10:06–10:12 | S6 HCM 2024 đại trà official HDC, S7 Hà Nội 2026 official short key. Applied: (P)/(d) write-up, coordinate format (1; −1) in SOLVE_SYSTEM; 3 benchmark items (79 items, 23 machine-checkable). Third-party keys (fqa.vn, toanmath lời giải for Nghệ An/Đà Nẵng) skipped as non-official. Tests 359 pass. | 0.00 |
| 5 | 10:14–10:17 | S8 HCM 2023 đại trà official HDC (scanned, stamped). Applied: collinearity via 180° adjacent angles (S4+S8); 2 benchmark items (81 items, 25 machine-checkable). PTNK Toán chung / HCM 2022 URLs not found. Tests 359 pass. | 0.00 |
| 6 | 10:19–10:23 | Live spot check (2 HCM 2024 items: both VERIFIED, COMPLIANT, conventions followed). S9 Quảng Nam 2025 chuyên official HDC: marking penalties, symmetric integer equations, inequality write-up. Applied: number theory (symmetry + list all), algebra (Tương tự / cộng vế / Vậy GTNN). 2 benchmark items (83 items, 27 machine-checkable). Tests 359 pass. | 0.03 |
| 7 | 10:24–10:30 | Sweep of 28 provinces × 2 years: only Hải Phòng 2025 had an HDC with text (others scanned or đề-only). S10 Hải Phòng chuyên HDC (chính thức + dự bị): general marking rules, Fermat/Wilson in the reserve paper. 2 benchmark items (85 items, 29 machine-checkable). No code change besides the benchmark. | 0.03 |
| 8 | 10:28–10:32 | Classified sweep files (most are toanmath/centre solutions). S11 Phú Yên 2024 chuyên official HDC (scan), S12 An Giang 2024 official đáp án. Applied: tutor prompt rule 6 (figure required, unproved claims, guessing). 2 benchmark items (87 items, 31 machine-checkable). Tests 359 pass. | 0.03 |
| 9 | 10:33–10:37 | Ran the curriculum checker on 6 official keys: no prohibited hits; one false positive ("Thử lại vào phương trình", Quảng Nam). Applied: policy v1.3 narrows `thử lại` to retry phrasing, with a test. Tests 359 pass. | 0.03 |
| 10 | 10:38–10:41 | Systems: S10 + S5 pattern applied to algebra guidance; ∥ seen once in an official key (NOTATION.md). 1 benchmark item (88 items, 32 machine-checkable). | 0.03 |
| 11 | 10:42–10:45 | Named geometry theorems: none cited in 12 official keys; products via similar triangles. Applied to geometry guidance. | 0.03 |
| 12 | 10:46–10:51 | Spot check 2 (Quảng Nam Câu 6: all 8 pairs, official pattern). Hint prompt: official notation. | 0.06 |
| 13 | 10:53–10:56 | Đại trà sweep (30 provinces × 2 years). S13 Quảng Ninh, S14 Thanh Hóa, S15 Quảng Nam 2025 official HDCs. Applied: one-line routine equations inside word problems. Found S10/S14 contradiction on using unproved earlier parts (not applied). | 0.06 |
| 14 | 10:57–11:01 | Phú Thọ/Vĩnh Phúc scans not official. 3 S10 benchmark items (91 items, 35 machine-checkable). User request: letter names for figure points (prompt + name_points + guidance, test). Tests 360 pass. | 0.06 |
| 15 | 11:02–11:06 | S13 Quảng Ninh HDC rule 4: out-of-programme knowledge only with proof; unproved earlier part scores nothing (S13+S14 vs S10). Applied: SOLVE_SYSTEM rule 1 + discouraged warnings (policy v1.4). 3 benchmark items (94 items, 38 machine-checkable). Tests 360 pass. | 0.06 |
| 16 | 11:07–11:09 | S14 Thanh Hóa Câu 11: second official parameter Vi-ét write-up → algebra guidance. 2 benchmark items (96 items, 40 machine-checkable). Inequality spot check running. | 0.06 |
| 17 | 11:10–11:11 | Spot check 3 (inequality): right answer, hand-waved step with missed self-talk → policy v1.5 patterns + tests; official keys re-checked clean. Tests 360 pass. | 0.09 |
| 18 | 11:12–11:14 | S16 PTNK 2024 official key via Drive direct download (hash matches): Dirichlet/induction/congruence/symmetry evidence, consistent with guidance; no change. PTNK 2025 still blocked. | 0.09 |
| 19 | 11:15–11:17 | First-error rule: no second source. S12 An Giang Câu 5 = third source for parameter Vi-ét (F19). 3 benchmark items (99 items, 43 machine-checkable). | 0.09 |
| 20 | 11:18–11:22 | Benchmark hygiene: 6 probability/word-problem items relabelled topic "other" (manifest convention); manifest.json and README coverage regenerated from the data (algebra 36, geometry 22, number theory 18, combinatorics 13, other 10; 43 machine-checkable). Next: sweep 2023–2024 official keys for more machine-checkable chuyên items. | 0.09 |
| 21 | 11:22–11:24 | 2023–2024 chuyên sweep (≈55 provinces × 2 years): guides in Đồng Nai 2024, Hải Dương 2023, Hải Phòng 2023 (same first-error rule — same Sở, not independent), Phú Yên 2023, An Giang 2023. 3 An Giang 2023 items (official, re-derived). Benchmark 102 items, 46 machine-checkable. | 0.09 |
| 22 | 11:25–11:27 | Hải Dương 2023 chuyên official HDC: 2 number-theory items (residues mod 3, factorisation). Benchmark 104 items, 48 machine-checkable; number theory 20/50. | 0.09 |
| 23 | 11:28–12:32 | Đồng Nai 2024 chuyên official HDC: 6 items (parameter Vi-ét, integer equation, system, polynomial, lcm/gcd, primes), each re-derived. Benchmark 110 items, 54 machine-checkable. | 0.09 |
| 24 | 12:34–12:36 | Phú Yên 2023 chuyên official HDC: 2 items (2a, 2b). Benchmark 112 items, 56 machine-checkable. | 0.09 |
| 25 | 12:37–12:41 | 2022 chuyên sweep (throttled): S17 Quảng Bình official HDC gives the second source for the first-error rule → tutor prompt (dependent steps 'unclear', fix-first habit). Tests pass. | 0.09 |
| 26 | 12:43–12:45 | Quảng Bình 2022 (3) and Thái Nguyên 2022 (3) official items, each re-derived. Benchmark 118 items, 62 machine-checkable. | 0.09 |
| 27 | 12:47–12:52 | Throttled sweep of 2021 chuyên and 2023–2024 đại trà: nothing usable (older file names differ; the site also rate-limits). Final checks: backend 360 tests, ruff, mypy; web 13 unit tests, typecheck. Loop stopped early (12:52 instead of 17:00): accessible official sources exhausted. | 0.09 |

## Outcome

Stopped at 12:52 on 2026-11-03. 17 official sources read (curriculum + 16 marking guides/keys), 21 findings, 15 pipeline
changes (summary table at the top of PAST_PAPER_FINDINGS.md), policy curriculum-2026.11-v1.5, benchmark 72 → 118 items
(16 → 62 machine-checkable, all with official answers re-derived). Live spend SGD 0.09 of the SGD 2.00 allowance.
