/**
 * Utilities for the problem text format used across the app:
 * prose with inline maths in `$…$` and display maths in `$$…$$`.
 *
 * Pure functions, no dependencies — used by the Worker to sanitize OCR
 * output and by the app to render, preview, and summarize problems.
 */

export type MathSegment =
  | { kind: "text"; value: string }
  | { kind: "math"; value: string; display: boolean };

/**
 * Splits formatted text into text and maths segments.
 *
 * `\$` is an escaped literal dollar sign. An unterminated `$` is treated as a
 * literal character rather than swallowing the rest of the text, so a typo
 * while editing never makes the whole problem disappear from the preview.
 */
export function parseMathText(input: string): MathSegment[] {
  const segments: MathSegment[] = [];
  let text = "";
  let i = 0;

  const flushText = () => {
    if (text) segments.push({ kind: "text", value: text });
    text = "";
  };

  while (i < input.length) {
    const ch = input[i];
    if (ch === "\\" && input[i + 1] === "$") {
      text += "$";
      i += 2;
      continue;
    }
    if (ch !== "$") {
      text += ch;
      i += 1;
      continue;
    }

    const display = input[i + 1] === "$";
    const delimiter = display ? "$$" : "$";
    const start = i + delimiter.length;
    const end = findClosingDelimiter(input, start, delimiter);
    if (end === -1) {
      // Unterminated: keep the delimiter as literal text.
      text += delimiter;
      i = start;
      continue;
    }
    const tex = input.slice(start, end).trim();
    if (tex.length === 0) {
      text += delimiter + delimiter;
    } else {
      flushText();
      segments.push({ kind: "math", value: tex, display });
    }
    i = end + delimiter.length;
  }
  flushText();
  return segments;
}

function findClosingDelimiter(input: string, from: number, delimiter: "$" | "$$"): number {
  let i = from;
  while (i < input.length) {
    const ch = input[i];
    if (ch === "\\") {
      i += 2; // skip escaped char, including \$
      continue;
    }
    if (delimiter === "$" && ch === "\n" && input[i + 1] === "\n") {
      return -1; // inline maths never spans a blank line
    }
    if (input.startsWith(delimiter, i)) {
      // For inline `$`, a `$$` is not a valid closer.
      if (delimiter === "$" && input[i + 1] === "$") return -1;
      return i;
    }
    i += 1;
  }
  return -1;
}

/**
 * True if the markup looks structurally sound: every `$…$` / `$$…$$` pair is
 * closed, braces inside maths balance, no LaTeX leaks into prose, and no
 * prose was swallowed into maths (a sign of mismatched delimiters).
 */
export function isWellFormedMathText(input: string): boolean {
  const segments = parseMathText(input);
  for (const segment of segments) {
    if (segment.kind === "text") {
      if (/(^|[^\\])\$/.test(segment.value)) return false;
      if (/\\[A-Za-z]{2,}|[\^_]\{/.test(segment.value)) return false;
    } else {
      if (!hasBalancedBraces(segment.value)) return false;
      if (containsVietnamese(stripTextCommands(segment.value))) return false;
    }
  }
  return true;
}

/** Removes \text{…}-style groups, where prose inside maths is legitimate. */
function stripTextCommands(tex: string): string {
  return tex.replace(/\\(?:text|mathrm|textbf|operatorname)\{[^}]*\}/g, "");
}

function hasBalancedBraces(tex: string): boolean {
  let depth = 0;
  for (let i = 0; i < tex.length; i++) {
    const ch = tex[i];
    if (ch === "\\") {
      i += 1;
      continue;
    }
    if (ch === "{") depth += 1;
    if (ch === "}") depth -= 1;
    if (depth < 0) return false;
  }
  return depth === 0;
}

// ---------------------------------------------------------------------------
// LaTeX → readable plain text (for list previews, accessibility, fallbacks)
// ---------------------------------------------------------------------------

