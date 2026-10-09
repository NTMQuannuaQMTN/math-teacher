/**
 * Problem → proof plan. The front end of the proof planner:
 *
 *   statement → exact figure (figureFromText) → given facts (constructions + shape words) → goals ("chứng minh" claims)
 *   → bounded search (engine.ts) → proof extraction (only the derivations a goal depends on) → status.
 *
 * No model call happens here. A goal is proved only through registered methods from given facts.
 */
import { parseClaims, statementGivens, statementParts, type StructuredClaim } from "../claims";
import { figureFromStatement } from "../figureFromText";
import type { Figure, FigureCheck, PointDef } from "../solution";
import { constructionFacts, minimize, Oracle, search, type Derivation, type ProofState, type SearchLimits } from "./engine";
import { factKey, factPoints, factText, type Fact, type Seg, type Tri } from "./facts";
import { resolveFigure } from "../geometry";
import { verifyProof, type VerifyResult } from "./verify";

export type PlanStatus = "VERIFIED" | "VERIFIED_WITH_CAVEAT" | "NEEDS_REVIEW" | "UNSOLVED_WITHIN_BOUNDARY" | "PARSING_UNCERTAIN";

export interface PlanGoal {
  part: string;
  label: string;
  fact: Fact;
  /** The derivations proving it, premises first (empty when not proved). */
  proof: Derivation[];
  proved: boolean;
  /** The independent verifier's report on `proof` (absent when nothing was found). */
  verification?: VerifyResult;
}

export interface ProofPlan {
  status: PlanStatus;
  reason: string;
  figure: Figure | null;
  goals: PlanGoal[];
  /** Goals the statement asks for that the parser couldn't turn into facts (computations, extremes, loci…). */
  unparsed: string[];
  /** Auxiliary points the planner introduced to state a goal, each with its (well-defined) construction. */
  auxiliary: { id: string; text: string; part: string }[];
  /** Parts asking to compute or find (handled by the solver, not the planner). */
  computeParts: string[];
  stats: { givens: number; facts: number; rounds: number; elapsedMs: number };
  log: string[];
}

/** A claim from the statement as a fact the engine can reason about (null when it has no fact form). */
export function claimFact(c: StructuredClaim): Fact | null {
  if (c.kind === "product") return { t: "prod", lhs: c.lhs as Fact & { t: "prod" } extends { lhs: infer L } ? L : never, rhs: c.rhs as never };
  if (c.kind === "similar") return { t: "simtri", a: c.a, b: c.b };
  const r = c.refs;
  switch (c.kind) {
    case "equal_length":
      return { t: "cong", a: [r[0]!, r[1]!], b: [r[2]!, r[3]!] };
    case "equal_angle":
      return { t: "eqangle", a: [r[0]!, r[1]!, r[2]!], b: [r[3]!, r[4]!, r[5]!] };
    case "angle_value":
      return c.value == null ? null : { t: "aval", a: [r[0]!, r[1]!, r[2]!], v: c.value };
    case "perpendicular":
      return { t: "perp", a: [r[0]!, r[1]!], b: [r[2]!, r[3]!] };
    case "parallel":
      return { t: "para", a: [r[0]!, r[1]!], b: [r[2]!, r[3]!] };
    case "collinear":
      return { t: "col", p: [r[0]!, r[1]!, r[2]!] };
    case "concyclic":
      return { t: "cyclic", p: [r[0]!, r[1]!, r[2]!, r[3]!] };
    default:
      return null;
  }
}

const checkFact = (g: FigureCheck): Fact | null => claimFact({ kind: g.kind as never, refs: g.refs, value: g.value });

