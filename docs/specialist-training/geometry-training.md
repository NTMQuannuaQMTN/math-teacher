# Geometry Bot — actual specialist evaluation

Vòng 03 bổ sung [checkpoint Hình học](iteration-03/geometry-summary.md), [19 đáp án thực tế sau sửa](iteration-03/development-geometry-final-v216.md) và [15 biến thể diagnostic](iteration-03/validation-geometry-final-v216.md). Các dữ liệu vòng trước bên dưới được giữ nguyên; vòng mới chưa có held-out hoặc điểm hài lòng do người dùng chấm.

These are actual pipeline outputs, not manually substituted solutions. Raw provider output, returned typed lesson, verifier checks, and latency are retained in `tools/specialist-training/results/`. Free-only inference; no model weights were trained. Pipeline-only runs and actual application HTTP runs are labelled separately below. HTTP timing includes text confirmation, parsing, solving, verification, formatting, D1 persistence, full JSON consumption and, for final runs, a client schema/KaTeX/language audit. Fixture OCR is excluded. Mobile painting and production network latency are unmeasured. The fenced LaTeX transcription normalizes delimiters and equation environments only; unrenderable formulas are preserved as escaped literal text. Mathematical content and actual answers are not substituted. A full XeLaTeX/LuaLaTeX installation is unavailable here, so document compilation is unmeasured; formula checks use the application KaTeX renderer.

## Question 1 — geo-dev-angle (application-frozen-development)

**Type:** isosceles-angles
**Difficulty:** Easy
**Source:** Generated set A; geo-dev-angle.
**Split:** development

**Question statement:**
Cho tam giác \( ABC \) cân tại \( A \) có \( \widehat{A}=36^{\circ} \). Tính \( \widehat{B} \) và \( \widehat{C} \).

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Cho tam giác \(ABC\) cân tại \(A\) có \(\widehat{A}=36^{\circ}\). Tính \(\widehat{B}\) và \(\widehat{C}\).
\end{document}
```

**Bot's answer:**
Controlled failure: solve_malformed_output

**LaTeX solution:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Không nhận được lời giải: solve\_malformed\_output
\end{document}
```

**Step-by-step explanation:** No generated solution was returned.

**Independent verification:** No mathematical answer to verify.

**Evaluation:**
- Mathematical correctness: Unverified.
- Completeness: Fail.
- Explanation quality: Fail.
- LaTeX and formatting: Fail.
- Response latency: 26.103 seconds; scope: Complete text confirmation + HTTP solve + D1 persistence + full JSON response consumption + schema/KaTeX/all-field language audit; fixture OCR excluded.
- Final verdict: Fail.

**Failure analysis:** solve_malformed_output

## Question 2 — geo-dev-thales (application-frozen-development)

**Type:** parallel-ratio
**Difficulty:** Medium
**Source:** Generated set B; geo-dev-thales.
**Split:** development

**Question statement:**
Cho tam giác \( ABC \), \( D \) thuộc đoạn \( AB \), \( E \) thuộc đoạn \( AC \) và \( DE\parallel BC \). Biết \( AD=3 \), \( DB=2 \), \( BC=10 \). Tính \( DE \).

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Cho tam giác \(ABC\), \(D\) thuộc đoạn \(AB\), \(E\) thuộc đoạn \(AC\) và \(DE\parallel BC\). Biết \(AD=3\), \(DB=2\), \(BC=10\). Tính \(DE\).
\end{document}
```

**Bot's answer:**
Controlled failure: solve_malformed_output

**LaTeX solution:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Không nhận được lời giải: solve\_malformed\_output
\end{document}
```

**Step-by-step explanation:** No generated solution was returned.

**Independent verification:** No mathematical answer to verify.

**Evaluation:**
- Mathematical correctness: Unverified.
- Completeness: Fail.
- Explanation quality: Fail.
- LaTeX and formatting: Fail.
- Response latency: 26.082 seconds; scope: Complete text confirmation + HTTP solve + D1 persistence + full JSON response consumption + schema/KaTeX/all-field language audit; fixture OCR excluded.
- Final verdict: Fail.

**Failure analysis:** solve_malformed_output

## Question 3 — geo-dev-proof (application-frozen-development)

**Type:** midpoint-proof
**Difficulty:** Medium
**Source:** Generated set A; geo-dev-proof.
**Split:** development

**Question statement:**
Cho tam giác \( ABC \), \( M \) là trung điểm của \( AB \), \( N \) là trung điểm của \( AC \). Chứng minh \( MN\parallel BC \) và \( MN=\frac{BC}{2} \).

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Cho tam giác \(ABC\), \(M\) là trung điểm của \(AB\), \(N\) là trung điểm của \(AC\). Chứng minh \(MN\parallel BC\) và \(MN=\frac{BC}{2}\).
\end{document}
```

**Bot's answer:**
**Interpretation:** Cho tam giác \( ABC \), \( M \) là trung điểm của \( AB \), \( N \) là trung điểm của \( AC \). Chứng minh \( MN\parallel BC \) và \( MN=\frac{BC}{2} \).
**Strategy:** Chứng minh lần lượt: MN ∥ BC; MN = BC/2. Mỗi bước chỉ dùng giả thiết, cách dựng hình và các kết quả đã chứng minh trước đó.
**givens:** Cho tam giác \( ABC \), \( M \) là trung điểm của \( AB \), \( N \) là trung điểm của \( AC \)

**Actual hints:**
- h1: Dùng tính chất nào để chứng minh MN ∥ BC?
  đường trung bình của tam giác
  Hướng:
⇒ MN ∥ BC (đường trung bình của tam giác).
  \[ MN \parallel BC \]
- h2: Dùng tính chất nào để chứng minh MN = BC / 2?
  đường trung bình của tam giác
  Hướng:
⇒ MN = BC / 2 (đường trung bình của tam giác).
  \[ MN = BC / 2 \]

**Actual worked steps:**
1. **MN ∥ BC** — Vì M là trung điểm của AB và N là trung điểm của AC (giả thiết),
MN là đường trung bình của tam giác ABC.
Theo định lí đường trung bình của tam giác: MN ∥ BC và MN = BC/2.
Vậy MN ∥ BC.
\[ MN \parallel BC \]
Reason: đường trung bình của tam giác
2. **MN = BC/2** — Vì M là trung điểm của AB và N là trung điểm của AC (giả thiết),
MN là đường trung bình của tam giác ABC.
Theo định lí đường trung bình của tam giác: MN ∥ BC và MN = BC/2.
Vậy MN = BC / 2.
\[ MN = BC / 2 \]
Reason: đường trung bình của tam giác

**Returned conclusion metadata:** Đã chứng minh: MN ∥ BC; MN = BC/2.

**LaTeX solution:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Chứng minh lần lượt: MN ∥ BC; MN = BC/2. Mỗi bước chỉ dùng giả thiết, cách dựng hình và các kết quả đã chứng minh trước đó.
\begin{enumerate}
\item MN ∥ BC. Vì M là trung điểm của AB và N là trung điểm của AC (giả thiết),
MN là đường trung bình của tam giác ABC.
Theo định lí đường trung bình của tam giác: MN ∥ BC và MN = BC/2.
Vậy MN ∥ BC.
\[MN \parallel BC\]
đường trung bình của tam giác
\item MN = BC/2. Vì M là trung điểm của AB và N là trung điểm của AC (giả thiết),
MN là đường trung bình của tam giác ABC.
Theo định lí đường trung bình của tam giác: MN ∥ BC và MN = BC/2.
Vậy MN = BC / 2.
\[MN = BC / 2\]
đường trung bình của tam giác
\end{enumerate}
Đã chứng minh: MN ∥ BC; MN = BC/2.

\end{document}
```

**Step-by-step explanation:**
For arbitrary coordinates A,B,C, M=(A+B)/2 and N=(A+C)/2 imply N−M=(C−B)/2, so both parallelism and half-length are universal. The actual worked steps also state the two midpoint givens and apply the Grade9 midpoint theorem. Both requested claims are present.

**Independent verification:**
For arbitrary coordinates A,B,C, M=(A+B)/2 and N=(A+C)/2 imply N−M=(C−B)/2, so both parallelism and half-length are universal. The actual worked steps also state the two midpoint givens and apply the Grade9 midpoint theorem. Both requested claims are present.

**Evaluation:**
- Mathematical correctness: Pass.
- Completeness: Pass.
- Explanation quality: Fail.
- LaTeX and formatting: Pass.
- Response latency: 0.249 seconds; scope: Complete text confirmation + HTTP solve + D1 persistence + full JSON response consumption + schema/KaTeX/all-field language audit; fixture OCR excluded.
- Final verdict: Fail.
- Automated review proxy: 95/100; components [40, 20, 11, 10, 10, 4] (40/20/15/10/10/5). Human satisfaction remains unmeasured.

**Failure analysis:** Hints only restate the target and theorem rather than showing the midpoint deduction; worked steps are complete. No mathematical substitution was made in the recorded answer.

## Question 4 — geo-dev-circle (application-frozen-development)

**Type:** circle-tangent
**Difficulty:** Hard
**Source:** Generated set B; geo-dev-circle.
**Split:** development

**Question statement:**
Cho đường tròn tâm \( O \), điểm \( P \) ở ngoài đường tròn. Hai tiếp tuyến \( PA,PB \) tiếp xúc tại \( A,B \). Chứng minh \( OP \) là đường trung trực của \( AB \).

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Cho đường tròn tâm \(O\), điểm \(P\) ở ngoài đường tròn. Hai tiếp tuyến \(PA,PB\) tiếp xúc tại \(A,B\). Chứng minh \(OP\) là đường trung trực của \(AB\).
\end{document}
```

**Bot's answer:**
Controlled failure: solve_timeout

**LaTeX solution:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Không nhận được lời giải: solve\_timeout
\end{document}
```

**Step-by-step explanation:** No generated solution was returned.

**Independent verification:** No mathematical answer to verify.

**Evaluation:**
- Mathematical correctness: Unverified.
- Completeness: Fail.
- Explanation quality: Fail.
- LaTeX and formatting: Fail.
- Response latency: 26.049 seconds; scope: Complete text confirmation + HTTP solve + D1 persistence + full JSON response consumption + schema/KaTeX/all-field language audit; fixture OCR excluded.
- Final verdict: Fail.

