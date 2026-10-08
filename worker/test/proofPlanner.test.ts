import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ModelLessonSchema } from "../../shared/src/solution";
import { figureFromStatement } from "../../shared/src/figureFromText";
import { resolveFigure } from "../../shared/src/geometry";
import { normalizeProblemText } from "../../shared/src/mathText";
import { constructionFacts, Oracle, type Derivation } from "../../shared/src/proof/engine";
import { explainPlan, planReadability } from "../../shared/src/proof/explain";
import { factKey, type Fact } from "../../shared/src/proof/facts";
import { equation, LinearSystem } from "../../shared/src/proof/linear";
import { METHODS, method } from "../../shared/src/proof/methods";
import { planProof, splitChains } from "../../shared/src/proof/planner";
import { verifyProof } from "../../shared/src/proof/verify";
import type { ChatMessage, JsonModel } from "../src/solver/llm";
import { VN_GRADE_9 } from "../src/solver/curriculum";
import { solveProblem } from "../src/solver/pipeline";

/** Problems of the repository's benchmark dataset (the problem texts are not repeated here). */
function datasetProblem(id: string): string {
  for (const f of ["chuyen.jsonl", "problems.jsonl"])
    for (const line of readFileSync(new URL(`../../tools/benchmark/dataset/${f}`, import.meta.url), "utf8").trim().split("\n")) {
      const d = JSON.parse(line) as { id: string; problem_text: string };
      if (d.id === id) return normalizeProblemText(d.problem_text);
    }
  throw new Error(`no dataset problem ${id}`);
}

const ISOSCELES = "Cho tam giác $ABC$ cân tại $A$, $M$ là trung điểm của $BC$. Chứng minh $AM \\perp BC$.";
const TANGENTS = "Từ điểm $A$ nằm ngoài đường tròn $(O; R)$ kẻ hai tiếp tuyến $AB$, $AC$ với đường tròn ($B$, $C$ là các tiếp điểm). Chứng minh bốn điểm $A, B, O, C$ cùng thuộc một đường tròn và $OA \\perp BC$.";

describe("linear system (angle and length algebra)", () => {
  it("derives a consequence and cites exactly the facts it used", () => {
    const s = new LinearSystem(180);
    s.add(equation([["a", 1], ["b", -1]], 30), 1); // a − b = 30
    s.add(equation([["b", 1], ["c", -1]], 50), 2); // b − c = 50
    s.add(equation([["x", 1], ["y", -1]], 10), 3); // unrelated
    expect([...s.implies(equation([["a", 1], ["c", -1]], 80))!].sort()).toEqual([1, 2]);
    expect(s.implies(equation([["a", 1], ["c", -1]], 70))).toBeNull();
  });

  it("works modulo 180° for directions of lines", () => {
    const s = new LinearSystem(180);
    s.add(equation([["a", 1], ["b", -1]], 90), 1);
    s.add(equation([["b", 1], ["c", -1]], 90), 2);
    // a − c = 180 ≡ 0: two perpendiculars to one line are parallel.
    expect(s.implies(equation([["a", 1], ["c", -1]], 0))).not.toBeNull();
  });
});

describe("method library", () => {
  it("has unique ids and marks outside-curriculum methods as not allowed", () => {
    const ids = METHODS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(method("INVERSION")?.allowed).toBe(false);
    expect(method("ANGLE_CHASE")?.allowed).toBe(true);
  });

  it("registers every method the search uses (and marks it as used by the search)", () => {
    const engine = readFileSync(new URL("../../shared/src/proof/engine.ts", import.meta.url), "utf8");
    const used = new Set([...engine.matchAll(/"([A-Z][A-Z_]+)"/g)].map((m) => m[1]!).filter((id) => id.length > 3));
    for (const id of used) {
      expect(method(id), id).toBeDefined();
      expect(method(id)!.search, id).toBe(true);
    }
  });
});

