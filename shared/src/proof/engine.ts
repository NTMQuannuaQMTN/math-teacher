/**
 * The geometry proof planner: given facts (from the statement's constructions), goals (the "chứng minh" claims), and
 * the method library, find a chain of registered methods from the givens to each goal.
 *
 *   forward:  givens → methods → new facts → … (bounded depth)
 *   backward: each goal is tried directly at every round by the methods that can conclude it (goal analyzer), and
 *             candidates sharing points with the goals are tried first
 *   algebra:  angle chasing and length ratios as linear systems with provenance (linear.ts)
 *
 * The exact figure built from the statement is an ORACLE only: it proposes which facts are worth trying (a fact false
 * on the figure can't be proved, so it isn't tried) and orients angles. A fact enters the state only when a method's
 * prerequisites are established facts. Search is bounded (depth, candidate counts, time).
 */
import { resolveFigure, type ResolvedFigure, type Vec } from "../geometry";
import type { Figure } from "../solution";
import { angleEquations, factKey, factPoints, lengthEquations, type Fact, type Orient, type Seg, type Tri } from "./facts";
import { LinearSystem } from "./linear";

export interface Derivation {
  id: number;
  fact: Fact;
  method: string;
  premises: number[];
  /** Why a given holds ("E thuộc đường trung trực của DB"). */
  note?: string;
}

export interface SearchLimits {
  depth: number;
  timeMs: number;
  maxFacts: number;
}

const DEFAULT_LIMITS: SearchLimits = { depth: 5, timeMs: 4000, maxFacts: 4000 };

// ---------------------------------------------------------------------------------------------------------------
// The oracle
// ---------------------------------------------------------------------------------------------------------------

export class Oracle {
  readonly scale: number;
  constructor(readonly P: Record<string, Vec>) {
    const xs = Object.values(P).map((p) => p.x);
    const ys = Object.values(P).map((p) => p.y);
    this.scale = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 1e-9);
  }
  has = (...ids: string[]) => ids.every((i) => this.P[i]);
  len = (a: string, b: string) => Math.hypot(this.P[a]!.x - this.P[b]!.x, this.P[a]!.y - this.P[b]!.y);
  cross(a: string, b: string, c: string) {
    const [A, B, C] = [this.P[a]!, this.P[b]!, this.P[c]!];
    return (B.x - A.x) * (C.y - A.y) - (B.y - A.y) * (C.x - A.x);
  }
  orient: Orient = (a, b, c) => {
    const v = this.cross(a, b, c);
    return Math.abs(v) < 1e-9 * this.scale * this.scale ? 0 : v > 0 ? 1 : -1;
  };
  /** Undirected angle at the middle point, degrees. */
  angle(a: string, v: string, b: string) {
    const [A, V, B] = [this.P[a]!, this.P[v]!, this.P[b]!];
    const u = { x: A.x - V.x, y: A.y - V.y };
    const w = { x: B.x - V.x, y: B.y - V.y };
    const c = (u.x * w.x + u.y * w.y) / (Math.hypot(u.x, u.y) * Math.hypot(w.x, w.y) || 1);
    return (Math.acos(Math.max(-1, Math.min(1, c))) * 180) / Math.PI;
  }
  dir(a: string, b: string) {
    const [A, B] = [this.P[a]!, this.P[b]!];
    return Math.atan2(B.y - A.y, B.x - A.x);
  }

  /** Is the fact true in the constructed figure? (Never a proof — used to choose what to try, and as a final sanity check.) */
  holds(f: Fact): boolean {
    if (!factPoints(f).every((p) => this.P[p])) return false;
    const rel = (x: number, y: number) => Math.abs(x - y) <= 1e-6 * Math.max(1, Math.abs(x), Math.abs(y));
    const lineAngle = (s: Seg, t: Seg) => {
      let d = ((this.dir(...s) - this.dir(...t)) * 180) / Math.PI;
      d = ((d % 180) + 180) % 180;
      return d;
    };
    switch (f.t) {
      case "col":
        return this.orient(...f.p) === 0;
      case "para": {
        const d = lineAngle(f.a, f.b);
        return d < 1e-6 || 180 - d < 1e-6;
      }
      case "perp":
        return Math.abs(lineAngle(f.a, f.b) - 90) < 1e-6;
      case "cong":
        return rel(this.len(...f.a), this.len(...f.b));
      case "eqangle":
        return Math.abs(this.angle(...f.a) - this.angle(...f.b)) < 1e-6;
      case "aval":
        return Math.abs(this.angle(...f.a) - f.v) < 1e-6;
      case "suppl":
        return Math.abs(this.angle(...f.a) + this.angle(...f.b) - 180) < 1e-6;
      case "bisector": {
        const t = (s: Seg) => (this.dir(...s) * 180) / Math.PI;
        const d = 2 * t([f.v, f.l]) - t([f.v, f.a]) - t([f.v, f.b]);
        const r = ((d % 180) + 180) % 180;
        return r < 1e-6 || 180 - r < 1e-6;
      }
      case "cyclic": {
        const [a, b, c, d] = f.p;
        if ([this.orient(a, b, c), this.orient(a, b, d)].includes(0)) return false;
        const k = (this.angle(a, c, b) - this.angle(a, d, b)) * (this.orient(a, b, c) === this.orient(a, b, d) ? 1 : 0);
        const s = this.angle(a, c, b) + this.angle(a, d, b) - 180;
        return this.orient(a, b, c) === this.orient(a, b, d) ? Math.abs(k) < 1e-6 : Math.abs(s) < 1e-6;
      }
      case "prod": {
        const v = (fs: typeof f.lhs) => fs.reduce((acc, x) => {
          const val = "seg" in x ? this.len(...x.seg) ** x.power : x.number;
          return x.divide ? acc / val : acc * val;
        }, 1);
        return rel(v(f.lhs), v(f.rhs));
      }
      case "simtri": {
        const [a, b] = [f.a, f.b];
        const r = [0, 1, 2].map((i) => this.len(a[i]!, a[(i + 1) % 3]!) / this.len(b[i]!, b[(i + 1) % 3]!));
        return this.orient(...a) !== 0 && rel(r[0]!, r[1]!) && rel(r[1]!, r[2]!);
      }
      case "midp":
        return this.orient(f.a, f.m, f.b) === 0 && rel(this.len(f.a, f.m), this.len(f.m, f.b)) && rel(this.len(f.a, f.b), 2 * this.len(f.a, f.m));
    }
  }
}

