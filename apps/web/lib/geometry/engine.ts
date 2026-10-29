// Browser twin of services/api/app/geometry/engine.py: same DSL, same constructions, same residuals.
// Used to recompute a figure while the student drags free points. Parity with Python is tested on fixtures
// produced by the Python engine (engine.test.ts).

export type Vec = [number, number];
export type LineValue = { t: "line"; p: Vec; d: Vec; kind: string; a?: Vec; b?: Vec };
export type CircleValue = { t: "circle"; c: Vec; r: number };
export type PointValue = { t: "point"; v: Vec };
export type Value = PointValue | LineValue | CircleValue;
export type Values = Record<string, Value>;

// Loose structural types for the DSL (the API validates the spec; here we only read it).
export type GeoObject = { kind: string; id: string } & Record<string, unknown>;
export type Relation = { kind: string } & Record<string, unknown>;
export type GeometrySpec = { objects: GeoObject[]; givens?: Relation[]; goals?: Relation[]; targets?: unknown[] };
export type ParamSlot = { object: string; role: "x" | "y" | "t" | "angle" };

export class Degenerate extends Error {
  objectId: string;
  reason: string;
  constructor(objectId: string, reason: string) {
    super(`${objectId}: ${reason}`);
    this.objectId = objectId;
    this.reason = reason;
  }
}

const EPS = 1e-9;
const POINT_KINDS = new Set(["free_point", "point_on_line", "point_on_circle", "midpoint", "intersection", "projection",
  "reflection", "centroid", "orthocenter", "circumcenter", "incenter"]);

const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1]];
const add = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1]];
const mul = (a: Vec, k: number): Vec => [a[0] * k, a[1] * k];
const dot = (a: Vec, b: Vec): number => a[0] * b[0] + a[1] * b[1];
const cross = (a: Vec, b: Vec): number => a[0] * b[1] - a[1] * b[0];
const norm = (a: Vec): number => Math.hypot(a[0], a[1]);

function unit(v: Vec, id: string, what: string): Vec {
  const n = norm(v);
  if (n < EPS) throw new Degenerate(id, what);
  return [v[0] / n, v[1] / n];
}

function refs(obj: GeoObject): string[] {
  const out: string[] = [];
  for (const key of ["line", "circle", "a", "b", "point", "center", "through", "to", "vertex", "at", "exclude", "near"]) {
    const v = obj[key];
    if (typeof v === "string") out.push(v);
    else if (Array.isArray(v)) out.push(...(v as string[]));
  }
  for (const key of ["of", "points"]) {
    const v = obj[key];
    if (Array.isArray(v)) out.push(...(v as string[]));
  }
  return out;
}

export type Compiled = { spec: GeometrySpec; order: GeoObject[]; params: ParamSlot[] };

export function compile(spec: GeometrySpec): Compiled {
  const byId = new Map(spec.objects.map((o) => [o.id, o]));
  const state = new Map<string, number>();
  const order: GeoObject[] = [];
  const visit = (id: string) => {
    if (state.get(id) === 2) return;
    if (state.get(id) === 1) throw new Error(`circular construction at ${id}`);
    state.set(id, 1);
    const obj = byId.get(id);
    if (!obj) throw new Error(`unknown object ${id}`);
    for (const r of refs(obj)) visit(r);
    state.set(id, 2);
    order.push(obj);
  };
  for (const o of spec.objects) visit(o.id);
  const params: ParamSlot[] = [];
  for (const o of order) {
    if (o.kind === "free_point") params.push({ object: o.id, role: "x" }, { object: o.id, role: "y" });
    else if (o.kind === "point_on_line") params.push({ object: o.id, role: "t" });
    else if (o.kind === "point_on_circle") params.push({ object: o.id, role: "angle" });
  }
  return { spec, order, params };
}

function lineThrough(a: Vec, b: Vec, id: string, kind = "line"): LineValue {
  return { t: "line", p: a, d: unit(sub(b, a), id, "hai điểm xác định đường thẳng trùng nhau"), kind, a, b };
}

function intersectLines(l1: LineValue, l2: LineValue, id: string): Vec {
  const det = cross(l1.d, l2.d);
  if (Math.abs(det) < 1e-9) throw new Degenerate(id, "hai đường thẳng song song hoặc trùng nhau, không có giao điểm");
  const t = cross(sub(l2.p, l1.p), l2.d) / det;
  return add(l1.p, mul(l1.d, t));
}

function onExtent(line: LineValue, x: Vec): boolean {
  if (line.kind === "line" || !line.a || !line.b) return true;
  const span = sub(line.b, line.a);
  const t = dot(sub(x, line.a), span) / Math.max(dot(span, span), EPS);
  return t >= -1e-9 && (line.kind === "ray" || t <= 1 + 1e-9);
}

