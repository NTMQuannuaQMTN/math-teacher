# Past papers and official solutions: findings

Evidence collected by the research loop (see [LOOP_STATE.md](LOOP_STATE.md)). Each entry cites the source it was read
from. "Official" means published by the Ministry, a Sở GD&ĐT or the school that set the paper. A finding changes the
pipeline only when two independent official sources agree (the curriculum document counts as one).

## Summary of pipeline changes (kept up to date)

| Change | Where | Evidence |
| --- | --- | --- |
| "phép quay" prohibited → discouraged (recognising rotations of regular polygons is Grade 9 content) | policy v1.2 | S1 (F1) |
| ≈ allowed for measurements the question asks to approximate; in the symbol bar | symbol bar, NOTATION.md, SOLVE_SYSTEM rule 6 | S1, S2, S3, S6 (F2) |
| Probability write-up: Ω and n(Ω), equally likely, favourable outcomes, P(A) as a reduced fraction | combinatorics guidance | S1, S2, S3, S4, S10 (F3) |
| Official notation: \widehat, ⋮, //, ∽, "." for products, decimal comma, points (1; −1) | SOLVE_SYSTEM rule 6, hint prompt | S2–S8 (F5, F9) |
| Word problems: unknown with unit and condition, (nhận)/(loại), "Vậy …" with units; routine equation in one line | algebra guidance | S2, S3, S10, S13 (F5, F17) |
| Vi-ét: why the roots exist, then a system; with a parameter: condition from Δ first, each m checked | algebra guidance | S2, S3, S6, S8, S12, S14 (F5, F19) |
| (P) and (d): phương trình hoành độ giao điểm → "Với x = … thì y = …" → "Vậy tọa độ giao điểm …" | algebra guidance | S3, S6, S8 (F9, F10) |
| Systems: transform one equation, cases with (không thỏa mãn), sum of squares = 0, list every pair | algebra guidance | S5, S10 (F15) |
| Inequalities: elementary forms ("Ta chứng minh được"), "Tương tự", "Cộng vế theo vế", "Vậy giá trị nhỏ nhất …" | algebra guidance | S4, S5, S9, S2 (F6, F11) |
| Number theory: product = known number, parity, TH cases, prime divides a factor, divisibility bound, contradiction, symmetric equations listed in full | number-theory guidance | S4, S5, S9, S11 (F7, F11, F13) |
| Geometry: reasons in brackets, (g.g)/(c.g.c), cyclic via a common diameter circle, collinearity via 180°, bổ đề + proof, products via similar triangles (no named Menelaus/Ceva/Ptolemy/phương tích) | geometry guidance | S2–S11 (F5, F8, F10, F13, F16) |
| Out-of-programme theorems only with proof; never rely on an unproved earlier part | SOLVE_SYSTEM rule 1, discouraged warnings (policy v1.4) | S13, S9, S14 (F18) |
| Tutor teaches marking habits: draw the figure, give reasons, no guessing | tutor prompt rule 6 | S10, S11, S14, S9 (F13) |
| Credit stops at the first error: dependent later steps marked "unclear", student told to fix that step first | tutor prompt rules 3 and 6 | S10, S17 (F21) |
| Self-talk checker: "thử lại" only as retry (official keys use "Thử lại vào phương trình"); "? Không", "không cần phức tạp" caught | policy v1.3, v1.5 + tests | S9 (F14), live spot check 3 |
| Figure points named with letters (M, A', A1), never midAB (user request) | formalize prompt, `name_points`, geometry guidance | — |
| Benchmark: official-answer items from 13 papers; probability/word problems filed as "other" | `benchmarks/authentic` | S3–S16 |

Open (single source or conflicting, not applied): using an unproved earlier part (Hải Phòng allows, Quảng Ninh and Thanh Hóa do not — the solver proves everything);
Fermat's little theorem in an official key (Hải Phòng đề dự bị only); "½ sđ" arc notation; proving configuration
facts (Phú Yên 2024 only).

## Sources read

| Id | Source | Kind | Read |
| --- | --- | --- | --- |
| S1 | Chương trình GDPT 2018 môn Toán (Thông tư 32/2018/TT-BGDĐT), lớp 6–9 sections, pp. 46–78. Copy published by THCS Lam Sơn Q.6, HCM: <https://thcslamsonq6.hcm.edu.vn/hoat-dong-chuyen-mon/chuong-trinh-giao-duc-pho-thong-mon-toan-ban-hanh-kem-theo-thong-tu-so-322018tt/ctmb/30978/387325> (PDF `3-cttoan.pdf`, 123 pages) | official curriculum | 2026-11-02, text layer |
| S3 | Sở GD&ĐT TP. Hồ Chí Minh, "Đáp án và hướng dẫn chấm", tuyển sinh lớp 10 năm học 2025–2026, môn Toán (đại trà), with the đề chính thức, 6 pages: <https://thcs.toanmath.com/thcs-pdf/de-tuyen-sinh-lop-10-mon-toan-nam-2025-2026-so-gddt-tp-ho-chi-minh.pdf> (SHA-256 d016b301…352e) | official marking guide | 2026-11-03, page images |
| S4 | Sở GD&ĐT TP. Hồ Chí Minh, "Đáp án và hướng dẫn chấm", tuyển sinh lớp 10 năm học 2025–2026, môn Toán **chuyên**: <https://thcs.toanmath.com/thcs-pdf/de-tuyen-sinh-lop-10-mon-toan-chuyen-nam-2025-2026-so-gddt-tp-ho-chi-minh.pdf> | official marking guide | 2026-11-03, page images |
| S5 | Trường Phổ thông Năng khiếu (ĐHQG-HCM), "Đáp án tuyển sinh lớp 10 năm học 2023–2024, môn Toán chuyên": <https://ptnk.edu.vn/wp-content/uploads/2023/06/Dapan-Toan-Chuyen-2023-2024.pdf> (SHA-256 fa17d2b2…) | official answer key | 2026-11-03, page images |
| S6 | Sở GD&ĐT TP. Hồ Chí Minh, "Đáp án và hướng dẫn chấm", tuyển sinh lớp 10 năm học 2024–2025, môn Toán (đại trà), with the đề: <https://thcs.toanmath.com/thcs-pdf/de-tuyen-sinh-lop-10-mon-toan-nam-2024-2025-so-gddt-tp-ho-chi-minh.pdf> (SHA-256 c3eabb6c…) | official marking guide | 2026-11-03, page images |
| S7 | Sở GD&ĐT Hà Nội, "Đáp án – thang điểm cho đề chính thức", năm học 2026–2027, 31/5/2026 (short answers only, Sở stamp), as published by VTC News: <https://vtcnews.vn/dap-an-chinh-thuc-mon-toan-thi-vao-lop-10-tai-ha-noi-nam-2026-ar1021456.html> | official marking scheme | 2026-11-03, page image |
| S8 | Sở GD&ĐT TP. Hồ Chí Minh, "Đáp án và hướng dẫn chấm", tuyển sinh lớp 10 năm học 2023–2024, môn Toán (đại trà), scanned with the Sở stamp: <https://thcs.toanmath.com/thcs-pdf/de-tuyen-sinh-lop-10-mon-toan-nam-2023-2024-so-gddt-tp-ho-chi-minh.pdf> (SHA-256 b4871106…) | official marking guide | 2026-11-03, page images |
| S9 | Sở GD&ĐT Quảng Nam, "HDC CHÍNH THỨC – Hướng dẫn chấm môn Toán (chuyên)" and "… Toán chuyên Tin", tuyển sinh lớp 10 THPT chuyên năm học 2025–2026, with the đề: <https://thcs.toanmath.com/thcs-pdf/de-tuyen-sinh-lop-10-mon-toan-chuyen-nam-2025-2026-so-gddt-quang-nam.pdf> (SHA-256 04535e8f…) | official marking guide | 2026-11-03, text + page images |
| S10 | Sở GD&ĐT Hải Phòng, "HDC đề chính thức – Hướng dẫn chấm môn Toán (chuyên)" and the HDC of the **đề dự bị**, năm học 2025–2026: <https://thcs.toanmath.com/thcs-pdf/de-tuyen-sinh-lop-10-mon-toan-chuyen-nam-2025-2026-so-gddt-hai-phong.pdf> (SHA-256 60287a20…) | official marking guide | 2026-11-03, text + page images |
| S11 | Sở GD&ĐT Phú Yên, "Hướng dẫn chấm thi môn Toán (chuyên) – đề chính thức", năm học 2024–2025, scanned with the Sở stamp: <https://thcs.toanmath.com/thcs-pdf/de-tuyen-sinh-lop-10-mon-toan-chuyen-nam-2024-2025-so-gddt-phu-yen.pdf> (SHA-256 1d09bf01…) | official marking guide | 2026-11-03, page images |
| S12 | Sở GD&ĐT An Giang, "Đáp án đề thi tuyển sinh vào lớp 10 THPT năm học 2024–2025, môn Toán chuyên" (lược giải): <https://thcs.toanmath.com/thcs-pdf/de-tuyen-sinh-lop-10-mon-toan-chuyen-nam-2024-2025-so-gddt-an-giang.pdf> | official answer key | 2026-11-03, text layer |
| S13 | Sở GD&ĐT Quảng Ninh, "Hướng dẫn chấm thi tuyển sinh THPT năm học 2025–2026, môn Toán" (đại trà): <https://thcs.toanmath.com/thcs-pdf/de-tuyen-sinh-lop-10-mon-toan-nam-2025-2026-so-gddt-quang-ninh.pdf> (SHA-256 cc0f23b0…) | official marking guide | 2026-11-03, text layer |
| S14 | Sở GD&ĐT Thanh Hóa, "Hướng dẫn chấm" (5 trang), tuyển sinh lớp 10 năm học 2025–2026, môn Toán (đại trà): <https://thcs.toanmath.com/thcs-pdf/de-tuyen-sinh-lop-10-mon-toan-nam-2025-2026-so-gddt-thanh-hoa.pdf> (SHA-256 c596f269…) | official marking guide | 2026-11-03, text layer |
| S15 | Sở GD&ĐT Quảng Nam, "Hướng dẫn chấm đề chính thức", tuyển sinh lớp 10 năm học 2025–2026, môn Toán (đại trà): <https://thcs.toanmath.com/thcs-pdf/de-tuyen-sinh-lop-10-mon-toan-nam-2025-2026-so-gddt-quang-nam.pdf> (SHA-256 9a8a8548…) | official marking guide | 2026-11-03, text layer |
| S16 | Trường Phổ thông Năng khiếu, "Đáp án" tuyển sinh lớp 10 năm học 2024–2025, môn Toán chuyên (Google Drive file 1LBbnLhPQ3kOQhjKuc-uyDVE3eGqJHC9K, SHA-256 ffe532e0… = the hash in `benchmarks/authentic/sources.json`) | official answer key | 2026-11-03, page images |
| S17 | Sở GD&ĐT Quảng Bình, "Hướng dẫn chấm" (5 trang), tuyển sinh lớp 10 chuyên năm học 2022–2023, môn Toán: <https://thcs.toanmath.com/thcs-pdf/de-tuyen-sinh-lop-10-mon-toan-chuyen-nam-2022-2023-so-gddt-quang-binh.pdf> (SHA-256 f3c1f528…) | official marking guide | 2026-11-03, text layer |
| S2 | Sở GD&ĐT Hà Nội, "Đáp án – thang điểm cho đề chính thức", tuyển sinh lớp 10 năm học 2025–2026, môn Toán (đại trà), 2 pages with the Sở stamp, as published by VietNamNet: <https://vietnamnet.vn/dap-an-chinh-thuc-mon-toan-thi-tuyen-sinh-vao-lop-10-tai-ha-noi-nam-2025-2410402.html> | official marking scheme | 2026-11-02, page images |

Earlier sources (PTNK 2023/2024 keys, HCM 2025 marking guide, teachers' solutions) are summarised in
[../NOTATION.md](../NOTATION.md).

## F1. Rotation (phép quay) is Grade 9 content, as recognition only

- S1, lớp 9, "Đa giác đều" (p. 76): "Nhận biết được phép quay. Mô tả được các phép quay giữ nguyên hình đa giác đều."
  Lớp 8 (S1, "Hình đồng dạng"): "Nhận biết được hình đồng dạng phối cảnh (hình vị tự)". Lớp 6: trục đối xứng and
  tâm đối xứng of a figure (recognition).
- No transformation is used as a proof tool anywhere in the programme.
- Consequence: a question may ask about a rotation that maps a regular polygon onto itself, and a correct answer then
  has to say "phép quay". Our policy prohibited the phrase "phép quay", so such a solution failed.
- Status: **applied** (single official source, but it is the curriculum itself): "phép quay" moved from prohibited to
  discouraged (warning: do not use a rotation as a proof tool). Translation, homothety (phép vị tự), inversion and
  "phép biến hình" stay prohibited.

## F2. Approximate values (≈) are used in official answers

- S1, lớp 9: "Tính được giá trị (đúng hoặc gần đúng) căn bậc hai, căn bậc ba … bằng máy tính cầm tay"; trig ratios
  "(đúng hoặc gần đúng)"; the hình trụ/nón/cầu content is explicitly practical.
- S2, Câu IV.1: "S = 2πRh ≈ 2.3,14.50.150 ⇒ S ≈ 47 100 (cm²)", "V = πR²h' ≈ 3,14.50².40 ⇒ V ≈ 314 000 (cm³)".
  Decimal comma, "." for multiplication, the unit in brackets.
- This contradicts the earlier survey (NOTATION.md: "≈ never"), which only covered chuyên papers.
- S3, Bài 5: "R ≈ 3,25 (cm)", "S_tp = 3380 (cm²) ≈ 0,34 (m²)" (the question says "làm tròn đến hàng phần trăm").
- Status: **applied** (S1 + S2 + S3): ≈ added to the symbol bar and NOTATION.md, and SOLVE_SYSTEM rule 6 allows ≈
  only for a measurement the question asks to approximate.

## F3. Probability write-up (new Grade 9 topic)

- S1, lớp 9: "Nhận biết được phép thử ngẫu nhiên và không gian mẫu. Tính được xác suất của biến cố bằng cách kiểm đếm
  số trường hợp có thể và số trường hợp thuận lợi."
- S2, Câu I.2 (0,5 đ): the points are given for "Liệt kê được 8 phần tử của không gian mẫu Ω. Khẳng định được các
  kết quả có thể xảy ra là đồng khả năng. Có 2 kết quả thuận lợi cho biến cố A là: … Xác suất của biến cố A là
  P(A) = 2/8 = 1/4."
- Required steps: list Ω, state that the outcomes are equally likely, list the favourable outcomes, P(A) = fraction.
- S3, Bài 3b: "Số các kết quả có thể xảy ra là n(Ω) = 300", "Số kết quả thuận lợi của biến cố là 75 + 99 + 81 =
  255", "Vậy xác suất của biến cố là 255/300 = 17/20".
- Status: **applied** (S1 + S2 + S3) to the combinatorics guidance.

## F4. Marking-scheme conventions (S2)

- "Chú ý: Các cách làm khác của học sinh ở mỗi câu hỏi nếu đúng vẫn được điểm tối đa."
- Word problems: "Gọi … là x (km). ĐK: x > 0" → equation → "x = 120 (TMĐK). Kết luận." Systems: "Điều kiện: x > 0;
  y > 0" … "x = 365 (TMĐK), y = 520 (TMĐK). Kết luận." Each unknown has a unit and a condition, each value is checked
  against it, and the answer is stated in words.
- Radicals: substituting a value is marked "(TMĐK)"; a required identity ends with "(ĐPCM)".
- Vi-ét is spelled "định lí Viète" (GDPT 2018 spelling) and written as a system {x₁ + x₂ = …; x₁x₂ = …} after "Vì
  phương trình có hai nghiệm x₁, x₂ nên theo định lí Viète".
- Geometry: "Lập luận được" (the step is worth points once justified); "(g.g)", "(c.g.c)"; "cùng thuộc đường tròn
  đường kính EB"; "tứ giác BDEK nội tiếp ⇒ …"; angle hats throughout.
- Extremum with an integer variable (Câu V): M = −(1/50)(x − 7)(x − 8) + 36,12; "Với x ∈ ℕ ⇒ (x − 7)(x − 8) ≥ 0 nên
  M ≤ 36,12"; the maximum and every point where it is reached ("khi x = 7 hoặc x = 8"), then "Kết luận".
- Status: see F5, which confirms these with S3.

## F5. Conventions confirmed by two official marking guides (S2 Hà Nội + S3 HCM, 2025)

- Word problems: unknown with unit and condition; every root checked: S2 "(TMĐK)", S3 "x = 52 (nhận) hoặc x = −46
  (loại)"; the answer restated in words with units: S2 "Kết luận.", S3 "Vậy chiều dài bằng 104 (mét) và chiều rộng
  bằng 52 (mét)".
- Vi-ét: the roots' existence first (S3 "Vì Δ = b² − 4ac = 17 > 0 nên phương trình có hai nghiệm phân biệt x₁, x₂";
  S2 "Vì phương trình có hai nghiệm x₁, x₂ nên theo định lí Viète"), then Vi-ét as a system (S3 "Theo hệ thức
  Vi-ét {x₁ + x₂ = −b/a = 7/2; x₁x₂ = c/a = 2}"), then the target rewritten in x₁ + x₂ and x₁x₂.
- Cyclic quadrilateral: S2 "E, D, B cùng thuộc đường tròn đường kính EB … E, D, B, K cùng thuộc một đường tròn";
  S3 "A, B, H, E cùng thuộc đường tròn đường kính AB. Vậy tứ giác ABHE nội tiếp."
- Similarity case in brackets: S2 "(g. g)", "(c. g. c)"; S3 "(g-g)", "(c-g-c)". Angle reasons: S3 "(hai góc nội tiếp
  cùng chắn cung HE)", "(cùng phụ HBO)", "(cùng bù AEH)", "(cmt)".
- Notation: angle hats, ∽, ⊥, "." for products of lengths (OH.OA, AB.AC), decimal comma; S3 also gives "Cách 1 /
  Cách 2" for one question (alternative methods are expected and accepted; S2 "Các cách làm khác … vẫn được điểm tối
  đa").
- Status: **applied**: algebra guidance (Vi-ét write-up, word-problem structure), geometry guidance (angle reasons,
  similarity case, cyclic via a common diameter circle), SOLVE_SYSTEM rule 6 (official notation, ≈ only for asked
  approximations). Four S3 questions with official answers added to the benchmark (1b, 2b, 3b, 6b).

## F6. Inequalities and extrema in chuyên keys use elementary forms (S4 + S5)

- S4, Bài 2b: "√3/12 · 3x(2 − 3x) ≤ √3/12 · ((3x + 2 − 3x)/2)² = √3/12", then "Vậy diện tích hình thang lớn nhất khi
  3x = 2 − 3x ⇒ x = 1/3 (m)". AM-GM in the form xy ≤ ((x + y)/2)², not named.
- S5, Bài 2a (0,25 đ for the lemma alone): "Ta chứng minh được: 3(a² + b² + c²) ≥ (a + b + c)² ≥ 3(ab + bc + ca)",
  then used with substitutions 1/√a etc. No Schur, SOS or named advanced inequality in either key.
- Status: **applied** to the algebra guidance (prefer elementary forms, "Ta chứng minh được", equality case as an
  equation). Policy unchanged (Schur/Jensen already discouraged).

## F7. Number theory in chuyên keys: factor, parity, cases, divisibility bounds (S4 + S5)

- S4, Bài 5a: Vi-ét on integer roots, "mn = 2(m + n) + 10 ⇒ (m − 2)(n − 2) = 14", then TH1–TH4 as systems, each
  "(nhận)". Bài 4b: "a² − 4b² ⋮ 11 ⇒ [a − 2b ⋮ 11; a + 2b ⋮ 11]" (a prime dividing a product, used silently).
- S5, Bài 4: "(n − m)(n + m + 1) = 3.2^k. Do n − m lẻ nên TH1 … TH2 …", "(l)" for a rejected case; Bài 4c: proof by
  contradiction ("Giả sử a là số chính phương … suy ra vô lí"), "m ⋮ (m² − 1 + b) ⇒ m ≥ |m² − 1 + b|".
- Neither key uses Fermat's little theorem, Euler, or congruence tables; ≡ appears in PTNK 2024 (NOTATION.md).
- Status: **applied** to the number-theory guidance.

## F8. Combinatorics and geometry write-up (S4 + S5)

- Extremal counting needs a bound and a construction drawn as a table (S5 Bài 3b: "Vậy tối đa có 4 cặp tốt. Cách tô
  với trường hợp tối đa như sau" + picture); contradiction ends "(trái giả thiết)" / "(vô lý)" (S4 Bài 5b, S5).
- Geometry: a non-textbook fact is stated and proved as a lemma (S5 Bài 5d: "Ta chứng minh bổ đề sau: …"); area
  ratios and an auxiliary parallel line are used instead of named theorems (S4 Bài 3b Cách 1 and Cách 2: no
  Menelaus/Ceva cited). "//" for parallel (S4, S5).
- Status: **applied** to the geometry guidance (bổ đề + proof; area ratios). Combinatorics guidance already required
  bound + construction.

## F9. Parabola and line, coordinates (S3 + S6)

- S6, Bài 1b: "Phương trình hoành độ giao điểm của (P) và (d) là −x² + 3x − 2 = 0 ⇒ x = 1 hoặc x = 2. Với x = 1 thì
  y = −1. Với x = 2 thì y = −4. Vậy tọa độ giao điểm của (P) và (d) là (1; −1) và (2; −4)." Points: drawing (P)
  and (d) is marked as "Lập bảng giá trị", "Vẽ (P)", "Vẽ (d)".
- S3, Bài 1b: "Tung độ của điểm bằng 18 nên 18 = x²/2 … Vậy tọa độ các điểm thỏa yêu cầu đề bài là (6;18) và
  (−6;18)". Coordinates are separated by a semicolon in both (the comma is the decimal separator).
- S6 also uses ≈ for measurements ("R ≈ 1 (dm)", "6(2R)² ≈ 24 (dm²)"), linear functions for motion
  ("f(t) = 10 + 40t"), "Cách 1 / Cách 2", and geometry reasons in brackets: "(tính chất hai tiếp tuyến cắt nhau)",
  "(bán kính)", "(đồng vị)", plus "KM là đường trung bình tam giác BCH" and AC = 2R tan(CPQ) (acute-angle trig).
- S7 (Hà Nội 2026) keeps the 2025 structure: I thống kê/xác suất, II biểu thức căn, III bài toán thực tế (phương
  trình, hệ, Viète), IV hình trụ/nón/cầu + hình phẳng, V cực trị thực tế; "Diện tích xung quanh … xấp xỉ 1884 cm²";
  2a "△HAC vuông tại A; △HDC vuông tại D. Từ đó chứng minh bốn điểm A, H, D, C cùng thuộc một đường tròn".
- Status: **applied**: algebra guidance (P)/(d) write-up; SOLVE_SYSTEM rule 6 "points with a semicolon (1; −1)".
  Three S6 questions with official answers added to the benchmark (1b, 2, 7).

## F10. More confirmations from HCM 2023 (S8)

- (P)/(d): "Phương trình hoành độ giao điểm của (P) và (d) là x²/2 − x − 4 = 0 ⇔ x = −2 hoặc x = 4. Với x = −2 thì
  y = 2 … Vậy tọa độ giao điểm của (P) và (d) là: (−2;2) và (4;8)." Third official instance of F9.
- Vi-ét as two lines "x₁ + x₂ = −b/a = 13/2", "x₁x₂ = c/a = −3", then A rewritten, as in S3 and S6.
- Collinearity by supplementary adjacent angles: S8 "MLE + ALE = 180°. Vậy A, L, M thẳng hàng"; S4 "DKN + AKN =
  180°. Vậy ba điểm A, K, D thẳng hàng". **Applied** to the geometry guidance.
- Reasons in brackets: "(góc nội tiếp chắn nửa đường tròn)", "(cùng phụ HAC)", "(cùng chắn cung AP)", "(tứ giác AEHF
  nội tiếp)"; "Xét tam giác AHB vuông tại H có đường cao HE: AH² = AE.AB" (hệ thức lượng).
- Arc measure written "½ sđ AB" (S8 only so far; not applied).
- Vi-ét with a parameter m: HCM papers 2023–2025 have none; only S2 (Hà Nội 2025) does. Still one source; the
  existing guidance (conditions on m before Vi-ét) is kept as is.
- Two S8 questions with official answers added to the benchmark (1b, 2).

## F11. What loses points, and symmetric answers (S9 Quảng Nam chuyên)

- Unproved claims lose points: "Nếu thí sinh chỉ nêu kết quả DBK = BAK mà không chứng minh thì trừ 0,125đ" (twice, for
  two angle equalities). Agrees with S2's "Lập luận được …" and every reason-in-brackets in S3–S8. Already enforced
  by the geometry guidance (each angle equality states its reason).
- Guessing earns almost nothing: "Nếu thí sinh không giải mà lấy các cặp số nguyên thử đúng thì đúng đủ 4 cặp được
  0,125 điểm" (of 1,0). Supports the existing `guessing` style rule and the number-theory guidance.
- Not every omission is penalised: chuyên Tin, "Nếu học sinh không nêu ĐKXĐ thì điểm phần này vẫn được 0,25". We keep
  asking for ĐKXĐ (S2, S3 always state it), but it is not a correctness failure.
- Integer equation x² = y² + 140: symmetry first ("Nếu cặp số nguyên (a;b) thỏa mãn PT (1) thì các cặp số (−a;b),
  (a;−b), (−a;−b) cũng thỏa mãn … Sau đây ta tìm các cặp số nguyên dương"), "x và y cùng tính chẵn, lẻ", (x − y)(x + y)
  = 140, "Trường hợp 1/2" with x = 2k, y = 2m, divisors as systems, (nhận)/(loại), then "Vậy có 8 cặp số nguyên (x; y)
  thỏa mãn PT (1) là: (36;34), (−36;34), …" — every pair written out. Third source for F7 (with S4, S5). **Applied**:
  number-theory guidance (symmetry reduction, list every solution, no ± in the final answer).
- Inequality: substitution a = 1/x, "≥ ∛(…) (BĐT AM-GM)" (named), an alternative elementary proof "a(3 − a²) = −(a +
  2)(a − 1)² + 2 ≤ 2", "Tương tự, ta có … (2) và … (3)", "Cộng vế theo vế các BĐT (1), (2) và (3)", "P = 3/2 khi a = b
  = c = 1 hay x = y = z = 1. Vậy giá trị nhỏ nhất của P là 3/2." With S2 (Câu V) and S4 (Bài 2b) for the extremum
  ending. **Applied**: algebra guidance ("Tương tự", "Cộng vế theo vế", "Vậy giá trị nhỏ nhất của P là …").
- "Ghi chú: Nếu thí sinh có cách giải khác đúng thì Tổ chấm thảo luận và thống nhất thang điểm".
- Two S9 questions with official answers added to the benchmark (6, 7).

## Spot check (2026-11-03 10:20, live, SGD 0.030)

`scripts/solve_probe.py` on HCM 2024 Bài 1b and Bài 2 after the guidance changes: both VERIFIED and COMPLIANT. The
write-ups follow F5/F9: "Phương trình hoành độ giao điểm của (P) và (d) là …", "Với x = 1, ta có y = −1", "Vậy tọa độ
giao điểm của (P) và (d) là (1; −1) và (2; −4)"; "Δ = 40 > 0, nên phương trình có hai nghiệm phân biệt x₁, x₂. Theo định
lí Vi-ét, ta có x₁ + x₂ = −b/a = 4/3 và x₁x₂ = c/a = −2/3", then A = (x₁ + x₂)(x₁x₂ + 2) = 16/9.

## F12. Hải Phòng chuyên 2025 (S10): general marking rules, Fermat in a reserve paper

- General rules printed under both HDCs ("Chú ý"): another correct method gets full marks; "Thí sinh làm đúng đến đâu
  cho điểm đến đó"; "Trong một câu, nếu thí sinh làm phần trên sai, dưới đúng thì không chấm điểm" (credit stops at the
  first error); "Bài hình học, thí sinh vẽ hình sai ở câu nào thì không chấm điểm câu đó … không vẽ hình ở câu nào thì
  cho nửa số điểm của phần làm đúng trong câu đó"; "nếu thí sinh công nhận ý trên để làm ý dưới mà thí sinh làm đúng
  thì chấm điểm ý đó"; the total is not rounded.
