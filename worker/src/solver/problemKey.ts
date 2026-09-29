import { normalizeProblemText } from "../../../shared/src/mathText";
import { sha256Hex } from "../crypto";

/**
 * Canonical form of a problem for the shared lesson library: the same
 * problem photographed by different students (or numbered differently on
 * different worksheets) maps to the same key.
 * - Unicode NFC, control characters removed (normalizeProblemText)
 * - the leading number dropped ("Bài 3.", "Câu 1:", "Exercise 2)")
 * - all whitespace collapsed, so line breaks and spacing don't matter
 * Everything else, including the maths and letter case, must match exactly.
 */
export function canonicalProblem(text: string): string {
  return normalizeProblemText(text)
    .replace(/^\s*(?:bài|câu|ví dụ|bài tập|exercise|problem|question)\s*\d+[a-zA-Z]?\s*[.:)]?\s*/iu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function problemKey(text: string): Promise<string> {
  return sha256Hex(`problem-key-v1\n${canonicalProblem(text)}`);
}