function lineCircle(line: LineValue, c: CircleValue, id: string): Vec[] {
  const w = sub(line.p, c.c);
  const b = dot(line.d, w);
  const disc = b * b - (dot(w, w) - c.r * c.r);
  if (disc < -1e-12) throw new Degenerate(id, "đường thẳng không cắt đường tròn");
  const root = Math.sqrt(Math.max(disc, 0));
  return [add(line.p, mul(line.d, -b - root)), add(line.p, mul(line.d, -b + root))];
}

function circleCircle(c1: CircleValue, c2: CircleValue, id: string): Vec[] {
  const delta = sub(c2.c, c1.c);
  const dist = norm(delta);
  if (dist < EPS || dist > c1.r + c2.r + 1e-12 || dist < Math.abs(c1.r - c2.r) - 1e-12) {
    throw new Degenerate(id, "hai đường tròn không cắt nhau");
  }
  const a = (c1.r ** 2 - c2.r ** 2 + dist ** 2) / (2 * dist);
  const h = Math.sqrt(Math.max(c1.r ** 2 - a * a, 0));
  const base = add(c1.c, mul(delta, a / dist));
  const perp: Vec = [-delta[1] / dist, delta[0] / dist];
  return [add(base, mul(perp, h)), sub(base, mul(perp, h))];
}

function circumcenter(a: Vec, b: Vec, c: Vec, id: string): Vec {
  const d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));
  const xs = [a[0], b[0], c[0]], ys = [a[1], b[1], c[1]];
  const scale = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 1);
  if (Math.abs(d) < 1e-9 * scale * scale) throw new Degenerate(id, "ba điểm thẳng hàng, không xác định đường tròn");
  const [sa, sb, sc] = [dot(a, a), dot(b, b), dot(c, c)];
  return [(sa * (b[1] - c[1]) + sb * (c[1] - a[1]) + sc * (a[1] - b[1])) / d,
    (sa * (c[0] - b[0]) + sb * (a[0] - c[0]) + sc * (b[0] - a[0])) / d];
}