const SYMBOLS: Record<string, string> = {
  le: "≤", leq: "≤", ge: "≥", geq: "≥", ne: "≠", neq: "≠", approx: "≈",
  pm: "±", mp: "∓", times: "×", cdot: "·", div: "÷", infty: "∞",
  pi: "π", alpha: "α", beta: "β", gamma: "γ", delta: "δ", Delta: "Δ",
  theta: "θ", lambda: "λ", mu: "μ", sigma: "σ", varphi: "φ", phi: "φ", omega: "ω",
  Rightarrow: "⇒", Leftrightarrow: "⇔", rightarrow: "→", to: "→", Leftarrow: "⇐",
  in: "∈", notin: "∉", subset: "⊂", cup: "∪", cap: "∩", emptyset: "∅", varnothing: "∅",
  forall: "∀", exists: "∃", perp: "⊥", parallel: "∥", angle: "∠", triangle: "△",
  circ: "°", degree: "°", sim: "∼", cong: "≅", equiv: "≡", mid: "|",
  mathbb: "", left: "", right: "", quad: " ", qquad: "  ", ",": " ", ";": " ", "!": "",
  ldots: "…", cdots: "⋯", dots: "…", backslash: "\\", "%": "%", "{": "{", "}": "}",
  "$": "$", "#": "#", "&": "&", "_": "_",
  displaystyle: "", limits: "", text: "", mathrm: "", mathbf: "", textbf: "", operatorname: "",
};

const BLACKBOARD: Record<string, string> = { R: "ℝ", N: "ℕ", Z: "ℤ", Q: "ℚ", C: "ℂ" };

const SUPERSCRIPTS: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  "+": "⁺", "-": "⁻", "=": "⁼", "(": "⁽", ")": "⁾", n: "ⁿ", i: "ⁱ", x: "ˣ",
};
const SUBSCRIPTS: Record<string, string> = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
  "+": "₊", "-": "₋", "=": "₌", "(": "₍", ")": "₎",
};

function toScript(value: string, table: Record<string, string>, fallbackPrefix: string): string {
  const chars = [...value];
  if (chars.length > 0 && chars.every((c) => table[c] !== undefined)) {
    return chars.map((c) => table[c]).join("");
  }
  return value.length === 1 ? `${fallbackPrefix}${value}` : `${fallbackPrefix}(${value})`;
}

/** Reads one LaTeX argument starting at `i`: a `{group}` or a single token. */
function readArgument(tex: string, i: number): { value: string; end: number } {
  while (tex[i] === " ") i += 1;
  if (tex[i] === "{") {
    let depth = 0;
    for (let j = i; j < tex.length; j++) {
      if (tex[j] === "\\") {
        j += 1;
        continue;
      }
      if (tex[j] === "{") depth += 1;
      if (tex[j] === "}") {
        depth -= 1;
        if (depth === 0) return { value: tex.slice(i + 1, j), end: j + 1 };
      }
    }
    return { value: tex.slice(i + 1), end: tex.length };
  }
  if (tex[i] === "\\") {
    const match = /^\\([A-Za-z]+|.)/.exec(tex.slice(i));
    const token = match ? match[0] : "\\";
    return { value: token, end: i + token.length };
  }
  return { value: tex[i] ?? "", end: i + 1 };
}

function wrapIfCompound(value: string): string {
  return /^[\w.]+$/u.test(value) ? value : `(${value})`;
}

