import { evalExpression } from "./expr";

/**
 * "Rút gọn biểu thức A = … (với x > 0, x ≠ 1)": the simplified form must equal the original at every admissible value.
 * Agent trial 2026-10-16 served A = (√x − 1)²/√x for an expression equal to (x − 1)/√x — nothing compared them. Both
 * sides are evaluated at sample values of the single variable (positive, avoiding the excluded values); a mismatch is a
 * false final answer. Says nothing when either side cannot be read.
 */
const SAMPLES = [0.36, 2.25, 4, 7, 9, 12.25, 30];

function expressionOf(statement: string): { name: string; variable: string; expr: string; excluded: number[] } | null {
  const t = statement.normalize("NFC");
  const m = /rút gọn (?:biểu thức\s*)?\$?\s*([A-Z])\s*=\s*([^$]+)\$/iu.exec(t);
  if (!m) return null;
  const vars = [...new Set((m[2]!.replace(/\\[a-zA-Z]+/g, " ").match(/[a-z]/g) ?? []))];
  if (vars.length !== 1) return null;
  const v = vars[0]!;
  const excluded = [...t.matchAll(new RegExp(`${v}\\s*(?:\\\\ne|\\\\neq|≠)\\s*(-?\\d+(?:[.,]\\d+)?)`, "g"))].map((x) => Number(x[1]!.replace(",", ".")));
  return { name: m[1]!, variable: v, expr: m[2]!.trim(), excluded };
}

function finalExpression(name: string, answer: string): string | null {
  const t = answer.replace(/\$/g, " ");
  const m = new RegExp(`(?:^|[^A-Za-z])${name}\\s*=\\s*([^,;\\n]+?)(?=\\s*(?:với|khi|\\.\\s|$|\\n|,|;))`, "u").exec(t);
  return m ? m[1]!.trim().replace(/\.$/, "") : null;
}

export function simplificationFeedback(statement: string, finalAnswer: string): string[] {
  const task = expressionOf(statement);
  if (!task) return [];
  const result = finalExpression(task.name, finalAnswer);
  if (!result) return [];
  let compared = 0;
  for (const x of SAMPLES) {
    if (task.excluded.some((e) => Math.abs(e - x) < 1e-9)) continue;
    let a: number, b: number;
    try { a = evalExpression(task.expr, { [task.variable]: x }); b = evalExpression(result, { [task.variable]: x }); } catch { return []; }
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
    compared++;
    if (Math.abs(a - b) > 1e-6 * Math.max(1, Math.abs(a))) return [`the simplified form ${task.name} = ${result} is not equal to the original expression (at ${task.variable} = ${x}: original ${+a.toFixed(6)}, answer ${+b.toFixed(6)}); re-check each transformation`];
  }
  return compared >= 2 ? [] : [];
}
