import { describe, expect, it } from "vitest";
import { evalCondition, evalExpression, evalRelation, variablesOf } from "../../shared/src/expr";
import { angleDeg, dist, evaluateFigureCheck, resolveFigure } from "../../shared/src/geometry";
import type { Figure, ModelLesson, PointDef } from "../../shared/src/solution";
import { ModelLessonSchema } from "../../shared/src/solution";
import { cleanLanguage, isStrippedVietnamese, patchVietnamese } from "../../shared/src/language";
import { buildTargetIndex, deniesAnswer, presupposesAnswer, verifyLesson } from "../../shared/src/verify";
import { problemDomains } from "../../shared/src/knowledgeBase";
import { describeStatementFigure } from "../../shared/src/figureFromText";
import { constructNamedPoints } from "../../shared/src/pointDefinitions";
import { figureCoverage, mentionedTargets, polygonId } from "../../shared/src/figureComplete";
import { buildScene } from "../../shared/src/figureScene";
import { VN_GRADE_9 } from "../src/solver/curriculum";
import { buildSystemPrompt } from "../src/solver/prompts";

// --- expression evaluator ---------------------------------------------------

describe("evalExpression", () => {
  it.each([
    ["2+3*4", {}, 14],
    ["2x^2", { x: 3 }, 18],
    ["-x^2", { x: 3 }, -9],
    ["3(x-1)", { x: 5 }, 12],
    ["(x+1)(x-1)", { x: 4 }, 15],
    ["xy", { x: 2, y: 5 }, 10],
    ["sqrt(49) + cbrt(27)", {}, 10],
    ["√16 + 2²", {}, 8],
    ["x_1 + x2", { x1: 1, x2: 2 }, 3],
    ["sin(30)", {}, 0.5],
    ["2^-1", {}, 0.5],
    ["36 : 4", {}, 9],
    ["(1+sqrt(5))/2", {}, (1 + Math.sqrt(5)) / 2],
  ])("%s", (src, env, expected) => {
    expect(evalExpression(src, env as Record<string, number>)).toBeCloseTo(expected, 9);
  });

  it("returns NaN for undefined values instead of throwing", () => {
    expect(evalExpression("1/(x-1)", { x: 1 })).toBeNaN();
    expect(evalExpression("sqrt(x)", { x: -4 })).toBeNaN();
  });

  it("rejects anything that isn't arithmetic", () => {
    for (const bad of ["constructor", "process.exit()", "x;y", "a[0]", "`x`", "1 +"]) {
      expect(() => evalExpression(bad, { x: 1, y: 1, a: 1 })).toThrow();
    }
  });

  it("finds variables", () => {
    expect([...variablesOf("x^2 + 5x + 6 = 0")]).toEqual(["x"]);
    expect([...variablesOf("2x + y = 5")].sort()).toEqual(["x", "y"]);
  });
});

describe("relations and conditions", () => {
  it("evaluates equations with tolerance", () => {
    expect(evalRelation("x^2 + 5x + 6 = 0", { x: -2 })).toBe(true);
    expect(evalRelation("x^2 + 5x + 6 = 0", { x: 2 })).toBe(false);
    expect(evalRelation("0.1 + 0.2 = 0.3")).toBe(true);
  });
  it("evaluates inequalities, boundary included", () => {
    expect(evalRelation("3(x-2) <= 5x + 4", { x: -5 })).toBe(true);
    expect(evalRelation("3(x-2) <= 5x + 4", { x: -6 })).toBe(false);
    expect(evalRelation("x ≥ 1", { x: 1 })).toBe(true);
  });
  it("returns null when undefined", () => {
    expect(evalRelation("1/x = 2", { x: 0 })).toBeNull();
  });
  it("combines conditions", () => {
    expect(evalCondition("x < 1 or x > 3", { x: 0 })).toBe(true);
    expect(evalCondition("x < 1 or x > 3", { x: 2 })).toBe(false);
    expect(evalCondition("x >= 0 and x != 1", { x: 1 })).toBe(false);
    expect(evalCondition("x >= 0, x != 1", { x: 4 })).toBe(true);
  });
});

// --- geometry engine ----------------------------------------------------------

const P = (id: string, kind: PointDef["kind"], extra: Partial<PointDef> = {}): PointDef => ({
  id,
  label: id,
  kind,
  refs: [],
  x: null,
  y: null,
  value: null,
  value2: null,
  draggable: false,
  hidden: false,
  ...extra,
});

function figure(points: PointDef[], extra: Partial<Figure> = {}): Figure {
  return { scale: "exact", points, lines: [], circles: [], angles: [], marks: [], checks: [], ...extra };
}

