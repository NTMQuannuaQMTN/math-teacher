# Combinatorics Bot — actual specialist evaluation

These are actual pipeline outputs, not manually substituted solutions. Raw provider output, returned typed lesson, verifier checks, and latency are retained in `tools/specialist-training/results/`. Free-only inference; no model weights were trained. Pipeline-only runs and actual application HTTP runs are labelled separately below. HTTP timing includes text confirmation, parsing, solving, verification, formatting, D1 persistence, full JSON consumption and, for final runs, a client schema/KaTeX/language audit. Fixture OCR is excluded. Mobile painting and production network latency are unmeasured. The fenced LaTeX transcription normalizes delimiters and equation environments only; unrenderable formulas are preserved as escaped literal text. Mathematical content and actual answers are not substituted. A full XeLaTeX/LuaLaTeX installation is unavailable here, so document compilation is unmeasured; formula checks use the application KaTeX renderer.

## Question 1 — comb-dev-digits (application-frozen-development)

**Type:** ordered-distinct-digits
**Difficulty:** Easy
**Source:** Generated set A; comb-dev-digits.
**Split:** development

**Question statement:**
Từ các chữ số \( 0,1,2,3,4 \), lập được bao nhiêu số tự nhiên có ba chữ số đôi một khác nhau?

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Từ các chữ số \(0,1,2,3,4\), lập được bao nhiêu số tự nhiên có ba chữ số đôi một khác nhau?
\end{document}
```

**Bot's answer:**
**Interpretation:** Từ các chữ số \( 0,1,2,3,4 \), lập được bao nhiêu số tự nhiên có ba chữ số đôi một khác nhau?
**Strategy:** Áp dụng nguyên lý nhân: lần lượt chọn chữ số cho hàng trăm, hàng chục và hàng đơn vị, mỗi lần giảm số lựa chọn do không cho phép trùng lặp và hàng trăm không thể là 0.
**givens:** tập chữ số {0,1,2,3,4}
**unknowns:** số lượng số tự nhiên ba chữ số có ba chữ số đôi một khác nhau
**constraints:** hàng trăm ≠ 0; các chữ số không được lặp

**Actual hints:**
- h1: Chữ số hàng trăm có thể là gì? Tại sao?
  Hàng trăm không thể là 0.
  Vì số có ba chữ số, hàng trăm phải khác 0, nên chỉ có thể chọn từ 1,2,3,4.
  \[ \{1,2,3,4\} \]
- h2: Sau khi chọn hàng trăm, còn bao gồm bao nhiêu chữ số để chọn hàng chục?
  Các chữ số đã dùng không thể tái sử dụng.
  Có tổng 5 chữ số (0-4). Sau khi dùng 1 chữ số cho hàng trăm, còn 4 chữ số.
  \[ 5-1 = 4 \]
- h3: Sau khi chọn hàng trăm và hàng chục, hàng đơn vị còn bao nhiêu lựa chọn?
  Không được trùng lặp chữ số.
  Đã dùng 2 chữ số, còn 5-2 = 3 chữ số.
  \[ 5-2 = 3 \]

**Actual worked steps:**
1. **Chọn chữ số hàng trăm** — Hàng trăm không thể là 0 vì số có ba chữ số, nên chỉ có thể chọn từ {1,2,3,4}. Vậy có 4 cách.
\[ 4 \]
Reason: Nguyên lý đếm cho một vị trí
2. **Chọn chữ số hàng chục** — Sau khi chọn hàng trăm, còn lại 4 chữ số (bao gồm 0 và những chữ số chưa dùng). Mỗi cách chọn hàng trăm tương ứng với 4 cách chọn hàng chục.
\[ 4 \]
Reason: Nguyên lý nhân áp dụng cho vị trí thứ hai
3. **Chọn chữ số hàng đơn vị** — Sau khi chọn hàng trăm và hàng chục, còn lại 3 chữ số chưa dùng, nên có 3 cách chọn hàng đơn vị.
\[ 3 \]
Reason: Nguyên lý nhân cho vị trí thứ ba
4. **Tính tổng số cách** — Áp dụng nguyên lý nhân, tổng số số ba chữ số khác nhau là 4 × 4 × 3 = 48.
\[ 4\times 4\times 3 = 48 \]
Reason: Nguyên lý nhân

**Returned conclusion metadata:** Có 48 số tự nhiên ba chữ số có các chữ số khác nhau lấy từ tập {0,1,2,3,4}.
\[ 48 \]

**LaTeX solution:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Áp dụng nguyên lý nhân: lần lượt chọn chữ số cho hàng trăm, hàng chục và hàng đơn vị, mỗi lần giảm số lựa chọn do không cho phép trùng lặp và hàng trăm không thể là 0.
\begin{enumerate}
\item Chọn chữ số hàng trăm. Hàng trăm không thể là 0 vì số có ba chữ số, nên chỉ có thể chọn từ \{1,2,3,4\}. Vậy có 4 cách.
\[4\]
Nguyên lý đếm cho một vị trí
\item Chọn chữ số hàng chục. Sau khi chọn hàng trăm, còn lại 4 chữ số (bao gồm 0 và những chữ số chưa dùng). Mỗi cách chọn hàng trăm tương ứng với 4 cách chọn hàng chục.
\[4\]
Nguyên lý nhân áp dụng cho vị trí thứ hai
\item Chọn chữ số hàng đơn vị. Sau khi chọn hàng trăm và hàng chục, còn lại 3 chữ số chưa dùng, nên có 3 cách chọn hàng đơn vị.
\[3\]
Nguyên lý nhân cho vị trí thứ ba
\item Tính tổng số cách. Áp dụng nguyên lý nhân, tổng số số ba chữ số khác nhau là 4 × 4 × 3 = 48.
\[4\times 4\times 3 = 48\]
Nguyên lý nhân
\end{enumerate}
Có 48 số tự nhiên ba chữ số có các chữ số khác nhau lấy từ tập \{0,1,2,3,4\}.
\[48\]
\end{document}
```

**Step-by-step explanation:**
Independent enumeration of all ordered triples of distinct digits from0..4 with first digit nonzero gives48. The actual argument selects4 first digits,4 remaining second digits including0, and3 third digits. Every valid three-digit number corresponds to exactly one such triple.

**Independent verification:**
Independent enumeration of all ordered triples of distinct digits from0..4 with first digit nonzero gives48. The actual argument selects4 first digits,4 remaining second digits including0, and3 third digits. Every valid three-digit number corresponds to exactly one such triple.

**Evaluation:**
- Mathematical correctness: Pass.
- Completeness: Pass.
- Explanation quality: Pass.
- LaTeX and formatting: Pass.
- Response latency: 21.605 seconds; scope: Complete text confirmation + HTTP solve + D1 persistence + full JSON response consumption + schema/KaTeX/all-field language audit; fixture OCR excluded.
- Final verdict: Pass.
- Automated review proxy: 98/100; components [40, 20, 14, 10, 10, 4] (40/20/15/10/10/5). Human satisfaction remains unmeasured.

**Failure analysis:** Some phrasing is awkward (còn bao gồm bao nhiêu), but understandable Vietnamese with accents. No material counting or completeness failure observed.

## Question 2 — comb-dev-selection (application-frozen-development)

**Type:** unordered-selection
**Difficulty:** Medium
**Source:** Generated set B; comb-dev-selection.
**Split:** development

**Question statement:**
Có \( 5 \) bạn nam và \( 4 \) bạn nữ. Chọn \( 3 \) bạn để có ít nhất một bạn nữ. Có bao nhiêu cách chọn?

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Có \(5\) bạn nam và \(4\) bạn nữ. Chọn \(3\) bạn để có ít nhất một bạn nữ. Có bao nhiêu cách chọn?
\end{document}
```

**Bot's answer:**
Controlled failure: solve_quota_exhausted

**LaTeX solution:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Không nhận được lời giải: solve\_quota\_exhausted
\end{document}
```

**Step-by-step explanation:** No generated solution was returned.

**Independent verification:** No mathematical answer to verify.

**Evaluation:**
- Mathematical correctness: Unverified.
- Completeness: Fail.
- Explanation quality: Fail.
- LaTeX and formatting: Fail.
- Response latency: 0.914 seconds; scope: Complete text confirmation + HTTP solve + D1 persistence + full JSON response consumption + schema/KaTeX/all-field language audit; fixture OCR excluded.
- Final verdict: Fail.

**Failure analysis:** solve_quota_exhausted

## Question 3 — comb-dev-pigeonhole (application-frozen-development)

**Type:** residue-pigeonhole
**Difficulty:** Medium
**Source:** Generated set A; comb-dev-pigeonhole.
**Split:** development

**Question statement:**
Chứng minh trong \( 6 \) số nguyên bất kỳ luôn có hai số có hiệu chia hết cho \( 5 \).

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Chứng minh trong \(6\) số nguyên bất kỳ luôn có hai số có hiệu chia hết cho \(5\).
\end{document}
```

**Bot's answer:**
Controlled failure: solve_quota_exhausted

**LaTeX solution:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Không nhận được lời giải: solve\_quota\_exhausted
\end{document}
```

**Step-by-step explanation:** No generated solution was returned.

**Independent verification:** No mathematical answer to verify.

**Evaluation:**
- Mathematical correctness: Unverified.
- Completeness: Fail.
- Explanation quality: Fail.
- LaTeX and formatting: Fail.
- Response latency: 0.441 seconds; scope: Complete text confirmation + HTTP solve + D1 persistence + full JSON response consumption + schema/KaTeX/all-field language audit; fixture OCR excluded.
- Final verdict: Fail.

**Failure analysis:** solve_quota_exhausted

## Question 4 — comb-dev-parity (application-frozen-development)

**Type:** parity-invariant
**Difficulty:** Hard
**Source:** Generated set B; comb-dev-parity.
**Split:** development

**Question statement:**
Trên bảng có các số \( 1,2,3,4,5,6 \). Mỗi lần xóa hai số \( a,b \) và viết số \( a+b \). Có thể cuối cùng chỉ còn số \( 20 \) không? Giải thích.

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Trên bảng có các số \(1,2,3,4,5,6\). Mỗi lần xóa hai số \(a,b\) và viết số \(a+b\). Có thể cuối cùng chỉ còn số \(20\) không? Giải thích.
\end{document}
```

**Bot's answer:**
Controlled failure: solve_quota_exhausted

**LaTeX solution:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Không nhận được lời giải: solve\_quota\_exhausted
\end{document}
```

**Step-by-step explanation:** No generated solution was returned.

**Independent verification:** No mathematical answer to verify.

**Evaluation:**
- Mathematical correctness: Unverified.
- Completeness: Fail.
- Explanation quality: Fail.
- LaTeX and formatting: Fail.
- Response latency: 0.243 seconds; scope: Complete text confirmation + HTTP solve + D1 persistence + full JSON response consumption + schema/KaTeX/all-field language audit; fixture OCR excluded.
- Final verdict: Fail.

**Failure analysis:** solve_quota_exhausted

## Question 5 — ptnk-2025-chuyen-5a (application-frozen-development)

**Type:** ptnk2025-exam-5
**Difficulty:** Entrance-exam challenge
**Source:** Repository transcription: PTNK 2025 chuyên, question 5a; data/training/problems.jsonl and data/exam_sources.json; original-paper OCR marked needs review; ptnk-2025-chuyen-5a.
**Split:** development