- Status: recorded. Only "another correct method gets full marks" is confirmed elsewhere (S2, S9). The figure rule,
  credit stopping at the first error and "công nhận ý trên" wait for a second official source. They support the
  tutor's first-error feedback and suggest asking students to draw the figure.
- Đề dự bị, Bài 5a (remainder of a product mod 107): "Theo định lý Fermat nhỏ thì a¹⁰⁶ ≡ b¹⁰⁶ ≡ 1 (mod 107)" and
  "106! ≡ −1 (mod 107) (theo định lý Wilson)". This is the first official key seen using Fermat's little theorem
  (and Wilson's), in a reserve chuyên paper. It does not change the policy (fermat_little stays a warning, not a
  failure); a second official use would justify softening the warning text.
- Đề chính thức: probability "n(Ω) = 36²", "n(A) = 15² + 21²", "P(A) = 37/72"; word problem "Gọi x (km/giờ) … x > 2",
  "x₁ = 20 (chọn); x₂ = 13/9 (loại)", "Vậy …"; radical equation "ĐKXĐ: x ≥ −1", factor, "vì x + √(x + 1) + 3 > 0 với
  mọi x ≥ −1", "√(x + 1) = 2 − x ⇔ {x ≤ 2; x + 1 = 4 − 4x + x²}". AM-GM named "bất đẳng thức AM-GM cho hai số thực
  dương" (also S9). All consistent with F3, F5, F6.
