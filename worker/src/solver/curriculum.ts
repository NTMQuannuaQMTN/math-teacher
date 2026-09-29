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
}

export const VN_GRADE_9: Curriculum = {
  id: "vn-grade9-v1",
  gradeLevel: 9,
  description: "Vietnamese lower-secondary mathematics (THCS), student in Grade 9 (lớp 9)",
  allowed: [
    "Arithmetic, fractions, decimals, percentages, ratios",
    "Algebraic expressions, expanding, the seven memorable identities (hằng đẳng thức), factorisation",
    "Rational expressions and simplification with conditions of definition (điều kiện xác định)",
    "Square roots and cube roots: definitions, simplifying radicals, rationalising denominators",
    "Linear equations, equations reducible to linear, equations with a variable in the denominator",
    "Linear inequalities in one variable",
    "Systems of two linear equations in two unknowns: substitution and elimination",
    "Quadratic equations: factorising, discriminant Δ and Δ', Vieta's formulas (hệ thức Vi-ét)",
    "Functions y = ax + b and y = ax², graphs, intersections",
    "Word problems solved by setting up an equation or a system (giải bài toán bằng cách lập phương trình/hệ phương trình)",
    "Angles: vertical, complementary/supplementary, angles formed by parallel lines and a transversal",
    "Triangles: angle sum, exterior angle, isosceles and equilateral triangles, the three congruence cases (c.c.c, c.g.c, g.c.g)",
    "Special lines of a triangle: median, altitude, angle bisector, perpendicular bisector, centroid",
    "Pythagorean theorem and its converse",
    "Quadrilaterals: parallelogram, rectangle, rhombus, square, trapezoid properties",
    "Thales' theorem, similar triangles (three cases), ratios in similar triangles, angle-bisector theorem",
    "Relations in a right triangle (hệ thức lượng): b² = a·b', h² = b'·c', a·h = b·c, 1/h² = 1/b² + 1/c²",
    "Trigonometric ratios of acute angles (sin, cos, tan, cot) and solving right triangles",
    "Circles: chords, distance from centre, tangents and their properties, two tangents from a point",
    "Inscribed angles, central angles, angles formed by tangent and chord, cyclic quadrilaterals",
    "Arc length, circumference, area of circle and sector; areas of triangles and quadrilaterals",
    "Basic statistics and probability at secondary level",
  ],
  forbidden: [
    "Calculus (derivatives, integrals, limits)",
    "Vectors and dot products as a solving method",
    "Coordinates as a shortcut for a synthetic geometry problem that doesn't mention coordinates",
    "The law of sines / law of cosines for non-right triangles",
    "Complex numbers, matrices, linear algebra",
    "Advanced inequalities (Cauchy–Schwarz, AM–GM beyond two terms, Jensen) unless the problem is explicitly an advanced olympiad question",
    "University-level theorems or notation",
  ],
  preferences: [
    "Direct elementary reasoning over clever tricks",
    "Standard school theorems, named the way a Vietnamese Grade 9 textbook names them",
    "The shortest method a strong Grade 9 teacher would expect a student to find",
    "Show every algebraic transformation a student would need to write, but no trivial filler steps",
  ],
};