// ---------------------------------------------------------------------------------------------------------------
// The state: facts with derivations, and the two linear systems
// ---------------------------------------------------------------------------------------------------------------

export class ProofState {
  readonly facts: Derivation[] = [];
  private readonly byKey = new Map<string, number>();
  readonly angles = new LinearSystem(180);
  readonly lengths = new LinearSystem(null);

  constructor(readonly oracle: Oracle) {}

  known(f: Fact): Derivation | undefined {
    const id = this.byKey.get(factKey(f));
    return id === undefined ? undefined : this.facts[id];
  }

  /** Adds a fact established by `method` from `premises`. Returns its derivation (the existing one if known). */
  add(fact: Fact, method: string, premises: number[], note?: string): Derivation {
    const existing = this.known(fact);
    if (existing) return existing;
    const d: Derivation = { id: this.facts.length, fact, method, premises, note };
    this.facts.push(d);
    this.byKey.set(factKey(fact), d.id);
    for (const eq of angleEquations(fact, this.oracle.orient)) this.angles.add(eq, d.id);
    for (const eq of lengthEquations(fact)) this.lengths.add(eq, d.id);
    return d;
  }

  /** The premises that make an angle fact follow by angle chasing, or null. */
  angleQuery(f: Fact): number[] | null {
    const eqs = angleEquations(f, this.oracle.orient);
    if (eqs.length === 0) return null;
    const all = new Set<number>();
    for (const eq of eqs) {
      const p = this.angles.implies(eq);
      if (!p) return null;
      for (const x of p) all.add(x);
    }
    return [...all];
  }

