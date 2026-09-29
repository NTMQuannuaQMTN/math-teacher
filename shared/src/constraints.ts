/**
 * Constraint-preserving dragging.
 *
 * A figure's construction already keeps *derived* facts true (a midpoint stays
 * a midpoint). But the model often places the vertices of the problem as free
 * points and states the problem's hypotheses as `given` checks ("AB ⊥ AC",
 * "AB = AC", "D lies on (O)"). Dragging one vertex alone would break them.
 *
 * `constrainedDrag` moves the dragged point to the pointer and then adjusts
 * every other movable parameter (free points, positions along segments/circles,
 * polar angle/length) by the smallest amount that makes the given checks true
 * again — Gauss–Newton with minimum-norm steps, so nearby solutions win and
 * the figure doesn't jump. If the pointer position can't satisfy the givens,
 * it tries part of the way there, and otherwise refuses the move.
 */
import {
  angleDeg,
  dist,
  dragTo,
  evaluateFigureCheck,
  figureBounds,
  resolveFigure,
  type Override,
  type ResolvedFigure,
  type Vec,
} from "./geometry";
import type { Figure, FigureCheck, PointDef } from "./solution";

type Overrides = Record<string, Override>;

interface Param {
  id: string;
  key: "x" | "y" | "value" | "value2";
  /** Value that counts as "one unit" of change, so different kinds of parameters are comparable. */
  scale: number;
  /** Stay inside (0, 1) — for a point that was placed between a segment's endpoints. */
  unitInterval: boolean;
}

const DEG = 180 / Math.PI;
const MAX_ITERATIONS = 40;
const RESIDUAL_TOL = 1e-10;
const FD_STEP = 1e-6;
const MISSING = 10;

function currentValue(def: PointDef, overrides: Overrides, key: Param["key"]): number | null {
  const o = overrides[def.id];
  if (key === "x" || key === "y") return o && key in o ? (o as Vec)[key] : def[key];
  if (key === "value") return o && "value" in o ? o.value : def.value;
  return o && "value2" in o && o.value2 !== undefined ? o.value2 : def.value2;
}

function paramsOf(def: PointDef, size: number): Param[] {
  switch (def.kind) {
    case "free":
      return [
        { id: def.id, key: "x", scale: size, unitInterval: false },
        { id: def.id, key: "y", scale: size, unitInterval: false },
      ];
    case "on_segment": {
      const t = def.value ?? 0;
      return [{ id: def.id, key: "value", scale: 1, unitInterval: t >= 0 && t <= 1 }];
    }
    case "on_circle":
      return [{ id: def.id, key: "value", scale: DEG, unitInterval: false }];
    case "polar":
      return [
        { id: def.id, key: "value", scale: DEG, unitInterval: false },
        { id: def.id, key: "value2", scale: size, unitInterval: false },
      ];
    default:
      return [];
  }
}

function toOverrides(base: Overrides, params: Param[], values: number[], defs: Map<string, PointDef>): Overrides {
  const out: Overrides = { ...base };
  const byPoint = new Map<string, Partial<Record<Param["key"], number>>>();
  params.forEach((p, i) => byPoint.set(p.id, { ...byPoint.get(p.id), [p.key]: values[i]! }));
  for (const [id, v] of byPoint) {
    const def = defs.get(id)!;
    if (def.kind === "free") out[id] = { x: v.x!, y: v.y! };
    else if (def.kind === "polar") out[id] = { value: v.value!, value2: v.value2! };
    else out[id] = { value: v.value! };
  }
  return out;
}

function circumcenter(a: Vec, b: Vec, c: Vec): Vec | null {
  const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
  if (Math.abs(d) < 1e-12) return null;
  const a2 = a.x * a.x + a.y * a.y;
  const b2 = b.x * b.x + b.y * b.y;
  const c2 = c.x * c.x + c.y * c.y;
  return {
    x: (a2 * (b.y - c.y) + b2 * (c.y - a.y) + c2 * (a.y - b.y)) / d,
    y: (a2 * (c.x - b.x) + b2 * (a.x - c.x) + c2 * (b.x - a.x)) / d,
  };
}