describe("resolveFigure", () => {
  it("builds an isosceles triangle with apex 40° from polar constructions", () => {
    const f = figure([
      P("A", "free", { x: 0, y: 4 }),
      P("B", "polar", { refs: ["A"], value: 250, value2: 5 }),
      P("C", "polar", { refs: ["A"], value: 290, value2: 5 }),
    ]);
    const r = resolveFigure(f);
    expect(r.errors).toEqual([]);
    expect(angleDeg(r.points.B!, r.points.A!, r.points.C!)).toBeCloseTo(40, 6);
    expect(angleDeg(r.points.A!, r.points.B!, r.points.C!)).toBeCloseTo(70, 6);
  });

  it("resolves midpoint, foot, intersection, circumcenter, tangent, reflect, rotate", () => {
    const f = figure(
      [
        P("A", "free", { x: 0, y: 3 }),
        P("B", "free", { x: -2, y: 0 }),
        P("C", "free", { x: 4, y: 0 }),
        P("M", "midpoint", { refs: ["B", "C"] }),
        P("H", "foot", { refs: ["A", "B", "C"] }),
        P("O", "circumcenter", { refs: ["A", "B", "C"] }),
        P("X", "intersection", { refs: ["A", "H", "B", "C"] }),
        P("T", "free", { x: 10, y: 0 }),
        P("K", "tangent", { refs: ["T", "c"], value: 0 }),
        P("A2", "reflect", { refs: ["A", "B", "C"] }),
        P("R", "rotate", { refs: ["C", "B"], value: 90 }),
        P("D", "line_circle", { refs: ["A", "O", "c"], value: 1 }),
      ],
      { circles: [{ id: "c", center: "O", through: "A", radius: null, style: "given", label: null }] },
    );
    const r = resolveFigure(f);
    expect(r.errors).toEqual([]);
    expect(r.points.M).toEqual({ x: 1, y: 0 });
    expect(r.points.H!.x).toBeCloseTo(0);
    expect(r.points.X!.y).toBeCloseTo(0);
    expect(dist(r.points.O!, r.points.B!)).toBeCloseTo(dist(r.points.O!, r.points.A!));
    const c = r.circles.c!;
    // tangent: OK ⊥ KT
    const K = r.points.K!;
    const T = r.points.T!;
    expect((K.x - c.cx) * (T.x - K.x) + (K.y - c.cy) * (T.y - K.y)).toBeCloseTo(0, 6);
    expect(r.points.A2!.y).toBeCloseTo(-3);
    expect(r.points.R!.x).toBeCloseTo(-2);
    expect(r.points.R!.y).toBeCloseTo(6);
    // D is diametrically opposite A
    expect(dist(r.points.A!, r.points.D!)).toBeCloseTo(2 * c.r);
  });

  it("reports impossible constructions instead of producing NaN", () => {
    const f = figure([
      P("A", "free", { x: 0, y: 0 }),
      P("B", "free", { x: 1, y: 0 }),
      P("C", "free", { x: 0, y: 1 }),
      P("D", "free", { x: 1, y: 1 }),
      P("X", "intersection", { refs: ["A", "B", "C", "D"] }), // parallel lines
      P("Y", "midpoint", { refs: ["A", "Z"] }), // unknown ref
    ]);
    const r = resolveFigure(f);
    expect(r.points.X).toBeUndefined();
    expect(r.errors.join(" ")).toMatch(/X/);
    expect(r.errors.join(" ")).toMatch(/Z/);
  });

  it("detects cycles", () => {
    const f = figure([P("A", "midpoint", { refs: ["B", "B"] }), P("B", "midpoint", { refs: ["A", "A"] })]);
    expect(resolveFigure(f).errors.join(" ")).toMatch(/cycle/);
  });

  it("follows dragged free points", () => {
    const f = figure([P("A", "free", { x: 0, y: 0 }), P("B", "free", { x: 2, y: 0 }), P("M", "midpoint", { refs: ["A", "B"] })]);
    expect(resolveFigure(f, { B: { x: 10, y: 0 } }).points.M).toEqual({ x: 5, y: 0 });
  });

  it("evaluates figure checks", () => {
    const f = figure([P("A", "free", { x: 0, y: 0 }), P("B", "free", { x: 3, y: 0 }), P("C", "free", { x: 0, y: 4 })]);
    const r = resolveFigure(f);
    const check = (kind: Figure["checks"][number]["kind"], refs: string[], value: number | null = null) =>
      evaluateFigureCheck({ kind, refs, value, role: "given" }, r).passed;
    expect(check("length_value", ["B", "C"], 5)).toBe(true);
    expect(check("angle_value", ["B", "A", "C"], 90)).toBe(true);
    expect(check("perpendicular", ["A", "B", "A", "C"])).toBe(true);
    expect(check("length_value", ["B", "C"], 6)).toBe(false);
  });
});

// --- lesson verification ---------------------------------------------------