**Question statement:**
Cho bảng ô vuông kích thước \( 2\times9 \) và số nguyên dương \( k\le18 \). Hai ô của bảng được gọi là kề bên nếu chúng có một cạnh chung. Hai bạn An và Bình chơi trò “Truy Tìm Tàu Ngầm” như sau: Trước khi trò chơi bắt đầu, An chọn một ô trên bảng và không cho Bình biết. Ở mỗi lượt chơi: An phải chọn một ô mới, kề bên với ô đã chọn trước đó, và không cho Bình biết; Sau khi An chọn xong, Bình chọn \( k \) ô của bảng và hỏi An: trong \( k \) ô này có ô An vừa chọn hay không? Nếu có thì Bình thắng, nếu không thì hai bạn lại chơi lượt tiếp theo. Xét \( k=4 \). Chứng minh rằng Bình có thể thắng sau không quá 8 lượt chơi.

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Cho bảng ô vuông kích thước \(2\times9\) và số nguyên dương \(k\le18\). Hai ô của bảng được gọi là kề bên nếu chúng có một cạnh chung. Hai bạn An và Bình chơi trò “Truy Tìm Tàu Ngầm” như sau: Trước khi trò chơi bắt đầu, An chọn một ô trên bảng và không cho Bình biết. Ở mỗi lượt chơi: An phải chọn một ô mới, kề bên với ô đã chọn trước đó, và không cho Bình biết; Sau khi An chọn xong, Bình chọn \(k\) ô của bảng và hỏi An: trong \(k\) ô này có ô An vừa chọn hay không? Nếu có thì Bình thắng, nếu không thì hai bạn lại chơi lượt tiếp theo. Xét \(k=4\). Chứng minh rằng Bình có thể thắng sau không quá 8 lượt chơi.
\end{document}
```

**Bot's answer:**
Controlled failure: solve_quota_exhausted

**LaTeX solution:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Không nhận được lời giải: solve\_quota\_exhausted
\end{document}
```

**Step-by-step explanation:** No generated solution was returned.

**Independent verification:** No mathematical answer to verify.

**Evaluation:**
- Mathematical correctness: Unverified.
- Completeness: Fail.
- Explanation quality: Fail.
- LaTeX and formatting: Fail.
- Response latency: 0.156 seconds; scope: Complete text confirmation + HTTP solve + D1 persistence + full JSON response consumption + schema/KaTeX/all-field language audit; fixture OCR excluded.
- Final verdict: Fail.

**Failure analysis:** solve_quota_exhausted

## Question 6 — comb-ho-derangement (application-frozen-held_out)

**Type:** fixed-point-free-bijections
**Difficulty:** Medium
**Source:** Generated held-out set E, created after configuration freeze; comb-ho-derangement.
**Split:** held_out

**Question statement:**
Ba người có ba chiếc mũ riêng. Phát ngẫu nhiên mỗi người một chiếc mũ, dùng hết ba chiếc. Có bao nhiêu cách phát để không ai nhận đúng mũ của mình?

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Ba người có ba chiếc mũ riêng. Phát ngẫu nhiên mỗi người một chiếc mũ, dùng hết ba chiếc. Có bao nhiêu cách phát để không ai nhận đúng mũ của mình?
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

**Independent verification:** No mathematical answer to verify. Independent reference, not the bot answer: Label hats/people0,1,2. All six bijections are possible. No fixed points leaves exactly the two 3-cycles(1,2,0),(2,0,1). Case split by first recipient accounts for all possibilities once.

**Evaluation:**
- Mathematical correctness: Unverified.
- Completeness: Fail.
- Explanation quality: Fail.
- LaTeX and formatting: Fail.
- Response latency: 26.141 seconds; scope: Complete text confirmation + HTTP solve + D1 persistence + full JSON response consumption + schema/KaTeX/all-field language audit; fixture OCR excluded.
- Final verdict: Fail.

**Failure analysis:** solve_timeout

## Question 7 — comb-ho-grid (application-frozen-held_out)

**Type:** restricted-lattice-path
**Difficulty:** Hard
**Source:** Generated held-out set E, created after configuration freeze; comb-ho-grid.
**Split:** held_out

**Question statement:**
Từ \( (0,0) \) đến \( (3,2) \) trên lưới ô vuông, mỗi bước chỉ sang phải hoặc lên trên một đơn vị. Có bao nhiêu đường đi không qua điểm \( (1,1) \)?

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Từ \((0,0)\) đến \((3,2)\) trên lưới ô vuông, mỗi bước chỉ sang phải hoặc lên trên một đơn vị. Có bao nhiêu đường đi không qua điểm \((1,1)\)?
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

**Independent verification:** No mathematical answer to verify. Independent reference, not the bot answer: Every path is an ordered word with3R,2U, so10 total. Paths through(1,1) have2 prefixes and3 suffixes, so6; concatenate is a bijection. Subtract to get4 avoiding paths.

**Evaluation:**
- Mathematical correctness: Unverified.
- Completeness: Fail.
- Explanation quality: Fail.
- LaTeX and formatting: Fail.
- Response latency: 25.492 seconds; scope: Complete text confirmation + HTTP solve + D1 persistence + full JSON response consumption + schema/KaTeX/all-field language audit; fixture OCR excluded.
- Final verdict: Fail.

**Failure analysis:** solve_malformed_output

## Question 8 — comb-ho-dice (application-frozen-held_out)

**Type:** two-dice-sum-probability
**Difficulty:** Medium
**Source:** Generated held-out set E, created after configuration freeze; comb-ho-dice.
**Split:** held_out

**Question statement:**
Gieo đồng thời hai con xúc xắc cân đối sáu mặt. Tính xác suất tổng số chấm trên hai mặt xuất hiện bằng \( 7 \).

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Gieo đồng thời hai con xúc xắc cân đối sáu mặt. Tính xác suất tổng số chấm trên hai mặt xuất hiện bằng \(7\).
\end{document}
```

**Bot's answer:**
**Interpretation:** Gieo đồng thời hai con xúc xắc cân đối sáu mặt. Tính xác suất tổng số chấm trên hai mặt xuất hiện bằng \( 7 \).
**Strategy:** Ta đếm tổng số kết quả có thể xảy ra khi tung hai xúc xắc và số kết quả có tổng bằng 7, sau đó lấy tỉ lệ để tìm xác suất.
**givens:** hai con xúc xắc cân đối sáu mặt được tung đồng thời
**unknowns:** xác suất tổng số chấm trên hai mặt bằng 7
**constraints:** mỗi mặt có xác suất bằng nhau; kết quả là cặp có thứ tự

**Actual hints:**
- hints_1: Khi tung hai xúc xắc, mỗi con có bao nhiêu mặt và kết quả của hai con được xem như thế nào?
  Mỗi xúc xắc có 6 mặt, kết quả là cặp có thứ tự.
  Để tính xác suất, ta cần biết tổng số kết quả có thể xảy ra.
  \[ 6 \times 6 \]
- hints_2: Có bao nhiêu cặp số (a,b) với a,b từ 1 đến 6 sao cho a+b = 7?
  Liệt kê các giá trị có thể của a và tìm b = 7 - a.
  Ta đếm số kết quả thuận lợi.
  \[ (1,6),(2,5),(3,4),(4,3),(5,2),(6,1) \]
- hints_3: Xác suất bằng tỉ lệ số kết quả thuận lợi trên tổng số kết quả là bao nhiêu?
  Dùng công thức xác suất cổ điển.
  Ta chia số kết quả có tổng 7 cho tổng số kết quả.
  \[ \frac{6}{36} \]

**Actual worked steps:**
1. **Tổng số kết quả có thể xảy ra** — Mỗi xúc xắc có 6 mặt, kết quả của hai xúc xắc là cặp có thứ tự, nên số kết quả là 6 nhân 6.
\[ 6 \times 6 = 36 \]
Reason: Nguyên lý đếm (quy tắc nhân)
2. **Số kết quả có tổng bằng 7** — Liệt kê các cặp (a,b) với a+b=7, a,b từ 1 đến 6. Có 6 cặp: (1,6),(2,5),(3,4),(4,3),(5,2),(6,1).
\[ 6  \text{ kết quả thỏa mãn } \]
Reason: Đếm trực tiếp (liệt kê trường hợp)
3. **Tính xác suất** — Xác suất P = số kết quả có tổng 7 / tổng số kết quả = 6/36 = 1/6.
\[ P = \frac{6}{36} = \frac{1}{6} \]
Reason: Định nghĩa xác suất cổ điển (số kết quả thuận lợi / số kết quả có thể)

**Returned conclusion metadata:** Xác suất tổng số chấm bằng 7 là \( \frac{1}{6} \).
\[ \frac{1}{6} \]

**LaTeX solution:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Ta đếm tổng số kết quả có thể xảy ra khi tung hai xúc xắc và số kết quả có tổng bằng 7, sau đó lấy tỉ lệ để tìm xác suất.
\begin{enumerate}
\item Tổng số kết quả có thể xảy ra. Mỗi xúc xắc có 6 mặt, kết quả của hai xúc xắc là cặp có thứ tự, nên số kết quả là 6 nhân 6.
\[6 \times 6 = 36\]
Nguyên lý đếm (quy tắc nhân)
\item Số kết quả có tổng bằng 7. Liệt kê các cặp (a,b) với a+b=7, a,b từ 1 đến 6. Có 6 cặp: (1,6),(2,5),(3,4),(4,3),(5,2),(6,1).
\[6  \text{ kết quả thỏa mãn }\]
Đếm trực tiếp (liệt kê trường hợp)
\item Tính xác suất. Xác suất P = số kết quả có tổng 7 / tổng số kết quả = 6/36 = 1/6.
\[P = \frac{6}{36} = \frac{1}{6}\]
Định nghĩa xác suất cổ điển (số kết quả thuận lợi / số kết quả có thể)
\end{enumerate}
Xác suất tổng số chấm bằng 7 là \(\frac{1}{6}\).
\[\frac{1}{6}\]
\end{document}
```

**Step-by-step explanation:**
Thirty-six ordered pairs of face values are equiprobable. Exactly(1,6),(2,5),(3,4),(4,3),(5,2),(6,1) sum7. Probability6/36=1/6; order matters. The actual lesson uses the same ordered outcome model, lists all six favourable pairs, gives36 total and concludes1/6 in the final worked step. Independent enumeration agrees; no LLM self-verification is relied on.

**Independent verification:**
Thirty-six ordered pairs of face values are equiprobable. Exactly(1,6),(2,5),(3,4),(4,3),(5,2),(6,1) sum7. Probability6/36=1/6; order matters. The actual lesson uses the same ordered outcome model, lists all six favourable pairs, gives36 total and concludes1/6 in the final worked step. Independent enumeration agrees; no LLM self-verification is relied on.

**Evaluation:**
- Mathematical correctness: Pass.
- Completeness: Pass.
- Explanation quality: Pass.
- LaTeX and formatting: Pass.
- Response latency: 21.288 seconds; scope: Complete text confirmation + HTTP solve + D1 persistence + full JSON response consumption + schema/KaTeX/all-field language audit; fixture OCR excluded.
- Final verdict: Pass.
- Automated review proxy: 98/100; components [40, 20, 14, 10, 10, 4] (40/20/15/10/10/5). Human satisfaction remains unmeasured.

**Failure analysis:** No material failure. Numerical self-check6/36=1/6 checks arithmetic only, not the equiprobable outcome model; independent review supplied that check. The frozen held-out set has just one returned lesson, so this success cannot hide15 controlled failures.

## Question 9 — comb-ho-extremal (application-frozen-held_out)

**Type:** divisibility-chain-extremal
**Difficulty:** Entrance-exam challenge
**Source:** Generated held-out set E, created after configuration freeze; comb-ho-extremal.
**Split:** held_out

