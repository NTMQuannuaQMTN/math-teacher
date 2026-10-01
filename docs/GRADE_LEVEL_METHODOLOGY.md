# Grade 9 methodology

The solver must teach the way a good Vietnamese Grade 9 (lớp 9, THCS) teacher would: the simplest method
the student has been taught, every transformation the student needs to write, nothing more advanced. This
document defines the policy, how it is enforced, and the rubric used to measure it.

## 1. Curriculum boundary

**Scope (2026-10-01): the 13 topics of the Grade 10 entrance-exam review** ("13 chuyên đề ôn thi tuyển sinh
vào lớp 10 môn Toán", toanmath.com, 2025). Every problem being tested is inside them, so the solver never
calls one of these problems "unsupported":

1. Hệ phương trình bậc nhất hai ẩn; giải bài toán bằng cách lập hệ phương trình
2. Phương trình bậc hai và hệ thức Vi-ét
3. Vi-ét với những biểu thức không đối xứng
4. Giải bài toán bằng cách lập phương trình
5. Hàm số bậc hai (y = ax²) và các bài toán tương giao
6. Rút gọn biểu thức và các bài toán liên quan
7. Hệ thức lượng trong tam giác vuông và ứng dụng tỉ số lượng giác
8. Một số yếu tố thống kê
9. Một số yếu tố xác suất
10. Nón – trụ – cầu và hình khối
11. Các mô hình thường gặp và bài toán tổng hợp hình học
12. Bất đẳng thức và các bài toán cực trị
13. Các bài toán thực tế có liên quan cực trị

Source of truth: `worker/src/solver/curriculum.ts` (`VN_GRADE_9`). The solver prompt is generated from it,
so changing the boundary is a data change.

**Expected knowledge (prefer):** arithmetic and fractions; the seven identities (hằng đẳng thức) and
factorising; conditions of definition (điều kiện xác định); square and cube roots; linear equations and
inequalities; systems of two linear equations (substitution, elimination); quadratic equations (factorising,
Δ and Δ', Vi-ét); functions y = ax + b and y = ax²; word problems by setting up an equation or system;
angles and parallel lines; triangles (congruence cases c.c.c / c.g.c / g.c.g, isosceles, special lines);
Pythagoras; quadrilaterals; Thales and similar triangles; right-triangle relations (hệ thức lượng);
trigonometric ratios of acute angles; circles (chords, tangents, inscribed and central angles, tangent–chord
angle, cyclic quadrilaterals); arc length and areas; basic statistics and probability.

Also in scope (from the 13 topics): non-symmetric Vi-ét expressions; parabola–line intersections;
cylinder, cone and sphere (surface area, volume, composite solids); statistics (frequency tables, charts);
classical probability; **Cô-si (AM–GM) for two or three numbers and Bunhiacopxki (Cauchy–Schwarz)** in their
usual school forms for extremum problems; real-life optimisation.

**Outside the boundary (never, unless the problem itself asks for it):** calculus (derivatives, integrals,
limits); vectors and dot products as a method; coordinates as a shortcut for a synthetic geometry problem;
the laws of sines and cosines for non-right triangles; complex numbers, matrices, linear algebra,
logarithms; university-level theorems or notation.

**"Unsupported"** is accepted only when the problem text itself needs one of those (e.g. an integral). For
any other problem, an "unsupported" answer is sent back to the model to be solved.

**Grey zone (advisory, never a retry):** olympiad-only inequalities (Jensen, Schur, Hölder, Chebyshev,
Minkowski), induction, number-theory theorems (Fermat's little theorem, Chinese remainder theorem).
Congruence notation (≡, mod) is **not** flagged: the official PTNK 2026 solutions use it. The conclusion
should still be in words ("n chia 3 dư 1").

A concept is not excluded because its name sounds advanced: "trigonometric ratios" are Grade 9, the law of
cosines is not; "Cô-si for two numbers" is Grade 9, Jensen is not.

## 2. Method-selection policy

The model is told to identify the kind of problem and use the method the teacher expects for it
(`VN_GRADE_9.methods`, included in the prompt):

| Kind of problem | Expected method |
|---|---|
| Equation / inequality in one variable | Expand, collect, isolate; condition of definition first when there are denominators or roots; check solutions against it |
| Quadratic equation | Factorise when a factor is visible, otherwise Δ (Δ' for an even b); sums/products of roots and parameter conditions with Vi-ét |
| System of two linear equations | Substitution or elimination |
| Simplifying an expression | Identities, conditions of definition, cancel |
| Maximum / minimum | Complete the square, (a − b)² ≥ 0, Cô-si for two non-negative numbers; state when equality holds |
| Word problem | Choose the unknown and its condition, set up the equation/system, solve, check against the story, answer with units |
| Integers / divisibility | Factorise, cases by remainder ("n chia 3 dư 1") |
| Geometry calculation | Pythagoras, hệ thức lượng, trig ratios of acute angles, Thales, similar triangles |
| Geometry proof | A chain of named school theorems: angle chasing, congruent/similar triangles, inscribed angles, tangent properties, cyclic quadrilaterals |

Preferences when several methods work: direct elementary reasoning over tricks; theorems named as in the
Vietnamese textbook; the shortest method a strong Grade 9 student would find; every transformation the
student must write, no filler; **never mention an advanced alternative** ("or by derivatives").

The policy is applied inside the single lesson call (no extra model call): steps 1–5 of "identify topic →
relevant Grade 9 concepts → plausible approaches → simplest valid → solve" happen in the model's reasoning,
and step 6 ("check") is the deterministic verifier. Step 7 ("rewrite only if too advanced") is the
grade-level retry below.

## 3. Enforcement

`shared/src/gradeLevel.ts` reviews every lesson deterministically (no model call), over the strategy,
hints, steps and final answer. A method is never flagged when the problem statement itself names it.

| Finding | Effect |
|---|---|
| Forbidden method (calculus, vectors, law of sines/cosines, matrices / complex numbers, coordinates in a synthetic geometry problem) | Retry feedback: "the solution uses …, which a Vietnamese Grade 9 student has not learned: solve it again with Grade 9 methods". Counts as serious (the retry is made). |
| "Unsupported" for a problem whose text needs no outside method | Retry feedback: the problem is within the entrance-exam curriculum; solve it |
| Grey-zone method (olympiad-only inequality, congruence notation, induction, Fermat/Euler/Wilson/CRT) | Advisory: recorded in the rubric, no retry |
| Style (too long, hand-waving, too many hints, a hint that gives the answer away) | Advisory: rubric only |

Related deterministic checks that serve the same goal: language hygiene (`shared/src/language.ts`:
Vietnamese with diacritics, no mixed-in Chinese), bare-LaTeX wrapping, answer checks that must re-derive the
result.

## 4. Rubric (pass/fail per lesson)

| Criterion | Pass when | Fails, e.g. |
|---|---|---|
| **Curriculum fit** | No forbidden method | Uses a derivative for a maximum; places a coordinate system on a synthetic quadrilateral problem |
| **Familiar methods** | No grey-zone method | "Theo bất đẳng thức Jensen…"; "n ≡ 1 (mod 3)" (Cô-si and Bunhiacopxki are allowed) |
| **Concise** | A simple problem (one question with a formula, no figure, no proof, ≤ 220 characters) has ≤ 6 steps, and no step explanation exceeds ~3 sentences (320 characters) | 9 steps to solve 2x + 3 = 7 |
| **No hand-waving** | No step asserts a result without showing it | "Dễ thấy…", "ta chứng minh được…", "obviously" |
| **Hints progressive** | Hint 1 doesn't contain the final answer; ≤ 4 hints for a simple problem, ≤ 6 otherwise; at least one hint | "Bạn có thấy x ≤ 2 không?" as the first hint |
| **Suitable** (summary) | Curriculum fit **and** familiar methods | |

Not automated (needs a teacher's review): skipped key transformations, unexplained notation, a correct
answer without the reasoning that produces it, overall clarity. The verifier partly covers the third (every
answer needs a check that re-derives it). These are reviewed by hand on a sample (FINAL_OPTIMIZATION_REPORT.md).

## 5. Lesson format on screen

The existing lesson schema already carries the requested structure; no migration was needed:

| Section | Field | On screen (vi) |
|---|---|---|
| 1. Nhận dạng bài toán | `analysis.subtopic`, givens, unknowns, concepts | "Dạng bài" (new), "Cho biết", "Cần tìm", "Kiến thức sử dụng" |
| 2. Hướng giải | `strategy` (one or two sentences) | "Hướng giải" (revealed with the first hint) |
| 3. Lời giải | `steps[]`: title, ≤ 2-sentence explanation, LaTeX, named theorem | step cards |
| 4. Kết luận | `finalAnswer` | "Đáp số" |
| 5. Kiểm tra | deterministic `verification` | badge "Đáp án đã được kiểm tra" / "Chưa kiểm chứng được" |

Hints (hint-first design): 2–3 for easy problems, 4–6 for harder ones, each a guiding question with a
concept cue, an explanation revealed on request, a level (1 pointing question … 4 explicit setup) and the
step it leads to — all in the same single model call.

## 6. How to measure

```bash
cd worker
npx tsx scripts/grade-level-scan.ts EXP-0 --d1 .wrangler/state/v3/d1/miniflare-D1DatabaseObject/<db>.sqlite
npx tsx scripts/build-results.ts ../experiments/<file>.json label=EXP-file …   # rubric per problem
npx vitest run test/optimization.test.ts                                       # rubric regression tests
```
