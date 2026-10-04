/**
 * Arithmetic slips inside a derivation ("(a+e+i)+(c+e+g)+… = 4n ⇒ (a+c+g+i)+2e+…+3e = 4n", where 4e became 5e).
 *
 * A step's `math` is read line by line. When two consecutive lines are equations that keep one side unchanged and
 * use the same variables, the other side was only rewritten — so it must be the same expression. That is tested by
 * evaluating both at random values. Deliberately narrow, to avoid false alarms:
 *   - lines with prose (\text, except a leading label), several relations, commas, |…| or segment names (AB, CD) are skipped;
 *   - a change of variables (substituting b = 2, or a + b + c = n) is a legitimate step and is skipped;
 *   - an unchanged side that is 0 or ±1 is skipped ("x² − 5x + 6 = 0 ⇒ x − 2 = 0", "x² = 1 ⇒ x = 1");
 *   - when both sides change (dividing, squaring) nothing is checked.
 */
import { evalExpression, normalizeExpression, variablesOf } from "./expr";
import type { ModelLesson } from "./solution";

export interface DerivationSlip {
  stepId: string;
  message: string;
}

interface Eq {
  raw: string;
  sides: [string, string];
  vars: string;
}

const ARROW = /^\s*(?:\\(?:Rightarrow|Leftrightarrow|implies|iff|Longrightarrow|therefore)|⇒|⇔|→)\s*/;
const SPACING = /\\[,;:!]|\\q?quad|\\left|\\right|\\displaystyle|&/g;

function lines(math: string): string[] {
  return math
    .replace(/\\begin\{[a-z*]+\}|\\end\{[a-z*]+\}/g, "\n")
    .split(/\\\\|\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function equation(line: string): Eq | null {
  // A leading label ("\text{Cộng ba hàng: } a + b + c = 3n") is prose about the equation, not part of it.
  const body = line.replace(ARROW, "").replace(/^\\text\{[^{}]*\}\s*/, "").replace(ARROW, "").replace(SPACING, " ").trim();
  if (/\\text|\\mbox|\\mathrm|[|,;]|\\(?:le|ge|leq|geq|ne|neq|equiv|pmod|bmod|approx|lt|gt|in|cup|cap)(?![a-zA-Z])|[<>≤≥≠≡]|[A-Z]{2}/.test(body)) return null;
  if (/[^\x00-\x7F]/.test(body)) return null; // Unicode symbols or words: not a plain algebraic line
  const parts = body.split("=");
  if (parts.length !== 2 || !parts[0]!.trim() || !parts[1]!.trim()) return null;
  try {
    const sides = parts.map((p) => normalizeExpression(p.trim())) as [string, string];
    const vars = [...new Set(sides.flatMap((s) => [...variablesOf(s)]))].sort().join(",");
    sample(sides[0], vars.split(","));
    sample(sides[1], vars.split(","));
    return { raw: body, sides, vars };
  } catch {
    return null;
  }
}

/** Deterministic pseudo-random positive values (positive keeps square roots defined). */
const POINTS = [0, 1, 2].map((k) => (name: string) => 1.3 + ((name.charCodeAt(0) * 7919 + (name.charCodeAt(1) || 0) * 104729 + k * 7907) % 997) / 271);

function sample(expr: string, vars: string[]): number[] {
  return POINTS.map((at) => evalExpression(expr, Object.fromEntries(vars.filter(Boolean).map((v) => [v, at(v)]))));
}

const same = (a: number[], b: number[]) => a.every((x, i) => Math.abs(x - b[i]!) <= 1e-7 * Math.max(1, Math.abs(x), Math.abs(b[i]!)));
const trivial = (vals: number[]) => vals.every((v) => Math.abs(v) < 1e-9 || Math.abs(Math.abs(v) - 1) < 1e-9);

export function derivationSlips(lesson: ModelLesson): DerivationSlip[] {
  const out: DerivationSlip[] = [];
  lesson.steps.forEach((step, index) => {
    if (!step.math) return;
    const eqs = lines(step.math).map(equation);
    for (let i = 1; i < eqs.length; i++) {
      const [p, q] = [eqs[i - 1], eqs[i]];
      if (!p || !q || p.vars !== q.vars || !p.vars) continue;
      const vars = p.vars.split(",");
      const [pl, pr, ql, qr] = [sample(p.sides[0], vars), sample(p.sides[1], vars), sample(q.sides[0], vars), sample(q.sides[1], vars)];
      if (![pl, pr, ql, qr].every((v) => v.every(Number.isFinite))) continue;
      const kept = same(pr, qr) ? "right" : same(pl, ql) ? "left" : null;
      if (!kept) continue;
      const [keptVals, before, after] = kept === "right" ? [pr, pl, ql] : [pl, pr, qr];
      if (trivial(keptVals) || same(before, after)) continue;
      out.push({
        stepId: step.id,
        message: `step ${index + 1}: "${p.raw}" ⇒ "${q.raw}" keeps the ${kept} side but the ${kept === "right" ? "left" : "right"} side changed value (${fmt(before[0]!)} vs ${fmt(after[0]!)} at the same values of ${p.vars}): an arithmetic slip — recount the terms and rewrite this step correctly`,
      });
    }
  });
  return out;
}

const fmt = (x: number) => (Number.isInteger(x) ? String(x) : x.toFixed(3));
