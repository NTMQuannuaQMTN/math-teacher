# Curriculum knowledge base (Toán chuyên vào lớp 10)

The agreed knowledge base A–E is the **hard boundary** for the methods a solution may use. Source of truth in code:
[shared/src/knowledgeBase.ts](../shared/src/knowledgeBase.ts). It is used in three places:

| Where | What it does |
|---|---|
| Prompt ([worker/src/solver/prompts.ts](../worker/src/solver/prompts.ts), `curriculumRules`) | Lists the regular Grade 9 topics, then **only the knowledge-base topics of the problem's domains**, the cross-cutting skills, the technique ids and the "never use" list. |
| Schema (`analysis.techniques`) | The model declares the technique ids it used; ids not in the knowledge base are dropped by the verifier. |
| Verifier ([shared/src/gradeLevel.ts](../shared/src/gradeLevel.ts)) | Scans every student-facing text for methods outside the boundary (sends the lesson back for a retry) and notes advanced or less common methods (advisory, no retry). |

## A. Algebra

| Id | Topic | Contents |
|---|---|---|
| A1 | Biểu thức đại số | hằng đẳng thức, phân tích nhân tử, phân thức, biểu thức chứa căn, rút gọn, biểu thức đối xứng |
| A2 | Phương trình và hệ phương trình | bậc nhất, bậc hai, bậc cao, chứa căn, chứa ẩn ở mẫu, hệ bậc nhất, hệ không mẫu mực, có tham số, nghiệm nguyên |
| A3 | Hàm số bậc hai và đa thức | đồ thị, đồng nhất thức, nghiệm và hệ số, Viète, chia hết đa thức |
| A4 | Bất đẳng thức | biến đổi tương đương, Cô-si (AM-GM), Bunhiacopxki (Cauchy–Schwarz) dạng sơ cấp, so sánh, có căn, có tham số |
| A5 | Cực trị | GTLN/GTNN, hoàn thành bình phương, đặt ẩn phụ, điều kiện dấu bằng, cực trị có điều kiện |

## B. Geometry

| Id | Topic | Contents |
|---|---|---|
| B1 | Hình học phẳng cơ bản | góc, song song/vuông góc, tam giác bằng nhau, đồng dạng, Pythagore, điểm đặc biệt, dựng hình |
| B2 | Đường tròn | góc ở tâm/nội tiếp, dây và cung, tiếp tuyến/cát tuyến, tứ giác nội tiếp, **phương tích**, **trục đẳng phương**, dây chung |
| B3 | Chứng minh hình học | thẳng hàng, đồng quy, vuông góc, bằng nhau, nội tiếp, đường phụ, kết hợp đồng dạng và đường tròn |
| B4 | Hệ thức lượng và tỉ số | độ dài, diện tích và tỉ số diện tích, tỉ số đoạn thẳng, tỉ số lượng giác của góc nhọn, bất đẳng thức hình học |
| B5 | Cấu hình nâng cao (**chỉ khi phù hợp**) | trực tâm, đường tròn nội tiếp/bàng tiếp, **Simson**, **Ceva, Menelaus**, **vị tự**, **đồng dạng xoắn**, quỹ tích |

## C. Number theory

| Id | Topic | Contents |
|---|---|---|
| C1 | Chia hết và số nguyên tố | tính chất chia hết, số nguyên tố, phân tích thừa số, ƯCLN/BCNN, Euclid |
| C2 | Số dư và đồng dư | chẵn lẻ, số dư, **đồng dư**, lũy thừa theo môđun |
| C3 | Phương trình nghiệm nguyên | Diophantine, chặn ẩn, phân tích nhân tử, bộ ba Pythagore |
| C4 | Tính chất đặc biệt | số chính phương, số ước, dãy và quy luật, số mũ của thừa số nguyên tố |

## D. Combinatorics and logic

| Id | Topic | Contents |
|---|---|---|
| D1 | Đếm | quy tắc cộng/nhân, hoán vị, tổ hợp, đếm phần bù, **bao hàm – loại trừ** |
| D2 | Lập luận tổ hợp | **Dirichlet**, cực hạn, **bất biến**, đơn biến, chẵn lẻ, đếm hai cách |
| D3 | Xác suất, rời rạc | xác suất cổ điển, đếm có điều kiện |
| D4 | Logic và chứng minh | trực tiếp, phản chứng, **quy nạp**, xét trường hợp, cần và đủ, xây dựng |

## E. Cross-cutting skills

Biến đổi đại số, lập luận logic, xét trường hợp, phản chứng, đặt ẩn phụ, đánh giá (chặn), tìm quy luật,
dựng đối tượng phụ, trình bày toán học, lý giải mọi suy luận quan trọng.

## Outside the boundary (never used; the lesson is sent back)

- calculus (derivatives, integrals, limits);
- vectors, matrices, complex numbers, logarithms, university algebra;
- coordinates as a shortcut for a synthetic geometry problem that doesn't mention coordinates;
- the laws of sines and cosines for non-right triangles;
- inversion, pole/polar, harmonic division, cross-ratio, antiparallel lines, nine-point circle, Euler line;
- Jensen, Schur, Hölder, Minkowski;
- the Chinese remainder theorem.

**Advisory (allowed, noted for review):** Ceva, Menelaus, Simson, homothety, spiral similarity, radical axis
(the B5/B2 "only when appropriate" tools), Chebyshev's sum inequality, Fermat/Euler/Wilson theorems.
Induction (D4) is allowed without a note.

## Technique ids

`factorization`, `substitution`, `subtract_equations`, `vieta`, `discriminant`, `domain_conditions`,
`complete_square`, `am_gm`, `cauchy_schwarz`, `equality_case`, `monotonicity`, `angle_chasing`,
`congruent_triangles`, `similar_triangles`, `cyclic_quadrilateral`, `inscribed_angle`, `power_of_point`,
`pythagoras`, `thales`, `area_ratio`, `auxiliary_construction`, `radical_axis`*, `ceva_menelaus`*, `simson`*,
`homothety`*, `spiral_similarity`*, `divisibility`, `remainders`, `parity`, `gcd`, `bounding`,
`perfect_squares`, `counting`, `pigeonhole`, `extremal`, `invariant`, `double_counting`, `construction`,
`contradiction`, `induction`, `case_analysis`, `necessary_sufficient` (* = advanced).

## Domain scoping

`problemDomains(text)` matches cue words (tam giác, đường tròn → geometry; chia hết, số nguyên tố, số dư →
number theory; có bao nhiêu, bảng, tô màu, Dirichlet → combinatorics). Algebra is always included. Only the
topics of the detected domains go into the prompt; the "never use" list always does. A missed cue only shortens
the topic list — the regular Grade 9 list and the outside list are always present, and the verifier's scan
does not depend on the domain.

## Limits (honest)

- The boundary check is a text scan (regular expressions over the lesson's prose and formulas). It catches
  named methods ("Jensen", "nghịch đảo", "đạo hàm") but not an unnamed advanced argument.
- `analysis.techniques` is self-reported by the model; the verifier only checks the ids exist.
- Whether an advanced B5 tool was "appropriate" is not decided automatically; it is surfaced as an advisory note.
