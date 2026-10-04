/**
 * Every formula is rendered with KaTeX — the renderer the app uses — before a lesson is stored. A formula that
 * still fails after the deterministic repairs (mathText.ts repairLatex/textifyProse) is sent back to the model;
 * on the last attempt it is shown as plain text instead, so the student never sees raw LaTeX in red.
 */
import katex from "katex";
import { latexToPlain, parseMathText } from "../../../shared/src/mathText";
import type { ModelLesson } from "../../../shared/src/solution";

const OPTIONS = { throwOnError: true, strict: "ignore", trust: false, maxSize: 20, maxExpand: 300 } as const;

function renderError(tex: string, displayMode: boolean): string | null {
  try {
    katex.renderToString(tex, { ...OPTIONS, displayMode });
    return null;
  } catch (err) {
    return (err as Error).message.split("\n")[0]!.replace(/^KaTeX parse error: /, "").slice(0, 120);
  }
}

/** Text with `$…$`: the formulas that don't render. */
function textErrors(text: string | null): { tex: string; error: string }[] {
  if (!text) return [];
  return parseMathText(text).flatMap((s) => {
    if (s.kind !== "math") return [];
    const error = renderError(s.value, s.display);
    return error ? [{ tex: s.value, error }] : [];
  });
}

/** Every unrenderable formula, as retry feedback. */
export function latexFeedback(lesson: ModelLesson): string[] {
  const out: string[] = [];
  const add = (where: string, tex: string, error: string) =>
    out.push(`${where}: the formula "${tex.slice(0, 120)}" doesn't render (${error}). Write valid KaTeX: no "\\n" inside strings, no "\\[…\\]" delimiters or spacing arguments, prose only inside \\text{…}.`);
  const text = (where: string, t: string | null) => textErrors(t).forEach((e) => add(where, e.tex, e.error));
  const math = (where: string, m: string | null) => {
    const error = m ? renderError(m, true) : null;
    if (error) add(where, m!, error);
  };
  text("statement", lesson.analysis.statement);
  text("strategy", lesson.strategy);
  lesson.hints.forEach((h, i) => {
    text(`hint ${i + 1}`, h.question);
    text(`hint ${i + 1}`, h.cue);
    text(`hint ${i + 1}`, h.explanation);
    math(`hint ${i + 1}`, h.math);
  });
  lesson.steps.forEach((s, i) => {
    text(`step ${i + 1}`, s.title);
    text(`step ${i + 1}`, s.explanation);
    text(`step ${i + 1}`, s.reason);
    math(`step ${i + 1}`, s.math);
  });
  text("final answer", lesson.finalAnswer.text);
  math("final answer", lesson.finalAnswer.math);
  return out;
}

/** Last resort: an unrenderable formula becomes readable plain text. */
export function plainUnrenderable(lesson: ModelLesson): ModelLesson {
  const text = (t: string): string =>
    textErrors(t).length === 0
      ? t
      : parseMathText(t)
          .map((s) => (s.kind === "text" ? s.value : renderError(s.value, s.display) ? latexToPlain(s.value) : s.display ? `$$${s.value}$$` : `$${s.value}$`))
          .join("");
  const tn = (t: string | null) => (t === null ? null : text(t));
  // A display formula that fails moves into the explanation as plain text.
  const math = (m: string | null): { math: string | null; plain: string | null } =>
    m && renderError(m, true) ? { math: null, plain: latexToPlain(m) } : { math: m, plain: null };
  return {
    ...lesson,
    analysis: { ...lesson.analysis, statement: text(lesson.analysis.statement) },
    strategy: text(lesson.strategy),
    hints: lesson.hints.map((h) => {
      const m = math(h.math);
      return { ...h, question: text(h.question), cue: tn(h.cue), explanation: text(h.explanation) + (m.plain ? `\n${m.plain}` : ""), math: m.math };
    }),
    steps: lesson.steps.map((s) => {
      const m = math(s.math);
      return { ...s, title: text(s.title), explanation: text(s.explanation) + (m.plain ? `\n${m.plain}` : ""), reason: tn(s.reason), math: m.math };
    }),
    finalAnswer: (() => {
      const m = math(lesson.finalAnswer.math);
      return { text: text(lesson.finalAnswer.text) + (m.plain ? `\n${m.plain}` : ""), math: m.math };
    })(),
  };
}
