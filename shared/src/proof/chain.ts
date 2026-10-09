/**
 * Writes an algebraic step (angle chase, length algebra) the way a textbook does: a chain of equalities from one side
 * of the claim to the other, each "=" justified by one fact.
 *
 *   ∠ADJ = ∠IDJ − ∠IDA      (tia DA nằm giữa hai tia DI, DJ)
 *        = ∠ILD − ∠IDA      (△ILD cân tại I)
 *        = …
 *
 * Angles are named undirected angles (vertex + two rays, read from the figure: points on the same ray name the same
 * angle). Rules come from the step's premises (equal angles, isosceles triangles, similar triangles, inscribed angles,
 * right angles) plus what the figure's configuration gives at the vertices involved (one ray between two others,
 * linear pairs, vertical angles, the angle sum of a triangle). Lengths are products of segments (log-linear).
 * The chain is found by a bounded breadth-first search over substitutions; null when none is found (the caller then
 * keeps the plain list of facts). It only re-expresses a step the verifier already accepted.
 */
import { factPoints as factPointsOf, type Fact, type Factor, type Seg, type Tri } from "./facts";

type Pt = { x: number; y: number };
interface Expr {
  terms: Map<string, number>;
  c: number;
}
interface Rule {
  /** Σ coef·var = c */
  coef: Map<string, number>;
  c: number;
  reason: string;
}

const EPS = 1e-9;
const key = (e: Expr) =>
  [...e.terms]
    .filter(([, v]) => Math.abs(v) > EPS)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([k, v]) => `${k}:${Math.round(v * 1e6) / 1e6}`)
    .join("|") + `#${Math.round(e.c * 1e6) / 1e6}`;

function substitute(e: Expr, r: Rule, v: string, integral: boolean): Expr | null {
  const ev = e.terms.get(v) ?? 0;
  const rv = r.coef.get(v) ?? 0;
  if (Math.abs(ev) < EPS || Math.abs(rv) < EPS) return null;
  const k = ev / rv;
  if (integral && Math.abs(k - Math.round(k)) > EPS) return null;
  const terms = new Map(e.terms);
  for (const [x, a] of r.coef) {
    const next = (terms.get(x) ?? 0) - k * a;
    if (Math.abs(next) < EPS) terms.delete(x);
    else terms.set(x, next);
  }
  return { terms, c: e.c + k * r.c };
}

/** Breadth-first search from both ends; each move rewrites one variable with one rule. The two halves meet at a common
 *  expression (e.g. "90°"), and the path is start → meet → goal. */