  lengthQuery(f: Fact): number[] | null {
    const eqs = lengthEquations(f);
    if (eqs.length === 0) return null;
    const all = new Set<number>();
    for (const eq of eqs) {
      const p = this.lengths.implies(eq);
      if (!p) return null;
      for (const x of p) all.add(x);
    }
    return [...all];
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Givens from the statement's constructions
// ---------------------------------------------------------------------------------------------------------------

/** Facts the construction of each point and circle establishes (method CONSTRUCTION / CIRCLE_RADIUS / …). */
export function constructionFacts(figure: Figure, oracle: Oracle): { fact: Fact; method: string; note?: string }[] {
  const out: { fact: Fact; method: string; note?: string }[] = [];
  const byId = new Map(figure.points.map((p) => [p.id, p]));
  const hidden = (id: string) => byId.get(id)?.hidden ?? false;
  const add = (fact: Fact, method = "CONSTRUCTION", note?: string) => {
    if (factPoints(fact).every((p) => oracle.has(p)) && oracle.holds(fact)) out.push({ fact, method, note });
  };
  const centerOf = (circleId: string) => figure.circles.find((c) => c.id === circleId)?.center;
  const label = (circleId: string) => figure.circles.find((c) => c.id === circleId)?.label ?? `(${centerOf(circleId)})`;
  /** A line through `a` given by a hidden helper: what it is. */
  const lineThrough = (a: string, helper: string): { perpTo?: Seg; paraTo?: Seg; bisectorOf?: Tri; external?: boolean } | null => {
    const h = byId.get(helper);
    if (!h?.hidden) return null;
    if (h.kind === "rotate" && h.value === 90) {
      // rotate(P, O, 90): line O–helper ⊥ O–P. Used for perpendicular bisectors (O a hidden midpoint) and tangents.
      const [p, o] = h.refs as [string, string];
      if (o === a) {
        const inc = byId.get(p);
        if (inc?.hidden && inc.kind === "incenter") return { bisectorOf: [inc.refs[0]!, a, inc.refs[2]!], external: true };
        return { perpTo: [a, p] };
      }
    }
    if (h.kind === "translate") return { paraTo: [h.refs[1]!, h.refs[2]!] };
    return null;
  };

  for (const p of figure.points) {
    if (p.hidden || !oracle.has(p.id)) continue;
    const r = p.refs;
    switch (p.kind) {
      case "midpoint":
        add({ t: "midp", m: p.id, a: r[0]!, b: r[1]! });
        break;
      case "on_segment":
        add({ t: "col", p: [r[0]!, p.id, r[1]!] });
        break;
      case "foot": {
        add({ t: "col", p: [p.id, r[1]!, r[2]!] });
        // A foot from a circle's center to a line through it touching the circle is the tangent point.
        const tangentCircle = figure.circles.find((c) => c.center === r[0] && (c.through === p.id || (c.through && byId.get(c.through)?.kind === "foot" && byId.get(c.through)?.refs[0] === r[0])));
        const note = tangentCircle ? `${r[1]}${r[2]} tiếp xúc ${tangentCircle.label ?? `(${r[0]})`} tại ${p.id}` : `${p.id} là hình chiếu của ${r[0]} trên ${r[1]}${r[2]}`;
        if (r[0] !== p.id) add({ t: "perp", a: [r[0]!, p.id], b: [r[1]!, r[2]!] }, "CONSTRUCTION", note);
        break;
      }
      case "intersection": {
        for (const [a, b] of [[r[0]!, r[1]!], [r[2]!, r[3]!]] as Seg[]) {
          if (!hidden(b) && !hidden(a)) {
            add({ t: "col", p: [p.id, a, b] });
            continue;
          }
          // A line through a visible point given by a hidden helper (perpendicular bisector, tangent, parallel).
          const midId = [a, b].find((x) => hidden(x) && byId.get(x)?.kind === "midpoint");
          const [vis, helper] = midId ? [midId, midId === a ? b : a] : hidden(a) ? [b, a] : [a, b];
          const mid = byId.get(vis);
          if (hidden(vis) && mid?.kind === "midpoint" && byId.get(helper)?.kind === "rotate" && byId.get(helper)?.value === 90) {
            // Perpendicular bisector of a segment: through its (hidden) midpoint, turned 90°.
            const [x, y] = mid.refs as Seg;
            add({ t: "cong", a: [p.id, x], b: [p.id, y] }, "CONSTRUCTION", `${p.id} thuộc đường trung trực của ${x}${y}`);
            continue;
          }
          const line = lineThrough(vis, helper);
          if (line?.perpTo) add({ t: "perp", a: [vis, p.id], b: line.perpTo }, "TANGENT_RADIUS", `${p.id} thuộc tiếp tuyến tại ${vis}`);
          if (line?.paraTo) add({ t: "para", a: [vis, p.id], b: line.paraTo }, "CONSTRUCTION");
          if (line?.bisectorOf) add({ t: "bisector", v: vis, a: line.bisectorOf[0], b: line.bisectorOf[2], l: p.id, external: !!line.external }, "CONSTRUCTION");
        }
        break;
      }
      case "line_circle":
        if (!hidden(r[0]!) && !hidden(r[1]!)) add({ t: "col", p: [p.id, r[0]!, r[1]!] });
        else if (hidden(r[0]!) && byId.get(r[0]!)?.kind === "reflect") add({ t: "col", p: [p.id, r[1]!, byId.get(r[0]!)!.refs[1]!] });
        break;
      case "tangent": {
        const o = centerOf(r[1]!);
        if (o && !hidden(o)) add({ t: "perp", a: [r[0]!, p.id], b: [o, p.id] }, "TANGENT_RADIUS");
        break;
      }
      case "reflect":
        if (r.length === 2) add({ t: "midp", m: r[1]!, a: r[0]!, b: p.id });
        break;
      case "incenter":
        add({ t: "eqangle", a: [r[1]!, r[0]!, p.id], b: [p.id, r[0]!, r[2]!] }, "CONSTRUCTION", `${r[0]}${p.id} là phân giác của ∠${r[1]}${r[0]}${r[2]}`);
        add({ t: "eqangle", a: [r[0]!, r[1]!, p.id], b: [p.id, r[1]!, r[2]!] }, "CONSTRUCTION", `${r[1]}${p.id} là phân giác của ∠${r[0]}${r[1]}${r[2]}`);
        add({ t: "eqangle", a: [r[0]!, r[2]!, p.id], b: [p.id, r[2]!, r[1]!] }, "CONSTRUCTION", `${r[2]}${p.id} là phân giác của ∠${r[0]}${r[2]}${r[1]}`);
        break;
      case "circumcenter":
        add({ t: "cong", a: [p.id, r[0]!], b: [p.id, r[1]!] }, "CIRCLE_RADIUS");
        add({ t: "cong", a: [p.id, r[1]!], b: [p.id, r[2]!] }, "CIRCLE_RADIUS");
        break;
      case "orthocenter":
        add({ t: "perp", a: [r[0]!, p.id], b: [r[1]!, r[2]!] }, "CONSTRUCTION", `${p.id} là trực tâm`);
        add({ t: "perp", a: [r[1]!, p.id], b: [r[0]!, r[2]!] }, "CONSTRUCTION", `${p.id} là trực tâm`);
        add({ t: "perp", a: [r[2]!, p.id], b: [r[0]!, r[1]!] }, "CONSTRUCTION", `${p.id} là trực tâm`);
        break;
      default:
        break;
    }
    // A point defined on a line through a hidden helper (an isogonal line, "∠BAF = ∠DAI").
    if (p.kind === "line_circle" && hidden(r[1]!) && byId.get(r[1]!)?.kind === "reflect") {
      const g = byId.get(r[1]!)!;
      const [w, v, bis] = g.refs as [string, string, string];
      const inc = byId.get(bis);
      if (inc?.kind === "incenter" && v === r[0]) add({ t: "eqangle", a: [inc.refs[0]!, v, p.id], b: [inc.refs[2]!, v, w] }, "GIVEN");
    }
  }

  // Circles: who is on each one, by construction.
  for (const c of figure.circles) {
    const on = new Set<string>();
    if (c.through) on.add(c.through);
    for (const p of figure.points) {
      if (p.hidden) continue;
      if ((p.kind === "on_circle" && p.refs[0] === c.id) || (p.kind === "line_circle" && p.refs[2] === c.id) || (p.kind === "circle_circle" && p.refs.slice(0, 2).includes(c.id)) || (p.kind === "tangent" && p.refs[1] === c.id)) on.add(p.id);
    }
    const center = byId.get(c.center);
    // Circle with a (hidden) circumcenter of three points: those points are on it; with diameter XY: both ends.
    if (center?.hidden && center.kind === "circumcenter") center.refs.forEach((x) => on.add(x));
    if (center?.hidden && center.kind === "midpoint") center.refs.forEach((x) => on.add(x));
    // Tangent points of an incircle / feet from its center to tangent lines are on it.
    for (const p of figure.points) if (!p.hidden && p.kind === "foot" && p.refs[0] === c.center && c.through && byId.get(c.through)?.kind === "foot") on.add(p.id);
    const members = [...on].filter((x) => !byId.get(x)?.hidden && oracle.has(x));
    if (!center?.hidden && oracle.has(c.center)) {
      for (let i = 1; i < members.length; i++) add({ t: "cong", a: [c.center, members[0]!], b: [c.center, members[i]!] }, "CIRCLE_RADIUS", `cùng là bán kính của ${label(c.id)}`);
    }
    if (center?.hidden && center.kind === "midpoint") {
      const [x, y] = center.refs as Seg;
      for (const m of members) if (m !== x && m !== y) add({ t: "perp", a: [m, x], b: [m, y] }, "THALES_CIRCLE", `${m} thuộc đường tròn đường kính ${x}${y}`);
    }
    if (members.length >= 4) {
      const ms = members.slice(0, 8);
      for (let i = 0; i < ms.length; i++)
        for (let j = i + 1; j < ms.length; j++)
          for (let k = j + 1; k < ms.length; k++)
            for (let l = k + 1; l < ms.length; l++) add({ t: "cyclic", p: [ms[i]!, ms[j]!, ms[k]!, ms[l]!] }, "CONCYCLIC_GIVEN", `cùng thuộc ${label(c.id)}`);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------------------------------------------

export interface SearchResult {
  state: ProofState;
  /** For each goal, the derivation proving it (null if not proved). */
  proved: (Derivation | null)[];
  rounds: number;
  elapsedMs: number;
  /** Developer trace. */
  log: string[];
}

const tris = (pts: string[]) => {
  const out: Tri[] = [];
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) for (let k = j + 1; k < pts.length; k++) out.push([pts[i]!, pts[j]!, pts[k]!]);
  return out;
};

const seg1 = (a: string, b: string) => ({ seg: [a, b] as Seg, power: 1 as const, divide: false });

/** Tries to establish `f` in one step from what is known, by the methods that conclude its type. */
function tryProve(s: ProofState, f: Fact): Derivation | null {
  const known = s.known(f);
  if (known) return known;
  if (!s.oracle.holds(f)) return null;
  const o = s.oracle;
  switch (f.t) {
    case "col": {
      // Two lines through one point in the same direction are one line (the textbook step; tried first).
      let best: number[] | null = null;
      for (let i = 0; i < 3; i++) {
        const [v, x, y] = [f.p[i]!, f.p[(i + 1) % 3]!, f.p[(i + 2) % 3]!];
        const q = s.angleQuery({ t: "para", a: [v, x], b: [v, y] });
        if (q && (!best || q.length < best.length)) best = q;
      }
      if (best) {
        const d = s.add(f, "SAME_LINE", best);
        minimize(s, d);
        return d;
      }
      return null;
    }
    case "para":
    case "perp":
    case "eqangle":
    case "aval":
    case "suppl":
    case "bisector": {
      const p = s.angleQuery(f);
      return p ? s.add(f, "ANGLE_CHASE", p) : null;
    }
    case "cong": {
      const p = s.lengthQuery(f);
      if (p) return s.add(f, "LENGTH_ALGEBRA", p);
      // Isosceles converse: AB = AC from ∠ABC = ∠ACB.
      const common = f.a.find((x) => f.b.includes(x));
      if (common) {
        const [b, c] = [f.a.find((x) => x !== common)!, f.b.find((x) => x !== common)!];
        if (b !== c && o.orient(common, b, c) !== 0) {
          const base = tryProve(s, { t: "eqangle", a: [common, b, c], b: [common, c, b] });
          if (base) return s.add(f, "ISOSCELES_CONVERSE", [base.id]);
        }
      }
      return null;
    }
    case "prod": {
      const p = s.lengthQuery(f);
      return p ? s.add(f, "LENGTH_ALGEBRA", p) : null;
    }
    case "cyclic": {
      // Two known circles through three common points are one circle: any four of their points are concyclic.
      for (const c1 of s.facts) {
        if (c1.fact.t !== "cyclic") continue;
        const p1 = c1.fact.p;
        for (const c2 of s.facts) {
          if (c2.id <= c1.id || c2.fact.t !== "cyclic") continue;
          const shared = c2.fact.p.filter((x) => p1.includes(x));
          const all = new Set([...p1, ...c2.fact.p]);
          if (shared.length >= 3 && f.p.every((x) => all.has(x))) return s.add(f, "CYCLIC_SAME_CIRCLE", [c1.id, c2.id]);
        }
      }
      // Two vertices see one side under equal angles (same side) or supplementary angles (opposite sides).
      const [a, b, c, d] = f.p;
      for (const [x, y, p, q] of [[a, b, c, d], [a, c, b, d], [a, d, b, c], [b, c, a, d], [b, d, a, c], [c, d, a, b]] as [string, string, string, string][]) {
        if (o.orient(x, y, p) === 0 || o.orient(x, y, q) === 0) continue;
        const same = o.orient(x, y, p) === o.orient(x, y, q);
        const rel: Fact = same ? { t: "eqangle", a: [x, p, y], b: [x, q, y] } : { t: "suppl", a: [x, p, y], b: [x, q, y] };
        const r = tryProve(s, rel);
        if (r) return s.add(f, "CYCLIC_QUADRILATERAL", [r.id]);
      }
      // Converse of the power of a point: XA·XB = XC·XD with X on lines AB and CD.
      for (const [x1, x2, y1, y2] of [[a, b, c, d], [a, c, b, d], [a, d, b, c]] as [string, string, string, string][]) {
        for (const x of Object.keys(o.P)) {
          if ([a, b, c, d].includes(x) || o.orient(x, x1, x2) !== 0 || o.orient(x, y1, y2) !== 0 || o.orient(x1, x2, y1) === 0) continue;
          // X inside both segments or outside both (otherwise the converse doesn't apply).
          const inside = (p: string, q: string) => Math.abs(o.len(p, x) + o.len(x, q) - o.len(p, q)) < 1e-6 * o.scale;
          if (inside(x1, x2) !== inside(y1, y2)) continue;
          const c1 = tryProve(s, { t: "col", p: [x, x1, x2] });
          const c2 = c1 && tryProve(s, { t: "col", p: [x, y1, y2] });
          const pr = c2 && tryProve(s, { t: "prod", lhs: [seg1(x, x1), seg1(x, x2)], rhs: [seg1(x, y1), seg1(x, y2)] });
          if (c1 && c2 && pr) return s.add(f, "POWER_OF_POINT_CONVERSE", [c1.id, c2.id, pr.id]);
        }
      }
      return null;
    }
    case "simtri": {
      const [a, b] = [f.a, f.b];
      const angleAt = (t: Tri, i: number): Tri => [t[(i + 2) % 3]!, t[i]!, t[(i + 1) % 3]!];
      // AA: two pairs of corresponding angles.
      const eq: (Derivation | null)[] = [0, 1, 2].map((i) => tryProve(s, { t: "eqangle", a: angleAt(a, i), b: angleAt(b, i) }));
      const got = eq.filter((x): x is Derivation => !!x);
      if (got.length >= 2) return s.add(f, "SIMILAR_AA", got.slice(0, 2).map((x) => x.id));
      // SAS: an equal angle with proportional adjacent sides.
      for (let i = 0; i < 3; i++) {
        if (!eq[i]) continue;
        const [p, v, q] = angleAt(a, i);
        const [p2, v2, q2] = angleAt(b, i);
        const ratio: Fact = { t: "prod", lhs: [{ seg: [v, p], power: 1, divide: false }, { seg: [v2, q2], power: 1, divide: false }], rhs: [{ seg: [v2, p2], power: 1, divide: false }, { seg: [v, q], power: 1, divide: false }] };
        const r = tryProve(s, ratio);
        if (r) return s.add(f, "SIMILAR_SAS", [eq[i]!.id, r.id]);
      }
      return null;
    }
    case "midp":
      return null;
  }
}

/** Goal → methods able to conclude it; tried directly each round (backward step). */
export function goalMethods(f: Fact): string[] {
  switch (f.t) {
    case "cong":
      return ["LENGTH_ALGEBRA", "ISOSCELES_CONVERSE", "SIMILAR_PARTS", "PERPENDICULAR_BISECTOR"];
    case "prod":
      return ["LENGTH_ALGEBRA", "SIMILAR_AA", "SIMILAR_SAS"];
    case "cyclic":
      return ["CYCLIC_QUADRILATERAL"];
    case "simtri":
      return ["SIMILAR_AA", "SIMILAR_SAS"];
    default:
      return ["ANGLE_CHASE"];
  }
}

/** Is ∠AEI a right angle in the figure? */
const o90 = (o: Oracle, a: string, e: string, i: string) => Math.abs(o.angle(a, e, i) - 90) < 1e-6;

export function search(figure: Figure, givens: { fact: Fact; method: string; note?: string }[], goals: Fact[], limits: Partial<SearchLimits> = {}): SearchResult {
  const lim = { ...DEFAULT_LIMITS, ...limits };
  const started = Date.now();
  const resolved: ResolvedFigure = resolveFigure(figure);
  const oracle = new Oracle(resolved.points);
  const s = new ProofState(oracle);
  const log: string[] = [];
  for (const g of givens) s.add(g.fact, g.method, [], g.note);
  log.push(`givens: ${s.facts.length}`);

  const visible = figure.points.filter((p) => !p.hidden && oracle.has(p.id)).map((p) => p.id);
  const goalPoints = new Set(goals.flatMap(factPoints));
  const relevance = (f: Fact) => factPoints(f).filter((p) => goalPoints.has(p)).length;
  const proved: (Derivation | null)[] = goals.map(() => null);
  const out = () => {
    goals.forEach((g, i) => (proved[i] ??= tryProve(s, g)));
    return { state: s, proved, rounds, elapsedMs: Date.now() - started, log };
  };

  let rounds = 0;
  for (; rounds < lim.depth; rounds++) {
    goals.forEach((g, i) => (proved[i] ??= tryProve(s, g)));
    if (proved.every(Boolean)) break;
    const before = s.facts.length;
    let t0 = Date.now();
    const mark = (phase: string) => {
      log.push(`  ${phase}: ${Date.now() - t0} ms, ${s.facts.length} facts`);
      t0 = Date.now();
    };

    // Isosceles: every pair of equal segments from one vertex gives equal base angles.
    for (const d of [...s.facts]) {
      if (d.fact.t !== "cong") continue;
      const { a, b } = d.fact;
      const common = a.find((x) => b.includes(x));
      if (!common) continue;
      const [x, y] = [a.find((p) => p !== common)!, b.find((p) => p !== common)!];
      if (x !== y && oracle.orient(common, x, y) !== 0) s.add({ t: "eqangle", a: [common, x, y], b: [common, y, x] }, "ISOSCELES", [d.id]);
    }
    mark("isosceles");
    // A midpoint is equidistant from the ends (feeds the perpendicular-bisector rule).
    for (const d of [...s.facts]) if (d.fact.t === "midp") s.add({ t: "cong", a: [d.fact.m, d.fact.a], b: [d.fact.m, d.fact.b] }, "MIDPOINT", [d.id]);
    // Two right triangles on a common hypotenuse AI with equal legs IE = IF (tangent lengths from A; HL congruence).
    for (const a of visible)
      for (const i of visible) {
        if (a === i || Date.now() - started > lim.timeMs) continue;
        const rights = visible.filter((e) => e !== a && e !== i && o90(oracle, a, e, i));
        for (let x = 0; x < rights.length; x++)
          for (let y = x + 1; y < rights.length; y++) {
            const [e, f] = [rights[x]!, rights[y]!];
            const target: Fact = { t: "cong", a: [a, e], b: [a, f] };
            if (s.known(target) || !oracle.holds({ t: "cong", a: [i, e], b: [i, f] })) continue;
            const p1 = tryProve(s, { t: "perp", a: [a, e], b: [i, e] });
            const p2 = p1 && tryProve(s, { t: "perp", a: [a, f], b: [i, f] });
            const leg = p2 && tryProve(s, { t: "cong", a: [i, e], b: [i, f] });
            if (p1 && p2 && leg) s.add(target, "CONGRUENT_RIGHT", [p1.id, p2.id, leg.id]);
          }
      }
    mark("midpoint + HL");
    // Right triangle XEY (right angle at E) with the altitude EH: EX² = XH·XY, EY² = YH·YX, EH² = HX·HY.
    for (const e of visible) {
      if (Date.now() - started > lim.timeMs) break;
      for (let i = 0; i < visible.length; i++)
        for (let j = i + 1; j < visible.length; j++) {
          const [x, y] = [visible[i]!, visible[j]!];
          if (x === e || y === e || !o90(oracle, x, e, y)) continue;
          for (const h of visible) {
            if ([x, y, e].includes(h) || oracle.orient(x, h, y) !== 0 || !o90(oracle, e, h, x)) continue;
            const targets: Fact[] = [
              { t: "prod", lhs: [{ seg: [e, x], power: 2, divide: false }], rhs: [seg1(x, h), seg1(x, y)] },
              { t: "prod", lhs: [{ seg: [e, y], power: 2, divide: false }], rhs: [seg1(y, h), seg1(y, x)] },
              { t: "prod", lhs: [{ seg: [e, h], power: 2, divide: false }], rhs: [seg1(h, x), seg1(h, y)] },
            ];
            if (targets.every((t) => s.known(t))) continue;
            const right = tryProve(s, { t: "perp", a: [e, x], b: [e, y] });
            const onLine = right && tryProve(s, { t: "col", p: [x, h, y] });
            const alt = onLine && tryProve(s, { t: "perp", a: [e, h], b: [x, y] });
            if (right && onLine && alt) for (const t of targets) s.add(t, "RIGHT_TRIANGLE_RELATIONS", [right.id, onLine.id, alt.id]);
          }
        }
    }
    // Power of a point: chords AB, CD of one circle meeting at X give XA·XB = XC·XD.
    for (const d of [...s.facts]) {
      if (d.fact.t !== "cyclic" || Date.now() - started > lim.timeMs) continue;
      const [a, b, c, e] = d.fact.p;
      for (const [x1, x2, y1, y2] of [[a, b, c, e], [a, c, b, e], [a, e, b, c]] as [string, string, string, string][])
        for (const x of visible) {
          if ([a, b, c, e].includes(x) || oracle.orient(x, x1, x2) !== 0 || oracle.orient(x, y1, y2) !== 0) continue;
          const target: Fact = { t: "prod", lhs: [seg1(x, x1), seg1(x, x2)], rhs: [seg1(x, y1), seg1(x, y2)] };
          if (s.known(target)) continue;
          const c1 = tryProve(s, { t: "col", p: [x, x1, x2] });
          const c2 = c1 && tryProve(s, { t: "col", p: [x, y1, y2] });
          if (c1 && c2) s.add(target, "POWER_OF_POINT", [d.id, c1.id, c2.id]);
        }
    }

    mark("power of a point");
    // Candidates proposed by the oracle (numerically true, not known), most relevant to the goals first.
    const candidates: Fact[] = [];
    const ts = tris(visible);
    // Concyclic quadruples.
    for (let i = 0; i < visible.length; i++)
      for (let j = i + 1; j < visible.length; j++)
        for (let k = j + 1; k < visible.length; k++)
          for (let l = k + 1; l < visible.length; l++) {
            const f: Fact = { t: "cyclic", p: [visible[i]!, visible[j]!, visible[k]!, visible[l]!] };
            if (!s.known(f) && oracle.holds(f)) candidates.push(f);
          }
    // Equal segments (from a common vertex: isosceles candidates; others for congruence chains).
    const segs: Seg[] = [];
    for (let i = 0; i < visible.length; i++) for (let j = i + 1; j < visible.length; j++) segs.push([visible[i]!, visible[j]!]);
    for (let i = 0; i < segs.length; i++)
      for (let j = i + 1; j < segs.length; j++) {
        const f: Fact = { t: "cong", a: segs[i]!, b: segs[j]! };
        if (!s.known(f) && oracle.holds(f)) candidates.push(f);
      }
    // Similar triangles: bucket triangles by their sorted angles, then match vertex orders within a bucket.
    const buckets = new Map<string, Tri[]>();
    for (const t of ts) {
      if (oracle.orient(...t) === 0) continue;
      const key = t.map((_, k) => oracle.angle(t[(k + 2) % 3]!, t[k]!, t[(k + 1) % 3]!)).sort((x, y) => x - y).map((x) => x.toFixed(4)).join("/");
      buckets.set(key, [...(buckets.get(key) ?? []), t]);
    }
    for (const group of buckets.values())
      for (let i = 0; i < group.length; i++)
        for (let j = i + 1; j < group.length; j++)
          for (const perm of [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]]) {
            const f: Fact = { t: "simtri", a: group[i]!, b: perm.map((k) => group[j]![k]!) as Tri };
            if (!s.known(f) && oracle.holds(f)) candidates.push(f);
          }
    // Collinear triples that aren't constructions (concurrences, Simson-like lines, "A, K, D thẳng hàng").
    for (const t of ts) {
      const f: Fact = { t: "col", p: t };
      if (oracle.orient(...t) === 0 && !s.known(f)) candidates.push(f);
    }
    mark(`candidates (${candidates.length})`);
    candidates.sort((x, y) => relevance(y) - relevance(x));
    for (const f of candidates.slice(0, 1500)) {
      if (Date.now() - started > lim.timeMs || s.facts.length > lim.maxFacts) break;
      tryProve(s, f);
    }
    mark("try candidates");
    // Perpendicular bisector: two points each equidistant from A and B.
    for (const d1 of s.facts) {
      if (d1.fact.t !== "cong") continue;
      for (const d2 of s.facts) {
        if (d2.id <= d1.id || d2.fact.t !== "cong") continue;
        const ends = (f: Fact & { t: "cong" }) => {
          const c = f.a.find((x) => f.b.includes(x));
          return c ? { c, e: [f.a.find((x) => x !== c)!, f.b.find((x) => x !== c)!].sort().join("|") } : null;
        };
        const [e1, e2] = [ends(d1.fact), ends(d2.fact)];
        if (!e1 || !e2 || e1.e !== e2.e || e1.c === e2.c) continue;
        const [x, y] = e1.e.split("|") as Seg;
        const f: Fact = { t: "perp", a: [e1.c, e2.c], b: [x, y] };
        if (!s.known(f) && oracle.holds(f)) s.add(f, "PERPENDICULAR_BISECTOR", [d1.id, d2.id]);
        // …and that perpendicular bisector passes through the midpoint of XY.
        const mid = s.facts.find((m) => m.fact.t === "midp" && [m.fact.a, m.fact.b].sort().join("|") === [x, y].sort().join("|"));
        if (mid && mid.fact.t === "midp" && ![e1.c, e2.c].includes(mid.fact.m)) {
          const c: Fact = { t: "col", p: [e1.c, e2.c, mid.fact.m] };
          if (!s.known(c) && oracle.holds(c)) s.add(c, "PERPENDICULAR_BISECTOR", [d1.id, d2.id, mid.id]);
        }
      }
    }
    log.push(`round ${rounds + 1}: ${s.facts.length} facts (+${s.facts.length - before}), ${candidates.length} candidates, ${Date.now() - started} ms`);
    if (s.facts.length === before || Date.now() - started > lim.timeMs) break;
  }
  return out();
}

// ---------------------------------------------------------------------------------------------------------------
// Premise minimisation
// ---------------------------------------------------------------------------------------------------------------

/** Does `f` follow by algebra (angle chase or length algebra) from exactly these facts? Re-solved from scratch. */
export function algebraFollows(s: ProofState, f: Fact, premises: number[], kind: "angle" | "length"): boolean {
  if (kind === "angle" && f.t === "col")
    return [0, 1, 2].some((i) => algebraFollowsRaw(s, { t: "para", a: [f.p[i]!, f.p[(i + 1) % 3]!], b: [f.p[i]!, f.p[(i + 2) % 3]!] }, premises, kind));
  return algebraFollowsRaw(s, f, premises, kind);
}

function algebraFollowsRaw(s: ProofState, f: Fact, premises: number[], kind: "angle" | "length"): boolean {
  const sys = new LinearSystem(kind === "angle" ? 180 : null);
  for (const id of premises) {
    const p = s.facts[id]!.fact;
    for (const eq of kind === "angle" ? angleEquations(p, s.oracle.orient) : lengthEquations(p)) sys.add(eq, id);
  }
  const eqs = kind === "angle" ? angleEquations(f, s.oracle.orient) : lengthEquations(f);
  return eqs.length > 0 && eqs.every((eq) => sys.implies(eq) !== null);
}

/**
 * Chooses the premises of an algebraic step (angle chase, same line, length algebra) the way a student would: reuse
 * facts the rest of the proof states anyway, and drop the premises that would add the most new facts, while the
 * step still follows. A premise never rests on the step itself, so the proof stays acyclic.
 *
 * `goal`: the fact the proof is for (to know what the rest of the proof states without this step).
 */
export function minimize(s: ProofState, d: Derivation, goal?: number): void {
  const kind = d.method === "ANGLE_CHASE" || d.method === "SAME_LINE" ? "angle" : d.method === "LENGTH_ALGEBRA" ? "length" : null;
  if (!kind) return;
  // What the proof states without this step's premises.
  const reach = new Set<number>();
  const visit = (x: number) => {
    if (reach.has(x)) return;
    reach.add(x);
    if (x !== d.id) for (const p of s.facts[x]!.premises) visit(p);
  };
  if (goal !== undefined) visit(goal);
  reach.delete(d.id);
  /** How many facts citing `id` adds to the proof. */
  const cost = (id: number) => {
    const seen = new Set<number>();
    const walk = (x: number) => {
      if (seen.has(x) || reach.has(x)) return;
      seen.add(x);
      for (const p of s.facts[x]!.premises) walk(p);
    };
    walk(id);
    return seen.size;
  };
  const restsOnD = new Map<number, boolean>();
  const dependsOnD = (id: number): boolean => {
    if (id === d.id) return true;
    if (restsOnD.has(id)) return restsOnD.get(id)!;
    restsOnD.set(id, false);
    const r = s.facts[id]!.premises.some(dependsOnD);
    restsOnD.set(id, r);
    return r;
  };
  const contributes = (x: Derivation) => (kind === "angle" ? angleEquations(x.fact, s.oracle.orient).length : lengthEquations(x.fact).length) > 0;
  // Candidates: facts the proof states anyway, and one-step consequences of them ("AI ⊥ EF" from AE = AF and IE = IF).
  const reuse = s.facts
    .filter((x) => x.id !== d.id && contributes(x) && (reach.has(x.id) || (x.premises.length > 0 && x.premises.every((p) => reach.has(p)))) && !dependsOnD(x.id))
    .map((x) => x.id);
  let ps = [...new Set([...d.premises, ...reuse])];
  if (!algebraFollows(s, d.fact, ps, kind)) ps = [...d.premises];
  const costs = new Map(ps.map((p) => [p, cost(p)]));
  for (const p of [...ps].sort((a, b) => costs.get(b)! - costs.get(a)! || b - a)) {
    const without = ps.filter((x) => x !== p);
    if (algebraFollows(s, d.fact, without, kind)) ps = without;
  }
  d.premises = ps;
}