**Failure analysis:** solve_timeout

## Question 5 — ptnk-2025-chuyen-4a (application-frozen-development)

**Type:** ptnk2025-exam-4
**Difficulty:** Entrance-exam challenge
**Source:** Repository transcription: PTNK 2025 chuyên, question 4a; data/training/problems.jsonl and data/exam_sources.json; original-paper OCR marked needs review; ptnk-2025-chuyen-4a.
**Split:** development

**Question statement:**
Cho tam giác \( ABC \) nhọn nội tiếp đường tròn \( (O) \) có \( \hat A>\hat B>\hat C \) và điểm \( D \) trên cung nhỏ \( AC \) sao cho \( CD>AB \). Đường trung trực của \( DB \) cắt \( AB \) tại \( E \); đường trung trực của \( DC \) cắt \( AC \) tại \( F \). Chứng minh các điểm \( A,D,E,F \) thuộc một đường tròn và đường tròn này đi qua tâm \( O \) của \( (O) \).

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Cho tam giác \(ABC\) nhọn nội tiếp đường tròn \((O)\) có \(\hat A>\hat B>\hat C\) và điểm \(D\) trên cung nhỏ \(AC\) sao cho \(CD>AB\). Đường trung trực của \(DB\) cắt \(AB\) tại \(E\); đường trung trực của \(DC\) cắt \(AC\) tại \(F\). Chứng minh các điểm \(A,D,E,F\) thuộc một đường tròn và đường tròn này đi qua tâm \(O\) của \((O)\).
\end{document}
```

**Bot's answer:**
**Interpretation:** Cho tam giác \( ABC \) nhọn nội tiếp đường tròn \( (O) \) có \( \hat A>\hat B>\hat C \) và điểm \( D \) trên cung nhỏ \( AC \) sao cho \( CD>AB \). Đường trung trực của \( DB \) cắt \( AB \) tại \( E \); đường trung trực của \( DC \) cắt \( AC \) tại \( F \). Chứng minh các điểm \( A,D,E,F \) thuộc một đường tròn và đường tròn này đi qua tâm \( O \) của \( (O) \).
**Strategy:** Chứng minh lần lượt: A, D, E, F cùng thuộc một đường tròn; đường tròn qua A, D, E, F đi qua O. Mỗi bước chỉ dùng giả thiết, cách dựng hình và các kết quả đã chứng minh trước đó.
**givens:** Cho tam giác \( ABC \) nhọn nội tiếp đường tròn \( (O) \) có \( \hat A>\hat B>\hat C \) và điểm \( D \) trên cung nhỏ \( AC \) sao cho \( CD>AB \); Đường trung trực của \( DB \) cắt \( AB \) tại \( E \); đường trung trực của \( DC \) cắt \( AC \) tại \( F \)

**Actual hints:**
- h1: Trong tứ giác ADFE, hai đỉnh nào cùng nhìn một cạnh dưới hai góc bằng nhau?
  Tứ giác có hai đỉnh kề nhau cùng nhìn một cạnh dưới hai góc bằng nhau thì nội tiếp
  Hướng: chứng minh ∠AED = ∠AFD.
Khi đó E và F cùng nhìn cạnh AD dưới hai góc bằng nhau ⇒ tứ giác ADFE nội tiếp.
Để có ∠AED = ∠AFD, dùng:
• ∠EDB = ∠EBD (△EDB cân tại E)
• tứ giác ABCD nội tiếp (O)
• ∠FDC = ∠FCD (△FDC cân tại F)
  \[ A, D, E, F\text{ cùng thuộc một đường tròn} \]
- h2: Dùng tính chất nào để chứng minh tứ giác ADOE nội tiếp?
  qua ba điểm không thẳng hàng chỉ có một đường tròn
  Hướng:
• tứ giác ADFE nội tiếp (gợi ý 1)
• tứ giác AEOF nội tiếp
⇒ tứ giác ADOE nội tiếp (qua ba điểm không thẳng hàng chỉ có một đường tròn).
  \[ A, D, E, O\text{ cùng thuộc một đường tròn} \]

**Actual worked steps:**
1. **A, D, E, F cùng thuộc một đường tròn** — Ta có:
∠AED = ∠EBD + ∠EDB (góc ngoài của △EBD)
= 2∠EBD (△EDB cân tại E)
= 2∠ACD (tứ giác ABCD nội tiếp (O))
= ∠ACD + ∠FDC (△FDC cân tại F)
= ∠AFD (góc ngoài của △FCD)
⇒ ∠AED = ∠AFD
⇒ hai đỉnh E, F cùng nhìn cạnh AD dưới hai góc bằng nhau
⇒ tứ giác ADFE nội tiếp.
\[ \begin{aligned}\widehat{AED} &= \widehat{EBD} + \widehat{EDB} \\ &= 2\widehat{EBD} \\ &= 2\widehat{ACD} \\ &= \widehat{ACD} + \widehat{FDC} \\ &= \widehat{AFD} \\ &\Rightarrow \widehat{AED} = \widehat{AFD} \\ &\Rightarrow A, D, E, F\text{ cùng thuộc một đường tròn}\end{aligned} \]
Reason: cộng, trừ góc; dấu hiệu tứ giác nội tiếp
2. **EO ⊥ BD** — • ED = EB (E thuộc đường trung trực của DB)
• OB = OD (bán kính)
⇒ EO là đường trung trực của BD (hai điểm cách đều hai đầu đoạn thẳng)
⇒ EO ⊥ BD.
\[ EO \perp BD \]
Reason: đường trung trực của đoạn thẳng
3. **FO ⊥ CD** — • FD = FC (F thuộc đường trung trực của DC)
• OC = OD (bán kính)
⇒ FO là đường trung trực của CD (hai điểm cách đều hai đầu đoạn thẳng)
⇒ FO ⊥ CD.
\[ FO \perp CD \]
Reason: đường trung trực của đoạn thẳng
4. **O, A, E, F cùng thuộc một đường tròn** — Ta có:
∠OEA = 180° − ∠OEB (hai góc kề bù)
= 90° + ∠ABD (EO ⊥ BD, bước 2: hai góc nhọn của tam giác vuông phụ nhau)
= 90° + ∠ACD (tứ giác ABCD nội tiếp (O))
= ∠OFC (FO ⊥ CD, bước 3: hai góc nhọn của tam giác vuông phụ nhau)
= 180° − ∠OFA (hai góc kề bù)
⇒ ∠OEA + ∠OFA = 180°
⇒ tứ giác AEOF có tổng hai góc đối bằng 180°
⇒ tứ giác AEOF nội tiếp.
\[ \begin{aligned}\widehat{OEA} &= 180^\circ - \widehat{OEB} \\ &= 90^\circ + \widehat{ABD} \\ &= 90^\circ + \widehat{ACD} \\ &= \widehat{OFC} \\ &= 180^\circ - \widehat{OFA} \\ &\Rightarrow \widehat{OEA} + \widehat{OFA} = 180^\circ \\ &\Rightarrow O, A, E, F\text{ cùng thuộc một đường tròn}\end{aligned} \]
Reason: cộng, trừ góc; dấu hiệu tứ giác nội tiếp
5. **đường tròn qua A, D, E, F đi qua O** — • tứ giác ADFE nội tiếp (bước 1)
• tứ giác AEOF nội tiếp (bước 4)
⇒ hai đường tròn cùng đi qua A, E, F nên trùng nhau (qua ba điểm chỉ có một đường tròn)
⇒ A, D, E, F, O cùng thuộc một đường tròn.
\[ A, D, E, O\text{ cùng thuộc một đường tròn} \]
Reason: qua ba điểm không thẳng hàng chỉ có một đường tròn

**Returned conclusion metadata:** Đã chứng minh: A, D, E, F cùng thuộc một đường tròn; đường tròn qua A, D, E, F đi qua O.

**LaTeX solution:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Chứng minh lần lượt: A, D, E, F cùng thuộc một đường tròn; đường tròn qua A, D, E, F đi qua O. Mỗi bước chỉ dùng giả thiết, cách dựng hình và các kết quả đã chứng minh trước đó.
\begin{enumerate}
\item A, D, E, F cùng thuộc một đường tròn. Ta có:
∠AED = ∠EBD + ∠EDB (góc ngoài của △EBD)
= 2∠EBD (△EDB cân tại E)
= 2∠ACD (tứ giác ABCD nội tiếp (O))
= ∠ACD + ∠FDC (△FDC cân tại F)
= ∠AFD (góc ngoài của △FCD)
⇒ ∠AED = ∠AFD
⇒ hai đỉnh E, F cùng nhìn cạnh AD dưới hai góc bằng nhau
⇒ tứ giác ADFE nội tiếp.
\[\begin{aligned}\widehat{AED} &= \widehat{EBD} + \widehat{EDB} \\ &= 2\widehat{EBD} \\ &= 2\widehat{ACD} \\ &= \widehat{ACD} + \widehat{FDC} \\ &= \widehat{AFD} \\ &\Rightarrow \widehat{AED} = \widehat{AFD} \\ &\Rightarrow A, D, E, F\text{ cùng thuộc một đường tròn}\end{aligned}\]
cộng, trừ góc; dấu hiệu tứ giác nội tiếp
\item EO ⊥ BD. • ED = EB (E thuộc đường trung trực của DB)
• OB = OD (bán kính)
⇒ EO là đường trung trực của BD (hai điểm cách đều hai đầu đoạn thẳng)
⇒ EO ⊥ BD.
\[EO \perp BD\]
đường trung trực của đoạn thẳng
\item FO ⊥ CD. • FD = FC (F thuộc đường trung trực của DC)
• OC = OD (bán kính)
⇒ FO là đường trung trực của CD (hai điểm cách đều hai đầu đoạn thẳng)
⇒ FO ⊥ CD.
\[FO \perp CD\]
đường trung trực của đoạn thẳng
\item O, A, E, F cùng thuộc một đường tròn. Ta có:
∠OEA = 180° − ∠OEB (hai góc kề bù)
= 90° + ∠ABD (EO ⊥ BD, bước 2: hai góc nhọn của tam giác vuông phụ nhau)
= 90° + ∠ACD (tứ giác ABCD nội tiếp (O))
= ∠OFC (FO ⊥ CD, bước 3: hai góc nhọn của tam giác vuông phụ nhau)
= 180° − ∠OFA (hai góc kề bù)
⇒ ∠OEA + ∠OFA = 180°
⇒ tứ giác AEOF có tổng hai góc đối bằng 180°
⇒ tứ giác AEOF nội tiếp.
\[\begin{aligned}\widehat{OEA} &= 180^\circ - \widehat{OEB} \\ &= 90^\circ + \widehat{ABD} \\ &= 90^\circ + \widehat{ACD} \\ &= \widehat{OFC} \\ &= 180^\circ - \widehat{OFA} \\ &\Rightarrow \widehat{OEA} + \widehat{OFA} = 180^\circ \\ &\Rightarrow O, A, E, F\text{ cùng thuộc một đường tròn}\end{aligned}\]
cộng, trừ góc; dấu hiệu tứ giác nội tiếp
\item đường tròn qua A, D, E, F đi qua O. • tứ giác ADFE nội tiếp (bước 1)
• tứ giác AEOF nội tiếp (bước 4)
⇒ hai đường tròn cùng đi qua A, E, F nên trùng nhau (qua ba điểm chỉ có một đường tròn)
⇒ A, D, E, F, O cùng thuộc một đường tròn.
\[A, D, E, O\text{ cùng thuộc một đường tròn}\]
qua ba điểm không thẳng hàng chỉ có một đường tròn
\end{enumerate}
Đã chứng minh: A, D, E, F cùng thuộc một đường tròn; đường tròn qua A, D, E, F đi qua O.

\end{document}
```