/** Converts a LaTeX maths expression to readable Unicode text. Best effort. */
export function latexToPlain(tex: string): string {
  let out = "";
  let i = 0;
  while (i < tex.length) {
    const ch = tex[i]!;
    if (ch === "^" || ch === "_") {
      const arg = readArgument(tex, i + 1);
      const inner = latexToPlain(arg.value);
      if (ch === "^" && (inner === "°" || inner === "′" || inner === "'")) {
        out += inner; // degrees / primes are already superscript glyphs
      } else {
        out += ch === "^" ? toScript(inner, SUPERSCRIPTS, "^") : toScript(inner, SUBSCRIPTS, "_");
      }
      i = arg.end;
      continue;
    }
    if (ch === "{" || ch === "}") {
      i += 1;
      continue;
    }
    if (ch === "&") {
      i += 1;
      continue;
    }
    if (ch !== "\\") {
      out += ch === "~" ? " " : ch;
      i += 1;
      continue;
    }

    if (tex[i + 1] === "\\") {
      out += "; ";
      i += 2;
      continue;
    }
    const match = /^\\([A-Za-z]+|.)/.exec(tex.slice(i));
    const name = match?.[1] ?? "";
    i += (match?.[0].length ?? 1);

    switch (name) {
      case "frac":
      case "dfrac":
      case "tfrac": {
        const num = readArgument(tex, i);
        const den = readArgument(tex, num.end);
        out += `${wrapIfCompound(latexToPlain(num.value))}/${wrapIfCompound(latexToPlain(den.value))}`;
        i = den.end;
        break;
      }
      case "sqrt": {
        let index = "";
        if (tex[i] === "[") {
          const close = tex.indexOf("]", i);
          if (close !== -1) {
            index = tex.slice(i + 1, close);
            i = close + 1;
          }
        }
        const arg = readArgument(tex, i);
        const radicand = latexToPlain(arg.value);
        const prefix = index === "3" ? "∛" : index === "4" ? "∜" : index ? `${toScript(index, SUPERSCRIPTS, "")}√` : "√";
        out += prefix + wrapIfCompound(radicand);
        i = arg.end;
        break;
      }
      case "widehat":
      case "hat": {
        const arg = readArgument(tex, i);
        out += `∠${latexToPlain(arg.value)}`;
        i = arg.end;
        break;
      }
      case "overline":
      case "vec":
      case "overrightarrow": {
        const arg = readArgument(tex, i);
        out += latexToPlain(arg.value);
        i = arg.end;
        break;
      }
      case "mathbb": {
        const arg = readArgument(tex, i);
        out += BLACKBOARD[arg.value] ?? arg.value;
        i = arg.end;
        break;
      }
      case "text":
      case "mathrm":
      case "textbf":
      case "mathbf":
      case "operatorname": {
        const arg = readArgument(tex, i);
        out += arg.value;
        i = arg.end;
        break;
      }
      case "begin":
      case "end": {
        const arg = readArgument(tex, i);
        if (name === "begin" && arg.value === "cases") out += "{ ";
        i = arg.end;
        break;
      }
      default:
        if (SYMBOLS[name] !== undefined) {
          out += SYMBOLS[name];
        } else if (/^[a-z]+$/.test(name)) {
          out += name; // \sin, \cos, \log, … read fine as words
        }
    }
  }
  return out.replace(/[ \t]+/g, " ").trim();
}

/** Converts a whole formatted problem to readable plain text. */
export function mathTextToPlain(input: string): string {
  return parseMathText(input)
    .map((segment) => (segment.kind === "text" ? segment.value : latexToPlain(segment.value)))
    .join("")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

// Control characters (except \n and \t), zero-width chars, BOM, and Unicode line/paragraph separators.
const INVISIBLE_CHARS = new RegExp("[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F\\u200B-\\u200F\\u2028\\u2029\\uFEFF]", "g");

/**
 * Normalizes user- or model-provided text: Unicode NFC (Vietnamese diacritics
 * can arrive decomposed, which breaks search and rendering), strips control
 * characters, normalizes newlines, and collapses runs of blank lines.
 */
export function normalizeProblemText(input: string): string {
  return input
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(INVISIBLE_CHARS, "")
    .replace(/\t/g, " ")
    .replace(/[ ]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Characters that only occur in Vietnamese among the languages we expect. */
const VIETNAMESE_CHARS =
  /[ăâđêôơưĂÂĐÊÔƠƯàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/i;

export function containsVietnamese(input: string): boolean {
  return VIETNAMESE_CHARS.test(input.normalize("NFC"));
}