**Question statement:**
Chọn bất kì sáu số khác nhau từ các số nguyên \( 1,2,\ldots,10 \). Chứng minh luôn có hai số trong sáu số đã chọn mà một số chia hết cho số kia.

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Chọn bất kì sáu số khác nhau từ các số nguyên \(1,2,\ldots,10\). Chứng minh luôn có hai số trong sáu số đã chọn mà một số chia hết cho số kia.
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

**Independent verification:** No mathematical answer to verify. Independent reference, not the bot answer: Partition1..10 into five chains by odd part: {1,2,4,8},{3,6},{5,10},{7},{9}. Six selected numbers force two in a chain; they differ by a positive power of2, so the larger is divisible by the smaller. The chains are disjoint and exhaustive.

**Evaluation:**
- Mathematical correctness: Unverified.
- Completeness: Fail.
- Explanation quality: Fail.
- LaTeX and formatting: Fail.
- Response latency: 26.107 seconds; scope: Complete text confirmation + HTTP solve + D1 persistence + full JSON response consumption + schema/KaTeX/all-field language audit; fixture OCR excluded.
- Final verdict: Fail.

**Failure analysis:** solve_timeout

## Question 10 — comb-val-arrangements (application-validation-final)

**Type:** permutation-block
**Difficulty:** Medium
**Source:** Generated validation set C; comb-val-arrangements.
**Split:** validation

**Question statement:**
Có \( 5 \) bạn đứng thành một hàng. Hai bạn An và Bình phải đứng cạnh nhau. Có bao nhiêu cách xếp?

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Có \(5\) bạn đứng thành một hàng. Hai bạn An và Bình phải đứng cạnh nhau. Có bao nhiêu cách xếp?
\end{document}
```

**Bot's answer:**
**Interpretation:** Có \( 5 \) bạn đứng thành một hàng. Hai bạn An và Bình phải đứng cạnh nhau. Có bao nhiêu cách xếp?
**Strategy:** Ta xem An và Bình như một khối vì họ phải đứng cạnh nhau, sau đó sắp xếp khối này cùng với các bạn còn lại, cuối cùng nhớ đến hai cách sắp xếp bên trong khối.
**givens:** 5 bạn; An và Bình phải đứng cạnh nhau
**unknowns:** số cách xếp thỏa điều kiện
**interpretationNotes:** Không rõ An và Bình là hai trong số 5 bạn hay là hai người riêng biệt ngoài 5 bạn. Nếu An và Bình là hai trong số 5 bạn thì số cách xếp là \( 2 \times 4! = 48 \). Nếu An và Bình là hai người riêng biệt ngoài 5 bạn thì số cách xếp là \( 2 \times 6! = 1440 \). Cần làm rõ điều này để giải.

**Actual hints:**
- hints_1: Nếu An và Bình luôn đứng cạnh nhau, ta có thể xem họ như một đối tượng duy nhất không?
  Gom hai người kề nhau thành một khối.
  Khi hai phần tử phải luôn đứng cạnh nhau, ta có thể gom chúng thành một khối để dễ đếm. Khối này vẫn có thể xoay đổi vị trí bên trong (An-Bình hoặc Bình-An).
- count_step: Sau khi gom An và Bình thành một khối, ta có bao nhiêu đối tượng để sắp xếp?
  Đếm số khối và số bạn còn lại.
  Nếu An và Bình là hai trong số 5 bạn, thì ngoài khối An-Bình còn 3 bạn riêng, tổng cộng 4 đối tượng. Nếu An và Bình là hai người ngoài 5 bạn, thì ngoài khối còn 5 bạn riêng, tổng cộng 6 đối tượng.
- final_step: Nhớ đến việc sắp xếp An và Bình bên trong khối có bao nhiêu cách?
  Hai người trong khối có thể hoán đổi vị trí.
  Trong khối, An và Bình có thể đứng theo hai thứ tự: An-Bình hoặc Bình-An. Do đó sau khi sắp xếp các khối, ta nhân với 2 để tính đến hai cách này.

**Actual worked steps:**
1. **Gom An và Bình thành một khối** — Vì An và Bình phải đứng cạnh nhau, ta xem họ như một khối duy nhất để dễ đếm. Khối này có thể xoay đổi vị trí bên trong (An-Bình hoặc Bình-An).
\[ \text{Xét An và Bình như một khối} \]
Reason: Nguyên lý gom đối tượng kề nhau
2. **Đếm số đối tượng cần sắp xếp** — Nếu An và Bình là hai trong số 5 bạn, thì ngoài khối còn 3 bạn riêng, tổng cộng 4 đối tượng cần sắp xếp. Số cách sắp xếp 4 đối tượng là \( 4! = 24 \).
\[ 4! = 24 \]
Reason: Công thức hoán vị của n đối tượng phân biệt
3. **Nhớ đến việc sắp xếp bên trong khối** — Trong khối, An và Bình có thể đứng theo hai thứ tự: An-Bình hoặc Bình-An. Do đó số cách xếp tổng cộng là \( 2 \times 4! = 2 \times 24 = 48 \).
\[ 2 \times 4! = 48 \]
Reason: Nguyên lý nhân: sắp xếp khối và sắp xếp bên trong khối

**Returned conclusion metadata:** Nếu An và Bình là hai trong số 5 bạn thì có 48 cách xếp. Nếu An và Bình là hai người riêng biệt ngoài 5 bạn thì có 1440 cách xếp.
\[ 48 \text{ hoặc } 1440 \]

**LaTeX solution:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Ta xem An và Bình như một khối vì họ phải đứng cạnh nhau, sau đó sắp xếp khối này cùng với các bạn còn lại, cuối cùng nhớ đến hai cách sắp xếp bên trong khối.
\begin{enumerate}
\item Gom An và Bình thành một khối. Vì An và Bình phải đứng cạnh nhau, ta xem họ như một khối duy nhất để dễ đếm. Khối này có thể xoay đổi vị trí bên trong (An-Bình hoặc Bình-An).
\[\text{Xét An và Bình như một khối}\]
Nguyên lý gom đối tượng kề nhau
\item Đếm số đối tượng cần sắp xếp. Nếu An và Bình là hai trong số 5 bạn, thì ngoài khối còn 3 bạn riêng, tổng cộng 4 đối tượng cần sắp xếp. Số cách sắp xếp 4 đối tượng là \(4! = 24\).
\[4! = 24\]
Công thức hoán vị của n đối tượng phân biệt
\item Nhớ đến việc sắp xếp bên trong khối. Trong khối, An và Bình có thể đứng theo hai thứ tự: An-Bình hoặc Bình-An. Do đó số cách xếp tổng cộng là \(2 \times 4! = 2 \times 24 = 48\).
\[2 \times 4! = 48\]
Nguyên lý nhân: sắp xếp khối và sắp xếp bên trong khối
\end{enumerate}
Nếu An và Bình là hai trong số 5 bạn thì có 48 cách xếp. Nếu An và Bình là hai người riêng biệt ngoài 5 bạn thì có 1440 cách xếp.
\[48 \text{ hoặc } 1440\]
\end{document}
```

**Step-by-step explanation:**
Under the natural interpretation that An/Bình are two of the five friends, collapsing the adjacent pair is a bijection to four objects with two internal orders, giving48. Enumeration of all120 permutations confirms48. The actual hint also discusses the alternative seven-person interpretation.

**Independent verification:**
Under the natural interpretation that An/Bình are two of the five friends, collapsing the adjacent pair is a bijection to four objects with two internal orders, giving48. Enumeration of all120 permutations confirms48. The actual hint also discusses the alternative seven-person interpretation.

**Evaluation:**
- Mathematical correctness: Pass.
- Completeness: Pass.
- Explanation quality: Fail.
- LaTeX and formatting: Pass.
- Response latency: 19.554 seconds; scope: Complete text confirmation + HTTP solve + D1 persistence + full JSON response consumption + schema/KaTeX/all-field language audit; fixture OCR excluded.
- Final verdict: Fail.
- Automated review proxy: 91/100; components [40, 20, 9, 10, 9, 3] (40/20/15/10/10/5). Human satisfaction remains unmeasured.

**Failure analysis:** Actual note invents an outside-the-five ambiguity and claims clarification is necessary while analysis remains solvable. Foreign Thai is absent in this run; the earlier leakage fix worked on this sample.

## Question 11 — comb-val-probability (application-validation-final)

**Type:** without-replacement-probability
**Difficulty:** Medium
**Source:** Generated validation set C; comb-val-probability.
**Split:** validation

**Question statement:**
Một hộp có \( 3 \) viên bi đỏ và \( 2 \) viên bi xanh. Lấy ngẫu nhiên đồng thời \( 2 \) viên bi. Tính xác suất để lấy được hai viên bi cùng màu.

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Một hộp có \(3\) viên bi đỏ và \(2\) viên bi xanh. Lấy ngẫu nhiên đồng thời \(2\) viên bi. Tính xác suất để lấy được hai viên bi cùng màu.
\end{document}
```

**Bot's answer:**
**Interpretation:** Một hộp có \( 3 \) viên bi đỏ và \( 2 \) viên bi xanh. Lấy ngẫu nhiên đồng thời \( 2 \) viên bi. Tính xác suất để lấy được hai viên bi cùng màu.
**Strategy:** Ta sẽ đếm tổng số cách chọn 2 viên bi từ 5 viên, và số cách chọn 2 viên cùng màu (cả hai đỏ hoặc cả hai xanh). Xác suất là tỉ số giữa số cách có lợi và tổng số cách.
**givens:** hộp có 3 viên bi đỏ; 2 viên bi xanh; lấy đồng thời 2 viên bi
**unknowns:** xác suất lấy được 2 viên cùng màu
**interpretationNotes:** Không rõ liệu việc lấy bi có đặt lại hay không đặt lại. Trong bài toán xác suất cơ bản THCS, khi nói "lấy ngẫu nhiên đồng thời 2 viên bi" thường được hiểu là lấy không đặt lại (lấy 2 viên cùng một lúc). Tuy nhiên, để tránh nhầm lẫn, cần xác nhận điều này. Nếu lấy không đặt lại, ta có thể tính; nếu l

**Actual hints:**
- 1: Tổng số viên bi trong hộp là bao nhiêu? Khi lấy đồng thời 2 viên bi, số cách chọn khác nhau có thể tính bằng công thức nào?
  kết hợp
  Có 5 viên bi tổng cộng. Số cách chọn 2 viên từ 5 không phụ thuộc vào thứ tự là tổ hợp chập 2 của 5, ký hiệu C(5,2).
  \[ C(5,2)=\frac{5!}{2!3!}=10 \]
- 2: Để có hai viên cùng màu, ta cần xét hai trường hợp: cả hai đỏ hoặc cả hai xanh. Số cách chọn cho mỗi trường hợp là gì?
  tính tổ hợp
  Số cách chọn 2 viên đỏ từ 3 viên là C(3,2). Số cách chọn 2 viên xanh từ 2 viên là C(2,2).
  \[ C(3,2)=3,\ C(2,2)=1 \]

**Actual worked steps:**
1. **Tính tổng số cách chọn 2 viên bi** — Có 5 viên bi (3 đỏ, 2 xanh). Lấy đồng thời 2 viên bi không đặt lại, nên số cách chọn là tổ hợp C(5,2).
\[ C(5,2)=\frac{5\times4}{2}=10 \]
Reason: công thức tổ hợp
2. **Tính số cách chọn 2 viên cùng màu** — Hai viên cùng màu có thể là cả hai đỏ hoặc cả hai xanh. Tính từng trường hợp rồi cộng lại.
\[ C(3,2)=\frac{3\times2}{2}=3\quad\text{(hai đỏ)}\qquad C(2,2)=1\quad\text{(hai xanh)} \]
Reason: tính tổ hợp cho từng màu
3. **Tính xác suất** — Xác suất là (số cách chọn 2 viên cùng màu) chia (tổng số cách chọn 2 viên).
\[ \frac{3+1}{10}=\frac{4}{10}=\frac{2}{5} \]
Reason: định nghĩa xác suất cổ điển

**Returned conclusion metadata:** Xác suất lấy được hai viên bi cùng màu là \( \frac{2}{5} \).
\[ \frac{2}{5} \]

**LaTeX solution:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Ta sẽ đếm tổng số cách chọn 2 viên bi từ 5 viên, và số cách chọn 2 viên cùng màu (cả hai đỏ hoặc cả hai xanh). Xác suất là tỉ số giữa số cách có lợi và tổng số cách.
\begin{enumerate}
\item Tính tổng số cách chọn 2 viên bi. Có 5 viên bi (3 đỏ, 2 xanh). Lấy đồng thời 2 viên bi không đặt lại, nên số cách chọn là tổ hợp C(5,2).
\[C(5,2)=\frac{5\times4}{2}=10\]
công thức tổ hợp
\item Tính số cách chọn 2 viên cùng màu. Hai viên cùng màu có thể là cả hai đỏ hoặc cả hai xanh. Tính từng trường hợp rồi cộng lại.
\[C(3,2)=\frac{3\times2}{2}=3\quad\text{(hai đỏ)}\qquad C(2,2)=1\quad\text{(hai xanh)}\]
tính tổ hợp cho từng màu
\item Tính xác suất. Xác suất là (số cách chọn 2 viên cùng màu) chia (tổng số cách chọn 2 viên).
\[\frac{3+1}{10}=\frac{4}{10}=\frac{2}{5}\]
định nghĩa xác suất cổ điển
\end{enumerate}
Xác suất lấy được hai viên bi cùng màu là \(\frac{2}{5}\).
\[\frac{2}{5}\]
\end{document}
```