function isoscelesLesson(overrides: Partial<ModelLesson> = {}): ModelLesson {
  return {
    analysis: {
      statement: "Cho tam giác $ABC$ cân tại $A$ có $\\widehat{A} = 40^{\\circ}$. Tính $\\widehat{B}$.",
      language: "vi",
      topic: "geometry",
      subtopic: "isosceles triangle angles",
      gradeLevel: 7,
      withinCurriculum: true,
      concepts: ["isosceles triangle", "triangle angle sum"],
      techniques: [],
      givens: ["$AB = AC$", "$\\widehat{A} = 40^{\\circ}$"],
      unknowns: ["$\\widehat{B}$"],
      constraints: [],
      status: "solvable",
      statusReason: null,
      interpretationNotes: [],
    },
    strategy: "Use base angles and the angle sum.",
    hints: [
      { id: "h1", level: 1, question: "What kind of triangle is ABC?", cue: null, explanation: "Isosceles.", math: null, stepId: "s1", focus: ["AB", "AC"] },
      { id: "h2", level: 2, question: "Base angles?", cue: null, explanation: "Equal.", math: null, stepId: "s2", focus: ["angle_B", "ACB"] },
    ],
    steps: [
      { id: "s1", title: "Isosceles", explanation: "AB = AC", math: null, reason: null, uses: [], geometryActions: [{ action: "highlight", targets: ["seg_AB", "AC"] }] },
      { id: "s2", title: "Angle sum", explanation: "…", math: "2\\widehat{B} + 40^{\\circ} = 180^{\\circ}", reason: null, uses: [], geometryActions: [{ action: "highlight", targets: ["ABC", "ghost"] }] },
    ],
    finalAnswer: { text: "$\\widehat{B} = 70^{\\circ}$", math: null },
    figure: {
      scale: "exact",
      points: [
        P("A", "free", { x: 0, y: 4 }),
        P("B", "polar", { refs: ["A"], value: 250, value2: 5 }),
        P("C", "polar", { refs: ["A"], value: 290, value2: 5 }),
      ],
      lines: [
        { id: "seg_AB", kind: "segment", from: "A", to: "B", style: "given", label: null },
        { id: "seg_AC", kind: "segment", from: "A", to: "C", style: "given", label: null },
        { id: "seg_BC", kind: "segment", from: "B", to: "C", style: "given", label: null },
      ],
      circles: [],
      angles: [
        { id: "ang_A", from: "B", vertex: "A", to: "C", label: "40°", right: false, style: "given" },
        { id: "ang_B", from: "A", vertex: "B", to: "C", label: "?", right: false, style: "given" },
        { id: "ang_C", from: "A", vertex: "C", to: "B", label: null, right: false, style: "given" },
      ],
      marks: [{ kind: "equal", targets: ["seg_AB", "seg_AC"], group: 1 }],
      checks: [
        { kind: "equal_length", refs: ["A", "B", "A", "C"], value: null, role: "given" },
        { kind: "angle_value", refs: ["B", "A", "C"], value: 40, role: "given" },
        { kind: "angle_value", refs: ["A", "B", "C"], value: 70, role: "derived" },
      ],
    },
    answerChecks: [{ kind: "value", statements: ["(180 - 40)/2"], assignments: [], expected: "70" }],
    ...overrides,
  };
}

const algebraBase = (): ModelLesson => {
  const lesson = isoscelesLesson({ figure: null });
  return { ...lesson, analysis: { ...lesson.analysis, topic: "equation" } };
};