**Step-by-step explanation:**
Independent admissible counterexample on the unit circle: polar angles A=0°, B=300°, C=140°, D=70°. Triangle angles are80°,70°,30° (acute and ordered), D is on minor arc AC, CD=1.14715>AB=1. E on line AB has parameter−0.106398 (outside beyond A), F on AC has parameter0.627427. Then angle AED=110° but AFD=70° and EBD=35°. The actual first equality AED=EBD+EDB is false in this configuration; the required concyclicity uses supplementary angles. Local perturbations of one drawing do not prove point order. Full coordinates are archived in geometry-configuration-counterexample.json.

**Independent verification:**
Independent admissible counterexample on the unit circle: polar angles A=0°, B=300°, C=140°, D=70°. Triangle angles are80°,70°,30° (acute and ordered), D is on minor arc AC, CD=1.14715>AB=1. E on line AB has parameter−0.106398 (outside beyond A), F on AC has parameter0.627427. Then angle AED=110° but AFD=70° and EBD=35°. The actual first equality AED=EBD+EDB is false in this configuration; the required concyclicity uses supplementary angles. Local perturbations of one drawing do not prove point order. Full coordinates are archived in geometry-configuration-counterexample.json.

**Evaluation:**
- Mathematical correctness: Fail.
- Completeness: Fail.
- Explanation quality: Fail.
- LaTeX and formatting: Pass.
- Response latency: 0.537 seconds; scope: Complete text confirmation + HTTP solve + D1 persistence + full JSON response consumption + schema/KaTeX/all-field language audit; fixture OCR excluded.
- Final verdict: Fail.
- Automated review proxy: 51/100; components [20, 5, 8, 8, 9, 1] (40/20/15/10/10/5). Human satisfaction remains unmeasured.

**Failure analysis:** Critical incorrect universal proof: point order was inferred from the illustration, despite the stated constraints allowing another case. Frozen output and score remain unchanged. Final integration conservatively rejects undirected angle chases involving unrestricted line intersections until order or all cases are proved; no held-out tuning or reevaluation followed.

## Question 6 — geo-ho-altitude (application-frozen-held_out)

**Type:** right-altitude-similarity
**Difficulty:** Hard
**Source:** Generated held-out set E, created after configuration freeze; geo-ho-altitude.
**Split:** held_out

**Question statement:**
Cho tam giác \( ABC \) vuông tại \( A \), \( AB=6 \), \( AC=8 \). Đường cao \( AH \) với \( H\in BC \). Tính \( BH \), \( CH \), \( AH \) và giải thích các hệ thức sử dụng.

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Cho tam giác \(ABC\) vuông tại \(A\), \(AB=6\), \(AC=8\). Đường cao \(AH\) với \(H\in BC\). Tính \(BH\), \(CH\), \(AH\) và giải thích các hệ thức sử dụng.
\end{document}
```

**Bot's answer:**
Controlled failure: solve_timeout

**LaTeX solution:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Không nhận được lời giải: solve\_timeout
\end{document}
```

**Step-by-step explanation:** No generated solution was returned.

**Independent verification:** No mathematical answer to verify. Independent reference, not the bot answer: Pythagoras givesBC10. Similar right triangles giveAB²=BH·BC, AC²=CH·BC, soBH18/5, CH32/5. Area computed using perpendicular legs and baseBC givesAH=AB·AC/BC=24/5. Orthogonality and similarity, not a drawing, justify the relations.

**Evaluation:**
- Mathematical correctness: Unverified.
- Completeness: Fail.
- Explanation quality: Fail.
- LaTeX and formatting: Fail.
- Response latency: 26.032 seconds; scope: Complete text confirmation + HTTP solve + D1 persistence + full JSON response consumption + schema/KaTeX/all-field language audit; fixture OCR excluded.
- Final verdict: Fail.

**Failure analysis:** solve_timeout

## Question 7 — geo-ho-chord (application-frozen-held_out)

**Type:** chord-distance-center
**Difficulty:** Medium
**Source:** Generated held-out set E, created after configuration freeze; geo-ho-chord.
**Split:** held_out

**Question statement:**
Đường tròn tâm \( O \) có bán kính \( 5 \). Dây \( AB \) có độ dài \( 8 \). Gọi \( M \) là trung điểm \( AB \). Tính \( OM \) và giải thích vì sao \( OM\perp AB \).

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Đường tròn tâm \(O\) có bán kính \(5\). Dây \(AB\) có độ dài \(8\). Gọi \(M\) là trung điểm \(AB\). Tính \(OM\) và giải thích vì sao \(OM\perp AB\).
\end{document}
```

**Bot's answer:**
Controlled failure: solve_timeout

**LaTeX solution:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Không nhận được lời giải: solve\_timeout
\end{document}
```

**Step-by-step explanation:** No generated solution was returned.

**Independent verification:** No mathematical answer to verify. Independent reference, not the bot answer: OA=OB=5, AM=BM=4 and OM shared imply trianglesOMA,OMB congruent by SSS. Equal adjacent angles atM total180°, so each90°. Pythagoras givesOM²=25-16=9; OM3.

**Evaluation:**
- Mathematical correctness: Unverified.
- Completeness: Fail.
- Explanation quality: Fail.
- LaTeX and formatting: Fail.
- Response latency: 26.043 seconds; scope: Complete text confirmation + HTTP solve + D1 persistence + full JSON response consumption + schema/KaTeX/all-field language audit; fixture OCR excluded.
- Final verdict: Fail.

**Failure analysis:** solve_timeout

## Question 8 — geo-ho-cyclic (application-frozen-held_out)

**Type:** cyclic-opposite-angle
**Difficulty:** Easy
**Source:** Generated held-out set E, created after configuration freeze; geo-ho-cyclic.
**Split:** held_out

**Question statement:**
Cho tứ giác \( ABCD \) nội tiếp một đường tròn và \( \angle DAB=110^{\circ} \). Tính \( \angle BCD \).

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Cho tứ giác \(ABCD\) nội tiếp một đường tròn và \(\angle DAB=110^{\circ}\). Tính \(\angle BCD\).
\end{document}
```

**Bot's answer:**
Controlled failure: solve_timeout

**LaTeX solution:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Không nhận được lời giải: solve\_timeout
\end{document}
```

**Step-by-step explanation:** No generated solution was returned.

**Independent verification:** No mathematical answer to verify. Independent reference, not the bot answer: Opposite angles of a cyclic quadrilateral sum180°. DAB is the angle atA, BCD atC; C=180-110=70°.

**Evaluation:**
- Mathematical correctness: Unverified.
- Completeness: Fail.
- Explanation quality: Fail.
- LaTeX and formatting: Fail.
- Response latency: 26.034 seconds; scope: Complete text confirmation + HTTP solve + D1 persistence + full JSON response consumption + schema/KaTeX/all-field language audit; fixture OCR excluded.
- Final verdict: Fail.

**Failure analysis:** solve_timeout

## Question 9 — geo-ho-ceva (application-frozen-held_out)

**Type:** ceva-concurrency-ratio
**Difficulty:** Entrance-exam challenge
**Source:** Generated held-out set E, created after configuration freeze; geo-ho-ceva.
**Split:** held_out

**Question statement:**
Cho tam giác \( ABC \), các điểm \( D,E,F \) lần lượt nằm trong các cạnh \( BC,CA,AB \). Ba đường thẳng \( AD,BE,CF \) đồng quy. Biết \( BD/DC=2 \), \( CE/EA=3 \). Tính \( AF/FB \) và nêu rõ định lí áp dụng.

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Cho tam giác \(ABC\), các điểm \(D,E,F\) lần lượt nằm trong các cạnh \(BC,CA,AB\). Ba đường thẳng \(AD,BE,CF\) đồng quy. Biết \(BD/DC=2\), \(CE/EA=3\). Tính \(AF/FB\) và nêu rõ định lí áp dụng.
\end{document}
```

**Bot's answer:**
Controlled failure: solve_timeout

**LaTeX solution:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Không nhận được lời giải: solve\_timeout
\end{document}
```

**Step-by-step explanation:** No generated solution was returned.

**Independent verification:** No mathematical answer to verify. Independent reference, not the bot answer: Ceva applies to three concurrent cevians withD,E,F internal onBC,CA,AB. (BD/DC)(CE/EA)(AF/FB)=1; 2·3·ratio=1, soAF/FB=1/6.

