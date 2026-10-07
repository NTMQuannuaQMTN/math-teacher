/**
 * Builds a geometry figure from the problem statement alone — no model involved.
 *
 *   1. The base shape, placed so the stated properties hold with a visible margin: a triangle ("nhọn", "vuông tại A",
 *      "cân tại A", "đều", "AB < AC", "Â > B̂ > Ĉ", given angles or sides), optionally inscribed in "(O)"; a cyclic
 *      quadrilateral; a parallelogram / rectangle / square; a circle with tangents from an outside point.
 *   2. Every other point from its definition, in order (pointDefinitions.ts): midpoints, feet, intersections,
 *      incircle contact points, altitudes, perpendicular bisectors, tangents, points on an arc chosen to satisfy the
 *      stated inequalities.
 *   3. The segments, circles and polygon sides the statement names.
 *
 * The result is checked by the caller (verify.ts): the givens must hold and every "chứng minh" claim the checker can
 * measure must be true — a figure that fails is not used.
 */
import { checkClaims, statementGivens, statementParts } from "./claims";
import { constructNamedPoints } from "./pointDefinitions";
import { evaluateFigureCheck, resolveFigure, dist, type ResolvedFigure } from "./geometry";
import type { CircleDef, Figure, LineDef, ModelLesson, PointDef } from "./solution";

const PT = "[A-Z]'*";
const deg = (d: number) => (d * Math.PI) / 180;

const free = (id: string, x: number, y: number, hidden = false): PointDef => ({
  id, label: hidden ? "" : id, kind: "free", refs: [], x, y, value: null, value2: null, draggable: !hidden, hidden,
});
const onCircle = (id: string, circle: string, angle: number): PointDef => ({
  id, label: id, kind: "on_circle", refs: [circle], x: null, y: null, value: angle, value2: null, draggable: true, hidden: false,
});
const circle = (id: string, center: string, through: string | null, radius: number | null, label: string): CircleDef => ({
  id, center, through, radius, style: "given", label,
});
const segment = (a: string, b: string): LineDef => ({ id: `seg_${a}${b}`, kind: "segment", from: a, to: b, style: "given", label: null });

