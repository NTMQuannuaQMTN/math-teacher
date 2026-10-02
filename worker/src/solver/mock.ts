import type { ModelLesson } from "../../../shared/src/solution";
import { OcrFailure } from "../ocr/provider";
import type { JsonModel } from "./llm";

/**
 * Development-only model: deterministic lessons so the UI and failure
 * paths can be exercised without an API key or cost. Scenarios (header
 * X-Mock-Scenario, development only):
 *   solve_provider_error  — provider fails
 *   solve_malformed       — invalid JSON every time (→ solve fails after retry)
 *   solve_fix_on_retry    — wrong answer first, corrected on the retry
 *   solve_unverified      — wrong answer every time (→ shown as unverified)
 *   solve_slow            — takes 12 s
 * Without a scenario: a geometry lesson if the problem mentions a triangle, else an algebra lesson.
 */
export const MOCK_SOLVE_SCENARIOS = ["solve_provider_error", "solve_malformed", "solve_fix_on_retry", "solve_unverified", "solve_slow"] as const;
export type MockSolveScenario = (typeof MOCK_SOLVE_SCENARIOS)[number];

const base = (overrides: Partial<ModelLesson["analysis"]>): ModelLesson["analysis"] => ({
  statement: "",
  language: "vi",
  topic: "equation",
  subtopic: "",
  gradeLevel: 9,
  withinCurriculum: true,
  concepts: [],
  techniques: [],
  givens: [],
  unknowns: [],
  constraints: [],
  status: "solvable",
  statusReason: null,
  interpretationNotes: [],
  ...overrides,
});

const point = (id: string, kind: "free" | "polar", extra: Record<string, unknown>) => ({
  id,
  label: id,
  kind,
  refs: [] as string[],
  x: null,
  y: null,
  value: null,
  value2: null,
  draggable: false,
  hidden: false,
  ...extra,
});

