import { afterEach, describe, expect, it, vi } from "vitest";
import { gradeLevelFeedback, gradeLevelReport, isSimpleProblem } from "../../shared/src/gradeLevel";
import type { ModelLesson } from "../../shared/src/solution";
import { normalizeFigureChecks, verifyLesson } from "../../shared/src/verify";
import { OcrFailure } from "../src/ocr/provider";
import { LocalJsonModel } from "../src/solver/localModel";
import { solveProblem } from "../src/solver/pipeline";
import { VN_GRADE_9 } from "../src/solver/curriculum";
import { buildSystemPrompt } from "../src/solver/prompts";
import { problemTier } from "../src/solver/routing";
import type { JsonModel } from "../src/solver/llm";

/** A correct, verifiable Grade 9 lesson: 3(x − 2) ≤ 5x + 4 − 7x  ⇔  x ≤ 2. */
function inequalityLesson(overrides: Partial<ModelLesson> = {}): ModelLesson {
  return {
    analysis: {
      statement: "Giải bất phương trình $3(x - 2) \\le 5x + 4 - 7x$.",
      language: "vi",
      topic: "inequality",
      subtopic: "bất phương trình bậc nhất một ẩn",
      gradeLevel: 9,
      withinCurriculum: true,
      concepts: ["chuyển vế đổi dấu"],
      givens: ["$3(x - 2) \\le 5x + 4 - 7x$"],
      unknowns: ["$x$"],
      constraints: [],
      status: "solvable",
      statusReason: null,
      interpretationNotes: [],
    },
    strategy: "Rút gọn hai vế, đưa hạng tử chứa $x$ về một vế rồi chia cho hệ số dương.",
    hints: [
      { id: "h1", level: 1, question: "Bạn rút gọn vế phải được không?", cue: null, explanation: "$5x - 7x = -2x$.", math: null, stepId: "s1", focus: [] },
      { id: "h2", level: 2, question: "Đưa các hạng tử chứa $x$ về vế trái thì được gì?", cue: null, explanation: "$5x \\le 10$.", math: null, stepId: "s2", focus: [] },
    ],
    steps: [
      { id: "s1", title: "Rút gọn", explanation: "Gộp các hạng tử đồng dạng.", math: "3x - 6 \\le -2x + 4", reason: "Quy tắc nhân phá ngoặc", geometryActions: [] },
      { id: "s2", title: "Chuyển vế", explanation: "Chuyển $-2x$ sang vế trái, $-6$ sang vế phải.", math: "5x \\le 10", reason: "Quy tắc chuyển vế", geometryActions: [] },
      { id: "s3", title: "Chia cho 5", explanation: "Vì $5 > 0$ nên giữ nguyên chiều bất đẳng thức.", math: "x \\le 2", reason: "Quy tắc nhân với số dương", geometryActions: [] },
    ],
    finalAnswer: { text: "Nghiệm của bất phương trình là $x \\le 2$.", math: "x \\le 2" },
    figure: null,
    answerChecks: [{ kind: "inequality", statements: ["3(x - 2) <= 5x + 4 - 7x"], assignments: [], expected: "x <= 2" }],
    ...overrides,
  };
}

const withStep = (explanation: string, math: string | null = null): ModelLesson => {
  const l = inequalityLesson();
  l.steps[1] = { ...l.steps[1]!, explanation, math };
  return l;
};

// --- grade-level methodology --------------------------------------------------

