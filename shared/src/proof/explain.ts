/**
 * Verified proof plan → lesson. Deterministic Vietnamese templates verbalise exactly the verified derivations; nothing
 * is added that the verifier didn't check.
 *
 *   - givens and one-line consequences of a construction are not steps of their own: they're cited as the reason
 *     inside the step that uses them ("vì IE ⊥ AC (E là tiếp điểm)")
 *   - every other derivation is a step: the fact (display math), the method by its textbook name, the facts it uses
 *   - steps are grouped by part ("Câu a"); a result of an earlier part is cited as "(câu a)"
 *   - each step highlights the points of its fact; each goal gets a hint that names the idea without the details
 *
 * The lesson has at most 14 steps (the schema's limit): when a proof is longer, consecutive non-goal steps of the
 * same part are merged into one.
 */
import type { Hint, ModelLesson, Step } from "../solution";
import type { Derivation } from "./engine";
import { factKey, factLatex, factPoints, factText, type Fact } from "./facts";
import { resolveFigure } from "../geometry";
import { method } from "./methods";
import { angleChain, lengthChain, type Premise } from "./chain";
import type { PlanGoal, ProofPlan } from "./planner";

const MAX_STEPS = 14;

/** Derivations stated inline as a reason rather than as their own step. */
function inline(d: Derivation, byId: Map<number, Derivation>): boolean {
  if (d.premises.length === 0) return true; // givens, constructions, previous parts
  if (d.method === "MIDPOINT") return true;
  // Base angles of an isosceles triangle: "∠EDB = ∠EBD (△EDB cân tại E)".
  if (d.method === "ISOSCELES") return true;
  // The same angle named twice (J on ray AI: ∠DIJ = ∠DIA).
  if (d.fact.t === "eqangle" && sameAngle(d.fact)) return true;
  // A one-line consequence of givens only ("AE ⊥ IE" from E on AC and IE ⊥ AC; "IE = IF" from two radii)…
  if ((d.method === "ANGLE_CHASE" || d.method === "SAME_LINE" || d.method === "LENGTH_ALGEBRA") && d.premises.length <= 2 && d.premises.every((p) => byId.get(p)!.premises.length === 0)) return true;
  // …or of one earlier fact and the construction ("EJ ⊥ AI" from AI ⊥ EF and J on EF).
  if ((d.method === "ANGLE_CHASE" || d.method === "SAME_LINE") && d.premises.map((p) => byId.get(p)!).filter(needed).length <= 1) return true;
  return false;
}

/** Why a given holds, in words. */
function givenReason(d: Derivation): string {
  if (d.method === "PREVIOUS_PART") return d.note?.replace(/:.*$/, "") ?? "đã chứng minh";
  if (d.method === "CIRCLE_RADIUS") return d.note?.replace(/^cùng là /, "") ?? "bán kính";
  if (d.note) return d.note;
  switch (d.method) {
    case "GIVEN":
      return "giả thiết";
    case "CIRCLE_RADIUS":
      return "bán kính";
    case "TANGENT_RADIUS":
      return "tiếp tuyến vuông góc với bán kính tại tiếp điểm";
    case "THALES_CIRCLE":
      return "góc nội tiếp chắn nửa đường tròn";
    case "CONCYCLIC_GIVEN":
      return "cùng thuộc một đường tròn";
    default:
      return "cách dựng";
  }
}

/** Point positions of the plan's figure (for naming a quadrilateral in order around its circle). */
let positions: Record<string, { x: number; y: number }> = {};
/** Visible points of the plan's figure (for the chains of equalities). */
let visiblePoints: string[] = [];
/** Collinear triples established by the plan (givens, constructions and proved facts), as sorted keys. */
const colKey = (a: string, b: string, c: string) => [a, b, c].sort().join(",");
/** The proof the step being written belongs to (set while writing it). */
let currentProof: Derivation[] = [];
/** Collinearities that are givens of the problem or its construction (always known). */
let givenCols = new Set<string>();
/** Chain context for a step: only collinearities established before it (givens, earlier parts, earlier facts of its
 *  proof) — never its own conclusion or anything proved later. */
const chainCtx = (own: Fact) => {
  const at = currentProof.findIndex((x) => factKey(x.fact) === factKey(own));
  const before = new Set(
    currentProof
      .slice(0, at < 0 ? currentProof.length : at)
      .flatMap((d) => (d.fact.t === "col" ? [colKey(...d.fact.p)] : d.fact.t === "midp" ? [colKey(d.fact.a, d.fact.m, d.fact.b)] : [])),
  );
  return {
    positions,
    points: visiblePoints,
    collinear: (a: string, b: string, c: string) => {
      const k = colKey(a, b, c);
      return (before.has(k) || givenCols.has(k)) && !(own.t === "col" && colKey(...own.p) === k);
    },
  };
};

/** The reason printed next to an "=" a premise justifies: its own reason, or the fact with where it comes from. */
function chainReason(p: Derivation, word: string): string {
  const m = /^(.*?) \((.*)\)$/.exec(word);
  if (!m) return word;
  const [, text, why] = m as unknown as [string, string, string];
  if (p.fact.t === "cyclic" && !/bước|câu|⟦|chứng minh/.test(why)) return word; // "tứ giác DGJI nội tiếp (S)"
  return /bước|câu|⟦|chứng minh|giả thiết|cách dựng/.test(why) || p.fact.t === "cyclic" ? `${text}, ${why}` : why;
}
const quad = (pts: string[]) => {
  const P = pts.map((p) => positions[p]);
  if (P.some((p) => !p)) return pts.join("");
  const cx = P.reduce((a, p) => a + p!.x, 0) / 4;
  const cy = P.reduce((a, p) => a + p!.y, 0) / 4;
  const order = pts.map((p, i) => ({ p, a: Math.atan2(P[i]!.y - cy, P[i]!.x - cx) })).sort((a, b) => a.a - b.a).map((x) => x.p);
  // Start at the alphabetically first vertex, as a textbook names it.
  const k = order.indexOf([...order].sort()[0]!);
  const rot = [...order.slice(k), ...order.slice(0, k)];
  return (rot[1]! < rot[3]! ? rot : [rot[0]!, rot[3]!, rot[2]!, rot[1]!]).join("");
};

