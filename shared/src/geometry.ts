/**
 * Geometry construction engine (platform-independent).
 *
 * A figure is described by *how it is constructed*, like in GeoGebra —
 * "M is the midpoint of BC", "H is the foot of the perpendicular from A to
 * BC" — not by pixel positions. This engine resolves the construction to
 * coordinates. Because constructions are exact, the same engine can:
 *   - verify that the figure satisfies the problem's givens (server),
 *   - render the figure and keep it consistent while free points are
 *     dragged (client).
 *
 * Coordinates are mathematical (y up). Renderers flip y.
 */
import type { Figure, FigureCheck, PointDef } from "./solution";

export interface Vec {
  x: number;
  y: number;
}
export interface CircleGeom {
  cx: number;
  cy: number;
  r: number;
}
export interface ResolvedFigure {
  points: Record<string, Vec>;
  circles: Record<string, CircleGeom>;
  errors: string[];
}

const EPS = 1e-9;
const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y });
const sub = (a: Vec, b: Vec): Vec => ({ x: a.x - b.x, y: a.y - b.y });
const mul = (a: Vec, k: number): Vec => ({ x: a.x * k, y: a.y * k });
const dot = (a: Vec, b: Vec): number => a.x * b.x + a.y * b.y;
const cross = (a: Vec, b: Vec): number => a.x * b.y - a.y * b.x;
export const dist = (a: Vec, b: Vec): number => Math.hypot(a.x - b.x, a.y - b.y);
const rad = (deg: number) => (deg * Math.PI) / 180;

function lineIntersection(a: Vec, b: Vec, c: Vec, d: Vec): Vec | null {
  const r = sub(b, a);
  const s = sub(d, c);
  const denom = cross(r, s);
  if (Math.abs(denom) < EPS * Math.max(1, dot(r, r), dot(s, s))) return null;
  const t = cross(sub(c, a), s) / denom;
  return add(a, mul(r, t));
}

function foot(p: Vec, a: Vec, b: Vec): Vec | null {
  const d = sub(b, a);
  const len2 = dot(d, d);
  if (len2 < EPS) return null;
  return add(a, mul(d, dot(sub(p, a), d) / len2));
}

function rotate(p: Vec, o: Vec, deg: number): Vec {
  const c = Math.cos(rad(deg));
  const s = Math.sin(rad(deg));
  const v = sub(p, o);
  return { x: o.x + v.x * c - v.y * s, y: o.y + v.x * s + v.y * c };
}

function lineCircle(a: Vec, b: Vec, c: CircleGeom): Vec[] {
  const d = sub(b, a);
  const f = sub(a, { x: c.cx, y: c.cy });
  const A = dot(d, d);
  const B = 2 * dot(f, d);
  const C = dot(f, f) - c.r * c.r;
  let disc = B * B - 4 * A * C;
  if (A < EPS) return [];
  if (disc < 0) {
    if (disc > -1e-7 * B * B) disc = 0;
    else return [];
  }
  const sq = Math.sqrt(disc);
  return [(-B - sq) / (2 * A), (-B + sq) / (2 * A)].map((t) => add(a, mul(d, t)));
}

/** Intersections of two circles, ordered: the first lies to the left of the line c1 → c2. */
function circleCircle(c1: CircleGeom, c2: CircleGeom): Vec[] {
  const d = Math.hypot(c2.cx - c1.cx, c2.cy - c1.cy);
  if (d < EPS || d > c1.r + c2.r + EPS || d < Math.abs(c1.r - c2.r) - EPS) return [];
  const a = (c1.r * c1.r - c2.r * c2.r + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, c1.r * c1.r - a * a));
  const ux = (c2.cx - c1.cx) / d;
  const uy = (c2.cy - c1.cy) / d;
  const mx = c1.cx + a * ux;
  const my = c1.cy + a * uy;
  return [
    { x: mx - h * uy, y: my + h * ux },
    { x: mx + h * uy, y: my - h * ux },
  ];
}

function tangentPoints(p: Vec, c: CircleGeom): Vec[] {
  const o = { x: c.cx, y: c.cy };
  const d = dist(p, o);
  if (d <= c.r + EPS) return [];
  const base = Math.atan2(p.y - o.y, p.x - o.x);
  const off = Math.acos(c.r / d);
  return [base + off, base - off].map((t) => ({ x: o.x + c.r * Math.cos(t), y: o.y + c.r * Math.sin(t) }));
}

