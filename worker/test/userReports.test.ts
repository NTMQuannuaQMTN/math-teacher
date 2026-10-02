import { describe, expect, it } from "vitest";
import { regularizeTriangle } from "../../shared/src/figureShape";
import { resolveFigure } from "../../shared/src/geometry";
import { gradeLevelFeedback } from "../../shared/src/gradeLevel";
import { patchVietnamese, simplifyNotation } from "../../shared/src/language";
import { constructNamedPoints } from "../../shared/src/pointDefinitions";
import type { ModelLesson } from "../../shared/src/solution";
import { normalizeFigureChecks } from "../../shared/src/verify";

const STATEMENT =
  "Câu 4 (3 điểm). Cho tam giác ABC nhọn (AB < AC) có đường tròn nội tiếp (I) tiếp xúc với các cạnh BC, CA, AB lần lượt tại D, E, F. Gọi J là trung điểm của EF và K là giao điểm của AD với EF.";

function incircleLesson(): ModelLesson {
  const P = (id: string, kind: string, extra: Record<string, unknown> = {}) => ({ id, label: id, kind, refs: [], x: null, y: null, value: null, value2: null, draggable: false, hidden: false, ...extra });
  return {
    analysis: { statement: STATEMENT, language: "vi", topic: "geometry", subtopic: "", gradeLevel: 9, withinCurriculum: true, concepts: [], givens: [], unknowns: [], constraints: [], status: "solvable", statusReason: null, interpretationNotes: [] },
    strategy: "",
    hints: [{ id: "h1", level: 1, question: "?", cue: null, explanation: "…", math: null, stepId: "s1", focus: [] }],
    steps: [{ id: "s1", title: "t", explanation: "e", math: null, reason: null, geometryActions: [] }],
    finalAnswer: { text: "đpcm", math: null },
    figure: {
      scale: "schematic",
      // The model's figure from the report: I = reflect(A, BC) instead of the incentre; a nearly isosceles triangle.
      points: [
        P("A", "free", { x: 0, y: 4 }), P("B", "free", { x: -4, y: 0 }), P("C", "free", { x: 5, y: 0 }),
        P("I", "reflect", { refs: ["A", "B", "C"] }),
        P("D", "foot", { refs: ["I", "B", "C"] }), P("E", "foot", { refs: ["I", "C", "A"] }), P("F", "foot", { refs: ["I", "A", "B"] }),
      ],
      lines: [], circles: [{ id: "c_I", center: "I", through: "D", radius: null, style: "given", label: "(I)" }], angles: [], marks: [], checks: [],
    },
    answerChecks: [],
  } as unknown as ModelLesson;
}

describe("user report: incircle figure drawn wrong", () => {
  it("rebuilds I as the incentre even when the model gave another construction", () => {
    const { lesson } = constructNamedPoints(incircleLesson());
    const I = lesson.figure!.points.find((p) => p.id === "I")!;
    expect(I.kind).toBe("incenter");
    const fig = resolveFigure(lesson.figure!);
    const [i, d, e, f] = ["I", "D", "E", "F"].map((id) => fig.points[id]!);
    const r = Math.hypot(i!.x - d!.x, i!.y - d!.y);
    for (const p of [e!, f!]) expect(Math.abs(Math.hypot(i!.x - p.x, i!.y - p.y) - r)).toBeLessThan(1e-9);
    expect(i!.y).toBeGreaterThan(0); // inside the triangle, above BC
  });

  it("reshapes a nearly isosceles triangle so AB < AC is clearly visible", () => {
    const { lesson, moved } = regularizeTriangle(incircleLesson());
    expect(moved).toBe("A");
    const at = (id: string) => lesson.figure!.points.find((p) => p.id === id)!;
    const d = (a: string, b: string) => Math.hypot(at(a).x! - at(b).x!, at(a).y! - at(b).y!);
    expect(d("A", "C")).toBeGreaterThan(d("A", "B") * 1.2);
  });

  it("reads a four-point on_circle check as concyclic", () => {
    expect(normalizeFigureChecks([{ kind: "on_circle", refs: ["I", "D", "J", "H"], value: null, role: "derived" }]).checks[0]!.kind).toBe("concyclic");
  });
});

describe("user report: f(n) lesson notation and method", () => {
  it.each([
    [String.raw`n \equiv 0 \text{ hoặc } 2 \pmod{4}`, String.raw`n \equiv 0 \pmod{2}`],
    ["n ≡ 0 hoặc 2 (mod 4)", "n ≡ 0 (mod 2), tức là n chẵn"],
    [String.raw`n \equiv 16 \text{ hoặc } 34 \pmod{36}`, String.raw`n \equiv 16 \pmod{18}`],
    [String.raw`n \equiv 0 \pmod{3} \land n \ge 15`, String.raw`n \equiv 0 \pmod{3} \text{ và } n \ge 15`],
    ["n ≡ 1 hoặc 2 (mod 3)", "n ≡ 1 hoặc 2 (mod 3)"],
  ])("simplifies %s", (input, expected) => {
    expect(simplifyNotation(input)).toBe(expected);
  });

  it("cleans the summary lists too (Kiến thức sử dụng)", async () => {
    const { cleanLanguage } = await import("../../shared/src/language");
    const l = incircleLesson();
    l.analysis = { ...l.analysis, concepts: ["rút gọn biểu thức, lấy fator chung"] };
    expect(cleanLanguage(l).lesson.analysis.concepts).toEqual(["rút gọn biểu thức, lấy nhân tử chung"]);
  });

  it("replaces 'fator' and the foreign name 'Lo Shu'", () => {
    expect(patchVietnamese("Rút gọn bằng cách lấy fator chung")).toBe("Rút gọn bằng cách lấy nhân tử chung");
    expect(patchVietnamese("Vuông ma Lo Shu sử dụng các số 1–9.")).toBe("Ma phương 3 × 3 sử dụng các số 1–9.");
  });

  it("sends a lesson that cites the Chinese remainder theorem back for a Grade 9 method", () => {
    const l = incircleLesson();
    l.analysis = { ...l.analysis, topic: "other", statement: "Tìm n để f(n) chia hết cho 576." };
    l.figure = null;
    l.steps[0] = { ...l.steps[0]!, explanation: "Kết hợp hai điều kiện bằng Định lý số dư China." };
    expect(gradeLevelFeedback(l).join(" ")).toMatch(/Chinese remainder theorem/);
  });
});

describe("prompt carries the new method rules", () => {
  it("asks for a² − b² factorisation, simplified residues and Vietnamese names", async () => {
    const { buildSystemPrompt } = await import("../src/solver/prompts");
    const { VN_GRADE_9 } = await import("../src/solver/curriculum");
    const prompt = buildSystemPrompt(VN_GRADE_9, { withFigure: false });
    expect(prompt).toMatch(/difference of powers/);
    expect(prompt).toMatch(/n chẵn/);
    expect(prompt).toMatch(/never cite the Chinese remainder theorem/);
    expect(prompt).toMatch(/Lo Shu/);
    expect(prompt).toMatch(/theo câu a/);
  });
});