describe("grade-level review", () => {
  it("accepts a standard Grade 9 solution", () => {
    const r = gradeLevelReport(inequalityLesson());
    expect(r.forbidden).toEqual([]);
    expect(r.rubric).toEqual({ curriculumFit: true, familiarMethods: true, concise: true, noHandWaving: true, hintsProgressive: true });
  });

  it.each([
    ["calculus", "Xét đạo hàm $f'(x) = 2x - 4$ để tìm giá trị nhỏ nhất."],
    ["vectors", "Dùng tích vô hướng $\\overrightarrow{AB} \\cdot \\overrightarrow{AC} = 0$."],
    ["law of cosines", "Theo định lí côsin, $a^2 = b^2 + c^2 - 2bc\\cos A$."],
    ["matrices", "Viết hệ dưới dạng ma trận rồi tính định thức."],
  ])("flags %s as outside the curriculum", (_, text) => {
    expect(gradeLevelReport(withStep(text)).forbidden.length).toBe(1);
    expect(gradeLevelFeedback(withStep(text)).join(" ")).toMatch(/Grade 9 student has not learned/);
  });

  it("does not flag a method the problem itself names", () => {
    const l = withStep("Áp dụng định lí côsin như đề bài yêu cầu.");
    l.analysis.statement = "Dùng định lí côsin tính cạnh $BC$.";
    expect(gradeLevelReport(l).forbidden).toEqual([]);
  });

  it("does not flag a magic-square grid typeset with \\begin{matrix}", () => {
    expect(gradeLevelReport(withStep("Bảng ma thuật:", "\\begin{matrix} 8 & 1 & 6 \\\\ 3 & 5 & 7 \\end{matrix}")).forbidden).toEqual([]);
  });

  it("flags coordinates in a synthetic geometry problem", () => {
    const l = withStep("Đặt hệ trục tọa độ Oxy với gốc tại O.");
    l.analysis = { ...l.analysis, topic: "geometry", statement: "Cho tứ giác lồi $ABCD$ có $AC \\perp BD$. Tìm giá trị lớn nhất của chu vi." };
    expect(gradeLevelReport(l).forbidden.join()).toMatch(/coordinates/);
  });

  it("treats named olympiad inequalities and congruences as advisory, never as a retry", () => {
    const l = withStep("Theo bất đẳng thức Bunhiacopxki, $(a+b)^2 \\le 2(a^2+b^2)$; và $n \\equiv 1 \\pmod 3$.");
    const r = gradeLevelReport(l);
    expect(r.forbidden).toEqual([]);
    expect(r.rubric.familiarMethods).toBe(false);
    expect(gradeLevelFeedback(l)).toEqual([]);
  });

  it("wants a short solution for a simple problem", () => {
    const l = inequalityLesson();
    l.steps = Array.from({ length: 9 }, (_, i) => ({ ...l.steps[0]!, id: `s${i + 1}` }));
    l.hints = l.hints.map((h) => ({ ...h, stepId: "s1" }));
    expect(gradeLevelReport(l).rubric.concise).toBe(false);
  });

  it("keeps a multi-step proof's steps (not a simple problem)", () => {
    expect(isSimpleProblem("Cho tam giác ABC cân tại A. a) Chứng minh ... b) Chứng minh ...", "geometry")).toBe(false);
  });

  it("flags hand-waving and a first hint that gives the answer away", () => {
    const l = withStep("Dễ thấy $5x \\le 10$.");
    l.hints[0] = { ...l.hints[0]!, question: "Bạn có thấy $x \\le 2$ không?" };
    const r = gradeLevelReport(l);
    expect(r.rubric.noHandWaving).toBe(false);
    expect(r.rubric.hintsProgressive).toBe(false);
  });

  it("verifyLesson asks for a Grade 9 method when the solution uses calculus", () => {
    const result = verifyLesson(withStep("Xét đạo hàm của vế trái."));
    expect(result.feedback.join(" ")).toMatch(/calculus/);
  });
});

describe("method-selection policy in the prompt", () => {
  it("names the expected method per kind of problem and forbids advanced alternatives", () => {
    const prompt = buildSystemPrompt(VN_GRADE_9, { withFigure: false });
    expect(prompt).toMatch(/Method selection/);
    expect(prompt).toMatch(/complete the square/);
    expect(prompt).toMatch(/Never mention an advanced alternative/);
  });
});

// --- adaptive policy ----------------------------------------------------------