/** Facts that read the same are one statement ("ID² = IA · IJ" and "ID · ID = IJ · IA"). */
function sameKey(f: Fact): string {
  if (f.t !== "prod") return factKey(f);
  const side = (x: string) => x.split(/\s*·\s*/).map((t) => t.replace(/^([A-Z]'*)([A-Z]'*)/, (_, a: string, b: string) => [a, b].sort().join(""))).sort().join("·");
  const [l, r] = factText(f).split(" = ") as [string, string];
  return `prod:${[side(l), side(r)].sort().join("=")}`;
}

/** Do the two angles share their vertex and both rays (J on ray AI: ∠EAI is ∠EAJ)? */
function sameAngle(f: Fact): boolean {
  if (f.t !== "eqangle" || f.a[1] !== f.b[1]) return false;
  const v = positions[f.a[1]];
  const dir = (p: string) => {
    const P = positions[p];
    return v && P ? Math.atan2(P.y - v.y, P.x - v.x) : NaN;
  };
  const close = (x: number, y: number) => Math.abs(Math.atan2(Math.sin(x - y), Math.cos(x - y))) < 1e-6;
  const [a0, a2, b0, b2] = [dir(f.a[0]), dir(f.a[2]), dir(f.b[0]), dir(f.b[2])];
  return (close(a0, b0) && close(a2, b2)) || (close(a0, b2) && close(a2, b0));
}

/** "△AIE ∽ △AEJ ⇒ AI/AE = IE/EJ = AE/AJ" (corresponding sides in proportion). */
function proportion(f: Fact & { t: "simtri" }): string {
  const side = (t: string[], i: number) => `${t[i]}${t[(i + 1) % 3]}`;
  return `△${f.a.join("")} ∽ △${f.b.join("")} ⇒ ${[0, 1, 2].map((i) => `${side(f.a, i)}/${side(f.b, i)}`).join(" = ")}`;
}

/**
 * For "X, V, Y collinear": an angle relation at V with a reference point R that a student would write —
 * "∠RVX = ∠RVY" (X, Y on the same ray) or "∠RVX + ∠RVY = 180°".
 */
type AngleRel = { text: string; then: string; fact: Fact };
function collinearAngle(f: Fact & { t: "col" }, candidates: string[]): AngleRel | null {
  return collinearAngles(f, candidates)[0] ?? null;
}
/** Every such relation (each vertex of the three, each reference point). */
function collinearAngles(f: Fact & { t: "col" }, candidates: string[]): AngleRel[] {
  const out: AngleRel[] = [];
  for (let k = 0; k < 3; k++) {
    const [v, x, y] = [f.p[k]!, f.p[(k + 1) % 3]!, f.p[(k + 2) % 3]!];
    const [V, X, Y] = [positions[v], positions[x], positions[y]];
    if (!V || !X || !Y) continue;
    for (const r of candidates) {
      const R = positions[r];
      if (!R || f.p.includes(r)) continue;
      const cross = (P: { x: number; y: number }) => (R.x - V.x) * (P.y - V.y) - (R.y - V.y) * (P.x - V.x);
      if (Math.abs(cross(X)) < 1e-6 || Math.abs(cross(Y)) < 1e-6) continue;
      const sameRay = (X.x - V.x) * (Y.x - V.x) + (X.y - V.y) * (Y.y - V.y) > 0;
      out.push(
        sameRay
          ? { text: `∠${r}${v}${x} = ∠${r}${v}${y}`, then: `hai tia ${v}${x}, ${v}${y} trùng nhau`, fact: { t: "eqangle", a: [r, v, x], b: [r, v, y] } }
          : { text: `∠${r}${v}${x} + ∠${r}${v}${y} = 180°`, then: `hai tia ${v}${x}, ${v}${y} đối nhau`, fact: { t: "suppl", a: [r, v, x], b: [r, v, y] } },
      );
    }
  }
  return out;
}

/** A fact as a student writes it: a cyclic quadrilateral by its name. */
function show(f: Fact): string {
  if (f.t === "cyclic") return `tứ giác ${quad([...f.p])} nội tiếp`;
  return factText(f);
}

/** Premises a reader needs: a point lying on a line by its construction ("E ∈ AB") goes without saying. */
const needed = (p: Derivation) =>
  !(p.premises.length === 0 && p.method === "CONSTRUCTION" && (p.fact.t === "col" || p.fact.t === "midp")) &&
  // …and so does a collinearity that only restates the construction ("E, J, K thẳng hàng": J is the midpoint of EF and K is on EF).
  !(p.fact.t === "col" && (p.method === "SAME_LINE" || p.method === "ANGLE_CHASE") && p.premises.length <= 2 && p.note === "construction-only");

const bullet = (x: string) => `• ${x}`;

