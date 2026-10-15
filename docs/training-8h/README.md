# 8-hour specialist training run (2026-10-14, 17:10 → ~01:10 +08)

Branch `train/specialists-8h` in the worktree `/Users/qnrj/Code/math-teacher-train` (isolated from the other agent).
Two hours per specialty: collect questions → answer them with the real solver → review file → self-grade → general
fixes → answer again, including held-out questions never used for fixing. **Your ratings in the review files drive the
final fix round.**

"Training" here means improving the solver's code and checks. No model weights are trained (no trainable model or
compute is available); every change is a code change listed below with the evidence that motivated it.

## Setup

| | |
|---|---|
| Solver | production `solveProblem`: deterministic solvers first, then SOCLAAS `default` (qwen3.6:35b), free OpenRouter model as fallback |
| Budget | SOCLAAS approved with a cap: **$2 for the whole run** (ledger `tools/train-8h/spend.json`); response cache, so a repeated request is never paid twice |
| Time per question | 300 s (the app's background budget), hard 330 s guard |
| Questions | `data/train-8h/<type>.jsonl` — train = real exam questions from the repository; held-out = new questions written for this run, references verified by SymPy/enumeration (`tools/train-8h/build_sets.py`) |
| Review files | `docs/training-8h/<type>-round<N>.md` — fill in **Đánh giá của bạn** under each question |

## Progress

| Block | Time | Status |
|---|---|---|
| Đại số | 17:10–18:45 | **done** — review files `algebra-round1.md`, `algebra-round3.md` |
| Hình học | 18:45–21:20 | done — `geometry-round1.md`, `geometry-round3.md` (Mac asleep 19:45–20:47; that round discarded and re-run) |
| Số học | 21:26–22:10 | done — `number_theory-round1.md`, `number_theory-round2.md` |
| Tổ hợp | 21:57–22:25 | done — `combinatorics-round1.md`, `combinatorics-round2.md` (held-out shown in round 2 ran once, after the round-1 fixes) |
| Kiểm tra cuối | 22:25–22:40 | 12 new questions (3 per specialty), written after all fixes, run once — `final-round1.md` |

## Fixes so far (all general, none tied to a question)

| # | Evidence (round) | Root cause | Fix |
|---|---|---|---|
| 1 | Algebra r1: 3 in-curriculum problems "given up" by SOCLAAS, retried by the weaker free model | escalation always went to the fallback | `escalateOnGiveUp`: a give-up is corrected on the same model when the fallback is weaker (SOCLAAS-first config) |
| 2 | Algebra r1: lessons rejected for "the", "and", "Definition" in step audit fields and the status reason | language repair only covered some fields; `reconcileStatus` copies the (English) status reason into a displayed note after the repair | repair covers every checked prose field, including `statusReason`, step `operation`, `verification`, `factsUsed` |
| 3 | Algebra r1: correct proof marked unverified for "matrices or complex numbers" | the model wrote "định thức Δ" (determinant) for the discriminant | glossary: "định thức Δ" → "biệt thức Δ" |
| 4 | Algebra r2: repairs fixed 3/4 fields then all were thrown away; repair request truncated | all-or-nothing repair; repair sent to the free fallback | partial repairs kept; repair uses the stronger model; optional metadata that is still foreign is removed (never statement data or solution text) |
| 5 | Algebra r2: "eTai" flagged as English | camelCase rule applied to identifiers inside `\text{}` (`xeTai` = xe tải) | identifiers in `\text{}` exempt |
| 6 | Algebra r1: one solve took 681 s on a 300 s budget | event loop starved by a long stream | harness hard guard (finding, not yet fixed in the app) |
| 7 | **Algebra held-out alg8-h4: wrong answer shown** (m = 1 or −5; correct m = −1 ± √3), status only "not checkable" | the oracle skips every parametric question, so nothing checked "find m so that the roots satisfy R" | `shared/src/parameterRoots.ts`: solves R numerically for every m (real roots, Δ condition, both labelings), gives the result to the model as a computed hint, and a final answer that contradicts it is retried and **never served** (same rule as a false divisibility claim). alg8-h4 is no longer unseen for this fix; two fresh parametric questions (h7, h8) test it |

| 8 | Algebra r3: lesson rejected for "eTai" in a hint formula | raw LaTeX of formula fields was checked as prose | formula fields: only their `\text{…}` words are checked |
| 9 | Algebra r3: conclusion shown as "rac{3}{2}" | `\frac` with one backslash in the model's JSON is the escape `\f` (form feed); also `\end` etc. made the whole JSON invalid | before parsing, a single backslash in front of a LaTeX command is doubled (`fixJsonLatexEscapes`) |

| 10 | Geometry r1: a lesson with "concyclic", "orthocenter", "neuf" was shown | the English-word list had no geometry vocabulary | common English geometry terms added (none is a Vietnamese word) |
| 11 | Geometry r1: 5 of 6 hard proofs failed with HTTP 502 | **the SOCLAAS gateway now cuts every request at 120 s** (measured: 120.1 s, unbilled); the code assumed 230 s | requests stop at 115 s; geometry lessons are written without hidden thinking; the retry after a failed SOCLAAS request is SOCLAAS without thinking, not the weaker free model (harness and `routes/solve.ts`) |
| 12 | Geometry r2: without thinking the model gave up on a problem it solved with thinking | thinking and a long lesson cannot share 120 s | two stages for SOCLAAS geometry that needs an argument: a short outline with thinking, then the lesson from it (each within 120 s) |
| 13 | Geometry r3: two proofs whose steps the checker **measured false** were served as "unverified" | serving policy | `shared/src/servePolicy.ts`: a lesson with a failed mathematical check (false claim, contradicted answer, method outside the curriculum) is never shown; the student gets "not solved yet" or keeps the previous lesson. Applied in `routes/solve.ts` |

| 14 | Geometry held-out h5: a correct proof withheld | the model's answer check "MA^2 = MB * MC" was sampled as an algebraic identity (M, A, B, C as numbers) | identity/inequality checks written in segment names are "can't be evaluated", never failed (`runAnswerCheck`) |
| 15 | Geometry: claims measured on a figure that contradicts the statement | the statement-built figure can be wrong (e.g. B, C not on one line through M) | if the statement's own conclusion is false in the figure, no claim measured on that figure counts against the lesson; the model is asked to rebuild the figure. Limit: a wrong proof is then not caught either (KHTN III.1) |

| 16 | Number theory held-out: a correct answer withheld | evaluator limits ("integers checks support one variable") were counted as failed | evaluator limits are "can't be evaluated", never failed |
| 17 | **Number theory held-out: two wrong answers shown** (last digit of 2²⁰²⁶+3²⁰²⁶ given as 9, correct 3; n² + 4n + 97 square given as n ∈ {0; 3}, correct {12; 44}) | no check for remainders of composite power expressions or "find all n with P(n) square/prime" | `shared/src/integerTargets.ts`: exact remainder/last digits of any closed power expression (modular exponentiation); for square/prime predicates every stated value is substituted back and a window is searched exhaustively. Given to the model as a computed hint; a contradicting answer is retried and never served |
| 18 | **Number theory held-out (fresh): a deterministic module served a wrong answer as "verified"** ("3²⁰²⁵+5²⁰²⁵ chia 8" read as "3²⁰²⁵ chia 8") | a certified module from the other agent matched "anything up to `cho`" | its pattern no longer swallows "+5^…"; and a safety net: the exact checks of fixes 7 and 17 now run on **every** final answer, deterministic ones included — a contradicted answer is never served |
| 19 | Number theory: thinking requests ran past 115 s and the direct retry gave up | one request cannot both think and write | the harness now uses two stages for every SOCLAAS problem that needs an argument (as the route does) |
| 20 | **Combinatorics: a wrong answer shown** (last step P = 4/201, final answer 11/201) | nothing compared the final answer with the solution's own last value | `finalStepConflict`: when the last line is "name = number", the final answer must state that number; otherwise retried and never served (also in the safety net). Replayed on all 83 lessons of the run: 1 hit (this one) after excluding equation and case lines |
| 21 | Combinatorics: a lesson discarded for the label "Logic" | the "Dạng bài" label could only be repaired, not replaced | a still-foreign label becomes the specialty's Vietnamese name |
| 22 | Combinatorics held-out: a lesson mostly in English never got a repair | repair limited to 30 fields / 8000 characters | limit 60 fields / 16000 characters (formulas and numbers still guaranteed unchanged) |
| 23 | Combinatorics: a correct answer withheld for "matrices" | the model called the 4×4 board a "ma trận" | glossary: "ma trận" → "bảng" (Grade 9 has no matrices) |
| 24 | Final evaluation: a correct answer withheld | "⇔ { m = 3 ; m = −2 }" — the "and" brace used for "or" | a brace giving one variable several different values is rewritten as the "hoặc" bracket (added **after** the final run; the final result below is as measured) |

## Results

### Đại số

Claude's grades (0–10 per question; "correct" = right result and valid reasoning, partial answers not counted).

| | Round 1 | Round 2 | Round 3 |
|---|---|---|---|
| Train (12 real exam questions): lessons | 5 | 6 | **10** |
| Train: correct / mean score | 4 / 2.9 | — | **9 / 6.0** |
| Held-out (6, never used before): lessons / correct / **wrong shown** | — | 5 / 4 / **1** | — |
| Held-out after fixes (6 + 2 fresh): correct / mean | — | — | **8 of 8** / 8.1 |

The fair generalisation figure is round 2's held-out (answered after the round-1 fixes, before Claude saw those
questions): 4 of 6 correct, 1 wrong answer shown, 1 without a lesson. The wrong one (alg8-h4) drove fix 7; the two
fresh questions h7, h8 were added afterwards to test that fix without reusing h4.