describe("problemTier", () => {
  it.each([
    ["Giải phương trình $x^2 - 5x + 6 = 0$.", "simple"],
    ["Rút gọn biểu thức $A = \\frac{x - 1}{\\sqrt{x} - 1}$ với $x \\ge 0, x \\ne 1$.", "simple"],
    ["Một ô tô đi từ A đến B với vận tốc 40 km/h, lúc về đi với vận tốc 50 km/h nên thời gian về ít hơn thời gian đi 30 phút. Tính quãng đường AB. Biết rằng ô tô đi đều trên cả quãng đường đi và về và không nghỉ giữa đường.", "standard"],
    ["Cho tam giác ABC vuông tại A, AB = 6, AC = 8. Tính BC.", "standard"],
    ["Cho tam giác ABC nhọn nội tiếp đường tròn (O). Chứng minh tứ giác BCEF nội tiếp.", "complex"],
    ["Cho phương trình $x^2 - 2mx + m - 2 = 0$. a) Chứng minh phương trình luôn có hai nghiệm phân biệt. b) Tìm m để $x_1^2 + x_2^2 = 6$.", "complex"],
  ])("%s → %s", (text, tier) => {
    expect(problemTier(text)).toBe(tier);
  });

  it("does not call a problem complex only because it is long", () => {
    expect(problemTier(`Giải phương trình $2x + 3 = 7$. ${"Lưu ý: trình bày rõ ràng. ".repeat(20)}`)).toBe("standard");
  });
});

// --- verifier repairs that avoid retries --------------------------------------

describe("figure check normalisation", () => {
  it("turns a two-point equal_length with a value into length_value", () => {
    const { checks, dropped } = normalizeFigureChecks([{ kind: "equal_length", refs: ["B", "C"], value: 7, role: "given" }]);
    expect(checks).toEqual([{ kind: "length_value", refs: ["B", "C"], value: 7, role: "given" }]);
    expect(dropped).toEqual([]);
  });

  it("sets aside a check it can't interpret, as minor feedback (never a false claim)", () => {
    const { checks, dropped } = normalizeFigureChecks([{ kind: "perpendicular", refs: ["A", "C"], value: null, role: "derived" }]);
    expect(checks).toEqual([]);
    expect(dropped[0]).toMatch(/left out of the figure/);
  });

  it("renumbers duplicate hint ids instead of rejecting the lesson", () => {
    const l = inequalityLesson();
    l.hints = l.hints.map((h) => ({ ...h, id: "question" }));
    const result = verifyLesson(l);
    expect(result.lesson.hints.map((h) => h.id)).toEqual(["h1", "h2"]);
    expect(result.feedback.join(" ")).not.toMatch(/duplicate hint id/);
    expect(result.verification.status).toBe("verified");
  });
});

// --- hosted model client: truncation, empty output, quota, timeouts -----------

type FakeReply = { status?: number; body: unknown };
function fakeFetch(replies: FakeReply[]) {
  const sent: Record<string, unknown>[] = [];
  const fn = vi.fn(async (_url: string, init: { body: string }) => {
    sent.push(JSON.parse(init.body));
    const r = replies.shift();
    if (!r) throw new Error("no more replies");
    return new Response(typeof r.body === "string" ? r.body : JSON.stringify(r.body), { status: r.status ?? 200 });
  });
  vi.stubGlobal("fetch", fn);
  return { fn, sent };
}
const reply = (content: string | null, finish = "stop"): FakeReply => ({
  body: { choices: [{ finish_reason: finish, message: { content } }], usage: { prompt_tokens: 10, completion_tokens: 20 } },
});
const call = (model: LocalJsonModel) =>
  model.complete({ messages: [{ role: "user", content: "x" }], schema: {}, schemaName: "lesson", signal: new AbortController().signal });
const hosted = (effort?: "low" | "minimal") => new LocalJsonModel("https://openrouter.ai/api", "nvidia/nemotron", { apiKey: "k", reasoningEffort: effort });

afterEach(() => vi.unstubAllGlobals());