/** The lines of a derivation, given the words for each of its premises (same order as `d.premises`). */
function lines(d: Derivation, premises: Derivation[], words: (p: Derivation) => string): string[] {
  const f = d.fact;
  const P = premises.map((p) => p.fact);
  const shown = premises.filter(needed).map(words);
  switch (d.method) {
    case "ISOSCELES_CONVERSE": {
      const c = f as Fact & { t: "cong" };
      const v = c.a.find((x) => c.b.includes(x))!;
      return [...shown.map(bullet), `⇒ tam giác cân tại ${v} (hai góc ở đáy bằng nhau)`, `⇒ ${show(f)}.`];
    }
    case "PERPENDICULAR_BISECTOR": {
      if (f.t === "col") {
        const mid = P.find((x): x is Fact & { t: "midp" } => x.t === "midp")!;
        const ends = f.p.filter((x) => x !== mid.m);
        return [...premises.filter((p) => p.fact.t === "cong").map(words).map(bullet), `⇒ ${ends.join("")} là đường trung trực của ${mid.a}${mid.b}, nên đi qua trung điểm ${mid.m} của ${mid.a}${mid.b}`, `⇒ ${show(f)}.`];
      }
      const p = f as Fact & { t: "perp" };
      return [...shown.map(bullet), `⇒ ${p.a.join("")} là đường trung trực của ${p.b.join("")} (hai điểm cách đều hai đầu đoạn thẳng)`, `⇒ ${show(f)}.`];
    }
    case "CONGRUENT_RIGHT": {
      const c = f as Fact & { t: "cong" };
      const a = c.a.find((x) => c.b.includes(x))!;
      const [e, ff] = [c.a.find((x) => x !== a)!, c.b.find((x) => x !== a)!];
      const leg = P.find((x): x is Fact & { t: "cong" } => x.t === "cong");
      const i0 = leg ? leg.a.find((x) => leg.b.includes(x))! : "";
      return [
        `Xét △${a}${e}${i0} vuông tại ${e} và △${a}${ff}${i0} vuông tại ${ff} có:`,
        bullet(`${a}${i0} là cạnh huyền chung`),
        ...shown.filter((w) => !w.includes("⊥")).map(bullet),
        `⇒ △${a}${e}${i0} = △${a}${ff}${i0} (cạnh huyền – cạnh góc vuông)`,
        `⇒ ${show(f)}.`,
      ];
    }
    case "CYCLIC_QUADRILATERAL": {
      const r = P[0]!;
      const q = f.t === "cyclic" ? quad([...f.p]) : "";
      if (r.t === "eqangle") {
        const [x, , y] = r.a;
        return [...shown.map(bullet), `⇒ hai đỉnh ${r.a[1]}, ${r.b[1]} cùng nhìn cạnh ${x}${y} dưới hai góc bằng nhau`, `⇒ tứ giác ${q} nội tiếp.`];
      }
      return [...shown.map(bullet), `⇒ tứ giác ${q} có tổng hai góc đối bằng 180°`, `⇒ tứ giác ${q} nội tiếp.`];
    }
    case "SIMILAR_AA":
    case "SIMILAR_SAS": {
      const t = f as Fact & { t: "simtri" };
      return [`Xét △${t.a.join("")} và △${t.b.join("")} có:`, ...shown.map(bullet), `⇒ ${show(f)} (${d.method === "SIMILAR_AA" ? "g.g" : "c.g.c"}).`];
    }
    case "POWER_OF_POINT": {
      const cyc = P.find((x) => x.t === "cyclic");
      const cols = P.filter((x): x is Fact & { t: "col" } => x.t === "col");
      const pr = f as Fact & { t: "prod" };
      const x = pr.lhs[0] && "seg" in pr.lhs[0] ? pr.lhs[0].seg.find((q) => cols.every((c) => c.p.includes(q))) : undefined;
      const lines2 = x ? cols.map((c) => c.p.filter((q) => q !== x).join("")) : [];
      return [
        cyc ? bullet(words(premises[P.indexOf(cyc)]!)) : "",
        x && lines2.length === 2 ? bullet(`${x} là giao điểm của ${lines2[0]} và ${lines2[1]}`) : "",
        `⇒ ${show(f)} (hệ thức giữa hai dây (cát tuyến) cắt nhau của một đường tròn).`,
      ].filter(Boolean);
    }
    case "POWER_OF_POINT_CONVERSE":
      return [...shown.map(bullet), `⇒ ${show(f)} (đảo của hệ thức hai cát tuyến).`];
    case "CYCLIC_SAME_CIRCLE": {
      const cs = P.filter((x): x is Fact & { t: "cyclic" } => x.t === "cyclic");
      const shared = cs.length === 2 ? cs[1]!.p.filter((x) => cs[0]!.p.includes(x)) : [];
      const all = [...new Set(cs.flatMap((c) => c.p))].sort();
      return [...shown.map(bullet), `⇒ hai đường tròn cùng đi qua ${shared.join(", ")} nên trùng nhau (qua ba điểm chỉ có một đường tròn)`, `⇒ ${all.join(", ")} cùng thuộc một đường tròn.`];
    }
    case "SAME_LINE": {
      if (f.t !== "col" || premises.filter(needed).every((p) => p.fact.t === "perp" || p.fact.t === "para")) return [...shown.map(bullet), `⇒ ${show(f)} (qua một điểm chỉ có một đường thẳng như vậy).`];
      // Collinearity from angles: show the angle relation it rests on (two rays from one point making the same angle
      // with a third line).
      const cands = [...new Set(premises.flatMap((p) => factPoints(p.fact)))];
      const rels = collinearAngles(f, cands);
      if (!rels.length) return [...shown.map(bullet), `⇒ ${show(f)}.`];
      // The angle relation as a chain of equalities from the premises (the first vertex/reference that gives one).
      const ps = premises.map((p): Premise => ({ fact: p.fact, reason: chainReason(p, words(p)) }));
      // The shortest chain over the vertex/reference choices.
      let rel = rels[0]!;
      let chain: string[] | null = null;
      for (const r of rels.slice(0, 30)) {
        const c = angleChain(r.fact, ps, chainCtx(d.fact));
        if (c && (!chain || c.length < chain.length)) [chain, rel] = [c, r];
      }
      return chain
        ? ["Ta có:", ...chain, `⇒ ${rel.text}`, `⇒ ${rel.then}`, `⇒ ${show(f)}.`]
        : ["Ta có:", ...shown.map(bullet), `⇒ ${rel.text} (cộng, trừ các góc)`, `⇒ ${rel.then}`, `⇒ ${show(f)}.`];
    }
    case "RIGHT_TRIANGLE_RELATIONS": {
      const right = P.find((x): x is Fact & { t: "perp" } => x.t === "perp" && x.a.some((q) => x.b.includes(q)));
      const alt = P.find((x): x is Fact & { t: "perp" } => x.t === "perp" && x !== right);
      if (!right || !alt) return [...shown.map(bullet), `⇒ ${show(f)} (hệ thức lượng trong tam giác vuông).`];
      const e = right.a.find((q) => right.b.includes(q))!;
      const [x, y] = [right.a.find((q) => q !== e)!, right.b.find((q) => q !== e)!];
      const h = alt.a.includes(e) ? alt.a.find((q) => q !== e)! : alt.b.find((q) => q !== e)!;
      return [
        `△${x}${e}${y} vuông tại ${e} có đường cao ${e}${h}:`,
        ...premises.filter((p) => p.fact.t === "perp").map((p) => bullet(words(p))),
        `⇒ ${show(f)} (hệ thức lượng trong tam giác vuông).`,
      ];
    }
    case "LENGTH_ALGEBRA": {
      if (!shown.length) return [`${show(f)}.`];
      // As a chain of equalities when one exists: each "=" substitutes one segment or ratio.
      const chain = lengthChain(f, premises.map((p): Premise => ({ fact: p.fact, reason: chainReason(p, words(p)) })), positions);
      if (chain) return ["Ta có:", ...chain, `⇒ ${show(f)}.`];
      // Similar triangles are written with their proportion, so the algebra can be followed.
      const body = premises.filter(needed).map((p) => (p.fact.t === "simtri" ? bullet(`${proportion(p.fact)} (${words(p).replace(/^.*?\((.*)\)$/, "$1")})`) : bullet(words(p))));
      return [...body, `⇒ ${show(f)}.`];
    }
    case "ANGLE_CHASE": {
      if (!shown.length) return [`${show(f)}.`];
      // As a chain of equalities when one exists: each "=" uses one fact (no "cộng, trừ các góc" leap).
      const chain = angleChain(f, premises.map((p): Premise => ({ fact: p.fact, reason: chainReason(p, words(p)) })), chainCtx(d.fact));
      // One equality straight from similar triangles: "⇒ ∠IHD = ∠IDK (hai góc tương ứng)".
      if (chain && chain.length === 1) {
        const why = /\(([^()]*(?:\([^()]*\))?[^()]*)\)$/.exec(chain[0]!)?.[1] ?? "";
        return [`⇒ ${show(f)} (${why.includes("∽") ? `hai góc tương ứng của ${why}` : why}).`];
      }
      if (chain) return ["Ta có:", ...chain, `⇒ ${show(f)}.`];
      return ["Ta có:", ...shown.map(bullet), `⇒ ${show(f)} (cộng, trừ các góc).`];
    }
    default:
      return [...shown.map(bullet), `⇒ ${show(f)}.`];
  }
}