describe("proof planner", () => {
  it("proves an isosceles median is perpendicular to the base, citing only givens and registered methods", () => {
    const plan = planProof(ISOSCELES);
    expect(plan.status).toBe("VERIFIED");
    const g = plan.goals[0]!;
    expect(g.proved).toBe(true);
    expect(g.verification?.ok).toBe(true);
    for (const d of g.proof) expect(method(d.method)?.allowed).toBe(true);
  });

  it("proves both claims of the two-tangents problem", () => {
    const plan = planProof(TANGENTS);
    expect(plan.status).toBe("VERIFIED");
    expect(plan.goals.map((g) => g.proved)).toEqual([true, true]);
  });

  it("proves PTNK 2025 Bài 4a (concyclic, and the circle passes through O) with no model", () => {
    const plan = planProof(datasetProblem("ptnk-2025-chuyen_4a"));
    expect(plan.status).toBe("VERIFIED");
    expect(plan.goals).toHaveLength(2);
    expect(plan.goals.every((g) => g.proved && g.verification?.ok)).toBe(true);
  });

  it("proves every claim of Câu 4 (incircle), each part using only the points defined so far", () => {
    const plan = planProof(datasetProblem("ch-4"));
    expect(plan.goals.length).toBe(6);
    expect(plan.goals.every((g) => g.proved)).toBe(true);
    // Part a never cites the points introduced in parts b and c.
    for (const g of plan.goals.filter((x) => x.part === "a")) for (const d of g.proof) expect(JSON.stringify(d.fact)).not.toMatch(/"[HLGP]"/);
    // "AL, GJ cắt nhau trên (I)" needs an auxiliary point, and it is declared.
    expect(plan.auxiliary.length).toBe(1);
  });

  it("never calls a problem verified when one of its claims was not understood", () => {
    // "IB² = ID² = IA·IK" is a chain and "CEHK là hình bình hành" a shape claim: both are goals, not silently dropped.
    const plan = planProof(datasetProblem("ptnk-2024-chuyen_4a"));
    expect(plan.goals.length).toBe(4);
    expect(plan.status).not.toBe("VERIFIED");
    const b = planProof(datasetProblem("ptnk-2025-chuyen_4b"));
    expect(b.unparsed.length).toBeGreaterThan(0);
    expect(b.status).toBe("NEEDS_REVIEW");
  });

  it("splits a chain of equalities into its links", () => {
    expect(splitChains("$IB^2=ID^2=IA\\cdot IK$")).toBe("$IB^2 = ID^2$ và $ID^2 = IA\\cdot IK$");
  });

  it("leaves computation problems to the solver", () => {
    const plan = planProof("Cho tam giác $ABC$ có $\\widehat{A} = 65^{\\circ}$, $\\widehat{B} = 45^{\\circ}$. Tính $\\widehat{C}$.");
    expect(plan.goals).toHaveLength(0);
    expect(plan.status).not.toBe("VERIFIED");
  });
});