- Two S10 questions with official answers added to the benchmark (1a, 2a).

## F13. Figure rule confirmed; more confirmations (S11 Phú Yên, S12 An Giang)

- S11 "Hướng dẫn chung": "Các bài toán hình học, nếu không vẽ hình hoặc vẽ hình sai thì không chấm điểm." With S10
  (Hải Phòng: wrong figure → 0 for that part, no figure → half). **Applied** to the tutor prompt (rule 6): remind the
  student to draw the figure on paper; also that unproved claims lose points (S9, S2) and guessed answers earn almost
  nothing (S9). "Credit stops at the first error" is still S10 only, not applied.
- S11, S12 and S2 all say a different correct method gets full marks; S12 "Điểm tổng toàn bài giữ nguyên đến 0,25
  điểm, không làm tròn" (as S10, S11). S11 accepts equivalent forms: "Có thể thí sinh tính ra kết quả tương đương:
  A = 17 + 12√2".
- S11 geometry: collinearity "GFD + EFD = 180° hay G, F, E thẳng hàng" (third source, with S4, S8); "B, G, F, I, D cùng
  nằm trên đường tròn đường kính BI hay BGFD là tứ giác nội tiếp" (third source for F5's cyclic pattern); reasons
  "(gt)", "(tính chất tiếp tuyến)", "(cmt)", "suy ra đpcm", "Tương tự". It also spends 0,25 đ proving a configuration
  fact ("tia BF nằm giữa hai tia BE và BG") — the opposite of our guidance; one source, not applied.