/** Only the derivations a goal depends on, premises before conclusions. */
export function extractProof(state: ProofState, goal: Derivation): Derivation[] {
  const facts = state.facts;
  const collect = (withGoal: boolean) => {
    const need = new Set<number>();
    const visit = (id: number) => {
      if (need.has(id)) return;
      need.add(id);
      minimize(state, facts[id]!, withGoal ? goal.id : undefined);
      for (const p of facts[id]!.premises) visit(p);
    };
    visit(goal.id);
    return need;
  };
  // Then again, so each algebraic step can reuse facts the rest of the proof states anyway (until nothing changes).
  let need = collect(false);
  const signature = (n: Set<number>) => [...n].sort((a, b) => a - b).map((id) => `${id}<${facts[id]!.premises.join(",")}>`).join(" ");
  for (let pass = 0, last = signature(need); pass < 6; pass++) {
    need = collect(true);
    const now = signature(need);
    if (now === last) break;
    last = now;
  }
  // Premises before conclusions (a step may now cite a fact the search found later, so order by dependency).
  const order: number[] = [];
  const done = new Set<number>();
  const place = (id: number) => {
    if (done.has(id)) return;
    done.add(id);
    for (const p of [...facts[id]!.premises].sort((a, b) => a - b)) place(p);
    order.push(id);
  };
  for (const id of [...need].sort((a, b) => a - b)) place(id);
  return order.map((id) => facts[id]!);
}

const fresh = (taken: Set<string>) => ["P", "Q", "X", "Y", "Z", "T", "U", "V", "W", "N", "M", "S", "R"].find((x) => !taken.has(x)) ?? "X'";
const point = (id: string, kind: PointDef["kind"], refs: string[], value: number | null = null): PointDef => ({ id, label: id, kind, refs, x: null, y: null, value, value2: null, draggable: false, hidden: false });

/**
 * Claims stated through a point the statement doesn't name. Each introduces one well-defined auxiliary point and
 * reduces the claim to a collinearity:
 *   "AL, GJ cắt nhau trên (I)"         → P = second intersection of AL with (I); goal G, J, P collinear
 *   "DK đi qua trung điểm của IR"      → M = midpoint of IR; goal D, K, M collinear
 */
function auxClaim(fragment: string, figure: Figure): { point: PointDef; text: string; fact: Fact & { t: "col" }; label: string } | null {
  const t = fragment.replace(/\$/g, "").replace(/\s+/g, " ");
  const taken = new Set(figure.points.map((p) => p.id));
  const L = "([A-Z]'*)([A-Z]'*)";
  let m = new RegExp(`${L}\\s*(?:,|và)\\s*${L}\\s+cắt nhau (?:tại một điểm )?(?:trên|thuộc|nằm trên)\\s+(?:đường tròn\\s+)?\\(([A-Z]'*)\\)`).exec(t);
  if (m) {
    const [a, b, c, d, name] = m.slice(1) as [string, string, string, string, string];
    const circle = figure.circles.find((k) => k.label === `(${name})` || k.center === name);
    if (!circle || ![a, b, c, d].every((x) => taken.has(x))) return null;
    const id = fresh(taken);
    // The intersection of AB with the circle that isn't already a named point (A or B may lie on it).
    const resolved = resolveFigure(figure).points;
    for (const v of [1, 0]) {
      const pt = point(id, "line_circle", [a, b, circle.id], v);
      const P = resolveFigure({ ...figure, points: [...figure.points, pt] }).points[id];
      if (!P || Object.values(resolved).some((q) => Math.hypot(q.x - P.x, q.y - P.y) < 1e-6)) continue;
      return {
        point: pt,
        text: `Gọi ${id} là giao điểm (khác ${[a, b].filter((x) => figure.points.find((p) => p.id === x)?.kind === "line_circle" || figure.points.find((p) => p.id === x)?.kind === "on_circle").join(", ") || "giao điểm đã có"}) của đường thẳng ${a}${b} với ${circle.label ?? name}`,
        fact: { t: "col", p: [c, d, id] },
        label: `${a}${b}, ${c}${d} cắt nhau trên ${circle.label ?? `(${name})`}`,
      };
    }
    return null;
  }
  m = new RegExp(`${L}\\s+đi qua trung điểm (?:của )?(?:đoạn (?:thẳng )?)?${L}`).exec(t);
  if (m) {
    const [a, b, c, d] = m.slice(1) as [string, string, string, string];
    if (![a, b, c, d].every((x) => taken.has(x))) return null;
    const id = fresh(taken);
    return { point: point(id, "midpoint", [c, d]), text: `Gọi ${id} là trung điểm của ${c}${d}`, fact: { t: "col", p: [a, b, id] }, label: `${a}${b} đi qua trung điểm của ${c}${d}` };
  }
  return null;
}