**Step-by-step explanation:**
Label all five balls. There are 10 equiprobable unordered pairs. Three of the red pairs and the sole blue pair are favourable, so 4/10=2/5. Independent enumeration of all ten subsets gives four matching colours.

**Independent verification:**
Label all five balls. There are 10 equiprobable unordered pairs. Three of the red pairs and the sole blue pair are favourable, so 4/10=2/5. Independent enumeration of all ten subsets gives four matching colours.

**Evaluation:**
- Mathematical correctness: Pass.
- Completeness: Pass.
- Explanation quality: Fail.
- LaTeX and formatting: Pass.
- Response latency: 20.464 seconds; scope: Complete text confirmation + HTTP solve + D1 persistence + full JSON response consumption + schema/KaTeX/all-field language audit; fixture OCR excluded.
- Final verdict: Fail.
- Automated review proxy: 90/100; components [40, 20, 8, 9, 10, 3] (40/20/15/10/10/5). Human satisfaction remains unmeasured.

**Failure analysis:** French/English leakage from the first HTTP batch is absent now. However, the note falsely calls simultaneous drawing ambiguous and is truncated; combination formula still lacks an explicit explanation of division by two orders.

## Question 12 — comb-val-inclusion (application-validation-final)

**Type:** inclusion-exclusion
**Difficulty:** Medium
**Source:** Generated set D; comb-val-inclusion.
**Split:** validation

**Question statement:**
Trong các số nguyên từ \( 1 \) đến \( 100 \), có bao nhiêu số chia hết cho \( 2 \) hoặc \( 3 \)?

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Trong các số nguyên từ \(1\) đến \(100\), có bao nhiêu số chia hết cho \(2\) hoặc \(3\)?
\end{document}
```

**Bot's answer:**
**Interpretation:** Trong các số nguyên từ 1 đến 100, có bao nhiêu số chia hết cho 2 hoặc 3?
**Strategy:** Ta sẽ đếm số các số chia hết cho 2, số các số chia hết cho 3, sau đó trừ đi số các số chia hết cho cả 2 và 3 (là chia hết cho 6) để tránh đếm trùng theo nguyên lý bao hàm - loại trừ.
**givens:** tập hợp các số nguyên từ 1 đến 100
**unknowns:** số lượng các số chia hết cho 2 hoặc 3

**Actual hints:**
- hint1: Trong dãy từ 1 đến 100, có bao nhiêu số chia hết cho 2?

  Số chia hết cho 2 là các số chẵn. Ta có thể chia 100 cho 2 để biết có bao nhiêu số như vậy.
- hint2: Tương tự, có bao nhiêu số chia hết cho 3 trong khoảng này?
  Để đếm số chia hết cho một số k trong đoạn [1, n], ta lấy phần nguyên của n/k.
  Với k = 3 và n = 100, ta tính 100 chia 3 lấy phần nguyên.
- hint3: Số nào được đếm hai lần nếu ta chỉ cộng số chia hết cho 2 và số chia hết cho 3?
  Các số được đếm hai lần là những số chia hết cho cả 2 và 3, tức là chia hết cho bội chung nhỏ nhất của 2 và 3.
  Bội chung nhỏ nhất của 2 và 3 là 6. Ta cần đếm số các số chia hết cho 6 trong đoạn [1, 100] để trừ đi.

**Actual worked steps:**
1. **Đếm số chia hết cho 2** — Số các số nguyên từ 1 đến 100 chia hết cho 2 bằng phần nguyên của 100 chia 2.
\[ 100 : 2 = 50 \]
Reason: quy tắc đếm số chia hết cho k trong [1, n]
2. **Đếm số chia hết cho 3** — Số các số nguyên từ 1 đến 100 chia hết cho 3 bằng phần nguyên của 100 chia 3.
\[ 100 : 3 = 33 (\text{ vì } 3 \text{ × } 33 = 99 < 100 \text{ và } 3 \text{ × } 34 = 102 > 100) \]
Reason: quy tắc đếm số chia hết cho k trong [1, n]
3. **Đếm số chia hết cho cả 2 và 3 (là chia hết cho 6)** — Số các số nguyên từ 1 đến 100 chia hết cho 6 bằng phần nguyên của 100 chia 6.
\[ 100 : 6 = 16 (\text{ vì } 6 \text{ × } 16 = 96 < 100 \text{ và } 6 \text{ × } 17 = 102 > 100) \]
Reason: quy tắc đếm số chia hết cho k trong [1, n]
4. **Áp dụng nguyên lý bao hàm - loại trừ** — Số các số chia hết cho 2 hoặc 3 bằng (số chia hết cho 2) + (số chia hết cho 3) - (số chia hết cho cả 2 và 3).
\[ 50 + 33 - 16 = 67 \]
Reason: nguyên lý bao hàm - loại trừ cho hai tập hợp

**Returned conclusion metadata:** Có 67 số nguyên từ 1 đến 100 chia hết cho 2 hoặc 3.
\[ 67 \]

**LaTeX solution:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Ta sẽ đếm số các số chia hết cho 2, số các số chia hết cho 3, sau đó trừ đi số các số chia hết cho cả 2 và 3 (là chia hết cho 6) để tránh đếm trùng theo nguyên lý bao hàm - loại trừ.
\begin{enumerate}
\item Đếm số chia hết cho 2. Số các số nguyên từ 1 đến 100 chia hết cho 2 bằng phần nguyên của 100 chia 2.
\[100 : 2 = 50\]
quy tắc đếm số chia hết cho k trong [1, n]
\item Đếm số chia hết cho 3. Số các số nguyên từ 1 đến 100 chia hết cho 3 bằng phần nguyên của 100 chia 3.
\[100 : 3 = 33 (\text{ vì } 3 \text{ × } 33 = 99 < 100 \text{ và } 3 \text{ × } 34 = 102 > 100)\]
quy tắc đếm số chia hết cho k trong [1, n]
\item Đếm số chia hết cho cả 2 và 3 (là chia hết cho 6). Số các số nguyên từ 1 đến 100 chia hết cho 6 bằng phần nguyên của 100 chia 6.
\[100 : 6 = 16 (\text{ vì } 6 \text{ × } 16 = 96 < 100 \text{ và } 6 \text{ × } 17 = 102 > 100)\]
quy tắc đếm số chia hết cho k trong [1, n]
\item Áp dụng nguyên lý bao hàm - loại trừ. Số các số chia hết cho 2 hoặc 3 bằng (số chia hết cho 2) + (số chia hết cho 3) - (số chia hết cho cả 2 và 3).
\[50 + 33 - 16 = 67\]
nguyên lý bao hàm - loại trừ cho hai tập hợp
\end{enumerate}
Có 67 số nguyên từ 1 đến 100 chia hết cho 2 hoặc 3.
\[67\]
\end{document}
```

**Step-by-step explanation:**
Enumeration of all integers1..100 gives67 meeting the predicate. Inclusion-exclusion gives50+33-16=67. But the actual math fields assert100:3=33 and100:6=16 instead of floor(100/3)=33 and floor(100/6)=16 or quotients with remainders. These exact equalities are false, despite correct surrounding floor explanation.

**Independent verification:**
Enumeration of all integers1..100 gives67 meeting the predicate. Inclusion-exclusion gives50+33-16=67. But the actual math fields assert100:3=33 and100:6=16 instead of floor(100/3)=33 and floor(100/6)=16 or quotients with remainders. These exact equalities are false, despite correct surrounding floor explanation.

**Evaluation:**
- Mathematical correctness: Fail.
- Completeness: Pass.
- Explanation quality: Fail.
- LaTeX and formatting: Pass.
- Response latency: 26.034 seconds; scope: Complete text confirmation + HTTP solve + D1 persistence + full JSON response consumption + schema/KaTeX/all-field language audit; fixture OCR excluded.
- Final verdict: Fail.
- Automated review proxy: 76/100; components [25, 20, 10, 10, 8, 3] (40/20/15/10/10/5). Human satisfaction remains unmeasured.

**Failure analysis:** Correct count with false intermediate division equalities. The machine verifier could not check the prose-labelled assignment and labelled not_checkable. Explicit quotient/remainder/floor checking remains an unresolved verifier gap.

## Question 13 — comb-val-handshake (application-validation-final)

**Type:** double-counting
**Difficulty:** Hard
**Source:** Generated set D; comb-val-handshake.
**Split:** validation