- S11 number theory (sum of n consecutive integers = 2024): "n(2k + n + 1) = 2⁴.11.23", "Do n, n + 1 có tính chẵn lẻ
  khác nhau nên n và 2k + n + 1 có tính chẵn lẻ khác nhau", cases i)–iii) as systems, every answer listed: fourth
  source for F7.
- S11 statement uses "∀x, y ∈ ℝ" (problem text only; solutions never use ∀ or ℝ). S12 has "Cách khác" in geometry.
- Two S11 questions with official answers added to the benchmark (1a, 1b).

## F14. The curriculum checker run on official solutions (2026-11-03)

`check_curriculum` (policy v1.2) over the text layers of S3, S4, S6, S9, S10, S12 (all topics enabled):

| Source | Status | Findings |
| --- | --- | --- |
| S3 HCM 2025 đại trà, S4 HCM 2025 chuyên, S6 HCM 2024, S12 An Giang 2024 | COMPLIANT | — |
| S10 Hải Phòng 2025 | COMPLIANT_WITH_WARNINGS | `fermat_little` (đề dự bị, see F12); `self_talk` on the marking note "phần trên sai, dưới đúng" (instructions to markers, not solution text) |
| S9 Quảng Nam 2025 | COMPLIANT_WITH_WARNINGS | `self_talk` on **"Thử lại vào phương trình (1), ta được x = 25/11 là nghiệm duy nhất"** (chuyên Tin, after a non-equivalent transformation) |