describe("verifyLesson", () => {
  it("requires a figure for geometry problems the statement doesn't define a shape for", () => {
    const l = isoscelesLesson({ figure: null });
    l.analysis = { ...l.analysis, statement: "Hai đoạn thẳng $BF$ và $CE$ cắt nhau tại $A$. Tính $\\widehat{AHC}$." };
    expect(verifyLesson(l).feedback.join(" ")).toMatch(/needs a figure/);
  });

  it("draws the figure from the statement when the model draws none", () => {
    const v = verifyLesson(isoscelesLesson({ figure: null }));
    expect(v.feedback.join(" ")).not.toMatch(/needs a figure/);
    expect(v.lesson.figure?.points.map((p) => p.id)).toEqual(expect.arrayContaining(["A", "B", "C"]));
    const [A, B, C] = ["A", "B", "C"].map((id) => v.resolvedFigure!.points[id]!);
    expect(Math.abs(Math.hypot(A!.x - B!.x, A!.y - B!.y) - Math.hypot(A!.x - C!.x, A!.y - C!.y))).toBeLessThan(1e-9);
  });

  it("treats a complete lesson labelled ambiguous as solvable and verifies it", () => {
    const lesson = isoscelesLesson();
    lesson.analysis = { ...lesson.analysis, status: "ambiguous", statusReason: "Góc A có thể là 40° hoặc 140° (ảnh mờ)." };
    const result = verifyLesson(lesson);
    expect(result.lesson.analysis.status).toBe("solvable");
    expect(result.lesson.analysis.statusReason).toBeNull();
    expect(result.lesson.analysis.interpretationNotes).toEqual(["Góc A có thể là 40° hoặc 140° (ảnh mờ)."]);
    expect(result.verification.status).toBe("verified");
    // A reason that reports nothing ("the problem is clear") is not kept as a note.
    lesson.analysis = { ...lesson.analysis, statusReason: "The problem statement is clear; no ambiguity detected." };
    expect(verifyLesson(lesson).lesson.analysis.interpretationNotes).toEqual([]);
  });

  it("keeps an ambiguous status when there is no lesson", () => {
    const lesson = isoscelesLesson({ steps: [], hints: [] });
    lesson.analysis = { ...lesson.analysis, status: "ambiguous", statusReason: "The value of AB is unreadable." };
    expect(verifyLesson(lesson).lesson.analysis.status).toBe("ambiguous");
  });

  it("the fixture matches the schema", () => {
    expect(ModelLessonSchema.safeParse(isoscelesLesson()).success).toBe(true);
  });

  it("verifies a correct geometry lesson and maps target aliases", () => {
    const result = verifyLesson(isoscelesLesson());
    expect(result.verification.status).toBe("verified");
    expect(result.feedback).toEqual([]);
    expect(result.lesson.hints[0]!.focus).toEqual(["seg_AB", "seg_AC"]);
    expect(result.lesson.hints[1]!.focus).toEqual(["ang_B", "ang_C"]);
    expect(result.lesson.steps[1]!.geometryActions[0]!.targets).toEqual(["ang_B"]);
  });

  it("flags a wrong derived answer", () => {
    const lesson = isoscelesLesson();
    lesson.figure!.checks[2]!.value = 60;
    const result = verifyLesson(lesson);
    expect(result.verification.status).toBe("unverified");
    expect(result.feedback.join(" ")).toMatch(/derived claim/);
  });

  it("replaces a model's placement that contradicts the givens with the statement's construction", () => {
    const lesson = isoscelesLesson();
    lesson.figure!.points[2]!.value2 = 7; // AB ≠ AC in the model's figure
    const r = verifyLesson(lesson);
    const [A, B, C] = ["A", "B", "C"].map((id) => r.resolvedFigure!.points[id]!);
    expect(Math.abs(Math.hypot(A!.x - B!.x, A!.y - B!.y) - Math.hypot(A!.x - C!.x, A!.y - C!.y))).toBeLessThan(1e-9);
    expect(r.verification.figureIssue).toBeNull();
  });

  it("drops a figure that contradicts the givens when the statement can't be built, but keeps the lesson", () => {
    const lesson = isoscelesLesson();
    lesson.analysis = { ...lesson.analysis, statement: lesson.analysis.statement.replace("Cho tam giác $ABC$", "Cho $ABC$") };
    lesson.figure!.points[2]!.value2 = 7; // AB ≠ AC now
    const result = verifyLesson(lesson);
    expect(result.lesson.figure).toBeNull();
    expect(result.verification.figureIssue).toBe("figure_invalid");
    expect(result.lesson.steps.every((s) => s.geometryActions.length === 0)).toBe(true);
  });

  it("verifies algebra by substitution and catches wrong roots", () => {
    const base = algebraBase();
    const ok = verifyLesson({
      ...base,
      answerChecks: [{ kind: "substitute", statements: ["x^2 + 5x + 6 = 0"], assignments: [[{ variable: "x", value: "-2" }], [{ variable: "x", value: "-3" }]], expected: null }],
    });
    expect(ok.verification.status).toBe("verified");
    const bad = verifyLesson({
      ...base,
      answerChecks: [{ kind: "substitute", statements: ["x^2 + 5x + 6 = 0"], assignments: [[{ variable: "x", value: "2" }]], expected: null }],
    });
    expect(bad.verification.status).toBe("unverified");
  });

  it("verifies systems, identities with domains, and inequalities", () => {
    const base = algebraBase();
    const result = verifyLesson({
      ...base,
      answerChecks: [
        { kind: "substitute", statements: ["2x + y = 5", "x - 3y = -1"], assignments: [[{ variable: "x", value: "2" }, { variable: "y", value: "1" }]], expected: null },
        { kind: "identity", statements: ["(sqrt(x)+1)/(sqrt(x)-1) - 2/(x-1) = (x+1)/(x-1) - 2/(x-1) + 2sqrt(x)/(x-1)", "x >= 0", "x != 1"], assignments: [], expected: null },
        { kind: "inequality", statements: ["3(x-2) <= 5x + 4"], assignments: [], expected: "x >= -5" },
      ],
    });
    expect(result.feedback).toEqual([]);
    expect(result.verification.status).toBe("verified");

    const wrongIneq = verifyLesson({
      ...base,
      answerChecks: [{ kind: "inequality", statements: ["3(x-2) <= 5x + 4"], assignments: [], expected: "x <= -5" }],
    });
    expect(wrongIneq.verification.status).toBe("unverified");
  });

  it("does not count checks that merely restate the answer", () => {
    const base = algebraBase();
    const trivial = verifyLesson({
      ...base,
      answerChecks: [
        { kind: "value", statements: ["3"], assignments: [], expected: "3" },
        { kind: "substitute", statements: ["3 = 3"], assignments: [[{ variable: "m", value: "3" }]], expected: null },
      ],
    });
    expect(trivial.verification.status).not.toBe("verified");
    expect(trivial.feedback.join(" ")).toMatch(/only restates the answer/);
    const real = verifyLesson({
      ...base,
      answerChecks: [{ kind: "value", statements: ["(2*(2+1))^2 - 2*(2^2+3)"], assignments: [], expected: "22" }],
    });
    expect(real.verification.status).toBe("verified");
    const wrongVieta = verifyLesson({
      ...base,
      answerChecks: [{ kind: "value", statements: ["(2*(3+1))^2 - 2*(3^2+3)"], assignments: [], expected: "22" }],
    });
    expect(wrongVieta.verification.status).toBe("unverified");
  });

  it("rejects hints pointing at missing steps", () => {
    const lesson = isoscelesLesson();
    lesson.hints[0]!.stepId = "s9";
    expect(verifyLesson(lesson).feedback.join(" ")).toMatch(/unknown step/);
  });

  it("builds a target index from labels", () => {
    const index = buildTargetIndex(isoscelesLesson().figure!);
    expect(index.get("BA")).toBe("seg_AB");
    expect(index.get("CBA")).toBe("ang_B");
    expect(index.get("angle_A")).toBe("ang_A");
  });
});

