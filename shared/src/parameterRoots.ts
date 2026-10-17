import { compileExpression, evalExpression } from "./expr";

/**
 * "Cho phương trình <quadratic in x with parameter m>. Tìm m để phương trình có hai nghiệm x_1, x_2 thỏa mãn <R>."
 *
 * The general oracle skips parametric questions, so a wrong m (held-out 2026-10-14: m = 1 or −5 instead of −1 ± √3)
 * reached the student unflagged. This solves the condition numerically for every m in a window: the real roots of the
 * quadratic (Δ ≥ 0, or > 0 for "phân biệt"), both labelings of x_1, x_2 when R is not symmetric, every sign change of R
 * refined by bisection and kept only when R really vanishes there. It is a check, not a proof: the lesson still has to
 * derive the answer; a disagreement makes it unverified and sends it back for correction.
 */
export interface ParameterRoots {
  values: number[];
  window: number;
  summary: string;
}

const WINDOW = 60;
const STEP = 0.005;

function quadraticOf(eq: string): ((m: number) => [number, number, number]) | null {
  const parts = eq.split("=");
  if (parts.length !== 2) return null;
  try {
    const fc = compileExpression(`(${parts[0]})-(${parts[1]})`);
    const f = (x: number, m: number) => fc({ x, m });
    const coef = (m: number): [number, number, number] => {
      const c = f(0, m), p = f(1, m), q = f(-1, m);
      return [(p + q) / 2 - c, (p - q) / 2, c];
    };
    // It must be a quadratic in x for every m: the 3-point fit has to reproduce other points exactly.
    for (const m of [-2.3, 0.7, 3.1]) {
      const [a, b, c] = coef(m);
      for (const x of [2, -3, 5]) if (Math.abs(a * x * x + b * x + c - f(x, m)) > 1e-7 * Math.max(1, Math.abs(f(x, m)))) return null;
      if (!Number.isFinite(a + b + c)) return null;
    }
    return coef;
  } catch {
    return null;
  }
}

export function parameterRootCondition(statement: string): ParameterRoots | null {
  const text = statement.normalize("NFC");
  if (!/tìm (?:tất cả )?(?:các )?(?:giá trị (?:của )?)?(?:tham số )?\$?m\b/iu.test(text)) return null;
  if (/(?:^|\s)[a-e]\)/.test(text)) return null; // several parts: not one condition
  const segs = [...text.matchAll(/\$([^$]+)\$/g)].map((m) => m[1]!.replace(/\\left|\\right|\\,|\\;/g, "").trim());
  const eqs = segs.filter((s) => /x/.test(s) && /m/.test(s) && /=/.test(s) && !/x_?\{?[12]\}?/.test(s));
  const conds = segs.filter((s) => /x_?\{?1\}?/.test(s) && /x_?\{?2\}?/.test(s) && /=/.test(s) && !/[<>]|\\le|\\ge|\\ne/.test(s));
  if (eqs.length !== 1 || conds.length !== 1) return null;
  // Extra conditions on m (an integer m, m > 0 …) are not modelled: say nothing rather than check the wrong task.
  if (/\bm\s*(?:[<>]|\\le|\\ge|\\in|\\ne)|số nguyên\s*\$?m\b|\bm\$?\s*(?:là\s+(?:một\s+)?)?(?:số\s+)?nguyên/u.test(text)) return null;
  const coef = quadraticOf(eqs[0]!);
  if (!coef) return null;
  const strict = /phân biệt/iu.test(text);
  const cond = conds[0]!.replace(/x_\{?1\}?/g, "u").replace(/x_\{?2\}?/g, "w");
  const sides = cond.split("=");
  if (sides.length !== 2) return null;
  let Rc: ReturnType<typeof compileExpression>;
  try {
    Rc = compileExpression(`(${sides[0]})-(${sides[1]})`);
  } catch {
    return null;
  }
  const R = (u: number, w: number, m: number) => Rc({ u, w, m });
  const rootsAt = (m: number): [number, number] | null => {
    const [a, b, c] = coef(m);
    if (Math.abs(a) < 1e-12) return null;
    const d = b * b - 4 * a * c;
    if (strict ? d <= 1e-12 : d < -1e-12) return null;
    const s = Math.sqrt(Math.max(0, d));
    return [(-b - s) / (2 * a), (-b + s) / (2 * a)];
  };
  const found: number[] = [];
  try {
    for (const swap of [false, true]) {
      const g = (m: number) => {
        const r = rootsAt(m);
        if (!r) return NaN;
        return swap ? R(r[1], r[0], m) : R(r[0], r[1], m);
      };
      let prevM = -WINDOW, prev = g(prevM);
      for (let m = -WINDOW + STEP; m <= WINDOW + 1e-9; m += STEP) {
        const cur = g(m);
        if (Number.isFinite(prev) && Number.isFinite(cur) && (prev === 0 || prev * cur < 0)) {
          let lo = prevM, hi = m, glo = prev;
          if (prev !== 0)
            for (let i = 0; i < 80; i++) {
              const mid = (lo + hi) / 2, gm = g(mid);
              if (!Number.isFinite(gm)) break;
              if (glo * gm <= 0) hi = mid; else { lo = mid; glo = gm; }
            }
          const root = prev === 0 ? prevM : (lo + hi) / 2;
          const val = g(root);
          if (Number.isFinite(val) && Math.abs(val) < 1e-6 && !found.some((v) => Math.abs(v - root) < 1e-5)) found.push(root);
        }
        prevM = m;
        prev = cur;
      }
    }
  } catch {
    return null;
  }
  found.sort((a, b) => a - b);
  const shown = found.map((v) => (Math.abs(v - Math.round(v)) < 1e-6 ? String(Math.round(v)) : v.toFixed(4)));
  return {
    values: found,
    window: WINDOW,
    summary: found.length
      ? `Giải số điều kiện theo tham số (|m| ≤ ${WINDOW}): m ≈ ${shown.join("; ")}.`
      : `Giải số điều kiện theo tham số (|m| ≤ ${WINDOW}): không có giá trị m nào thỏa mãn.`,
  };
}