**Evaluation:**
- Mathematical correctness: Unverified.
- Completeness: Fail.
- Explanation quality: Fail.
- LaTeX and formatting: Fail.
- Response latency: 26.044 seconds; scope: Complete text confirmation + HTTP solve + D1 persistence + full JSON response consumption + schema/KaTeX/all-field language audit; fixture OCR excluded.
- Final verdict: Fail.

**Failure analysis:** solve_timeout

## Question 10 — geo-val-right (application-validation-fast)

**Type:** right-triangle-area
**Difficulty:** Medium
**Source:** Generated validation set C; geo-val-right.
**Split:** validation

**Question statement:**
Cho tam giác \( ABC \) vuông tại \( A \), \( AB=9 \), \( AC=12 \). Tính \( BC \) và diện tích tam giác \( ABC \).

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Cho tam giác \(ABC\) vuông tại \(A\), \(AB=9\), \(AC=12\). Tính \(BC\) và diện tích tam giác \(ABC\).
\end{document}
```

**Bot's answer:**
**Interpretation:** Cho tam giác \( ABC \) vuông tại \( A \), \( AB=9 \), \( AC=12 \). Tính \( BC \) và diện tích tam giác \( ABC \).
**Strategy:** Ta sẽ dùng định lý Pythagore để tính độ dài đường chéo BC từ hai cạnh góc vuông AB và AC. Sau đó, tính diện tích tam giác vuông bằng công thức nửa tích hai cạnh góc vuông.
**givens:** tam giác ABC vuông tại A; AB = 9; AC = 12
**unknowns:** BC; diện tích tam giác ABC

**Actual hints:**
- hints_1: Trong tam giác vuông tại A, hai cạnh nào là cạnh góc vuông?
  Góc vuông ở đỉnh A, nên các cạnh tạo thành góc A là AB và AC.
  Vì tam giác vuông tại A, nên góc BAC là góc vuông. Hai cạnh tạo thành góc BAC là AB và AC. Đây là hai cạnh góc vuông, còn BC là đường chéo đối diện với góc vuông.
- hints_2: Định lý Pythagore nói gì về mối quan hệ giữa ba cạnh của một tam giác vuông?
  Trong tam giác vuông, bình phương đường chéo bằng tổng bình phương hai cạnh góc vuông.
  Áp dụng định lý Pythagore: \( BC^2 = AB^2 + AC^2 \). Ta thay các giá trị đã biết để tính \( BC \).
  \[ BC^2 = AB^2 + AC^2 \]
- hints_3: Công thức tính diện tích tam giác vuông là gì?
  Diện tích tam giác vuông bằng nửa tích hai cạnh góc vuông.
  Vì tam giác vuông tại A, diện tích \( S = \frac{1}{2} \cdot AB \cdot AC \). Ta thay các giá trị của AB và AC để tính diện tích.
  \[ S = \frac{1}{2} \cdot AB \cdot AC \]
- hints_4: Ta đã biết AB và AC, hãy tính BC và diện tích từng bước.
  Thay số vào công thức Pythagore và công thức diện tích.
  Tính \( BC = \sqrt{9^2 + 12^2} = \sqrt{81 + 144} = \sqrt{225} = 15 \). Tính \( S = \frac{1}{2} \cdot 9 \cdot 12 = 54 \).
  \[ BC = 15\quad\text{vs}\quad S = 54 \]
- hints_5: Kết quả cuối cùng là gì?
  Ghi lại BC và diện tích đã tính được.
  BC = 15, diện tích tam giác ABC = 54 (đơn vị vuông).
  \[ BC = 15, S = 54 \]

**Actual worked steps:**
1. **Xác định hai cạnh góc vuông và đường chéo** — Trong tam giác ABC vuông tại A, góc BAC là góc vuông. Hai cạnh tạo thành góc BAC là AB và AC, do đó AB và AC là hai cạnh góc vuông. Cạnh đối diện với góc vuông là BC, là đường chéo của tam giác.
Reason: Định nghĩa tam giác vuông
2. **Áp dụng định lý Pythagore để tính BC** — Theo định lý Pythagore trong tam giác vuông: \( BC^2 = AB^2 + AC^2 \). Thay \( AB = 9 \), \( AC = 12 \) vào ta được \( BC^2 = 9^2 + 12^2 = 81 + 144 = 225 \). Do đó \( BC = \sqrt{225} = 15 \) (loại trừ nghiệm âm vì độ dài dương).
\[ BC^2 = AB^2 + AC^2\\BC^2 = 9^2 + 12^2 = 81 + 144 = 225\\BC = \sqrt{225} = 15 \]
Reason: Định lý Pythagore
3. **Tính diện tích tam giác ABC** — Diện tích tam giác vuông bằng nửa tích hai cạnh góc vuông: \( S = \frac{1}{2} \cdot AB \cdot AC \). Thay \( AB = 9 \), \( AC = 12 \) ta được \( S = \frac{1}{2} \cdot 9 \cdot 12 = \frac{1}{2} \cdot 108 = 54 \).
\[ S = \frac{1}{2} \cdot AB \cdot AC\\S = \frac{1}{2} \cdot 9 \cdot 12 = 54 \]
Reason: Công thức diện tích tam giác vuông

**Returned conclusion metadata:** BC = 15, diện tích tam giác ABC = 54
\[ BC = 15\\S = 54 \]

**LaTeX solution:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Ta sẽ dùng định lý Pythagore để tính độ dài đường chéo BC từ hai cạnh góc vuông AB và AC. Sau đó, tính diện tích tam giác vuông bằng công thức nửa tích hai cạnh góc vuông.
\begin{enumerate}
\item Xác định hai cạnh góc vuông và đường chéo. Trong tam giác ABC vuông tại A, góc BAC là góc vuông. Hai cạnh tạo thành góc BAC là AB và AC, do đó AB và AC là hai cạnh góc vuông. Cạnh đối diện với góc vuông là BC, là đường chéo của tam giác.

Định nghĩa tam giác vuông
\item Áp dụng định lý Pythagore để tính BC. Theo định lý Pythagore trong tam giác vuông: \(BC^2 = AB^2 + AC^2\). Thay \(AB = 9\), \(AC = 12\) vào ta được \(BC^2 = 9^2 + 12^2 = 81 + 144 = 225\). Do đó \(BC = \sqrt{225} = 15\) (loại trừ nghiệm âm vì độ dài dương).
\[BC^2 = AB^2 + AC^2\\BC^2 = 9^2 + 12^2 = 81 + 144 = 225\\BC = \sqrt{225} = 15\]
Định lý Pythagore
\item Tính diện tích tam giác ABC. Diện tích tam giác vuông bằng nửa tích hai cạnh góc vuông: \(S = \frac{1}{2} \cdot AB \cdot AC\). Thay \(AB = 9\), \(AC = 12\) ta được \(S = \frac{1}{2} \cdot 9 \cdot 12 = \frac{1}{2} \cdot 108 = 54\).
\[S = \frac{1}{2} \cdot AB \cdot AC\\S = \frac{1}{2} \cdot 9 \cdot 12 = 54\]
Công thức diện tích tam giác vuông
\end{enumerate}
BC = 15, diện tích tam giác ABC = 54
\[BC = 15\\S = 54\]
\end{document}
```

**Step-by-step explanation:**
Pythagoras gives BC²=9²+12²=225, so positive length BC=15. Two perpendicular legs are base and height, giving area9·12/2=54. Drawing A=(5.4,7.2), B=(0,0), C=(15,0) indeed gives AB9,AC12 and perpendicular legs.

**Independent verification:**
Pythagoras gives BC²=9²+12²=225, so positive length BC=15. Two perpendicular legs are base and height, giving area9·12/2=54. Drawing A=(5.4,7.2), B=(0,0), C=(15,0) indeed gives AB9,AC12 and perpendicular legs.

**Evaluation:**
- Mathematical correctness: Pass.
- Completeness: Pass.
- Explanation quality: Fail.
- LaTeX and formatting: Fail.
- Response latency: 24.500 seconds; scope: Complete text confirmation + HTTP solve + D1 persistence + full JSON response consumption; fixture OCR excluded.
- Final verdict: Fail.
- Automated review proxy: 85/100; components [40, 20, 8, 9, 5, 3] (40/20/15/10/10/5). Human satisfaction remains unmeasured.

**Failure analysis:** Actual lesson repeatedly calls the hypotenuse a diagonal, and a math hint contains English vs. Correct numbers but terminology and leakage fail quality. The current glossary does not yet detect every Latin word; record unresolved rather than claim perfect hygiene.

## Question 11 — geo-val-tangents (application-validation-fast)

**Type:** cyclic-right-angles
**Difficulty:** Hard
**Source:** Generated validation set C; geo-val-tangents.
**Split:** validation

