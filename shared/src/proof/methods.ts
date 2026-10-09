/**
 * The geometry method library: every theorem/property the planner may use, as data — what it needs, what it gives,
 * how hard it is, whether it is inside the agreed curriculum (docs/CURRICULUM_KNOWLEDGE_BASE.md), and whether the
 * search applies it automatically (`search`). Methods without `search` are documented for the solver and the verifier
 * vocabulary but not yet searched (honest coverage: see docs/GEOMETRY_METHOD_LIBRARY.md).
 *
 * The verifier (verify.ts) checks every proof step against the method it cites: the method must exist, be allowed,
 * and its prerequisites must be among the step's premises.
 */
import type { Fact } from "./facts";

export type MethodCategory = "given" | "angle" | "triangle" | "circle" | "ratio" | "advanced";

export interface GeometryMethod {
  id: string;
  /** Vietnamese name as the textbook says it (shown as the step's reason). */
  vi: string;
  category: MethodCategory;
  /** 1 = basic Grade 7–8, 2 = Grade 9, 3 = entrance-exam standard, 4–5 = chuyên configurations. */
  difficulty: 1 | 2 | 3 | 4 | 5;
  grade: 7 | 8 | 9;
  /** Inside the knowledge base; `advanced` = allowed only when the problem calls for it (B5). */
  allowed: boolean;
  advanced?: boolean;
  /** What must already be known (in words, and as fact types for the verifier). */
  prerequisites: string;
  needs: Fact["t"][];
  /** What it establishes. */
  produces: Fact["t"][];
  /** Applied automatically by the search (otherwise documented only). */
  search: boolean;
  preferredWhen?: string;
  commonErrors?: string;
}

const m = (x: GeometryMethod) => x;