export interface ExplainOptions {
  statement: string;
}

/** Builds the lesson for the proved goals of a plan (all goals should be proved and verified). */
export function explainPlan(plan: ProofPlan, opts: ExplainOptions): ModelLesson {
  if (!plan.figure) throw new Error("plan without a figure");
  positions = resolveFigure(plan.figure).points;
  visiblePoints = plan.figure.points.filter((p) => !p.hidden && positions[p.id]).map((p) => p.id);
  givenCols = new Set(
    plan.goals
      .flatMap((g) => g.proof)
      .filter((d) => d.premises.length === 0 && d.method !== "PREVIOUS_PART")
      .flatMap((d) => (d.fact.t === "col" ? [colKey(...d.fact.p)] : d.fact.t === "midp" ? [colKey(d.fact.a, d.fact.m, d.fact.b)] : [])),
  );
  // …and every point defined on a line by the construction.
  for (const pt of plan.figure.points) {
    if (pt.hidden) continue;
    const r = pt.refs;
    if (pt.kind === "midpoint" || pt.kind === "on_segment") givenCols.add(colKey(pt.id, r[0]!, r[1]!));
    if (pt.kind === "foot") givenCols.add(colKey(pt.id, r[1]!, r[2]!));
    if (pt.kind === "line_circle" && positions[r[0]!] && positions[r[1]!]) givenCols.add(colKey(pt.id, r[0]!, r[1]!));
    if (pt.kind === "intersection") for (const [a, b] of [[r[0]!, r[1]!], [r[2]!, r[3]!]]) if (positions[a!] && positions[b!] && !plan.figure.points.find((q) => q.id === a || q.id === b)?.hidden) givenCols.add(colKey(pt.id, a!, b!));
  }
  type Item = { part: string; d: Derivation; goal: PlanGoal | null; owner: PlanGoal };
  const items: Item[] = [];
  const stepOf = new Map<string, string>(); // fact key text → step id
  const steps: Step[] = [];
  const hints: Hint[] = [];
  const concepts = new Set<string>();

  // Collinearities that follow from constructions alone are not worth citing (tagged for `needed`).
  for (const g of plan.goals) {
    const byId = new Map(g.proof.map((d) => [d.id, d]));
    for (const d of g.proof)
      if (d.fact.t === "col" && d.premises.length > 0 && d.premises.every((p) => { const q = byId.get(p)!; return q.premises.length === 0 && q.method === "CONSTRUCTION"; })) d.note = "construction-only";
  }

  // Per goal, its proof's derivations in order; shared derivations (same fact) are stated once.
  const stated = new Set<string>();
  for (const g of plan.goals) {
    if (!g.proved) continue;
    const byId = new Map(g.proof.map((d) => [d.id, d]));
    for (const d of g.proof) {
      const key = sameKey(d.fact);
      const isGoal = factKey(d.fact) === factKey(g.fact);
      if (stated.has(key) || (inline(d, byId) && !isGoal)) continue;
      stated.add(key);
      // A derivation is a goal's step when it proves any goal of the problem (it may first appear in another's proof).
      items.push({ part: g.part, d, goal: plan.goals.find((x) => x.proved && factKey(x.fact) === factKey(d.fact)) ?? null, owner: g });
    }
  }

  // Words for a premise: a fact proved in an earlier step is cited as such; a given or a one-line consequence with its
  // reason in brackets.
  const words = (p: Derivation, byId: Map<number, Derivation>): string => {
    const text = show(p.fact);
    // ∠EAI and ∠JAE are one angle when J lies on ray AI: say so instead of citing a proof.
    if (p.fact.t === "eqangle" && sameAngle(p.fact)) return `∠${p.fact.a.join("")} là góc chung`;
    if (p.method === "PREVIOUS_PART" && stepOf.has(sameKey(p.fact))) return `${text} (⟦${sameKey(p.fact)}⟧)`;
    if (p.premises.length === 0) {
      if (p.method === "CONCYCLIC_GIVEN") {
        const circle = givenReason(p).replace(/^cùng thuộc /, "");
        return /^\(.*\)$/.test(circle) ? `${text} ${circle}` : `${text} (${circle})`;
      }
      return `${text} (${givenReason(p)})`;
    }
    // An earlier step is cited by its number (filled in once steps are final).
    if (stepOf.has(sameKey(p.fact))) return `${text} (⟦${sameKey(p.fact)}⟧)`;
    if (p.method === "ISOSCELES") {
      const c = byId.get(p.premises[0]!)!.fact as Fact & { t: "cong" };
      const v = c.a.find((x) => c.b.includes(x))!;
      const [x, y] = [c.a.find((q) => q !== v)!, c.b.find((q) => q !== v)!];
      return `${text} (△${v}${x}${y} cân tại ${v})`;
    }
    if (inline(p, byId)) {
      const qs = p.premises.map((q) => byId.get(q)!).filter(needed);
      const radii = qs.length > 0 && qs.every((q) => q.method === "CIRCLE_RADIUS");
      if (radii) return `${text} (bán kính)`;
      const why = qs.map((q) => (q.premises.length === 0 ? `${show(q.fact)}, ${givenReason(q)}` : show(q.fact)));
      return why.length ? `${text} (vì ${why.join("; ")})` : text;
    }
    return text;
  };

  // Steps (merged when too many).
  type Draft = { part: string; facts: Fact[]; texts: string[]; reasons: string[]; uses: Set<string>; goal: PlanGoal | null; goals: PlanGoal[] };
  const drafts: Draft[] = [];
  const lastDerivation = new Map<Draft, Derivation>();
  for (const it of items) {
    // The proof this step belongs to (each claim has its own search, so ids are per proof).
    const g = it.owner;
    const byId = new Map(g.proof.map((d) => [d.id, d]));
    const premises = it.d.premises.map((p) => byId.get(p)!);
    currentProof = g.proof;
    // A goal is written as the statement writes it (the same fact, possibly in another order).
    const ls = lines(it.goal ? { ...it.d, fact: it.goal.fact } : it.d, premises, (p) => words(p, byId));
    // "đường tròn này đi qua O": the circle through three of the points is unique, so it is the same circle.
    if (it.goal?.label.startsWith("đường tròn qua") && it.d.fact.t === "cyclic" && it.d.method !== "CYCLIC_SAME_CIRCLE") {
      const three = it.d.fact.p.filter((x) => it.goal!.label.includes(x) && !it.goal!.label.endsWith(`đi qua ${x}`));
      ls.push(`Qua ba điểm ${three.join(", ")} chỉ có một đường tròn ⇒ ${it.goal.label.replace(/^đường tròn qua/, "đường tròn đi qua")}.`);
    }
    // A goal stated through an auxiliary point: say what the point is, and what the collinearity means for the claim.
    const aux = it.goal ? plan.auxiliary.find((a) => it.goal!.fact.t === "col" && it.goal!.fact.p.includes(a.id)) : undefined;
    if (aux && it.goal && it.goal.fact.t === "col") {
      const others = it.goal.fact.p.filter((x) => x !== aux.id).join("");
      ls.unshift(`${aux.text}. Ta chứng minh ${it.goal.fact.p.join(", ")} thẳng hàng.`);
      const meet = /^(\S+), (\S+) cắt nhau trên (.+)$/.exec(it.goal.label);
      ls.push(
        meet
          ? `Vậy đường thẳng ${others} đi qua ${aux.id}; ${aux.id} thuộc đường thẳng ${meet[1]} và thuộc ${meet[3]} ⇒ ${meet[1]}, ${meet[2]} cắt nhau tại ${aux.id} trên ${meet[3]}.`
          : `Vậy ${others} đi qua ${aux.id} ⇒ ${it.goal.label}.`,
      );
    }
    const text = ls.join("\n");
    const m = method(it.d.method);
    if (m && m.category !== "given") concepts.add(m.vi.split(" (")[0]!);
    const uses = new Set(premises.map((p) => stepOf.get(sameKey(p.fact))).filter((x): x is string => !!x));
    // "∠AED = ∠AFD … ⇒ tứ giác nội tiếp": a step that only draws a conclusion from the step just before it continues
    // that step instead of starting a new one.
    const prev = drafts[drafts.length - 1];
    const shownPremises = premises.filter(needed);
    const prevFact = prev?.facts[prev.facts.length - 1];
    const prevD = prev ? lastDerivation.get(prev) : undefined;
    const sameBisector =
      it.d.method === "PERPENDICULAR_BISECTOR" && prevD?.method === "PERPENDICULAR_BISECTOR" &&
      it.d.premises.filter((x) => byId.get(x)?.fact.t === "cong").every((x) => prevD.premises.includes(x));
    if (prev && sameBisector && prev.part === it.part) {
      // "AI là đường trung trực của EF" gives both AI ⊥ EF and "AI đi qua trung điểm J": one step.
      prev.facts.push(it.goal ? it.goal.fact : it.d.fact);
      prev.texts[prev.texts.length - 1] = prev.texts[prev.texts.length - 1]!.replace(/\.$/, "") + "\n" + ls.filter((l) => !l.startsWith("• ") && !l.includes("là đường trung trực")).join("\n");
      prev.goal = it.goal ?? prev.goal;
      if (it.goal) prev.goals.push(it.goal);
      stepOf.set(sameKey(it.d.fact), `s${drafts.length}`);
      continue;
    }
    if (prev && !prev.goal && prev.part === it.part && shownPremises.length === 1 && prevFact && factKey(shownPremises[0]!.fact) === factKey(prevFact)) {
      prev.facts.push(it.goal ? it.goal.fact : it.d.fact);
      prev.texts[prev.texts.length - 1] = prev.texts[prev.texts.length - 1]!.replace(/\.$/, "") + "\n" + ls.filter((l) => !l.startsWith("• ")).join("\n");
      if (m) prev.reasons = [...new Set([...prev.reasons, m.vi.split(" (")[0]!])];
      prev.goal = it.goal;
      if (it.goal) prev.goals.push(it.goal);
      lastDerivation.set(prev, it.d);
      stepOf.set(sameKey(it.d.fact), `s${drafts.length}`);
      continue;
    }
    drafts.push({ part: it.part, facts: [it.goal ? it.goal.fact : it.d.fact], texts: [text], reasons: m ? [m.vi.split(" (")[0]!] : [], uses, goal: it.goal, goals: it.goal ? [it.goal] : [] });
    lastDerivation.set(drafts[drafts.length - 1]!, it.d);
    stepOf.set(sameKey(it.d.fact), `s${drafts.length}`);
  }
  // Merge while too long: the first pair of adjacent non-goal steps in the same part.
  while (drafts.length > MAX_STEPS) {
    // The adjacent pair (same part, the first not a goal) with the least text, so merged steps stay short.
    const size = (x: Draft) => x.texts.join("").length;
    let i = -1;
    for (let k = 0; k + 1 < drafts.length; k++) {
      const [a, b] = [drafts[k]!, drafts[k + 1]!];
      if (a.goal || a.part !== b.part) continue;
      if (i < 0 || size(a) + size(b) < size(drafts[i]!) + size(drafts[i + 1]!)) i = k;
    }
    if (i < 0) i = drafts.findIndex((x, k) => k + 1 < drafts.length && drafts[k + 1]!.part === x.part);
    if (i < 0) break;
    const [a, b] = [drafts[i]!, drafts[i + 1]!];
    drafts.splice(i, 2, { part: a.part, facts: [...a.facts, ...b.facts], texts: [...a.texts, ...b.texts], reasons: [...new Set([...a.reasons, ...b.reasons])], uses: new Set([...a.uses, ...b.uses]), goal: b.goal ?? a.goal, goals: [...a.goals, ...b.goals] });
  }
  // Ids after merging: map each fact to its final step.
  const finalId = new Map<string, string>();
  drafts.forEach((dr, i) => dr.facts.forEach((f) => finalId.set(sameKey(f), `s${i + 1}`)));
  const oldToFact = new Map([...stepOf].map(([fact, id]) => [id, fact]));
  drafts.forEach((dr, i) => {
    const id = `s${i + 1}`;
    const uses = [...new Set([...dr.uses].map((u) => finalId.get(oldToFact.get(u)!)!).filter((u) => u && u !== id))].slice(0, 4);
    const pts = [...new Set(dr.facts.flatMap(factPoints))].slice(0, 10);
    const label = dr.part ? `Câu ${dr.part}: ` : "";
    const head = dr.goals.length ? `${label}${dr.goals.map((g) => g.label).join("; ")}` : `${label}${factText(dr.facts[dr.facts.length - 1]!)}`;
    steps.push({
      id,
      title: head.slice(0, 300),
      explanation: dr.texts.join("\n\n").slice(0, 1500),
      math: dr.facts.map(factLatex).join(" \\\\ ").slice(0, 800),
      reason: dr.reasons.join("; ").slice(0, 300) || null,
      uses,
      geometryActions: pts.length ? [{ action: "highlight", targets: pts }] : [],
    });
  });

  // One hint per goal: a question pointing at the idea, and (hidden until asked) the idea itself in words — which
  // angles, triangles or segments, and the facts that give them.
  for (const g of plan.goals.filter((x) => x.proved)) {
    if (hints.length >= 8) break;
    const d = g.proof.find((x) => factKey(x.fact) === factKey(g.fact));
    if (!d) continue;
    const sid = finalId.get(sameKey(d.fact));
    if (!sid) continue;
    const byId = new Map(g.proof.map((x) => [x.id, x]));
    const h = hintFor(d, byId, (p) => words(p, byId));
    hints.push({
      id: `h${hints.length + 1}`,
      level: 2,
      question: h.question.slice(0, 300),
      cue: h.cue,
      explanation: h.explanation.slice(0, 1500),
      math: factLatex(g.fact),
      stepId: sid,
      focus: [...new Set([...factPoints(g.fact), ...h.focus])].slice(0, 10),
    });
  }

  // Step numbers for "(bước N)" citations.
  const cite = (t: string, own?: string) =>
    t
      .replace(/ \(⟦([^⟧]+)⟧\)/g, (all, k: string) => (finalId.get(k) === own ? "" : all)) // a fact of this same step: no citation
      .replace(/, ⟦([^⟧]+)⟧/g, (all, k: string) => (finalId.get(k) === own ? "" : all))
      .replace(/⟦([^⟧]+)⟧/g, (_, k: string) => (finalId.get(k) ? `bước ${finalId.get(k)!.slice(1)}` : "chứng minh trên"));
  for (const st of steps) st.explanation = cite(st.explanation, st.id);
  // Hints are read before the solution: they never point at solution steps. A fact another hint leads to is cited as
  // that hint ("gợi ý 1"); anything else is stated without a reference.
  // In proof order (a hint may build on an earlier one), renumbered.
  hints.sort((a, b) => Number(a.stepId.slice(1)) - Number(b.stepId.slice(1)));
  hints.forEach((h, i) => (h.id = `h${i + 1}`));
  const hintOfFact = new Map<string, number>();
  hints.forEach((h, i) => {
    for (const [k, sid] of finalId) if (sid === h.stepId && !hintOfFact.has(k)) hintOfFact.set(k, i + 1);
  });
  hints.forEach((h, i) => {
    h.explanation = h.explanation
      .replace(/ \(⟦([^⟧]+)⟧\)/g, (_, k: string) => {
        const n = hintOfFact.get(k);
        return n !== undefined && n < i + 1 ? ` (gợi ý ${n})` : "";
      })
      .replace(/⟦([^⟧]+)⟧/g, "");
  });

  const goalsText = plan.goals.filter((g) => g.proved).map((g) => `${g.part ? `(${g.part}) ` : ""}${g.label}`);
  // What the problem gives, in its own words: the sentences of the statement before the first question.
  const opening = opts.statement
    .replace(/^\s*(Câu|Bài)\s*\d+[.:]?\s*/i, "")
    .split(/(?:^|\s)[a-f]\)\s|chứng minh|Chứng minh/)[0]!;
  const givens = opening
    .split(/(?<=[.;])\s+/)
    .map((x) => x.trim().replace(/[.;]$/, ""))
    .filter((x) => x.length > 3)
    .map((x) => x.slice(0, 300))
    .slice(0, 12);
  return {
    analysis: {
      statement: opts.statement,
      language: "vi",
      topic: "geometry",
      subtopic: "Chứng minh hình học",
      gradeLevel: 9,
      withinCurriculum: true,
      concepts: [...concepts].slice(0, 8),
      techniques: [],
      givens,
      unknowns: [],
      constraints: [],
      status: "solvable",
      statusReason: null,
      interpretationNotes: [],
    },
    strategy: `Chứng minh lần lượt: ${goalsText.join("; ")}. Mỗi bước chỉ dùng giả thiết, cách dựng hình và các kết quả đã chứng minh trước đó${plan.auxiliary.length ? `; vẽ thêm: ${plan.auxiliary.map((a) => a.text).join("; ")}` : ""}.`.slice(0, 1500),
    hints,
    steps,
    finalAnswer: { text: `Đã chứng minh: ${goalsText.join("; ")}.`.slice(0, 1500), math: null },
    answerChecks: [],
    figure: plan.figure,
  };
}