### Hình học

| | Round 1 | Round 3 |
|---|---|---|
| Train (10 real exam proofs): lessons served / correct / mean | 4 / 2 / 2.2 | 5 / 2 / 2.1 |
| Wrong lessons shown to students | 1 (HCM 3a) | 0 (two false proofs withheld by fix 13) |
| Held-out (6, first and only run): correct / mean | — | 5 / 6.2 (h5 counted after fix 14) |

Real chuyên geometry proofs remain mostly unsolved: the model cannot think and write a full proof with a figure inside
the gateway's 120 s, and the proofs it writes often use unproved facts ("ABDE nội tiếp") that the dependency check
rightly rejects. What improved is safety (no proof with a measured-false step is shown), the request setup (fixes 11–12)
and standard textbook problems (held-out 5/6).

### Số học

| | Round 1 | Round 2 |
|---|---|---|
| Train (10 real exam questions): correct | **10 / 10** (6 by modules built on these papers) | — |
| Held-out (6, first run): correct and shown / **wrong shown** / none | 1 / **2** / 3 (+1 correct withheld) | — |
| Same 6 after fixes 16–19 | — | 5 correct shown, 1 correct withheld |
| Fresh held-out (4, after the fixes) | — | 3 correct; 1 **wrong "verified"** by a deterministic module → fixed (18); now goes to the model |