/** Evaluate every object. `previous` (last frame) keeps intersection branches continuous while dragging. */
export function evaluate(compiled: Compiled, params: number[], previous?: Values): Values {
  const values: Values = {};
  let index = 0;
  const pt = (id: string): Vec => (values[id] as PointValue).v;
  const ln = (id: string): LineValue => values[id] as LineValue;
  const cr = (id: string): CircleValue => values[id] as CircleValue;
  const str = (o: GeoObject, k: string) => o[k] as string;
  const list = (o: GeoObject, k: string) => o[k] as string[];

  const choose = (candidates: Vec[], o: GeoObject, lines: LineValue[]): Vec => {
    const scale = Math.max(1, ...candidates.flat().map(Math.abs));
    if (typeof o.exclude === "string") {
      const x = pt(o.exclude);
      const d = candidates.map((p) => norm(sub(p, x)));
      if (Math.min(...d) > 1e-6 * scale) throw new Degenerate(o.id, `${o.exclude} không phải là một giao điểm`);
      return candidates[d[0]! >= d[1]! ? 0 : 1]!;
    }
    if (typeof o.near === "string") {
      const x = pt(o.near);
      return candidates.reduce((best, p) => (norm(sub(p, x)) < norm(sub(best, x)) ? p : best));
    }
    const prev = previous?.[o.id];
    if (prev && prev.t === "point") {
      return candidates.reduce((best, p) => (norm(sub(p, prev.v)) < norm(sub(best, prev.v)) ? p : best));
    }
    const inside = candidates.filter((p) => lines.every((l) => onExtent(l, p)));
    return inside.length === 1 ? inside[0]! : candidates[0]!;
  };

  for (const o of compiled.order) {
    const id = o.id;
    switch (o.kind) {
      case "free_point":
        values[id] = { t: "point", v: [params[index]!, params[index + 1]!] };
        index += 2;
        break;
      case "point_on_line": {
        const line = ln(str(o, "line"));
        const t = params[index++]!;
        values[id] = { t: "point", v: line.a && line.b ? add(line.a, mul(sub(line.b, line.a), t)) : add(line.p, mul(line.d, 4 * t)) };
        break;
      }
      case "point_on_circle": {
        const c = cr(str(o, "circle"));
        const a = params[index++]!;
        values[id] = { t: "point", v: add(c.c, [c.r * Math.cos(a), c.r * Math.sin(a)]) };
        break;
      }
      case "midpoint":
        values[id] = { t: "point", v: mul(add(pt(str(o, "a")), pt(str(o, "b"))), 0.5) };
        break;
      case "reflection":
        values[id] = { t: "point", v: sub(mul(pt(str(o, "center")), 2), pt(str(o, "point"))) };
        break;
      case "centroid": {
        const [a, b, c] = list(o, "points").map(pt) as [Vec, Vec, Vec];
        values[id] = { t: "point", v: mul(add(add(a, b), c), 1 / 3) };
        break;
      }
      case "circumcenter": {
        const [a, b, c] = list(o, "points").map(pt) as [Vec, Vec, Vec];
        values[id] = { t: "point", v: circumcenter(a, b, c, id) };
        break;
      }
      case "orthocenter": {
        const [a, b, c] = list(o, "points").map(pt) as [Vec, Vec, Vec];
        values[id] = { t: "point", v: sub(add(add(a, b), c), mul(circumcenter(a, b, c, id), 2)) };
        break;
      }
      case "incenter": {
        const [a, b, c] = list(o, "points").map(pt) as [Vec, Vec, Vec];
        const [la, lb, lc] = [norm(sub(b, c)), norm(sub(c, a)), norm(sub(a, b))];
        if (Math.min(la, lb, lc) < EPS || Math.abs(cross(sub(b, a), sub(c, a))) < 1e-12) throw new Degenerate(id, "tam giác suy biến");
        values[id] = { t: "point", v: mul(add(add(mul(a, la), mul(b, lb)), mul(c, lc)), 1 / (la + lb + lc)) };
        break;
      }
      case "projection": {
        const line = ln(str(o, "line"));
        const x = pt(str(o, "point"));
        values[id] = { t: "point", v: add(line.p, mul(line.d, dot(sub(x, line.p), line.d))) };
        break;
      }
      case "intersection": {
        const [refA, refB] = list(o, "of");
        const first = values[refA!]!, second = values[refB!]!;
        if (first.t === "line" && second.t === "line") values[id] = { t: "point", v: intersectLines(first, second, id) };
        else if (first.t === "circle" && second.t === "circle") values[id] = { t: "point", v: choose(circleCircle(first, second, id), o, []) };
        else {
          const line = (first.t === "line" ? first : second) as LineValue;
          const circle = (first.t === "circle" ? first : second) as CircleValue;
          values[id] = { t: "point", v: choose(lineCircle(line, circle, id), o, [line]) };
        }
        break;
      }
      case "line":
      case "segment":
      case "ray": {
        const [a, b] = list(o, "through").map(pt) as [Vec, Vec];
        values[id] = lineThrough(a, b, id, o.kind);
        break;
      }
      case "parallel":
        values[id] = { t: "line", p: pt(str(o, "through")), d: ln(str(o, "to")).d, kind: "line" };
        break;
      case "perpendicular": {
        const d = ln(str(o, "to")).d;
        values[id] = { t: "line", p: pt(str(o, "through")), d: [-d[1], d[0]], kind: "line" };
        break;
      }
      case "angle_bisector": {
        const v = pt(str(o, "vertex"));
        const u1 = unit(sub(pt(str(o, "a")), v), id, "đỉnh góc trùng với một điểm trên cạnh");
        const u2 = unit(sub(pt(str(o, "b")), v), id, "đỉnh góc trùng với một điểm trên cạnh");
        const s = add(u1, u2);
        values[id] = { t: "line", p: v, d: norm(s) < 1e-9 ? [-u1[1], u1[0]] : mul(s, 1 / norm(s)), kind: "line" };
        break;
      }
      case "tangent": {
        const c = cr(str(o, "circle"));
        const at = pt(str(o, "at"));
        const radial = sub(at, c.c);
        if (Math.abs(norm(radial) - c.r) > 1e-7 * Math.max(1, c.r)) throw new Degenerate(id, `${str(o, "at")} không nằm trên đường tròn`);
        values[id] = { t: "line", p: at, d: unit([-radial[1], radial[0]], id, "bán kính bằng 0"), kind: "line" };
        break;
      }
      case "circle": {
        const center = pt(str(o, "center"));
        const r = typeof o.radius === "number" ? o.radius : norm(sub(pt(str(o, "through")), center));
        if (r < EPS) throw new Degenerate(id, "bán kính bằng 0");
        values[id] = { t: "circle", c: center, r };
        break;
      }
      case "circumcircle": {
        const [a, b, c] = list(o, "points").map(pt) as [Vec, Vec, Vec];
        const center = circumcenter(a, b, c, id);
        values[id] = { t: "circle", c: center, r: norm(sub(a, center)) };
        break;
      }
      case "circle_diameter": {
        const [a, b] = [pt(str(o, "a")), pt(str(o, "b"))];
        const r = norm(sub(b, a)) / 2;
        if (r < EPS) throw new Degenerate(id, "hai đầu đường kính trùng nhau");
        values[id] = { t: "circle", c: mul(add(a, b), 0.5), r };
        break;
      }
      default:
        throw new Error(`unsupported object kind ${o.kind}`);
    }
  }
  return values;
}

