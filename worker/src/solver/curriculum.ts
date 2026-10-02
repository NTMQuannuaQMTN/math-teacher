/**
 * Teaching-level configuration. The solver prompt is generated from this,
 * so changing the target level (or adding another curriculum later) is a
 * data change, not a prompt rewrite.
 */
export interface Curriculum {
  id: string;
  gradeLevel: number;
  description: string;
  /** Methods and results the student is expected to know. Prefer these. */
  allowed: string[];
  /** Methods that must not appear in a solution for this level. */
  forbidden: string[];
  /** How to choose between several valid methods. */
  preferences: string[];
  /** The method a teacher at this level expects, per kind of problem (method-selection policy). */
  methods: string[];
}

/**
 * Vietnamese Grade 9, aligned with the 13 topics of the Grade 10 entrance exam review
 * ("13 chuyên đề ôn thi tuyển sinh vào lớp 10 môn Toán", toanmath.com, 2025):
 *  1 hệ phương trình bậc nhất hai ẩn, lập hệ phương trình · 2 phương trình bậc hai, Vi-ét ·
 *  3 Vi-ét với biểu thức không đối xứng · 4 giải bài toán bằng cách lập phương trình ·
 *  5 hàm số y = ax², tương giao · 6 rút gọn biểu thức · 7 hệ thức lượng, tỉ số lượng giác ·
 *  8 thống kê · 9 xác suất · 10 nón – trụ – cầu · 11 hình học tổng hợp (đường tròn) ·
 *  12 bất đẳng thức, cực trị · 13 bài toán thực tế có cực trị.
 * Every entrance-exam problem is inside this boundary.
 */