export function mockGeometryLesson(answer = 70): ModelLesson {
  return {
    analysis: base({
      statement: "Cho tam giác $ABC$ cân tại $A$ có $\\widehat{A} = 40^{\\circ}$. Tính $\\widehat{B}$.",
      topic: "geometry",
      subtopic: "Góc trong tam giác cân",
      gradeLevel: 7,
      concepts: ["Tam giác cân", "Tổng ba góc trong tam giác"],
      techniques: [],
      givens: ["$AB = AC$", "$\\widehat{A} = 40^{\\circ}$"],
      unknowns: ["$\\widehat{B}$"],
    }),
    strategy: "Dùng tính chất hai góc ở đáy của tam giác cân, rồi dùng tổng ba góc trong tam giác.",
    hints: [
      { id: "h1", level: 1, question: "Tam giác $ABC$ là tam giác gì?", cue: null, explanation: "Vì $AB = AC$ nên tam giác $ABC$ cân tại $A$.", math: null, stepId: "s1", focus: ["seg_AB", "seg_AC"] },
      { id: "h2", level: 2, question: "Hai góc ở đáy của tam giác cân có quan hệ gì?", cue: "Nhớ lại tính chất của tam giác cân.", explanation: "Hai góc ở đáy bằng nhau, nên $\\widehat{B} = \\widehat{C}$.", math: null, stepId: "s2", focus: ["ang_ABC", "ang_ACB"] },
      { id: "h3", level: 3, question: "Tổng ba góc trong một tam giác bằng bao nhiêu?", cue: null, explanation: "Tổng ba góc trong tam giác bằng $180^{\\circ}$.", math: "\\widehat{A}+\\widehat{B}+\\widehat{C}=180^{\\circ}", stepId: "s3", focus: ["ang_BAC", "ang_ABC", "ang_ACB"] },
      { id: "h4", level: 4, question: "Hãy dùng các điều trên để tính $\\widehat{B}$.", cue: null, explanation: "Thay $\\widehat{C} = \\widehat{B}$ và $\\widehat{A} = 40^{\\circ}$ vào tổng ba góc.", math: "2\\widehat{B} + 40^{\\circ} = 180^{\\circ}", stepId: "s4", focus: ["ang_ABC"] },
    ],
    steps: [
      { id: "s1", title: "Nhận dạng tam giác", explanation: "Vì $AB = AC$ nên tam giác $ABC$ cân tại $A$.", math: "AB = AC", reason: "Định nghĩa tam giác cân", uses: [], geometryActions: [{ action: "highlight", targets: ["seg_AB", "seg_AC"] }] },
      { id: "s2", title: "Hai góc ở đáy bằng nhau", explanation: "Trong tam giác cân, hai góc ở đáy bằng nhau.", math: "\\widehat{B} = \\widehat{C}", reason: "Tính chất tam giác cân", uses: [], geometryActions: [{ action: "highlight", targets: ["ang_ABC", "ang_ACB"] }] },
      { id: "s3", title: "Tổng ba góc", explanation: "Tổng ba góc trong tam giác bằng $180^{\\circ}$.", math: "\\widehat{A}+\\widehat{B}+\\widehat{C}=180^{\\circ}", reason: "Định lí tổng ba góc trong tam giác", uses: [], geometryActions: [{ action: "highlight", targets: ["ang_BAC", "ang_ABC", "ang_ACB"] }] },
      { id: "s4", title: "Tính góc B", explanation: "Thay $\\widehat{C} = \\widehat{B}$ và $\\widehat{A} = 40^{\\circ}$.", math: `\\begin{gathered}2\\widehat{B} + 40^{\\circ} = 180^{\\circ} \\\\ 2\\widehat{B} = 140^{\\circ} \\\\ \\widehat{B} = ${answer}^{\\circ}\\end{gathered}`, reason: null, uses: [], geometryActions: [{ action: "highlight", targets: ["ang_ABC"] }] },
    ],
    finalAnswer: { text: `$\\widehat{B} = ${answer}^{\\circ}$`, math: null },
    figure: {
      scale: "exact",
      points: [
        point("A", "free", { x: 0, y: 5, draggable: true }),
        point("B", "polar", { refs: ["A"], value: 250, value2: 6 }),
        point("C", "polar", { refs: ["A"], value: 290, value2: 6 }),
      ],
      lines: [
        { id: "seg_AB", kind: "segment", from: "A", to: "B", style: "given", label: null },
        { id: "seg_AC", kind: "segment", from: "A", to: "C", style: "given", label: null },
        { id: "seg_BC", kind: "segment", from: "B", to: "C", style: "given", label: null },
      ],
      circles: [],
      angles: [
        { id: "ang_BAC", from: "B", vertex: "A", to: "C", label: "40°", right: false, style: "given" },
        { id: "ang_ABC", from: "A", vertex: "B", to: "C", label: "?", right: false, style: "given" },
        { id: "ang_ACB", from: "A", vertex: "C", to: "B", label: null, right: false, style: "given" },
      ],
      marks: [{ kind: "equal", targets: ["seg_AB", "seg_AC"], group: 1 }],
      checks: [
        { kind: "equal_length", refs: ["A", "B", "A", "C"], value: null, role: "given" },
        { kind: "angle_value", refs: ["B", "A", "C"], value: 40, role: "given" },
        { kind: "angle_value", refs: ["A", "B", "C"], value: answer, role: "derived" },
      ],
    },
    answerChecks: [{ kind: "value", statements: ["(180 - 40) / 2"], assignments: [], expected: String(answer) }],
  };
}