**Question statement:**
Có \( 6 \) người, mỗi người bắt tay đúng \( 2 \) người khác. Mỗi cặp người bắt tay nhiều nhất một lần. Tính tổng số cái bắt tay và giải thích vì sao không đếm lặp.

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Có \(6\) người, mỗi người bắt tay đúng \(2\) người khác. Mỗi cặp người bắt tay nhiều nhất một lần. Tính tổng số cái bắt tay và giải thích vì sao không đếm lặp.
\end{document}
```

**Bot's answer:**
**Interpretation:** Có \( 6 \) người, mỗi người bắt tay đúng \( 2 \) người khác. Mỗi cặp người bắt tay nhiều nhất một lần. Tính tổng số cái bắt tay và giải thích vì sao không đếm lặp.
**Strategy:** Ta dùng công thức: tổng số lần bắt tay được đếm từ góc nhìn của mỗi người là 6×2 = 12. Vì mỗi cặp bắt tay được đếm hai lần (mỗi người trong cặp đếm một lần), nên số cặp thực sự là 12/2 = 6.
**givens:** 6 người; mỗi người bắt tay đúng 2 người khác; mỗi cặp bắt tay nhiều nhất một lần
**unknowns:** tổng số cái bắt tay
**constraints:** mỗi cặp chỉ được đếm một lần
**interpretationNotes:** Không rõ liệu mỗi người bắt tay đúng 2 người khác có thể xảy ra không trong trường hợp 6 người (vì tổng bậc của đồ thị phải chẵn, nhưng 6×2=12 là chẵn, có thể tồn tại; tuy nhiên cần xác định cấu trúc cụ thể để tính số cạnh). Nếu giả định tồn tại cấu trúc thỏa mãn, thì số bắt tay là (6×2)/2 = 6. Cần

**Actual hints:**
- hints_1: Nếu mỗi người bắt tay 2 người khác, thì tổng số lần bắt tay được đếm từ tất cả người là bao nhiêu?
  Nhân số người với số lần bắt tay mỗi người.
  Mỗi người bắt tay 2 người, có 6 người nên tổng số lần đếm (trước khi loại bỏ lặp) là 6×2.
  \[ 6 \times 2 \]
- step2: Mỗi cặp bắt tay được đếm bao nhiêu lần trong tổng trên?
  Xem xét một cặp người cụ thể: mỗi người trong cặp đều đếm lần bắt tay đó một lần.
  Trong tổng 6×2, mỗi lần bắt tay giữa hai người được đếm hai lần (mỗi người một lần).
- step3: Do đó, số cặp bắt tay thực sự là bao nhiêu?
  Chia tổng số lần đếm cho 2 để loại bỏ việc đếm lặp.
  Vì mỗi cặp được đếm hai lần, nên số cặp thực sự là (6×2)/2.
  \[ \frac{6 \times 2}{2} \]

**Actual worked steps:**
1. **Tính tổng số lần bắt tay được đếm từ mỗi người** — Mỗi trong 6 người bắt tay đúng 2 người khác, nên tổng số lần bắt tay được đếm (mỗi người đếm lần bắt tay của mình) là 6 nhân 2.
\[ 6 \times 2 = 12 \]
Reason: nhân số người với số lần bắt tay mỗi người
2. **Xác định số lần mỗi cặp được đếm** — Mỗi cặp bắt tay gồm hai người. Khi mỗi người đếm số lần bắt tay của mình, mỗi cặp được đếm hai lần (mỗi người trong cặp đếm một lần).
Reason: mỗi cặp được đếm hai lần vì có hai người
3. **Tính số cặp bắt tay thực sự** — Để lấy số cặp bắt tay thực sự (không đếm lặp), ta chia tổng số lần đếm cho 2, vì mỗi cặp được đếm hai lần.
\[ \frac{12}{2} = 6 \]
Reason: chia cho 2 để loại bỏ việc đếm lặp

**Returned conclusion metadata:** Tổng số cái bắt tay là 6. Vì mỗi cặp bắt tay được đếm hai lần khi tổng từ mỗi người, nên chia cho 2 để tránh đếm lặp.
\[ 6 \]

**LaTeX solution:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Ta dùng công thức: tổng số lần bắt tay được đếm từ góc nhìn của mỗi người là 6×2 = 12. Vì mỗi cặp bắt tay được đếm hai lần (mỗi người trong cặp đếm một lần), nên số cặp thực sự là 12/2 = 6.
\begin{enumerate}
\item Tính tổng số lần bắt tay được đếm từ mỗi người. Mỗi trong 6 người bắt tay đúng 2 người khác, nên tổng số lần bắt tay được đếm (mỗi người đếm lần bắt tay của mình) là 6 nhân 2.
\[6 \times 2 = 12\]
nhân số người với số lần bắt tay mỗi người
\item Xác định số lần mỗi cặp được đếm. Mỗi cặp bắt tay gồm hai người. Khi mỗi người đếm số lần bắt tay của mình, mỗi cặp được đếm hai lần (mỗi người trong cặp đếm một lần).

mỗi cặp được đếm hai lần vì có hai người
\item Tính số cặp bắt tay thực sự. Để lấy số cặp bắt tay thực sự (không đếm lặp), ta chia tổng số lần đếm cho 2, vì mỗi cặp được đếm hai lần.
\[\frac{12}{2} = 6\]
chia cho 2 để loại bỏ việc đếm lặp
\end{enumerate}
Tổng số cái bắt tay là 6. Vì mỗi cặp bắt tay được đếm hai lần khi tổng từ mỗi người, nên chia cho 2 để tránh đếm lặp.
\[6\]
\end{document}
```

**Step-by-step explanation:**
Each of six people contributes two incidences, giving12. Each unordered handshake has exactly two endpoints, so12=2E andE=6. This is exhaustive double counting. A six-cycle demonstrates that the stated configuration is feasible.

**Independent verification:**
Each of six people contributes two incidences, giving12. Each unordered handshake has exactly two endpoints, so12=2E andE=6. This is exhaustive double counting. A six-cycle demonstrates that the stated configuration is feasible.

**Evaluation:**
- Mathematical correctness: Pass.
- Completeness: Pass.
- Explanation quality: Fail.
- LaTeX and formatting: Pass.
- Response latency: 16.076 seconds; scope: Complete text confirmation + HTTP solve + D1 persistence + full JSON response consumption + schema/KaTeX/all-field language audit; fixture OCR excluded.
- Final verdict: Fail.
- Automated review proxy: 93/100; components [40, 20, 10, 10, 10, 3] (40/20/15/10/10/5). Human satisfaction remains unmeasured.

**Failure analysis:** The counting proof is complete. The interpretation note needlessly claims a concrete graph structure is necessary and ends truncated. Combinatorics routing missed handshake wording; regression revealed it and a general cue is added before freeze.

## Question 14 — comb-val-probability (application-validation-minimal)

**Type:** without-replacement-probability
**Difficulty:** Medium
**Source:** Generated validation set C; comb-val-probability.
**Split:** validation

**Question statement:**
Một hộp có \( 3 \) viên bi đỏ và \( 2 \) viên bi xanh. Lấy ngẫu nhiên đồng thời \( 2 \) viên bi. Tính xác suất để lấy được hai viên bi cùng màu.

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Một hộp có \(3\) viên bi đỏ và \(2\) viên bi xanh. Lấy ngẫu nhiên đồng thời \(2\) viên bi. Tính xác suất để lấy được hai viên bi cùng màu.
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

## Question 15 — comb-val-arrangements (application-validation)

**Type:** permutation-block
**Difficulty:** Medium
**Source:** Generated validation set C; comb-val-arrangements.
**Split:** validation

**Question statement:**
Có \( 5 \) bạn đứng thành một hàng. Hai bạn An và Bình phải đứng cạnh nhau. Có bao nhiêu cách xếp?

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Có \(5\) bạn đứng thành một hàng. Hai bạn An và Bình phải đứng cạnh nhau. Có bao nhiêu cách xếp?
\end{document}
```

**Bot's answer:**
**Interpretation:** Có \( 5 \) bạn đứng thành một hàng. Hai bạn An và Bình phải đứng cạnh nhau. Có bao nhiêu cách xếp?
**Strategy:** Ta gom An và Bình thành một khối để xử lý điều kiện đứng cạnh nhau, sau đó đếm số cách sắp xếp khối và 3 bạn còn lại, cuối cùng nhân với 2 vì An và Bình có thể hoán đổi vị trí trong khối.
**givens:** 5 bạn phân biệt; An và Bình phải đứng cạnh nhau
**unknowns:** số cách xếp thỏa mãn điều kiện

**Actual hints:**
- hints_1: Nếu chúng ta coi An và Bình như một đơn vị duy nhất, thì có bao nhiêu đơn vị cần sắp xếp?
  Gom hai người cạnh nhau thành một khối
  Khi hai người phải đứng cạnh nhau, chúng ta có thể xem họ như một khối, vì trong mọi sắp xếp thỏa mãn điều kiện, hai người này luônอยู่ bên nhau, nên việc sắp xếp chúng tương đương với việc sắp xếp khối này cùng với các bạn còn lại.
  \[ 4  \text{ đơn vị } \]
- hint2: Sau khi sắp xếp các đơn vị, chúng ta cần xem xét cách sắp xếp An và Bình bên trong khối như thế nào?
  Trong khối, hai người có thể hoán đổi vị trí
  Khối có thể được sắp xếp theo hai cách: An‑Bình hoặc Bình‑An, vì hai người này phân biệt.
  \[ 2  \text{ cách } \]

**Actual worked steps:**
1. **Xét An và Bình như một khối** — Ta gom An và Bình thành một khối vì họ phải đứng cạnh nhau. Khi đó ta có 4 đối tượng để sắp xếp: khối và 3 bạn còn lại.
\[ 4! \]
Reason: Nguyên lý đếm: số hoán vị của n đối tượng phân biệt là n!
2. **Nhớ tính hoán vị bên trong khối** — Trong khối, An và Bình có thể hoán đổi vị trí, nên mỗi cách sắp xếp của 4 đối tượng tương ứng với 2 cách sắp xếp của An và Bình.
\[ 4! \times 2 = 48 \]
Reason: Nguyên lý nhân: nếu có A cách làm việc thứ nhất và mỗi cách đó có B cách làm việc thứ hai thì tổng số cách là A×B

**Returned conclusion metadata:** Có 48 cách xếp.
\[ 48 \]

**LaTeX solution:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Ta gom An và Bình thành một khối để xử lý điều kiện đứng cạnh nhau, sau đó đếm số cách sắp xếp khối và 3 bạn còn lại, cuối cùng nhân với 2 vì An và Bình có thể hoán đổi vị trí trong khối.
\begin{enumerate}
\item Xét An và Bình như một khối. Ta gom An và Bình thành một khối vì họ phải đứng cạnh nhau. Khi đó ta có 4 đối tượng để sắp xếp: khối và 3 bạn còn lại.
\[4!\]
Nguyên lý đếm: số hoán vị của n đối tượng phân biệt là n!
\item Nhớ tính hoán vị bên trong khối. Trong khối, An và Bình có thể hoán đổi vị trí, nên mỗi cách sắp xếp của 4 đối tượng tương ứng với 2 cách sắp xếp của An và Bình.
\[4! \times 2 = 48\]
Nguyên lý nhân: nếu có A cách làm việc thứ nhất và mỗi cách đó có B cách làm việc thứ hai thì tổng số cách là A×B
\end{enumerate}
Có 48 cách xếp.
\[48\]
\end{document}
```

**Step-by-step explanation:**
Collapsing adjacent An/Bình to one block is a bijection between admissible arrangements and a permutation of four distinct objects plus one of two internal orders. Thus 4!·2=48, independently enumerable over all 120 permutations.

**Independent verification:**
Collapsing adjacent An/Bình to one block is a bijection between admissible arrangements and a permutation of four distinct objects plus one of two internal orders. Thus 4!·2=48, independently enumerable over all 120 permutations.

**Evaluation:**
- Mathematical correctness: Pass.
- Completeness: Pass.
- Explanation quality: Fail.
- LaTeX and formatting: Fail.
- Response latency: 26.049 seconds; scope: Complete text confirmation + HTTP solve + D1 persistence + full JSON response consumption; fixture OCR excluded.
- Final verdict: Fail.
- Automated review proxy: 87/100; components [40, 20, 9, 10, 5, 3] (40/20/15/10/10/5). Human satisfaction remains unmeasured.

**Failure analysis:** Actual first hint contains Thai อยู่. Non-Latin script coverage added; this response fails Vietnamese quality despite correct counting.

## Question 16 — comb-val-probability (application-validation)

**Type:** without-replacement-probability
**Difficulty:** Medium
**Source:** Generated validation set C; comb-val-probability.
**Split:** validation

