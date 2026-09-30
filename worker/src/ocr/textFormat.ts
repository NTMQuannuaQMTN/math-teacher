/**
 * Turns the plain Markdown/LaTeX output of a dedicated document-OCR model (PaddleOCR-VL, GLM-OCR,
 * dots.ocr…) into the compact OCR JSON the rest of the pipeline expects. These models are fast
 * transcribers that don't follow JSON instructions (which also makes them immune to prompt
 * injection in the image), so the structure is recovered deterministically:
 *   - LaTeX delimiters \( \) / \[ \] → $ / $$, bare LaTeX wrapped (wrapBareLatex);
 *   - problems split at headings "Câu n", "Bài n", "Exercise n", "Problem n", "Question n", "Ví dụ n";
 *   - language from Vietnamese diacritics; status from whether any maths-like text is present.
 */
import { containsVietnamese, wrapBareLatex } from "../../../shared/src/mathText";

const HEADING = /(?:^|\n)[ \t>*#_]*((?:Câu|Bài|Bài tập|Ví dụ|Exercise|Problem|Question)\s*\d+[a-z]?)\s*[.:)]?/giu;

function cleanMarkdown(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/\\\(\s*([\s\S]*?)\s*\\\)/g, (_, m: string) => `$${m}$`)
    .replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, (_, m: string) => `$$${m}$$`)
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/<\/?(?:div|span|p|br|sup|sub)[^>]*>/gi, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function splitProblems(text: string): { label: string; formatted_text: string }[] {
  const marks = [...text.matchAll(HEADING)].map((m) => ({ index: m.index! + (m[0].startsWith("\n") ? 1 : 0), label: m[1]!.replace(/\s+/g, " ").trim() }));
  if (marks.length <= 1) return text ? [{ label: marks[0]?.label ?? "", formatted_text: text }] : [];
  const out: { label: string; formatted_text: string }[] = [];
  // Anything before the first heading is kept with the first problem only if it looks like shared context.
  const preamble = text.slice(0, marks[0]!.index).trim();
  marks.forEach((m, i) => {
    const chunk = text.slice(m.index, marks[i + 1]?.index ?? text.length).trim();
    out.push({ label: m.label, formatted_text: i === 0 && preamble && /[=<>≤≥]|\$|\d/.test(preamble) ? `${preamble}\n${chunk}` : chunk });
  });
  return out;
}

/** Compact OCR JSON (see MODEL_OCR_COMPACT_JSON_SCHEMA) from a document-OCR model's text output. */
export function ocrTextToCompactJson(raw: string): string {
  const text = wrapBareLatex(cleanMarkdown(raw));
  const mathLike = /\d|[=<>≤≥+×÷√∠△°]|\$/.test(text);
  const problems = mathLike ? splitProblems(text) : [];
  const vietnamese = containsVietnamese(text);
  const english = /\b(the|and|find|solve|if|of|prove|calculate)\b/i.test(text);
  return JSON.stringify({
    status: !text ? "unreadable" : mathLike ? "success" : "no_math_found",
    language: vietnamese ? (english ? "mixed" : "vi") : english ? "en" : "unknown",
    confidence: "medium",
    issues: problems.length > 1 ? ["multiple_problems"] : [],
    problems,
  });
}