export const VN_GRADE_9: Curriculum = {
  id: "vn-grade9-v2",
  gradeLevel: 9,
  description: "Vietnamese lower-secondary mathematics (THCS), student in Grade 9 (lớp 9) preparing for the Grade 10 entrance exam (thi tuyển sinh vào lớp 10)",
  allowed: [
    "Arithmetic, fractions, decimals, percentages, ratios",
    "Algebraic expressions, expanding, the seven memorable identities (hằng đẳng thức), factorisation",
    "Rational and radical expressions: simplifying with conditions of definition (điều kiện xác định), rationalising, and the related questions (value at a point, find x for a given value, integer values, comparisons)",
    "Square roots and cube roots",
    "Linear equations, equations reducible to linear or quadratic (with a variable in the denominator, simple radical equations, biquadratic by substitution)",
    "Linear inequalities in one variable",
    "Systems of two linear equations in two unknowns: substitution and elimination; systems with a parameter",
    "Quadratic equations: factorising, discriminant Δ and Δ', Vi-ét's formulas, including non-symmetric expressions of the roots (use x1 + x2, x1·x2 together with the equation itself, e.g. x1² = −b·x1/a − c/a)",
    "Functions y = ax + b and y = ax²: graphs, and intersections of a parabola with a line (tương giao) via the quadratic equation and Vi-ét",
    "Word problems solved by setting up an equation or a system, including real-life problems (motion, work, percentages, geometry measurements)",
    "Angles, triangles (angle sum, congruence c.c.c / c.g.c / g.c.g, isosceles, special lines), Pythagoras, quadrilaterals",
    "Thales' theorem, similar triangles, angle-bisector theorem",
    "Right-triangle relations (hệ thức lượng) and trigonometric ratios of acute angles (sin, cos, tan, cot), solving right triangles, practical heights and distances",
    "Circles: chords, tangents and their properties, inscribed and central angles, tangent–chord angle, cyclic quadrilaterals (tứ giác nội tiếp), arc length, sector and annulus areas; the common configurations of entrance-exam geometry",
    "Solids: cylinder (hình trụ), cone (hình nón), sphere (hình cầu) — surface area and volume, and composite solids",
    "Statistics: frequency and relative-frequency tables, grouped data, bar/pie/line charts, reading and interpreting data",
    "Probability: sample space of a simple experiment, classical probability as favourable / possible outcomes",
    "Inequalities and extremum problems: (a − b)² ≥ 0 and completing the square, Cô-si (AM–GM) for two or three non-negative numbers, Bunhiacopxki (Cauchy–Schwarz) in its usual school forms, choosing the equality case; real-life optimisation problems",
  ],
  forbidden: [
    "Calculus (derivatives, integrals, limits)",
    "Vectors and dot products as a solving method",
    "Coordinates as a shortcut for a synthetic geometry problem that doesn't mention coordinates",
    "The law of sines / law of cosines for non-right triangles",
    "Complex numbers, matrices, linear algebra, logarithms",
    "Olympiad-only inequalities (Jensen, Schur, Hölder, Minkowski)",
    "Geometry tools outside the knowledge base: inversion, pole/polar, harmonic division, cross-ratio, antiparallel lines (đối song), nine-point circle, Euler line — prove with similar triangles, congruent triangles and angle chasing instead",
    "The Chinese remainder theorem (combine remainder conditions by hand)",
    "University-level theorems or notation",
  ],
  preferences: [
    "Direct elementary reasoning over clever tricks",
    "Standard school theorems, named the way a Vietnamese Grade 9 textbook names them",
    "The shortest method a strong Grade 9 teacher would expect a student to find",
    "Show every algebraic transformation a student would need to write, but no trivial filler steps",
    "Never mention an advanced alternative (\"or by derivatives\", \"or with vectors\") — it confuses the student",
    "School notation and names only: write \"và\", \"hoặc\", \"với mọi\" instead of logic symbols (∧, ∨, ∀, ∃); call objects by their Vietnamese school names (\"ma phương 3 × 3\", \"bảng ở câu a\"), never foreign names (Lo Shu, …)",
  ],
  methods: [
    "Equation / inequality in one variable: expand, collect, isolate; state the condition of definition first when there are denominators or roots; check the solutions against it",
    "Quadratic equation: factorise when a factor is visible, otherwise Δ (or Δ' for an even b); sums/products of roots and parameter conditions with Vi-ét (first the condition for two roots, then Vi-ét, then check the parameter against that condition)",
    "Non-symmetric expression of the roots: replace a square of a root using the equation itself, or combine x1 + x2 with the given relation to find each root, then use x1·x2",
    "System of two linear equations: substitution or elimination",
    "Parabola and line: write the intersection equation ax² = mx + n, then Δ for the number of intersections and Vi-ét for conditions on their coordinates",
    "Simplifying expressions: conditions of definition, factorise with the identities, common denominator, then cancel; answer follow-up questions from the simplified form",
    "Word problem: choose the unknown and its condition, set up the equation or system, solve, check against the story, answer with units",
    "Right triangle / practical heights: hệ thức lượng and trigonometric ratios of acute angles; state the rounding",
    "Statistics and probability: list the data or the outcomes explicitly, build the table, then compute the frequency or probability as a fraction",
    "Cylinder / cone / sphere: write the formula (S_xq, S_tp, V), substitute the given dimensions, keep π until the end and state units",
    "Maximum / minimum (including real-life optimisation): complete the square or use (a − b)² ≥ 0, or Cô-si for non-negative terms; always state when equality holds and check it is attainable",
    "Integers / divisibility: factorise first — a difference of powers with a hằng đẳng thức, e.g. (n + 4)⁴ − n⁴ = [(n + 4)² − n²][(n + 4)² + n²] = 16(n + 2)(n² + 4n + 8), never by expanding the binomial — then split into cases by remainder; ≡ (mod) notation is fine, but state every condition in its simplest form (\"n ≡ 0 hoặc 2 (mod 4)\" is \"n chẵn\") and the conclusion in words (\"n chia 3 dư 1\", \"n = 18k + 16\")",
    "Combining conditions on n (e.g. n chẵn and n chia 9 dư 7): write n = 9k + 7, require the other condition on k (k lẻ), substitute k = 2l + 1 to get n = 18l + 16 — never cite the Chinese remainder theorem",
    "Multi-part problems: solve the parts in order (a, b, c), each part's steps together and ending with that part's conclusion; a later part may reuse an earlier result by naming it (\"theo câu a\")",
    "Geometry proof: angle chasing, congruent or similar triangles, isosceles/parallel properties, inscribed angles, tangent properties, cyclic quadrilaterals — a chain of named school theorems, never coordinates, vectors or the laws of sines/cosines",
  ],
};
