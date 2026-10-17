/**
 * Every formula is rendered with KaTeX — the renderer the app uses — before a lesson is stored. A formula that
 * still fails after the deterministic repairs (mathText.ts repairLatex/textifyProse) is sent back to the model;
 * on the last attempt it is shown as plain text instead, so the student never sees raw LaTeX in red.
 */
import katex from "katex";
import { isWellFormedMathText, latexToPlain, parseMathText, repairLatex, wrapBareLatex, vietnameseMathText } from "../../../shared/src/mathText";
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
  return parseMathText(vietnameseMathText(wrapBareLatex(repairLatex(text)))).flatMap((s) => {
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
  const text = (where: string, t: string | null) => {
    if (t && !isWellFormedMathText(t)) out.push(`${where}: broken mathematical delimiters or prose swallowed into math; write balanced $…$ with prose outside math.`);
    textErrors(t).forEach((e) => add(where, e.tex, e.error));
  };
  const math = (where: string, m: string | null) => {
    const error = m ? renderError(m, true) : null;
    if (error) add(where, m!, error);
  };
  text("statement", lesson.analysis.statement);
  text("subtopic", lesson.analysis.subtopic);
  text("status reason", lesson.analysis.statusReason);
  for (const key of ["givens", "unknowns", "constraints", "concepts", "interpretationNotes"] as const) lesson.analysis[key].forEach(t=>text(key,t));
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
    textErrors(t).length === 0 && isWellFormedMathText(t)
      ? t
      : parseMathText(t)
          .map((s) => (s.kind === "text" ? s.value.replace(/(?<!\\)\$/g, "") : renderError(s.value, s.display) || !isWellFormedMathText(`$${s.value}$`) ? latexToPlain(s.value) : s.display ? `$$${s.value}$$` : `$${s.value}$`))
          .join("");
  const tn = (t: string | null) => (t === null ? null : text(t));
  // A display formula that fails moves into the explanation as plain text.
  const math = (m: string | null): { math: string | null; plain: string | null } =>
    m && renderError(m, true) ? { math: null, plain: latexToPlain(m) } : { math: m, plain: null };
  return {
    ...lesson,
    analysis: { ...lesson.analysis, statement: text(lesson.analysis.statement), subtopic: text(lesson.analysis.subtopic), statusReason: tn(lesson.analysis.statusReason), givens: lesson.analysis.givens.map(text), unknowns: lesson.analysis.unknowns.map(text), constraints: lesson.analysis.constraints.map(text), concepts: lesson.analysis.concepts.map(text), interpretationNotes: lesson.analysis.interpretationNotes.map(text) },
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

/**
 * Optional analysis metadata whose formatting is broken (training 2026-10-15, alg8-h8: an interpretation note
 * "\$\Del…" discarded a lesson whose solution was fine) is removed. The statement, steps, hints and answer are not
 * touched: broken formatting there still rejects the lesson.
 */
export function dropBrokenMetadata(lesson: ModelLesson): ModelLesson {
  const ok = (t: string) => latexFeedback({ ...lesson, analysis: { ...lesson.analysis, statement: t, subtopic: "", statusReason: null, givens: [], unknowns: [], constraints: [], concepts: [], interpretationNotes: [] }, strategy: "", hints: [], steps: [], finalAnswer: { text: "", math: null } } as ModelLesson).length === 0;
  const a = lesson.analysis;
  return {
    ...lesson,
    analysis: {
      ...a,
      statusReason: a.statusReason && !ok(a.statusReason) ? null : a.statusReason,
      givens: a.givens.filter(ok),
      unknowns: a.unknowns.filter(ok),
      constraints: a.constraints.filter(ok),
      concepts: a.concepts.filter(ok),
      interpretationNotes: a.interpretationNotes.filter(ok),
    },
  };
}
