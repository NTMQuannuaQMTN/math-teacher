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
  // A one-line consequence of givens only ("AE ⊥ IE" from E on AC and IE ⊥ AC; "IE = IF" from two radii).
  if ((d.method === "ANGLE_CHASE" || d.method === "SAME_LINE" || d.method === "LENGTH_ALGEBRA") && d.premises.length <= 2)
    return d.premises.every((p) => byId.get(p)!.premises.length === 0);
  return false;
}

/** Why a given holds, in words. */
function givenReason(d: Derivation): string {
  if (d.method === "PREVIOUS_PART") return d.note ?? "đã chứng minh ở trên";
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

/** The method's sentence for a derivation, given the words for its premises. */
function sentence(d: Derivation, premises: string[], byId: Map<number, Derivation>): string {
  const f = d.fact;
  const because = premises.length ? premises.join(", ") : "";
  const P = d.premises.map((p) => byId.get(p)!.fact);
  switch (d.method) {
    case "ISOSCELES": {
      const c = P[0] as Fact & { t: "cong" };
      const v = c.a.find((x) => c.b.includes(x))!;
      const [x, y] = [c.a.find((p) => p !== v)!, c.b.find((p) => p !== v)!];
      return `Tam giác ${v}${x}${y} có ${because} nên cân tại ${v}, suy ra ${factText(f)}.`;
    }
    case "ISOSCELES_CONVERSE":
      return `Tam giác có hai góc ở đáy bằng nhau (${because}) là tam giác cân, nên ${factText(f)}.`;
    case "PERPENDICULAR_BISECTOR":
      return `Vì ${because}, hai điểm này cùng cách đều hai đầu đoạn thẳng nên cùng nằm trên đường trung trực của nó; vậy ${factText(f)}.`;
    case "CONGRUENT_RIGHT":
      return `Hai tam giác vuông có chung cạnh huyền và ${because.split(", ").pop()} nên bằng nhau (cạnh huyền – cạnh góc vuông); vì vậy ${factText(f)}.`;
    case "CYCLIC_QUADRILATERAL": {
      const r = P[0]!;
      const q = f.t === "cyclic" ? quad([...f.p]) : "";
      return r.t === "eqangle"
        ? `Tứ giác ${q} có hai đỉnh cùng nhìn một cạnh dưới hai góc bằng nhau (${because}) nên là tứ giác nội tiếp: ${factText(f)}.`
        : `Tứ giác ${q} có tổng hai góc đối bằng 180° (${because}) nên là tứ giác nội tiếp: ${factText(f)}.`;
    }
    case "SIMILAR_AA": {
      const s = f as Fact & { t: "simtri" };
      return `Xét △${s.a.join("")} và △${s.b.join("")} có: ${premises.join("; ")}. Do đó ${factText(f)} (g.g).`;
    }
    case "SIMILAR_SAS": {
      const s = f as Fact & { t: "simtri" };
      return `Xét △${s.a.join("")} và △${s.b.join("")} có: ${premises.join("; ")}. Do đó ${factText(f)} (c.g.c).`;
    }
    case "POWER_OF_POINT":
      return `Từ ${because}, theo hệ thức giữa các cát tuyến của một đường tròn (hai tam giác đồng dạng tạo bởi hai cát tuyến), ta có ${factText(f)}.`;
    case "POWER_OF_POINT_CONVERSE":
      return `Ta có ${because}; theo định lí đảo (từ hai tam giác đồng dạng suy ra góc bằng nhau), ${factText(f)}.`;
    case "SAME_LINE":
      return `Vì ${because}, các đường thẳng này trùng nhau, nên ${factText(f)}.`;
    case "LENGTH_ALGEBRA":
      return `Từ ${because}, biến đổi các đẳng thức về độ dài ta được ${factText(f)}.`;
    case "ANGLE_CHASE": {
      if (!because) return `${factText(f)}.`;
      // Group the premises by the angle property each one contributes.
      const groups: [string, string[]][] = [
        ["góc nội tiếp cùng chắn một cung (hoặc bù nhau)", []],
        ["hai góc kề bù / đối đỉnh", []],
        ["góc so le trong, đồng vị", []],
        ["góc vuông", []],
        ["các góc bằng nhau đã có", []],
      ];
      P.forEach((p, i) => {
        const k = p.t === "cyclic" ? 0 : p.t === "col" || p.t === "midp" ? 1 : p.t === "para" ? 2 : p.t === "perp" ? 3 : 4;
        groups[k]![1].push(premises[i]!);
      });
      const parts = groups.filter(([, xs]) => xs.length).map(([name, xs]) => `${name}: ${xs.join("; ")}`);
      return `Ta dùng ${parts.join(" — ")}. Cộng, trừ các góc đó ta được ${factText(f)}.`;
    }
    default:
      return `${because ? `Từ ${because}, ` : ""}${factText(f)}.`;
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

  // Per goal, its proof's derivations in order; shared derivations (same fact) are stated once.
  const stated = new Set<string>();
  for (const g of plan.goals) {
    if (!g.proved) continue;
    const byId = new Map(g.proof.map((d) => [d.id, d]));
    for (const d of g.proof) {
      const key = factText(d.fact);
      const isGoal = factKey(d.fact) === factKey(g.fact);
      if (stated.has(key) || (inline(d, byId) && !isGoal)) continue;
      stated.add(key);
      items.push({ part: g.part, d, goal: factKey(g.fact) === factKey(d.fact) ? g : null });
    }
  }

  // Words for a premise: a fact proved in an earlier step is cited by its text; an inline one with its reason.
  const words = (p: Derivation, byId: Map<number, Derivation>): string => {
    const text = factText(p.fact);
    if (p.premises.length === 0) return `${text} (${givenReason(p)})`;
    if (stepOf.has(text)) return text;
    if (inline(p, byId)) {
      const why = p.premises.map((q) => byId.get(q)!).map((q) => (q.premises.length === 0 ? `${factText(q.fact)} (${givenReason(q)})` : factText(q.fact)));
      return `${text} (vì ${why.join(", ")})`;
    }
    return text;
  };

  // Steps (merged when too many).
  type Draft = { part: string; facts: Fact[]; texts: string[]; reasons: string[]; uses: Set<string>; goal: PlanGoal | null };
  const drafts: Draft[] = [];
  for (const it of items) {
    const g = plan.goals.find((x) => x.proof.some((d) => d.id === it.d.id) && x.part === it.part)!;
    const byId = new Map(g.proof.map((d) => [d.id, d]));
    const premises = it.d.premises.map((p) => byId.get(p)!);
    let text = sentence(it.d, premises.map((p) => words(p, byId)), byId);
    // "đường tròn này đi qua O": the circle through three of the points is unique, so it is the same circle.
    if (it.goal?.label.startsWith("đường tròn qua") && it.d.fact.t === "cyclic") {
      const three = it.d.fact.p.filter((x) => it.goal!.label.includes(x) && !it.goal!.label.endsWith(`đi qua ${x}`));
      text += ` Qua ba điểm ${three.join(", ")} chỉ có một đường tròn, nên ${it.goal.label.replace(/^đường tròn qua/, "đường tròn đi qua")}.`;
    }
    const m = method(it.d.method);
    if (m && m.category !== "given") concepts.add(m.vi.split(" (")[0]!);
    const uses = new Set(premises.map((p) => stepOf.get(factText(p.fact))).filter((x): x is string => !!x));
    drafts.push({ part: it.part, facts: [it.d.fact], texts: [text], reasons: m ? [m.vi.split(" (")[0]!] : [], uses, goal: it.goal });
    stepOf.set(factText(it.d.fact), `s${drafts.length}`);
  }
  // Merge while too long: the first pair of adjacent non-goal steps in the same part.
  while (drafts.length > MAX_STEPS) {
    let i = drafts.findIndex((x, k) => k + 1 < drafts.length && !x.goal && drafts[k + 1]!.part === x.part);
    if (i < 0) i = drafts.findIndex((x, k) => k + 1 < drafts.length && drafts[k + 1]!.part === x.part);
    if (i < 0) break;
    const [a, b] = [drafts[i]!, drafts[i + 1]!];
    drafts.splice(i, 2, { part: a.part, facts: [...a.facts, ...b.facts], texts: [...a.texts, ...b.texts], reasons: [...new Set([...a.reasons, ...b.reasons])], uses: new Set([...a.uses, ...b.uses]), goal: b.goal ?? a.goal });
  }
  // Ids after merging: map each fact to its final step.
  const finalId = new Map<string, string>();
  drafts.forEach((dr, i) => dr.facts.forEach((f) => finalId.set(factText(f), `s${i + 1}`)));
  const oldToFact = new Map([...stepOf].map(([fact, id]) => [id, fact]));
  drafts.forEach((dr, i) => {
    const id = `s${i + 1}`;
    const uses = [...new Set([...dr.uses].map((u) => finalId.get(oldToFact.get(u)!)!).filter((u) => u && u !== id))].slice(0, 4);
    const pts = [...new Set(dr.facts.flatMap(factPoints))].slice(0, 10);
    const label = dr.part ? `Câu ${dr.part}: ` : "";
    const head = dr.goal ? `${label}${dr.goal.label}` : `${label}${factText(dr.facts[dr.facts.length - 1]!)}`;
    steps.push({
      id,
      title: head.slice(0, 300),
      explanation: dr.texts.join(" ").slice(0, 1500),
      math: dr.facts.map(factLatex).join(" \\\\ ").slice(0, 800),
      reason: dr.reasons.join("; ").slice(0, 300) || null,
      uses,
      geometryActions: pts.length ? [{ action: "highlight", targets: pts }] : [],
    });
  });

  // One hint per goal: the idea of its last step, as a question.
  for (const g of plan.goals.filter((x) => x.proved)) {
    if (hints.length >= 8) break;
    const sid = finalId.get(factText(g.proof.find((d) => factKey(d.fact) === factKey(g.fact))?.fact ?? g.fact));
    if (!sid) continue;
    const last = g.proof[g.proof.length - 1]!;
    const q = hintQuestion(g.fact, last.method);
    hints.push({
      id: `h${hints.length + 1}`,
      level: 2,
      question: q.question,
      cue: q.cue,
      explanation: `Ý chính: ${method(last.method)?.vi ?? last.method}. Xem bước ${sid.slice(1)}.`,
      math: factLatex(g.fact),
      stepId: sid,
      focus: factPoints(g.fact).slice(0, 10),
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

function hintQuestion(goal: Fact, lastMethod: string): { question: string; cue: string | null } {
  switch (lastMethod) {
    case "CYCLIC_QUADRILATERAL":
      return { question: "Tứ giác này có hai đỉnh nào cùng nhìn một cạnh dưới các góc bằng nhau, hoặc có hai góc đối bù nhau không?", cue: "Dấu hiệu nhận biết tứ giác nội tiếp" };
    case "POWER_OF_POINT_CONVERSE":
      return { question: "Có đẳng thức tích các đoạn thẳng nào cho ta hai tam giác đồng dạng không?", cue: "MA·MB = MC·MD" };
    case "SIMILAR_AA":
    case "SIMILAR_SAS":
      return { question: "Hai tam giác này có những cặp góc (hoặc cặp cạnh tỉ lệ) nào bằng nhau?", cue: "Các trường hợp đồng dạng của tam giác" };
    case "LENGTH_ALGEBRA":
      return goal.t === "prod"
        ? { question: "Các đoạn thẳng trong đẳng thức là cạnh của hai tam giác đồng dạng nào?", cue: "Tỉ số cạnh tương ứng" }
        : { question: "Những đoạn thẳng nào đã biết là bằng nhau hoặc tỉ lệ?", cue: null };
    case "SAME_LINE":
      return { question: "Hai đường thẳng qua cùng một điểm này có cùng vuông góc (hoặc cùng song song) với một đường thẳng nào không?", cue: "Tiên đề Ơ-clit / tính duy nhất của đường vuông góc" };
    case "ANGLE_CHASE":
      return { question: "Những góc nào bằng nhau đã biết, và có thể cộng hoặc trừ chúng để được góc cần tìm không?", cue: "Góc nội tiếp, góc tạo bởi tiếp tuyến và dây, góc trong tam giác" };
    default:
      return { question: `Dùng tính chất nào để chứng minh ${factText(goal)}?`, cue: method(lastMethod)?.vi ?? null };
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