/** Smooth, dimensionless residual of a check: 0 exactly when the check holds. */
function residual(check: FigureCheck, r: ResolvedFigure, size: number): number {
  const p = (i: number) => (check.refs[i] ? r.points[check.refs[i]!] : undefined);
  const pts = (n: number) => {
    const out: Vec[] = [];
    for (let i = 0; i < n; i++) {
      const q = p(i);
      if (!q) return null;
      out.push(q);
    }
    return out;
  };
  const dirs = () => {
    const q = pts(4);
    if (!q) return null;
    const u = { x: q[1]!.x - q[0]!.x, y: q[1]!.y - q[0]!.y };
    const w = { x: q[3]!.x - q[2]!.x, y: q[3]!.y - q[2]!.y };
    const n = Math.hypot(u.x, u.y) * Math.hypot(w.x, w.y);
    return n > 1e-12 ? { u, w, n } : null;
  };
  switch (check.kind) {
    case "perpendicular": {
      const d = dirs();
      return d ? (d.u.x * d.w.x + d.u.y * d.w.y) / d.n : MISSING;
    }
    case "parallel": {
      const d = dirs();
      return d ? (d.u.x * d.w.y - d.u.y * d.w.x) / d.n : MISSING;
    }
    case "collinear": {
      const q = pts(3);
      if (!q) return MISSING;
      const u = { x: q[1]!.x - q[0]!.x, y: q[1]!.y - q[0]!.y };
      const w = { x: q[2]!.x - q[0]!.x, y: q[2]!.y - q[0]!.y };
      const n = Math.hypot(u.x, u.y) * Math.hypot(w.x, w.y);
      return n > 1e-12 ? (u.x * w.y - u.y * w.x) / n : MISSING;
    }
    case "equal_length": {
      const q = pts(4);
      return q ? (dist(q[0]!, q[1]!) - dist(q[2]!, q[3]!)) / size : MISSING;
    }
    case "length_value": {
      const q = pts(2);
      return q && check.value !== null ? (dist(q[0]!, q[1]!) - check.value) / size : MISSING;
    }
    case "length_ratio": {
      const q = pts(4);
      if (!q || check.value === null) return MISSING;
      const b = dist(q[2]!, q[3]!);
      return b > 1e-12 ? dist(q[0]!, q[1]!) / b - check.value : MISSING;
    }
    case "angle_value": {
      const q = pts(3);
      if (!q || check.value === null) return MISSING;
      const a = angleDeg(q[0]!, q[1]!, q[2]!);
      return Number.isFinite(a) ? (a - check.value) / DEG : MISSING;
    }
    case "equal_angle": {
      const q = pts(6);
      if (!q) return MISSING;
      const d = angleDeg(q[0]!, q[1]!, q[2]!) - angleDeg(q[3]!, q[4]!, q[5]!);
      return Number.isFinite(d) ? d / DEG : MISSING;
    }
    case "on_circle": {
      const q = p(0);
      const c = check.refs[1] ? r.circles[check.refs[1]] : undefined;
      return q && c ? (dist(q, { x: c.cx, y: c.cy }) - c.r) / size : MISSING;
    }
    case "concyclic": {
      const q = pts(4);
      const o = q ? circumcenter(q[0]!, q[1]!, q[2]!) : null;
      return q && o ? (dist(o, q[3]!) - dist(o, q[0]!)) / size : MISSING;
    }
  }
}

/** Solves the m×m system A·x = b (Gaussian elimination with partial pivoting). */
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
      if (f !== 0) for (let c = col; c <= n; c++) m[r]![c]! -= f * m[col]![c]!;
    }
  }
  return m.map((row, i) => row[n]! / row[i]!);
}

/**
 * Adjusts `params` (starting from `start`) until every check's residual is ~0,
 * changing them as little as possible. Returns the solved values or null.
 */