describe("hosted model client", () => {
  it("retries a truncated answer once with one step less reasoning", async () => {
    const { sent } = fakeFetch([reply(null, "length"), reply('{"ok":1}')]);
    await expect(call(hosted("low"))).resolves.toBe('{"ok":1}');
    expect(sent.map((b) => (b.reasoning as { effort: string }).effort)).toEqual(["low", "minimal"]);
  });

  it("steps down from minimal to none, and gives up after one retry", async () => {
    const { sent } = fakeFetch([reply(""), reply("", "length")]);
    await expect(call(hosted("minimal"))).rejects.toThrow(/truncated/);
    expect(sent.map((b) => (b.reasoning as { effort: string }).effort)).toEqual(["minimal", "none"]);
  });

  it("fails fast on an exhausted daily quota (no back-off retries)", async () => {
    const { fn } = fakeFetch([{ status: 429, body: { error: { message: "Rate limit exceeded: free-models-per-day" } } }]);
    const err = await call(hosted()).catch((e) => e);
    expect(err).toBeInstanceOf(OcrFailure);
    expect((err as OcrFailure).kind).toBe("quota_exhausted");
    expect((err as OcrFailure).retryable).toBe(false);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("does not send hosted-only parameters to a local llama.cpp server", async () => {
    const { sent } = fakeFetch([reply('{"ok":1}')]);
    await call(new LocalJsonModel("http://127.0.0.1:8080", "qwen", {}));
    expect(sent[0]!.reasoning).toBeUndefined();
    expect(sent[0]!.chat_template_kwargs).toEqual({ enable_thinking: false });
  });

  it("reports a network timeout as a retryable timeout", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new DOMException("timed out", "TimeoutError"))));
    const err = await call(hosted()).catch((e) => e);
    expect((err as OcrFailure).kind).toBe("timeout");
  });
});

// --- pipeline: bounded, justified retries ---------------------------------------

function scripted(outputs: (string | Error)[]): JsonModel & { calls: number } {
  return {
    name: "local",
    model: "scripted",
    grammarConstrained: false,
    calls: 0,
    async complete() {
      const next = outputs[this.calls++];
      if (next instanceof Error) throw next;
      return next ?? "";
    },
  };
}

describe("pipeline retries", () => {
  it("does not retry when the daily quota is exhausted", async () => {
    const model = scripted([new OcrFailure("quota_exhausted", "quota", false)]);
    await expect(solveProblem(model, VN_GRADE_9, "Giải bất phương trình $3(x - 2) \\le 5x + 4 - 7x$.", { signal: new AbortController().signal })).rejects.toThrow(/quota/);
    expect(model.calls).toBe(1);
  });

  it("retries a lesson that uses calculus, and keeps the Grade 9 one", async () => {
    const calculus = withStep("Xét đạo hàm của vế trái.");
    const model = scripted([JSON.stringify(calculus), JSON.stringify(inequalityLesson())]);
    const r = await solveProblem(model, VN_GRADE_9, "Giải bất phương trình $3(x - 2) \\le 5x + 4 - 7x$.", { signal: new AbortController().signal });
    expect(model.calls).toBe(2);
    expect(gradeLevelReport(r.lesson).forbidden).toEqual([]);
  });

  it("after the time budget, retries only for a wrong lesson, not for presentation feedback", async () => {
    const chinese = inequalityLesson();
    chinese.hints[1] = { ...chinese.hints[1]!, question: "我们可以看到 điều gì?" };
    const model = scripted([JSON.stringify(chinese), JSON.stringify(inequalityLesson())]);
    const r = await solveProblem(model, VN_GRADE_9, "Giải bất phương trình $3(x - 2) \\le 5x + 4 - 7x$.", { signal: new AbortController().signal, retryBudgetMs: -1 });
    expect(model.calls).toBe(1);
    expect(r.verification.status).toBe("verified");

    const wrong = inequalityLesson({ answerChecks: [{ kind: "inequality", statements: ["3(x - 2) <= 5x + 4 - 7x"], assignments: [], expected: "x <= 3" }] });
    const model2 = scripted([JSON.stringify(wrong), JSON.stringify(inequalityLesson())]);
    await solveProblem(model2, VN_GRADE_9, "Giải bất phương trình $3(x - 2) \\le 5x + 4 - 7x$.", { signal: new AbortController().signal, retryBudgetMs: -1 });
    expect(model2.calls).toBe(2);
  });

  it("survives invalid JSON on the first attempt", async () => {
    const model = scripted(["{not json", JSON.stringify(inequalityLesson())]);
    const r = await solveProblem(model, VN_GRADE_9, "Giải bất phương trình $3(x - 2) \\le 5x + 4 - 7x$.", { signal: new AbortController().signal });
    expect(r.verification.status).toBe("verified");
  });
});