function clean(text: string): string {
  return text
    .normalize("NFC")
    .replace(/\$/g, "")
    .replace(/\\left|\\right/g, "")
    .replace(/\\(?:widehat|hat)\s*\{?\s*([A-Z]'*(?:[A-Z]'*[A-Z]'*)?)\s*\}?/g, "∠$1")
    .replace(/\\text\{([^}]*)\}/g, "$1")
    .replace(/\\(?:circ)/g, "°")
    .replace(/góc\s+(?:∠\s*)?((?:[A-Z]'*){1,3})\s+(?:bằng|là|=)\s*(\d+(?:[.,]\d+)?)\s*(?:độ|°)/g, "∠$1 = $2°")
    .replace(/\^\{?°\}?|\^\{?\\circ\}?/g, "°")
    .replace(/[{}]/g, "")
    .replace(/\\(?:le|leq)\b/g, "≤")
    .replace(/\\(?:ge|geq)\b/g, "≥")
    .replace(/\s+/g, " ");
}

interface TriangleSpec {
  names: [string, string, string];
  /** Angles at the three vertices (degrees). */
  angles: [number, number, number];
  /** Fixed side lengths (exact scale) when the statement gives them. */
  scale: number | null;
}

/** Angles of the main triangle that satisfy what the statement says about it. */
function triangleSpec(t: string): TriangleSpec | null {
  const m = new RegExp(`tam giác\\s+(?:nhọn\\s+)?(${PT})(${PT})(${PT})`).exec(t);
  if (!m) return null;
  const names = [m[1]!, m[2]!, m[3]!] as [string, string, string];
  const [A, B, C] = names;
  const idx = (v: string) => names.indexOf(v);
  const after = t.slice(m.index, m.index + 260);
  // Default: acute, scalene, with A > B > C and AB < AC (the usual chuyên setting).
  let angles: [number, number, number] = [72, 62, 46];
  const right = new RegExp(`vuông tại (${PT})`).exec(after)?.[1];
  const iso = new RegExp(`cân tại (${PT})`).exec(after)?.[1];
  if (/tam giác\s+(?:\S+\s+)?đều|đều\s+(?:cạnh|có)/.test(after) || /tam giác (?:đều )?[A-Z]'*[A-Z]'*[A-Z]'* đều/.test(after)) angles = [60, 60, 60];
  else if (right && idx(right) >= 0) {
    angles = [0, 0, 0];
    angles[idx(right)] = 90;
    const others = [0, 1, 2].filter((i) => i !== idx(right));
    angles[others[0]!] = 53;
    angles[others[1]!] = 37;
  } else if (iso && idx(iso) >= 0) {
    angles = [0, 0, 0];
    angles[idx(iso)] = 50;
    for (const i of [0, 1, 2]) if (i !== idx(iso)) angles[i] = 65;
  }
  // Given angles ("∠A = 65°", "∠BAC = 40°").
  const given = new Map<number, number>();
  for (const g of t.matchAll(new RegExp(`∠\\s*(${PT})(${PT})?(${PT})?\\s*=\\s*(\\d+(?:[.,]\\d+)?)\\s*°`, "g"))) {
    const vertex = g[3] ? g[2]! : g[1]!;
    if (idx(vertex) >= 0) given.set(idx(vertex), Number(g[4]!.replace(",", ".")));
  }
  if (given.size > 0) {
    const fixed = [...given.values()].reduce((s, v) => s + v, 0);
    const rest = [0, 1, 2].filter((i) => !given.has(i) && angles[i] !== 90 && !(right && idx(right) === i));
    const known = [0, 1, 2].filter((i) => !rest.includes(i));
    for (const i of known) if (given.has(i)) angles[i] = given.get(i)!;
    const remaining = 180 - known.reduce((s, i) => s + angles[i]!, 0);
    if (iso && idx(iso) >= 0 && given.has(idx(iso)) && rest.length === 2) rest.forEach((i) => (angles[i] = remaining / 2));
    else if (iso && idx(iso) >= 0 && !given.has(idx(iso)) && rest.length === 1) angles[rest[0]!] = remaining;
    else if (rest.length === 1) angles[rest[0]!] = remaining;
    else if (rest.length === 2) {
      const [i, j] = rest as [number, number];
      angles[i] = remaining * 0.58;
      angles[j] = remaining * 0.42;
    }
    void fixed;
  }
  // Inequalities between sides ("AB < AC") or angles ("Â > B̂ > Ĉ") reorder the free angles.
  const side = (u: string, v: string) => [0, 1, 2].find((i) => names[i] !== u && names[i] !== v)!; // opposite vertex
  for (const ineq of t.matchAll(new RegExp(`(${PT})(${PT})\\s*(<|>)\\s*(${PT})(${PT})`, "g"))) {
    const [p, q] = [side(ineq[1]!, ineq[2]!), side(ineq[4]!, ineq[5]!)];
    if (p === undefined || q === undefined || p === q || ![ineq[1], ineq[2], ineq[4], ineq[5]].every((v) => idx(v!) >= 0)) continue;
    const [small, big] = ineq[3] === "<" ? [p, q] : [q, p];
    if (angles[small]! >= angles[big]! && !given.has(small) && !given.has(big)) [angles[small], angles[big]] = [angles[big]!, angles[small]!];
  }
  const chain = new RegExp(`∠\\s*(${PT})\\s*>\\s*∠\\s*(${PT})\\s*>\\s*∠\\s*(${PT})`).exec(t);
  if (chain && given.size === 0 && !right && !iso) {
    const order = [chain[1]!, chain[2]!, chain[3]!].map(idx);
    if (order.every((i) => i >= 0)) {
      const sorted = [...angles].sort((a, b) => b - a);
      order.forEach((i, k) => (angles[i] = sorted[k]!));
    }
  }
  // Side lengths: AB = 6, AC = 8 → exact scale.
  let scale: number | null = null;
  const sides = new Map<string, number>();
  for (const s of t.matchAll(new RegExp(`(${PT})(${PT})\\s*=\\s*(\\d+(?:[.,]\\d+)?)\\s*(?:cm|m|dm)?`, "g"))) {
    if (idx(s[1]!) >= 0 && idx(s[2]!) >= 0) sides.set([s[1], s[2]].sort().join(""), Number(s[3]!.replace(",", ".")));
  }
  if (sides.size >= 2 && right) {
    const [u, v] = [...sides.entries()];
    const legs = [u!, v!].filter(([k]) => k.includes(right));
    if (legs.length === 2) {
      // Both legs given: the angles follow from them.
      const [l1, l2] = legs as [[string, number], [string, number]];
      const at1 = idx(l2[0].replace(right, "")); // angle opposite leg l2 is at the end of leg l1
      const at2 = idx(l1[0].replace(right, ""));
      angles[at1] = (Math.atan2(l2[1], l1[1]) * 180) / Math.PI;
      angles[at2] = 90 - angles[at1]!;
      scale = Math.hypot(l1[1], l2[1]);
    }
  }
  if (!scale && sides.size >= 1) {
    const [k, len] = [...sides.entries()][0]!;
    const opposite = side(k[0]!, k[1]!);
    if (opposite !== undefined) scale = len / Math.sin(deg(angles[opposite]!)); // = 2R
  }
  return { names, angles, scale };
}

/** Base shape: the main triangle (inscribed in "(O)" when said so). */
function baseTriangle(t: string, spec: TriangleSpec): Figure {
  const [A, B, C] = spec.names;
  const [a, b, c] = spec.angles.map(deg) as [number, number, number];
  // "tam giác ABC nội tiếp đường tròn (O)" — not "có đường tròn nội tiếp (I)" (the incircle).
  const inscribed = new RegExp(`(?<!đường tròn\\s)(?:nội tiếp|nội tiếp trong)\\s+(?:đường tròn\\s*)?\\(\\s*(${PT})\\s*\\)`).exec(t.slice(0, 400));
  const twoR = spec.scale ?? 8;
  const points: PointDef[] = [];
  const circles: CircleDef[] = [];
  if (inscribed) {
    const O = inscribed[1]!;
    const R = twoR / 2;
    points.push(free(O, 0, 0));
    points[0]!.draggable = false;
    circles.push(circle(`c_${O}`, O, null, R, `(${O})`));
    // A at the top; arcs AB = 2C, BC = 2A (counter-clockwise).
    const ta = 90 + (Math.max(b, c) - Math.min(b, c)) * (90 / Math.PI) * 0.0; // A on top
    points.push(onCircle(A, `c_${O}`, ta), onCircle(B, `c_${O}`, ta + (2 * c * 180) / Math.PI), onCircle(C, `c_${O}`, ta + ((2 * c + 2 * a) * 180) / Math.PI));
  } else {
    // BC horizontal, A above; |BC| = 2R sin A.
    const bc = twoR * Math.sin(a);
    const ab = twoR * Math.sin(c);
    points.push(free(B, 0, 0), free(C, bc, 0), free(A, ab * Math.cos(b), ab * Math.sin(b)));
  }
  return {
    scale: spec.scale ? "exact" : "schematic",
    points,
    lines: [segment(A, B), segment(B, C), segment(C, A)],
    circles,
    angles: [],
    marks: [],
    checks: [],
  };
}

/** "tứ giác ABCD nội tiếp đường tròn (O)" (with "AC đi qua tâm O" when said). */
function baseCyclicQuadrilateral(t: string): Figure | null {
  const m = new RegExp(`tứ giác\\s+(?:lồi\\s+)?(${PT})(${PT})(${PT})(${PT})\\s+nội tiếp\\s+(?:đường tròn\\s*)?\\(\\s*(${PT})\\s*\\)`).exec(t);
  if (!m) return null;
  const [A, B, C, D, O] = [m[1]!, m[2]!, m[3]!, m[4]!, m[5]!];
  const points: PointDef[] = [free(O, 0, 0), onCircle(A, `c_${O}`, 105), onCircle(B, `c_${O}`, 205), onCircle(C, `c_${O}`, 285), onCircle(D, `c_${O}`, 335)];
  points[0]!.draggable = false;
  const diag = new RegExp(`(?:đường chéo\\s+)?(${PT})(${PT}) đi qua (?:tâm\\s+)?${O}`).exec(t);
  if (diag) {
    const [p, q] = [diag[1]!, diag[2]!];
    const target = points.find((x) => x.id === q);
    if (target && points.some((x) => x.id === p)) Object.assign(target, { kind: "reflect", refs: [p, O], value: null, draggable: false });
  }
  return { scale: "schematic", points, lines: [segment(A, B), segment(B, C), segment(C, D), segment(D, A)], circles: [circle(`c_${O}`, O, null, 4, `(${O})`)], angles: [], marks: [], checks: [] };
}

/**
 * "tứ giác (lồi) ABCD … hai đường chéo AC và BD vuông góc": the diagonals on the axes through their intersection, so
 * A = (0, a), B = (−b, 0), C = (0, −c), D = (d, 0); each given side (BC = 7, DA = 1) fixes its two half-diagonals.
 */
function basePerpendicularDiagonals(t: string): Figure | null {
  const m = new RegExp(`tứ giác\\s+(?:lồi\\s+)?(${PT})(${PT})(${PT})(${PT})`).exec(t);
  if (!m || !/đường chéo[^.]{0,40}vuông góc|vuông góc với nhau/.test(t)) return null;
  const [A, B, C, D] = [m[1]!, m[2]!, m[3]!, m[4]!];
  const len = (u: string, v: string) => {
    const r = new RegExp(`(?:${u}${v}|${v}${u})\\s*=\\s*(\\d+(?:[.,]\\d+)?)`).exec(t);
    return r ? Number(r[1]!.replace(",", ".")) : null;
  };
  // Half-diagonals a (to A), b (to B), c (to C), d (to D); split a given side 3:4-ish so the quadrilateral is clearly convex.
  const h = { a: 3, b: 4, c: 3.5, d: 2.5 };
  const sides: [string, string, "a" | "b" | "c" | "d", "a" | "b" | "c" | "d"][] = [[A, B, "a", "b"], [B, C, "b", "c"], [C, D, "c", "d"], [D, A, "d", "a"]];
  const fixed = new Set<string>();
  for (const [u, v, p, q] of sides) {
    const L = len(u, v);
    if (L === null || fixed.has(p) || fixed.has(q)) continue;
    h[p] = L * 0.6;
    h[q] = L * 0.8;
    fixed.add(p).add(q);
  }
  const points = [free(A, 0, h.a), free(B, -h.b, 0), free(C, 0, -h.c), free(D, h.d, 0)];
  return { scale: fixed.size ? "exact" : "schematic", points, lines: [segment(A, B), segment(B, C), segment(C, D), segment(D, A), segment(A, C), segment(B, D)], circles: [], angles: [], marks: [], checks: [] };
}

/** "hình bình hành / hình chữ nhật / hình vuông / hình thoi ABCD". */
function baseParallelogram(t: string): Figure | null {
  const m = new RegExp(`hình (bình hành|chữ nhật|vuông|thoi)\\s+(${PT})(${PT})(${PT})(${PT})`).exec(t);
  if (!m) return null;
  const [A, B, C, D] = [m[2]!, m[3]!, m[4]!, m[5]!];
  const shape = m[1]!;
  const corners: Record<string, [number, number][]> = {
    "bình hành": [[0, 4], [5, 4], [7, 0], [2, 0]].reverse() as [number, number][],
    "chữ nhật": [[0, 4], [6, 4], [6, 0], [0, 0]],
    vuông: [[0, 5], [5, 5], [5, 0], [0, 0]],
    thoi: [[3, 5], [6, 2.5], [3, 0], [0, 2.5]],
  };
  const pts = shape === "bình hành" ? ([[0, 0], [6, 0], [8, 4], [2, 4]] as [number, number][]) : corners[shape]!;
  const ids = [A, B, C, D];
  return {
    scale: "schematic",
    points: ids.map((id, i) => free(id, pts[i]![0], pts[i]![1])),
    lines: [segment(A, B), segment(B, C), segment(C, D), segment(D, A)],
    circles: [],
    angles: [],
    marks: [],
    checks: [],
  };
}

/** "Từ điểm A nằm ngoài đường tròn (O; R) kẻ hai tiếp tuyến AB, AC (B, C là các tiếp điểm)". */
function baseTangents(t: string): Figure | null {
  const m = new RegExp(`(?:từ\\s+)?(?:điểm\\s+)?(${PT}) (?:nằm )?(?:ở )?ngoài (?:đường tròn\\s*)?\\(\\s*(${PT})\\s*(?:;\\s*([^)]*))?\\)`, "i").exec(t);
  const tan = new RegExp(`tiếp tuyến\\s+(${PT})(${PT})\\s*,\\s*(${PT})(${PT})`).exec(t);
  const mcq = new RegExp(`(${PT})(${PT})\\s*,\\s*(${PT})(${PT}) là các tiếp tuyến của (?:đường tròn\\s*)?\\(\\s*(${PT})\\s*\\)`).exec(t);
  const A = m?.[1] ?? mcq?.[1];
  const O = m?.[2] ?? mcq?.[5];
  const t1 = tan ?? mcq;
  if (!A || !O || !t1 || t1[1] !== A || t1[3] !== A) return null;
  const R = Number(/bán kính[^0-9]*(\d+(?:[.,]\d+)?)/.exec(t)?.[1]?.replace(",", ".") ?? m?.[3]?.replace(/[^\d.,]/g, "").replace(",", ".") ?? "") || 3;
  const OA = Number(new RegExp(`(?:${O}${A}|${A}${O})\\s*=\\s*(\\d+(?:[.,]\\d+)?)`).exec(t)?.[1]?.replace(",", ".") ?? "") || R * 2.2;
  const B = t1[2]!;
  const C = t1[4]!;
  const points: PointDef[] = [free(O, 0, 0), free(A, OA, 0)];
  points[0]!.draggable = false;
  points.push(
    { id: B, label: B, kind: "tangent", refs: [A, `c_${O}`], x: null, y: null, value: 0, value2: null, draggable: false, hidden: false },
    { id: C, label: C, kind: "tangent", refs: [A, `c_${O}`], x: null, y: null, value: 1, value2: null, draggable: false, hidden: false },
  );
  return {
    scale: /\d/.test(t) ? "exact" : "schematic",
    points,
    lines: [segment(A, B), segment(A, C)],
    circles: [circle(`c_${O}`, O, null, R, `(${O})`)],
    angles: [],
    marks: [],
    checks: [],
  };
}

/** "Cho đường tròn (O; 5 cm) và dây AB = 8 cm": the circle with a chord of that length. */
function baseChord(t: string): Figure | null {
  const m = new RegExp(`đường tròn\\s*\\(\\s*(${PT})\\s*(?:;\\s*(\\d+(?:[.,]\\d+)?)[^)]*)?\\)[^.]{0,30}?dây (?:cung\\s+)?(${PT})(${PT})(?:\\s*=\\s*(\\d+(?:[.,]\\d+)?))?`).exec(t);
  if (!m) return null;
  const [O, A, B] = [m[1]!, m[3]!, m[4]!];
  const R = Number(m[2]?.replace(",", ".")) || 5;
  const chord = Math.min(Number(m[5]?.replace(",", ".")) || R * 1.4, 2 * R * 0.999);
  const half = (Math.asin(chord / (2 * R)) * 180) / Math.PI;
  const points = [free(O, 0, 0), onCircle(A, `c_${O}`, 270 - half), onCircle(B, `c_${O}`, 270 + half)];
  points[0]!.draggable = false;
  return { scale: m[2] ? "exact" : "schematic", points, lines: [segment(A, B)], circles: [circle(`c_${O}`, O, null, R, `(${O})`)], angles: [], marks: [], checks: [] };
}

/** Points placed on an arc: "điểm D trên cung nhỏ AC sao cho CD > AB" — tried along the arc until the inequalities hold. */
function placeArcPoints(t: string, figure: Figure): Figure {
  const m = new RegExp(`(?:điểm\\s+)?(${PT}) (?:nằm )?(?:trên|thuộc) cung (nhỏ|lớn)\\s+(${PT})(${PT})`).exec(t);
  if (!m) return figure;
  const [name, size, P, Q] = [m[1]!, m[2]!, m[3]!, m[4]!];
  const c = figure.circles[0];
  if (!c || figure.points.some((p) => p.id === name)) return figure;
  const resolved = resolveFigure(figure);
  const [p, q, o] = [resolved.points[P], resolved.points[Q], resolved.points[c.center]];
  if (!p || !q || !o) return figure;
  const ang = (v: { x: number; y: number }) => (Math.atan2(v.y - o.y, v.x - o.x) * 180) / Math.PI;
  const [a1, a2] = [ang(p), ang(q)];
  let sweep = ((a2 - a1) % 360 + 360) % 360;
  // The minor arc is the shorter way round (and the major the longer).
  const minorForward = sweep <= 180;
  const forward = size === "nhỏ" ? minorForward : !minorForward;
  if (!forward) sweep = sweep - 360;
  const ineqs = [...t.matchAll(new RegExp(`(${PT})(${PT})\\s*(<|>)\\s*(${PT})(${PT})`, "g"))].filter((x) => [x[1], x[2], x[4], x[5]].includes(name));
  // Prefer the middle of the arc; conditions like "CD > AB" may need a point close to one end.
  for (const f of [0.5, 0.35, 0.65, 0.2, 0.8, 0.12, 0.88, 0.07, 0.93, 0.04, 0.96]) {
    const candidate = { ...figure, points: [...figure.points, onCircle(name, c.id, a1 + sweep * f)] };
    const r = resolveFigure(candidate);
    const ok = ineqs.every((x) => {
      const [u, v, w, z] = [r.points[x[1]!], r.points[x[2]!], r.points[x[4]!], r.points[x[5]!]];
      if (!u || !v || !w || !z) return true;
      const [l, rr] = [dist(u, v), dist(w, z)];
      return x[3] === "<" ? rr > l * 1.12 : l > rr * 1.12;
    });
    if (ok) return candidate;
  }
  return { ...figure, points: [...figure.points, onCircle(name, c.id, a1 + sweep * 0.5)] };
}

/** Points on a side: "K là một điểm trên cạnh AB", "lấy M thuộc đoạn BC". */
function placeSidePoints(t: string, figure: Figure): Figure {
  const points = [...figure.points];
  const ids = new Set(points.map((p) => p.id));
  for (const m of t.matchAll(new RegExp(`(${PT}) (?:là (?:một )?điểm )?(?:nằm )?(?:trên|thuộc) (?:cạnh|đoạn(?: thẳng)?) (${PT})(${PT})`, "g"))) {
    const [name, a, b] = [m[1]!, m[2]!, m[3]!];
    if (ids.has(name) || !ids.has(a) || !ids.has(b)) continue;
    points.push({ id: name, label: name, kind: "on_segment", refs: [a, b], x: null, y: null, value: 0.38, value2: null, draggable: true, hidden: false });
    ids.add(name);
  }
  return { ...figure, points };
}

export interface StatementFigure {
  figure: Figure;
  resolved: ResolvedFigure;
  /** Point names in the statement that the builder could not construct. */
  unbuilt: string[];
}

/** The named points of the statement ("Gọi M là…", "ABC", "(O)"). */
function namedPoints(t: string): Set<string> {
  const out = new Set<string>();
  // Multiple-choice labels ("A. 100°  B. 120°") are not points.
  t = t.replace(/(?:^|\s)[A-D]\.\s/g, " ");
  for (const m of t.matchAll(/(?<![\p{L}\d])((?:[A-Z]'*){1,4})(?![\p{L}\d_])/gu)) for (const l of m[1]!.match(/[A-Z]'*/g) ?? []) out.add(l);
  return out;
}

export function figureFromStatement(statement: string): StatementFigure | null {
  const t = clean(statement);
  const spec = triangleSpec(t);
  let figure =
    baseCyclicQuadrilateral(t) ?? basePerpendicularDiagonals(t) ?? baseParallelogram(t) ?? baseTangents(t) ?? (spec ? baseTriangle(t, spec) : null) ?? baseChord(t);
  if (!figure) return null;
  figure = placeArcPoints(t, placeSidePoints(t, figure));
  // Every other point from its definition (two passes inside; run twice so arc/side points defined later get used).
  const stub = (f: Figure): ModelLesson =>
    ({ analysis: { statement }, steps: [], hints: [], figure: f }) as unknown as ModelLesson;
  for (let i = 0; i < 2; i++) {
    figure = constructNamedPoints(stub(figure)).lesson.figure!;
    figure = placeArcPoints(t, placeSidePoints(t, figure));
  }
  const resolved = resolveFigure(figure);
  const built = new Set(Object.keys(resolved.points));
  // A radius written "(O; R)" is a length, not a point.
  const radii = new Set([...t.matchAll(new RegExp(`\\(\\s*${PT}\\s*;\\s*(${PT})\\s*\\)`, "g"))].map((m) => m[1]!));
  // A circle named by a letter ("đường tròn (S)") is not a point either, unless a point has that name too.
  const circleNames = new Set(figure.circles.map((c) => /\(\s*([A-Z]'*)\s*\)/.exec(c.label ?? "")?.[1]).filter((x): x is string => !!x));
  const unbuilt = [...namedPoints(t)].filter((p) => !built.has(p) && !radii.has(p) && !circleNames.has(p));
  return { figure, resolved, unbuilt };
}

/**
 * Uses the statement's own construction as the base of a lesson's figure, when it can be trusted: everything the
 * statement names was built, the givens hold, and no "chứng minh" claim measured on it is false. Points the
 * statement defines come from the statement (the model's placement of them is discarded); the model's extra points
 * (auxiliary constructions of the solution), lines, angles, marks and checks are kept on top. A model circle with the
 * same center as a statement circle keeps its id, so hints and steps that highlight it still work.
 */
export function adoptStatementFigure(lesson: ModelLesson, problemText?: string): { lesson: ModelLesson; adopted: boolean; reason: string } {
  const geometric = lesson.analysis.topic === "geometry" || lesson.figure !== null;
  if (!geometric) return { lesson, adopted: false, reason: "not geometry" };
  // The student's confirmed text first: a model's restatement can abbreviate, garble LaTeX, or change a definition.
  let result: ReturnType<typeof adoptFrom> = { lesson, adopted: false, reason: "no statement" };
  for (const text of [problemText, lesson.analysis.statement]) {
    if (!text?.trim()) continue;
    result = adoptFrom(lesson, text);
    if (result.adopted) return result;
  }
  return result;
}

function adoptFrom(lesson: ModelLesson, statement: string): { lesson: ModelLesson; adopted: boolean; reason: string } {
  const built = figureFromStatement(statement);
  if (!built) return { lesson, adopted: false, reason: "no base shape recognised" };
  if (built.resolved.errors.length > 0) return { lesson, adopted: false, reason: `construction errors: ${built.resolved.errors.slice(0, 2).join("; ")}` };
  if (built.unbuilt.length > 0) return { lesson, adopted: false, reason: `not built: ${built.unbuilt.join(", ")}` };
  const ids = new Set(built.figure.points.map((p) => p.id));
  const givens = statementGivens(statement, ids).filter((g) => !evaluateFigureCheck(g, built.resolved).passed);
  if (givens.length > 0) return { lesson, adopted: false, reason: "a given fails on the built figure" };
  // Stated inequalities between segments ("AB < AC", "CD > AB") must hold with a visible margin.
  for (const m of clean(statement).matchAll(new RegExp(`(?<![A-Z])(${PT})(${PT})\\s*(<|>)\\s*(${PT})(${PT})(?![A-Z])`, "g"))) {
    const [u, v, w, z] = [m[1]!, m[2]!, m[4]!, m[5]!].map((id) => built.resolved.points[id]);
    if (!u || !v || !w || !z) continue;
    const [l, r] = [dist(u, v), dist(w, z)];
    if (!(m[3] === "<" ? r > l * 1.1 : l > r * 1.1)) return { lesson, adopted: false, reason: `${m[1]}${m[2]} ${m[3]} ${m[4]}${m[5]} does not hold on the built figure` };
  }
  const claims = statementParts(statement)
    .filter((p) => /chứng minh|prove|show that/i.test(p.text))
    .flatMap((p) => checkClaims([p.text.replace(/^.*?(chứng minh|prove|show that)/is, "")], built.resolved, { exact: true }));
  if (claims.some((c) => !c.passed)) return { lesson, adopted: false, reason: "a claim is false on the built figure" };

  const model = lesson.figure;
  // The model's own givens must hold too: a fact the parser missed ("góc A bằng 40 độ" read wrongly) shows up here.
  if (model) {
    const missed = model.checks.filter((c) => c.role === "given" && c.refs.every((r) => ids.has(r) || built.figure.circles.some((x) => x.id === r)) && !evaluateFigureCheck(c, built.resolved).passed);
    if (missed.length > 0) return { lesson, adopted: false, reason: `a given of the model fails on the built figure (${missed[0]!.kind})` };
  }
  const base = built.figure;
  if (!model) return { lesson: { ...lesson, figure: base }, adopted: true, reason: "statement figure (the model drew none)" };

  // Model circles that are statement circles (same center) keep the model's id.
  const rename = new Map<string, string>();
  const circles = base.circles.map((c) => {
    const twin = model.circles.find((m) => m.center === c.center || (m.label && m.label === c.label));
    if (twin && twin.id !== c.id) rename.set(c.id, twin.id);
    return twin ? { ...c, id: twin.id, label: c.label ?? twin.label, style: twin.style } : c;
  });
  const renamed = (r: string) => rename.get(r) ?? r;
  const points = base.points.map((p) => ({ ...p, refs: p.refs.map(renamed), label: model.points.find((m) => m.id === p.id)?.label ?? p.label }));
  const taken = new Set([...points.map((p) => p.id), ...circles.map((c) => c.id)]);
  for (const p of model.points) if (!taken.has(p.id)) (points.push(p), taken.add(p.id));
  for (const c of model.circles) if (!taken.has(c.id) && !circles.some((x) => x.center === c.center)) (circles.push(c), taken.add(c.id));
  const lineIds = new Set(model.lines.map((l) => l.id));
  const same = (a: LineDef, b: LineDef) => (a.from === b.from && a.to === b.to) || (a.from === b.to && a.to === b.from);
  const lines = [...model.lines, ...base.lines.filter((l) => !lineIds.has(l.id) && !model.lines.some((m) => same(m, l)))].slice(0, 40);
  return {
    lesson: { ...lesson, figure: { ...model, scale: base.scale === "exact" ? "exact" : model.scale, points: points.slice(0, 30), circles: circles.slice(0, 6), lines } },
    adopted: true,
    reason: "statement figure as the base",
  };
}

/**
 * The statement's figure as text for the solver: each point's exact definition and a few facts measured on the
 * exact figure that don't follow directly from a single definition (collinear points, right angles). Given to the
 * model before it solves, so its reasoning uses the right objects (e.g. not swapping L = DJ ∩ (I) with G = (S) ∩ (I))
 * and doesn't assume false configurations (e.g. "∠IJA = 90°" when J lies on AI). Null when the figure can't be built.
 */
export function describeStatementFigure(problemText: string): string | null {
  const built = figureFromStatement(problemText);
  if (!built || built.unbuilt.length > 0 || built.resolved.errors.length > 0) return null;
  const { figure, resolved } = built;
  const byId = new Map(figure.points.map((p) => [p.id, p]));
  const visible = figure.points.filter((p) => !p.hidden && resolved.points[p.id]);
  const circleName = (id: string) => figure.circles.find((c) => c.id === id)?.label ?? `(${figure.circles.find((c) => c.id === id)?.center ?? id})`;
  const circleDesc = (id: string): string => {
    const c = figure.circles.find((x) => x.id === id);
    if (!c) return id;
    const center = byId.get(c.center);
    if (center?.hidden && center.kind === "circumcenter") return `${c.label ?? "the circle"} through ${center.refs.join(", ")}`;
    if (center?.hidden && center.kind === "midpoint") return `the circle with diameter ${center.refs.join("")}`;
    return c.label ?? `(${c.center})`;
  };
  const line = (a: string, b: string) => {
    const pa = byId.get(a);
    const pb = byId.get(b);
    // A hidden helper on a perpendicular bisector / tangent: describe the line by what it is.
    if (pb?.hidden && pb.kind === "rotate" && pb.value === 90 && pa?.hidden && pa.kind === "midpoint") return `the perpendicular bisector of ${pa.refs.join("")}`;
    if (pb?.hidden && pb.kind === "rotate" && pb.value === 90) return `the tangent at ${a} to the circle centered ${pb.refs[0]}`;
    return `line ${a}${b}`;
  };
  const defs: string[] = [];
  for (const p of visible) {
    const r = p.refs;
    switch (p.kind) {
      case "midpoint": defs.push(`${p.id} = midpoint of ${r.join("")}`); break;
      case "foot": defs.push(`${p.id} = foot of the perpendicular from ${r[0]} to ${r[1]}${r[2]}`); break;
      case "intersection": defs.push(`${p.id} = ${line(r[0]!, r[1]!)} ∩ ${line(r[2]!, r[3]!)}`); break;
      case "line_circle": defs.push(`${p.id} = intersection of line ${byId.get(r[0]!)?.hidden ? `${r[1]} (ray beyond ${byId.get(r[0]!)!.refs[1] ?? ""})` : `${r[0]}${r[1]}`} with ${circleDesc(r[2]!)}${p.value === 1 ? ` (the one other than / farther from ${r[0]})` : ""}`); break;
      case "circle_circle": defs.push(`${p.id} = intersection of ${circleDesc(r[0]!)} and ${circleDesc(r[1]!)}${r[2] ? ` other than ${r[2]}` : ""}`); break;
      case "incenter": defs.push(`${p.id} = incenter of triangle ${r.join("")}`); break;
      case "circumcenter": defs.push(`${p.id} = circumcenter of triangle ${r.join("")}`); break;
      case "orthocenter": defs.push(`${p.id} = orthocenter of triangle ${r.join("")}`); break;
      case "centroid": defs.push(`${p.id} = centroid of triangle ${r.join("")}`); break;
      case "reflect": defs.push(r.length === 2 ? `${p.id} = reflection of ${r[0]} in ${r[1]}` : `${p.id} = reflection of ${r[0]} in line ${r[1]}${r[2]}`); break;
      case "tangent": defs.push(`${p.id} = point of tangency from ${r[0]} to ${circleName(r[1]!)}`); break;
      case "on_circle": defs.push(`${p.id} on ${circleName(r[0]!)}`); break;
      case "on_segment": defs.push(`${p.id} on segment ${r.join("")}`); break;
      default: break;
    }
  }
  const circles = figure.circles.filter((c) => c.label).map((c) => (byId.get(c.center)?.hidden ? `${c.label} = ${circleDesc(c.id).replace(`${c.label} `, "circle ")}` : `${c.label} = circle centered ${c.center}`));

  // Facts not given by a single definition: collinear triples and right angles among the named points.
  const P = resolved.points;
  const ids = visible.map((p) => p.id);
  const size = Math.max(...ids.map((a) => Math.hypot(P[a]!.x, P[a]!.y)), 1);
  const onDefiningLine = (x: string, a: string, b: string) => {
    const d = byId.get(x);
    if (!d) return false;
    const pair = (u: string, v: string) => (u === a && v === b) || (u === b && v === a);
    return (
      (["midpoint", "on_segment"].includes(d.kind) && pair(d.refs[0]!, d.refs[1]!)) ||
      (d.kind === "foot" && pair(d.refs[1]!, d.refs[2]!)) ||
      (d.kind === "intersection" && (pair(d.refs[0]!, d.refs[1]!) || pair(d.refs[2]!, d.refs[3]!))) ||
      (d.kind === "line_circle" && pair(d.refs[0]!, d.refs[1]!)) ||
      (d.kind === "reflect" && d.refs.length === 2 && (d.refs.includes(a) && d.refs.includes(b)))
    );
  };
  // Lines given by definitions, with every point defined on them: a triple inside one of these is not news.
  const defining = new Map<string, Set<string>>();
  const addLine = (u: string, v: string, ...on: string[]) => {
    const key = [u, v].sort().join("|");
    const set = defining.get(key) ?? new Set([u, v]);
    on.forEach((x) => set.add(x));
    defining.set(key, set);
  };
  for (const d of figure.points) {
    if (["midpoint", "on_segment"].includes(d.kind)) addLine(d.refs[0]!, d.refs[1]!, d.id);
    if (d.kind === "foot") addLine(d.refs[1]!, d.refs[2]!, d.id);
    if (d.kind === "intersection") (addLine(d.refs[0]!, d.refs[1]!, d.id), addLine(d.refs[2]!, d.refs[3]!, d.id));
    if (d.kind === "line_circle") addLine(d.refs[0]!, d.refs[1]!, d.id);
  }
  const knownLine = (a: string, b: string, c: string) => [...defining.values()].some((s) => s.has(a) && s.has(b) && s.has(c));
  // Collinear points, merged into maximal sets ("A, D, K, G are collinear" once, not four triples).
  const collinear: Set<string>[] = [];
  for (let i = 0; i < ids.length; i++)
    for (let j = i + 1; j < ids.length; j++)
      for (let k = j + 1; k < ids.length; k++) {
        const [a, b, c] = [ids[i]!, ids[j]!, ids[k]!];
        const [pa, pb, pc] = [P[a]!, P[b]!, P[c]!];
        const cross = (pb.x - pa.x) * (pc.y - pa.y) - (pb.y - pa.y) * (pc.x - pa.x);
        if (Math.abs(cross) > 1e-7 * size * size) continue;
        const set = collinear.find((s) => [a, b, c].filter((x) => s.has(x)).length >= 2);
        if (set) [a, b, c].forEach((x) => set.add(x));
        else collinear.push(new Set([a, b, c]));
      }
  for (const set of collinear) {
    const pts = [...set];
    const key = pts.slice(0, 2).sort().join("|");
    defining.set(`c:${key}:${defining.size}`, set);
  }
  const facts = collinear
    .filter((set) => ![...defining.entries()].some(([k, s]) => !k.startsWith("c:") && [...set].every((x) => s.has(x))))
    .slice(0, 6)
    .map((set) => `${[...set].join(", ")} are collinear`);
  // Right angles, one per pair of perpendicular lines (∠AJE, ∠IJF … are all "AI ⊥ EF").
  const right: string[] = [];
  const lineOf = (a: string, b: string) => [...defining.values()].find((s) => s.has(a) && s.has(b)) ?? new Set([a, b]);
  const seenPairs = new Set<string>();
  for (const v of ids)
    for (let i = 0; i < ids.length; i++)
      for (let j = i + 1; j < ids.length; j++) {
        const [x, y] = [ids[i]!, ids[j]!];
        if (x === v || y === v || right.length >= 6) continue;
        const [pv, px, py] = [P[v]!, P[x]!, P[y]!];
        const u = { x: px.x - pv.x, y: px.y - pv.y };
        const w = { x: py.x - pv.x, y: py.y - pv.y };
        const cos = (u.x * w.x + u.y * w.y) / (Math.hypot(u.x, u.y) * Math.hypot(w.x, w.y) || 1);
        if (Math.abs(cos) > 1e-7) continue;
        const d = byId.get(v);
        if (d?.kind === "foot" && [x, y].includes(d.refs[0]!)) continue; // by definition
        const key = [[...lineOf(v, x)].sort().join(""), [...lineOf(v, y)].sort().join("")].sort().join("⊥");
        if (seenPairs.has(key)) continue;
        seenPairs.add(key);
        right.push(`∠${x}${v}${y} = 90°`);
      }
  return [
    "Exact construction of the figure from the statement (the checking program builds this figure and measures every claim of your solution on it — use exactly these definitions, do not rename or swap points):",
    ...defs.map((d) => `- ${d}`),
    ...circles.map((c) => `- ${c}`),
    ...(facts.length || right.length ? ["Facts measured on that figure (true; never claim their opposite):", ...[...facts, ...right].map((f) => `- ${f}`)] : []),
  ].join("\n");
}