Number theory shows the overfitting most clearly: 10/10 on the exam papers the modules were built from, 1/6 correct on
the first unseen run.

### Tổ hợp

| | Round 1 | Round 2 |
|---|---|---|
| Train (10 real exam questions): correct shown / wrong shown / none or withheld | 4 / **1** (11/201) / 5 | 6 / **1** (Hà Nội V.2: 70 → 56, model instability) / 3 |
| Held-out (6, run once): correct shown / none | — | 4 / 2 |

### Final evaluation (12 new questions, 3 per specialty, run once after all fixes)

| Specialty | Correct answer | Served | Wrong shown |
|---|---|---|---|
| Đại số | 3/3 | 2/3 (fin-a3 withheld for "{" instead of "[" → fix 24) | 0 |
| Hình học | 3/3 | 3/3 | 0 |
| Số học | 3/3 | 3/3 | 0 |
| Tổ hợp | 3/3 | 3/3 | 0 |
| **All** | **12/12** | **11/12** | **0** |

Five of the twelve were answered by deterministic solvers in under a second; the rest by SOCLAAS in 17–159 s.
Caveat: these are standard chuyên-entrance exercises written by the same author as the fixes; real exam proofs
(Geometry 2/10, see above) remain the weak point.

Remaining (Đại số): HCM 1b (an English word left in the solution text itself), KHTN I.2 (the model keeps using a derivative —
correctly flagged "unverified"), KHTN I.1 (answer right, proof not machine-checkable — needs your reading).