**Question statement:**
Một hộp có \( 3 \) viên bi đỏ và \( 2 \) viên bi xanh. Lấy ngẫu nhiên đồng thời \( 2 \) viên bi. Tính xác suất để lấy được hai viên bi cùng màu.

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Một hộp có \(3\) viên bi đỏ và \(2\) viên bi xanh. Lấy ngẫu nhiên đồng thời \(2\) viên bi. Tính xác suất để lấy được hai viên bi cùng màu.
\end{document}
```

**Bot's answer:**
**Interpretation:** Một hộp có \( 3 \) viên bi đỏ và \( 2 \) viên bi xanh. Lấy ngẫu nhiên đồng thời \( 2 \) viên bi. Tính xác suất để lấy được hai viên bi cùng màu.
**Strategy:** Ta đếm số cách chọn 2 viên bi từ 5 viên (số kết quả có thể xảy ra). Sau đó đếm số cách chọn 2 viên cùng màu (cả hai đỏ hoặc cả hai xanh). Xác suất là tỉ số giữa số cách thuận lợi và số cách tổng.
**givens:** hộp có 3 viên bi đỏ; 2 viên bi xanh
**unknowns:** xác suất lấy được 2 viên bi cùng màu
**constraints:** lấy đồng thời 2 viên bi (không remettre); các kết quả có cùng khả năng xảy ra

**Actual hints:**
- hints_1: Số cách chọn 2 viên bi từ 5 viên là bao nhiêu?
  Dùng tổ hợp C(n, k).
  Số kết quả có thể xảy ra khi lấy đồng thời 2 viên bi từ 5 là C(5,2).
  \[ C(5,2)=\frac{5!}{2!3!}=10 \]
- hint2: Số cách chọn 2 viên đỏ và số cách chọn 2 viên xanh lần lượt là bao nhiêu?
  Cũng dùng tổ hợp.
  Số cách lấy 2 viên đỏ là C(3,2); số cách lấy 2 viên xanh là C(2,2).
  \[ C(3,2)=3,\quad C(2,2)=1 \]
- hint3: Xác suất lấy được hai viên cùng màu là tỉ số giữa số cách thuận lợi và số cách tổng?
  Xác suất cổ điển P = favorable/total.
  Số cách thuận lợi = C(3,2)+C(2,2). Chia cho C(5,2) ta được kết quả.
  \[ P=\frac{C(3,2)+C(2,2)}{C(5,2)} \]

**Actual worked steps:**
1. **Tính số cách chọn 2 viên bi từ 5** — Các kết quả có thể xảy ra khi lấy đồng thời 2 viên bi từ 5 là các tổ hợp của 5 lấy 2.
\[ C(5,2)=\frac{5\times4}{2}=10 \]
Reason: Công thức tổ hợp
2. **Tính số cách chọn 2 viên cùng màu** — Số cách lấy 2 viên đỏ là C(3,2); số cách lấy 2 viên xanh là C(2,2). Cộng lại được số cách thuận lợi.
\[ C(3,2)=\frac{3\times2}{2}=3,\quad C(2,2)=1\\\text{Số cách thuận lợi}=3+1=4 \]
Reason: Công thức tổ hợp và nguyên lý cộng
3. **Tính xác suất** — Xác suất là tỉ số giữa số cách thuận lợi và số cách tổng.
\[ P=\frac{4}{10}=\frac{2}{5} \]
Reason: Định nghĩa xác suất cổ điển

**Returned conclusion metadata:** Xác suất lấy được hai viên bi cùng màu là \( \frac{2}{5} \).
\[ \frac{2}{5} \]

**LaTeX solution:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Ta đếm số cách chọn 2 viên bi từ 5 viên (số kết quả có thể xảy ra). Sau đó đếm số cách chọn 2 viên cùng màu (cả hai đỏ hoặc cả hai xanh). Xác suất là tỉ số giữa số cách thuận lợi và số cách tổng.
\begin{enumerate}
\item Tính số cách chọn 2 viên bi từ 5. Các kết quả có thể xảy ra khi lấy đồng thời 2 viên bi từ 5 là các tổ hợp của 5 lấy 2.
\[C(5,2)=\frac{5\times4}{2}=10\]
Công thức tổ hợp
\item Tính số cách chọn 2 viên cùng màu. Số cách lấy 2 viên đỏ là C(3,2); số cách lấy 2 viên xanh là C(2,2). Cộng lại được số cách thuận lợi.
\[C(3,2)=\frac{3\times2}{2}=3,\quad C(2,2)=1\\\text{Số cách thuận lợi}=3+1=4\]
Công thức tổ hợp và nguyên lý cộng
\item Tính xác suất. Xác suất là tỉ số giữa số cách thuận lợi và số cách tổng.
\[P=\frac{4}{10}=\frac{2}{5}\]
Định nghĩa xác suất cổ điển
\end{enumerate}
Xác suất lấy được hai viên bi cùng màu là \(\frac{2}{5}\).
\[\frac{2}{5}\]
\end{document}
```

**Step-by-step explanation:**
Label all five balls. There are 10 equiprobable unordered pairs. Three of the red pairs and the sole blue pair are favourable, so 4/10=2/5. Independent enumeration of all ten subsets gives four matching colours.

**Independent verification:**
Label all five balls. There are 10 equiprobable unordered pairs. Three of the red pairs and the sole blue pair are favourable, so 4/10=2/5. Independent enumeration of all ten subsets gives four matching colours.

**Evaluation:**
- Mathematical correctness: Pass.
- Completeness: Pass.
- Explanation quality: Fail.
- LaTeX and formatting: Fail.
- Response latency: 21.792 seconds; scope: Complete text confirmation + HTTP solve + D1 persistence + full JSON response consumption; fixture OCR excluded.
- Final verdict: Fail.
- Automated review proxy: 86/100; components [40, 20, 9, 9, 5, 3] (40/20/15/10/10/5). Human satisfaction remains unmeasured.

**Failure analysis:** Actual constraint contains French remettre and cue contains favorable/total. Added safe contextual glossary. Formula-only combination explanation still does not explicitly explain the two orders per pair.

## Question 17 — comb-dev-digits (baseline)

**Type:** ordered-distinct-digits
**Difficulty:** Easy
**Source:** Generated set A; comb-dev-digits.
**Split:** development

**Question statement:**
Từ các chữ số \( 0,1,2,3,4 \), lập được bao nhiêu số tự nhiên có ba chữ số đôi một khác nhau?

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Từ các chữ số \(0,1,2,3,4\), lập được bao nhiêu số tự nhiên có ba chữ số đôi một khác nhau?
\end{document}
```

**Bot's answer:**
**Interpretation:** Từ các chữ số 0, 1, 2, 3, 4, lập được bao nhiêu số tự nhiên có ba chữ số đôi một khác nhau?
**Strategy:** Ta sẽ đếm theo nguyên lý nhân: trước tiên chọn chữ số hàng trăm (không được là 0), sau đó chọn chữ số hàng chục từ các chữ số còn lại, cuối cùng chọn chữ số hàng đơn vị từ những gì còn lại.
**givens:** các chữ số cho phép: 0, 1, 2, 3, 4
**unknowns:** số lượng số tự nhiên ba chữ số có các chữ số đôi một khác nhau
**constraints:** số tự nhiên có ba chữ số → chữ số hàng trăm ≠ 0; ba chữ số đôi một khác nhau
**interpretationNotes:** Không rõ ràng liệu có cho phép sử dụng lại chữ số hay không; nhưng từ ngữ "đôi một khác nhau" cho thấy mỗi chữ số chỉ được dùng một lần trong mỗi số.

**Actual hints:**
- hints_1: Chữ số hàng trăm có thể là gì? Lý do là gì?
  Số có ba chữ số → chữ số hàng trăm không được bằng 0.
  Vì số có ba chữ số nên chữ số hàng trăm phải khác 0. Trong các chữ số 0,1,2,3,4, những giá trị khả dụng cho hàng trăm là 1,2,3,4.
  \[ \{1,2,3,4\} \]
- step2_hint2: Sau khi đã chọn chữ số hàng trăm, còn lại bao nhiêu chữ số để chọn cho hàng chục?
  Các chữ số phải đôi một khác nhau → không được trùng với chữ số hàng trăm đã chọn.
  Ban đầu có 5 chữ số (0,1,2,3,4). Sau khi dùng 1 chữ số cho hàng trăm, còn lại 4 chữ số khác nhau để chọn cho hàng chục.
  \[ 4 \]
- step3_hint3: Sau khi đã chọn hàng trăm và hàng chục, còn lại bao nhiêu lựa chọn cho hàng đơn vị?
  Hai chữ số đã dùng → còn lại 3 chữ số chưa dùng.
  Sau khi chọn hàng trăm và hàng chục (hai chữ số khác nhau), từ tổng 5 chữ số còn lại 5−2 = 3 chữ số để đặt vào hàng đơn vị.
  \[ 3 \]

**Actual worked steps:**
1. **Chọn chữ số hàng trăm** — Số có ba chữ số nên chữ số hàng trăm không được bằng 0. Từ các chữ số 0,1,2,3,4, những giá trị khả dụng là 1,2,3,4 → có 4 lựa chọn.
\[ 4 \]
Reason: điều kiện số có ba chữ số
2. **Chọn chữ số hàng chục** — Sau khi đã chọn hàng trăm, còn lại 4 chữ số khác nhau (bao gồm 0 và những chữ số chưa dùng). Vì yêu cầu các chữ số đôi một khác nhau, ta có 4 lựa chọn cho hàng chục.
\[ 4 \]
Reason: nguyên lý nhân, điều kiện chữ số khác nhau
3. **Chọn chữ số hàng đơn vị** — Sau khi đã chọn hàng trăm và hàng chục (hai chữ số khác nhau), còn lại 5−2 = 3 chữ số chưa dùng. Ta có 3 lựa chọn cho hàng đơn vị.
\[ 3 \]
Reason: nguyên lý nhân, điều kiện chữ số khác nhau
4. **Tổng số lượng** — Áp dụng nguyên lý nhân: số lượng số thỏa mãn = (lựa chọn hàng trăm) × (lựa chọn hàng chục) × (lựa chọn hàng đơn vị) = 4 × 4 × 3 = 48.
\[ 4 \times 4 \times 3 = 48 \]
Reason: nguyên lý nhân

**Returned conclusion metadata:** Có 48 số tự nhiên ba chữ số có các chữ số đôi một khác nhau được lập từ các chữ số 0,1,2,3,4.
\[ 48 \]

**LaTeX solution:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Ta sẽ đếm theo nguyên lý nhân: trước tiên chọn chữ số hàng trăm (không được là 0), sau đó chọn chữ số hàng chục từ các chữ số còn lại, cuối cùng chọn chữ số hàng đơn vị từ những gì còn lại.
\begin{enumerate}
\item Chọn chữ số hàng trăm. Số có ba chữ số nên chữ số hàng trăm không được bằng 0. Từ các chữ số 0,1,2,3,4, những giá trị khả dụng là 1,2,3,4 → có 4 lựa chọn.
\[4\]
điều kiện số có ba chữ số
\item Chọn chữ số hàng chục. Sau khi đã chọn hàng trăm, còn lại 4 chữ số khác nhau (bao gồm 0 và những chữ số chưa dùng). Vì yêu cầu các chữ số đôi một khác nhau, ta có 4 lựa chọn cho hàng chục.
\[4\]
nguyên lý nhân, điều kiện chữ số khác nhau
\item Chọn chữ số hàng đơn vị. Sau khi đã chọn hàng trăm và hàng chục (hai chữ số khác nhau), còn lại 5−2 = 3 chữ số chưa dùng. Ta có 3 lựa chọn cho hàng đơn vị.
\[3\]
nguyên lý nhân, điều kiện chữ số khác nhau
\item Tổng số lượng. Áp dụng nguyên lý nhân: số lượng số thỏa mãn = (lựa chọn hàng trăm) × (lựa chọn hàng chục) × (lựa chọn hàng đơn vị) = 4 × 4 × 3 = 48.
\[4 \times 4 \times 3 = 48\]
nguyên lý nhân
\end{enumerate}
Có 48 số tự nhiên ba chữ số có các chữ số đôi một khác nhau được lập từ các chữ số 0,1,2,3,4.
\[48\]
\end{document}
```