/** The m values a final answer states: "m = 1 hoặc m = -5", "m=-1\pm\sqrt3", "m \in \{2; 3\}"; null when none are stated. */
export function answerParameterValues(answer: string): number[] | null {
  // "\text{ hoặc }" is a word, not part of a value (training 2026-10-15: "m = 2 \text{ hoặc } m = -\frac13" was
  // unreadable, so a wrong answer was served unchecked).
  const t = answer.replace(/\$/g, " ").replace(/\\left|\\right|\\,|\\;|\\!|\\quad|\\qquad/g, " ").replace(/\\(?:text|mathrm)\{([^{}]*)\}/g, " $1 ").replace(/\s+/g, " ");
  if (/không (?:có|tồn tại)(?: giá trị| số)?(?: (?:của|tham số))? m\b|không (?:có|tồn tại) (?:giá trị|số) nào|vô nghiệm/iu.test(t)) return [];
  const exprs: string[] = [];
  for (const m of t.matchAll(/\bm\s*=\s*([^,;=]+?)(?=\s*(?:hoặc|và|thì|,|;|\.(?!\d)|\)|$|\n))/gu)) exprs.push(m[1]!.trim());
  for (const m of t.matchAll(/\bm\s*\\in\s*\\\{([^}]*)\\\}/gu)) exprs.push(...m[1]!.split(/[;,]/).map((s) => s.trim()));
  if (!exprs.length) return null;
  const out: number[] = [];
  for (const e of exprs) {
    const variants = /\\pm|±/.test(e) ? [e.replace(/\\pm|±/, "+"), e.replace(/\\pm|±/, "-")] : [e];
    for (const v of variants) {
      try {
        const n = evalExpression(v, {});
        if (Number.isFinite(n)) out.push(n);
      } catch {
        return null; // an expression we cannot read: say nothing
      }
    }
  }
  return out;
}

/** Feedback when the stated m values differ from the numerical solution of the condition (empty when they agree or can't tell). */
export function parameterAnswerFeedback(statement: string, finalAnswer: string, computed = parameterRootCondition(statement)): string[] {
  if (!computed) return [];
  const stated = answerParameterValues(finalAnswer);
  if (stated === null) return [];
  const inWindow = stated.filter((v) => Math.abs(v) <= computed.window);
  const wrong = inWindow.filter((v) => !computed.values.some((c) => Math.abs(c - v) < 1e-4));
  const missing = computed.values.filter((c) => !stated.some((v) => Math.abs(c - v) < 1e-4));
  if (!wrong.length && !missing.length) return [];
  return [
    `the values of m in the final answer do not match the condition solved numerically (${computed.summary})` +
      (wrong.length ? ` — not solutions: ${wrong.map((v) => v.toFixed(4)).join(", ")}` : "") +
      (missing.length ? ` — missing: ${missing.map((v) => v.toFixed(4)).join(", ")}` : "") +
      `; re-derive with Vi-ét and check the discriminant condition`,
  ];
}