**Question statement:**
Từ điểm \( P \) ở ngoài đường tròn \( (O) \) kẻ hai tiếp tuyến \( PA,PB \) với các tiếp điểm \( A,B \). Chứng minh bốn điểm \( P,A,O,B \) cùng thuộc một đường tròn.

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Từ điểm \(P\) ở ngoài đường tròn \((O)\) kẻ hai tiếp tuyến \(PA,PB\) với các tiếp điểm \(A,B\). Chứng minh bốn điểm \(P,A,O,B\) cùng thuộc một đường tròn.
\end{document}
```

**Bot's answer:**
**Interpretation:** Từ điểm \( P \) ở ngoài đường tròn \( (O) \) kẻ hai tiếp tuyến \( PA,PB \) với các tiếp điểm \( A,B \). Chứng minh bốn điểm \( P,A,O,B \) cùng thuộc một đường tròn.
**Strategy:** Chứng minh lần lượt: P, A, O, B cùng thuộc một đường tròn. Mỗi bước chỉ dùng giả thiết, cách dựng hình và các kết quả đã chứng minh trước đó.
**givens:** Từ điểm \( P \) ở ngoài đường tròn \( (O) \) kẻ hai tiếp tuyến \( PA,PB \) với các tiếp điểm \( A,B \)

**Actual hints:**
- h1: Tứ giác AOBP có hai góc đối nào có tổng bằng 180°?
  Tứ giác có tổng hai góc đối bằng 180° thì nội tiếp
  Hướng: chứng minh ∠PAO + ∠PBO = 180°.
Đó là hai góc đối của tứ giác AOBP ⇒ tứ giác nội tiếp.
Để có ∠PAO + ∠PBO = 180°, dùng:
• PA ⊥ OA (tiếp tuyến vuông góc với bán kính tại tiếp điểm)
• PB ⊥ OB (tiếp tuyến vuông góc với bán kính tại tiếp điểm)
  \[ P, A, O, B\text{ cùng thuộc một đường tròn} \]

**Actual worked steps:**
1. **P, A, O, B cùng thuộc một đường tròn** — • ∠PAO + ∠PBO = 180° (vì PA ⊥ OA, tiếp tuyến vuông góc với bán kính tại tiếp điểm; PB ⊥ OB, tiếp tuyến vuông góc với bán kính tại tiếp điểm)
⇒ tứ giác AOBP có tổng hai góc đối bằng 180°
⇒ tứ giác AOBP nội tiếp.
\[ P, A, O, B\text{ cùng thuộc một đường tròn} \]
Reason: dấu hiệu tứ giác nội tiếp

**Returned conclusion metadata:** Đã chứng minh: P, A, O, B cùng thuộc một đường tròn.

**LaTeX solution:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Chứng minh lần lượt: P, A, O, B cùng thuộc một đường tròn. Mỗi bước chỉ dùng giả thiết, cách dựng hình và các kết quả đã chứng minh trước đó.
\begin{enumerate}
\item P, A, O, B cùng thuộc một đường tròn. • ∠PAO + ∠PBO = 180° (vì PA ⊥ OA, tiếp tuyến vuông góc với bán kính tại tiếp điểm; PB ⊥ OB, tiếp tuyến vuông góc với bán kính tại tiếp điểm)
⇒ tứ giác AOBP có tổng hai góc đối bằng 180°
⇒ tứ giác AOBP nội tiếp.
\[P, A, O, B\text{ cùng thuộc một đường tròn}\]
dấu hiệu tứ giác nội tiếp
\end{enumerate}
Đã chứng minh: P, A, O, B cùng thuộc một đường tròn.

\end{document}
```

**Step-by-step explanation:**
A tangent is perpendicular to the radius at its contact: ∠PAO=∠PBO=90°. These are opposite angles of quadrilateral PAOB; their sum is 180°, so the four distinct points are concyclic. Every premise follows from the two given tangencies.

**Independent verification:**
A tangent is perpendicular to the radius at its contact: ∠PAO=∠PBO=90°. These are opposite angles of quadrilateral PAOB; their sum is 180°, so the four distinct points are concyclic. Every premise follows from the two given tangencies.

**Evaluation:**
- Mathematical correctness: Pass.
- Completeness: Pass.
- Explanation quality: Pass.
- LaTeX and formatting: Pass.
- Response latency: 0.060 seconds; scope: Complete text confirmation + HTTP solve + D1 persistence + full JSON response consumption; fixture OCR excluded.
- Final verdict: Pass.
- Automated review proxy: 99/100; components [40, 20, 14, 10, 10, 5] (40/20/15/10/10/5). Human satisfaction remains unmeasured.

**Failure analysis:** No mathematical failure. Typed tangent points, construction highlighting and draggable external point are preserved. Machine status remains partial, despite this independently valid proof.

## Question 12 — geo-val-right (application-validation-final)

**Type:** right-triangle-area
**Difficulty:** Medium
**Source:** Generated validation set C; geo-val-right.
**Split:** validation

**Question statement:**
Cho tam giác \( ABC \) vuông tại \( A \), \( AB=9 \), \( AC=12 \). Tính \( BC \) và diện tích tam giác \( ABC \).

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Cho tam giác \(ABC\) vuông tại \(A\), \(AB=9\), \(AC=12\). Tính \(BC\) và diện tích tam giác \(ABC\).
\end{document}
```

**Bot's answer:**
**Interpretation:** Cho tam giác \( ABC \) vuông tại \( A \), \( AB=9 \), \( AC=12 \). Tính \( BC \) và diện tích tam giác \( ABC \).
**Strategy:** Ta sẽ dùng định lý Pythagore để tính BC vì tam giác vuông tại A. Sau đó tính diện tích bằng công thức nửa tích hai góc vuông.
**givens:** tam giác ABC vuông tại A; AB = 9; AC = 12
**unknowns:** BC; diện tích tam giác ABC
**interpretationNotes:** Vấn đề yêu cầu tính BC và diện tích tam giác vuông, nhưng trong phần phân tích đã được gán chủ đề là "cộng đồng" và "đếm số nguyên", điều này không khớp với nội dung bài toán. Cần làm rõ lại chủ đề và các khái niệm liên quan để phù hợp với bài toán hình học vuông góc.

**Actual hints:**
- hints_1: Tam giác ABC vuông ở đâu, vì vậy cạnh nào là huyền?
  Trong tam giác vuông, huyền là cạnh đối với góc vuông.
  Vì tam giác vuông tại A, nên góc BAC là góc vuông. Hai cạnh tạo góc vuông là AB và AC, còn cạnh đối diện là BC, chính là huyền.
- step2_hint: Định lý Pythagore nói gì về mối quan hệ giữa ba cạnh của tam giác vuông?
  Trong tam giác vuông, bình phương huyền bằng tổng bình phương hai góc vuông.
  Áp dụng định lý Pythagore: \( BC^2 = AB^2 + AC^2 \). Ta biết AB = 9, AC = 12, nên có thể tính bình phương từng cạnh rồi cộng lại.
  \[ BC^2 = AB^2 + AC^2 \]
- step3_hint: Sau khi tìm được BC, ta tính diện tích tam giác như thế nào?
  Diện tích tam giác vuông bằng nửa tích hai cạnh tạo góc vuông.
  Vì AB và AC là hai cạnh vuông góc, diện tích \( S = \frac{1}{2} \times AB \times AC \). Thay giá trị AB và AC vào tính kết quả.
  \[ S = \frac{1}{2} \cdot AB \cdot AC \]

**Actual worked steps:**
1. **Xác định huyền và hai góc vuông** — Tam giác ABC vuông tại A nên góc BAC là góc vuông. Hai cạnh AB và AC là hai cạnh tạo góc vuông, còn cạnh BC là huyền.
\[ \angle BAC = 90^\circ,\ AB\perp AC \]
Reason: Định nghĩa tam giác vuông
2. **Áp dụng định lý Pythagore để tính BC** — Theo định lý Pythagore trong tam giác vuông: \( BC^2 = AB^2 + AC^2 \). Thay AB = 9, AC = 12 vào ta được \( BC^2 = 9^2 + 12^2 = 81 + 144 = 225 \). Do đó \( BC = \sqrt{225} = 15 \) (vì độ dài luôn dương).
\[ BC^2 = 9^2 + 12^2 = 81 + 144 = 225\\BC = \sqrt{225} = 15 \]
Reason: Định lý Pythagore
3. **Tính diện tích tam giác ABC** — Diện tích tam giác vuông bằng nửa tích hai cạnh tạo góc vuông. Ta có \( S = \frac{1}{2} \times AB \times AC = \frac{1}{2} \times 9 \times 12 = \frac{1}{2} \times 108 = 54 \).
\[ S = \frac{1}{2} \cdot 9 \cdot 12 = 54 \]
Reason: Công thức diện tích tam giác vuông

**Returned conclusion metadata:** BC = 15, diện tích = 54
\[ BC = 15\\S = 54 \]

**LaTeX solution:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Ta sẽ dùng định lý Pythagore để tính BC vì tam giác vuông tại A. Sau đó tính diện tích bằng công thức nửa tích hai góc vuông.
\begin{enumerate}
\item Xác định huyền và hai góc vuông. Tam giác ABC vuông tại A nên góc BAC là góc vuông. Hai cạnh AB và AC là hai cạnh tạo góc vuông, còn cạnh BC là huyền.
\[\angle BAC = 90^\circ,\ AB\perp AC\]
Định nghĩa tam giác vuông
\item Áp dụng định lý Pythagore để tính BC. Theo định lý Pythagore trong tam giác vuông: \(BC^2 = AB^2 + AC^2\). Thay AB = 9, AC = 12 vào ta được \(BC^2 = 9^2 + 12^2 = 81 + 144 = 225\). Do đó \(BC = \sqrt{225} = 15\) (vì độ dài luôn dương).
\[BC^2 = 9^2 + 12^2 = 81 + 144 = 225\\BC = \sqrt{225} = 15\]
Định lý Pythagore
\item Tính diện tích tam giác ABC. Diện tích tam giác vuông bằng nửa tích hai cạnh tạo góc vuông. Ta có \(S = \frac{1}{2} \times AB \times AC = \frac{1}{2} \times 9 \times 12 = \frac{1}{2} \times 108 = 54\).
\[S = \frac{1}{2} \cdot 9 \cdot 12 = 54\]
Công thức diện tích tam giác vuông
\end{enumerate}
BC = 15, diện tích = 54
\[BC = 15\\S = 54\]
\end{document}
```

**Step-by-step explanation:**
Pythagoras gives BC=√(81+144)=15 and area9·12/2=54. Positivity selects the positive square root. These are valid conclusions from perpendicular legs; no diagram-based proof is needed.

**Independent verification:**
Pythagoras gives BC=√(81+144)=15 and area9·12/2=54. Positivity selects the positive square root. These are valid conclusions from perpendicular legs; no diagram-based proof is needed.

**Evaluation:**
- Mathematical correctness: Pass.
- Completeness: Pass.
- Explanation quality: Fail.
- LaTeX and formatting: Pass.
- Response latency: 26.055 seconds; scope: Complete text confirmation + HTTP solve + D1 persistence + full JSON response consumption + schema/KaTeX/all-field language audit; fixture OCR excluded.
- Final verdict: Fail.
- Automated review proxy: 87/100; components [40, 20, 6, 10, 8, 3] (40/20/15/10/10/5). Human satisfaction remains unmeasured.