function triangleCenter(kind: string, a: Vec, b: Vec, c: Vec): Vec | null {
  switch (kind) {
    case "centroid":
      return { x: (a.x + b.x + c.x) / 3, y: (a.y + b.y + c.y) / 3 };
    case "circumcenter": {
      const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
      if (Math.abs(d) < EPS) return null;
      const a2 = dot(a, a);
      const b2 = dot(b, b);
      const c2 = dot(c, c);
      return {
        x: (a2 * (b.y - c.y) + b2 * (c.y - a.y) + c2 * (a.y - b.y)) / d,
        y: (a2 * (c.x - b.x) + b2 * (a.x - c.x) + c2 * (b.x - a.x)) / d,
      };
    }
    case "incenter": {
      const la = dist(b, c);
      const lb = dist(a, c);
      const lc = dist(a, b);
      const s = la + lb + lc;
      if (s < EPS) return null;
      return { x: (la * a.x + lb * b.x + lc * c.x) / s, y: (la * a.y + lb * b.y + lc * c.y) / s };
    }
    case "orthocenter": {
      const fa = foot(a, b, c);
      const fb = foot(b, a, c);
      if (!fa || !fb) return null;
      return lineIntersection(a, fa, b, fb);
    }
  }
  return null;
}

/**
 * A student's drag, GeoGebra-style: free points get a new position; points
 * on an object (segment, circle) get a new parameter, so they slide along it.
 */
export type Override = { x: number; y: number } | { value: number; value2?: number };

/** Which points the student can drag. Dependent points follow their construction instead. */
export function isDraggable(def: PointDef): boolean {
  return !def.hidden && (def.kind === "free" || def.kind === "on_segment" || def.kind === "on_circle" || def.kind === "polar");
}

/**
 * Converts a pointer position (world coordinates) into an override for a
 * draggable point: free points follow the pointer, points on a segment
 * slide along it (staying between the endpoints if they started there),
 * points on a circle move around it.
 */
export function dragTo(def: PointDef, resolved: ResolvedFigure, world: Vec): Override | null {
  switch (def.kind) {
    case "free":
      return { x: world.x, y: world.y };
    case "on_segment": {
      const a = def.refs[0] ? resolved.points[def.refs[0]] : undefined;
      const b = def.refs[1] ? resolved.points[def.refs[1]] : undefined;
      if (!a || !b) return null;
      const d = sub(b, a);
      const len2 = dot(d, d);
      if (len2 < EPS) return null;
      let t = dot(sub(world, a), d) / len2;
      const original = def.value ?? 0;
      if (original >= 0 && original <= 1) t = Math.min(0.97, Math.max(0.03, t));
      return { value: t };
    }
    case "on_circle": {
      const c = def.refs[0] ? resolved.circles[def.refs[0]] : undefined;
      if (!c) return null;
      return { value: (Math.atan2(world.y - c.cy, world.x - c.cx) * 180) / Math.PI };
    }
    case "polar": {
      // A point at a fixed distance/direction from its base: dragging sets a new distance and direction.
      const base = def.refs[0] ? resolved.points[def.refs[0]] : undefined;
      if (!base) return null;
      const d = sub(world, base);
      const length = Math.hypot(d.x, d.y);
      if (length < EPS) return null;
      return { value: (Math.atan2(d.y, d.x) * 180) / Math.PI, value2: length };
    }
    default:
      return null;
  }
}

/** Points/circles a point definition depends on. */
function dependencies(def: PointDef): string[] {
  return def.kind === "free" ? [] : def.refs;
}

/**
 * Resolves every point and circle. `overrides` replaces free-point
 * positions (used while dragging). Never throws: problems are reported
 * in `errors` and the affected objects are omitted.
 */