describe("fixDoubledEscapes", () => {
  it("collapses double-escaped commands but keeps real line breaks", async () => {
    const { fixDoubledEscapes } = await import("../src/solver/pipeline");
    expect(fixDoubledEscapes("x \\\\ge -10")).toBe("x \\ge -10");
    expect(fixDoubledEscapes("\\\\frac{1}{2}")).toBe("\\frac{1}{2}");
    expect(fixDoubledEscapes("a = 1 \\\\ b = 2")).toBe("a = 1 \\\\ b = 2");
    expect(fixDoubledEscapes("x \\ge 1")).toBe("x \\ge 1");
    expect(fixDoubledEscapes("\\\\gets")).toBe("\\\\gets");
  });
});

describe("expandSegmentRefs", () => {
  it("splits segment names in figure checks into their points", async () => {
    const { expandSegmentRefs } = await import("../src/solver/pipeline");
    const pt = (id: string) => ({ id, label: id, kind: "free" as const, refs: [], x: 0, y: 0, value: null, value2: null, draggable: true, hidden: false });
    const figure = {
      scale: "schematic" as const,
      points: ["A", "B", "C", "H1"].map(pt),
      lines: [], angles: [], marks: [],
      circles: [{ id: "c", center: "A", through: "B", radius: null, style: "given" as const, label: null }],
      checks: [
        { kind: "perpendicular" as const, refs: ["AB", "AC"], value: null, role: "given" as const },
        { kind: "perpendicular" as const, refs: ["AH1", "B", "C"], value: null, role: "given" as const },
        { kind: "on_circle" as const, refs: ["C", "c"], value: null, role: "given" as const },
        { kind: "collinear" as const, refs: ["XY", "A"], value: null, role: "given" as const },
      ],
    };
    const out = expandSegmentRefs(figure as never);
    expect(out.checks.map((c) => c.refs)).toEqual([["A", "B", "A", "C"], ["A", "H1", "B", "C"], ["C", "c"], ["XY", "A"]]);
  });
});