**Step-by-step explanation:**
Independent enumeration of ordered triples of distinct digits from {0,1,2,3,4}, with the first nonzero, yields 4×4×3=48. Each triple gives exactly one three-digit number; no repetition or ordering ambiguity.

**Independent verification:**
Independent enumeration of ordered triples of distinct digits from {0,1,2,3,4}, with the first nonzero, yields 4×4×3=48. Each triple gives exactly one three-digit number; no repetition or ordering ambiguity.

**Evaluation:**
- Mathematical correctness: Pass.
- Completeness: Pass.
- Explanation quality: Pass.
- LaTeX and formatting: Pass.
- Response latency: 14.654 seconds; scope: Pipeline only; excludes HTTP/database/mobile delivery.
- Final verdict: Pass.
- Automated review proxy: 95/100; components [40, 20, 13, 10, 8, 4] (40/20/15/10/10/5). Human satisfaction remains unmeasured.

**Failure analysis:** The answer is correct. Routing had omitted the Combinatorics profile for this wording; added counting cues and a cross-specialist routing regression.

## Question 18 — comb-dev-selection (baseline)

**Type:** unordered-selection
**Difficulty:** Medium
**Source:** Generated set B; comb-dev-selection.
**Split:** development

**Question statement:**
Có \( 5 \) bạn nam và \( 4 \) bạn nữ. Chọn \( 3 \) bạn để có ít nhất một bạn nữ. Có bao nhiêu cách chọn?

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Có \(5\) bạn nam và \(4\) bạn nữ. Chọn \(3\) bạn để có ít nhất một bạn nữ. Có bao nhiêu cách chọn?
\end{document}
```

**Bot's answer:**
**Interpretation:** Có \( 5 \) bạn nam và \( 4 \) bạn nữ. Chọn \( 3 \) bạn để có ít nhất một bạn nữ. Có bao nhiêu cách chọn?
**Strategy:** Ta sẽ đếm số cách chọn 3 bạn sao cho có ít nhất một bạn nữ bằng cách dùng phương pháp bổ sung: tính tổng số cách chọn 3 bạn từ 9 người trừ đi số cách chọn 3 bạn đều là nam (không có bạn nữ nào).
**givens:** 5 bạn nam; 4 bạn nữ; chọn 3 bạn; ít nhất một bạn nữ
**unknowns:** số cách chọn thỏa điều kiện
**constraints:** chọn không theo thứ tự; mỗi bạn chỉ được chọn một lần
**interpretationNotes:** Không rõ liệu việc chọn bạn nam và bạn nữ có được phân biệt hay không (ví dụ: các bạn nam có tên khác nhau hay không). Tuy nhiên, trong bối cảnh bài toán combinatorics cơ bản, thường giả định các đối tượng là phân biệt (mỗi bạn là một cá nhân riêng biệt). Nếu giả định này không đúng, bài toán sẽ cần

**Actual hints:**
- hints_1: Tổng số bạn là bao nhiêu? Nếu không có bất kỳ hạn chế nào, số cách chọn 3 bạn ra sao?

  Ta có 5 nam + 4 nữ = 9 bạn. Số cách chọn 3 người từ 9 không phân biệt thứ tự là tổ hợp chập 3 của 9.
  \[ C(9,3) \]
- step2: Để có ít nhất một bạn nữ, ta cần loại trừ trường hợp nào ra khỏi tổng số?

  Trường hợp không thỏa mãn là khi chọn 3 bạn đều là nam (không có bạn nữ nào). Ta cần tính số cách chọn 3 bạn nam từ 5 bạn nam.
  \[ C(5,3) \]
- step3: Áp dụng nguyên lý bổ sung để tìm số cách chọn có ít nhất một bạn nữ.

  Số cách chọn có ít nhất một bạn nữ = tổng số cách chọn 3 bạn - số cách chọn 3 bạn đều là nam.
  \[ C(9,3) - C(5,3) \]

**Actual worked steps:**
1. **Tính tổng số cách chọn 3 bạn từ 9 bạn** — Ta có tổng cộng 5 bạn nam + 4 bạn nữ = 9 bạn. Số cách chọn 3 bạn từ 9 người mà không phân biệt thứ tự được tính bằng tổ hợp C(9,3).
\[ C(9,3) = \frac{9!}{3!\cdot6!} = \frac{9\cdot8\cdot7}{3\cdot2\cdot1} = 84 \]
Reason: Công thức tổ hợp chập k của n
2. **Tính số cách chọn 3 bạn đều là nam (không có bạn nữ)** — Trường hợp không thỏa mãn điều kiện "ít nhất một bạn nữ" là khi chọn hết 3 bạn đều là nam. Từ 5 bạn nam, số cách chọn 3 bạn là C(5,3).
\[ C(5,3) = \frac{5!}{3!\cdot2!} = \frac{5\cdot4}{2} = 10 \]
Reason: Công thức tổ hợp chập k của n
3. **Áp dụng nguyên lý bổ sung để tìm số cách chọn có ít nhất một bạn nữ** — Số cách chọn thỏa mãn ít nhất một bạn nữ bằng tổng số cách chọn 3 bạn trừ đi số cách chọn 3 bạn đều là nam.
\[ C(9,3) - C(5,3) = 84 - 10 = 74 \]
Reason: Nguyên lý bổ sung trong đếm

**Returned conclusion metadata:** Có 74 cách chọn 3 bạn sao cho có ít nhất một bạn nữ.
\[ 74 \]

**LaTeX solution:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Ta sẽ đếm số cách chọn 3 bạn sao cho có ít nhất một bạn nữ bằng cách dùng phương pháp bổ sung: tính tổng số cách chọn 3 bạn từ 9 người trừ đi số cách chọn 3 bạn đều là nam (không có bạn nữ nào).
\begin{enumerate}
\item Tính tổng số cách chọn 3 bạn từ 9 bạn. Ta có tổng cộng 5 bạn nam + 4 bạn nữ = 9 bạn. Số cách chọn 3 bạn từ 9 người mà không phân biệt thứ tự được tính bằng tổ hợp C(9,3).
\[C(9,3) = \frac{9!}{3!\cdot6!} = \frac{9\cdot8\cdot7}{3\cdot2\cdot1} = 84\]
Công thức tổ hợp chập k của n
\item Tính số cách chọn 3 bạn đều là nam (không có bạn nữ). Trường hợp không thỏa mãn điều kiện "ít nhất một bạn nữ" là khi chọn hết 3 bạn đều là nam. Từ 5 bạn nam, số cách chọn 3 bạn là C(5,3).
\[C(5,3) = \frac{5!}{3!\cdot2!} = \frac{5\cdot4}{2} = 10\]
Công thức tổ hợp chập k của n
\item Áp dụng nguyên lý bổ sung để tìm số cách chọn có ít nhất một bạn nữ. Số cách chọn thỏa mãn ít nhất một bạn nữ bằng tổng số cách chọn 3 bạn trừ đi số cách chọn 3 bạn đều là nam.
\[C(9,3) - C(5,3) = 84 - 10 = 74\]
Nguyên lý bổ sung trong đếm
\end{enumerate}
Có 74 cách chọn 3 bạn sao cho có ít nhất một bạn nữ.
\[74\]
\end{document}
```

**Step-by-step explanation:**
Independent enumeration of 3-element subsets of 9 labelled people gives 84 subsets; 10 use only the 5 boys. Hence 74 contain a girl. The two classes are disjoint and exhaustive.

**Independent verification:**
Independent enumeration of 3-element subsets of 9 labelled people gives 84 subsets; 10 use only the 5 boys. Hence 74 contain a girl. The two classes are disjoint and exhaustive.

**Evaluation:**
- Mathematical correctness: Pass.
- Completeness: Pass.
- Explanation quality: Fail.
- LaTeX and formatting: Pass.
- Response latency: 14.945 seconds; scope: Pipeline only; excludes HTTP/database/mobile delivery.
- Final verdict: Fail.
- Automated review proxy: 90/100; components [40, 20, 10, 8, 9, 3] (40/20/15/10/10/5). Human satisfaction remains unmeasured.

**Failure analysis:** Correct count, but the solution invokes a combination formula without explaining division by the number of orders. Checker could not parse C(9,3). Added bounded arithmetic and exhaustive independent subset tests; prompt must explain overcounting correction.

## Question 19 — comb-dev-pigeonhole (baseline)

**Type:** residue-pigeonhole
**Difficulty:** Medium
**Source:** Generated set A; comb-dev-pigeonhole.
**Split:** development