export const isPointKind = (kind: string) => POINT_KINDS.has(kind);

/** Circles the problem states only as a `concyclic` relation (given or goal): no declared circle passes through
 * those points, so the board draws one through the first three. */
export function relationCircles(spec: GeometrySpec, values: Values): { points: [string, string, string]; goal: boolean }[] {
  const declared = Object.values(values).filter((v): v is CircleValue => v.t === "circle");
  const seen = new Set<string>();
  const out: { points: [string, string, string]; goal: boolean }[] = [];
  for (const [goal, relations] of [[false, spec.givens ?? []], [true, spec.goals ?? []]] as const) {
    for (const r of relations) {
      if (r.kind !== "concyclic") continue;
      const ids = r.points as string[];
      const key = [...ids].sort().join(",");
      const pts = ids.map((id) => values[id]).filter((v): v is PointValue => v?.t === "point").map((v) => v.v);
      if (seen.has(key) || ids.length < 3 || pts.length !== ids.length) continue;
      seen.add(key);
      if (declared.some((c) => pts.every((p) => Math.abs(norm(sub(p, c.c)) - c.r) <= 1e-6 * Math.max(c.r, 1)))) continue;
      out.push({ points: [ids[0]!, ids[1]!, ids[2]!], goal });
    }
  }
  return out;
}

// --- relations -----------------------------------------------------------------------------------------------------

function angleAt(values: Values, names: string[]): number {
  const [a, b, c] = names.map((n) => (values[n] as PointValue).v) as [Vec, Vec, Vec];
  const u = sub(a, b), v = sub(c, b);
  const nu = norm(u), nv = norm(v);
  if (nu < EPS || nv < EPS) throw new Degenerate(names[1]!, "góc có cạnh độ dài bằng 0");
  return Math.acos(Math.max(-1, Math.min(1, dot(u, v) / (nu * nv))));
}

const P = (values: Values, n: string) => (values[n] as PointValue).v;
const len = (values: Values, pair: string[]) => norm(sub(P(values, pair[0]!), P(values, pair[1]!)));
const dir = (values: Values, pair: string[]) => unit(sub(P(values, pair[1]!), P(values, pair[0]!)), pair[0]!, "hai điểm trùng nhau");

export function residuals(rel: Relation, values: Values): number[] {
  const r = rel as Record<string, unknown>;
  switch (rel.kind) {
    case "collinear": {
      const pts = r.points as string[];
      const a = P(values, pts[0]!), b = P(values, pts[1]!);
      const u = unit(sub(b, a), pts[0]!, "hai điểm trùng nhau");
      return pts.slice(2).map((n) => {
        const p = P(values, n);
        return cross(u, sub(p, a)) / Math.max(norm(sub(p, a)), norm(sub(b, a)), EPS);
      });
    }
    case "concyclic": {
      const pts = (r.points as string[]).map((n) => P(values, n));
      const center = circumcenter(pts[0]!, pts[1]!, pts[2]!, (r.points as string[])[0]!);
      const radius = norm(sub(pts[0]!, center));
      return pts.slice(3).map((p) => (norm(sub(p, center)) - radius) / radius);
    }
    case "perpendicular": {
      const [l1, l2] = r.lines as string[][];
      return [dot(dir(values, l1!), dir(values, l2!))];
    }
    case "parallel": {
      const [l1, l2] = r.lines as string[][];
      return [cross(dir(values, l1!), dir(values, l2!))];
    }
    case "equal_length": {
      const [s1, s2] = r.segments as string[][];
      const a = len(values, s1!), b = len(values, s2!);
      return [(a - b) / Math.max((a + b) / 2, EPS)];
    }
    case "equal_angle": {
      const [a1, a2] = r.angles as string[][];
      return [angleAt(values, a1!) - angleAt(values, a2!)];
    }
    case "angle_value":
      return [angleAt(values, r.angle as string[]) - ((r.degrees as number) * Math.PI) / 180];
    case "length_ratio": {
      const [s1, s2] = r.segments as string[][];
      return [len(values, s1!) / Math.max(len(values, s2!), EPS) - (r.ratio as number)];
    }
    case "length_value":
      return [len(values, r.segment as string[]) / (r.value as number) - 1];
    case "on_circle": {
      const c = values[r.circle as string] as CircleValue;
      return [(norm(sub(P(values, r.point as string), c.c)) - c.r) / c.r];
    }
    case "on_line": {
      const line = values[r.line as string] as LineValue;
      const p = P(values, r.point as string);
      return [cross(line.d, sub(p, line.p)) / Math.max(norm(sub(p, line.p)), 1)];
    }
    case "tangent_line": {
      const c = values[r.circle as string] as CircleValue;
      const pair = r.line as string[];
      const d = dir(values, pair);
      // Same formulation as the Python engine: "radius ⊥ line" at a point of the circle (well-conditioned).
      for (const touch of [P(values, pair[1]!), P(values, pair[0]!)]) {
        if (Math.abs(norm(sub(touch, c.c)) - c.r) < 1e-6 * c.r) return [dot(unit(sub(touch, c.c), r.circle as string, "bán kính bằng 0"), d)];
      }
      return [(Math.abs(cross(d, sub(c.c, P(values, pair[0]!)))) - c.r) / c.r];
    }
    default:
      throw new Error(`unsupported relation ${rel.kind}`);
  }
}

