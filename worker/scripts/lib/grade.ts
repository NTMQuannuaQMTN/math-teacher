/**
 * Deterministic grading of a generated lesson against a benchmark item. No LLM judges.
 *
 * answerCorrect (null when the item has no machine-gradable answer, i.e. pure proofs):
 *   - multiple choice: the chosen letter (or, if none is stated, the option's value) must match;
 *   - otherwise every `accept` group needs at least one matching pattern, and no `reject` pattern may match;
 *   - invalid/unsupported inputs: the lesson's analysis.status must equal the expected status.
 *
 * grade:
 *   PASS      answer correct (or proof) and the pipeline marked the lesson "verified"
 *   PARTIAL   answer correct (or proof) but not fully verified ("partial" / "not_checkable" / "unverified")
 *   FAIL      wrong answer that was NOT presented as verified, a proof with a detected false claim, or no lesson
 *   CRITICAL  wrong answer presented as "verified" — the system would confidently teach something false
 */
import { mathTextToPlain } from "../../../shared/src/mathText";
import type { ModelLesson, Verification } from "../../../shared/src/solution";

export interface BenchItem {
  id: string;
  split: string;
  topic: string;
  difficulty: number;
  format: string;
  problem_text: string;
  options: Record<string, string> | null;
  expect_status?: string | null;
  grading: { mcq: string | null; accept: string[][]; reject: string[]; proof_parts: string[]; literal?: boolean };
}

export type Grade = "PASS" | "PARTIAL" | "FAIL" | "CRITICAL";

const norm = (s: string) => s.normalize("NFC").replace(/[−–]/g, "-").replace(/\s+/g, " ").toLowerCase();
const squash = (s: string) => norm(s).replace(/\s+/g, "");

export function answerText(lesson: ModelLesson): string {
  const math = lesson.finalAnswer.math ? mathTextToPlain(`$${lesson.finalAnswer.math}$`) : "";
  return `${mathTextToPlain(lesson.finalAnswer.text)} ${math} ${lesson.finalAnswer.text} ${lesson.finalAnswer.math ?? ""}`;
}

function chosenLetter(text: string): string | null {
  const t = norm(text);
  const patterns = [
    /(?:đáp án|chọn|phương án|answer|option)\s*(?:đúng\s*)?(?:là\s*)?[:：]?\s*\(?([abcd])\b/g,
    /^\s*\(?([abcd])[.):]/g,
  ];
  const found = new Set<string>();
  for (const re of patterns) for (const m of t.matchAll(re)) found.add(m[1]!.toUpperCase());
  return found.size === 1 ? [...found][0]! : null;
}

export function gradeAnswer(item: BenchItem, lesson: ModelLesson): boolean | null {
  if (item.expect_status) return lesson.analysis.status === item.expect_status;
  const text = answerText(lesson);
  const g = item.grading;
  const matches = (pattern: string) =>
    g.literal ? pattern.split("|").some((alt) => squash(text).includes(squash(alt))) : new RegExp(pattern, "iu").test(norm(text));
  if (g.reject.some(matches)) return false;
  if (g.mcq) {
    const letter = chosenLetter(`${lesson.finalAnswer.text}\n${lesson.finalAnswer.math ?? ""}`);
    if (letter) return letter === g.mcq;
    return g.accept.every((group) => group.some(matches));
  }
  if (g.accept.length === 0) return null;
  return g.accept.every((group) => group.some(matches));
}

export function grade(item: BenchItem, lesson: ModelLesson | null, verification: Verification | null): { grade: Grade; answerCorrect: boolean | null } {
  if (!lesson || !verification) return { grade: "FAIL", answerCorrect: false };
  const answerCorrect = gradeAnswer(item, lesson);
  const status = verification.status;
  if (item.expect_status) return { grade: answerCorrect ? "PASS" : "FAIL", answerCorrect };
  if (answerCorrect === false) return { grade: status === "verified" ? "CRITICAL" : "FAIL", answerCorrect };
  if (answerCorrect === null && status === "unverified") return { grade: "FAIL", answerCorrect };
  return { grade: status === "verified" ? "PASS" : "PARTIAL", answerCorrect };
}
