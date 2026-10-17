import { figureFromStatement } from "../../../shared/src/figureFromText";
import { cleanLanguage } from "../../../shared/src/language";
import { proofDependencyFeedback } from "../../../shared/src/proofDependencies";
import { type Figure, type ModelLesson } from "../../../shared/src/solution";
import { deadEndFeedback, hintFeedback, intersectionNotationFeedback, stepClaimFeedback } from "../../../shared/src/stepClaims";
import { verifyLesson } from "../../../shared/src/verify";
import { simplificationFeedback } from "../../../shared/src/simplification";
import { OcrFailure } from "../ocr/provider";
import { fixJsonLatexEscapes } from "./jsonLatex";
import { latexFeedback } from "./latexCheck";
import type { JsonModel } from "./llm";
import { parseLesson, tidy } from "./pipeline";
import { GeometryBoard, PROBLEM_TYPES, runTypeTool, toolsFor, type ProblemType } from "./agentTools";
import { looksLikeGeometry } from "./routing";
import { problemDomains } from "../../../shared/src/knowledgeBase";
import { dropForeignMetadata } from "./languageRepair";
import type { Usage } from "./pricing";

/**
 * The solver as an agent on SOCLAAS (2026-10-16): instead of writing a whole lesson in one request and being told what
 * was wrong afterwards, the model works with tools —
 *   compute       exact arithmetic, remainders of huge powers, identity checks;
 *   draw_figure   builds the figure (from the statement, or from a construction it gives) and measures claims on it;
 *   write_lesson  hands in a draft and gets every check back at once (maths, self-talk, curriculum, notation, hints);
 *   revise        patches single steps / hints / the final answer without rewriting the lesson;
 *   finish        hands the draft to the pipeline, which runs the full checks again before anything is served.
 * It implements JsonModel, so the pipeline (certified modules first, safety net, retries) is unchanged. The whole solve
 * has a hard wall-clock limit (the deadline passed in, 120 s by default).
 */
type Msg =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };
interface ToolCall { id: string; type: "function"; function: { name: string; arguments: string } }

const TYPE_NAME: Record<ProblemType, string> = { algebra: "Đại số", geometry: "Hình học", number_theory: "Số học", combinatorics: "Tổ hợp" };
const agentRules = (type: ProblemType) => `Bài này thuộc dạng ${TYPE_NAME[type]}. Bạn làm việc như một tác tử có công cụ (tools) của dạng này.
Quy trình:
1. Dùng công cụ của dạng ${TYPE_NAME[type]} để tính, kiểm tra${type === "geometry" ? ", và dựng hình: gọi figure_from_statement trước, rồi thêm điểm/đoạn/đa giác/đường tròn cần cho lời giải (add_point, add_line, add_polygon, add_circle) và đo các tính chất quan trọng bằng check_property trước khi đưa vào chứng minh" : ""}. Không tự nhẩm những gì công cụ tính được.
2. Gọi write_lesson với toàn bộ bài giảng (đúng schema). Công cụ trả về danh sách lỗi.
3. Sửa lỗi bằng revise (chỉ các trường cần sửa) — chỉ viết lại cả bài khi lời giải sai từ gốc.
4. Khi không còn lỗi (hoặc gần hết thời gian), gọi finish.
Thời gian có hạn (khoảng 2 phút cho cả bài): đi thẳng vào lời giải, ít lượt gọi công cụ.`;