**Question statement:**
Chứng minh trong \( 6 \) số nguyên bất kỳ luôn có hai số có hiệu chia hết cho \( 5 \).

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Chứng minh trong \(6\) số nguyên bất kỳ luôn có hai số có hiệu chia hết cho \(5\).
\end{document}
```

**Bot's answer:**
**Interpretation:** Chứng minh trong \( 6 \) số nguyên bất kỳ luôn có hai số có hiệu chia hết cho \( 5 \).
**Strategy:** Ta sẽ xét các dư số khi chia cho 5 của các số nguyên đã cho. Vì chỉ có 5 dư số khả thi (0,1,2,3,4) nhưng ta có 6 số, nên theo nguyên lý phong bụ phải tồn tại ít nhất hai số có cùng dư số modulo 5, từ đó hiệu của chúng chia hết cho 5.
**givens:** 6 số nguyên bất kỳ
**interpretationNotes:** Vấn đề thiếu ràng buộc về tính khác nhau của các số nguyên. Cần xác định xem "6 số nguyên bất kỳ" có cho phép trùng lặp hay không. Nếu cho phép trùng lặp, thì chứng minh trở nên tự nhiên vì có thể chọn hai số bằng nhau (hiệu = 0 chia hết cho 5). Nếu yêu cầu các số nguyên khác nhau, thì vẫn đúng nhưn

**Actual hints:**
- hints_1: Khi một số nguyên chia cho 5, dư số có thể là gì?
  Các dư số modulo 5
  Dư số khi chia cho 5 chỉ có thể là 0, 1, 2, 3 hoặc 4. Đây là nền tảng để áp dụng nguyên lý phong bụ.
  \[ \{0,1,2,3,4\} \]

**Actual worked steps:**
1. **Xét dư số modulo 5 của các số nguyên** — Ta chỉ cần xem dư số khi chia cho 5 vì hai số có hiệu chia hết cho 5 nếu và chỉ khi chúng có cùng dư số modulo 5.
\[ \text{Với số nguyên } a,\ a \equiv r \pmod{5},\text{ trong đó } r\in\{0,1,2,3,4\} \]
Reason: Định nghĩa congruence modulo 5
2. **Áp dụng nguyên lý phong bụ** — Có 6 số nhưng chỉ có 5 dư số khả thi, nên phải tồn tại ít nhất hai số có cùng dư số modulo 5.
\[ \text{Từ 6 số và 5 dư số }\Rightarrow\exists\,i\neq j\text{ sao cho } a_i\equiv a_j\pmod{5} \]
Reason: Nguyên lý phong bụ (Dirichlet)
3. **Kết luận về hiệu chia hết cho 5** — Nếu hai số có cùng dư số modulo 5 thì hiệu của chúng chia hết cho 5.
\[ a_i\equiv a_j\pmod{5}\ \Rightarrow\ 5\mid (a_i - a_j) \]
Reason: Tính chất của congruence: nếu a≡b (mod m) thì m|(a−b)

**Returned conclusion metadata:** Trong bất kỳ 6 số nguyên nào, luôn tồn tại hai số có hiệu chia hết cho 5.
\[ \forall\,a_1,\ldots,a_6\in\mathbb{Z},\ \exists\,i\neq j\text{ sao cho }5\mid(a_i-a_j) \]

**LaTeX solution:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Ta sẽ xét các dư số khi chia cho 5 của các số nguyên đã cho. Vì chỉ có 5 dư số khả thi (0,1,2,3,4) nhưng ta có 6 số, nên theo nguyên lý phong bụ phải tồn tại ít nhất hai số có cùng dư số modulo 5, từ đó hiệu của chúng chia hết cho 5.
\begin{enumerate}
\item Xét dư số modulo 5 của các số nguyên. Ta chỉ cần xem dư số khi chia cho 5 vì hai số có hiệu chia hết cho 5 nếu và chỉ khi chúng có cùng dư số modulo 5.
\[\text{Với số nguyên } a,\ a \equiv r \pmod{5},\text{ trong đó } r\in\{0,1,2,3,4\}\]
Định nghĩa congruence modulo 5
\item Áp dụng nguyên lý phong bụ. Có 6 số nhưng chỉ có 5 dư số khả thi, nên phải tồn tại ít nhất hai số có cùng dư số modulo 5.
\[\text{Từ 6 số và 5 dư số }\Rightarrow\exists\,i\neq j\text{ sao cho } a_i\equiv a_j\pmod{5}\]
Nguyên lý phong bụ (Dirichlet)
\item Kết luận về hiệu chia hết cho 5. Nếu hai số có cùng dư số modulo 5 thì hiệu của chúng chia hết cho 5.
\[a_i\equiv a_j\pmod{5}\ \Rightarrow\ 5\mid (a_i - a_j)\]
Tính chất của congruence: nếu a≡b (mod m) thì m|(a−b)
\end{enumerate}
Trong bất kỳ 6 số nguyên nào, luôn tồn tại hai số có hiệu chia hết cho 5.
\[\forall\,a_1,\ldots,a_6\in\mathbb{Z},\ \exists\,i\neq j\text{ sao cho }5\mid(a_i-a_j)\]
\end{document}
```

**Step-by-step explanation:**
There are exactly five residue classes modulo 5 and six input integers. Two must share a class; writing them as 5q+r and 5s+r makes their difference 5(q-s). This is a proof for all inputs; two selected numerical examples do not prove it.

**Independent verification:**
There are exactly five residue classes modulo 5 and six input integers. Two must share a class; writing them as 5q+r and 5s+r makes their difference 5(q-s). This is a proof for all inputs; two selected numerical examples do not prove it.

**Evaluation:**
- Mathematical correctness: Pass.
- Completeness: Pass.
- Explanation quality: Fail.
- LaTeX and formatting: Fail.
- Response latency: 19.151 seconds; scope: Pipeline only; excludes HTTP/database/mobile delivery.
- Final verdict: Fail.
- Automated review proxy: 85/100; components [40, 20, 8, 10, 5, 2] (40/20/15/10/10/5). Human satisfaction remains unmeasured.

**Failure analysis:** Actual prose calls the principle phong bụ and leaks congruence. Added natural terminology cleanup. Only one hint guides a three-step proof. The shared routing did not identify the pigeonhole wording as combinatorics; regression now does.

## Question 20 — comb-dev-parity (baseline)

**Type:** parity-invariant
**Difficulty:** Hard
**Source:** Generated set B; comb-dev-parity.
**Split:** development

**Question statement:**
Trên bảng có các số \( 1,2,3,4,5,6 \). Mỗi lần xóa hai số \( a,b \) và viết số \( a+b \). Có thể cuối cùng chỉ còn số \( 20 \) không? Giải thích.

**LaTeX question:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Trên bảng có các số \(1,2,3,4,5,6\). Mỗi lần xóa hai số \(a,b\) và viết số \(a+b\). Có thể cuối cùng chỉ còn số \(20\) không? Giải thích.
\end{document}
```

**Bot's answer:**
**Interpretation:** Trên bảng có các số \( 1,2,3,4,5,6 \). Mỗi lần xóa hai số \( a,b \) và viết số \( a+b \). Có thể cuối cùng chỉ còn số \( 20 \) không? Giải thích.
**Strategy:** Ta xét tổng các số trên bảng sau mỗi bước. Khi thay hai số a,b bằng a+b, tổng không đổi. Vì vậy tổng luôn bằng tổng ban đầu 1+2+3+4+5+6 = 21. Nếu cuối cùng chỉ còn một số, số đó phải bằng 21, không thể là 20.
**givens:** bảng có các số 1,2,3,4,5,6
**unknowns:** có thể cuối cùng chỉ còn số 20 không
**constraints:** mỗi bước xóa hai số a,b và viết a+b
**interpretationNotes:** Không rõ số lần thực hiện phép toán: sau mỗi bước số lượng số trên bảng giảm 1, bắt đầu từ 6 số, sau 5 bước sẽ còn 1 số. Tuy nhiên, trong đề không nói rõ phải thực hiện đến khi chỉ còn 1 số hay có thể dừng sớm hơn. Nếu dừng sớm hơn, có thể có nhiều kết quả khác nhau; nếu phải thực hiện đến khi chỉ c

**Actual hints:**
- hints_1: Sau mỗi lần xóa hai số và viết tổng của chúng, tổng các số trên bảng có thay đổi không?
  Tổng các số
  Khi thay hai số a,b bằng một số a+b, tổng trước là ...+a+b+..., tổng sau là ...+(a+b)+... = ...+a+b+..., nên tổng không đổi.
- 2: Tổng ban đầu của các số 1,2,3,4,5,6 là bao nhiêu?
  Tính tổng
  1+2+3+4+5+6 = 21.
- 3: Nếu cuối cùng chỉ còn một số, số đó phải bằng tổng ban đầu vì sao?
  Tổng không đổi
  Vì tổng không đổi sau mỗi bước, nên sau mọi bước tổng vẫn bằng 21. Khi chỉ còn một số, tổng bằng chính số đó, nên số đó phải là 21.

**Actual worked steps:**
1. **Tổng không đổi** — Mỗi lần thay hai số a,b bằng a+b, tổng các số trên bảng không thay đổi vì (a+b) thay thế đúng a+b.
\[ \text{Tổng trước bước} = S,\ \text{Tổng sau bước} = S - a - b + (a+b) = S \]
Reason: Tính chất bảo toàn tổng khi thay hai số bằng tổng của chúng
2. **Tổng ban đầu** — Tính tổng các số ban đầu trên bảng: 1+2+3+4+5+6 = 21.
\[ 1+2+3+4+5+6 = 21 \]
Reason: Công thức tính tổng dãy số nguyên liên tiếp
3. **Kết luận** — Vì tổng luôn bằng 21, khi chỉ còn một số thì số đó phải là 21. Do đó không thể còn số 20.
\[ \text{Kết quả cuối cùng} = 21 \neq 20 \]
Reason: Tổng không đổi và điều kiện chỉ còn một số

**Returned conclusion metadata:** Không thể, vì tổng các số trên bảng luôn không đổi và bằng 21, khi chỉ còn một số thì số đó phải là 21, khác 20.
\[ \text{Không thể còn số }20 \]

**LaTeX solution:**
```latex
\documentclass{article}
\usepackage{amsmath,amssymb,fontspec,unicode-math}
\setmainfont{Arial}
\begin{document}
Ta xét tổng các số trên bảng sau mỗi bước. Khi thay hai số a,b bằng a+b, tổng không đổi. Vì vậy tổng luôn bằng tổng ban đầu 1+2+3+4+5+6 = 21. Nếu cuối cùng chỉ còn một số, số đó phải bằng 21, không thể là 20.
\begin{enumerate}
\item Tổng không đổi. Mỗi lần thay hai số a,b bằng a+b, tổng các số trên bảng không thay đổi vì (a+b) thay thế đúng a+b.
\[\text{Tổng trước bước} = S,\ \text{Tổng sau bước} = S - a - b + (a+b) = S\]
Tính chất bảo toàn tổng khi thay hai số bằng tổng của chúng
\item Tổng ban đầu. Tính tổng các số ban đầu trên bảng: 1+2+3+4+5+6 = 21.
\[1+2+3+4+5+6 = 21\]
Công thức tính tổng dãy số nguyên liên tiếp
\item Kết luận. Vì tổng luôn bằng 21, khi chỉ còn một số thì số đó phải là 21. Do đó không thể còn số 20.
\[\text{Kết quả cuối cùng} = 21 \neq 20\]
Tổng không đổi và điều kiện chỉ còn một số
\end{enumerate}
Không thể, vì tổng các số trên bảng luôn không đổi và bằng 21, khi chỉ còn một số thì số đó phải là 21, khác 20.
\[\text{Không thể còn số }20\]
\end{document}
```

**Step-by-step explanation:**
Every move preserves S because S-a-b+(a+b)=S. The starting total is 21, so any final singleton must be 21, never 20. Independent enumeration of all pair-merge states confirms the unique final value 21.

**Independent verification:**
Every move preserves S because S-a-b+(a+b)=S. The starting total is 21, so any final singleton must be 21, never 20. Independent enumeration of all pair-merge states confirms the unique final value 21.

**Evaluation:**
- Mathematical correctness: Pass.
- Completeness: Pass.
- Explanation quality: Pass.
- LaTeX and formatting: Pass.
- Response latency: 11.894 seconds; scope: Pipeline only; excludes HTTP/database/mobile delivery.
- Final verdict: Pass.
- Automated review proxy: 97/100; components [40, 20, 14, 10, 9, 4] (40/20/15/10/10/5). Human satisfaction remains unmeasured.

**Failure analysis:** The question exercises a sum invariant rather than parity. Machine checking the initial sum is not checking the invariant proof, even though the independently reviewed explanation is valid.


## User-requested feedback iteration 02

See [iteration-02.md](iteration-02.md) for upload-only OCR, Vietnamese divisibility, cyclicity prerequisites, LaTeX, SocLaas fallback and the actual $2\times9$ pursuit game. Seven targeted questions pass; the frozen structural transfer result is 0/3 against all product requirements. Archived initial evaluation remains unchanged.

## Vòng03 — chiến lược cụ thể và nhân chứng

Xem [checkpoint](iteration-03/combinatorics-summary.md), [16 đáp án thực tế](iteration-03/development-combinatorics-final-v234.md) và [29 biến thể](iteration-03/validation-combinatorics-final-v234.md). Có bảng ô hỏi An/Bình, mọi lớp dư trò đặt dấu và nhân chứng cụ thể khi có dữ liệu. Đây là development/diagnostic, không phải held-out.

## Q5 invalid colour-block argument and replacement sweep — solver-v2.35

[Full actual answers, reproduced failures, independent checks and manual guide](iteration-03/user-proof-feedback.md). Six application calls with external inference disabled;0.2–2.7s;12 mobile/desktop page views pass. Historical held-out scores remain unchanged. Q3 and Q4a retain honest partial machine verification; full Q4b/c were not rerun.