// --- givens solver (Levenberg–Marquardt, numeric Jacobian) ----------------------------------------------------------

function givenResiduals(compiled: Compiled, params: number[]): number[] | null {
  try {
    const values = evaluate(compiled, params);
    return (compiled.spec.givens ?? []).flatMap((g) => residuals(g, values));
  } catch {
    return null;
  }
}

function solveLinear(a: number[][], b: number[]): number[] | null {
  const n = b.length;
  const m = a.map((row, i) => [...row, b[i]!]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(m[r]![col]!) > Math.abs(m[pivot]![col]!)) pivot = r;
    if (Math.abs(m[pivot]![col]!) < 1e-14) return null;
    [m[col], m[pivot]] = [m[pivot]!, m[col]!];
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = m[r]![col]! / m[col]![col]!;
      for (let k = col; k <= n; k++) m[r]![k]! -= f * m[col]![k]!;
    }
  }
  return m.map((row, i) => row[n]! / row[i]!);
}

/** Adjust non-fixed parameters so the givens hold again. Returns null when no valid figure is found nearby. */
export function solveGivens(compiled: Compiled, start: number[], fixed: number[] = [], tol = 1e-9): number[] | null {
  if (!(compiled.spec.givens ?? []).length) return start;
  const free = start.map((_, i) => i).filter((i) => !fixed.includes(i));
  let x = [...start];
  let res = givenResiduals(compiled, x);
  if (!res) return null;
  let cost = res.reduce((s, v) => s + v * v, 0);
  let lambda = 1e-3;
  for (let iter = 0; iter < 200 && Math.max(...res.map(Math.abs)) > tol; iter++) {
    const jac: number[][] = res.map(() => free.map(() => 0));
    for (let j = 0; j < free.length; j++) {
      const h = 1e-7 * Math.max(1, Math.abs(x[free[j]!]!));
      const xp = [...x];
      xp[free[j]!]! += h;
      const rp = givenResiduals(compiled, xp);
      if (!rp) return null;
      for (let i = 0; i < res.length; i++) jac[i]![j] = (rp[i]! - res[i]!) / h;
    }
    const jtj = free.map((_, a) => free.map((__, b) => jac.reduce((s, row) => s + row[a]! * row[b]!, 0)));
    const jtr = free.map((_, a) => jac.reduce((s, row, i) => s + row[a]! * res![i]!, 0));
    let improved = false;
    for (let attempt = 0; attempt < 10 && !improved; attempt++) {
      const damped = jtj.map((row, a) => row.map((v, b) => (a === b ? v * (1 + lambda) + lambda : v)));
      const step = solveLinear(damped, jtr.map((v) => -v));
      if (!step) { lambda *= 10; continue; }
      const candidate = [...x];
      free.forEach((idx, j) => { candidate[idx]! += step[j]!; });
      const r2 = givenResiduals(compiled, candidate);
      const c2 = r2 ? r2.reduce((s, v) => s + v * v, 0) : Infinity;
      if (r2 && c2 < cost) {
        x = candidate; res = r2; cost = c2; lambda = Math.max(lambda / 10, 1e-12); improved = true;
      } else {
        lambda *= 10;
      }
    }
    if (!improved) break;
  }
  return Math.max(...res.map(Math.abs)) <= Math.max(tol, 1e-7) ? x : null;
}