function lessonTools(lessonSchema: Record<string, unknown>) {
  return [
    { type: "function", function: { name: "write_lesson", description: "Nộp bản nháp bài giảng đầy đủ; trả về mọi lỗi tìm được.", parameters: { type: "object", properties: { lesson: lessonSchema }, required: ["lesson"], additionalProperties: false } } },
    { type: "function", function: { name: "revise", description: "Sửa từng trường của bản nháp hiện tại; trả về lỗi còn lại.", parameters: { type: "object", properties: { edits: { type: "array", items: { type: "object", properties: { target: { type: "string", enum: ["step", "hint", "final", "strategy"] }, index: { type: "integer" }, field: { type: "string", enum: ["title", "explanation", "math", "reason", "question", "cue", "text"] }, value: { type: ["string", "null"] } }, required: ["target", "index", "field", "value"], additionalProperties: false } } }, required: ["edits"], additionalProperties: false } } },
    { type: "function", function: { name: "finish", description: "Hoàn tất: dùng bản nháp hiện tại làm bài giảng.", parameters: { type: "object", properties: {}, additionalProperties: false } } },
  ];
}

/** Every check the pipeline would run, at once, on a draft (the pipeline re-runs them on the final lesson). */
/** Optional arrays a model often leaves out: filled with their empty value instead of rejecting the draft. */
function withDefaults(json: unknown): unknown {
  if (!json || typeof json !== "object") return json;
  const l = json as Record<string, unknown>;
  const a = (l.analysis ?? {}) as Record<string, unknown>;
  for (const k of ["concepts", "techniques", "givens", "unknowns", "constraints", "interpretationNotes"]) a[k] ??= [];
  a.statusReason ??= null;
  if (l.analysis) l.analysis = a;
  l.answerChecks ??= [];
  // "assignments": a list of lists of {variable, value}; a single object or a flat list is wrapped.
  if (Array.isArray(l.answerChecks)) for (const c of l.answerChecks as Record<string, unknown>[]) {
    if (!Array.isArray(c.assignments)) c.assignments = c.assignments ? [[c.assignments]] : [];
    else c.assignments = (c.assignments as unknown[]).map((x) => (Array.isArray(x) ? x : [x]));
  }
  l.figure ??= null;
  if (Array.isArray(l.steps)) for (const st of l.steps as Record<string, unknown>[]) { st.uses ??= []; st.geometryActions ??= []; st.math ??= null; }
  if (Array.isArray(l.hints)) for (const h of l.hints as Record<string, unknown>[]) { h.focus ??= []; h.cue ??= null; h.math ??= null; }
  if (l.finalAnswer && typeof l.finalAnswer === "object") (l.finalAnswer as Record<string, unknown>).math ??= null;
  return l;
}

export function draftFeedback(json: unknown, problemText: string, withFigure: boolean, boardFigure: Figure | null = null): { lesson: ModelLesson | null; problems: string[] } {
  const parsed = parseLesson(JSON.stringify(withDefaults(json)));
  if (!("lesson" in parsed)) return { lesson: null, problems: parsed.problems };
  if (!parsed.lesson.analysis.statement.trim()) parsed.lesson.analysis.statement = problemText;
  // The figure built from the statement is exact; a model's own construction can misplace points (agent trial
  // 2026-10-16: B = 60°, C = 45°, AH = 6 drawn wrongly, so a correct BC failed on it). Prefer the built one.
  // The figure the agent built with the geometry tools comes first, then the one built from the statement.
  if (withFigure) { const built = boardFigure?.points.length ? boardFigure : figureFromStatement(problemText)?.figure; if (built) parsed.lesson.figure = { ...built, checks: [...built.checks, ...(parsed.lesson.figure?.checks ?? []).filter((c) => c.role === "derived")].slice(0, 16) }; }
  // Hidden audit fields still in English are removed, not sent back for a rewrite (revise cannot reach them).
  const lesson = tidy(dropForeignMetadata(tidy(parsed.lesson)).lesson);
  const checked = verifyLesson(lesson, { problemText });
  const problems = [
    ...checked.feedback,
    ...latexFeedback(checked.lesson),
    ...cleanLanguage(checked.lesson).feedback,
    ...proofDependencyFeedback(checked.lesson, problemText),
    ...stepClaimFeedback(checked.lesson),
    ...deadEndFeedback(checked.lesson),
    ...hintFeedback(checked.lesson),
    ...simplificationFeedback(problemText, `${checked.lesson.finalAnswer.text} ${checked.lesson.finalAnswer.math ?? ""}`),
    ...(withFigure ? intersectionNotationFeedback(checked.lesson) : []),
  ];
  // What the pipeline itself treats as minor (an answer check it cannot evaluate, drawing remarks) does not cost turns.
  const minor = /can't be evaluated|only restates the answer|points to unknown step|left out of the figure|could not be constructed|cycle at point|integers checks support/;
  return { lesson: checked.lesson, problems: [...new Set(problems)].filter((p) => !minor.test(p)).slice(0, 20) };
}

