import { afterEach, describe, expect, it, vi } from "vitest";
import { gradeLevelFeedback, gradeLevelReport, isSimpleProblem } from "../../shared/src/gradeLevel";
import { previewPartialLesson } from "../../shared/src/progressPreview";
import type { SolveProgress } from "../../shared/src/solution";
import type { ModelLesson } from "../../shared/src/solution";
import { isProofOnly, isTrivialCheck, normalizeCheck, normalizeFigureChecks, restatesAnswer, runAnswerCheck, verifyLesson } from "../../shared/src/verify";
import { cleanLanguage } from "../../shared/src/language";
import { derivationSlips } from "../../shared/src/derivations";
import { repairLatex, textifyProse } from "../../shared/src/mathText";
import { latexFeedback, plainUnrenderable } from "../src/solver/latexCheck";
import { OcrFailure } from "../src/ocr/provider";
import { LocalJsonModel } from "../src/solver/localModel";
import { parseLesson, solveProblem, tidy } from "../src/solver/pipeline";
import { VN_GRADE_9 } from "../src/solver/curriculum";
import { buildSystemPrompt } from "../src/solver/prompts";
import { problemTier } from "../src/solver/routing";
import { FailoverJsonModel } from "../src/solver/failover";
import { SolutionSchema } from "../../shared/src/solution";
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
      techniques: [],
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
      { id: "s1", title: "Rút gọn", explanation: "Gộp các hạng tử đồng dạng.", math: "3x - 6 \\le -2x + 4", reason: "Quy tắc nhân phá ngoặc", uses: [], geometryActions: [] },
      { id: "s2", title: "Chuyển vế", explanation: "Chuyển $-2x$ sang vế trái, $-6$ sang vế phải.", math: "5x \\le 10", reason: "Quy tắc chuyển vế", uses: [], geometryActions: [] },
      { id: "s3", title: "Chia cho 5", explanation: "Vì $5 > 0$ nên giữ nguyên chiều bất đẳng thức.", math: "x \\le 2", reason: "Quy tắc nhân với số dương", uses: [], geometryActions: [] },
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

  it("treats advanced chuyên tools (Ceva, Chebyshev) as advisory, never as a retry", () => {
    const l = withStep("Theo định lý Ceva và bất đẳng thức Chebyshev, ...");
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

describe("entrance-exam curriculum (13 review topics)", () => {
  const unsupported = (statement: string) => {
    const l = inequalityLesson({ steps: [], hints: [], finalAnswer: { text: "", math: null }, answerChecks: [] });
    l.analysis = { ...l.analysis, statement, status: "unsupported", withinCurriculum: false, statusReason: "Cần kiến thức ngoài chương trình." };
    return verifyLesson(l).feedback.join(" ");
  };

  it("sends an in-curriculum problem marked unsupported back to be solved", () => {
    expect(unsupported("Tìm giá trị nhỏ nhất của $P = a + b$ biết $a, b > 0$ và $ab = 4$.")).toMatch(/within the Vietnamese Grade 9/);
    expect(unsupported("Một hình nón có bán kính đáy 3 cm và chiều cao 4 cm. Tính thể tích.")).toMatch(/within the Vietnamese Grade 9/);
  });

  it("accepts unsupported for a problem that itself needs calculus", () => {
    expect(unsupported("Tính tích phân $\\int_0^1 x^2 dx$.")).not.toMatch(/within the Vietnamese Grade 9/);
  });

  it("treats Cô-si and Bunhiacopxki as entrance-exam methods, Jensen as outside the knowledge base", () => {
    expect(gradeLevelReport(withStep("Theo bất đẳng thức Bunhiacopxki, $(a+b)^2 \\le 2(a^2+b^2)$.")).rubric.familiarMethods).toBe(true);
    expect(gradeLevelReport(withStep("Áp dụng bất đẳng thức Cô-si cho ba số dương.")).rubric.familiarMethods).toBe(true);
    expect(gradeLevelReport(withStep("Áp dụng bất đẳng thức Jensen cho hàm lồi.")).rubric.familiarMethods).toBe(false);
    expect(gradeLevelFeedback(withStep("Áp dụng bất đẳng thức Jensen cho hàm lồi.")).join(" ")).toMatch(/Jensen/);
  });

  it("allows induction (D4) without a note", () => {
    expect(gradeLevelReport(withStep("Chứng minh bằng quy nạp theo n.")).advisory).toEqual([]);
  });

  it("still checks methods when the model flags its own problem as out of curriculum", () => {
    const l = withStep("Xét đạo hàm của vế trái.");
    l.analysis = { ...l.analysis, withinCurriculum: false };
    expect(gradeLevelFeedback(l).join(" ")).toMatch(/calculus/);
  });

  it("lists every review topic in the prompt", () => {
    const prompt = buildSystemPrompt(VN_GRADE_9, { withFigure: false });
    for (const topic of [/Vi-ét/, /y = ax²/, /hệ thức lượng/, /Statistics/, /Probability/, /cylinder/, /Cô-si/, /real-life optimisation/, /non-symmetric/]) expect(prompt).toMatch(topic);
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

describe("answer checks the model already substituted", () => {
  const quadratic = (statements: string[], assignments: { variable: string; value: string }[][] = []) => {
    const l = inequalityLesson();
    l.analysis = { ...l.analysis, statement: "Giải phương trình $x^2 - 5x + 6 = 0$." };
    l.finalAnswer = { text: "$x_1 = 2$, $x_2 = 3$", math: "x_1 = 2, x_2 = 3" };
    l.answerChecks = [{ kind: "substitute", statements, assignments, expected: null }];
    return verifyLesson(l);
  };

  it("accepts numeric relations that do the arithmetic (2^2 - 5*2 + 6 = 0)", () => {
    const r = quadratic(["2^2 - 5*2 + 6 = 0", "3^2 - 5*3 + 6 = 0"]);
    expect(r.feedback.join(" ")).not.toMatch(/only restates/);
    expect(r.verification.status).toBe("verified");
  });

  it("still catches a wrong root written that way", () => {
    expect(quadratic(["2^2 - 5*2 + 6 = 0", "4^2 - 5*4 + 6 = 0"]).verification.status).toBe("unverified");
  });

  it("still rejects a bare restatement", () => {
    expect(quadratic(["2 = 2"]).feedback.join(" ")).toMatch(/only restates/);
  });
});

describe("answer checks that only restate the answer (EXP-008 Câu 2: wrong 10√2 shown as verified)", () => {
  const lessonFor = (statement: string, answer: string, check: ModelLesson["answerChecks"][number]) => {
    const l = inequalityLesson({ answerChecks: [check], finalAnswer: { text: `Đáp số: $${answer}$`, math: answer } });
    l.analysis = { ...l.analysis, statement };
    return l;
  };
  const quad = "Câu 2 (1,5 điểm). Cho tứ giác $ABCD$ với $AC$ vuông góc $BD$. Biết rằng $AD = 1$, $BC = 7$. Tìm giá trị lớn nhất của chu vi tứ giác $ABCD$.";

  it("rejects a check that rewrites the answer without any given", () => {
    const l = lessonFor(quad, "10\\sqrt{2}", { kind: "value", statements: ["sqrt(2) * 10"], assignments: [], expected: "10*sqrt(2)" });
    expect(restatesAnswer(l.answerChecks[0]!, l)).toBe(true);
    const r = verifyLesson(l);
    expect(r.verification.status).not.toBe("verified");
    expect(r.feedback.join(" ")).toMatch(/only restates the answer/);
  });

  it("accepts the official computation from the givens (√(2·(7² + 1²)) + 7 + 1 = 18)", () => {
    const l = lessonFor(quad, "18", { kind: "value", statements: ["sqrt(2*(7^2+1^2)) + 7 + 1"], assignments: [], expected: "18" });
    expect(restatesAnswer(l.answerChecks[0]!, l)).toBe(false);
  });

  it("accepts a substitution into a derived condition (m = 2 into m² + 4m − 12 = 0)", () => {
    const l = lessonFor("Cho phương trình $x^2 - 2(m+1)x + m^2 + 3 = 0$. Tìm $m$ để $x_1^2 + x_2^2 = 22$.", "m = 2", { kind: "value", statements: ["2^2 + 4*2 - 12"], assignments: [], expected: "0" });
    expect(restatesAnswer(l.answerChecks[0]!, l)).toBe(false);
  });

  it("accepts testing the answer against a given (magic square row sums to 15)", () => {
    const l = lessonFor("Câu 5. Số 15 có phải là số tốt không? Điền 9 số nguyên dương phân biệt vào bảng 3 × 3.", "2, 7, 6, 9, 5, 1, 4, 3, 8", { kind: "value", statements: ["8+1+6"], assignments: [], expected: "15" });
    expect(restatesAnswer(l.answerChecks[0]!, l)).toBe(false);
  });
});

describe("answer checks in a slightly wrong form (OPT-008)", () => {
  const run = (check: ModelLesson["answerChecks"][number]) => verifyLesson(inequalityLesson({ answerChecks: [check] }));

  it("evaluates a computation labelled substitute, with its conditions", () => {
    const ok = run({ kind: "substitute", statements: ["((2*(2+1))^2 - 2*(2^2+3))", "m > 1"], assignments: [[{ variable: "m", value: "2" }]], expected: "22" });
    expect(ok.verification.checks[0]).toMatchObject({ passed: true });
    const wrong = run({ kind: "substitute", statements: ["((2*(2+1))^2 - 2*(2^2+3))"], assignments: [], expected: "23" });
    expect(wrong.verification.status).toBe("unverified");
  });

  it("pairs several values with a comma-separated expected list, keeping decimal commas", () => {
    expect(run({ kind: "value", statements: ["sqrt(6^2 + 8^2)", "48/10"], assignments: [], expected: "10, 4.8" }).verification.checks[0]).toMatchObject({ passed: true });
    expect(run({ kind: "value", statements: ["sqrt(6^2 + 8^2)", "48/10"], assignments: [], expected: "10 4,8" }).verification.checks[0]).toMatchObject({ passed: true });
    expect(run({ kind: "value", statements: ["sqrt(6^2 + 8^2)", "48/10"], assignments: [], expected: "10, 5" }).verification.status).toBe("unverified");
  });
});

// --- adaptive policy ----------------------------------------------------------

describe("lesson size per tier", () => {
  it("asks for a short lesson for a simple problem and per-part checks for a complex one", async () => {
    const seen: string[] = [];
    const model: JsonModel = { name: "local", model: "spy", async complete({ messages }) { seen.push(messages.at(-1)!.content); return JSON.stringify(inequalityLesson()); } };
    await solveProblem(model, VN_GRADE_9, "Giải bất phương trình $3(x - 2) \\le 5x + 4 - 7x$.", { signal: new AbortController().signal });
    expect(seen[0]).toMatch(/2–4 steps/);
    await solveProblem(model, VN_GRADE_9, "Cho tam giác ABC nhọn nội tiếp (O). a) Chứng minh BCEF nội tiếp. b) Chứng minh OA ⊥ EF.", { signal: new AbortController().signal }).catch(() => undefined);
    expect(seen[1]).toMatch(/one answer check per part/);
  });
});

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

describe("a figure emptied by repairs", () => {
  it("is removed so the lesson stays valid for the app", async () => {
    const l = inequalityLesson();
    l.analysis = { ...l.analysis, topic: "geometry" };
    l.figure = { scale: "schematic", points: [], lines: [], circles: [], angles: [], marks: [], checks: [] } as unknown as ModelLesson["figure"];
    const r = verifyLesson(l);
    expect(r.lesson.figure).toBeNull();
    const { ModelLessonSchema } = await import("../../shared/src/solution");
    expect(ModelLessonSchema.safeParse(r.lesson).success).toBe(true);
  });
});

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

  it("attaches a hint that points past the last step to the last step (5 hints, 4 steps)", () => {
    const l = inequalityLesson();
    l.hints.push({ ...l.hints[1]!, id: "h3", stepId: "s4" });
    const result = verifyLesson(l);
    expect(result.lesson.hints.at(-1)!.stepId).toBe("s3");
    expect(result.feedback.join(" ")).not.toMatch(/unknown step/);
    expect(result.verification.status).toBe("verified");
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

// --- streaming and live progress ------------------------------------------------

function sse(events: string[]): Response {
  const body = events.map((e) => `${e}\n\n`).join("");
  return new Response(new ReadableStream({ start(c) { for (let i = 0; i < body.length; i += 37) c.enqueue(new TextEncoder().encode(body.slice(i, i + 37))); c.close(); } }));
}
const chunk = (delta: Record<string, string>, finish: string | null = null) => `data: ${JSON.stringify({ choices: [{ delta, finish_reason: finish }] })}`;

describe("streaming hosted responses", () => {
  it("assembles the same result as a non-streamed call and reports progress", async () => {
    const sent: Record<string, unknown>[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_u: string, init: { body: string }) => {
      sent.push(JSON.parse(init.body));
      return sse([
        ": OPENROUTER PROCESSING",
        chunk({ reasoning: "Let me think." }),
        chunk({ content: '{"analysis":{"subtopic":"bất phương trình",' }),
        chunk({ content: '"x":1}}' }, "stop"),
        `data: ${JSON.stringify({ choices: [], usage: { prompt_tokens: 5, completion_tokens: 9, completion_tokens_details: { reasoning_tokens: 4 } } })}`,
        "data: [DONE]",
      ]);
    }));
    const deltas: [string, number][] = [];
    let usage: { output: number; reasoning: number } | null = null;
    const text = await hosted("low").complete({
      messages: [{ role: "user", content: "x" }],
      schema: {},
      schemaName: "lesson",
      signal: new AbortController().signal,
      onDelta: (c, r) => deltas.push([c, r]),
      onUsage: (u) => (usage = u),
    });
    expect(text).toBe('{"analysis":{"subtopic":"bất phương trình","x":1}}');
    expect(sent[0]!.stream).toBe(true);
    expect(deltas.at(-1)![0]).toBe(text);
    expect(deltas[0]![1]).toBeGreaterThan(0);
    expect(usage).toMatchObject({ output: 9, reasoning: 4 });
  });

  it("detects truncation in a stream and steps the reasoning down", async () => {
    const efforts: string[] = [];
    const replies = [sse([chunk({ content: '{"a":' }, "length"), "data: [DONE]"]), sse([chunk({ content: '{"a":1}' }, "stop"), "data: [DONE]"])];
    vi.stubGlobal("fetch", vi.fn(async (_u: string, init: { body: string }) => {
      efforts.push(JSON.parse(init.body).reasoning.effort);
      return replies.shift()!;
    }));
    const text = await hosted("low").complete({ messages: [], schema: {}, schemaName: "lesson", signal: new AbortController().signal, onDelta: () => undefined });
    expect(text).toBe('{"a":1}');
    expect(efforts).toEqual(["low", "minimal"]);
  });
});

describe("partial lesson preview", () => {
  it("hides an English or undiacritized problem type for a Vietnamese problem", () => {
    expect(previewPartialLesson('{"analysis":{"subtopic":"quadratic_equations",', { vietnamese: true }).problemKind).toBeNull();
    expect(previewPartialLesson('{"analysis":{"subtopic":"phương trình bậc hai",', { vietnamese: true }).problemKind).toBe("phương trình bậc hai");
  });

  it("shows only complete fields", () => {
    expect(previewPartialLesson('{"analysis":{"subtopic":"bất phương trình bậc nh')).toEqual({ problemKind: null, strategy: null, stepsWritten: 0 });
    const partial = '{"analysis":{"subtopic":"bất phương trình"},"strategy":"Rút gọn \\"hai\\" vế.","hints":[],"steps":[{"id":"s1","geometryActions":[]},{"id":"s2","geometryActions":[{"action":"highlight","targets":["A"]}]},{"id":"s3","title":"Chia';
    expect(previewPartialLesson(partial)).toEqual({ problemKind: "bất phương trình", strategy: 'Rút gọn "hai" vế.', stepsWritten: 2 });
  });
});

describe("pipeline progress", () => {
  it("reports thinking → writing → checking, with the draft plan", async () => {
    const lesson = JSON.stringify(inequalityLesson());
    const model: JsonModel = {
      name: "local",
      model: "streaming",
      async complete({ onDelta }) {
        onDelta?.("", 100);
        onDelta?.(lesson.slice(0, lesson.indexOf('"hints"')), 100);
        onDelta?.(lesson, 100);
        return lesson;
      },
    };
    const seen: SolveProgress[] = [];
    await solveProblem(model, VN_GRADE_9, "Giải bất phương trình $3(x - 2) \\le 5x + 4 - 7x$.", { signal: new AbortController().signal, onProgress: (p) => seen.push(p) });
    expect(seen.map((p) => p.stage)).toEqual(["thinking", "thinking", "writing", "writing", "checking"]);
    expect(seen[2]).toMatchObject({ problemKind: "bất phương trình bậc nhất một ẩn", strategy: expect.stringMatching(/^Rút gọn/) });
    expect(seen.at(-1)!.stepsWritten).toBe(3);
  });
});

// --- reliability: unavailable models, ambiguous input, OCR slips, compatibility -----

describe("failover and unavailable models", () => {
  const ok = (name: string, text = "{}"): JsonModel & { calls: number } => ({
    name: "local",
    model: name,
    calls: 0,
    async complete() {
      this.calls++;
      return text;
    },
  });
  const failing = (err: Error): JsonModel & { calls: number } => ({
    name: "local",
    model: "hosted",
    calls: 0,
    async complete() {
      this.calls++;
      throw err;
    },
  });
  const req = () => ({ messages: [], schema: {}, schemaName: "lesson", signal: new AbortController().signal });

  it("switches to the failover model when the daily quota is exhausted, and stays there", async () => {
    const primary = failing(new OcrFailure("quota_exhausted", "quota", false));
    const secondary = ok("local-qwen");
    const m = new FailoverJsonModel(primary, secondary);
    await m.complete(req());
    await m.complete(req());
    expect(primary.calls).toBe(1);
    expect(secondary.calls).toBe(2);
    expect(m.model).toBe("local-qwen");
  });

  it("does not switch for a timeout or truncated output (the pipeline handles those)", async () => {
    const m = new FailoverJsonModel(failing(new OcrFailure("timeout", "slow", true)), ok("local-qwen"));
    await expect(m.complete(req())).rejects.toThrow(/slow/);
  });

  it("a 503 from the provider is a retryable provider error; the pipeline tries again", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("upstream down", { status: 503 })));
    const err = await call(new LocalJsonModel("http://127.0.0.1:8080", "qwen", {})).catch((e) => e);
    expect((err as OcrFailure).kind).toBe("provider_error");
    expect((err as OcrFailure).retryable).toBe(true);
    const model = scripted([new OcrFailure("provider_error", "503", true), JSON.stringify(inequalityLesson())]);
    const r = await solveProblem(model, VN_GRADE_9, "Giải bất phương trình $3(x - 2) \\le 5x + 4 - 7x$.", { signal: new AbortController().signal });
    expect(model.calls).toBe(2);
    expect(r.verification.status).toBe("verified");
  });
});

describe("input the model must not guess", () => {
  it("keeps an ambiguous problem ambiguous when no lesson is written (nothing is invented)", async () => {
    const l = inequalityLesson({ steps: [], hints: [], finalAnswer: { text: "", math: null }, answerChecks: [] });
    l.analysis = { ...l.analysis, status: "ambiguous", statusReason: "Không đọc được hệ số của $x$ ở vế phải." };
    const model = scripted([JSON.stringify(l)]);
    const r = await solveProblem(model, VN_GRADE_9, "Giải bất phương trình 3(x - 2) ≤ 5x + ▒ - 7x.", { signal: new AbortController().signal });
    expect(r.lesson.analysis.status).toBe("ambiguous");
    expect(r.lesson.analysis.statusReason).toMatch(/Không đọc được/);
    expect(r.verification.status).toBe("not_checkable");
  });

  it("an interpreted OCR slip is recorded as a note and the lesson is still verified", () => {
    const l = inequalityLesson();
    l.analysis = { ...l.analysis, interpretationNotes: ['Đọc "5x + 4 - 7x" từ "5x+4-7×" (chữ × là chữ x).'] };
    const r = verifyLesson(l);
    expect(r.lesson.analysis.interpretationNotes).toHaveLength(1);
    expect(r.verification.status).toBe("verified");
  });
});

describe("API compatibility", () => {
  const base = { id: "s", scanId: "c", questionId: "q1", status: "ready", createdAt: "2026-10-01T00:00:00Z", lesson: null, verification: null, error: null, model: "m", promptVersion: "solver-v1.8", attempts: 1 };
  it("accepts a solution from an older server without the progress field", () => {
    expect(SolutionSchema.safeParse(base).success).toBe(true);
  });
  it("accepts live progress on a pending solution", () => {
    const progress = { stage: "writing", attempt: 1, elapsedMs: 12_000, stepsWritten: 2, problemKind: "bất phương trình", strategy: null };
    expect(SolutionSchema.safeParse({ ...base, status: "pending", progress }).success).toBe(true);
  });
});

// --- user test 2026-10-04: LaTeX, false "beyond Grade 9", arithmetic slips ------------

describe("LaTeX repairs (reported: \\[2pt], literal \\n)", () => {
  it("removes a stray row-spacing argument and keeps a valid one", () => {
    expect(repairLatex(String.raw`(AB+CD)^2 &\[2pt]\le 100`)).toBe(String.raw`(AB+CD)^2 & \le 100`);
    expect(repairLatex(String.raw`x^2 \\[2pt] y`)).toBe(String.raw`x^2 \\[2pt] y`);
  });

  it("turns a literal \\n into a line break, but keeps \\neq, \\nu, \\notin", () => {
    expect(repairLatex(String.raw`chẵn.\nModulo 9`)).toBe("chẵn.\nModulo 9");
    expect(repairLatex(String.raw`k ≥ 0).\nc) f(n)`)).toBe("k ≥ 0).\nc) f(n)");
    expect(repairLatex(String.raw`a \neq b, \nu, x \notin A`)).toBe(String.raw`a \neq b, \nu, x \notin A`);
  });

  it("wraps prose inside a display formula, leaves variables alone", () => {
    expect(textifyProse("Modulo 4: t(t^2+4) ≡ 0 (mod 4) ⟺ t chẵn.")).toBe(String.raw`\text{ Modulo } 4: t(t^2+4) ≡ 0 \pmod{4} ⟺ t \text{ chẵn. }`);
    expect(textifyProse(String.raw`\overline{abcd} = 1000a + AB \cdot CD`)).toBe(String.raw`\overline{abcd} = 1000a + AB \cdot CD`);
    expect(textifyProse(String.raw`\text{Theo tổng hàng: } a+b+c = n`)).toBe(String.raw`\text{Theo tổng hàng: } a+b+c = n`);
  });

  it("tidy fixes the reported lesson text: no LaTeX wrapped around a line break", () => {
    const l = inequalityLesson({ finalAnswer: { text: String.raw`a) được chứng minh.\n b) Tổng $r+s=-\frac{3}{2}$.`, math: null } });
    expect(tidy(l).finalAnswer.text).toBe("a) được chứng minh.\n b) Tổng $r+s=-\\frac{3}{2}$.");
  });

  it("sends an unrenderable formula back, and shows it as plain text if it stays", () => {
    const l = inequalityLesson();
    l.steps[0] = { ...l.steps[0]!, math: String.raw`\frac{1}{2` };
    expect(latexFeedback(l).join(" ")).toMatch(/doesn't render/);
    const shown = plainUnrenderable(l);
    expect(shown.steps[0]!.math).toBeNull();
    expect(latexFeedback(shown)).toEqual([]);
  });
});

describe("arithmetic slips inside a derivation (reported: magic square, step 8)", () => {
  const magic = () => {
    const l = inequalityLesson();
    l.steps[1] = {
      ...l.steps[1]!,
      math: String.raw`(a+e+i)+(c+e+g)+(d+e+f)+(b+e+h) = 4n\\\Rightarrow (a+c+g+i)+2e+(d+f)+(b+h)+3e = 4n\\\Rightarrow (a+c+g+i)+(b+d+f+h)+5e = 4n`,
    };
    return l;
  };

  it("flags a rewritten side that changed value, and only that line", () => {
    const slips = derivationSlips(magic());
    expect(slips).toHaveLength(1);
    expect(slips[0]!.message).toMatch(/2e\+\(d\+f\)/);
    const v = verifyLesson(magic());
    expect(v.verification.status).toBe("unverified");
    expect(v.verification.steps?.find((s) => s.stepId === "s2")?.status).toBe("failed");
  });

  it("accepts correct rewrites, substitutions, factor picking and divisions", () => {
    const ok = (math: string) => {
      const l = inequalityLesson();
      l.steps[1] = { ...l.steps[1]!, math };
      return derivationSlips(l);
    };
    expect(ok(String.raw`(a+e+i)+(c+e+g)+(d+e+f)+(b+e+h) = 4n\\(a+b+c+d+f+g+h+i)+4e = 4n`)).toEqual([]);
    expect(ok(String.raw`x_1 + x_2 = 5\\\Rightarrow 3 + x_2 = 5`)).toEqual([]);
    expect(ok(String.raw`x^2 - 5x + 6 = 0\\\Rightarrow x - 2 = 0`)).toEqual([]);
    expect(ok(String.raw`2x + 2y = 10\\\Rightarrow x + y = 5`)).toEqual([]);
    expect(ok(String.raw`P = AB+BC+CD+DA\\P = AB+CD+8`)).toEqual([]);
    expect(ok(String.raw`f(n) = (n+4)^4 - n^4\\f(n) = 16(n+2)(n^2+4n+8)`)).toEqual([]);
    expect(ok(String.raw`f(n) = (n+4)^4 - n^4\\f(n) = 16(n+2)(n^2+4n+6)`)).toHaveLength(1);
  });
});

describe("'beyond Grade 9' for a problem within the curriculum (reported: incircle geometry)", () => {
  const unsupported = () =>
    inequalityLesson({
      analysis: { ...inequalityLesson().analysis, status: "unsupported", withinCurriculum: false, statusReason: "Bài toán cần các tính chất nâng cao." },
      hints: [],
      steps: [],
      finalAnswer: { text: "", math: null },
      answerChecks: [],
    });

  it("never stores the give-up: retries, and fails with solve_incomplete if it persists", async () => {
    const model = scripted([JSON.stringify(unsupported()), JSON.stringify(unsupported())]);
    await expect(solveProblem(model, VN_GRADE_9, "Giải bất phương trình $3(x - 2) \\le 5x + 4 - 7x$.", { signal: new AbortController().signal })).rejects.toMatchObject({ kind: "incomplete" });
    expect(model.calls).toBe(2);
  });

  it("uses the real lesson when the retry solves it", async () => {
    const model = scripted([JSON.stringify(unsupported()), JSON.stringify(inequalityLesson())]);
    const r = await solveProblem(model, VN_GRADE_9, "Giải bất phương trình $3(x - 2) \\le 5x + 4 - 7x$.", { signal: new AbortController().signal });
    expect(r.lesson.analysis.status).toBe("solvable");
  });

  it("a truncated attempt followed by a give-up is still not stored", async () => {
    const model = scripted([new OcrFailure("malformed_output", "output truncated", true), JSON.stringify(unsupported())]);
    await expect(solveProblem(model, VN_GRADE_9, "Giải bất phương trình $3(x - 2) \\le 5x + 4 - 7x$.", { signal: new AbortController().signal })).rejects.toMatchObject({ kind: "incomplete" });
  });

  it("keeps a genuine 'unsupported' (the problem asks for a derivative)", async () => {
    const l = unsupported();
    l.analysis = { ...l.analysis, statement: "Tính đạo hàm của $f(x) = x^3$." };
    const r = await solveProblem(scripted([JSON.stringify(l)]), VN_GRADE_9, "Tính đạo hàm của $f(x) = x^3$.", { signal: new AbortController().signal });
    expect(r.lesson.analysis.status).toBe("unsupported");
  });

  it("tells the model that hard is never unsupported", () => {
    expect(buildSystemPrompt(VN_GRADE_9)).toMatch(/long or hard is never a reason for "unsupported"/);
  });
});

describe("schema slips after a long solve (Câu 4 probe, 2026-10-04)", () => {
  it("repairs too many concepts, a bad hint id and an out-of-range hint level instead of discarding the lesson", () => {
    const l = inequalityLesson() as unknown as { analysis: { concepts: string[] }; hints: { id: string; level: number }[] };
    l.analysis.concepts = Array.from({ length: 11 }, (_, i) => `ý ${i + 1}`);
    l.hints[0]!.id = "";
    l.hints[1]!.level = 6;
    const parsed = parseLesson(JSON.stringify(l));
    expect("lesson" in parsed).toBe(true);
    if (!("lesson" in parsed)) return;
    expect(parsed.lesson.analysis.concepts).toHaveLength(8);
    expect(parsed.lesson.hints[1]!.level).toBe(4);
    expect(parsed.lesson.hints[0]!.id).toMatch(/^[A-Za-z0-9_']+$/);
  });
});

describe("hard problems fail fast instead of taking 7 minutes (user report 2026-10-04)", () => {
  it("does not start a second full attempt after a long failed one", async () => {
    const model = scripted([new OcrFailure("malformed_output", "output truncated", true), JSON.stringify(inequalityLesson())]);
    await expect(
      solveProblem(model, VN_GRADE_9, "Giải bất phương trình $3(x - 2) \\le 5x + 4 - 7x$.", { signal: new AbortController().signal, retryBudgetMs: -1 }),
    ).rejects.toMatchObject({ kind: "incomplete" });
    expect(model.calls).toBe(1);
  });

  it("still retries a quick failure", async () => {
    const model = scripted([new OcrFailure("malformed_output", "output truncated", true), JSON.stringify(inequalityLesson())]);
    const r = await solveProblem(model, VN_GRADE_9, "Giải bất phương trình $3(x - 2) \\le 5x + 4 - 7x$.", { signal: new AbortController().signal });
    expect(r.lesson.analysis.status).toBe("solvable");
    expect(model.calls).toBe(2);
  });
});

describe("derivation check: separate cases are not a derivation (PTNK 2025 2b false positive)", () => {
  it("does not compare 'Trường hợp 1: S(a) = …' with 'Trường hợp 2: S(a) = …'", () => {
    const l = inequalityLesson();
    l.steps[1] = { ...l.steps[1]!, math: String.raw`\text{Trường hợp 1: } S(a)=4a^2-2a+5\\\text{Trường hợp 2: } S(a)=4a^2+2a+5` };
    expect(derivationSlips(l)).toEqual([]);
  });
  it("still compares a labelled line with the arrow line that follows it", () => {
    const l = inequalityLesson();
    l.steps[1] = { ...l.steps[1]!, math: String.raw`\text{Cộng ba hàng: } (a+b+c)+(d+e+f)+(g+h+i)=3n\\\Rightarrow (a+c+g+i)+(b+d+f+h)+3e = 3n` };
    expect(derivationSlips(l)).toHaveLength(1);
  });
});

describe("PTNK 2025 review: honesty and language", () => {
  it("a proof-only problem is at most 'partial', even when a value check passes", () => {
    expect(isProofOnly("Cho phương trình $x^2-2(m+1)x+2m=0$. Chứng minh rằng với mọi $m$ phương trình luôn có hai nghiệm phân biệt.")).toBe(true);
    expect(isProofOnly("Chứng minh ... và tìm giá trị nhỏ nhất.")).toBe(false);
    expect(isProofOnly("Tìm cách ghi có tổng bình phương nhỏ nhất.")).toBe(false);
    const l = inequalityLesson();
    l.analysis = { ...l.analysis, statement: "Chứng minh rằng $3(x - 2) \\le 5x + 4 - 7x$ khi $x \\le 2$." };
    expect(verifyLesson(l).verification.status).toBe("partial");
  });

  it("a method outside the curriculum that survives the retries makes the lesson unverified", () => {
    const l = withStep("Với vectơ $(1,1)$ và $(x_1^2,x_2^2)$, ta có …");
    const v = verifyLesson(l);
    expect(v.verification.status).toBe("unverified");
    expect(v.verification.checks.some((c) => !c.passed && /within the curriculum/.test(c.label))).toBe(true);
  });

  it("sends back English words in a Vietnamese lesson and fixes the known ones", () => {
    const l = withStep("Hàm $f$ tăngStrict nên injective, các hạng tử đồng loại corresponding.");
    const r = cleanLanguage(l);
    expect(r.lesson.steps[1]!.explanation).toBe("Hàm $f$ tăng nên injective, các hạng tử đồng dạng tương ứng.");
    expect(r.feedback.join(" ")).toMatch(/"injective"/);
    const cjk = cleanLanguage(withStep("Đưa các項 về vế trái."));
    expect(cjk.lesson.steps[1]!.explanation).not.toMatch(/項/);
  });
});

describe("failure-only fallback (temporary Gemini fallback, 2026-10-06)", () => {
  const text = "Giải bất phương trình $3(x - 2) \\le 5x + 4 - 7x$.";
  const opts = (fallback: JsonModel) => ({ signal: new AbortController().signal, fallback, fallbackOnlyOnFailure: true });

  it("switches to the fallback after a long failed attempt (no fail-fast when another model is available)", async () => {
    const primary = scripted([new OcrFailure("timeout", "local model request timed out", true)]);
    const backup = scripted([JSON.stringify(inequalityLesson())]);
    const r = await solveProblem(primary, VN_GRADE_9, text, { ...opts(backup), retryBudgetMs: -1 });
    expect(r.lesson.analysis.status).toBe("solvable");
    expect([primary.calls, backup.calls]).toEqual([1, 1]);
  });

  it("switches when the daily quota is exhausted", async () => {
    const primary = scripted([new OcrFailure("quota_exhausted", "hosted model daily quota exhausted", false)]);
    const backup = scripted([JSON.stringify(inequalityLesson())]);
    await solveProblem(primary, VN_GRADE_9, text, opts(backup));
    expect(backup.calls).toBe(1);
  });

  it("keeps corrective retries on the primary model", async () => {
    const bad = inequalityLesson({ answerChecks: [{ kind: "inequality", statements: ["3(x - 2) <= 5x + 4 - 7x"], assignments: [], expected: "x <= 3" }] });
    const primary = scripted([JSON.stringify(bad), JSON.stringify(inequalityLesson())]);
    const backup = scripted([JSON.stringify(inequalityLesson())]);
    await solveProblem(primary, VN_GRADE_9, text, opts(backup));
    expect([primary.calls, backup.calls]).toEqual([2, 0]);
  });
});

describe("answer checks in programming style never crash the solve (PTNK 2025 3b, qwen3.6)", () => {
  const check = (pairs: [number, number][]) => ({
    kind: "substitute" as const,
    statements: ["(m^2 + m + n^2) % (m * n) == 0 and m % n == 0"],
    assignments: pairs.map(([m, n]) => [{ variable: "m", value: String(m) }, { variable: "n", value: String(n) }]),
    expected: "true",
  });

  it("evaluates '==' and 'and' instead of throwing", () => {
    expect(runAnswerCheck(normalizeCheck(check([[1, 1], [4, 2]]))).passed).toBe(true);
    expect(runAnswerCheck(normalizeCheck(check([[2, 1]]))).passed).toBe(false);
    expect(isTrivialCheck(normalizeCheck(check([[1, 1]])))).toBe(false);
  });

  it("verifyLesson survives a check it can't read", () => {
    const l = inequalityLesson({ answerChecks: [{ kind: "inequality", statements: ["-1 < x - 2 < 5 < x"], assignments: [], expected: "x <= 2" }] });
    expect(() => verifyLesson(l)).not.toThrow();
  });
});