function solve(
  figure: Figure,
  base: Overrides,
  params: Param[],
  start: number[],
  checks: FigureCheck[],
  defs: Map<string, PointDef>,
  size: number,
): number[] | null {
  const evalAt = (z: number[]) => {
    const values = z.map((v, i) => v * params[i]!.scale);
    const r = resolveFigure(figure, toOverrides(base, params, values, defs));
    return checks.map((c) => residual(c, r, size));
  };
  const norm = (r: number[]) => r.reduce((s, v) => s + v * v, 0);

  let z = start.map((v, i) => v / params[i]!.scale);
  let res = evalAt(z);
  for (let it = 0; it < MAX_ITERATIONS && norm(res) > RESIDUAL_TOL; it++) {
    // Numeric Jacobian (checks × params) in scaled units.
    const jac = checks.map(() => new Array<number>(z.length).fill(0));
    z.forEach((_, j) => {
      const zj = [...z];
      zj[j]! += FD_STEP;
      const rj = evalAt(zj);
      rj.forEach((v, i) => (jac[i]![j] = (v - res[i]!) / FD_STEP));
    });
    // Minimum-norm (damped) step: dz = -Jᵀ (J Jᵀ + λI)⁻¹ r.
    const lambda = 1e-9 + 1e-3 * norm(res);
    const jjt = jac.map((ri, i) => jac.map((rk, k) => ri.reduce((s, v, j) => s + v * rk[j]!, 0) + (i === k ? lambda : 0)));
    const y = solveLinear(jjt, res);
    if (!y) return null;
    const dz = z.map((_, j) => -jac.reduce((s, row, i) => s + row[j]! * y[i]!, 0));
    // Backtrack if the full step overshoots.
    let step = 1;
    let accepted = false;
    for (let k = 0; k < 6; k++, step /= 2) {
      const zn = z.map((v, j) => v + step * dz[j]!);
      const rn = evalAt(zn);
      if (norm(rn) < norm(res)) {
        z = zn;
        res = rn;
        accepted = true;
        break;
      }
    }
    if (!accepted) return null;
  }
  if (norm(res) > RESIDUAL_TOL) return null;
  return z.map((v, i) => v * params[i]!.scale);
}

/**
 * True if two points that were clearly apart now (nearly) coincide — the solver
 * can "satisfy" e.g. BD = DC by shrinking BC to nothing, which isn't a real figure.
 */
function collapses(before: ResolvedFigure, after: ResolvedFigure, size: number): boolean {
  const ids = Object.keys(after.points);
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const [a0, b0, a1, b1] = [before.points[ids[i]!], before.points[ids[j]!], after.points[ids[i]!], after.points[ids[j]!]];
      if (a0 && b0 && a1 && b1 && dist(a0, b0) > 0.05 * size && dist(a1, b1) < 0.02 * size) return true;
    }
  }
  return false;
}

/** The given checks the figure satisfies right now — the ones a drag must keep. */
export function heldGivens(figure: Figure, resolved: ResolvedFigure): FigureCheck[] {
  return figure.checks.filter((c) => c.role === "given" && evaluateFigureCheck(c, resolved).passed);
}

/**
 * Drags point `dragId` toward `world` while keeping the problem's given facts
 * true. Returns the new overrides, or null when the point can't move there.
 */
export function constrainedDrag(figure: Figure, overrides: Overrides, dragId: string, world: Vec): Overrides | null {
  const defs = new Map(figure.points.map((p) => [p.id, p]));
  const dragged = defs.get(dragId);
  if (!dragged) return null;
  const resolved = resolveFigure(figure, overrides);
  const from = resolved.points[dragId];
  const givens = heldGivens(figure, resolved);

  const bounds = figureBounds(resolved);
  const size = bounds ? Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY, 1e-6) : 1;
  const params = figure.points
    .filter((p) => p.id !== dragId)
    .flatMap((p) => paramsOf(p, size))
    .filter((p) => currentValue(defs.get(p.id)!, overrides, p.key) !== null);
  const start = params.map((p) => currentValue(defs.get(p.id)!, overrides, p.key)!);

  const tryTarget = (target: Vec): Overrides | null => {
    const move = dragTo(dragged, resolved, target);
    if (!move) return null;
    const next = { ...overrides, [dragId]: move };
    if (givens.length === 0) return next;
    const r0 = resolveFigure(figure, next);
    if (givens.every((c) => evaluateFigureCheck(c, r0).passed)) return next;
    if (params.length === 0) return null;
    const values = solve(figure, next, params, start, givens, defs, size);
    if (!values) return null;
    if (values.some((v, i) => params[i]!.unitInterval && (v <= 0.01 || v >= 0.99))) return null;
    const solved = toOverrides(next, params, values, defs);
    const r = resolveFigure(figure, solved);
    // Accept only if the givens hold and nothing in the construction broke (e.g. lines became parallel).
    if (r.errors.length > resolved.errors.length) return null;
    if (!givens.every((c) => evaluateFigureCheck(c, r).passed)) return null;
    if (collapses(resolved, r, size)) return null;
    return solved;
  };

  const full = tryTarget(world);
  if (full || !from) return full;
  // Fast drags can ask for something unreachable in one go: try moving part of the way.
  for (const f of [0.5, 0.25]) {
    const partial = tryTarget({ x: from.x + (world.x - from.x) * f, y: from.y + (world.y - from.y) * f });
    if (partial) return partial;
  }
  return null;
}