/** The hint for a goal's final derivation. */
function hintFor(d: Derivation, byId: Map<number, Derivation>, words: (p: Derivation) => string): { question: string; cue: string | null; explanation: string; focus: string[] } {
  const premises = d.premises.map((p) => byId.get(p)!);
  const shown = premises.filter(needed);
  const list = shown.map((p) => bullet(words(p)));
  const f = d.fact;
  /** How a key premise was obtained, in one line (its own needed premises). */
  const how = (p: Derivation) => {
    const qs = p.premises.map((q) => byId.get(q)!).filter(needed);
    return qs.length ? [`Để có ${show(p.fact)}, dùng:`, ...qs.map((q) => bullet(words(q)))].join("\n") : "";
  };
  switch (d.method) {
    case "CYCLIC_QUADRILATERAL": {
      const r = premises[0]!;
      const q = f.t === "cyclic" ? quad([...f.p]) : "";
      if (r.fact.t === "eqangle") {
        const [x, v, y] = r.fact.a;
        const w = r.fact.b[1];
        return {
          question: `Trong tứ giác ${q}, hai đỉnh nào cùng nhìn một cạnh dưới hai góc bằng nhau?`,
          cue: "Tứ giác có hai đỉnh kề nhau cùng nhìn một cạnh dưới hai góc bằng nhau thì nội tiếp",
          explanation: [`Hướng: chứng minh ${show(r.fact)}.`, `Khi đó ${v} và ${w} cùng nhìn cạnh ${x}${y} dưới hai góc bằng nhau ⇒ tứ giác ${q} nội tiếp.`, how(r)].filter(Boolean).join("\n"),
          focus: [...r.fact.a, ...r.fact.b],
        };
      }
      return {
        question: `Tứ giác ${q} có hai góc đối nào có tổng bằng 180°?`,
        cue: "Tứ giác có tổng hai góc đối bằng 180° thì nội tiếp",
        explanation: [`Hướng: chứng minh ${show(r.fact)}.`, `Đó là hai góc đối của tứ giác ${q} ⇒ tứ giác nội tiếp.`, how(r)].filter(Boolean).join("\n"),
        focus: factPoints(r.fact),
      };
    }
    case "SIMILAR_AA":
    case "SIMILAR_SAS": {
      const t = f as Fact & { t: "simtri" };
      return {
        question: `△${t.a.join("")} và △${t.b.join("")} có những cặp góc (hoặc cặp cạnh tỉ lệ) nào bằng nhau?`,
        cue: d.method === "SIMILAR_AA" ? "Trường hợp đồng dạng góc – góc" : "Trường hợp đồng dạng cạnh – góc – cạnh",
        explanation: [`Hướng: xét △${t.a.join("")} và △${t.b.join("")}:`, ...list, `⇒ hai tam giác đồng dạng (${d.method === "SIMILAR_AA" ? "g.g" : "c.g.c"}).`].join("\n"),
        focus: [...t.a, ...t.b],
      };
    }
    case "LENGTH_ALGEBRA": {
      const rt = premises.find((p) => p.method === "RIGHT_TRIANGLE_RELATIONS");
      if (rt) {
        const right = rt.premises.map((q) => byId.get(q)!.fact).find((x): x is Fact & { t: "perp" } => x.t === "perp" && x.a.some((q) => x.b.includes(q)));
        const alt = rt.premises.map((q) => byId.get(q)!.fact).find((x): x is Fact & { t: "perp" } => x.t === "perp" && x !== right);
        const e = right?.a.find((q) => right.b.includes(q));
        const tri = right && e ? `${right.a.find((q) => q !== e)}${e}${right.b.find((q) => q !== e)}` : "";
        const h = alt && e ? (alt.a.includes(e) ? alt.a.find((q) => q !== e) : alt.b.find((q) => q !== e)) : "";
        const rest = shown.filter((p) => p !== rt).map((p) => words(p));
        return {
          question: tri ? `Tam giác vuông nào có đường cao liên quan đến các đoạn thẳng trong đẳng thức?` : "Có tam giác vuông nào với đường cao không?",
          cue: "Hệ thức lượng trong tam giác vuông: bình phương cạnh góc vuông bằng tích hình chiếu và cạnh huyền",
          explanation: [
            tri ? `Hướng: △${tri} vuông tại ${e} có đường cao ${e}${h} ⇒ ${show(rt.fact)}.` : `Hướng: ${show(rt.fact)} (hệ thức lượng).`,
            ...(rest.length ? [`Rồi dùng ${rest.join("; ")}`] : []),
            `⇒ ${show(f)}.`,
          ].join("\n"),
          focus: tri ? [...tri, h ?? ""].filter(Boolean) : factPoints(f),
        };
      }
      const sim = premises.find((p) => p.fact.t === "simtri");
      if (sim && sim.fact.t === "simtri") {
        const t = sim.fact;
        return {
          question: "Các đoạn thẳng trong đẳng thức là cạnh của hai tam giác đồng dạng nào?",
          cue: "Tỉ số các cạnh tương ứng của hai tam giác đồng dạng",
          explanation: [`Hướng: chứng minh △${t.a.join("")} ∽ △${t.b.join("")}, rồi viết tỉ số các cạnh tương ứng.`, ...list.filter((l) => !l.includes("∽")), `⇒ ${show(f)}.`].join("\n"),
          focus: [...t.a, ...t.b],
        };
      }
      return { question: "Những đoạn thẳng nào đã biết là bằng nhau hoặc tỉ lệ?", cue: null, explanation: ["Hướng: từ", ...list, `⇒ ${show(f)}.`].join("\n"), focus: shown.flatMap((p) => factPoints(p.fact)) };
    }
    case "SAME_LINE":
      if (f.t === "col" && !shown.every((p) => p.fact.t === "perp" || p.fact.t === "para")) {
        const rel = collinearAngle(f, premises.flatMap((p) => factPoints(p.fact)));
        return {
          question: `Để chứng minh ${show(f)}, có thể chứng minh hai góc nào bằng nhau?`,
          cue: "Hai tia cùng tạo với một tia góc bằng nhau (cùng phía) thì trùng nhau",
          explanation: [rel ? `Hướng: chứng minh ${rel.text}, khi đó ${rel.then}.` : "Hướng:", "Dùng:", ...list].join("\n"),
          focus: [...f.p],
        };
      }
      return {
        question: "Hai đường thẳng nào đi qua cùng một điểm và cùng vuông góc (hoặc cùng song song) với một đường thẳng?",
        cue: "Qua một điểm chỉ có một đường thẳng vuông góc (song song) với một đường thẳng cho trước",
        explanation: ["Hướng:", ...list, `⇒ hai đường thẳng trùng nhau, nên ${show(f)}.`].join("\n"),
        focus: shown.flatMap((p) => factPoints(p.fact)),
      };
    case "ANGLE_CHASE":
      return {
        question: "Những góc nào đã biết là bằng nhau (góc nội tiếp, tam giác cân, góc vuông) liên quan đến các góc cần chứng minh?",
        cue: "Cộng, trừ các góc đã biết",
        explanation: ["Hướng: dùng", ...list, `rồi cộng, trừ góc ⇒ ${show(f)}.`].join("\n"),
        focus: shown.flatMap((p) => factPoints(p.fact)),
      };
    case "POWER_OF_POINT_CONVERSE":
      return { question: "Có đẳng thức tích các đoạn thẳng nào trên hai đường thẳng cắt nhau không?", cue: "MA·MB = MC·MD thì A, B, C, D cùng thuộc một đường tròn", explanation: ["Hướng:", ...list, `⇒ ${show(f)}.`].join("\n"), focus: shown.flatMap((p) => factPoints(p.fact)) };
    default:
      return { question: `Dùng tính chất nào để chứng minh ${show(f)}?`, cue: method(d.method)?.vi ?? null, explanation: ["Hướng:", ...list, `⇒ ${show(f)} (${method(d.method)?.vi.split(" (")[0] ?? ""}).`].join("\n"), focus: shown.flatMap((p) => factPoints(p.fact)) };
  }
}

