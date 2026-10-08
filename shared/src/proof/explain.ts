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
import type { PlanGoal, ProofPlan } from "./planner";

const MAX_STEPS = 14;

/** Derivations stated inline as a reason rather than as their own step. */
function inline(d: Derivation, byId: Map<number, Derivation>): boolean {
  if (d.premises.length === 0) return true; // givens, constructions, previous parts
  if (d.method === "MIDPOINT") return true;
  // Base angles of an isosceles triangle: "∠EDB = ∠EBD (△EDB cân tại E)".
  if (d.method === "ISOSCELES") return true;
  // A one-line consequence of givens only ("AE ⊥ IE" from E on AC and IE ⊥ AC; "IE = IF" from two radii).
  if ((d.method === "ANGLE_CHASE" || d.method === "SAME_LINE" || d.method === "LENGTH_ALGEBRA") && d.premises.length <= 2)
    return d.premises.every((p) => byId.get(p)!.premises.length === 0);
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
      return [cyc ? bullet(words(premises[P.indexOf(cyc)]!)) : "", `⇒ ${show(f)} (hệ thức giữa hai cát tuyến cắt nhau của một đường tròn).`].filter(Boolean);
    }
    case "POWER_OF_POINT_CONVERSE":
      return [...shown.map(bullet), `⇒ ${show(f)} (đảo của hệ thức hai cát tuyến).`];
    case "SAME_LINE":
      return [...shown.map(bullet), `⇒ ${show(f)} (qua một điểm chỉ có một đường thẳng như vậy).`];
    case "LENGTH_ALGEBRA":
      return shown.length ? [...shown.map(bullet), `⇒ ${show(f)}.`] : [`${show(f)}.`];
    case "ANGLE_CHASE":
      return shown.length ? ["Ta có:", ...shown.map(bullet), `⇒ ${show(f)} (cộng, trừ các góc).`] : [`${show(f)}.`];
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
  type Item = { part: string; d: Derivation; goal: PlanGoal | null };
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
      items.push({ part: g.part, d, goal: plan.goals.find((x) => x.proved && factKey(x.fact) === factKey(d.fact)) ?? null });
    }
  }

  // Words for a premise: a fact proved in an earlier step is cited as such; a given or a one-line consequence with its
  // reason in brackets.
  const words = (p: Derivation, byId: Map<number, Derivation>): string => {
    const text = show(p.fact);
    if (p.premises.length === 0) {
      if (p.method === "CONCYCLIC_GIVEN") {
        const circle = givenReason(p).replace(/^cùng thuộc /, "");
        return /^\(.*\)$/.test(circle) ? `${text} ${circle}` : `${text} (${circle})`;
      }
      return `${text} (${givenReason(p)})`;
    }
    if (stepOf.has(sameKey(p.fact))) return `${text} (chứng minh trên)`;
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
      const why = qs.map((q) => (q.premises.length === 0 ? `${show(q.fact)} (${givenReason(q)})` : show(q.fact)));
      return why.length ? `${text} (vì ${why.join("; ")})` : text;
    }
    return text;
  };

  // Steps (merged when too many).
  type Draft = { part: string; facts: Fact[]; texts: string[]; reasons: string[]; uses: Set<string>; goal: PlanGoal | null; goals: PlanGoal[] };
  const drafts: Draft[] = [];
  for (const it of items) {
    const g = plan.goals.find((x) => x.proof.some((d) => d.id === it.d.id) && x.part === it.part)!;
    const byId = new Map(g.proof.map((d) => [d.id, d]));
    const premises = it.d.premises.map((p) => byId.get(p)!);
    const ls = lines(it.d, premises, (p) => words(p, byId));
    // "đường tròn này đi qua O": the circle through three of the points is unique, so it is the same circle.
    if (it.goal?.label.startsWith("đường tròn qua") && it.d.fact.t === "cyclic") {
      const three = it.d.fact.p.filter((x) => it.goal!.label.includes(x) && !it.goal!.label.endsWith(`đi qua ${x}`));
      ls.push(`Qua ba điểm ${three.join(", ")} chỉ có một đường tròn ⇒ ${it.goal.label.replace(/^đường tròn qua/, "đường tròn đi qua")}.`);
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
    if (prev && !prev.goal && prev.part === it.part && shownPremises.length === 1 && prevFact && factKey(shownPremises[0]!.fact) === factKey(prevFact)) {
      prev.facts.push(it.d.fact);
      prev.texts[prev.texts.length - 1] = prev.texts[prev.texts.length - 1]!.replace(/\.$/, "") + "\n" + ls.filter((l) => !l.startsWith("• ")).join("\n");
      if (m) prev.reasons = [...new Set([...prev.reasons, m.vi.split(" (")[0]!])];
      prev.goal = it.goal;
      if (it.goal) prev.goals.push(it.goal);
      stepOf.set(sameKey(it.d.fact), `s${drafts.length}`);
      continue;
    }
    drafts.push({ part: it.part, facts: [it.d.fact], texts: [text], reasons: m ? [m.vi.split(" (")[0]!] : [], uses, goal: it.goal, goals: it.goal ? [it.goal] : [] });
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

  const goalsText = plan.goals.filter((g) => g.proved).map((g) => `${g.part ? `(${g.part}) ` : ""}${g.label}`);
  const givens = plan.goals
    .flatMap((g) => g.proof.filter((d) => d.premises.length === 0 && d.method !== "PREVIOUS_PART"))
    .map((d) => factText(d.fact))
    .filter((x, i, a) => a.indexOf(x) === i)
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
