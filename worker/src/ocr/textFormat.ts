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

// A heading starts a line, or follows a sentence end when it carries the exam's mark scale
// ("… vào a và b. Câu 2 (1.5 điểm). …": OCR sometimes joins lines).
const HEADING =
  /(?:^|\n|(?<=[.!?]\s{1,3})(?=(?:Câu|Bài)\s*\d+\s*\(\s*\d+(?:[.,]\d+)?\s*điểm\s*\)))[ \t>*#_]*((?:Câu|Bài|Bài tập|Ví dụ|Exercise|Problem|Question)\s*\d+[a-z]?)\s*[.:)]?/giu;

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
  // With several numbered questions, text before the first one is the page header / instructions
  // ("ĐẠI HỌC…", "Môn thi…", "Học sinh kẻ bảng…"), not part of any problem: drop it.
  return marks.map((m, i) => ({ label: m.label, formatted_text: text.slice(m.index, marks[i + 1]?.index ?? text.length).trim() }));
}

/** Real maths signals: relations/operators/symbols, LaTeX, or problem verbs. A lone digit ("lớp 9A") isn't one. */
const MATH_SIGNAL =
  /[=<>≤≥≠+×÷√∠△°^π]|\$|\\[a-zA-Z]+|\d\s*[-*/]\s*\d|(?<!\p{L})(?:tính|giải|chứng minh|tìm|rút gọn|phương trình|bất phương trình|tam giác|đường tròn|solve|prove|find|calculate|equation|triangle)(?!\p{L})/iu;

/**
 * Compact OCR JSON (see MODEL_OCR_COMPACT_JSON_SCHEMA) from a document-OCR model's text output.
 * confidence: from the model's own token probabilities when available (mean log-probability of the
 * generated tokens). Document-OCR models transcribe even unreadable images, so this is the only
 * signal that the text may be invented; "low" makes the app ask the student to check or retake.
 */
export function ocrTextToCompactJson(raw: string, meanLogprob?: number, lowThreshold = -0.35): string {
  const text = wrapBareLatex(cleanMarkdown(raw));
  const mathLike = MATH_SIGNAL.test(text);
  const problems = mathLike ? splitProblems(text) : [];
  const vietnamese = containsVietnamese(text);
  const english = /\b(the|and|find|solve|if|of|prove|calculate)\b/i.test(text);
  return JSON.stringify({
    status: !text ? "unreadable" : mathLike ? "success" : "no_math_found",
    language: vietnamese ? (english ? "mixed" : "vi") : english ? "en" : "unknown",
    confidence: meanLogprob === undefined ? "medium" : meanLogprob < lowThreshold ? "low" : "high",
    issues: problems.length > 1 ? ["multiple_problems"] : [],
    problems,
  });
}