export function resolveFigure(figure: Figure, overrides: Record<string, Override> = {}): ResolvedFigure {
  const points: Record<string, Vec> = {};
  const circles: Record<string, CircleGeom> = {};
  const errors: string[] = [];
  const pointDefs = new Map(figure.points.map((p) => [p.id, p]));
  const circleDefs = new Map(figure.circles.map((c) => [c.id, c]));
  const visiting = new Set<string>();

  const resolveCircle = (id: string): CircleGeom | null => {
    if (circles[id]) return circles[id]!;
    const def = circleDefs.get(id);
    if (!def) return null;
    if (visiting.has(id)) {
      errors.push(`cycle at circle ${id}`);
      return null;
    }
    visiting.add(id);
    const center = resolvePoint(def.center);
    let r: number | null = null;
    if (center && def.through) {
      const t = resolvePoint(def.through);
      if (t) r = dist(center, t);
    } else if (def.radius !== null && def.radius > 0) {
      r = def.radius;
    }
    visiting.delete(id);
    if (!center || r === null || !(r > EPS) || !Number.isFinite(r)) {
      errors.push(`circle ${id} could not be constructed`);
      return null;
    }
    circles[id] = { cx: center.x, cy: center.y, r };
    return circles[id]!;
  };

  const resolvePoint = (id: string): Vec | null => {
    if (points[id]) return points[id]!;
    const def = pointDefs.get(id);
    if (!def) return null;
    if (visiting.has(id)) {
      errors.push(`cycle at point ${id}`);
      return null;
    }
    visiting.add(id);
    const p = computePoint(def);
    visiting.delete(id);
    if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) {
      errors.push(`point ${id} (${def.kind}) could not be constructed`);
      return null;
    }
    points[id] = p;
    return p;
  };

  const pt = (i: number, def: PointDef): Vec | null => {
    const ref = def.refs[i];
    return ref ? resolvePoint(ref) : null;
  };

  const computePoint = (def: PointDef): Vec | null => {
    const override = overrides[def.id];
    const v = override && "value" in override ? override.value : (def.value ?? 0);
    switch (def.kind) {
      case "free":
        if (override && "x" in override) return { x: override.x, y: override.y };
        return def.x !== null && def.y !== null ? { x: def.x, y: def.y } : null;
      case "polar": {
        const base = pt(0, def);
        const length = override && "value2" in override && override.value2 !== undefined ? override.value2 : def.value2;
        if (!base || def.value === null || length === null) return null;
        return { x: base.x + length * Math.cos(rad(v)), y: base.y + length * Math.sin(rad(v)) };
      }
      case "midpoint": {
        const a = pt(0, def);
        const b = pt(1, def);
        return a && b ? mul(add(a, b), 0.5) : null;
      }
      case "on_segment": {
        const a = pt(0, def);
        const b = pt(1, def);
        return a && b ? add(a, mul(sub(b, a), v)) : null;
      }
      case "foot": {
        const p = pt(0, def);
        const a = pt(1, def);
        const b = pt(2, def);
        return p && a && b ? foot(p, a, b) : null;
      }
      case "intersection": {
        const [a, b, c, d] = [pt(0, def), pt(1, def), pt(2, def), pt(3, def)];
        return a && b && c && d ? lineIntersection(a, b, c, d) : null;
      }
      case "line_circle": {
        const a = pt(0, def);
        const b = pt(1, def);
        const circle = def.refs[2] ? resolveCircle(def.refs[2]) : null;
        if (!a || !b || !circle) return null;
        const hits = lineCircle(a, b, circle).sort((p, q) => dist(p, a) - dist(q, a));
        if (hits.length === 0) return null;
        return v >= 1 ? hits[hits.length - 1]! : hits[0]!;
      }
      case "circle_circle": {
        const c1 = def.refs[0] ? resolveCircle(def.refs[0]) : null;
        const c2 = def.refs[1] ? resolveCircle(def.refs[1]) : null;
        if (!c1 || !c2) return null;
        const hits = circleCircle(c1, c2);
        if (hits.length === 0) return null;
        // "The intersection other than P": the one farther from P (P is usually the other hit).
        const other = def.refs[2] ? resolvePoint(def.refs[2]) : null;
        if (def.refs[2] && !other) return null;
        if (other) return dist(hits[0]!, other) >= dist(hits[1]!, other) ? hits[0]! : hits[1]!;
        return hits[v >= 1 ? 1 : 0]!;
      }
      case "on_circle": {
        const circle = def.refs[0] ? resolveCircle(def.refs[0]) : null;
        if (!circle) return null;
        return { x: circle.cx + circle.r * Math.cos(rad(v)), y: circle.cy + circle.r * Math.sin(rad(v)) };
      }
      case "tangent": {
        const p = pt(0, def);
        const circle = def.refs[1] ? resolveCircle(def.refs[1]) : null;
        if (!p || !circle) return null;
        const hits = tangentPoints(p, circle);
        return hits[v >= 1 ? 1 : 0] ?? null;
      }
      case "reflect": {
        const p = pt(0, def);
        if (!p) return null;
        if (def.refs.length === 2) {
          const o = pt(1, def);
          return o ? sub(mul(o, 2), p) : null;
        }
        const a = pt(1, def);
        const b = pt(2, def);
        const f = p && a && b ? foot(p, a, b) : null;
        return f ? sub(mul(f, 2), p) : null;
      }
      case "rotate": {
        const p = pt(0, def);
        const o = pt(1, def);
        return p && o ? rotate(p, o, v) : null;
      }
      case "translate": {
        const p = pt(0, def);
        const a = pt(1, def);
        const b = pt(2, def);
        return p && a && b ? add(p, mul(sub(b, a), def.value ?? 1)) : null;
      }
      case "centroid":
      case "circumcenter":
      case "incenter":
      case "orthocenter": {
        const [a, b, c] = [pt(0, def), pt(1, def), pt(2, def)];
        return a && b && c ? triangleCenter(def.kind, a, b, c) : null;
      }
    }
  };

  for (const def of figure.points) resolvePoint(def.id);
  for (const def of figure.circles) resolveCircle(def.id);
  // Points referencing circles may have been attempted before the circle; that's fine (lazy).
  for (const p of figure.points) {
    for (const dep of dependencies(p)) {
      if (!pointDefs.has(dep) && !circleDefs.has(dep)) errors.push(`point ${p.id} references unknown ${dep}`);
    }
  }
  return { points, circles, errors: [...new Set(errors)] };
}