/** "$IB^2=ID^2=IA\\cdot IK$" → "$IB^2=ID^2$ và $ID^2=IA\\cdot IK$" (each link of a chain is a claim). */
export function splitChains(text: string): string {
  return text.replace(/\$([^$]+)\$/g, (whole, m: string) => {
    const sides = m.split(/(?<![<>!])=(?!=)/);
    if (sides.length < 3) return whole;
    return sides.slice(1).map((r, i) => `$${sides[i]!.trim()} = ${r.trim()}$`).join(" và ");
  });
}

/** "CEHK là hình bình hành" and the other special quadrilaterals as facts about the sides. */
function shapeClaims(text: string): { label: string; fact: Fact }[] {
  const t = text.replace(/\$/g, "");
  const out: { label: string; fact: Fact }[] = [];
  // Congruent triangles "△ABM = △ACM": similar, with one pair of corresponding sides equal.
  const tri = /(?:\\triangle|△|tam giác)\s*([A-Z]'*)([A-Z]'*)([A-Z]'*)\s*=\s*(?:\\triangle|△|tam giác)\s*([A-Z]'*)([A-Z]'*)([A-Z]'*)/.exec(t);
  if (tri) {
    const [a1, b1, c1, a2, b2, c2] = tri.slice(1) as [string, string, string, string, string, string];
    const name = `△${a1}${b1}${c1} = △${a2}${b2}${c2}`;
    out.push({ label: `${name} (△${a1}${b1}${c1} ∽ △${a2}${b2}${c2})`, fact: { t: "simtri", a: [a1, b1, c1], b: [a2, b2, c2] } });
    // The corresponding side that isn't shared (a shared side is equal to itself).
    const pairs: [Seg, Seg][] = [[[a1, b1], [a2, b2]], [[b1, c1], [b2, c2]], [[a1, c1], [a2, c2]]];
    const pair = pairs.find(([x, y]) => [...x].sort().join() !== [...y].sort().join());
    if (pair) out.push({ label: `${name} (${pair[0].join("")} = ${pair[1].join("")})`, fact: { t: "cong", a: pair[0], b: pair[1] } });
  }
  const m = /(?:tứ giác\s+)?([A-Z]'*)([A-Z]'*)([A-Z]'*)([A-Z]'*)\s+là\s+hình\s+(bình hành|chữ nhật|thoi|vuông)/.exec(t);
  if (!m) return out;
  const [a, b, c, d, kind] = m.slice(1) as [string, string, string, string, string];
  const name = `${a}${b}${c}${d} là hình ${kind}`;
  out.push({ label: `${name} (${a}${b} ∥ ${d}${c})`, fact: { t: "para", a: [a, b], b: [d, c] } });
  out.push({ label: `${name} (${a}${d} ∥ ${b}${c})`, fact: { t: "para", a: [a, d], b: [b, c] } });
  if (kind === "chữ nhật" || kind === "vuông") out.push({ label: `${name} (${a}${b} ⊥ ${a}${d})`, fact: { t: "perp", a: [a, b], b: [a, d] } });
  if (kind === "thoi" || kind === "vuông") out.push({ label: `${name} (${a}${b} = ${a}${d})`, fact: { t: "cong", a: [a, b], b: [a, d] } });
  return out;
}

/**
 * The figure as far as a prefix of the statement defines it: visible points mentioned in the prefix (plus allowed
 * auxiliary points), hidden helpers whose references are all kept, circles whose center (and point) are kept.
 */