describe("language hygiene", () => {
  it.each([
    ["phuong trinh: x^2 + 2ax + 3b = 0", true],
    ["moi phuong trinh co hai nghiem phan biet", true],
    ["dieukien co hai nghiem phan biet", true],
    ["phương trình: $x^2 + 2ax + 3b = 0$", false],
    ["$x^2 + 2ax + 3b = 0$", false],
    ["Vieta's formulas", false],
    ["the sum of the roots", false],
  ])("isStrippedVietnamese(%s) = %s", (text, expected) => {
    expect(isStrippedVietnamese(text)).toBe(expected);
  });

  const viLesson = () => {
    const lesson = isoscelesLesson();
    lesson.analysis = {
      ...lesson.analysis,
      givens: ["phuong trinh: x^2 + 2ax + 3b = 0", "$AB = AC$"],
      concepts: ["biet thuc", "công thức Vi-ét"],
      techniques: [],
      interpretationNotes: ["The problem statement is clear and complete; no OCR corrections needed."],
    };
    return lesson;
  };

  it("drops stripped-Vietnamese list items and no-op notes without asking for a retry", () => {
    const { lesson, feedback } = cleanLanguage(viLesson());
    expect(lesson.analysis.givens).toEqual(["$AB = AC$"]);
    expect(lesson.analysis.concepts).toEqual(["công thức Vi-ét"]);
    expect(lesson.analysis.interpretationNotes).toEqual([]);
    expect(feedback).toEqual([]);
  });

  it.each([
    ["Giải (a-b)(2t-3)=0 để得到 t=3/2, sau đó thay vào.", "Giải (a-b)(2t-3)=0 để có t=3/2, sau đó thay vào."],
    ["áp dụng hằng đẳng thức, bạn得到 hai thừa số", "áp dụng hằng đẳng thức, bạn được hai thừa số"],
    ["sau khi lấy ra因子 16, chúng ta", "sau khi lấy ra thừa số 16, chúng ta"],
    ["Tỉ số các边 trong tam giác", "Tỉ số các cạnh trong tam giác"],
    ["bất đẳng thức vừa得到.", "bất đẳng thức vừa có."],
    ["ta sẽ得到什么样的表达式？", "ta sẽ được biểu thức nào?"],
    ["thay t vào một phương trình gốc để求 a+b", "thay t vào một phương trình gốc để tìm a+b"],
    ["Chúng ta sẽ chứng minh hai cặp tam giác semelhante", "Chúng ta sẽ chứng minh hai cặp tam giác đồng dạng"],
    ["Thay giá trịKnown vào phương trình", "Thay giá trị đã biết vào phương trình"],
    ["hủy factors chung, giữ $factor$", "hủy nhân tử chung, giữ $factor$"],
  ])("patchVietnamese(%s)", (input, expected) => {
    expect(patchVietnamese(input)).toBe(expected);
  });

  it("patches every string, not just the first (global regex state)", () => {
    expect(patchVietnamese("một đoạn văn dài có chữ semelhante ở cuối câu này")).toMatch(/đồng dạng/);
    expect(patchVietnamese("tam giác semelhante")).toBe("tam giác đồng dạng");
  });

  it("patches known Chinese words without asking for a retry", () => {
    const lesson = isoscelesLesson();
    lesson.steps[0]!.explanation = "Cộng hai bất đẳng thức để得到 kết quả.";
    const { lesson: fixed, feedback } = cleanLanguage(lesson);
    expect(fixed.steps[0]!.explanation).toBe("Cộng hai bất đẳng thức để có kết quả.");
    expect(feedback).toEqual([]);
  });

  it("asks for a retry when a hint switches to Chinese", () => {
    const lesson = viLesson();
    lesson.hints[1]!.question = "Nếu mở rộng các bình phương, 我们可以看到 điều gì?";
    expect(cleanLanguage(lesson).feedback.join(" ")).toMatch(/hint h2 .*Chinese/);
    expect(verifyLesson(lesson).feedback.join(" ")).toMatch(/Chinese/);
  });

  it("asks for a retry when a step is Vietnamese without diacritics", () => {
    const lesson = viLesson();
    lesson.steps[0]!.explanation = "Vi moi phuong trinh co hai nghiem phan biet nen biet thuc duong.";
    expect(cleanLanguage(lesson).feedback.join(" ")).toMatch(/step s1 is Vietnamese without diacritics/);
  });
});

// --- knowledge base: techniques, step dependencies, per-step verification ----

describe("knowledge-base metadata", () => {
  it("keeps only knowledge-base technique ids", () => {
    const l = isoscelesLesson();
    l.analysis = { ...l.analysis, techniques: ["angle_chasing", "Congruent_Triangles", "inversion", "angle_chasing"] };
    expect(verifyLesson(l).lesson.analysis.techniques).toEqual(["angle_chasing", "congruent_triangles"]);
  });

  it("drops step dependencies on later or unknown steps", () => {
    const l = isoscelesLesson();
    l.steps = [{ ...l.steps[0]!, uses: ["s2"] }, { ...l.steps[1]!, uses: ["s1", "s9"] }];
    const out = verifyLesson(l).lesson;
    expect(out.steps.map((s) => s.uses)).toEqual([[], ["s1"]]);
  });

  it("reports per step what was machine-checked, and nothing more", () => {
    const v = verifyLesson(isoscelesLesson()).verification;
    expect(v.steps?.map((s) => s.stepId)).toEqual(["s1", "s2"]);
    expect(v.steps?.[0]).toMatchObject({ status: "checked" });
    expect(v.steps?.[0]!.claims).toBeGreaterThan(0);
  });

  it("flags a step whose claim is false on the figure", () => {
    const l = isoscelesLesson();
    l.steps = [{ ...l.steps[0]!, explanation: "Ta có $AB = BC$." }, l.steps[1]!];
    expect(verifyLesson(l).verification.steps?.[0]!.status).toBe("failed");
  });

  it("marks only the final step of a checked algebra answer, the rest as not checked", () => {
    const v = verifyLesson(algebraBase()).verification;
    expect(v.steps?.map((s) => s.status)).toEqual(["not_checked", "answer"]);
  });
});

