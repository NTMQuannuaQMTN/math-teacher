/**
 * Independent proof verifier. Shares no code with the search (engine.ts `search`/`tryProve`): it receives a proof
 * as a list of steps (fact, method, premises) and re-checks each one from scratch.
 *
 *   1. the method exists in the library, is allowed, and is within the grade-9 curriculum
 *   2. premises are earlier steps (no forward or circular references)
 *   3. givens: the fact is produced by the statement's construction / shape words (recomputed here)
 *   4. rules: the premises have exactly the shape the method needs, and the conclusion is what it gives
 *   5. algebra (angle chase, length algebra): re-solved with a fresh linear system holding only the cited premises
 *   6. numeric sanity: every fact holds on the figure AND on randomly perturbed copies of it (same construction,
 *      moved free points) — a fact true only in this particular drawing is rejected
 *
 * The figure decides configuration questions only (which side of a line a point is on, whether a point is between
 * two others) — the facts a textbook proof reads off the hypothesis ("D nằm trên cung nhỏ AC"). These are reported
 * as `configuration` notes on the steps that rely on them.
 */
import { resolveFigure } from "../geometry";
import type { Figure } from "../solution";
import { constructionFacts, Oracle, type Derivation } from "./engine";
import { angleEquations, factKey, factPoints, lengthEquations, type Fact, type Seg, type Tri } from "./facts";
import { LinearSystem } from "./linear";
import { method } from "./methods";

export interface StepCheck {
  id: number;
  ok: boolean;
  problems: string[];
  /** Configuration read from the figure that this step relies on. */
  configuration: string[];
}

export interface VerifyResult {
  ok: boolean;
  steps: StepCheck[];
  /** Problems not tied to one step (e.g. the goal is missing from the proof). */
  issues: string[];
  /** Perturbed figures used for the numeric check. */
  perturbations: number;
}

export interface VerifyOptions {
  /** Extra givens (statement shape words) as produced by the planner, with the method "GIVEN". */
  statementGivens?: Fact[];
  /** Goals proved in earlier parts (method PREVIOUS_PART). */
  previous?: Fact[];
  /** Highest grade allowed (default 9). */
  maxGrade?: number;
  perturbations?: number;
  seed?: number;
}

const GIVEN_METHODS = new Set(["PREVIOUS_PART", "GIVEN", "CONSTRUCTION", "CIRCLE_RADIUS", "CONCYCLIC_GIVEN", "TANGENT_RADIUS", "THALES_CIRCLE"]);

const sameSeg = (a: Seg, b: Seg) => (a[0] === b[0] && a[1] === b[1]) || (a[0] === b[1] && a[1] === b[0]);
const sameAngle = (a: Tri, b: Tri) => a[1] === b[1] && ((a[0] === b[0] && a[2] === b[2]) || (a[0] === b[2] && a[2] === b[0]));
const common = (a: Seg, b: Seg) => a.find((x) => b.includes(x));
const other = (s: Seg, x: string) => (s[0] === x ? s[1] : s[0]);

