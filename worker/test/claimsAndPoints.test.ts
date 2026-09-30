import { describe, expect, it } from "vitest";
import { checkClaims } from "../../shared/src/claims";
import { resolveFigure } from "../../shared/src/geometry";
import { constructNamedPoints } from "../../shared/src/pointDefinitions";
import type { Figure, ModelLesson, PointDef } from "../../shared/src/solution";

const P = (id: string, kind: PointDef["kind"], extra: Partial<PointDef> = {}): PointDef => ({
  id, label: id, kind, refs: [], x: null, y: null, value: null, value2: null, draggable: false, hidden: false, ...extra,
});
const triangle: Figure = {
  scale: "schematic",
  points: [P("A", "free", { x: 0, y: 5 }), P("B", "free", { x: -3, y: 0 }), P("C", "free", { x: 5, y: 0 })],
  lines: [], circles: [], angles: [], marks: [], checks: [],
};
const lessonWith = (statement: string, steps: string[] = [], figure: Figure = triangle): ModelLesson =>
  ({
    analysis: { statement, language: "vi", topic: "geometry", subtopic: "", gradeLevel: 9, withinCurriculum: true, concepts: [], givens: [], unknowns: [], constraints: [], status: "solvable", statusReason: null, interpretationNotes: [] },
    strategy: "",
    hints: [],
    steps: steps.map((explanation, i) => ({ id: `s${i + 1}`, title: "", explanation, math: null, reason: null, geometryActions: [] })),
    finalAnswer: { text: "", math: null },
    answerChecks: [],
    figure,
  }) as unknown as ModelLesson;

describe("point definitions from the text", () => {
  it("builds midpoints, feet, intersections and circle points exactly", () => {
    const { lesson, constructed } = constructNamedPoints(
      lessonWith("Cho tam giác $ABC$. Gọi $M$ là trung điểm của $BC$, $H$ là hình chiếu của $A$ trên $BC$ và $G$ là trọng tâm của tam giác $ABC$. Gọi $K$ là giao điểm của $AM$ với đường tròn đường kính $AH$ khác $A$."),
    );
    expect(constructed).toEqual(expect.arrayContaining(["M", "H", "G"]));
    const r = resolveFigure(lesson.figure!);
    expect(r.points.M).toEqual({ x: 1, y: 0 });
    expect(r.points.H!.x).toBeCloseTo(0);
    expect(r.points.H!.y).toBeCloseTo(0);
    expect(r.points.G!.y).toBeCloseTo(5 / 3);
    expect(lesson.figure!.points.find((p) => p.id === "K")?.kind).toBe("line_circle");
  });

  it("replaces a point the model only placed, but never a constructed one", () => {
    const fig: Figure = { ...triangle, points: [...triangle.points, P("M", "on_segment", { refs: ["B", "C"], value: 0.3 }), P("D", "foot", { refs: ["A", "B", "C"] })] };
    const { lesson } = constructNamedPoints(lessonWith("Gọi M là trung điểm của BC và D là trung điểm của AB.", [], fig));
    const byId = new Map(lesson.figure!.points.map((p) => [p.id, p]));
    expect(byId.get("M")!.kind).toBe("midpoint");
    expect(byId.get("D")!.kind).toBe("foot");
  });

  it("handles tangency points and 'lần lượt'", () => {
    const { lesson } = constructNamedPoints(
      lessonWith(
        "Cho tam giác ABC có đường tròn nội tiếp (I) tiếp xúc với các cạnh BC, CA, AB lần lượt tại D, E, F.",
        [],
        { ...triangle, points: [...triangle.points, P("I", "incenter", { refs: ["A", "B", "C"] })], circles: [{ id: "c_I", center: "I", through: null, radius: 1, style: "given", label: "(I)" }] },
      ),
    );
    const feet = lesson.figure!.points.filter((p) => ["D", "E", "F"].includes(p.id));
    expect(feet.map((p) => `${p.id}:${p.kind}:${p.refs.join("")}`)).toEqual(["D:foot:IBC", "E:foot:ICA", "F:foot:IAB"]);
  });
});

describe("geometric claims measured on the figure", () => {
  const fig = constructNamedPoints(lessonWith("Gọi M là trung điểm của BC và H là hình chiếu của A trên BC.")).lesson.figure!;
  const r = resolveFigure(fig);
  it("accepts true claims and rejects false ones", () => {
    const results = checkClaims(["Vì $AH \\perp BC$ và $MB = MC$ nên ta có $\\frac{MB}{MC} = 1$", "Suy ra $AM \\perp BC$", "B, M, C thẳng hàng"], r);
    const byLabel = new Map(results.map((c) => [c.label, c.passed]));
    expect(byLabel.get("AH ⊥ BC")).toBe(true);
    expect(byLabel.get("MB = MC")).toBe(true);
    expect(byLabel.get("AM ⊥ BC")).toBe(false);
    expect(byLabel.get("B, M, C thẳng hàng")).toBe(true);
  });

  it("ignores arithmetic, sums and hypotheticals", () => {
    const results = checkClaims(["AB = AH + HB", "AD = AH \\cos\\widehat{DAH}", "Nếu AM ⊥ BC thì tam giác cân"], r);
    expect(results).toEqual([]);
  });
});
