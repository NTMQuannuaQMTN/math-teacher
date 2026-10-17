/**
 * Templates substitute numbers as "(4)", "(1)", "(0)" so that negative values stay correct ("-(-5)", "(-3)^2"). For a
 * non-negative integer the brackets are noise a teacher would not write: "4m^2+(4)", "\sqrt{x^2+(1)}", "(4)p-(1)",
 * "4\cdot(1)\cdot(6)", "(2)(3)=6". This removes them where the meaning cannot change:
 *  - only "(n)" with n a non-negative integer, never "(-n)" or "(a+b)";
 *  - not after a letter, digit, "_", "^" or ")", nor inside "_{…}"/"^{…}" — "f(2)", "P(0)", "2(3)", "x_{(1)}" keep theirs;
 *  - "(n)" before a digit or a bracketed number becomes "n\cdot", so "(2)(3)" reads "2\cdot 3", never "23";
 *  - a coefficient "(1)" before a letter or bracket disappears ("(1)p" → "p", "-(1)(x+1)" → "-(x+1)");
 *  - an equation label ("\\quad (1)" at the end of a line) is kept.
 */
export function tidyNumberBrackets(latex: string): string {
  let out = latex;
  for (let pass = 0; pass < 4; pass++) {
    const next = out.replace(/(^|\\begin\{[a-z*]+\}|[=+\-{[(,&<>\s]|\\cdot\s?|\\times\s?|\\\\|\\quad\s?|\\le\s?|\\ge\s?|\\pm\s?)\((\d+)\)(?=(.?))/g, (whole, before: string, n: string, after: string, offset: number, all: string) => {
      // A bracketed index or exponent ("x_{(1)}", "a^{(2)}") is notation, not a substituted number.
      if (before === "{" && /[_^]$/.test(all.slice(0, offset))) return whole;
      const rest = all.slice(offset + whole.length);
      const nextChar = rest[0] ?? "";
      // "…=90^\\circ\\quad (1)" at the end of a line is an equation label that later steps cite.
      if (/^(?:\s|\\q?quad\s?)$/.test(before) && /^\s*(?:$|\\\\|\\end)/.test(rest)) return whole;
      // "(2)(3)" or "(2)5": keep a visible product sign.
      if (/^\((?:-?\d)/.test(rest) || /^\d/.test(nextChar)) return `${before}${n}\\cdot `;
      // A coefficient before a letter, a command or an expression in brackets.
      if (/^[A-Za-z(\\]/.test(rest) && !/^\\(?:cdot|times|le|ge|quad|right|end|\\|pmod|bmod|ne|in|Rightarrow|Leftrightarrow|equiv|cdots|ldots|text)/.test(rest)) {
        return n === "1" ? before : `${before}${n}`;
      }
      void after;
      return `${before}${n}`;
    });
    if (next === out) break;
    out = next;
  }
  return out;
}

/** Applies tidyNumberBrackets inside the $…$ / $$…$$ spans of a text, leaving the prose alone. */
export function tidyNumberBracketsInText(text: string): string {
  return text.replace(/(\$\$?)([^$]+)\1/g, (_, d: string, body: string) => `${d}${tidyNumberBrackets(body)}${d}`);
}

/** After tidying, a substituted line can equal the simplified line under it ("t^2-5t+6=0\\t^{2}-5t+6=0"): show it once. */
export function dropRepeatedLines(latex: string): string {
  const same = (a: string) => a.replace(/\^\{(\w)\}/g, "^$1").replace(/\s+/g, "").replace(/^&|&/g, "");
  return latex.replace(/\\begin\{(gathered|aligned)\}([\s\S]*?)\\end\{\1\}/g, (whole, env: string, body: string) => {
    const lines = body.split("\\\\");
    const kept = lines.filter((line, i) => i === 0 || same(line) !== same(lines[i - 1]!));
    if (kept.length === lines.length) return whole;
    return kept.length === 1 ? kept[0]!.replace(/^&/, "") : `\\begin{${env}}${kept.join("\\\\")}\\end{${env}}`;
  });
}

/**
 * "m^2-m-6=0 \Leftrightarrow \begin{cases} m = 3 \\ m = -2 \end{cases}": a brace ("and") that gives ONE variable several
 * different values is never an intended system — it is the "or" bracket written wrongly (final evaluation 2026-10-14:
 * a correct lesson was withheld for it). Rewritten as the Vietnamese "hoặc" bracket \left[\begin{array}{l}…\end{array}\right.
 */
export function bracketAlternatives(latex: string): string {
  return latex.replace(/\\begin\{cases\}([\s\S]*?)\\end\{cases\}/g, (whole, body: string) => {
    const rows = body.split(/\\\\/).map((r) => r.replace(/&/g, "").trim()).filter(Boolean);
    if (rows.length < 2) return whole;
    const parsed = rows.map((r) => /^([A-Za-z](?:_\{?\w+\}?)?)\s*=\s*([^=]+)$/.exec(r));
    if (parsed.some((p) => !p) || new Set(parsed.map((p) => p![1])).size !== 1 || new Set(parsed.map((p) => p![2]!.replace(/\s+/g, ""))).size !== rows.length) return whole;
    return `\\left[\\begin{array}{l}${rows.join("\\\\")}\\end{array}\\right.`;
  });
}

/**
 * Slot pictures for arrangements: "_ N _ N _ N _" (training 2026-10-15, comb8-h1: "Double subscript" — the lesson was
 * discarded). A lone underscore between spaces is an empty place, not a subscript: drawn as \square.
 */
export function slotUnderscores(latex: string): string {
  return latex.replace(/(^|[\s,;(])_(?=[\s,;)]|$)/g, "$1\\square");
}