**Failure analysis:** Analysis invents counting and divisibility concepts and claims the topic needs clarification; a hint and result call legs angles. Step verification method fields retain English internal labels. Correct numbers do not make the lesson coherent.

## Question 13 — geo-val-tangents (application-validation-final)

**Type:** cyclic-right-angles
**Difficulty:** Hard
**Source:** Generated validation set C; geo-val-tangents.
**Split:** validation

**Question statement:**
Từ điểm \( P \) ở ngoài đường tròn \( (O) \) kẻ hai tiếp tuyến \( PA,PB \) với các tiếp điểm \( A,B \). Chứng minh bốn điểm \( P,A,O,B \) cùng thuộc một đường tròn.

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Từ điểm \(P\) ở ngoài đường tròn \((O)\) kẻ hai tiếp tuyến \(PA,PB\) với các tiếp điểm \(A,B\). Chứng minh bốn điểm \(P,A,O,B\) cùng thuộc một đường tròn.
\end{document}
```

**Bot's answer:**
**Interpretation:** Từ điểm \( P \) ở ngoài đường tròn \( (O) \) kẻ hai tiếp tuyến \( PA,PB \) với các tiếp điểm \( A,B \). Chứng minh bốn điểm \( P,A,O,B \) cùng thuộc một đường tròn.
**Strategy:** Chứng minh lần lượt: P, A, O, B cùng thuộc một đường tròn. Mỗi bước chỉ dùng giả thiết, cách dựng hình và các kết quả đã chứng minh trước đó.
**givens:** Từ điểm \( P \) ở ngoài đường tròn \( (O) \) kẻ hai tiếp tuyến \( PA,PB \) với các tiếp điểm \( A,B \)

**Actual hints:**
- h1: Tứ giác AOBP có hai góc đối nào có tổng bằng 180°?
  Tứ giác có tổng hai góc đối bằng 180° thì nội tiếp
  Hướng: chứng minh ∠PAO + ∠PBO = 180°.
Đó là hai góc đối của tứ giác AOBP ⇒ tứ giác nội tiếp.
Để có ∠PAO + ∠PBO = 180°, dùng:
• PA ⊥ OA (tiếp tuyến vuông góc với bán kính tại tiếp điểm)
• PB ⊥ OB (tiếp tuyến vuông góc với bán kính tại tiếp điểm)
  \[ P, A, O, B\text{ cùng thuộc một đường tròn} \]

**Actual worked steps:**
1. **P, A, O, B cùng thuộc một đường tròn** — • ∠PAO + ∠PBO = 180° (vì PA ⊥ OA, tiếp tuyến vuông góc với bán kính tại tiếp điểm; PB ⊥ OB, tiếp tuyến vuông góc với bán kính tại tiếp điểm)
⇒ tứ giác AOBP có tổng hai góc đối bằng 180°
⇒ tứ giác AOBP nội tiếp.
\[ P, A, O, B\text{ cùng thuộc một đường tròn} \]
Reason: dấu hiệu tứ giác nội tiếp

**Returned conclusion metadata:** Đã chứng minh: P, A, O, B cùng thuộc một đường tròn.

**LaTeX solution:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Chứng minh lần lượt: P, A, O, B cùng thuộc một đường tròn. Mỗi bước chỉ dùng giả thiết, cách dựng hình và các kết quả đã chứng minh trước đó.
\begin{enumerate}
\item P, A, O, B cùng thuộc một đường tròn. • ∠PAO + ∠PBO = 180° (vì PA ⊥ OA, tiếp tuyến vuông góc với bán kính tại tiếp điểm; PB ⊥ OB, tiếp tuyến vuông góc với bán kính tại tiếp điểm)
⇒ tứ giác AOBP có tổng hai góc đối bằng 180°
⇒ tứ giác AOBP nội tiếp.
\[P, A, O, B\text{ cùng thuộc một đường tròn}\]
dấu hiệu tứ giác nội tiếp
\end{enumerate}
Đã chứng minh: P, A, O, B cùng thuộc một đường tròn.

\end{document}
```

**Step-by-step explanation:**
A tangent is perpendicular to the radius at its contact: ∠PAO=∠PBO=90°. These are opposite angles of quadrilateral PAOB; their sum is 180°, so the four distinct points are concyclic. Every premise follows from the two given tangencies.

**Independent verification:**
A tangent is perpendicular to the radius at its contact: ∠PAO=∠PBO=90°. These are opposite angles of quadrilateral PAOB; their sum is 180°, so the four distinct points are concyclic. Every premise follows from the two given tangencies.

**Evaluation:**
- Mathematical correctness: Pass.
- Completeness: Pass.
- Explanation quality: Pass.
- LaTeX and formatting: Pass.
- Response latency: 0.045 seconds; scope: Complete text confirmation + HTTP solve + D1 persistence + full JSON response consumption + schema/KaTeX/all-field language audit; fixture OCR excluded.
- Final verdict: Pass.
- Automated review proxy: 99/100; components [40, 20, 14, 10, 10, 5] (40/20/15/10/10/5). Human satisfaction remains unmeasured.

**Failure analysis:** No mathematical failure. Typed tangent points, construction highlighting and draggable external point are preserved. Machine status remains partial, despite this independently valid proof.

## Question 14 — geo-val-menelaus (application-validation-final)

**Type:** transversal-menelaus
**Difficulty:** Entrance-exam challenge
**Source:** Generated set D; geo-val-menelaus.
**Split:** validation

**Question statement:**
Cho tam giác \( ABC \). Điểm \( D \) thuộc cạnh \( AB \), điểm \( E \) thuộc cạnh \( AC \), thỏa mãn \( AD/DB=1/2 \), \( AE/EC=2 \). Đường thẳng \( DE \) cắt đường thẳng \( BC \) tại \( F \). Chứng minh \( F \) nằm ngoài đoạn \( BC \) và tính tỉ số \( FB/FC \).

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Cho tam giác \(ABC\). Điểm \(D\) thuộc cạnh \(AB\), điểm \(E\) thuộc cạnh \(AC\), thỏa mãn \(AD/DB=1/2\), \(AE/EC=2\). Đường thẳng \(DE\) cắt đường thẳng \(BC\) tại \(F\). Chứng minh \(F\) nằm ngoài đoạn \(BC\) và tính tỉ số \(FB/FC\).
\end{document}
```

**Bot's answer:**
Controlled failure: solve_timeout

**LaTeX solution:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Không nhận được lời giải: solve\_timeout
\end{document}
```

**Step-by-step explanation:** No generated solution was returned.

**Independent verification:** No mathematical answer to verify.

**Evaluation:**
- Mathematical correctness: Unverified.
- Completeness: Fail.
- Explanation quality: Fail.
- LaTeX and formatting: Fail.
- Response latency: 26.024 seconds; scope: Complete text confirmation + HTTP solve + D1 persistence + full JSON response consumption + schema/KaTeX/all-field language audit; fixture OCR excluded.
- Final verdict: Fail.

**Failure analysis:** solve_timeout

## Question 15 — geo-val-incenter (application-validation-final)

**Type:** incenter-angle
**Difficulty:** Medium
**Source:** Generated set D; geo-val-incenter.
**Split:** validation

**Question statement:**
Cho tam giác \( ABC \) có \( \angle B=50^{\circ} \), \( \angle C=70^{\circ} \). Hai đường phân giác trong tại \( B,C \) cắt nhau tại \( I \). Tính \( \angle BIC \).

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Cho tam giác \(ABC\) có \(\angle B=50^{\circ}\), \(\angle C=70^{\circ}\). Hai đường phân giác trong tại \(B,C\) cắt nhau tại \(I\). Tính \(\angle BIC\).
\end{document}
```

**Bot's answer:**
Controlled failure: solve_malformed_output

**LaTeX solution:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Không nhận được lời giải: solve\_malformed\_output
\end{document}
```

**Step-by-step explanation:** No generated solution was returned.

**Independent verification:** No mathematical answer to verify.

**Evaluation:**
- Mathematical correctness: Unverified.
- Completeness: Fail.
- Explanation quality: Fail.
- LaTeX and formatting: Fail.
- Response latency: 25.843 seconds; scope: Complete text confirmation + HTTP solve + D1 persistence + full JSON response consumption + schema/KaTeX/all-field language audit; fixture OCR excluded.
- Final verdict: Fail.

**Failure analysis:** solve_malformed_output

## Question 16 — geo-val-right (application-validation-minimal)

**Type:** right-triangle-area
**Difficulty:** Medium
**Source:** Generated validation set C; geo-val-right.
**Split:** validation

**Question statement:**
Cho tam giác \( ABC \) vuông tại \( A \), \( AB=9 \), \( AC=12 \). Tính \( BC \) và diện tích tam giác \( ABC \).

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Cho tam giác \(ABC\) vuông tại \(A\), \(AB=9\), \(AC=12\). Tính \(BC\) và diện tích tam giác \(ABC\).
\end{document}
```

**Bot's answer:**
Controlled failure: solve_timeout

**LaTeX solution:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Không nhận được lời giải: solve\_timeout
\end{document}
```

**Step-by-step explanation:** No generated solution was returned.

**Independent verification:** No mathematical answer to verify.

**Evaluation:**
- Mathematical correctness: Unverified.
- Completeness: Fail.
- Explanation quality: Fail.
- LaTeX and formatting: Fail.
- Response latency: 26.033 seconds; scope: Complete text confirmation + HTTP solve + D1 persistence + full JSON response consumption + schema/KaTeX/all-field language audit; fixture OCR excluded.
- Final verdict: Fail.

**Failure analysis:** solve_timeout

## Question 17 — geo-val-right (application-validation)

**Type:** right-triangle-area
**Difficulty:** Medium
**Source:** Generated validation set C; geo-val-right.
**Split:** validation

**Question statement:**
Cho tam giác \( ABC \) vuông tại \( A \), \( AB=9 \), \( AC=12 \). Tính \( BC \) và diện tích tam giác \( ABC \).

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Cho tam giác \(ABC\) vuông tại \(A\), \(AB=9\), \(AC=12\). Tính \(BC\) và diện tích tam giác \(ABC\).
\end{document}
```

**Bot's answer:**
Controlled failure: solve_timeout

**LaTeX solution:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Không nhận được lời giải: solve\_timeout
\end{document}
```