Run notes (environment): the Mac slept on battery from about 19:45 to 20:47; the geometry round running then
(`geometry-r3-train.INVALID-sleep.json`) is discarded and was re-run under `caffeinate -i`. The harness also never
exited after writing its results (open streams and the guard timer kept Node alive), which is why runs seemed to
overlap; it now exits explicitly and refuses to start while another run holds `run.lock`.

Run note: a background job that looked lost at 18:00 was still running; for a few minutes two copies of the held-out run
overlapped (same result file, same ledger). Both were stopped at 18:23 and the run restarted with one process; the
ledger may over-count by a few cents (cache hits were charged before 18:05), never under-count.

Not changed after review: a lesson that calls the two Bunhiacopxki vectors "vectơ" stays flagged, as decided in your
earlier PTNK 2025 review (test `optimization.test.ts`).

---

# Second 8-hour run (2026-10-15, 10:40 → ~18:40 +08), driven by your ratings

Input: your ratings in `reviewed-2026-10-15/` (algebra r3, combinatorics r2, final, geometry r3, number theory r2).
Each fix below answers a pattern in those ratings and is general (no question-specific answers). Budget: $2 cap for
the day (`tools/train-8h/spend-2026-10-15.json`).

## Fixes (second run)

| # | Your rating / observed failure | Cause | Fix |
|---|---|---|---|
| 25 | fin-n1 "11 chia 5 dư 6 là sao?", nt8-h6 "phải đúng từ đầu đến cuối" | only the final answer was checked | `stepClaims.ts`: every remainder claim in the steps (congruence chains, "E chia m dư r") is computed exactly; self-talk ("Chờ đã", "kết quả từ máy") is rejected. A wrong step → retry, never served. Replay over 111 lessons: flags exactly those two |
| 26 | HCM 1a "Hyperbol, elip… chưa học ở lớp 9"; V.2 "Đồ thị 5-chính tắc là gì" | no out-of-curriculum rule for conics / graph theory | grade-level rules: conics and graph-theory vocabulary are flagged and the model is told to use Grade 9 language |
| 27 | PTNK 2024 4a "Giải tổng quát, không có cho ví dụ" | a hypothesis diagnosis replaced the solution | the diagnosis is now a note to the solver ("solve the general case"); the lesson is the general solution |
| 28 | nt8-h9 "chứng minh quá phức tạp" | residue-class table for n³+5n | certified module: P(n) = a·(product of consecutive integers) + m·R(n) — the textbook one-line proof |
| 29 | many "có cách gọn hơn", "liệt kê hết nghiệm", "xét trực tiếp p=2, p=3", "không cần kiểm lại", "vẽ bảng" | prompt | reviewer rules in the system prompt (shortest standard method, explain conjugate / non-obvious steps, all solutions listed, explicit cases, no separate re-check step, boards drawn as arrays, no Γ) — prompt version `solver-v2.41` |
| 30 | "(Γ)" circle names | the circle-bisector module named circles Γ | circles named by their points |
| 31 | ptnk-2026/1 "latex của frac ghi thành rac" | the language-repair and outline responses were parsed without the JSON-LaTeX escape fix (`\f` = form feed) | both parses use the fix; a lost `\f`/`\b` before a letter is restored, not stripped |
| 32 | "student-facing text?" (HCM 1b, 2a, 5a, comb8-h6) | (a) a formula like `2d_{xeTai}-a` was read as English; (b) one repair pass missed fields; (c) a restated "given" in English discarded a correct lesson | (a) subscripted names ignored in formulas; (b) a second repair round for the fields not accepted, with the reason logged; (c) restated givens/unknowns still foreign are dropped (the statement is shown verbatim). Solution text must still be Vietnamese |
| 33 | comb8-h1 no lesson | slot picture "_ N _ N _" is invalid KaTeX | lone underscores drawn as □ |
| 34 | (speed) | the parameter-root check took ~7 s | expressions compiled once: 0.4 s |
| 35 | review files showed internal error codes | — | failures and withheld lessons explained in Vietnamese in the review files |
| 36 | geo8-h1 "Chứng minh AEHF quá lòng vòng" | the planner printed "∠AEH = 90° = 180° − ∠AFH ⇒ …" and then the two right angles again, with a boilerplate reason | the two-right-angle proof replaces the step that only derived its premise; textbook wording "E, F cùng nhìn đoạn AH dưới một góc vuông"; boilerplate removed |
| 37 | first 8 questions of this run: 5 failed at ~120 s | the gateway generated ~75 tokens/s today (yesterday ~300); a 10 000-token lesson cannot finish in 120 s, and the retry asked for the same length | compact JSON requested; after a timeout the retry asks for a concise lesson (≤ 5 steps, ≤ 3 hints, optional fields empty) and the timeout does not use up an attempt. The round was restarted from the beginning after this fix |