/** Interior angle ∠AVB in degrees (0–180). */
export function angleDeg(a: Vec, v: Vec, b: Vec): number {
  const u = sub(a, v);
  const w = sub(b, v);
  const d = Math.hypot(u.x, u.y) * Math.hypot(w.x, w.y);
  if (d < EPS) return NaN;
  return (Math.acos(Math.max(-1, Math.min(1, dot(u, w) / d))) * 180) / Math.PI;
}

export interface CheckResult {
  check: FigureCheck;
  passed: boolean;
  /** Human-readable measured value, for logs and model feedback. */
  detail: string;
}

/** Evaluates a figure check against resolved coordinates (tolerance relative to figure size). */
export function evaluateFigureCheck(check: FigureCheck, resolved: ResolvedFigure): CheckResult {
  const p = (i: number) => {
    const ref = check.refs[i];
    return ref ? resolved.points[ref] : undefined;
  };
  const need = (n: number) => check.refs.length >= n && check.refs.slice(0, n).every((_, i) => p(i));
  const fail = (detail: string): CheckResult => ({ check, passed: false, detail });
  const ok = (passed: boolean, detail: string): CheckResult => ({ check, passed, detail });
  const relEq = (a: number, b: number, tol = 2e-3) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

  switch (check.kind) {
    case "equal_length": {
      if (!need(4)) return fail("missing points");
      const a = dist(p(0)!, p(1)!);
      const b = dist(p(2)!, p(3)!);
      return ok(relEq(a, b), `${a.toFixed(3)} vs ${b.toFixed(3)}`);
    }
    case "length_value": {
      if (!need(2) || check.value === null) return fail("missing points/value");
      const a = dist(p(0)!, p(1)!);
      return ok(relEq(a, check.value), `measured ${a.toFixed(3)}, expected ${check.value}`);
    }
    case "length_ratio": {
      if (!need(4) || check.value === null) return fail("missing points/value");
      const a = dist(p(0)!, p(1)!);
      const b = dist(p(2)!, p(3)!);
      return ok(b > EPS && relEq(a / b, check.value), `ratio ${(a / b).toFixed(4)}, expected ${check.value}`);
    }
    case "angle_value": {
      if (!need(3) || check.value === null) return fail("missing points/value");
      const a = angleDeg(p(0)!, p(1)!, p(2)!);
      return ok(Math.abs(a - check.value) <= 0.2, `measured ${a.toFixed(2)}°, expected ${check.value}°`);
    }
    case "equal_angle": {
      if (!need(6)) return fail("missing points");
      const a = angleDeg(p(0)!, p(1)!, p(2)!);
      const b = angleDeg(p(3)!, p(4)!, p(5)!);
      return ok(Math.abs(a - b) <= 0.2, `${a.toFixed(2)}° vs ${b.toFixed(2)}°`);
    }
    case "perpendicular": {
      if (!need(4)) return fail("missing points");
      const u = sub(p(1)!, p(0)!);
      const w = sub(p(3)!, p(2)!);
      const cos = Math.abs(dot(u, w)) / (Math.hypot(u.x, u.y) * Math.hypot(w.x, w.y) || 1);
      return ok(cos < 3e-3, `cos=${cos.toFixed(4)}`);
    }
    case "parallel": {
      if (!need(4)) return fail("missing points");
      const u = sub(p(1)!, p(0)!);
      const w = sub(p(3)!, p(2)!);
      const sin = Math.abs(cross(u, w)) / (Math.hypot(u.x, u.y) * Math.hypot(w.x, w.y) || 1);
      return ok(sin < 3e-3, `sin=${sin.toFixed(4)}`);
    }
    case "collinear": {
      if (!need(3)) return fail("missing points");
      const u = sub(p(1)!, p(0)!);
      const w = sub(p(2)!, p(0)!);
      const sin = Math.abs(cross(u, w)) / (Math.hypot(u.x, u.y) * Math.hypot(w.x, w.y) || 1);
      return ok(sin < 3e-3, `sin=${sin.toFixed(4)}`);
    }
    case "on_circle": {
      // refs: [point, circleId]
      const point = p(0);
      const circle = check.refs[1] ? resolved.circles[check.refs[1]] : undefined;
      if (!point || !circle) return fail("missing point/circle");
      const d = dist(point, { x: circle.cx, y: circle.cy });
      return ok(relEq(d, circle.r), `distance ${d.toFixed(3)} vs radius ${circle.r.toFixed(3)}`);
    }
    case "concyclic": {
      if (!need(4)) return fail("missing points");
      const [a, b, c, d] = [p(0)!, p(1)!, p(2)!, p(3)!];
      const o = triangleCenter("circumcenter", a, b, c);
      if (!o) return fail("first three points are collinear");
      return ok(relEq(dist(o, d), dist(o, a)), `r=${dist(o, a).toFixed(3)} vs ${dist(o, d).toFixed(3)}`);
    }
  }
}