export const METHODS: GeometryMethod[] = [
  // --- given / construction -------------------------------------------------------------------------------------
  m({ id: "GIVEN", vi: "giả thiết", category: "given", difficulty: 1, grade: 7, allowed: true, prerequisites: "stated in the problem", needs: [], produces: ["col", "para", "perp", "cong", "eqangle", "aval", "cyclic", "prod", "midp"], search: true }),
  m({ id: "PREVIOUS_PART", vi: "kết quả đã chứng minh ở câu trước", category: "given", difficulty: 1, grade: 7, allowed: true, prerequisites: "a claim proved in an earlier part of the problem", needs: [], produces: ["col", "para", "perp", "cong", "eqangle", "aval", "suppl", "bisector", "cyclic", "prod", "simtri", "midp"], search: true }),
  m({ id: "CONSTRUCTION", vi: "cách dựng", category: "given", difficulty: 1, grade: 7, allowed: true, prerequisites: "a point defined by the problem or an auxiliary construction (midpoint, foot, intersection, point on a circle …)", needs: [], produces: ["col", "perp", "midp", "cong", "eqangle", "para"], search: true }),

  // --- angles ---------------------------------------------------------------------------------------------------
  m({ id: "SAME_LINE", vi: "qua một điểm chỉ có một đường thẳng song song (vuông góc) với một đường thẳng cho trước", category: "angle", difficulty: 1, grade: 7, allowed: true, prerequisites: "two lines through one point making the same angle with a third line (both parallel or both perpendicular to it)", needs: ["para", "perp"], produces: ["col"], search: true }),
  m({ id: "ANGLE_CHASE", vi: "cộng, trừ góc (góc kề bù, đối đỉnh, so le trong, đồng vị, tổng ba góc trong tam giác)", category: "angle", difficulty: 2, grade: 7, allowed: true, prerequisites: "angle facts whose sum/difference gives the conclusion: straight lines, parallels, perpendiculars, triangle angle sums, earlier equal angles", needs: ["eqangle"], produces: ["eqangle", "aval", "suppl", "bisector", "para", "perp", "col"], search: true, preferredWhen: "the goal is an angle relation reachable by sums of known angles", commonErrors: "writing equal angles that are supplementary (vertices on opposite sides of a chord); confusing the vertex letter" }),
  m({ id: "VERTICAL_ANGLES", vi: "hai góc đối đỉnh", category: "angle", difficulty: 1, grade: 7, allowed: true, prerequisites: "two intersecting lines", needs: ["col"], produces: ["eqangle"], search: false }),
  m({ id: "LINEAR_PAIR", vi: "hai góc kề bù", category: "angle", difficulty: 1, grade: 7, allowed: true, prerequisites: "adjacent angles on a straight line", needs: ["col"], produces: ["aval"], search: false }),
  m({ id: "PARALLEL_ANGLES", vi: "hai đường thẳng song song (so le trong, đồng vị, trong cùng phía)", category: "angle", difficulty: 1, grade: 7, allowed: true, prerequisites: "a transversal cutting two parallel lines", needs: ["para"], produces: ["eqangle"], search: false }),
  m({ id: "PARALLEL_FROM_ANGLES", vi: "dấu hiệu nhận biết hai đường thẳng song song", category: "angle", difficulty: 1, grade: 7, allowed: true, prerequisites: "equal alternate/corresponding angles", needs: ["eqangle"], produces: ["para"], search: false }),
  m({ id: "ANGLE_SUM", vi: "tổng ba góc trong tam giác", category: "angle", difficulty: 1, grade: 7, allowed: true, prerequisites: "a triangle", needs: [], produces: ["aval"], search: false }),
  m({ id: "EXTERIOR_ANGLE", vi: "góc ngoài của tam giác", category: "angle", difficulty: 1, grade: 7, allowed: true, prerequisites: "an exterior angle equals the sum of the two remote interior angles", needs: ["col"], produces: ["eqangle"], search: false, commonErrors: "equating the exterior angle with ONE remote angle" }),
  m({ id: "ANGLE_BISECTOR", vi: "tia phân giác của góc", category: "angle", difficulty: 1, grade: 7, allowed: true, prerequisites: "a ray that splits an angle into two equal angles", needs: [], produces: ["eqangle"], search: false }),

  // --- lengths / ratios -----------------------------------------------------------------------------------------
  m({ id: "LENGTH_ALGEBRA", vi: "biến đổi tỉ số, đẳng thức độ dài", category: "ratio", difficulty: 2, grade: 8, allowed: true, prerequisites: "equal segments, proportions from similar triangles, midpoints", needs: ["cong"], produces: ["cong", "prod"], search: true }),
  m({ id: "MIDPOINT", vi: "tính chất trung điểm", category: "ratio", difficulty: 1, grade: 7, allowed: true, prerequisites: "M is the midpoint of AB", needs: ["midp"], produces: ["cong", "col"], search: true }),
  m({ id: "MIDLINE", vi: "đường trung bình của tam giác", category: "ratio", difficulty: 2, grade: 8, allowed: true, prerequisites: "midpoints of two sides", needs: ["midp"], produces: ["para", "prod"], search: false }),
  m({ id: "THALES", vi: "định lý Thales", category: "ratio", difficulty: 2, grade: 8, allowed: true, prerequisites: "a line parallel to a side of a triangle", needs: ["para"], produces: ["prod"], search: false }),
  m({ id: "ANGLE_BISECTOR_THEOREM", vi: "tính chất đường phân giác trong tam giác", category: "ratio", difficulty: 2, grade: 8, allowed: true, prerequisites: "an angle bisector meeting the opposite side", needs: ["eqangle"], produces: ["prod"], search: false }),
  m({ id: "AREA_RATIO", vi: "tỉ số diện tích (chung đường cao / chung đáy)", category: "ratio", difficulty: 2, grade: 8, allowed: true, prerequisites: "triangles with a common height or base", needs: [], produces: ["prod"], search: false }),
  m({ id: "PYTHAGORAS", vi: "định lý Pythagore", category: "ratio", difficulty: 1, grade: 8, allowed: true, prerequisites: "a right triangle", needs: ["perp"], produces: [], search: false }),
  m({ id: "RIGHT_TRIANGLE_RELATIONS", vi: "hệ thức lượng trong tam giác vuông", category: "ratio", difficulty: 2, grade: 9, allowed: true, prerequisites: "a right triangle XEY (right angle at E) and the foot H of the altitude from E on XY: EX² = XH·XY, EY² = YH·YX, EH² = HX·HY", needs: ["perp", "col"], produces: ["prod"], search: true, preferredWhen: "a square of a segment equals a product of segments on one line" }),
  m({ id: "POWER_OF_POINT", vi: "phương tích (hệ thức cát tuyến, tiếp tuyến)", category: "circle", difficulty: 3, grade: 9, allowed: true, prerequisites: "two secants / a secant and a tangent from one point", needs: ["cyclic", "col"], produces: ["prod"], search: true, preferredWhen: "products of segments on lines through one point" }),
  m({ id: "CYCLIC_SAME_CIRCLE", vi: "qua ba điểm không thẳng hàng chỉ có một đường tròn", category: "circle", difficulty: 1, grade: 9, allowed: true, prerequisites: "two cyclic quadrilaterals with three common vertices", needs: ["cyclic"], produces: ["cyclic"], search: true, preferredWhen: "a fifth point is shown to lie on the circle through three known points" }),
  m({ id: "POWER_OF_POINT_CONVERSE", vi: "đảo của hệ thức phương tích (MA·MB = MC·MD thì A, B, C, D cùng thuộc một đường tròn)", category: "circle", difficulty: 3, grade: 9, allowed: true, prerequisites: "XA·XB = XC·XD with X on lines AB and CD, the four points not collinear, X on the same side for both pairs", needs: ["prod", "col"], produces: ["cyclic"], search: true, preferredWhen: "a product identity is known and the goal is concyclicity", commonErrors: "using it when X is inside one segment and outside the other" }),

  // --- triangles ------------------------------------------------------------------------------------------------
  m({ id: "ISOSCELES", vi: "tính chất tam giác cân (hai góc ở đáy bằng nhau)", category: "triangle", difficulty: 1, grade: 7, allowed: true, prerequisites: "two equal sides from one vertex", needs: ["cong"], produces: ["eqangle"], search: true }),
  m({ id: "ISOSCELES_CONVERSE", vi: "dấu hiệu tam giác cân (hai góc bằng nhau)", category: "triangle", difficulty: 1, grade: 7, allowed: true, prerequisites: "two equal angles at the ends of one side", needs: ["eqangle"], produces: ["cong"], search: true }),
  m({ id: "EQUILATERAL", vi: "tam giác đều", category: "triangle", difficulty: 1, grade: 7, allowed: true, prerequisites: "three equal sides or angles", needs: ["cong"], produces: ["aval"], search: false }),
  m({ id: "CONGRUENT_SSS", vi: "hai tam giác bằng nhau (c.c.c)", category: "triangle", difficulty: 2, grade: 7, allowed: true, prerequisites: "three pairs of equal corresponding sides", needs: ["cong"], produces: ["simtri"], search: false }),
  m({ id: "CONGRUENT_SAS", vi: "hai tam giác bằng nhau (c.g.c)", category: "triangle", difficulty: 2, grade: 7, allowed: true, prerequisites: "two pairs of equal sides and the included angles equal", needs: ["cong", "eqangle"], produces: ["simtri"], search: false, commonErrors: "the angle is not the one between the two sides" }),
  m({ id: "CONGRUENT_ASA", vi: "hai tam giác bằng nhau (g.c.g)", category: "triangle", difficulty: 2, grade: 7, allowed: true, prerequisites: "a side and the two adjacent angles", needs: ["cong", "eqangle"], produces: ["simtri"], search: false }),
  m({ id: "CONGRUENT_RIGHT", vi: "hai tam giác vuông bằng nhau (cạnh huyền – cạnh góc vuông, cạnh huyền – góc nhọn)", category: "triangle", difficulty: 2, grade: 7, allowed: true, prerequisites: "right angles plus hypotenuse and one more element", needs: ["perp", "cong"], produces: ["simtri", "cong"], search: true, preferredWhen: "two tangents from one point (equal tangent segments) or right triangles on a common hypotenuse" }),
  m({ id: "SIMILAR_AA", vi: "hai tam giác đồng dạng (g.g)", category: "triangle", difficulty: 2, grade: 8, allowed: true, prerequisites: "two pairs of equal corresponding angles", needs: ["eqangle"], produces: ["simtri"], search: true, preferredWhen: "products or ratios of segments", commonErrors: "vertices not in corresponding order" }),
  m({ id: "SIMILAR_SAS", vi: "hai tam giác đồng dạng (c.g.c)", category: "triangle", difficulty: 2, grade: 8, allowed: true, prerequisites: "two pairs of proportional sides and the included angles equal", needs: ["prod", "eqangle"], produces: ["simtri"], search: true }),
  m({ id: "SIMILAR_SSS", vi: "hai tam giác đồng dạng (c.c.c)", category: "triangle", difficulty: 2, grade: 8, allowed: true, prerequisites: "three pairs of proportional sides", needs: ["prod"], produces: ["simtri"], search: false }),
  m({ id: "SIMILAR_PARTS", vi: "tính chất hai tam giác đồng dạng (góc tương ứng, tỉ số cạnh)", category: "triangle", difficulty: 2, grade: 8, allowed: true, prerequisites: "two similar triangles with corresponding vertices in order", needs: ["simtri"], produces: ["eqangle", "prod"], search: true }),
  m({ id: "PERPENDICULAR_BISECTOR", vi: "đường trung trực của đoạn thẳng", category: "triangle", difficulty: 1, grade: 7, allowed: true, prerequisites: "two points each equidistant from the ends of a segment (the line through them is perpendicular to it and passes through its midpoint)", needs: ["cong", "midp"], produces: ["perp", "col"], search: true }),
  m({ id: "MEDIAN_RIGHT_TRIANGLE", vi: "đường trung tuyến ứng với cạnh huyền", category: "triangle", difficulty: 2, grade: 8, allowed: true, prerequisites: "the midpoint of the hypotenuse of a right triangle", needs: ["midp", "perp"], produces: ["cong"], search: false }),
  m({ id: "ALTITUDE_ORTHOCENTER", vi: "ba đường cao đồng quy (trực tâm)", category: "triangle", difficulty: 2, grade: 8, allowed: true, prerequisites: "two altitudes of a triangle", needs: ["perp"], produces: ["perp"], search: false }),
  m({ id: "TRIANGLE_CENTERS", vi: "các điểm đặc biệt (trọng tâm, tâm đường tròn nội tiếp, ngoại tiếp)", category: "triangle", difficulty: 2, grade: 7, allowed: true, prerequisites: "medians / bisectors / perpendicular bisectors concur", needs: [], produces: ["eqangle", "cong"], search: false }),

  // --- circles --------------------------------------------------------------------------------------------------
  m({ id: "CIRCLE_RADIUS", vi: "các bán kính của một đường tròn bằng nhau", category: "circle", difficulty: 1, grade: 9, allowed: true, prerequisites: "points on a circle and its center", needs: [], produces: ["cong"], search: true }),
  m({ id: "CONCYCLIC_GIVEN", vi: "các điểm cùng thuộc một đường tròn (giả thiết)", category: "circle", difficulty: 1, grade: 9, allowed: true, prerequisites: "four points on one given circle", needs: [], produces: ["cyclic"], search: true }),
  m({ id: "INSCRIBED_ANGLE", vi: "góc nội tiếp cùng chắn một cung", category: "circle", difficulty: 2, grade: 9, allowed: true, prerequisites: "four points on a circle", needs: ["cyclic"], produces: ["eqangle"], search: true, commonErrors: "vertices on opposite sides of the chord give supplementary, not equal, angles" }),
  m({ id: "CENTRAL_ANGLE", vi: "góc ở tâm và góc nội tiếp", category: "circle", difficulty: 2, grade: 9, allowed: true, prerequisites: "the center and points on the circle", needs: ["cong"], produces: ["eqangle"], search: false }),
  m({ id: "CYCLIC_QUADRILATERAL", vi: "dấu hiệu tứ giác nội tiếp (hai đỉnh cùng nhìn một cạnh dưới hai góc bằng nhau, tổng hai góc đối bằng 180°)", category: "circle", difficulty: 2, grade: 9, allowed: true, prerequisites: "two equal angles subtending one segment (from the same side), or opposite angles summing to 180°", needs: ["eqangle"], produces: ["cyclic"], search: true, preferredWhen: "concyclic goals, or to unlock inscribed-angle equalities" }),
  m({ id: "TANGENT_RADIUS", vi: "tiếp tuyến vuông góc với bán kính tại tiếp điểm", category: "circle", difficulty: 1, grade: 9, allowed: true, prerequisites: "a tangent at a point of a circle", needs: [], produces: ["perp"], search: true }),
  m({ id: "TANGENT_CHORD", vi: "góc tạo bởi tiếp tuyến và dây cung", category: "circle", difficulty: 2, grade: 9, allowed: true, prerequisites: "a tangent and a chord through the point of tangency", needs: ["perp", "cong"], produces: ["eqangle"], search: false }),
  m({ id: "EQUAL_TANGENTS", vi: "tính chất hai tiếp tuyến cắt nhau", category: "circle", difficulty: 1, grade: 9, allowed: true, prerequisites: "two tangents from one external point", needs: ["perp", "cong"], produces: ["cong"], search: false }),
  m({ id: "CHORD_DIAMETER", vi: "đường kính vuông góc với dây thì đi qua trung điểm của dây", category: "circle", difficulty: 1, grade: 9, allowed: true, prerequisites: "a diameter and a chord", needs: ["perp"], produces: ["midp"], search: false }),
  m({ id: "THALES_CIRCLE", vi: "góc nội tiếp chắn nửa đường tròn", category: "circle", difficulty: 1, grade: 9, allowed: true, prerequisites: "a point on the circle with diameter AB", needs: ["cyclic"], produces: ["perp"], search: true }),
  m({ id: "RADICAL_AXIS", vi: "trục đẳng phương, dây chung", category: "advanced", difficulty: 4, grade: 9, allowed: true, advanced: true, prerequisites: "two circles; equal powers", needs: ["cyclic"], produces: ["col", "perp"], search: false }),

  // --- advanced (B5: only when appropriate) ---------------------------------------------------------------------
  m({ id: "CEVA", vi: "định lý Ceva", category: "advanced", difficulty: 4, grade: 9, allowed: true, advanced: true, prerequisites: "three cevians and the side ratios", needs: ["prod"], produces: ["col"], search: false }),
  m({ id: "MENELAUS", vi: "định lý Menelaus", category: "advanced", difficulty: 4, grade: 9, allowed: true, advanced: true, prerequisites: "a transversal of a triangle", needs: ["col"], produces: ["prod"], search: false }),
  m({ id: "HOMOTHETY", vi: "phép vị tự", category: "advanced", difficulty: 5, grade: 9, allowed: true, advanced: true, prerequisites: "a center and a ratio", needs: ["para", "prod"], produces: ["col", "para"], search: false }),
  m({ id: "SPIRAL_SIMILARITY", vi: "đồng dạng xoắn", category: "advanced", difficulty: 5, grade: 9, allowed: true, advanced: true, prerequisites: "two similar triangles sharing a vertex", needs: ["simtri"], produces: ["cyclic"], search: false }),
  m({ id: "SIMSON_LINE", vi: "đường thẳng Simson", category: "advanced", difficulty: 5, grade: 9, allowed: true, advanced: true, prerequisites: "a point on the circumcircle and its feet on the sides", needs: ["cyclic", "perp"], produces: ["col"], search: false }),
  m({ id: "INCIRCLE_EXCIRCLE", vi: "đường tròn nội tiếp, bàng tiếp (tiếp điểm, độ dài tiếp tuyến)", category: "advanced", difficulty: 3, grade: 9, allowed: true, advanced: true, prerequisites: "the incircle / excircle and its points of tangency", needs: ["perp", "cong"], produces: ["cong"], search: false }),
  m({ id: "REFLECTION", vi: "đối xứng trục, đối xứng tâm", category: "advanced", difficulty: 3, grade: 8, allowed: true, prerequisites: "a point and its reflection", needs: ["perp", "midp"], produces: ["cong"], search: false }),
  m({ id: "LOCUS_EXTREMUM", vi: "quỹ tích, cực trị hình học", category: "advanced", difficulty: 4, grade: 9, allowed: true, advanced: true, prerequisites: "a moving point with a fixed property", needs: [], produces: [], search: false }),

  // --- outside the curriculum (never used; listed so the verifier can name them) -------------------------------
  m({ id: "COORDINATES", vi: "tọa độ", category: "advanced", difficulty: 3, grade: 9, allowed: false, prerequisites: "—", needs: [], produces: [], search: false }),
  m({ id: "VECTORS", vi: "vectơ", category: "advanced", difficulty: 3, grade: 9, allowed: false, prerequisites: "—", needs: [], produces: [], search: false }),
  m({ id: "INVERSION", vi: "phép nghịch đảo", category: "advanced", difficulty: 5, grade: 9, allowed: false, prerequisites: "—", needs: [], produces: [], search: false }),
  m({ id: "PROJECTIVE", vi: "hàng điểm điều hòa, cực – đối cực", category: "advanced", difficulty: 5, grade: 9, allowed: false, prerequisites: "—", needs: [], produces: [], search: false }),
  m({ id: "TRIG_LAWS", vi: "định lý sin, cos", category: "advanced", difficulty: 3, grade: 9, allowed: false, prerequisites: "—", needs: [], produces: [], search: false }),
];

const BY_ID = new Map(METHODS.map((x) => [x.id, x]));
export const method = (id: string) => BY_ID.get(id);

/** Methods that can establish a fact of this type (for goal analysis / backward search), simplest first. */
export function methodsFor(t: Fact["t"]): GeometryMethod[] {
  return METHODS.filter((x) => x.allowed && x.produces.includes(t)).sort((a, b) => a.difficulty - b.difficulty);
}