/**
 * Can a student follow the planner's own write-up? Every stated step cites at most `maxPremises` facts and the proof
 * fits in the lesson without merging steps. (A verified but unreadable proof is still correct — it is then given to
 * the solver as verified facts instead of being shown as is.)
 */
export function planReadability(plan: ProofPlan, maxPremises = 8): { readable: boolean; steps: number; maxCited: number } {
  if (plan.figure) positions = resolveFigure(plan.figure).points;
  const stated = new Set<string>();
  let maxCited = 0;
  for (const g of plan.goals) {
    if (!g.proved) continue;
    const byId = new Map(g.proof.map((d) => [d.id, d]));
    for (const d of g.proof) {
      const key = factKey(d.fact);
      if (stated.has(key) || (inline(d, byId) && key !== factKey(g.fact))) continue;
      stated.add(key);
      maxCited = Math.max(maxCited, d.premises.length);
    }
  }
  return { readable: maxCited <= maxPremises && stated.size <= MAX_STEPS, steps: stated.size, maxCited };
}

/** The verified results of a plan as notes for the solver's prompt (facts it may rely on, with how they follow). */
export function verifiedFactsNote(plan: ProofPlan): string | null {
  const proved = plan.goals.filter((g) => g.proved);
  if (proved.length === 0) return null;
  const lines = proved.map((g) => {
    const key = g.proof.filter((d) => d.premises.length > 0 && !inline(d, new Map(g.proof.map((x) => [x.id, x]))));
    const chain = key.slice(-6).map((d) => `${factText(d.fact)} [${method(d.method)?.vi.split(" (")[0] ?? d.method}]`).join(" → ");
    return `- ${g.part ? `(${g.part}) ` : ""}${g.label}: ĐÃ CHỨNG MINH VÀ KIỂM TRA. Hướng: ${chain}`;
  });
  return `Kết quả đã được bộ chứng minh tự động chứng minh và kiểm tra từng bước (dùng được, nên đi theo hướng này):\n${lines.join("\n")}${plan.auxiliary.length ? `\nĐiểm phụ đã dùng: ${plan.auxiliary.map((a) => a.text).join("; ")}` : ""}`;
}