describe("problem domains", () => {
  it("detects the domains a problem draws on", () => {
    expect(problemDomains("Cho tam giác ABC nội tiếp đường tròn (O).")).toEqual(["algebra", "geometry"]);
    expect(problemDomains("Tìm số nguyên dương n sao cho n^2 + 3 chia hết cho n + 1.")).toEqual(["algebra", "number_theory"]);
    expect(problemDomains("Có bao nhiêu cách tô màu bảng 3 × 3?")).toEqual(["algebra", "combinatorics"]);
    expect(problemDomains("Giải phương trình x^2 - 5x + 6 = 0.")).toEqual(["algebra"]);
  });

  it("puts only the relevant knowledge-base topics in the prompt, and always the outside list", () => {
    const geo = buildSystemPrompt(VN_GRADE_9, { domains: ["algebra", "geometry"] });
    expect(geo).toMatch(/B2/);
    expect(geo).not.toMatch(/C2\b/);
    expect(geo).toMatch(/antiparallel/);
    expect(buildSystemPrompt(VN_GRADE_9, { domains: ["algebra", "number_theory"] })).toMatch(/C2/);
  });
});

describe("figure completeness", () => {
  it("draws an arc for a mentioned angle and highlights it in the step that uses it", () => {
    const l = isoscelesLesson();
    l.figure = { ...l.figure!, angles: l.figure!.angles.filter((x) => x.id !== "ang_C") };
    l.steps = [l.steps[0]!, { ...l.steps[1]!, explanation: "Vì $\\widehat{ACB} = \\widehat{ABC}$ nên …", geometryActions: [] }];
    const out = verifyLesson(l).lesson;
    const arc = out.figure!.angles.find((x) => x.vertex === "C");
    expect(arc).toBeTruthy();
    const targets = out.steps[1]!.geometryActions.flatMap((x) => x.targets);
    expect(targets).toContain(arc!.id);
    expect(targets).toContain("ang_B");
  });

  it("adds what a step names to the model's partial highlight", () => {
    const l = isoscelesLesson();
    l.steps = [{ ...l.steps[0]!, explanation: "Ta có $AB = AC$ và $BC$ là đáy.", geometryActions: [{ action: "highlight", targets: ["seg_AB"] }] }, l.steps[1]!];
    const targets = verifyLesson(l).lesson.steps[0]!.geometryActions.find((x) => x.action === "highlight")!.targets;
    expect(targets[0]).toBe("seg_AB");
    expect(targets).toEqual(expect.arrayContaining(["seg_AC", "seg_BC"]));
  });

  it("measures coverage: every named object drawn and every step synced after completion", () => {
    const { lesson, resolvedFigure } = verifyLesson(isoscelesLesson());
    const c = figureCoverage(lesson, resolvedFigure!)!;
    expect(c.missing).toEqual([]);
    expect(c.segments.drawn).toBe(c.segments.mentioned);
    expect(c.steps.synced).toBe(c.steps.mentioning);
  });
});

describe("answers that deny what the question presupposes", () => {
  it("rejects 'vô nghiệm' for a question that asks for one value", () => {
    const l = algebraBase();
    l.analysis = { ...l.analysis, statement: "Hai xe cùng tốc độ $a$ hướng đến giao lộ. Hỏi xe tải đến giao lộ lúc mấy giờ?" };
    l.finalAnswer = { text: "Vô nghiệm (không có thời điểm nào thỏa mãn).", math: null };
    l.answerChecks = [];
    const v = verifyLesson(l);
    expect(v.verification.status).toBe("unverified");
    expect(v.feedback.join(" ")).toMatch(/expects one to exist/);
  });

  it("allows 'không tồn tại' when the question asks whether something exists", () => {
    expect(presupposesAnswer("Số học sinh trường A có thể là 25 được không? Vì sao?")).toBe(false);
    expect(presupposesAnswer("Tìm tất cả số nguyên n sao cho n^2 + 1 chia hết cho 3.")).toBe(false);
    expect(presupposesAnswer("Giải phương trình x^2 + 1 = 0.")).toBe(false);
    expect(presupposesAnswer("Tính diện tích tam giác ABC.")).toBe(true);
    expect(deniesAnswer("Phương trình vô nghiệm.")).toBe(true);
    expect(deniesAnswer("$x = 3$")).toBe(false);
  });
});

describe("everything a step or hint names is highlighted (user request 2026-10-06)", () => {
  const fig = () => {
    const v = verifyLesson(isoscelesLesson());
    return { figure: v.lesson.figure!, resolved: v.resolvedFigure! };
  };

  it("finds points, segments, three-letter and vertex angles, and polygons", () => {
    const { figure, resolved } = fig();
    const t = mentionedTargets(["Xét tam giác $ABC$ có $\\widehat{A} = 40^{\\circ}$ và $\\widehat{ABC} = \\widehat{ACB}$; điểm $B$ nằm trên $BC$."], figure, resolved);
    expect(t).toEqual(expect.arrayContaining(["A", "B", "C", "seg_AB", "seg_AC", "seg_BC", "ang_A", "ang_B", "ang_C", polygonId(["A", "B", "C"])]));
  });

  it("ignores words that merely start with a capital letter", () => {
    const { figure, resolved } = fig();
    expect(mentionedTargets(["Vậy Ta có kết quả."], figure, resolved)).toEqual([]);
  });

  it("fills a highlighted polygon in the scene, and only while highlighted", () => {
    const { figure, resolved } = fig();
    const view = { scale: 20, tx: 100, ty: 100 } as never;
    const on = buildScene(figure, resolved, view, { highlighted: new Set([polygonId(["A", "B", "C"])]), shownConstructions: new Set(), showLabels: true });
    const off = buildScene(figure, resolved, view, { highlighted: new Set(), shownConstructions: new Set(), showLabels: true });
    expect(on.polygons).toHaveLength(1);
    expect(off.polygons).toHaveLength(0);
  });
});