/** Moves the figure's free parameters a little (free points, angles of points on circles, ratios on segments). */
function perturb(figure: Figure, rnd: () => number): Figure {
  const xs = figure.points.filter((p) => p.x !== null).map((p) => p.x!);
  const ys = figure.points.filter((p) => p.y !== null).map((p) => p.y!);
  const scale = Math.max(1, xs.length ? Math.max(...xs) - Math.min(...xs) : 1, ys.length ? Math.max(...ys) - Math.min(...ys) : 1);
  const d = () => (rnd() - 0.5) * 0.04;
  return {
    ...figure,
    points: figure.points.map((p) => {
      if (p.kind === "free" && p.x !== null && p.y !== null) return { ...p, x: p.x + d() * scale, y: p.y + d() * scale };
      if (p.kind === "on_circle" && p.value !== null) return { ...p, value: p.value + d() * 50 };
      if (p.kind === "on_segment" && p.value !== null && p.value > 0 && p.value < 1) return { ...p, value: Math.min(0.95, Math.max(0.05, p.value + d())) };
      return p;
    }),
  };
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function verifyProof(figure: Figure, proof: Derivation[], goals: Fact[], opts: VerifyOptions = {}): VerifyResult {
  const oracle = new Oracle(resolveFigure(figure).points);
  const maxGrade = opts.maxGrade ?? 9;
  const byId = new Map(proof.map((d) => [d.id, d]));
  const position = new Map(proof.map((d, i) => [d.id, i]));
  const givenKeys = new Map<string, string>();
  for (const g of constructionFacts(figure, oracle)) givenKeys.set(factKey(g.fact), g.method);
  for (const f of opts.statementGivens ?? []) givenKeys.set(factKey(f), "GIVEN");
  for (const f of opts.previous ?? []) givenKeys.set(factKey(f), "PREVIOUS_PART");

  // Perturbed copies for the numeric check: keep only those whose construction still resolves with the same configuration.
  const rnd = mulberry32(opts.seed ?? 7);
  const others: Oracle[] = [];
  for (let i = 0; others.length < (opts.perturbations ?? 4) && i < 24; i++) {
    const r = resolveFigure(perturb(figure, rnd));
    if (r.errors.length || Object.keys(r.points).length !== Object.keys(oracle.P).length) continue;
    const o = new Oracle(r.points);
    // A valid instance of the problem: the statement's own givens ("cân tại A", "vuông tại A") still hold.
    if ((opts.statementGivens ?? []).some((g) => !o.holds(g))) continue;
    const ids = Object.keys(oracle.P);
    // Same configuration: every triple keeps its orientation.
    let same = true;
    for (let a = 0; a < ids.length && same; a++)
      for (let b = a + 1; b < ids.length && same; b++)
        for (let c = b + 1; c < ids.length && same; c++) if (o.orient(ids[a]!, ids[b]!, ids[c]!) !== oracle.orient(ids[a]!, ids[b]!, ids[c]!)) same = false;
    if (same) others.push(o);
  }

  const algebra = (f: Fact, premises: number[], kind: "angle" | "length") => {
    const sys = new LinearSystem(kind === "angle" ? 180 : null);
    for (const id of premises) {
      const p = byId.get(id)!.fact;
      for (const eq of kind === "angle" ? angleEquations(p, oracle.orient) : lengthEquations(p)) sys.add(eq, id);
    }
    const eqs = kind === "angle" ? angleEquations(f, oracle.orient) : lengthEquations(f);
    return eqs.length > 0 && eqs.every((eq) => sys.implies(eq) !== null);
  };

  const steps: StepCheck[] = proof.map((d, i) => {
    const problems: string[] = [];
    const configuration: string[] = [];
    const m = method(d.method);
    if (!m) problems.push(`unknown method ${d.method}`);
    else {
      if (!m.allowed) problems.push(`method ${d.method} is outside the curriculum`);
      if (m.grade > maxGrade) problems.push(`method ${d.method} is grade ${m.grade}`);
      if (!m.produces.includes(d.fact.t)) problems.push(`method ${d.method} does not produce a ${d.fact.t} fact`);
    }
    for (const p of d.premises) {
      const at = position.get(p);
      if (at === undefined) problems.push(`premise #${p} is not in the proof`);
      else if (at >= i) problems.push(`premise #${p} comes after the step (circular)`);
    }
    if (problems.length) return { id: d.id, ok: false, problems, configuration };
    const P = d.premises.map((id) => byId.get(id)!.fact);
    const f = d.fact;
    const need = (ok: boolean, why: string) => {
      if (!ok) problems.push(why);
    };

    if (GIVEN_METHODS.has(d.method)) {
      need(d.premises.length === 0, "a given has no premises");
      need(givenKeys.has(factKey(f)), "not a given of the statement or its construction");
    } else
      switch (d.method) {
        case "ANGLE_CHASE":
          need(algebra(f, d.premises, "angle"), "does not follow from the cited facts by angle chasing");
          if (f.t === "eqangle" || f.t === "aval" || f.t === "suppl") configuration.push("vị trí tương đối của các điểm (theo hình)");
          break;
        case "SAME_LINE": {
          need(f.t === "col", "SAME_LINE concludes collinearity");
          if (f.t !== "col") break;
          const ok = [0, 1, 2].some((k) => algebra({ t: "para", a: [f.p[k]!, f.p[(k + 1) % 3]!], b: [f.p[k]!, f.p[(k + 2) % 3]!] }, d.premises, "angle"));
          need(ok, "the two lines through the common point are not shown to have the same direction");
          break;
        }
        case "LENGTH_ALGEBRA":
          need(algebra(f, d.premises, "length"), "does not follow from the cited facts by length algebra");
          break;
        case "MIDPOINT":
          need(P.length === 1 && P[0]!.t === "midp" && f.t === "cong" && sameSeg(f.a, [P[0]!.m, P[0]!.a]) !== sameSeg(f.a, [P[0]!.m, P[0]!.b]) &&
            [f.a, f.b].every((s) => sameSeg(s, [(P[0] as Fact & { t: "midp" }).m, (P[0] as Fact & { t: "midp" }).a]) || sameSeg(s, [(P[0] as Fact & { t: "midp" }).m, (P[0] as Fact & { t: "midp" }).b])), "not the two halves of the midpoint's segment");
          break;
        case "ISOSCELES": {
          const c = P[0];
          if (P.length !== 1 || c?.t !== "cong" || f.t !== "eqangle") { need(false, "ISOSCELES needs one equality of two sides"); break; }
          const v = common(c.a, c.b);
          if (!v) { need(false, "the equal sides share no vertex"); break; }
          const [x, y] = [other(c.a, v), other(c.b, v)];
          need(sameAngle(f.a, [v, x, y]) && sameAngle(f.b, [v, y, x]) || sameAngle(f.a, [v, y, x]) && sameAngle(f.b, [v, x, y]), "the conclusion is not the pair of base angles");
          break;
        }
        case "ISOSCELES_CONVERSE": {
          const e = P[0];
          if (P.length !== 1 || e?.t !== "eqangle" || f.t !== "cong") { need(false, "ISOSCELES_CONVERSE needs one equality of base angles"); break; }
          const v = common(f.a, f.b);
          if (!v) { need(false, "the sides share no vertex"); break; }
          const [x, y] = [other(f.a, v), other(f.b, v)];
          need(sameAngle(e.a, [v, x, y]) && sameAngle(e.b, [v, y, x]) || sameAngle(e.a, [v, y, x]) && sameAngle(e.b, [v, x, y]), "the cited angles are not the base angles");
          break;
        }
        case "PERPENDICULAR_BISECTOR": {
          if (P.length !== 2 || P.some((x) => x.t !== "cong") || f.t !== "perp") { need(false, "needs two equalities of distances"); break; }
          const ends = (c: Fact & { t: "cong" }) => {
            const v = common(c.a, c.b);
            return v ? { v, seg: [other(c.a, v), other(c.b, v)] as Seg } : null;
          };
          const [e1, e2] = [ends(P[0] as Fact & { t: "cong" }), ends(P[1] as Fact & { t: "cong" })];
          need(!!e1 && !!e2 && sameSeg(e1.seg, e2.seg) && e1.v !== e2.v && ((sameSeg(f.a, [e1.v, e2.v]) && sameSeg(f.b, e1.seg)) || (sameSeg(f.b, [e1.v, e2.v]) && sameSeg(f.a, e1.seg))), "the two points are not both equidistant from the segment's ends, or the conclusion is a different line");
          break;
        }
        case "CONGRUENT_RIGHT": {
          // perp(AE, IE), perp(AF, IF), IE = IF ⊢ AE = AF.
          const perps = P.filter((x): x is Fact & { t: "perp" } => x.t === "perp");
          const leg = P.find((x): x is Fact & { t: "cong" } => x.t === "cong");
          if (perps.length !== 2 || !leg || f.t !== "cong") { need(false, "needs two right angles and one pair of equal legs"); break; }
          const a = common(f.a, f.b);
          const i0 = common(leg.a, leg.b);
          if (!a || !i0) { need(false, "malformed sides"); break; }
          const [e, ff] = [other(f.a, a), other(f.b, a)];
          const rightAt = (x: string) => perps.some((p) => (sameSeg(p.a, [a, x]) && sameSeg(p.b, [i0, x])) || (sameSeg(p.b, [a, x]) && sameSeg(p.a, [i0, x])));
          need(rightAt(e) && rightAt(ff) && [other(leg.a, i0), other(leg.b, i0)].sort().join() === [e, ff].sort().join(), "the right angles / legs don't match the conclusion");
          break;
        }
        case "CYCLIC_QUADRILATERAL": {
          const r = P[0];
          if (P.length !== 1 || (r?.t !== "eqangle" && r?.t !== "suppl") || f.t !== "cyclic") { need(false, "needs one angle relation"); break; }
          const [x, p, y] = r.a;
          const [x2, q, y2] = r.b;
          const chordOk = (x === x2 && y === y2) || (x === y2 && y === x2);
          need(chordOk && [x, y, p, q].sort().join() === [...f.p].sort().join(), "the angles don't look at one side of the quadrilateral");
          if (!chordOk) break;
          const same = oracle.orient(x, y, p) === oracle.orient(x, y, q);
          need(r.t === "eqangle" ? same : !same, r.t === "eqangle" ? "equal angles on opposite sides of the chord don't give a cyclic quadrilateral" : "supplementary angles on the same side don't give a cyclic quadrilateral");
          configuration.push(`${p}, ${q} ${same ? "cùng phía" : "khác phía"} đối với ${x}${y}`);
          break;
        }
        case "SIMILAR_AA":
        case "SIMILAR_SAS": {
          if (f.t !== "simtri") { need(false, "concludes similarity"); break; }
          const at = (t: Tri, k: number): Tri => [t[(k + 2) % 3]!, t[k]!, t[(k + 1) % 3]!];
          const angles = P.filter((x): x is Fact & { t: "eqangle" } => x.t === "eqangle");
          const matched = [0, 1, 2].filter((k) => angles.some((e) => (sameAngle(e.a, at(f.a, k)) && sameAngle(e.b, at(f.b, k))) || (sameAngle(e.b, at(f.a, k)) && sameAngle(e.a, at(f.b, k)))));
          need(oracle.orient(...f.a) !== 0 && oracle.orient(...f.b) !== 0, "a triangle is degenerate");
          if (d.method === "SIMILAR_AA") need(matched.length >= 2, "needs two pairs of corresponding equal angles");
          else {
            const k = matched[0];
            const ratio = P.find((x): x is Fact & { t: "prod" } => x.t === "prod");
            if (k === undefined || !ratio) { need(false, "needs an equal included angle and a proportion"); break; }
            const [p, v, q] = at(f.a, k);
            const [p2, v2, q2] = at(f.b, k);
            const want: Fact = { t: "prod", lhs: [seg(v, p), seg(v2, q2)], rhs: [seg(v2, p2), seg(v, q)] };
            need(algebra(want, [d.premises.find((id) => byId.get(id)!.fact.t === "prod")!], "length"), "the proportion is not of the sides around the equal angle");
          }
          break;
        }
        case "POWER_OF_POINT":
        case "POWER_OF_POINT_CONVERSE": {
          const cyc = d.method === "POWER_OF_POINT" ? P.find((x) => x.t === "cyclic") : f;
          const prod = d.method === "POWER_OF_POINT" ? f : P.find((x) => x.t === "prod");
          const cols = P.filter((x): x is Fact & { t: "col" } => x.t === "col");
          if (cyc?.t !== "cyclic" || prod?.t !== "prod" || cols.length !== 2) { need(false, "needs a cyclic quadrilateral (or a product) and two collinearities"); break; }
          const segs = [...prod.lhs, ...prod.rhs].filter((x): x is { seg: Seg; power: 1 | 2; divide: boolean } => "seg" in x);
          const x = segs[0] ? segs.map((s) => s.seg).reduce<string | undefined>((acc, s) => (acc === undefined ? undefined : s.includes(acc) ? acc : undefined), segs[0].seg[0]) ?? segs.map((s) => s.seg).reduce<string | undefined>((acc, s) => (acc === undefined ? undefined : s.includes(acc) ? acc : undefined), segs[0].seg[1]) : undefined;
          if (!x || segs.length !== 4) { need(false, "the product is not of four segments from one point"); break; }
          const l = prod.lhs.map((s) => ("seg" in s ? other(s.seg, x) : "")).sort();
          const r = prod.rhs.map((s) => ("seg" in s ? other(s.seg, x) : "")).sort();
          const colHas = (pts: string[]) => cols.some((c) => [x, ...pts].every((q) => c.p.includes(q)));
          need(colHas(l) && colHas(r) && [...l, ...r].sort().join() === [...cyc.p].sort().join(), "the secants don't match the four concyclic points");
          // Converse: X inside both chords or outside both.
          const inside = (a: string, b: string) => Math.abs(oracle.len(a, x) + oracle.len(x, b) - oracle.len(a, b)) < 1e-6 * oracle.scale;
          if (d.method === "POWER_OF_POINT_CONVERSE") {
            need(inside(l[0]!, l[1]!) === inside(r[0]!, r[1]!), `${x} must be inside both segments or outside both`);
            configuration.push(`${x} ${inside(l[0]!, l[1]!) ? "nằm giữa" : "nằm ngoài"} ${l.join("")} và ${r.join("")}`);
          }
          break;
        }
        default:
          need(false, `the verifier has no rule for ${d.method}`);
      }

    // Numeric sanity: on the figure and on every perturbed copy.
    if (!oracle.holds(f)) problems.push("false on the figure");
    else if (others.some((o) => factPoints(f).every((p) => o.P[p]) && !o.holds(f))) problems.push("true on this drawing only (fails when the free points move)");
    return { id: d.id, ok: problems.length === 0, problems, configuration };
  });

  const issues: string[] = [];
  const keys = new Set(proof.map((d) => factKey(d.fact)));
  for (const g of goals) if (!keys.has(factKey(g))) issues.push(`goal not established: ${factKey(g)}`);
  if (others.length === 0) issues.push("no perturbed figure available for the numeric check");
  return { ok: steps.every((s) => s.ok) && issues.filter((x) => !x.startsWith("no perturbed")).length === 0, steps, issues, perturbations: others.length };
}

const seg = (a: string, b: string) => ({ seg: [a, b] as Seg, power: 1 as const, divide: false });