function search(start: Expr, goal: Expr, rules: Rule[], integral: boolean, maxDepth = 6, maxNodes = 150000): { expr: Expr; reason: string }[] | null {
  type Node = { prev: string | null; expr: Expr; reason: string };
  const grow = (from: Expr) => new Map<string, Node>([[key(from), { prev: null, expr: from, reason: "" }]]);
  const A = grow(start);
  const B = grow(goal);
  const pathTo = (m: Map<string, Node>, k: string) => {
    const out: { expr: Expr; reason: string }[] = [];
    for (let cur: string | null = k; cur !== null; cur = m.get(cur)!.prev) out.unshift({ expr: m.get(cur)!.expr, reason: m.get(cur)!.reason });
    return out; // [from, …, k]
  };
  const join = (k: string) => {
    const a = pathTo(A, k); // start … meet
    const b = pathTo(B, k); // goal … meet
    const steps = a.slice(1).map((x) => ({ expr: x.expr, reason: x.reason }));
    // meet = b[n] ← … ← b[0] = goal: walking back, the move into b[i] justifies the "=" from b[i] to b[i-1].
    for (let i = b.length - 1; i >= 1; i--) steps.push({ expr: b[i - 1]!.expr, reason: b[i]!.reason });
    return steps;
  };
  if (B.has(key(start))) return join(key(start));
  let fa = [start];
  let fb = [goal];
  for (let depth = 0; depth < maxDepth; depth++) {
    for (const [mine, other, side] of [[A, B, "a"], [B, A, "b"]] as const) {
      const next: Expr[] = [];
      for (const e of side === "a" ? fa : fb)
        for (const r of rules)
          for (const v of e.terms.keys()) {
            const n = substitute(e, r, v, integral);
            // Whole exponents and coefficients only ("IJ^0.5" is not something a student writes).
            if (!n || n.terms.size > (integral ? 4 : 6) || [...n.terms.values()].some((x) => Math.abs(x - Math.round(x)) > 1e-9)) continue;
            const k = key(n);
            if (mine.has(k)) continue;
            mine.set(k, { prev: key(e), expr: n, reason: r.reason });
            if (other.has(k)) return join(k);
            next.push(n);
            if (mine.size > maxNodes) return null;
          }
      if (side === "a") fa = next;
      else fb = next;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------------------------------------------
// Angles
// ---------------------------------------------------------------------------------------------------------------

export interface ChainContext {
  positions: Record<string, Pt>;
  /** Visible point ids (to name rays and find intersections). */
  points: string[];
  /** Is the collinearity of these three points established (given or proved before this step)? Rays are merged and
   *  linear pairs used only then — never because the figure looks so. */
  collinear: (a: string, b: string, c: string) => boolean;
}

class Angles {
  /** ray id → a point naming it */
  private rayName = new Map<string, string>();
  constructor(private ctx: ChainContext) {}

  private dir(v: string, p: string) {
    const V = this.ctx.positions[v]!;
    const P = this.ctx.positions[p]!;
    return Math.atan2(P.y - V.y, P.x - V.x);
  }
  ray(v: string, p: string): string {
    const d = Math.round(((this.dir(v, p) * 180) / Math.PI + 360) % 360 * 1000) / 1000;
    const base = `${v}@${d % 360}`;
    // Same direction: the same ray only if V, P and the ray's point are known to be collinear.
    const named = this.rayName.get(base);
    if (named === undefined || named === p || this.ctx.collinear(v, named, p)) {
      if (named === undefined) this.rayName.set(base, p);
      return base;
    }
    const id = `${base}#${p}`;
    if (!this.rayName.has(id)) this.rayName.set(id, p);
    return id;
  }
  /** How the angle was first written (∠AJK stays ∠AJK, not ∠KJA). */
  private written = new Map<string, string>();
  /** The named undirected angle (null if degenerate). */
  id(a: Tri): string | null {
    const id = this.idOf(a);
    if (id && !this.written.has(id)) this.written.set(id, `∠${a.join("")}`);
    return id;
  }
  private idOf(a: Tri): string | null {
    const [p, v, q] = a;
    if (!this.ctx.positions[p] || !this.ctx.positions[v] || !this.ctx.positions[q]) return null;
    const r1 = this.ray(v, p);
    const r2 = this.ray(v, q);
    if (r1 === r2) return null;
    const diff = Math.abs(this.size(v, r1, r2) - 180);
    if (diff < 1e-6) return null;
    return [r1, r2].sort().join("~");
  }
  size(_v: string, r1: string, r2: string) {
    const a = Number(r1.split("@")[1]!.split("#")[0]);
    const b = Number(r2.split("@")[1]!.split("#")[0]);
    const d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
  }
  /** The angle's size in degrees on the figure. */
  value(id: string): number {
    const [r1, r2] = id.split("~") as [string, string];
    return this.size("", r1, r2);
  }
  name(id: string): string {
    if (this.written.has(id)) return this.written.get(id)!;
    const [r1, r2] = id.split("~") as [string, string];
    const v = r1.split("@")[0]!;
    return `∠${this.rayName.get(r1)}${v}${this.rayName.get(r2)}`;
  }
  /** Rays at a vertex used by some angle so far. */
  vertices(): string[] {
    return [...new Set([...this.rayName.keys()].map((r) => r.split("@")[0]!))];
  }
  raysAt(v: string): string[] {
    return [...this.rayName.keys()].filter((r) => r.split("@")[0] === v);
  }
  pointOf(ray: string) {
    return this.rayName.get(ray)!;
  }
}

/** The rules a fact gives about named angles, with its reason. */
function angleRules(f: Fact, reason: string, A: Angles, ctx: ChainContext): Rule[] {
  const out: Rule[] = [];
  const eq = (x: string | null, y: string | null, c = 0, sign = -1) => {
    if (!x || !y || x === y) return;
    out.push({ coef: new Map([[x, 1], [y, sign]]), c, reason });
  };
  const val = (x: string | null, c: number) => {
    if (x) out.push({ coef: new Map([[x, 1]]), c, reason });
  };
  const P = ctx.positions;
  const cross = (a: string, b: string, c: string) => (P[b]!.x - P[a]!.x) * (P[c]!.y - P[a]!.y) - (P[b]!.y - P[a]!.y) * (P[c]!.x - P[a]!.x);
  switch (f.t) {
    case "eqangle":
      eq(A.id(f.a), A.id(f.b));
      break;
    case "aval":
      val(A.id(f.a), f.v);
      break;
    case "suppl":
      eq(A.id(f.a), A.id(f.b), 180, 1);
      break;
    case "simtri":
      for (let i = 0; i < 3; i++) eq(A.id([f.a[(i + 2) % 3]!, f.a[i]!, f.a[(i + 1) % 3]!]), A.id([f.b[(i + 2) % 3]!, f.b[i]!, f.b[(i + 1) % 3]!]));
      break;
    case "cyclic": {
      const [a, b, c, d] = f.p;
      for (const [x, y, p, q] of [[a, b, c, d], [a, c, b, d], [a, d, b, c], [b, c, a, d], [b, d, a, c], [c, d, a, b]] as [string, string, string, string][]) {
        const same = Math.sign(cross(x, y, p)) === Math.sign(cross(x, y, q));
        if (same) eq(A.id([x, p, y]), A.id([x, q, y]));
        else eq(A.id([x, p, y]), A.id([x, q, y]), 180, 1);
      }
      break;
    }
    case "perp": {
      // Right angles at the named intersection of the two lines.
      // A point is on a line when it names it or is known to be collinear with it.
      const on = (s: Seg, v: string) => s.includes(v) || (Math.abs(cross(s[0], s[1], v)) < 1e-3 && ctx.collinear(s[0], s[1], v));
      for (const v of ctx.points) {
        if (!P[v] || !on(f.a, v) || !on(f.b, v)) continue;
        const ends = (s: Seg) => ctx.points.filter((p) => p !== v && P[p] && on(s, p));
        for (const p of ends(f.a)) for (const q of ends(f.b)) val(A.id([p, v, q]), 90);
      }
      // The lines meet at a point the problem doesn't name: for X on one line and Y on the other, the right triangle
      // XYM (M the foot) has ∠MXY + ∠MYX = 90°, with M replaced by a named point on the same ray.
      const meet = (() => {
        const [a1, a2, b1, b2] = [P[f.a[0]]!, P[f.a[1]]!, P[f.b[0]]!, P[f.b[1]]!];
        const d = (a2.x - a1.x) * (b2.y - b1.y) - (a2.y - a1.y) * (b2.x - b1.x);
        if (Math.abs(d) < 1e-12) return null;
        const t = ((b1.x - a1.x) * (b2.y - b1.y) - (b1.y - a1.y) * (b2.x - b1.x)) / d;
        return { x: a1.x + t * (a2.x - a1.x), y: a1.y + t * (a2.y - a1.y) };
      })();
      if (meet && !ctx.points.some((v) => P[v] && Math.hypot(P[v]!.x - meet.x, P[v]!.y - meet.y) < 1e-6)) {
        const onLine = (s: Seg) => ctx.points.filter((p) => P[p] && (s.includes(p) || (Math.abs(cross(s[0], s[1], p)) < 1e-3 && ctx.collinear(s[0], s[1], p))));
        // A named point on the ray from X toward M (sign +1), or else on the opposite ray (sign −1: ∠MXY = 180° − ∠PXY).
        const toward = (x: string, s: Seg): { p: string; sign: 1 | -1 } | null => {
          const dot = (p: string) => (P[p]!.x - P[x]!.x) * (meet.x - P[x]!.x) + (P[p]!.y - P[x]!.y) * (meet.y - P[x]!.y);
          const pts = onLine(s).filter((p) => p !== x && Math.hypot(P[p]!.x - P[x]!.x, P[p]!.y - P[x]!.y) > 1e-9);
          const same = pts.find((p) => dot(p) > 0);
          if (same) return { p: same, sign: 1 };
          const opp = pts.find((p) => dot(p) < 0);
          return opp ? { p: opp, sign: -1 } : null;
        };
        for (const x of onLine(f.a))
          for (const y of onLine(f.b)) {
            if (Math.hypot(P[x]!.x - meet.x, P[x]!.y - meet.y) < 1e-9 || Math.hypot(P[y]!.x - meet.x, P[y]!.y - meet.y) < 1e-9) continue;
            const mx = toward(x, f.a);
            const my = toward(y, f.b);
            if (!mx || !my) continue;
            const ax = A.id([mx.p, x, y]);
            const ay = A.id([my.p, y, x]);
            if (!ax || !ay) continue;
            // The acute angles of the right triangle add to 90°; an angle read on the opposite ray is 180° − ∠:
            // s_x·∠x + s_y·∠y = 90° − 180°·(number of opposite rays).
            const c = 90 - 180 * ((mx.sign < 0 ? 1 : 0) + (my.sign < 0 ? 1 : 0));
            out.push({ coef: new Map([[ax, mx.sign], [ay, my.sign]]), c, reason: `${reason}: hai góc nhọn của tam giác vuông phụ nhau` });
          }
      }
      break;
    }
    default:
      break;
  }
  return out;
}

/** Configuration at the vertices involved: one ray between two others, linear pairs, triangle sums. */
function figureRules(A: Angles, vertices: Set<string>, ctx: ChainContext, triangles: Tri[]): Rule[] {
  const out: Rule[] = [];
  for (const v of vertices) {
    const rays = A.raysAt(v);
    for (let i = 0; i < rays.length; i++)
      for (let j = 0; j < rays.length; j++)
        for (let k = 0; k < rays.length; k++) {
          if (i === j || j === k || i >= k) continue;
          const [r1, r2, r3] = [rays[i]!, rays[j]!, rays[k]!];
          const a13 = A.size(v, r1, r3);
          const a12 = A.size(v, r1, r2);
          const a23 = A.size(v, r2, r3);
          const id = (x: string, y: string) => [x, y].sort().join("~");
          if (a12 < 1e-6 || a23 < 1e-6 || a13 < 1e-6) continue; // same direction, not known as one ray: no relation
          if (a13 < 180 - 1e-6 && Math.abs(a12 + a23 - a13) < 1e-6) {
            out.push({ coef: new Map([[id(r1, r3), 1], [id(r1, r2), -1], [id(r2, r3), -1]]), c: 0, reason: `tia ${v}${A.pointOf(r2)} nằm giữa hai tia ${v}${A.pointOf(r1)}, ${v}${A.pointOf(r3)}` });
          } else if (Math.abs(a13 - 180) < 1e-6 && a12 > 1e-6 && a23 > 1e-6 && ctx.collinear(A.pointOf(r1), v, A.pointOf(r3))) {
            out.push({ coef: new Map([[id(r1, r2), 1], [id(r2, r3), 1]]), c: 180, reason: `hai góc kề bù` });
          }
        }
  }
  const P = ctx.positions;
  for (const t of triangles) {
    const ids = [0, 1, 2].map((i) => A.id([t[(i + 2) % 3]!, t[i]!, t[(i + 1) % 3]!]));
    if (ids.some((x) => !x)) continue;
    out.push({ coef: new Map(ids.map((x) => [x!, 1] as [string, number])), c: 180, reason: `tổng ba góc của △${t.join("")}` });
    // Exterior angle: W on the extension of side UV beyond V (collinearity known) — ∠WVX = ∠VUX + ∠VXU.
    for (let i = 0; i < 3; i++) {
      const [v, u, x] = [t[i]!, t[(i + 1) % 3]!, t[(i + 2) % 3]!];
      for (const [uu, xx] of [[u, x], [x, u]] as [string, string][]) {
        for (const w of ctx.points) {
          if ([u, v, x].includes(w) || !P[w] || !ctx.collinear(uu, v, w)) continue;
          // V between U and W.
          const between = (P[uu]!.x - P[v]!.x) * (P[w]!.x - P[v]!.x) + (P[uu]!.y - P[v]!.y) * (P[w]!.y - P[v]!.y) < 0;
          if (!between) continue;
          const ext = A.id([w, v, xx]);
          const a1 = A.id([v, uu, xx]);
          const a2 = A.id([v, xx, uu]);
          if (ext && a1 && a2) out.push({ coef: new Map([[ext, 1], [a1, -1], [a2, -1]]), c: 0, reason: `góc ngoài của △${v}${uu}${xx}` });
        }
      }
    }
  }
  return out;
}

function showAngles(e: Expr, A: Angles): string {
  const parts: string[] = [];
  const terms = [...e.terms].filter(([, v]) => Math.abs(v) > EPS).sort((a, b) => b[1] - a[1]);
  // A positive constant first ("180° − ∠OEB", "90° + ∠ABD").
  const lead = e.c > EPS;
  if (lead) parts.push(`${Math.round(e.c * 100) / 100}°`);
  for (const [id, v] of terms) {
    const n = Math.abs(v) === 1 ? A.name(id) : `${Math.abs(v)}${A.name(id)}`;
    parts.push(parts.length === 0 ? (v < 0 ? `−${n}` : n) : v < 0 ? `− ${n}` : `+ ${n}`);
  }
  if (e.c < -EPS) parts.push(`− ${Math.round(-e.c * 100) / 100}°`);
  return parts.length ? parts.join(" ") : "0°";
}

export interface Premise {
  fact: Fact;
  /** The reason to print next to the "=" this premise justifies. */
  reason: string;
}

/** The chain of equalities for an angle claim, or null. */
export function angleChain(goal: Fact, premises: Premise[], ctx: ChainContext): string[] | null {
  if (goal.t !== "eqangle" && goal.t !== "aval" && goal.t !== "suppl") return null;
  const A = new Angles(ctx);
  // Register the goal's rays first, so angles are named as the statement names them.
  const g1 = A.id(goal.a);
  const g2 = goal.t === "aval" ? null : A.id(goal.b);
  if (!g1 || (goal.t !== "aval" && !g2)) return null;
  const rules = premises.flatMap((p) => angleRules(p.fact, p.reason, A, ctx));
  const vertices = new Set<string>([goal.a[1], ...(goal.t === "aval" ? [] : [goal.b[1]]), ...premises.flatMap((p) => (p.fact.t === "eqangle" || p.fact.t === "suppl" ? [p.fact.a[1], p.fact.b[1]] : p.fact.t === "aval" ? [p.fact.a[1]] : []))]);
  const triangles: Tri[] = [];
  const tri = (t: Tri) => {
    if (!triangles.some((x) => [...x].sort().join() === [...t].sort().join())) triangles.push(t);
  };
  tri(goal.a);
  if (goal.t !== "aval") tri(goal.b);
  for (const p of premises) if (p.fact.t === "eqangle") (tri(p.fact.a), tri(p.fact.b));
  // Configuration rules at every vertex an angle of the goal or a premise uses (equal angles, similar triangles,
  // inscribed angles…).
  for (const v of A.vertices()) vertices.add(v);
  const all = [...rules, ...figureRules(A, vertices, ctx, triangles)];
  const start: Expr = { terms: new Map([[g1, 1]]), c: 0 };
  const target: Expr = goal.t === "aval" ? { terms: new Map(), c: goal.v } : goal.t === "suppl" ? { terms: new Map([[g2!, -1]]), c: 180 } : { terms: new Map([[g2!, 1]]), c: 0 };
  const path = search(start, target, all, true, 6, 150000);
  if (!path || path.length === 0) return null;
  // Safety: every expression of the chain has the same value on the figure (else a rule was wrong: show no chain).
  const value = (e: Expr) => e.c + [...e.terms].reduce((acc, [id, k]) => acc + k * A.value(id), 0);
  const v0 = value(start);
  if (path.some((x) => Math.abs(value(x.expr) - v0) > 1e-4)) return null;
  const first = showAngles(start, A);
  return path.map((s, i) => `${i === 0 ? `${first} = ` : "= "}${showAngles(s.expr, A)} (${s.reason})`);
}

// ---------------------------------------------------------------------------------------------------------------
// Lengths
// ---------------------------------------------------------------------------------------------------------------

const seg = (s: Seg) => [...s].sort().join("");

function lengthRules(f: Fact, reason: string): Rule[] {
  switch (f.t) {
    case "cong":
      return seg(f.a) === seg(f.b) ? [] : [{ coef: new Map([[seg(f.a), 1], [seg(f.b), -1]]), c: 0, reason }];
    case "midp":
      return [
        { coef: new Map([[seg([f.a, f.m]), 1], [seg([f.m, f.b]), -1]]), c: 0, reason },
        { coef: new Map([[seg([f.a, f.b]), 1], [seg([f.a, f.m]), -1]]), c: Math.LN2, reason },
      ];
    case "prod": {
      const coef = new Map<string, number>();
      let c = 0;
      const side = (fs: typeof f.lhs, sign: number) => {
        for (const x of fs) {
          const s = sign * (x.divide ? -1 : 1);
          if ("seg" in x) coef.set(seg(x.seg), (coef.get(seg(x.seg)) ?? 0) + s * x.power);
          else c -= s * Math.log(x.number);
        }
      };
      side(f.lhs, 1);
      side(f.rhs, -1);
      for (const [k, v] of coef) if (Math.abs(v) < EPS) coef.delete(k);
      return coef.size ? [{ coef, c, reason }] : [];
    }
    case "simtri": {
      const out: Rule[] = [];
      const sides = [0, 1, 2].map((i) => [seg([f.a[i]!, f.a[(i + 1) % 3]!]), seg([f.b[i]!, f.b[(i + 1) % 3]!])] as const);
      for (let i = 0; i < 3; i++)
        for (let j = i + 1; j < 3; j++) {
          const [a1, b1] = sides[i]!;
          const [a2, b2] = sides[j]!;
          const coef = new Map<string, number>();
          for (const [k, v] of [[a1, 1], [b1, -1], [a2, -1], [b2, 1]] as [string, number][]) coef.set(k, (coef.get(k) ?? 0) + v);
          for (const [k, v] of coef) if (Math.abs(v) < EPS) coef.delete(k);
          if (coef.size) out.push({ coef, c: 0, reason: `${reason}: ${a1}/${b1} = ${a2}/${b2}` });
        }
      return out;
    }
    default:
      return [];
  }
}

function showLengths(e: Expr): string {
  const num: string[] = [];
  const den: string[] = [];
  for (const [s, v] of [...e.terms].sort(([a], [b]) => (a < b ? -1 : 1))) {
    const p = Math.abs(v);
    const t = p === 1 ? s : p === 2 ? `${s}²` : `${s}^${p}`;
    (v > 0 ? num : den).push(t);
  }
  const k = Math.exp(e.c);
  if (Math.abs(k - 1) > 1e-9) {
    const r = Math.round(k * 1000) / 1000;
    if (r >= 1) num.unshift(String(r));
    else den.unshift(String(Math.round((1 / k) * 1000) / 1000));
  }
  const n = num.join(" · ") || "1";
  return den.length ? `${n} / ${den.length > 1 ? `(${den.join(" · ")})` : den[0]}` : n;
}

/** The chain of equalities for a length claim (equal segments, products), or null. */
export function lengthChain(goal: Fact, premises: Premise[], positions?: Record<string, Pt>): string[] | null {
  if (goal.t !== "cong" && goal.t !== "prod") return null;
  const rules = premises.flatMap((p) => lengthRules(p.fact, p.reason));
  const sides = (fs: Fact & { t: "prod" }, which: "lhs" | "rhs"): Expr => {
    const terms = new Map<string, number>();
    let c = 0;
    for (const x of fs[which]) {
      const s = x.divide ? -1 : 1;
      if ("seg" in x) terms.set(seg(x.seg), (terms.get(seg(x.seg)) ?? 0) + s * x.power);
      else c += s * Math.log(x.number);
    }
    return { terms, c };
  };
  const [start, target] =
    goal.t === "cong"
      ? [{ terms: new Map([[seg(goal.a), 1]]), c: 0 }, { terms: new Map([[seg(goal.b), 1]]), c: 0 }]
      : [sides(goal, "lhs"), sides(goal, "rhs")];
  const path = search(start, target, rules, false, 6, 200000);
  if (!path || path.length === 0) return null;
  if (positions) {
    // Safety: every expression has the same value on the figure (log-lengths).
    const len = (sg: string) => {
      const [a, b] = sg.match(/[A-Z]'*/g) as [string, string];
      return Math.log(Math.hypot(positions[a]!.x - positions[b]!.x, positions[a]!.y - positions[b]!.y));
    };
    const value = (e: Expr) => e.c + [...e.terms].reduce((acc, [sg, k]) => acc + k * len(sg), 0);
    const v0 = value(start);
    if (path.some((x) => Math.abs(value(x.expr) - v0) > 1e-4)) return null;
  }
  // The first side as the claim writes it (factor order kept).
  const written = (fs: Factor[]) => fs.map((x) => ("seg" in x ? `${x.seg.join("")}${x.power === 2 ? "²" : ""}` : String(x.number))).join(" · ");
  const head = goal.t === "prod" && goal.lhs.every((x) => !x.divide) ? written(goal.lhs) : goal.t === "cong" ? goal.a.join("") : showLengths(start);
  return path.map((s, i) => `${i === 0 ? `${head} = ` : "= "}${showLengths(s.expr)} (${s.reason})`);
}

// ---------------------------------------------------------------------------------------------------------------
// When no chain exists: the claim as a sum of numbered equations
// ---------------------------------------------------------------------------------------------------------------

/** Solves Σ λ_i·rule_i = target (over the rules' variables and constants); null when no combination exists. */
function combine(rules: Rule[], target: Expr): number[] | null {
  const vars = [...new Set([...rules.flatMap((r) => [...r.coef.keys()]), ...target.terms.keys()])];
  const rows = vars.length + 1; // one row per variable, one for the constant
  const n = rules.length;
  const M: number[][] = [];
  for (let i = 0; i < rows; i++) {
    const row = new Array(n + 1).fill(0);
    for (let j = 0; j < n; j++) row[j] = i < vars.length ? rules[j]!.coef.get(vars[i]!) ?? 0 : rules[j]!.c;
    row[n] = i < vars.length ? target.terms.get(vars[i]!) ?? 0 : target.c;
    M.push(row);
  }
  const pivotCol: number[] = [];
  let r = 0;
  for (let c = 0; c < n && r < rows; c++) {
    let best = r;
    for (let i = r + 1; i < rows; i++) if (Math.abs(M[i]![c]!) > Math.abs(M[best]![c]!)) best = i;
    if (Math.abs(M[best]![c]!) < 1e-9) continue;
    [M[r], M[best]] = [M[best]!, M[r]!];
    const pv = M[r]![c]!;
    for (let k = c; k <= n; k++) M[r]![k]! /= pv;
    for (let i = 0; i < rows; i++) {
      if (i === r) continue;
      const f = M[i]![c]!;
      if (Math.abs(f) < 1e-12) continue;
      for (let k = c; k <= n; k++) M[i]![k] = M[i]![k]! - f * M[r]![k]!;
    }
    pivotCol.push(c);
    r++;
  }
  for (let i = r; i < rows; i++) if (Math.abs(M[i]![n]!) > 1e-6) return null; // inconsistent: not a combination
  const lambda = new Array(n).fill(0);
  pivotCol.forEach((c, i) => (lambda[c] = M[i]![n]!));
  return lambda;
}

function showRule(r: Rule, A: Angles): string {
  const pos = [...r.coef].filter(([, v]) => v > 0);
  const neg = [...r.coef].filter(([, v]) => v < 0);
  const side = (xs: [string, number][]) => xs.map(([id, v]) => `${Math.abs(v) === 1 ? "" : Math.abs(v)}${A.name(id)}`).join(" + ");
  const left = side(pos) || "0°";
  const rightTerms = side(neg);
  const c = Math.round(r.c * 100) / 100;
  const right = rightTerms ? (Math.abs(c) > 1e-9 ? `${rightTerms} ${c > 0 ? "+" : "−"} ${Math.abs(c)}°` : rightTerms) : `${c}°`;
  return `${left} = ${right}`;
}

/**
 * The claim as an explicit combination of numbered angle equations (each with its reason), for steps where no chain
 * of equalities exists: "(1) ∠X = ∠Y (…) (2) … ⇒ (1) + (2) − (3): ∠A = ∠B". Uses as few equations as possible.
 */
export function angleCombination(goal: Fact, premises: Premise[], ctx: ChainContext): { lines: string[]; equations: string[]; combination: string } | null {
  if (goal.t !== "eqangle" && goal.t !== "aval" && goal.t !== "suppl") return null;
  const A = new Angles(ctx);
  const g1 = A.id(goal.a);
  const g2 = goal.t === "aval" ? null : A.id(goal.b);
  if (!g1 || (goal.t !== "aval" && !g2)) return null;
  const rules = premises.flatMap((p) => angleRules(p.fact, p.reason, A, ctx));
  // Every triangle on the points involved (angle sums, exterior angles): a combination may need any of them.
  const involved = [...new Set([...goal.t === "aval" ? goal.a : [...goal.a, ...goal.b], ...premises.flatMap((p) => factPointsOf(p.fact))])].filter((x) => ctx.positions[x]);
  const triangles: Tri[] = [];
  for (let i = 0; i < involved.length; i++)
    for (let j = i + 1; j < involved.length; j++)
      for (let k = j + 1; k < involved.length; k++) triangles.push([involved[i]!, involved[j]!, involved[k]!]);
  for (const t of triangles) for (let i = 0; i < 3; i++) A.id([t[(i + 2) % 3]!, t[i]!, t[(i + 1) % 3]!]);
  const all = [...rules, ...figureRules(A, new Set(A.vertices()), ctx, triangles)];
  // goal as Σ coef = c: eqangle g1 − g2 = 0; suppl g1 + g2 = 180; aval g1 = v.
  const target: Expr =
    goal.t === "eqangle" ? { terms: new Map([[g1, 1], [g2!, -1]]), c: 0 } : goal.t === "suppl" ? { terms: new Map([[g1, 1], [g2!, 1]]), c: 180 } : { terms: new Map([[g1, 1]]), c: goal.v };
  let lambda = combine(all, target);
  if (!lambda) return null;
  // As few equations as possible: drop unused ones, then any whose removal still leaves a combination.
  let used = all.map((_, i) => i).filter((i) => Math.abs(lambda![i]!) > 1e-9);
  for (const i of [...used].reverse()) {
    const without = used.filter((x) => x !== i);
    const l = combine(without.map((x) => all[x]!), target);
    if (l) used = without;
  }
  const chosen = used.map((i) => all[i]!);
  lambda = combine(chosen, target);
  if (!lambda) return null;
  // Safety: each equation holds on the figure.
  const value = (r: Rule) => [...r.coef].reduce((acc, [id, k]) => acc + k * A.value(id), 0) - r.c;
  if (chosen.some((r) => Math.abs(value(r)) > 1e-4)) return null;
  const equations = chosen.map((r) => showRule(r, A));
  const lines = chosen.map((r, i) => `(${i + 1}) ${equations[i]} (${r.reason})`);
  const fmt = (x: number) => {
    const n = Math.round(x * 1000) / 1000;
    return Math.abs(n - Math.round(n)) < 1e-9 ? String(Math.round(Math.abs(n))) : String(Math.abs(n));
  };
  const combination = lambda
    .map((l, i) => ({ l, i }))
    .filter(({ l }) => Math.abs(l) > 1e-9)
    .map(({ l, i }, k) => `${k === 0 ? (l < 0 ? "−" : "") : l < 0 ? " − " : " + "}${fmt(l) === "1" ? "" : `${fmt(l)}·`}(${i + 1})`)
    .join("");
  return { lines, equations, combination };
}