No prohibited rule fired on any official key. The Quảng Nam hit is a false positive: "thử lại" there means substituting
candidate roots back, a legitimate step, while the pattern was meant for "let me try again". Quảng Ninh's official
guides (Sở website, 2012–2013) write "(thỏa mãn)" instead. **Applied** (policy v1.3): `thử lại` now only matches retry
phrasing ("tôi/mình/hãy/để thử lại", "thử lại cách/lần/từ đầu"); a test keeps the Quảng Nam sentence clean.

## F15. Systems of equations (S5 + S10)

- S10, Câu 2b: "Điều kiện xác định: {y ≤ 4; x − y ≥ 0}", "(1) ⇔ (x − y + 2)(x + y − 1) = 0 ⇔ [x − y = −2 < 0 (KTM);
  y = 1 − x]", "Thay vào (2): … ⇔ (2x − √(x + 3))² + (√(2x − 1) − 1)² = 0 ⇔ {2x = √(x + 3); √(2x − 1) = 1} ⇔ x = 1.
  Với x = 1 ⇒ y = 0. Vậy hệ có nghiệm (x; y) = (1; 0)."
- S5, Bài 1: "Biến đổi hpt về dạng: {(4x + 1/x) + (4y + 1/y) = 1; (4x + 1/x)(4y + 1/y) = −20}. Suy ra … hoặc …. Vậy hệ có
  nghiệm (x, y) = (1, −1/2); …" (every pair listed).