| 38 | ptnk-2026/1 again ("then" left in one hint) | single English connector words survived two repair rounds | glossary: then → thì, when → khi, both → cả hai, every → mọi, logic → lập luận; "5 choose 2" → C₅² |
| 39 | alg8-h8 discarded | a broken formula in an optional interpretation note | broken optional analysis notes are dropped; broken solution text still rejects |
| 40 | **hcm 1b served "0" while the steps computed −1** | the step/answer comparison only read "name = number" lines | a chain line "… \\ = −1" counts as the last value too |
| 41 | **alg8-h4 served "không tồn tại", alg9-f3 served "m = 2 hoặc −1/3"** while the steps were right | the final answer reader failed on "\text{ hoặc }" and on "giá trị $m$ nào" (the m-check said nothing) | \text{…} unwrapped, "không tồn tại / vô nghiệm" read as "no value": both now flagged and withheld |
| 42 | **hcm 2a served a guess** ("Giả sử đáp án là 16:00", "dựa trên cấu trúc bài toán trắc nghiệm"), ptnk-2026/2 "đáp án thường là…", alg9-f4 "Wait" | guessing was not recognised as self-talk | guessing / "Wait" / "(sai)" / "theo dàn ý" phrases are rejected like "Chờ đã" |
| 43 | "Ta thử cách khác", "Có vẻ như cách…", "Không, hãy…" in served lessons (your "sai lúc đầu xong sửa lại khúc cuối") | not detected | dead-end phrases send the lesson back for a direct rewrite (they never withhold it) |
| 44 | khtn I.2 withheld as "graph theory" | "đồ thị nếu cần" matched the rule for a named graph "đồ thị G" (case-insensitive) | the named-graph rule is case-sensitive |
| 45 | **geo8-h4 served Ĉ = 110°, D̂ = 100°** (swapped) | "180° − 80° = 110°" — plain arithmetic in a step was never checked | every "=" chain of numbers in the steps is computed (degrees allowed, members with words/units skipped, rounding 0.6 %): replay finds exactly the 4 real slips of this round and yesterday's, no false positive |
| 46 | comb9-f3: steps 70, answer 74 | "84 − 10 − 4 = 70 \\text{ (cách)}" not read (unit, arithmetic line) | trailing units ignored; arithmetic lines compared when the answer is one stated number |
| 47 | nt9-f2 (new): a 30-row remainder table for n⁵ − n ⋮ 30 | the consecutive-product module allowed one product only | sums of products: n⁵ − n = (n−2)(n−1)n(n+1)(n+2) + 5(n−1)n(n+1); also n⁴ − n² ⋮ 12; the k! reason written out (one multiple of 3, two consecutive evens …) |
| 48 | PTNK 2024 4a (your "giải tổng quát") withheld as "antiparallel" | "hai cạnh **đối song** song" matched "đối song" | the antiparallel rule no longer matches "cạnh đối song song" |
| 49 | PTNK 2023 1 rerun looped (same 2 steps × 6) | — | identical repeated steps are dropped, references redirected |
| 50 | 11:35 Wi-Fi drop / lid-close sleep recorded 40 "fetch failed" results | harness | the harness waits for the gateway and retries the question; results of the broken run discarded |