**Step-by-step explanation:** No generated solution was returned.

**Independent verification:** No mathematical answer to verify.

**Evaluation:**
- Mathematical correctness: Unverified.
- Completeness: Fail.
- Explanation quality: Fail.
- LaTeX and formatting: Fail.
- Response latency: 26.028 seconds; scope: Complete text confirmation + HTTP solve + D1 persistence + full JSON response consumption; fixture OCR excluded.
- Final verdict: Fail.

**Failure analysis:** solve_timeout

## Question 18 — geo-val-tangents (application-validation)

**Type:** cyclic-right-angles
**Difficulty:** Hard
**Source:** Generated validation set C; geo-val-tangents.
**Split:** validation

**Question statement:**
Từ điểm \( P \) ở ngoài đường tròn \( (O) \) kẻ hai tiếp tuyến \( PA,PB \) với các tiếp điểm \( A,B \). Chứng minh bốn điểm \( P,A,O,B \) cùng thuộc một đường tròn.

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Từ điểm \(P\) ở ngoài đường tròn \((O)\) kẻ hai tiếp tuyến \(PA,PB\) với các tiếp điểm \(A,B\). Chứng minh bốn điểm \(P,A,O,B\) cùng thuộc một đường tròn.
\end{document}
```

**Bot's answer:**
**Interpretation:** Từ điểm \( P \) ở ngoài đường tròn \( (O) \) kẻ hai tiếp tuyến \( PA,PB \) với các tiếp điểm \( A,B \). Chứng minh bốn điểm \( P,A,O,B \) cùng thuộc một đường tròn.
**Strategy:** Chứng minh lần lượt: P, A, O, B cùng thuộc một đường tròn. Mỗi bước chỉ dùng giả thiết, cách dựng hình và các kết quả đã chứng minh trước đó.
**givens:** Từ điểm \( P \) ở ngoài đường tròn \( (O) \) kẻ hai tiếp tuyến \( PA,PB \) với các tiếp điểm \( A,B \)

**Actual hints:**
- h1: Tứ giác AOBP có hai góc đối nào có tổng bằng 180°?
  Tứ giác có tổng hai góc đối bằng 180° thì nội tiếp
  Hướng: chứng minh ∠PAO + ∠PBO = 180°.
Đó là hai góc đối của tứ giác AOBP ⇒ tứ giác nội tiếp.
Để có ∠PAO + ∠PBO = 180°, dùng:
• PA ⊥ OA (tiếp tuyến vuông góc với bán kính tại tiếp điểm)
• PB ⊥ OB (tiếp tuyến vuông góc với bán kính tại tiếp điểm)
  \[ P, A, O, B\text{ cùng thuộc một đường tròn} \]

**Actual worked steps:**
1. **P, A, O, B cùng thuộc một đường tròn** — • ∠PAO + ∠PBO = 180° (vì PA ⊥ OA, tiếp tuyến vuông góc với bán kính tại tiếp điểm; PB ⊥ OB, tiếp tuyến vuông góc với bán kính tại tiếp điểm)
⇒ tứ giác AOBP có tổng hai góc đối bằng 180°
⇒ tứ giác AOBP nội tiếp.
\[ P, A, O, B\text{ cùng thuộc một đường tròn} \]
Reason: dấu hiệu tứ giác nội tiếp

**Returned conclusion metadata:** Đã chứng minh: P, A, O, B cùng thuộc một đường tròn.

**LaTeX solution:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Chứng minh lần lượt: P, A, O, B cùng thuộc một đường tròn. Mỗi bước chỉ dùng giả thiết, cách dựng hình và các kết quả đã chứng minh trước đó.
\begin{enumerate}
\item P, A, O, B cùng thuộc một đường tròn. • ∠PAO + ∠PBO = 180° (vì PA ⊥ OA, tiếp tuyến vuông góc với bán kính tại tiếp điểm; PB ⊥ OB, tiếp tuyến vuông góc với bán kính tại tiếp điểm)
⇒ tứ giác AOBP có tổng hai góc đối bằng 180°
⇒ tứ giác AOBP nội tiếp.
\[P, A, O, B\text{ cùng thuộc một đường tròn}\]
dấu hiệu tứ giác nội tiếp
\end{enumerate}
Đã chứng minh: P, A, O, B cùng thuộc một đường tròn.

\end{document}
```

**Step-by-step explanation:**
A tangent is perpendicular to the radius at its contact: ∠PAO=∠PBO=90°. These are opposite angles of quadrilateral PAOB; their sum is 180°, so the four distinct points are concyclic. Every premise follows from the two given tangencies.

**Independent verification:**
A tangent is perpendicular to the radius at its contact: ∠PAO=∠PBO=90°. These are opposite angles of quadrilateral PAOB; their sum is 180°, so the four distinct points are concyclic. Every premise follows from the two given tangencies.

**Evaluation:**
- Mathematical correctness: Pass.
- Completeness: Pass.
- Explanation quality: Pass.
- LaTeX and formatting: Pass.
- Response latency: 0.045 seconds; scope: Complete text confirmation + HTTP solve + D1 persistence + full JSON response consumption; fixture OCR excluded.
- Final verdict: Pass.
- Automated review proxy: 99/100; components [40, 20, 14, 10, 10, 5] (40/20/15/10/10/5). Human satisfaction remains unmeasured.

**Failure analysis:** No mathematical failure. Typed tangent points, construction highlighting and draggable external point are preserved. Machine status remains partial, despite this independently valid proof.

## Question 19 — geo-dev-angle (baseline)

**Type:** isosceles-angles
**Difficulty:** Easy
**Source:** Generated set A; geo-dev-angle.
**Split:** development

**Question statement:**
Cho tam giác \( ABC \) cân tại \( A \) có \( \widehat{A}=36^{\circ} \). Tính \( \widehat{B} \) và \( \widehat{C} \).

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Cho tam giác \(ABC\) cân tại \(A\) có \(\widehat{A}=36^{\circ}\). Tính \(\widehat{B}\) và \(\widehat{C}\).
\end{document}
```

**Bot's answer:**
**Interpretation:** Cho tam giác \( ABC \) cân tại \( A \) có \( \widehat{A}=36^{\circ} \). Tính \( \widehat{B} \) và \( \widehat{C} \).
**Strategy:** Ta dùng tính chất tam giác cân để biết góc B bằng góc C, sau đó áp dụng tổng ba góc trong tam giác bằng 180° để tính góc B và góc C.
**givens:** tam giác ABC cân tại A; góc A = 36°
**unknowns:** góc B; góc C
**constraints:** tổng ba góc trong tam giác bằng 180°; tam giác cân tại A có góc B = góc C

**Actual hints:**
- hints_1: Trong tam giác cân tại A, hai góc nào bằng nhau?
  định nghĩa tam giác cân
  Tam giác ABC cân tại A có nghĩa là hai cạnh bằng nhau là AB và AC, vì vậy hai góc đối diện với chúng, tức là góc B và góc C, bằng nhau.
  \[ \widehat{B} = \widehat{C} \]
- hints_2: Tổng ba góc trong tam giác ABC bằng bao nhiêu?
  tổng góc trong tam giác
  Trong mọi tam giác, tổng ba góc nội luôn bằng 180°.
  \[ \widehat{A} + \widehat{B} + \widehat{C} = 180^{\circ} \]
- hints_3: Thay giá trị góc A và quan hệ giữa góc B và góc C vào tổng ba góc để tìm góc B.
  thay giá trị known
  Ta biết \( \widehat{A}=36^{\circ} \) và \( \widehat{B}=\widehat{C} \). Thay vào tổng ba góc ta có \( 36^{\circ} + 2\widehat{B} = 180^{\circ} \). Từ đó giải để tìm \( \widehat{B} \).
  \[ 36^{\circ} + 2\widehat{B} = 180^{\circ} \]

**Actual worked steps:**
1. **Xác định góc B và góc C bằng nhau** — Vì tam giác ABC cân tại A, nên hai góc B và C bằng nhau.
\[ \widehat{B} = \widehat{C} \]
Reason: tam giác cân tại A có góc B = góc C
2. **Viết phương trình tổng ba góc trong tam giác** — Áp dụng định lý tổng ba góc trong tam giác bằng 180°. Ta có \( \widehat{A} + \widehat{B} + \widehat{C} = 180^{\circ} \).
\[ \widehat{A} + \widehat{B} + \widehat{C} = 180^{\circ} \]
Reason: tổng ba góc trong tam giác
3. **Thay giá trị góc A và quan hệ giữa góc B, góc C vào phương trình** — Thay \( \widehat{A}=36^{\circ} \) và \( \widehat{B}=\widehat{C} \) vào tổng ba góc: \( 36^{\circ} + \widehat{B} + \widehat{B} = 180^{\\.\circ} \), tức là \( 36^{\circ} + 2\widehat{B} = 180^{\circ} \).
\[ 36^{\circ} + 2\widehat{B} = 180^{\circ} \]
Reason: thay giá trị known
4. **Giải phương trình để tìm góc B** — Trừ \( 36^{\circ} \) từ hai vế: \( 2\widehat{B} = 144^{\circ} \). Chia hai vế cho 2 được \( \widehat{B} = 72^{\circ} \). Vì \( \widehat{B} = \widehat{C} \), nên \( \widehat{C} \) cũng bằng \( 72^{\circ} \).
\[ \widehat{B} = 72^{\circ},\ \widehat{C} = 72^{\circ} \]
Reason: giải phương trình bậc nhất

**Returned conclusion metadata:** \( \widehat{B} = 72^{\circ} \), \( \widehat{C} = 72^{\circ} \)
\[ \widehat{B}=72^{\circ},\ \widehat{C}=72^{\circ} \]

**LaTeX solution:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Ta dùng tính chất tam giác cân để biết góc B bằng góc C, sau đó áp dụng tổng ba góc trong tam giác bằng 180° để tính góc B và góc C.
\begin{enumerate}
\item Xác định góc B và góc C bằng nhau. Vì tam giác ABC cân tại A, nên hai góc B và C bằng nhau.
\[\widehat{B} = \widehat{C}\]
tam giác cân tại A có góc B = góc C
\item Viết phương trình tổng ba góc trong tam giác. Áp dụng định lý tổng ba góc trong tam giác bằng 180°. Ta có \(\widehat{A} + \widehat{B} + \widehat{C} = 180^{\circ}\).
\[\widehat{A} + \widehat{B} + \widehat{C} = 180^{\circ}\]
tổng ba góc trong tam giác
\item Thay giá trị góc A và quan hệ giữa góc B, góc C vào phương trình. Thay \(\widehat{A}=36^{\circ}\) và \(\widehat{B}=\widehat{C}\) vào tổng ba góc: \(36^{\circ} + \widehat{B} + \widehat{B} = 180^{\\.\circ}\), tức là \(36^{\circ} + 2\widehat{B} = 180^{\circ}\).
\[36^{\circ} + 2\widehat{B} = 180^{\circ}\]
thay giá trị known
\item Giải phương trình để tìm góc B. Trừ \(36^{\circ}\) từ hai vế: \(2\widehat{B} = 144^{\circ}\). Chia hai vế cho 2 được \(\widehat{B} = 72^{\circ}\). Vì \(\widehat{B} = \widehat{C}\), nên \(\widehat{C}\) cũng bằng \(72^{\circ}\).
\[\widehat{B} = 72^{\circ},\ \widehat{C} = 72^{\circ}\]
giải phương trình bậc nhất
\end{enumerate}
\(\widehat{B} = 72^{\circ}\), \(\widehat{C} = 72^{\circ}\)
\[\widehat{B}=72^{\circ},\ \widehat{C}=72^{\circ}\]
\end{document}
```