- Pattern: transform one equation (factor, or sums/products), cases with the invalid one marked, substitute, a sum of
  squares = 0 gives each square = 0, list every pair. **Applied** to the algebra guidance. S10 also writes "(KTM)" for
  "không thỏa mãn" and, once, "EF ∥ DP" — the first ∥ in an official key (NOTATION.md updated; // stays the house
  style, used by PTNK 2024, HCM 2023–2025 and Phú Yên 2024).
- S10 Câu 2b added to the benchmark.

## F16. Named geometry theorems in official keys (all of S2–S12)

- No official key read so far (Hà Nội 2025/2026, HCM 2023–2025 đại trà and 2025 chuyên, PTNK 2023, Quảng Nam, Hải
  Phòng, Phú Yên, An Giang) cites Menelaus, Ceva, Ptolemy, Simson, Euler's line or "phương tích" by name (text search
  of the text layers plus reading every geometry page image).
- Products of lengths are derived from similar triangles: S2 "ΔAEB ∽ ΔACS (g.g) ⇒ AE/AC = AB/AS. Vì vậy AB.AC =
  AE.AS"; S3 "ΔOHB ∽ ΔOBA (g-g) suy ra OH/OB = OB/OA, dẫn đến OB² = OH.OA"; S8 "Chứng minh được tam giác APE đồng dạng
  tam giác ABP ⇒ AP² = AE.AB" and "AH² = AE.AB" (hệ thức lượng). Exception, chuyên: S10 "HEDF nội tiếp suy ra MH.MD =
  MF.ME = ME²" (the power-of-a-point fact used directly, unnamed).
- Ratio statements are proved with area ratios or an auxiliary parallel (S4 Bài 3b Cách 1/2); configuration lemmas
  are proved inline (S5, S10 đề dự bị "bổ đề").