export function mockAlgebraLesson(roots: [string, string] = ["2", "3"]): ModelLesson {
  return {
    analysis: base({
      statement: "Giải phương trình $x^{2} - 5x + 6 = 0$.",
      subtopic: "Phương trình bậc hai",
      concepts: ["Phương trình bậc hai", "Biệt thức $\\Delta$"],
      techniques: [],
      givens: ["$x^{2} - 5x + 6 = 0$"],
      unknowns: ["$x$"],
    }),
    strategy: "Tính biệt thức $\\Delta$ rồi dùng công thức nghiệm.",
    hints: [
      { id: "h1", level: 1, question: "Đây là phương trình dạng gì? Hãy xác định $a$, $b$, $c$.", cue: null, explanation: "Phương trình bậc hai với $a = 1$, $b = -5$, $c = 6$.", math: null, stepId: "s1", focus: [] },
      { id: "h2", level: 3, question: "Biệt thức $\\Delta$ bằng bao nhiêu?", cue: "$\\Delta = b^{2} - 4ac$", explanation: "$\\Delta = 25 - 24 = 1 > 0$ nên phương trình có hai nghiệm phân biệt.", math: "\\Delta = (-5)^{2} - 4\\cdot 1 \\cdot 6 = 1", stepId: "s2", focus: [] },
      { id: "h3", level: 4, question: "Áp dụng công thức nghiệm, hai nghiệm là gì?", cue: null, explanation: "Dùng $x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}$.", math: null, stepId: "s3", focus: [] },
    ],
    steps: [
      { id: "s1", title: "Xác định hệ số", explanation: "Phương trình có dạng $ax^{2} + bx + c = 0$.", math: "a = 1,\\ b = -5,\\ c = 6", reason: null, uses: [], geometryActions: [] },
      { id: "s2", title: "Tính $\\Delta$", explanation: "Tính biệt thức.", math: "\\Delta = b^{2} - 4ac = 25 - 24 = 1", reason: "Công thức nghiệm của phương trình bậc hai", uses: [], geometryActions: [] },
      { id: "s3", title: "Tìm nghiệm", explanation: "Vì $\\Delta > 0$, phương trình có hai nghiệm phân biệt.", math: `x_{1} = \\frac{5 + 1}{2} = ${roots[1]},\\quad x_{2} = \\frac{5 - 1}{2} = ${roots[0]}`, reason: null, uses: [], geometryActions: [] },
    ],
    finalAnswer: { text: `Phương trình có hai nghiệm $x = ${roots[0]}$ và $x = ${roots[1]}$.`, math: `S = \\{${roots[0]};\\ ${roots[1]}\\}` },
    figure: null,
    answerChecks: [
      { kind: "substitute", statements: ["x^2 - 5x + 6 = 0"], assignments: [[{ variable: "x", value: roots[0] }], [{ variable: "x", value: roots[1] }]], expected: null },
    ],
  };
}

export class MockJsonModel implements JsonModel {
  readonly name = "mock";
  readonly model = "mock-solver";
  private calls = 0;

  constructor(
    private readonly scenario: MockSolveScenario | null,
    private readonly problemText: string,
  ) {}

  async complete({ signal }: Parameters<JsonModel["complete"]>[0]): Promise<string> {
    this.calls += 1;
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, this.scenario === "solve_slow" ? 12_000 : 1200);
      signal.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(new DOMException("aborted", "AbortError"));
      });
    });
    const geometry = /tam giác|triangle|góc|angle/i.test(this.problemText);
    switch (this.scenario) {
      case "solve_provider_error":
        throw new OcrFailure("provider_error", "mock provider error", true);
      case "solve_malformed":
        return "Sure! The answer is x = 2.";
      case "solve_fix_on_retry":
        return JSON.stringify(this.calls === 1 ? (geometry ? mockGeometryLesson(60) : mockAlgebraLesson(["1", "6"])) : geometry ? mockGeometryLesson() : mockAlgebraLesson());
      case "solve_unverified":
        return JSON.stringify(geometry ? mockGeometryLesson(60) : mockAlgebraLesson(["1", "6"]));
      default:
        return JSON.stringify(geometry ? mockGeometryLesson() : mockAlgebraLesson());
    }
  }
}
