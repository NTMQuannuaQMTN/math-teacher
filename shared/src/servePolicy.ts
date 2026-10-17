import type { Verification } from "./solution";

/** Failed checks that concern only how formulas are displayed, not whether the mathematics is right. */
const DISPLAY_ONLY = /công thức chưa hiển thị/iu;

/**
 * Accuracy first: a lesson whose own checks found something false — a geometric claim measured false on the figure, a
 * final answer the computation contradicts, a method outside the curriculum — is not shown to the student, even with an
 * "unverified" label (training run 2026-10-14: two geometry proofs with measured-false steps were being served).
 * "not_checkable" and "partial" lessons are served: nothing in them was found false.
 */
export function servable(verification: Pick<Verification, "status" | "checks">): boolean {
  if (verification.status !== "unverified") return true;
  return verification.checks.filter((c) => !c.passed).every((c) => DISPLAY_ONLY.test(c.label));
}

const value = (src: string): number | null => {
  const t = src.replace(/\\[dt]?frac\{(-?\d+)\}\{(\d+)\}/g, "($1)/($2)").replace(/\s+/g, "").replace(/,(\d)/g, ".$1");
  if (!/^-?\(?-?\d+(?:\.\d+)?\)?(?:\/\(?\d+\)?)?$/.test(t)) return null;
  const [n, d] = t.replace(/[()]/g, "").split("/");
  const v = Number(n) / (d ? Number(d) : 1);
  return Number.isFinite(v) ? v : null;
};

/**
 * The last step computes "P = 4/201" but the final answer says "11/201" (training run 2026-10-14, HCM 2025 5a): the
 * lesson contradicts itself. When the last step's formula ends in a number, the final answer must state that number.
 */
export function finalStepConflict(lesson: { steps: { math: string | null }[]; finalAnswer: { text: string; math: string | null } }): string[] {
  const last = [...lesson.steps].reverse().find((s) => s.math);
  // Only a final line "name = number" (P = \frac{4}{201}, S_{max} = 18) states the answer; "(2x+2)^2 = 0" is an equation.
  // A trailing unit "\text{ (cách)}", "\text{ km/h}" is not part of the value (comb9-f3: "84 - 10 - 4 = 70 \text{ (cách)}", answer 74).
  const line = last?.math?.split(/\\\\/).map((l) => l.replace(/\\(?:quad|qquad|,|;)/g, " ").replace(/\s*\\text\{[^{}]*\}\s*$/, "").trim()).filter(Boolean).at(-1) ?? "";
  // …or the last line of a chain "… \\ = -1" (training 2026-10-15, HCM 1b: the chain ended "= −1", the answer said 0).
  const arithmetic = /^[\d\s+\-*/().^]+(?:\\(?:times|cdot)[\d\s+\-*/().^]+)*=/.test(line);
  if (!(arithmetic || /^(?:[A-Za-z](?:_\{?[A-Za-z0-9]+\}?)?\s*)?=/.test(line)) || /[:;,]|\\text|\\pm|±|\\(?:Rightarrow|Leftrightarrow|in)\b/.test(line)) return [];
  const m = /=\s*(-?\s*(?:\\[dt]?frac\{-?\d+\}\{\d+\}|\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?))\s*$/.exec(line);
  if (!m) return [];
  const target = value(m[1]!);
  if (target === null) return [];
  const answer = `${lesson.finalAnswer.text} ${lesson.finalAnswer.math ?? ""}`;
  const stated = [...answer.matchAll(/-?\s*(?:\\[dt]?frac\{-?\d+\}\{\d+\}|\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?)/g)].map((x) => value(x[0]!)).filter((v): v is number => v !== null);
  if (stated.length === 0 || stated.some((v) => Math.abs(v - target) < 1e-9)) return [];
  // A bare arithmetic line ("84 - 10 - 4 = 70") is the answer only when the answer is one number (a game's last move
  // "21 - 1 = 20" is not the answer "người đi trước thắng").
  if (arithmetic && (new Set(stated).size !== 1 || !/(?:có|là|bằng|=)\s*\$?\s*-?\d/iu.test(answer))) return [];
  return [`the final answer contradicts the last step of the solution (the last step gives ${m[1]!.trim()}); make them agree`];
}