- **Applied** to the geometry guidance (products via similar triangles; prefer them or area ratios to named
  theorems; prove such a fact as a bổ đề). Policy unchanged: ceva_menelaus, ptolemy and power_of_point stay allowed
  (teachers' solutions use them; absence from official keys is a style preference, not a penalty).

## Spot check 2 (2026-11-03 10:50, live, SGD 0.032)

Quảng Nam 2025 Câu 6 (x² = y² + 140), after F7/F11: PARTIALLY_VERIFIED (exhaustive search in [−60, 60] agrees),
COMPLIANT. The write-up follows the official pattern: (x − y)(x + y) = 140, same parity, a = 2m, b = 2n, mn = 35,
TH1–TH8 each "(nhận)", then "Vậy có 8 cặp số nguyên (x; y) thỏa mãn: (36; 34), (12; 2), …" with all eight pairs written
out — matching the official answer. Hint prompt now also asks for the official notation (\widehat, ⋮, //).

## F17. Đại trà marking guides 2025 (S13 Quảng Ninh, S14 Thanh Hóa, S15 Quảng Nam)

Sweep of 30 provinces × 2 years of đại trà papers: most files are toanmath/centre solutions; S13–S15 carry the Sở's
own guide (several others, e.g. Phú Thọ, Vĩnh Phúc, are scans not yet read).

- Figure rule, third official source: S14 "Không vẽ hình, hoặc vẽ hình sai cơ bản thì không chấm" (with S10, S11).
- Using an unproved earlier part: S14 "Học sinh không chứng minh mà thừa nhận kết quả của ý trên để giải ý dưới thì
  không chấm điểm ý dưới" — the opposite of S10 ("công nhận ý trên … thì chấm điểm ý đó"). Provinces disagree; not
  applied. The solver proves every part anyway.
- Results of routine steps may be stated: S13 "Trong bước giải phương trình, nếu chỉ đưa ra kết quả đúng vẫn chấm điểm
  tối đa ý đó"; S2 "Giải phương trình tìm được x = 120 (TMĐK)", "Giải hệ phương trình ta được x = 365 (TMĐK), y = 520
  (TMĐK)"; S1 "Tính được nghiệm … bằng máy tính cầm tay". **Applied** to the algebra guidance (inside a word problem,
  solve the routine equation/system in one line; full working only when solving it is the question).
- Partial credit for bare answers: S13 "Nếu chỉ ghi kết quả (x; y) = (1; 2) thì được 0,5 điểm" (of 0,75); leniency
  on conditions: "Thí sinh đặt điều kiện x > 0 vẫn chấm tối đa"; S15 "Nếu học sinh xác định 3 điểm để vẽ 1 nhánh, lấy
  đối xứng qua trục tung được nhánh còn lại vẫn cho điểm tối đa". Alternative methods accepted (S13, S14, S15).
- Vi-ét with a parameter m: "tham số" appears in none of the 2025 đại trà guides read (only one centre solution, Tiền
  Giang). Since the GDPT 2018 papers (2025), parameter questions have mostly gone; Vi-ét is used to evaluate symmetric
  expressions (S3, S6, S8, S13 "Vậy a, b là hai nghiệm của phương trình x² − 20x + 87 = 0"). The existing guidance is
  kept for older-style questions.

## Iteration 14 notes (2026-11-03 11:00)

- The scanned Phú Thọ and Vĩnh Phúc 2025 files are not official (a chuyên class's "Lời giải"; a THCS teachers' group's
  "HD giải … (tham khảo)"); the first-error rule stays single-source (S10).
- Three more S10 items with official answers added to the benchmark (chính thức 5b: 10; dự bị 5a: 7; dự bị 5b: 2025).
  5b (chính thức) and dự bị 5a were re-checked by exhaustive computation.
- User request (mid-loop): auxiliary points must carry letter names (M, A', A1), never midAB/H_A. Applied: the
  formalize prompt names unnamed points with letters; `name_points` renames any remaining descriptive point id in the
  figure (projection of A → A', else the next free letter), consistently in objects, givens and goals; the solver's
  geometry guidance asks for "Gọi M là trung điểm của BC". On the live (O) problem: midDB → M, midDC → N, H_A → A',
  H_D → D', M_IR → Q.

## F18. Out-of-programme knowledge must be proved; unproved earlier parts (S13 + S9 + S14)

- S13 "Hướng dẫn chung", rule 4: "Nếu ý nào sử dụng kiến thức ngoài chương trình phổ thông hiện hành và quy định mà
  không chứng minh trừ 0,25 điểm ý đó. Nếu sử dụng kết quả ý trước mà chưa chứng minh được để giải ý sau, thì không cho
  điểm ý sau."
- Out-of-programme results are therefore penalised only when unproved; S9 penalises any unproved claim ("trừ 0,125đ"),
  and S5/S10 state and prove their lemmas. **Applied**: SOLVE_SYSTEM rule 1 ("A theorem outside the Grade 9 programme
  loses marks if used without proof: avoid it, or state it as a bổ đề and prove it. Never rely on an earlier part you
  have not proved") and the warning text of fermat_little, euler_theorem, chinese_remainder and schur_jensen (policy
  v1.4).
- Unproved earlier part → no marks for the later part: S13 and S14 agree; S10 (Hải Phòng) is the exception. Covered by
  the new SOLVE_SYSTEM sentence.
- Context (secondary reports of Thông tư 30/2024/TT-BGDĐT, effective 14/02/2025): entrance-exam content lies in the
  THCS programme, "chủ yếu là lớp 9"; each chuyên paper follows the THCS programme while selecting talent. Not read
  from the official text.
- Three S13 questions with official answers added to the benchmark (II.2, II.5, II.7). II.7 re-derived: 220 − m =
  9·13 + 10y with 1 ≤ m ≤ 10 gives y = 10, m = 3.

## F19. Vi-ét with a parameter: second official source (S14 Thanh Hóa + S2 Hà Nội)

- S14, Câu 11: "Ta có Δ' = 1 + m ⇒ Để pt có hai nghiệm x₁; x₂ thì Δ > 0 ⇔ 1 + m > 0 ⇔ m > −1. Theo hệ thức Viète ta
  có: {x₁ + x₂ = 2 (1); x₁.x₂ = −m (2)}", then "(x₁ − x₂)(x₁ + x₂) = 4m + 4 (3) … Với m > −1, bình phương hai vế …
  4m(m + 1) = 0. Suy ra m = 0 (thỏa mãn), m = −1 (loại). Vậy m = 0 thỏa mãn điều kiện bài toán."
- S2, Câu III.3: "Vì phương trình có hai nghiệm x₁, x₂ nên theo định lí Viète {…} … kết hợp định lí Viète ta tìm được
  m = 1. Kết luận."
- Pattern: condition on m from Δ first, Vi-ét system, the relation rewritten in sum/product, each value of m compared
  with the condition. **Applied**: the algebra guidance's parameter line now spells this out (replacing the one-line
  rule). This corrects F17's "parameter questions have mostly gone": they are rarer but still set (Thanh Hóa 2025).
- S14 also: word problem with "x, y ∈ ℕ*", "(tmđk)"; "V = 4/3 π.0,15³ = 9π/2000 ≈ 0,01 (dm³)"; "Vậy cốc nước có
  0,24 lít nước". Two S14 questions added to the benchmark (11, 12).

## Spot check 3 (2026-11-03 11:10, live, SGD 0.024)

Quảng Nam 2025 Câu 7 (min P = 3/2): right final answer and equality case ("Vậy giá trị nhỏ nhất của P là 3/2, đạt được
khi x = y = z = 1"), substitution a = 1/x² as in S9, Bunhiacopxki (Engel form) instead of the key's AM-GM. But the key
step is hand-waved and contains self-corrections the checker missed: "…? Không, ta dùng đánh giá trực tiếp", "…? Không
cần phức tạp". Status UNVERIFIED (the formalization of P could not be evaluated), curriculum COMPLIANT — a gap.
**Applied** (policy v1.5): `self_talk` also matches "? Không / ? Sai", "không cần phức tạp", "ta dùng đánh giá/cách
trực tiếp/khác"; tests use the live sentences. Re-running the checker on the nine official keys with text layers (S3,
S4, S6, S9, S10, S12, S13, S14, S15): all COMPLIANT except S10's two known warnings (Fermat in the đề dự bị; a marker
note).

## F20. PTNK 2024 (S16): Dirichlet, induction, congruences, symmetry about a line

- Combinatorics, Bài 5b: "theo nguyên lý Dirichlet sẽ tồn tại một hộp chứa ít nhất 2 thẻ trong 3 thẻ trên nên tổng 2
  thẻ đó là số chính phương … (mâu thuẫn)"; Bài 5a: bound by a chain "a₁₇ ≥ a₁₆ + 1 ≥ … ≥ a₂ + 15", "Suy ra a₁ > 15.15
  = 225 ⇒ a₁ ≥ 226". Consistent with the combinatorics guidance (name pigeons and holes; bound + construction).
- Number theory, Bài 3: "Bằng quy nạp, ta suy ra aₙ ≡ (−1)^{n/2} a₀ (mod 4)", "Bằng chứng minh quy nạp, ta suy ra aₙ₊₈ ≡
  aₙ (mod 7)" after listing a₀ … a₁₀ mod 7. Residue lists are used when the problem needs a period (the guidance
  allows residues "only when no shorter standard argument exists", which holds here).