**Step-by-step explanation:**
AB=AC gives B=C. The angle sum gives 36+2B=180, hence B=C=72 degrees. The actual proof is complete. The constructed coordinates also measure these angles, but the numerical drawing is not the proof.

**Independent verification:**
AB=AC gives B=C. The angle sum gives 36+2B=180, hence B=C=72 degrees. The actual proof is complete. The constructed coordinates also measure these angles, but the numerical drawing is not the proof.

**Evaluation:**
- Mathematical correctness: Pass.
- Completeness: Pass.
- Explanation quality: Pass.
- LaTeX and formatting: Fail.
- Response latency: 17.491 seconds; scope: Pipeline only; excludes HTTP/database/mobile delivery.
- Final verdict: Fail.
- Automated review proxy: 91/100; components [40, 20, 12, 10, 6, 3] (40/20/15/10/10/5). Human satisfaction remains unmeasured.

**Failure analysis:** Lowercase known survived language repair, and escaped degree notation was malformed in an explanation. One-letter angle symbols were not measurable by the checker; now expanded only in a three-vertex figure. No geometry rendering or dragging was rewritten.

## Question 20 — geo-dev-thales (baseline)

**Type:** parallel-ratio
**Difficulty:** Medium
**Source:** Generated set B; geo-dev-thales.
**Split:** development

**Question statement:**
Cho tam giác \( ABC \), \( D \) thuộc đoạn \( AB \), \( E \) thuộc đoạn \( AC \) và \( DE\parallel BC \). Biết \( AD=3 \), \( DB=2 \), \( BC=10 \). Tính \( DE \).

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Cho tam giác \(ABC\), \(D\) thuộc đoạn \(AB\), \(E\) thuộc đoạn \(AC\) và \(DE\parallel BC\). Biết \(AD=3\), \(DB=2\), \(BC=10\). Tính \(DE\).
\end{document}
```

**Bot's answer:**
Controlled failure: empty model output

**LaTeX solution:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Không nhận được lời giải: empty model output
\end{document}
```

**Step-by-step explanation:** No generated solution was returned.

**Independent verification:** No mathematical answer to verify.

**Evaluation:**
- Mathematical correctness: Unverified.
- Completeness: Fail.
- Explanation quality: Fail.
- LaTeX and formatting: Fail.
- Response latency: 22.011 seconds; scope: Pipeline only; excludes HTTP/database/mobile delivery.
- Final verdict: Fail.

**Failure analysis:** empty model output

## Question 21 — geo-dev-proof (baseline)

**Type:** midpoint-proof
**Difficulty:** Medium
**Source:** Generated set A; geo-dev-proof.
**Split:** development

**Question statement:**
Cho tam giác \( ABC \), \( M \) là trung điểm của \( AB \), \( N \) là trung điểm của \( AC \). Chứng minh \( MN\parallel BC \) và \( MN=\frac{BC}{2} \).

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Cho tam giác \(ABC\), \(M\) là trung điểm của \(AB\), \(N\) là trung điểm của \(AC\). Chứng minh \(MN\parallel BC\) và \(MN=\frac{BC}{2}\).
\end{document}
```

**Bot's answer:**
**Interpretation:** Cho tam giác \( ABC \), \( M \) là trung điểm của \( AB \), \( N \) là trung điểm của \( AC \). Chứng minh \( MN\parallel BC \) và \( MN=\frac{BC}{2} \).
**Strategy:** Chứng minh lần lượt: MN ∥ BC. Mỗi bước chỉ dùng giả thiết, cách dựng hình và các kết quả đã chứng minh trước đó.
**givens:** Cho tam giác \( ABC \), \( M \) là trung điểm của \( AB \), \( N \) là trung điểm của \( AC \)

**Actual hints:**
- h1: Những góc nào đã biết là bằng nhau (góc nội tiếp, tam giác cân, góc vuông) liên quan đến các góc cần chứng minh?
  Cộng, trừ các góc đã biết
  Hướng: dùng
• △BCA ∽ △MNA
rồi cộng, trừ góc ⇒ MN ∥ BC.
  \[ MN \parallel BC \]

**Actual worked steps:**
1. **MN ∥ BC** — Xét △BCA và △MNA có:
• ∠CAB là góc chung
• AC · AM = AN · AB
⇒ △BCA ∽ △MNA (c.g.c)
Ta có:
⇒ MN ∥ BC (cộng, trừ các góc).
\[ \begin{aligned}&\triangle BCA \backsim \triangle MNA \\ &\Rightarrow MN \parallel BC\end{aligned} \]
Reason: hai tam giác đồng dạng; cộng, trừ góc

**Returned conclusion metadata:** Đã chứng minh: MN ∥ BC. Phần chưa được giải trong bài này: \( MN=\frac{BC}{2} \).

**LaTeX solution:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Chứng minh lần lượt: MN ∥ BC. Mỗi bước chỉ dùng giả thiết, cách dựng hình và các kết quả đã chứng minh trước đó.
\begin{enumerate}
\item MN ∥ BC. Xét △BCA và △MNA có:
• ∠CAB là góc chung
• AC · AM = AN · AB
⇒ △BCA ∽ △MNA (c.g.c)
Ta có:
⇒ MN ∥ BC (cộng, trừ các góc).
\[\begin{aligned}&\triangle BCA \backsim \triangle MNA \\ &\Rightarrow MN \parallel BC\end{aligned}\]
hai tam giác đồng dạng; cộng, trừ góc
\end{enumerate}
Đã chứng minh: MN ∥ BC. Phần chưa được giải trong bài này: \(MN=\frac{BC}{2}\).

\end{document}
```

**Step-by-step explanation:**
The actual planner proves only MN parallel BC and honestly declares the half-length claim unsolved. Independent full proof: M,N are midpoints of two sides, so the midpoint theorem gives both parallelism and MN=BC/2. The emitted similarity argument skips the corresponding-angle deduction.

**Independent verification:**
The actual planner proves only MN parallel BC and honestly declares the half-length claim unsolved. Independent full proof: M,N are midpoints of two sides, so the midpoint theorem gives both parallelism and MN=BC/2. The emitted similarity argument skips the corresponding-angle deduction.

**Evaluation:**
- Mathematical correctness: Pass.
- Completeness: Fail.
- Explanation quality: Fail.
- LaTeX and formatting: Pass.
- Response latency: 22.045 seconds; scope: Pipeline only; excludes HTTP/database/mobile delivery.
- Final verdict: Fail.
- Automated review proxy: 61/100; components [30, 5, 5, 8, 8, 5] (40/20/15/10/10/5). Human satisfaction remains unmeasured.

**Failure analysis:** Fractional segment relation was not parsed; MIDLINE was registered but not implemented in search. Added general fraction parsing, midpoint-theorem search, independent theorem-precondition verification, and explicit Vietnamese explanation. Corrupted 1/3 conclusion is rejected.

## Question 22 — geo-dev-circle (baseline)

**Type:** circle-tangent
**Difficulty:** Hard
**Source:** Generated set B; geo-dev-circle.
**Split:** development

**Question statement:**
Cho đường tròn tâm \( O \), điểm \( P \) ở ngoài đường tròn. Hai tiếp tuyến \( PA,PB \) tiếp xúc tại \( A,B \). Chứng minh \( OP \) là đường trung trực của \( AB \).

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Cho đường tròn tâm \(O\), điểm \(P\) ở ngoài đường tròn. Hai tiếp tuyến \(PA,PB\) tiếp xúc tại \(A,B\). Chứng minh \(OP\) là đường trung trực của \(AB\).
\end{document}
```

**Bot's answer:**
Controlled failure: empty model output

**LaTeX solution:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Không nhận được lời giải: empty model output
\end{document}
```

**Step-by-step explanation:** No generated solution was returned.

**Independent verification:** No mathematical answer to verify.

**Evaluation:**
- Mathematical correctness: Unverified.
- Completeness: Fail.
- Explanation quality: Fail.
- LaTeX and formatting: Fail.
- Response latency: 22.003 seconds; scope: Pipeline only; excludes HTTP/database/mobile delivery.
- Final verdict: Fail.

**Failure analysis:** empty model output

## Q4 angle and point-order failures — solver-v2.35

[Full actual answers, reproduced failures, independent checks and manual guide](iteration-03/user-proof-feedback.md). Six application calls with external inference disabled;0.2–2.7s;12 mobile/desktop page views pass. Historical held-out scores remain unchanged. Q3 and Q4a retain honest partial machine verification; full Q4b/c were not rerun.