describe("solutions that don't match the figure; highlighting (user report 2026-10-07)", () => {
  const ch4 = "Cho tam giác $ABC$ nhọn ($AB < AC$) có đường tròn nội tiếp $(I)$ tiếp xúc với các cạnh $BC, CA, AB$ lần lượt tại $D, E, F$. Gọi $J$ là trung điểm của $EF$ và $K$ là giao điểm của $AD$ với $EF$. b) Gọi $H$ là giao điểm khác $I$ của $IK$ với đường tròn đường kính $AI$. Chứng minh các điểm $I, D, J, H$ cùng thuộc một đường tròn $(S)$. c) Gọi $L$ và $G$ lần lượt là các giao điểm khác $D$ của $DJ$ và $(S)$ với $(I)$. Chứng minh $A, G, D$ thẳng hàng.";

  it("tells the solver each point's exact definition and the non-obvious facts of the figure", () => {
    const notes = describeStatementFigure(ch4)!;
    expect(notes).toMatch(/L = intersection of line DJ with \(I\)/);
    expect(notes).toMatch(/G = intersection of \(S\) through I, D, J and \(I\) other than D/);
    expect(notes).toMatch(/A, I, J are collinear/);
    expect(notes).not.toMatch(/E, J, K are collinear/); // J and K are both defined on EF: not news
  });

  it("explains a false concyclic claim when three of the points are collinear", () => {
    const l = isoscelesLesson({ figure: null });
    l.analysis = { ...l.analysis, topic: "geometry", statement: ch4 };
    l.steps = [{ ...l.steps[0]!, explanation: "Suy ra $A, J, H, I$ cùng thuộc một đường tròn.", geometryActions: [] }, l.steps[1]!];
    expect(verifyLesson(l).feedback.join(" ")).toMatch(/collinear, so these four points can't be concyclic/);
  });

  it("highlights the triangle's angle for '∠A' even when other arcs share the vertex", () => {
    const v = verifyLesson(isoscelesLesson());
    const t = mentionedTargets(["Trong tam giác $ABC$, $\\widehat{A} = 40^{\\circ}$"], v.lesson.figure!, v.resolvedFigure!);
    expect(t).toContain("ang_A");
  });

  it("shows a construction the selected step names, even before the step that reveals it", () => {
    const v = verifyLesson(isoscelesLesson());
    const fig = { ...v.lesson.figure!, lines: v.lesson.figure!.lines.map((l) => (l.id === "seg_BC" ? { ...l, style: "construction" as const } : l)) };
    const view = { scale: 20, tx: 100, ty: 100 } as never;
    const hidden = buildScene(fig, v.resolvedFigure!, view, { highlighted: new Set(), shownConstructions: new Set(), showLabels: true });
    const named = buildScene(fig, v.resolvedFigure!, view, { highlighted: new Set(["seg_BC"]), shownConstructions: new Set(), showLabels: true });
    expect(hidden.lines.some((l) => l.id === "seg_BC")).toBe(false);
    expect(named.lines.some((l) => l.id === "seg_BC")).toBe(true);
  });
});

describe("a model construction that collapses onto another point is replaced (user report: H drawn at I)", () => {
  it("rebuilds H from 'giao điểm khác I của IK với đường tròn đường kính AI'", () => {
    const P = (id: string, kind: string, refs: string[], x: number | null = null, y: number | null = null, value: number | null = null) =>
      ({ id, label: id, kind, refs, x, y, value, value2: null, draggable: false, hidden: false }) as never;
    const l = isoscelesLesson();
    l.analysis = { ...l.analysis, statement: "Cho tam giác $ABC$. Gọi $I$ là tâm đường tròn nội tiếp tam giác $ABC$, $K$ là trung điểm $BC$. Gọi $H$ là giao điểm khác $I$ của $IK$ với đường tròn đường kính $AI$." };
    l.figure = {
      ...l.figure!,
      points: [P("A", "free", [], 0, 4), P("B", "free", [], -3, 0), P("C", "free", [], 4, 0), P("I", "incenter", ["A", "B", "C"]), P("K", "midpoint", ["B", "C"]), P("H", "intersection", ["I", "K", "A", "I"])],
      checks: [],
      angles: [],
      marks: [],
    };
    const fig = constructNamedPoints(l).lesson.figure!;
    const r = resolveFigure(fig);
    expect(Math.hypot(r.points.H!.x - r.points.I!.x, r.points.H!.y - r.points.I!.y)).toBeGreaterThan(0.1);
    expect(fig.points.find((p) => p.id === "H")!.kind).toBe("line_circle");
  });
});