- Geometry, Bài 4d: "L đối xứng với H qua BD, mà K và F cũng đối xứng qua BD. Nên (BHKD) và (O) đối xứng qua BD … Do
  tính đối xứng qua BD nên OKFT là hình thang cân" — symmetry about a line as an argument, phrased without "phép".
  The policy only prohibits the phrase "phép đối xứng", so this passes; noted for future policy work. Also "(g − c −
  g)", "(đpcm)", "T ≡ T'" for coinciding points (S16 only).
- No pipeline change. PTNK 2025's key still cannot be downloaded (Drive returns an HTML page).

## Iteration 19 notes (2026-11-03 11:20)

- No second official source found for "credit stops at the first error" (web search for the wording returned nothing);
  it stays S10-only and unapplied.
- S12 (An Giang 2024 chuyên), Câu 5 — third official source for F19: "Phương trình 2x² + mx + 2 = 0 có nghiệm khi
  Δ = m² − 16 ≥ 0 ⇒ m ≤ −4 hoặc m ≥ 4. Tổng các nghiệm … S = x₁ + x₂ = −m/2 … ⇒ m = −6 thỏa điều kiện m ≤ −4. Vậy m =
  −6 thì phương trình đã cho có tổng các nghiệm bằng 3." Also: "Phương trình x² + 5x + 15 = 0 vô nghiệm" (the other
  factor checked explicitly).
- Three S12 questions with official answers added to the benchmark (1, 5, 6); 6 re-derived (M is the midpoint of AB,
  CM = AB/2 = 4).

## Iteration 21–22 notes (2026-11-03 11:25)

- 2023–2024 chuyên sweep: official guides found for Đồng Nai 2024, Hải Dương 2023, Hải Phòng 2023, Phú Yên 2023, An
  Giang 2023. Hải Phòng 2023 repeats S10's rules word for word (incl. "phần trên sai, dưới đúng thì không chấm điểm",
  and the half-marks-without-figure rule) — the same Sở, so not an independent second source. The others only state
  "cách khác đúng vẫn cho điểm tối đa" and "không làm tròn".
- Hải Dương 2023 Câu 3.1: residues mod 3 in an official key ("Với p > 3 thì p² ≡ 1 (mod 3) … A ≡ 2 (mod 3). Do các số
  chính phương chia cho 3 chỉ dư 0 hoặc 1 nên A không là số chính phương"); 3.2 factorisation "(2x + y + 1)(3x + 2y −
  1) = 1" then cases. With S16 (PTNK 2024), residue arguments mod a small number are standard in official keys; the
  number-theory guidance already allows them when no shorter argument exists.
- Benchmark: An Giang 2023 (1, 3, 5) and Hải Dương 2023 (3.1, 3.2) with official answers, each re-derived.

## F21. Credit stops at the first error: second official source (S17 Quảng Bình 2022 + S10 Hải Phòng)

- S17 "Yêu cầu chung": "Trong mỗi câu, nếu học sinh giải sai ở bước giải trước thì cho điểm 0 đối với những bước sau
  có liên quan"; also "yêu cầu phải lập luận logic chặt chẽ, đầy đủ, chi tiết rõ ràng" and the figure rule ("học sinh
  không vẽ hình thì cho điểm 0 … nếu vẽ sai ở ý nào thì điểm 0 ở ý đó" — fourth source after S10, S11, S14).
- S10 (2025, and its 2023 guide): "Trong một câu, nếu thí sinh làm phần trên sai, dưới đúng thì không chấm điểm."
- **Applied** to the tutor prompt: a later step that builds on an incorrect one is marked "unclear" (not "correct")
  with a note; the marking-habits list adds "steps after the first error earn nothing, so fix that step first".
- Found by a throttled re-sweep (6 parallel requests; an unthrottled burst of ~120 got the site's home page back).