// ---------------------------------------------------------------------------
// View helpers (used by renderers)
// ---------------------------------------------------------------------------

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function figureBounds(resolved: ResolvedFigure, visiblePointIds?: Set<string>): Bounds | null {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const [id, p] of Object.entries(resolved.points)) {
    if (visiblePointIds && !visiblePointIds.has(id)) continue;
    xs.push(p.x);
    ys.push(p.y);
  }
  for (const c of Object.values(resolved.circles)) {
    xs.push(c.cx - c.r, c.cx + c.r);
    ys.push(c.cy - c.r, c.cy + c.r);
  }
  if (xs.length === 0) return null;
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
}

/** World → screen transform that fits `bounds` into a width×height box with padding (y flipped). */
export interface ViewTransform {
  scale: number;
  tx: number;
  ty: number;
}

export function fitTransform(bounds: Bounds, width: number, height: number, padding = 36): ViewTransform {
  const w = Math.max(bounds.maxX - bounds.minX, 1e-6);
  const h = Math.max(bounds.maxY - bounds.minY, 1e-6);
  const scale = Math.min((width - 2 * padding) / w, (height - 2 * padding) / h);
  const tx = (width - w * scale) / 2 - bounds.minX * scale;
  const ty = (height - h * scale) / 2 + bounds.maxY * scale;
  return { scale, tx, ty };
}

export const toScreen = (p: Vec, t: ViewTransform): Vec => ({ x: p.x * t.scale + t.tx, y: -p.y * t.scale + t.ty });
export const toWorld = (s: Vec, t: ViewTransform): Vec => ({ x: (s.x - t.tx) / t.scale, y: -(s.y - t.ty) / t.scale });

/** Zoom by `factor` keeping the screen point `focus` fixed. */
export function zoomAt(t: ViewTransform, factor: number, focus: Vec): ViewTransform {
  const scale = t.scale * factor;
  return { scale, tx: focus.x - (focus.x - t.tx) * factor, ty: focus.y - (focus.y - t.ty) * factor };
}

/** Distance from point p to segment ab (screen space). */
export function distToSegment(p: Vec, a: Vec, b: Vec): number {
  const d = sub(b, a);
  const len2 = dot(d, d);
  if (len2 < EPS) return dist(p, a);
  const t = Math.max(0, Math.min(1, dot(sub(p, a), d) / len2));
  return dist(p, add(a, mul(d, t)));
}

/** Extends segment AB to the edges of a large box (for "line" and "ray" elements). */
export function extendLine(a: Vec, b: Vec, kind: "line" | "ray", reach: number): [Vec, Vec] {
  const d = sub(b, a);
  const len = Math.hypot(d.x, d.y);
  if (len < EPS) return [a, b];
  const u = mul(d, reach / len);
  return kind === "ray" ? [a, add(a, u)] : [sub(a, u), add(a, u)];
}