function applyEdits(lesson: ModelLesson, edits: { target: string; index: number; field: string; value: string | null }[]): string[] {
  const done: string[] = [];
  for (const e of edits) {
    const holder: Record<string, unknown> | undefined =
      e.target === "step" ? (lesson.steps[e.index] as unknown as Record<string, unknown>) : e.target === "hint" ? (lesson.hints[e.index] as unknown as Record<string, unknown>) : e.target === "final" ? (lesson.finalAnswer as unknown as Record<string, unknown>) : undefined;
    if (e.target === "strategy" && typeof e.value === "string") { lesson.strategy = e.value; done.push("strategy"); continue; }
    if (!holder || !(e.field in holder)) continue;
    holder[e.field] = e.value;
    done.push(`${e.target} ${e.index} ${e.field}`);
  }
  return done;
}

export class SoclaasAgentModel implements JsonModel {
  readonly name = "soclaas-agent";
  readonly model: string;
  /** Kept across the pipeline's attempts: one classification and one figure per solve. */
  private type: ProblemType | null = null;
  private readonly board = new GeometryBoard();
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    modelName: string,
    private readonly options: { problemText: string; withFigure: boolean; deadline: number; maxTurns?: number; log?: (m: string) => void },
  ) {
    this.model = modelName;
  }

  async complete({ messages, schema, schemaName, signal, onUsage }: Parameters<JsonModel["complete"]>[0]): Promise<string> {
    const log = this.options.log ?? (() => undefined);
    if (schemaName !== "lesson") return this.plain(messages, schema, schemaName, signal, onUsage);
    // Classify once per solve (Đại số / Hình học / Số học / Tổ hợp), then work with that type's tools.
    this.type ??= await this.classify(signal, onUsage);
    const type = this.type;
    const withFigure = this.options.withFigure || type === "geometry";
    log(`agent: classified as ${type}`);
    const chat: Msg[] = [...messages.map((m) => ({ role: m.role, content: m.content }) as Msg), { role: "system", content: agentRules(type) }];
    let draft: ModelLesson | null = null;
    const board = this.board;
    const toolList = [...toolsFor(type), ...lessonTools(schema)];
    const boardFigure = () => (board.figure.points.length ? board.figure : null);
    for (let turn = 0; turn < (this.options.maxTurns ?? 10); turn++) {
      const left = this.options.deadline - Date.now();
      if (left < 8_000 || signal.aborted) break;
      const timeout = AbortSignal.any([signal, AbortSignal.timeout(Math.min(115_000, left - 3_000))]);
      let response: Response;
      try {
        response = await fetch(`${this.baseUrl.replace(/\/$/, "").replace(/\/v1$/, "")}/v1/chat/completions`, {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${this.apiKey}` },
          body: JSON.stringify({ model: this.model, messages: chat, tools: toolList, tool_choice: "auto", max_tokens: 12_000, temperature: 0.2, chat_template_kwargs: { enable_thinking: false } }),
          signal: timeout,
        });
      } catch (err) {
        log(`agent turn ${turn + 1}: request ended (${(err as Error).message.slice(0, 60)})`);
        break;
      }
      if (!response.ok) {
        log(`agent turn ${turn + 1}: HTTP ${response.status}`);
        if (response.status === 429 || response.status >= 500) break;
        throw new OcrFailure("provider_error", `agent request failed (${response.status})`, true);
      }
      const data = (await response.json()) as { choices?: { message?: { content?: string | null; tool_calls?: ToolCall[] }; finish_reason?: string }[]; usage?: { prompt_tokens?: number; completion_tokens?: number } };
      if (data.usage) onUsage?.({ input: data.usage.prompt_tokens ?? 0, cachedInput: 0, output: data.usage.completion_tokens ?? 0, reasoning: 0 });
      const message = data.choices?.[0]?.message;
      const calls = message?.tool_calls ?? [];
      if (!calls.length) {
        // A plain answer: a lesson written directly is accepted as the draft.
        // A lesson written as plain text instead of through write_lesson goes through the same checks.
        const text = message?.content ?? "";
        let obj: Record<string, unknown> | null = null;
        try { const m = /\{[\s\S]*\}/.exec(text); obj = m ? JSON.parse(fixJsonLatexEscapes(m[0])) : null; } catch { obj = null; }
        const candidate = obj && "lesson" in obj ? obj.lesson : obj;
        chat.push({ role: "assistant", content: text.slice(0, 2000) });
        if (candidate && typeof candidate === "object" && "steps" in candidate) {
          const fb = draftFeedback(candidate, this.options.problemText, withFigure, boardFigure());
          if (fb.lesson) draft = fb.lesson;
          log(`agent turn ${turn + 1}: lesson as text → ${fb.problems.length} problem(s)${fb.problems.length ? `: ${fb.problems.slice(0, 2).join(" | ").slice(0, 200)}` : ""}`);
          if (fb.lesson && !fb.problems.length) return JSON.stringify(fb.lesson);
          chat.push({ role: "user", content: fb.problems.length ? `Bản nháp còn lỗi:\n- ${fb.problems.join("\n- ")}\nSửa bằng revise${fb.lesson ? "" : " (hoặc write_lesson nếu sai cấu trúc)"}, rồi gọi finish.` : "Gọi finish." });
        } else chat.push({ role: "user", content: "Hãy dùng công cụ: write_lesson để nộp bài giảng, rồi finish." });
        continue;
      }
      chat.push({ role: "assistant", content: message?.content ?? null, tool_calls: calls });
      for (const call of calls) {
        let args: Record<string, unknown> = {};
        try { args = JSON.parse(fixJsonLatexEscapes(call.function.arguments || "{}")); } catch { /* reported below */ }
        let result: string;
        const name = call.function.name;
        const typeResult = runTypeTool(name, args, { board, problemText: this.options.problemText });
        if (typeResult !== null) result = typeResult;
        else if (name === "write_lesson" || name === "revise") {
          if (name === "write_lesson") {
            let lesson = args.lesson as ModelLesson | string | undefined;
            if (typeof lesson === "string") {
              const text = lesson;
              try { lesson = JSON.parse(fixJsonLatexEscapes(text)) as ModelLesson; } catch { try { lesson = JSON.parse(text) as ModelLesson; } catch { lesson = undefined; } }
            }
            const fb = lesson && typeof lesson === "object" ? draftFeedback(lesson, this.options.problemText, withFigure, boardFigure()) : { lesson: null, problems: ['"lesson" phải là một đối tượng JSON (không phải chuỗi); gửi lại write_lesson với lesson là object đúng schema.'] };
            if (fb.lesson) draft = fb.lesson;
            result = fb.problems.length ? `Còn ${fb.problems.length} lỗi:\n- ${fb.problems.join("\n- ")}` : "Không còn lỗi. Gọi finish.";
          } else if (!draft) result = "Chưa có bản nháp: gọi write_lesson trước.";
          else {
            const done = applyEdits(draft, (args.edits as never) ?? []);
            const fb = draftFeedback(draft, this.options.problemText, withFigure, boardFigure());
            if (fb.lesson) draft = fb.lesson;
            result = `Đã sửa: ${done.join(", ") || "không có gì"}. ` + (fb.problems.length ? `Còn ${fb.problems.length} lỗi:\n- ${fb.problems.join("\n- ")}` : "Không còn lỗi. Gọi finish.");
          }
        } else if (name === "finish") {
          if (draft) { log(`agent: finished after ${turn + 1} turn(s)`); return JSON.stringify(draft); }
          result = "Chưa có bản nháp: gọi write_lesson trước.";
        } else result = `Không có công cụ ${name}.`;
        log(`agent turn ${turn + 1}: ${name} → ${result.replace(/\n/g, " ").slice(0, 260)}`);
        chat.push({ role: "tool", tool_call_id: call.id, content: result.slice(0, 6000) });
      }
    }
    if (draft) { log("agent: out of time; using the current draft"); return JSON.stringify(draft); }
    throw new OcrFailure("timeout", "agent ran out of time without a draft", true);
  }

  /** Đại số / Hình học / Số học / Tổ hợp, from one short SOCLAAS request; the keyword classifier if it fails. */
  private async classify(signal: AbortSignal, onUsage?: (u: Usage) => void): Promise<ProblemType> {
    const text = this.options.problemText;
    try {
      const out = await this.plain(
        [
          { role: "system", content: "Phân loại bài toán lớp 9 (thi chuyên) vào đúng một dạng: algebra (Đại số: phương trình, hệ, bất đẳng thức, GTLN/GTNN, biểu thức, Vi-ét, hàm số), geometry (Hình học: tam giác, đường tròn, tứ giác, độ dài, góc, chứng minh hình), number_theory (Số học: chia hết, số dư, số nguyên tố, phương trình nghiệm nguyên, chữ số tận cùng), combinatorics (Tổ hợp: đếm, xác suất, nguyên lí Dirichlet, bảng ô vuông, trò chơi). Trả về JSON." },
          { role: "user", content: text },
        ],
        { type: "object", properties: { type: { type: "string", enum: PROBLEM_TYPES } }, required: ["type"], additionalProperties: false },
        "problem_type",
        AbortSignal.any([signal, AbortSignal.timeout(20_000)]),
        onUsage,
      );
      const type = (JSON.parse(out) as { type?: string }).type;
      if (PROBLEM_TYPES.includes(type as ProblemType)) return type as ProblemType;
    } catch { /* keyword classifier below */ }
    if (looksLikeGeometry(text)) return "geometry";
    const d = problemDomains(text).find((x) => x !== "algebra");
    return d === "number_theory" || d === "combinatorics" ? d : "algebra";
  }

  /** Small structured requests of the pipeline (language repair…): one JSON-schema request, no tools. */
  private async plain(messages: Parameters<JsonModel["complete"]>[0]["messages"], schema: Record<string, unknown>, schemaName: string, signal: AbortSignal, onUsage?: (u: Usage) => void): Promise<string> {
    const left = Math.max(5_000, this.options.deadline - Date.now());
    const response = await fetch(`${this.baseUrl.replace(/\/$/, "").replace(/\/v1$/, "")}/v1/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({ model: this.model, messages, max_tokens: 6_000, temperature: 0.2, chat_template_kwargs: { enable_thinking: false }, response_format: { type: "json_schema", json_schema: { name: schemaName, schema, strict: true } } }),
      signal: AbortSignal.any([signal, AbortSignal.timeout(Math.min(60_000, left))]),
    });
    if (!response.ok) throw new OcrFailure("provider_error", `request failed (${response.status})`, true);
    const data = (await response.json()) as { choices?: { message?: { content?: string } }[]; usage?: { prompt_tokens?: number; completion_tokens?: number } };
    if (data.usage) onUsage?.({ input: data.usage.prompt_tokens ?? 0, cachedInput: 0, output: data.usage.completion_tokens ?? 0, reasoning: 0 });
    return data.choices?.[0]?.message?.content ?? "";
  }
}