Not fixed by code (model limits, retried in this run): geometry IV.2 / PTNK 2023 5a — the model uses "tứ giác … nội
tiếp" without proving it; the checker correctly rejects it.

## Round plan

Every reviewed question again (train + held-out) **plus 6 fresh questions per specialty** (split `fresh`: 5 written and
verified at 11:00 before any model call of this run, and 1 past exam question never used), never used for a fix.

## Results (second run)

Every question you rated, plus 6 fresh questions per specialty, then a re-run of the 22 failed/wrong items after fixes
38–49 (both results are in the review files; the table counts the latest). Grades are mine; yours decide.

| Specialty | Questions | Correct & shown | Shown with an error | Withheld (checks) | No lesson | Fresh: correct & shown | Avg (Claude) |
|---|---:|---:|---:|---:|---:|---:|---:|
| Đại số | 26 | 19 | 2 weak (KHTN I.1 5/10, I.2 3/10) | 4 | 1 | 5/6 | 6.4 |
| Tổ hợp | 22 | 12 | 2 weak (3a 5/10, 5a 5/10) | 3 | 5 | 3/6 | 5.1 |
| Số học | 26 | 22 | 1 weak (nt9-f2 table, fixed after) | 3 | 0 | 4/6 | 7.5 |
| Hình học | 22 | 11 | **2 wrong**: geo8-h4 (angles swapped → fix 45), IV.1 ("⊥" for "∥" → fix 53) | 4 | 5 | 4/6 | 4.5 |

Before the fixes of this run, the same round served **6 wrong answers** (hcm 1b, hcm 2a, alg8-h4, alg9-f3, alg9-f4,
geo8-h4); fixes 40–45 make all six either correct or withheld (replayed on the saved lessons).

### Final evaluation 2 (12 new questions written at 15:50 after all fixes; code frozen; run once)

| | Correct & shown | Wrong shown | Withheld | No lesson |
|---|---:|---:|---:|---:|
| 12 questions (3 per specialty) | **9** | **0** | 3 | 0 |

Withheld: fin2-c2 (steps 3/7, answer "0.4" — rightly withheld); fin2-a3 (correct, but "Wait" in a hint); fin2-n1
(correct, but the model's own check "(2^100+3^100) % 7" was computed in floating point — **fix 52**, after the evaluation).
Seven of the twelve were answered by certified modules in under a second.

## Fixes after final evaluation 2 (not measured by it)

| # | Problem | Fix |
|---|---|---|
| 52 | fin2-n1 withheld: "(2^100 + 3^100) % 7" evaluated in floating point | a closed integer expression modulo m in an answer check is computed exactly |
| 53 | IV.1 served "CF ⊥ AB và BK ⊥ AB nên CF ⊥ BK" | the "two perpendiculars to one line ⇒ perpendicular" slip is detected (they are parallel); replay: only this lesson |

## Still weak (honest list)

- Geometry olympiad-style proofs (PTNK 2023 5a/5b, Hà Nội IV.2, HCM 3a/3b): the model asserts a cyclic quadrilateral
  without proof or runs out of time; nothing wrong is shown, but there is no lesson.
- Games and constructive combinatorics (PTNK 2025 5a/5b, comb9-f5, PTNK 2024 5b).
- Presentation: "Mình", template wording in certified modules, missing board drawings (PTNK 2023 3a/3b),
  missing equality cases (III.1b, PTNK 2026/2).
- The model server was ~4× slower today; several first attempts timed out.

Spend for 2026-10-15: see `tools/train-8h/spend-2026-10-15.json` (cap $2).

Post-fix check (16:15, 4 items, not an evaluation): fin2-n1 now **verified and shown**; geo8-h4 (angles swapped) and
IV.1 ("⊥" for "∥") now **withheld** instead of shown; fin2-a3 timed out (slow server).