export function restrictFigure(figure: Figure, prefix: string, extra: Set<string>): Figure {
  const mentioned = new Set([...prefix.replace(/\\[a-zA-Z]+/g, " ").matchAll(/(?<!\p{Ll})([A-Z]'*)(?!\p{Ll})/gu)].map((m) => m[1]!));
  const keep = new Set<string>();
  const circles = new Set<string>();
  // Iterate to a fixed point: helpers and circles depend on points, points on circles.
  for (let changed = true; changed; ) {
    changed = false;
    for (const c of figure.circles) {
      if (circles.has(c.id)) continue;
      if (keep.has(c.center) && (!c.through || keep.has(c.through))) {
        circles.add(c.id);
        changed = true;
      }
    }
    for (const p of figure.points) {
      if (keep.has(p.id)) continue;
      const refsOk = p.refs.every((r) => keep.has(r) || circles.has(r));
      if (refsOk && (p.hidden || mentioned.has(p.id) || extra.has(p.id))) {
        keep.add(p.id);
        changed = true;
      }
    }
  }
  return {
    ...figure,
    points: figure.points.filter((p) => keep.has(p.id)),
    circles: figure.circles.filter((c) => circles.has(c.id)),
    lines: figure.lines.filter((l) => keep.has(l.from) && keep.has(l.to)),
    angles: figure.angles.filter((a) => keep.has(a.from) && keep.has(a.vertex) && keep.has(a.to)),
    marks: [],
    checks: [],
  };
}

const RELATION = /hình bình hành|hình chữ nhật|hình thoi|hình vuông|tam giác (?:cân|đều|vuông)|tiếp tuyến|lớn nhất|nhỏ nhất|cắt nhau|đi qua|tiếp xúc|thuộc|song song|vuông góc|bằng|=|cố định|nằm trên|thẳng hàng|nội tiếp|đồng dạng|trung điểm|phân giác|⊥|∥|\\perp|\\parallel/i;
const GOAL_PART = /chứng minh|prove|chứng tỏ/i;
const COMPUTE_PART = /tính|tìm|xác định|giá trị (lớn|nhỏ) nhất|compute|find/i;

export function planProof(statement: string, limits: Partial<SearchLimits> = {}): ProofPlan {
  const empty = (status: PlanStatus, reason: string): ProofPlan => ({ status, reason, figure: null, goals: [], unparsed: [], auxiliary: [], computeParts: [], stats: { givens: 0, facts: 0, rounds: 0, elapsedMs: 0 }, log: [] });
  const built = figureFromStatement(statement);
  if (!built) return empty("PARSING_UNCERTAIN", "the statement's figure could not be constructed");
  if (built.unbuilt.length) return { ...empty("PARSING_UNCERTAIN", `points not constructed: ${built.unbuilt.join(", ")}`), figure: built.figure };
  if (built.resolved.errors.length) return { ...empty("PARSING_UNCERTAIN", `figure errors: ${built.resolved.errors.join("; ")}`), figure: built.figure };

  let figure = built.figure;
  let oracle = new Oracle(resolveFigure(figure).points);
  const auxiliary: { id: string; text: string; part: string }[] = [];

  // Goals: the claims of each "chứng minh" part; parts asking to compute or find are not this planner's job.
  const goals: { part: string; label: string; fact: Fact }[] = [];
  const unparsed: string[] = [];
  const computeParts: string[] = [];
  const tryAux = (text: string, claims: { label: string; claim: StructuredClaim; fact: Fact }[], part: string) => {
    const aux = auxClaim(text, figure);
    if (!aux) return false;
    figure = { ...figure, points: [...figure.points, aux.point] };
    oracle = new Oracle(resolveFigure(figure).points);
    auxiliary.push({ id: aux.point.id, text: aux.text, part });
    claims.push({ label: aux.label, claim: { kind: "collinear", refs: [...aux.fact.p] as string[] }, fact: aux.fact });
    return true;
  };
  for (const part of statementParts(statement)) {
    if (!GOAL_PART.test(part.text)) {
      if (COMPUTE_PART.test(part.text)) computeParts.push(`${part.letter}: ${part.text.slice(0, 80)}`);
      continue;
    }
    const partText = splitChains(part.text);
    const body = partText.replace(/^.*?(chứng minh|prove|chứng tỏ)/is, "");
    const claims = parseClaims(body).map((c) => ({ ...c, fact: claimFact(c.claim) })).filter((c): c is typeof c & { fact: Fact } => !!c.fact);
    // "… thuộc một đường tròn và đường tròn này đi qua tâm O": the same circle through one more point.
    const also = /đường tròn (?:này|đó|trên)\s+(?:cũng\s+)?đi qua\s+(?:tâm\s+|điểm\s+)?\$?([A-Z]'*)/.exec(body);
    const lastCyclic = [...claims].reverse().find((c) => c.fact.t === "cyclic");
    if (also && lastCyclic && lastCyclic.fact.t === "cyclic" && !lastCyclic.fact.p.includes(also[1]!)) {
      const [a, b, c] = lastCyclic.fact.p;
      claims.push({ label: `đường tròn qua ${lastCyclic.fact.p.join(", ")} đi qua ${also[1]}`, claim: lastCyclic.claim, fact: { t: "cyclic", p: [a, b, c, also[1]!] } });
    }
    // Every "chứng minh" request must give at least one goal; one that doesn't (a locus, "cắt nhau trên (O)", …)
    // is reported, so the part is never called verified on the strength of its other claims alone.
    for (const sc of shapeClaims(body)) claims.push({ label: sc.label, claim: sc.fact.t === "simtri" ? { kind: "similar", a: sc.fact.a, b: sc.fact.b } : { kind: sc.fact.t === "para" ? "parallel" : sc.fact.t === "perp" ? "perpendicular" : "equal_length", refs: factPoints(sc.fact) }, fact: sc.fact });
    const requests = partText.split(/(?=chứng minh|chứng tỏ|prove)/i).filter((x) => GOAL_PART.test(x));
    // The same within one request: "A, G, D thẳng hàng và AL, GJ cắt nhau trên (I)" — a "và" fragment stating a
    // relation (a verb) that yields no claim was not understood.
    for (const r of requests) {
      const frags = r.replace(/^(chứng minh|chứng tỏ|prove)\s*(rằng|that)?/i, "").split(/\s+(?:và|and)\s+/);
      if (frags.length < 2) continue;
      frags.forEach((fr, i) => {
        if (!RELATION.test(fr) || parseClaims(fr).length > 0 || shapeClaims(fr).length > 0 || also?.[0]?.includes(fr.trim().slice(0, 20))) return;
        // "△DBE và △DCF đồng dạng", "A, B, C và D cùng thuộc…": the claim spans the "và".
        if (i > 0 && parseClaims(`${frags[i - 1]} và ${fr}`).length > parseClaims(frags[i - 1]!).length) return;
        if ((i > 0 && tryAux(`${frags[i - 1]} và ${fr}`, claims, part.letter)) || tryAux(fr, claims, part.letter)) return;
        unparsed.push(`${part.letter}: ${fr.trim().slice(0, 100)}`);
      });
    }
    for (const r of requests) {
      const body = r.replace(/^(chứng minh|chứng tỏ|prove)\s*(rằng|that)?/i, "");
      if (!/\s(và|and)\s/.test(body) && parseClaims(body).length === 0 && shapeClaims(body).length === 0 && !tryAux(body, claims, part.letter)) unparsed.push(`${part.letter}: ${r.trim().slice(0, 100)}`);
    }
    if (claims.length === 0 && !unparsed.some((u) => u.startsWith(`${part.letter}:`))) unparsed.push(`${part.letter}: ${body.trim().slice(0, 80)}`);
    for (const c of claims) {
      // A claim false on the exact figure is a parsing problem (or a wrong figure), never something to prove.
      if (!oracle.holds(c.fact)) {
        unparsed.push(`${part.letter}: ${c.label} (false on the constructed figure)`);
        continue;
      }
      goals.push({ part: part.letter, label: c.label, fact: c.fact });
    }
  }
  if (goals.length === 0) {
    // Nothing to prove: a computation problem is not the planner's (no status claim about it); otherwise the claims weren't understood.
    const status = unparsed.length ? "PARSING_UNCERTAIN" : computeParts.length ? "UNSOLVED_WITHIN_BOUNDARY" : "PARSING_UNCERTAIN";
    return { ...empty(status, unparsed.length ? "no claim of the statement understood" : "no proof goal (computation only)"), figure, unparsed, computeParts };
  }

  // Each part is searched with only the points defined up to it (a proof of part a may not use a point that part c
  // introduces), plus the auxiliary points of earlier parts and its own. Goals proved in earlier parts are available
  // as facts ("theo câu a").
  const parts = statementParts(statement);
  const partEnd = (letter: string) => {
    const p = parts.find((x) => x.letter === letter);
    return p ? statement.indexOf(p.text) + p.text.length : statement.length;
  };
  const planGoals: PlanGoal[] = [];
  const log: string[] = [];
  let totalFacts = 0, totalGivens = 0, rounds = 0, elapsed = 0;
  const previous: { fact: Fact; label: string; part: string }[] = [];
  for (const letter of [...new Set(goals.map((g) => g.part))]) {
    const partGoals = goals.filter((g) => g.part === letter);
    const allowedAux = new Set(auxiliary.filter((a) => partEnd(a.part) <= partEnd(letter)).map((a) => a.id));
    const sub = restrictFigure(figure, statement.slice(0, partEnd(letter)), allowedAux);
    const subOracle = new Oracle(resolveFigure(sub).points);
    const ids = new Set(sub.points.map((p) => p.id));
    const givens: { fact: Fact; method: string; note?: string }[] = constructionFacts(sub, subOracle);
    for (const g of statementGivens(statement, ids)) {
      const f = checkFact(g);
      if (f && subOracle.holds(f)) givens.push({ fact: f, method: "GIVEN" });
    }
    for (const p of previous) if (factPoints(p.fact).every((x) => ids.has(x))) givens.push({ fact: p.fact, method: "PREVIOUS_PART", note: `${p.part ? `câu ${p.part}` : "chứng minh trên"}: ${p.label}` });
    // Iterative deepening: the shallowest search that proves a goal gives its proof (shorter, more textbook-like).
    const maxDepth = limits.depth ?? 5;
    let res = search(sub, givens, partGoals.map((g) => g.fact), { ...limits, depth: 1 });
    const best = [...res.proved].map((d) => (d ? { d, state: res.state } : null));
    for (let depth = 2; depth <= maxDepth && best.some((b) => !b); depth++) {
      res = search(sub, givens, partGoals.map((g) => g.fact), { ...limits, depth });
      res.proved.forEach((d, i) => (best[i] ??= d ? { d, state: res.state } : null));
    }
    log.push(`part ${letter || "-"}: ${sub.points.filter((p) => !p.hidden).length} points, ${givens.length} givens`, ...res.log);
    totalFacts += res.state.facts.length;
    totalGivens += givens.length;
    rounds = Math.max(rounds, res.rounds);
    elapsed += res.elapsedMs;
    const shapeGivens = givens.filter((g) => g.method === "GIVEN").map((g) => g.fact);
    const prevFacts = givens.filter((g) => g.method === "PREVIOUS_PART").map((g) => g.fact);
    partGoals.forEach((g, i) => {
      const b = best[i];
      if (!b) return planGoals.push({ ...g, proved: false, proof: [] });
      const proof = extractProof(b.state, b.d);
      // A goal counts only when the independent verifier accepts every step of its proof.
      const verification = verifyProof(sub, proof, [g.fact], { statementGivens: shapeGivens, previous: prevFacts });
      if (!verification.ok) log.push(`verifier rejected "${g.label}": ${verification.steps.filter((x) => !x.ok).map((x) => `#${x.id} ${x.problems.join(", ")}`).join("; ")} ${verification.issues.join("; ")}`);
      if (verification.ok) {
        previous.push({ fact: g.fact, label: g.label, part: g.part });
        // Its intermediate results too ("A, I, J thẳng hàng" shown in part a is cited as "câu a" in part b).
        for (const x of proof) if (x.premises.length > 0 && !previous.some((q) => factKey(q.fact) === factKey(x.fact))) previous.push({ fact: x.fact, label: factText(x.fact), part: g.part });
      }
      planGoals.push({ ...g, proved: verification.ok, proof, verification });
    });
  }
  const provedAll = planGoals.every((g) => g.proved);
  const provedAny = planGoals.some((g) => g.proved);
  // VERIFIED: every requested claim proved. VERIFIED_WITH_CAVEAT: every claim proved; computation parts remain for the
  // solver. NEEDS_REVIEW: some claims proved, others not proved or not understood.
  const status: PlanStatus =
    provedAll && unparsed.length === 0 ? (computeParts.length ? "VERIFIED_WITH_CAVEAT" : "VERIFIED") : provedAny ? "NEEDS_REVIEW" : "UNSOLVED_WITHIN_BOUNDARY";
  const nProved = planGoals.filter((g) => g.proved).length;
  const reason =
    `${nProved}/${goals.length} goal(s) proved` +
    (unparsed.length ? `; not understood: ${unparsed.join(" | ")}` : "") +
    (computeParts.length ? `; computation parts left to the solver: ${computeParts.map((c) => c.split(":")[0]).join(", ")}` : "");
  return {
    status,
    reason,
    figure,
    goals: planGoals,
    unparsed,
    auxiliary,
    computeParts,
    stats: { givens: totalGivens, facts: totalFacts, rounds, elapsedMs: elapsed },
    log,
  };
}

export type { Seg, Tri };