describe("independent verifier rejects invalid proofs", () => {
  const statement = ISOSCELES;
  const built = figureFromStatement(statement)!;
  const figure = built.figure;
  const oracle = new Oracle(resolveFigure(figure).points);
  const givens = constructionFacts(figure, oracle);
  const given = (t: Fact["t"]) => givens.find((g) => g.fact.t === t)!;
  const shape: Fact[] = [{ t: "cong", a: ["A", "B"], b: ["A", "C"] }];
  const goal: Fact = { t: "perp", a: ["A", "M"], b: ["B", "C"] };
  const step = (id: number, fact: Fact, m: string, premises: number[] = []): Derivation => ({ id, fact, method: m, premises });

  /** A valid proof, to make sure the rejections below are about the defect each one introduces. */
  const valid = () => {
    const mid = given("midp");
    return [
      step(0, shape[0]!, "GIVEN"),
      step(1, mid.fact, "CONSTRUCTION"),
      step(2, { t: "cong", a: ["M", "B"], b: ["M", "C"] }, "MIDPOINT", [1]),
      step(3, goal, "PERPENDICULAR_BISECTOR", [0, 2]),
    ];
  };

  it("accepts the valid proof", () => {
    const r = verifyProof(figure, valid(), [goal], { statementGivens: shape });
    expect(r.steps.filter((s) => !s.ok)).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it("rejects an unknown method", () => {
    const p = valid();
    p[3] = { ...p[3]!, method: "BECAUSE_IT_LOOKS_SO" };
    expect(verifyProof(figure, p, [goal], { statementGivens: shape }).ok).toBe(false);
  });

  it("rejects a method outside the curriculum", () => {
    const p = valid();
    p[3] = { ...p[3]!, method: "INVERSION" };
    const r = verifyProof(figure, p, [goal], { statementGivens: shape });
    expect(r.ok).toBe(false);
    expect(r.steps[3]!.problems.join()).toMatch(/outside the curriculum|does not produce/);
  });

  it("rejects a claimed given that the statement doesn't give (reading the diagram)", () => {
    const p = [step(0, goal, "GIVEN")];
    const r = verifyProof(figure, p, [goal], { statementGivens: shape });
    expect(r.ok).toBe(false);
    expect(r.steps[0]!.problems.join()).toMatch(/not a given/);
  });

  it("rejects a step citing a later step (circular)", () => {
    const p = valid();
    p[2] = { ...p[2]!, premises: [3] };
    expect(verifyProof(figure, p, [goal], { statementGivens: shape }).ok).toBe(false);
  });

  it("rejects an angle chase whose cited facts don't imply the conclusion", () => {
    const p = [step(0, shape[0]!, "GIVEN"), step(1, goal, "ANGLE_CHASE", [0])];
    const r = verifyProof(figure, p, [goal], { statementGivens: shape });
    expect(r.ok).toBe(false);
    expect(r.steps[1]!.problems.join()).toMatch(/does not follow/);
  });

  it("rejects the isosceles property applied to the wrong angles", () => {
    const wrongAngles: Fact = { t: "eqangle", a: ["A", "B", "C"], b: ["B", "A", "C"] };
    const p = [step(0, shape[0]!, "GIVEN"), step(1, wrongAngles, "ISOSCELES", [0])];
    expect(verifyProof(figure, p, [], { statementGivens: shape }).ok).toBe(false);
  });

  it("rejects a false conclusion even when the method's shape fits", () => {
    // B, M, A are not collinear: a 'same line' step citing unrelated facts.
    const falseFact: Fact = { t: "col", p: ["A", "B", "M"] };
    const p = [step(0, shape[0]!, "GIVEN"), step(1, falseFact, "SAME_LINE", [0])];
    const r = verifyProof(figure, p, [], { statementGivens: shape });
    expect(r.ok).toBe(false);
    expect(r.steps[1]!.problems.join()).toMatch(/false on the figure|same direction/);
  });

  it("rejects similar triangles with a wrong vertex correspondence", () => {
    const plan = planProof(TANGENTS);
    expect(plan.goals[0]!.proved).toBe(true);
    // △ABO ∽ △ACO holds; △ABO ∽ △AOC (B ↔ O) does not.
    // Two true angle equalities (cited as facts of an earlier part, so only the similarity step is in question).
    const eq1: Fact = { t: "eqangle", a: ["B", "A", "O"], b: ["C", "A", "O"] };
    const eq2: Fact = { t: "eqangle", a: ["A", "B", "O"], b: ["A", "C", "O"] };
    const good = step(2, { t: "simtri", a: ["A", "B", "O"], b: ["A", "C", "O"] }, "SIMILAR_AA", [0, 1]);
    const bad = step(2, { t: "simtri", a: ["A", "B", "O"], b: ["A", "O", "C"] }, "SIMILAR_AA", [0, 1]);
    const premises = [step(0, eq1, "PREVIOUS_PART"), step(1, eq2, "PREVIOUS_PART")];
    expect(verifyProof(plan.figure!, [...premises, good], [], { previous: [eq1, eq2] }).ok).toBe(true);
    const r = verifyProof(plan.figure!, [...premises, bad], [], { previous: [eq1, eq2] });
    expect(r.steps[0]!.ok && r.steps[1]!.ok).toBe(true);
    expect(r.steps[2]!.ok).toBe(false);
    expect(r.steps[2]!.problems.join()).toMatch(/corresponding/);
  });

  it("requires every goal to be established by the proof", () => {
    const p = valid().slice(0, 3);
    const r = verifyProof(figure, p, [goal], { statementGivens: shape });
    expect(r.ok).toBe(false);
    expect(r.issues.join()).toMatch(/goal not established/);
  });

  it("keys facts canonically (the same fact written two ways)", () => {
    expect(factKey({ t: "perp", a: ["A", "M"], b: ["B", "C"] })).toBe(factKey({ t: "perp", a: ["C", "B"], b: ["M", "A"] }));
    expect(factKey({ t: "simtri", a: ["A", "B", "C"], b: ["D", "E", "F"] })).toBe(factKey({ t: "simtri", a: ["E", "F", "D"], b: ["B", "C", "A"] }));
  });
});

describe("explanation", () => {
  it("turns a verified plan into a valid lesson whose steps highlight figure points", () => {
    const plan = planProof(datasetProblem("ptnk-2025-chuyen_4a"));
    const lesson = explainPlan(plan, { statement: datasetProblem("ptnk-2025-chuyen_4a") });
    expect(ModelLessonSchema.safeParse(lesson).success).toBe(true);
    const ids = new Set(lesson.figure!.points.map((p) => p.id));
    for (const s of lesson.steps) for (const a of s.geometryActions) for (const t of a.targets) expect(ids.has(t)).toBe(true);
    // Each goal is a step, and every hint points at a step.
    expect(lesson.steps.filter((s) => s.title.includes("cùng thuộc một đường tròn") || s.title.includes("đi qua O")).length).toBeGreaterThanOrEqual(2);
    for (const h of lesson.hints) expect(lesson.steps.some((s) => s.id === h.stepId)).toBe(true);
    // Uses only cite earlier steps.
    lesson.steps.forEach((s, i) => s.uses.forEach((u) => expect(lesson.steps.findIndex((x) => x.id === u)).toBeLessThan(i)));
  });

  it("reports a long proof as not readable rather than showing it", () => {
    const r = planReadability(planProof(datasetProblem("ch-4")));
    expect(r.readable).toBe(false);
  });
});

/** A model that must not be called. */
class NoModel implements JsonModel {
  readonly name = "none";
  readonly model = "none";
  calls = 0;
  async complete(_: { messages: ChatMessage[] }): Promise<string> {
    this.calls++;
    throw new Error("the model should not be called");
  }
}

describe("pipeline: planner first", () => {
  it("answers a fully proved geometry problem with no model call and no cost", async () => {
    const model = new NoModel();
    const result = await solveProblem(model, VN_GRADE_9, TANGENTS, { signal: new AbortController().signal });
    expect(model.calls).toBe(0);
    expect(result.model).toBe("proof-planner");
    expect(result.costUsd).toBe(0);
    expect(result.verification.status).not.toBe("unverified");
    expect(result.verification.checks.some((c) => c.label.startsWith("Chứng minh được kiểm tra từng bước"))).toBe(true);
  });

  it("serves a long verified proof (Câu 4) instead of calling the model", async () => {
    const model = new NoModel();
    const result = await solveProblem(model, VN_GRADE_9, datasetProblem("ch-4"), { signal: new AbortController().signal });
    expect(model.calls).toBe(0);
    expect(result.model).toBe("proof-planner");
    expect(result.lesson.steps.length).toBeLessThanOrEqual(14);
  });

  it("falls back to the proved claims when the model fails, and says what is missing", async () => {
    const model = new NoModel();
    const result = await solveProblem(model, VN_GRADE_9, datasetProblem("ptnk-2025-chuyen_4b"), { signal: new AbortController().signal, maxAttempts: 1 });
    expect(model.calls).toBe(1);
    expect(result.model).toBe("proof-planner");
    expect(result.verification.status).toBe("partial");
    expect(result.lesson.finalAnswer.text).toMatch(/chưa được giải/);
  });

  it("calls the model when the planner is turned off", async () => {
    const model = new NoModel();
    await expect(solveProblem(model, VN_GRADE_9, TANGENTS, { signal: new AbortController().signal, proofPlanner: false, maxAttempts: 1 })).rejects.toThrow();
    expect(model.calls).toBe(1);
  });
});
