/**
 * Lessons learned from auditing geometry solutions (worker/scripts/geometry-audit.ts): mistakes the solver made,
 * confirmed false on the exact figure (and, where noted, independently), turned into general rules that are given to
 * the solver for every geometry problem. Rules are generic — never the answer to a specific problem — so they help on
 * new problems without leaking evaluation items. Each rule keeps its evidence; the loop log is in
 * docs/GEOMETRY_LOOP.md.
 */
export interface GeometryLesson {
  id: string;
  /** Which check of the loop found it: figure ↔ text, step ↔ figure, or grade level. */
  check: "figure" | "steps" | "grade";
  /** The instruction given to the solver (English, imperative, general). */
  rule: string;
  /** Where it was seen (dataset ids / stored lessons) and what went wrong. */
  evidence: string[];
  added: string;
}

export const GEOMETRY_LESSONS: GeometryLesson[] = [
  {
    id: "one-name-one-point",
    check: "figure",
    rule: "A point's name keeps one meaning in the whole solution: never reuse a letter (from the problem or an earlier step) for a new point — pick an unused letter.",
    evidence: ["Câu 4 (stored lesson b0f85f87/q4): M was the midpoint of JI in step 7 and AL ∩ GJ in step 8; the figure can draw only one, so claims about M contradicted each other."],
    added: "2026-10-08",
  },
  {
    id: "use-given-definitions",
    check: "figure",
    rule: "Use every point exactly as the problem defines it; never swap two names (re-read \"lần lượt\" lists: the first name goes with the first object).",
    evidence: ["Câu 4: L = DJ ∩ (I) and G = (S) ∩ (I) were swapped in a restated problem and in a solution step."],
    added: "2026-10-07",
  },
  {
    id: "no-unproved-well-known",
    check: "steps",
    rule: "Never justify a step with \"tính chất quen thuộc\" / \"dễ thấy\" / a well-known property: derive it from the definitions and earlier steps, and check it against the measured facts of the figure first — many \"well-known\" facts are false in the given configuration.",
    evidence: ["Câu 4 (b0f85f87/q4) step 4: \"một tính chất quen thuộc: JD ∥ BC\" — false on the exact figure (the lines are nearly perpendicular)."],
    added: "2026-10-08",
  },
  {
    id: "collinear-not-concyclic",
    check: "steps",
    rule: "Before claiming a right angle ∠XJY or that four points are concyclic, check collinearity: a point on line XY gives a straight (180°) angle, and a circle can't pass through three collinear points.",
    evidence: ["Câu 4: \"∠IJA = 90° so A, J, H, I are concyclic\" while J lies on AI (AI ⊥ EF at J)."],
    added: "2026-10-07",
  },
  {
    id: "tangent-radius",
    check: "steps",
    rule: "A tangent at P to a circle is perpendicular to the radius from THAT circle's own center to P (the tangent at D to (O) is ⊥ OD) — not to a segment from another center.",
    evidence: ["PTNK 2025 4c: \"SD ⊥ ID\" where SD is the tangent at D to (O); false on the figure (SD ⊥ OD)."],
    added: "2026-10-08",
  },
  {
    id: "angle-equalities-need-a-source",
    check: "steps",
    rule: "Write an equality of angles only with its source: equal inscribed angles on the same arc (name the circle and the arc), corresponding angles of a named similarity (match vertices in order), or a named parallel/isosceles fact. An equality without such a source is usually false.",
    evidence: [
      "PTNK 2025 4a: \"∠EDF = ∠ODE\" — false in 200/200 random valid configurations (independent check).",
      "PTNK 2025 4b: \"∠EDF = ∠EDB\" — false in 200/200 random valid configurations.",
    ],
    added: "2026-10-08",
  },
  {
    id: "similarity-vertex-order",
    check: "steps",
    rule: "Write similar (or congruent) triangles with corresponding vertices in the same order: △XYZ ∽ △X'Y'Z' means ∠X = ∠X', ∠Y = ∠Y', ∠Z = ∠Z'. Find the equal angles first, then order the letters.",
    evidence: [
      "g8 (EXP-004, qwen3.5-9b): \"△AHE ∽ △ABC\" — the triangles are similar but A does not correspond to A (correct: △AHE ∽ △BCA).",
      "g8 (EXP-010, Nemotron): \"△ADH ∽ △ABH\" (correct: △ADH ∽ △AHB).",
    ],
    added: "2026-10-08",
  },
  {
    id: "distinct-points-distinct-constructions",
    check: "figure",
    rule: "Different points need different constructions: never define two points the same way (e.g. both as the midpoint of AB) — the figure would draw them on top of each other.",
    evidence: ["hcm-2025 2b (EXP-011b, Nemotron): E and F were both \"midpoint of AB\", so EF = 0 and \"GH = EF\" was false."],
    added: "2026-10-08",
  },
  {
    id: "no-out-of-curriculum-alternative",
    check: "grade",
    rule: "Never mention a method outside the curriculum, even as an aside (\"hoặc bằng đạo hàm\", \"dùng vectơ cũng được\") — give only the school method.",
    evidence: ["ch-2 (EXP-010, Nemotron): \"(bằng bất đẳng thức Cauchy hoặc bằng đạo hàm)\"."],
    added: "2026-10-08",
  },
  {
    id: "no-unstated-special-case",
    check: "steps",
    rule: "Never assume a special case the problem doesn't state (an isosceles or right triangle, equal sides, a point being a midpoint): prove it from the givens or don't use it.",
    evidence: ["PTNK 2024 4b (GEO-R1b, qwen3.6): \"Vì △ABD cân tại A\" — not given; the right angles derived from it (∠DAI = 90°, ∠HBD = 90°) were false on the figure."],
    added: "2026-10-08",
  },
  {
    id: "synthetic-not-vectors",
    check: "grade",
    rule: "Solve geometry synthetically (similar triangles, angle chasing, Thales, power of a point, areas) — never with vectors or coordinates unless the problem gives coordinates.",
    evidence: ["hcm-2025 3b (GEO-R1b, qwen3.6): \"Đặt gốc vectơ tại A …\" to get EN/NF."],
    added: "2026-10-08",
  },
];

/** The rules as a prompt block for a geometry problem. */
export function geometryLessonsPrompt(): string {
  return [
    "Mistakes found in earlier geometry solutions — avoid them (each was false on the exact figure):",
    ...GEOMETRY_LESSONS.map((l) => `- ${l.rule}`),
  ].join("\n");
}
