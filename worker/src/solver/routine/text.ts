import { parseExpression, variablesOf } from "../../../../shared/src/expr";

/**
 * One plain spelling for routine-problem recognisers: LaTeX delimiters and commands, OCR unicode (x², −, ×, ≤) and
 * Vietnamese abbreviations all map to the same flat text, so a recogniser looks for the mathematical features of a
 * task anywhere in the sentence instead of one exact wording.
 */
export function flatten(text: string): string {
  let t = text.normalize("NFC");
  t = t.replace(/\$\$?/g, " ").replace(/\\left|\\right|\\displaystyle|\\[,;!]|\\quad|\\qquad|~/g, " ");
  t = t.replace(/\\text\{([^{}]*)\}|\\mathrm\{([^{}]*)\}|\\operatorname\{([^{}]*)\}/g, (_, a, b, c) => a ?? b ?? c ?? "");
  for (let i = 0; i < 3; i++) t = t.replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, "($1)/($2)");
  t = t.replace(/\\sqrt\{([^{}]*)\}/g, "sqrt($1)").replace(/\\(?:cdot|times)|[·×]/g, "*").replace(/\\ldots|\\cdots|…/g, "...");
  t = t.replace(/\\gcd/g, "gcd").replace(/\\(?:operatorname\s*)?lcm/g, "lcm").replace(/\\(?:le|leq)\b/g, "≤").replace(/\\(?:ge|geq)\b/g, "≥")
    .replace(/\\(?:ne|neq)\b/g, "≠").replace(/\\vdots/g, " chia hết cho ").replace(/\\(?:mid)\b/g, "|").replace(/\\pmod\{([^{}]*)\}/g, "(mod $1)");
  t = t.replace(/\\widehat\{([^{}]*)\}|\\angle\s*/g, (_, a) => (a ? `góc ${a}` : "góc ")).replace(/\\circ/g, "°").replace(/\^\{?°\}?/g, "°");
  t = t.replace(/\\parallel/g, "∥").replace(/\\perp/g, "⊥").replace(/\\in\b/g, "∈");
  t = t.replace(/[−–]/g, "-").replace(/[²]/g, "^2").replace(/[³]/g, "^3").replace(/[⁴]/g, "^4").replace(/[⁵]/g, "^5");
  t = t.replace(/\{/g, "(").replace(/\}/g, ")").replace(/\\/g, "");
  t = t.replace(/\^\((\d+)\)/g, "^$1");
  // "ƯCLN"/"BCNN" are the usual school abbreviations.
  t = t.replace(/ƯCLN/g, "ước chung lớn nhất").replace(/BCNN/g, "bội chung nhỏ nhất");
  t = t.replace(/\s+/g, " ").replace(/\s*([=+*^/<>≤≥≠|])\s*/g, "$1").replace(/(\S)\s+-\s+(\S)/g, "$1-$2").trim();
  return t;
}

/** Integer value of a closed numeric expression (digits, + - * ^, parentheses); null when it isn't one. */
export function integerValue(expr: string): bigint | null {
  const s = expr.replace(/\s+/g, "");
  if (!/^[\d+\-*^()]+$/.test(s) || s.length > 60) return null;
  let i = 0;
  const peek = () => s[i];
  const atom = (): bigint => {
    if (peek() === "(") {
      i++;
      const v = sum();
      if (s[i++] !== ")") throw Error("paren");
      return v;
    }
    if (peek() === "-") {
      i++;
      return -atom();
    }
    const m = /^\d+/.exec(s.slice(i));
    if (!m) throw Error("number");
    i += m[0].length;
    return BigInt(m[0]);
  };
  const power = (): bigint => {
    const b = atom();
    if (peek() === "^") {
      i++;
      const e = power();
      if (e < 0n || e > 4000n) throw Error("exponent");
      return b ** e;
    }
    return b;
  };
  const product = (): bigint => {
    let v = power();
    while (peek() === "*") {
      i++;
      v *= power();
    }
    return v;
  };
  const sum = (): bigint => {
    let v = product();
    while (peek() === "+" || peek() === "-") {
      const op = s[i++];
      v = op === "+" ? v + product() : v - product();
    }
    return v;
  };
  try {
    const v = sum();
    return i === s.length ? v : null;
  } catch {
    return null;
  }
}

/** A polynomial in two named variables with integer coefficients: key "i,j" → coefficient of x^i y^j. */
export type Bivariate = Map<string, bigint>;

export function bivariate(expression: string, x: string, y: string): Bivariate | null {
  try {
    const vars = [...variablesOf(expression)];
    if (vars.some((v) => v !== x && v !== y)) return null;
    const mul = (a: Bivariate, b: Bivariate): Bivariate => {
      const out: Bivariate = new Map();
      for (const [ka, va] of a)
        for (const [kb, vb] of b) {
          const [i1, j1] = ka.split(",").map(Number) as [number, number];
          const [i2, j2] = kb.split(",").map(Number) as [number, number];
          const k = `${i1 + i2},${j1 + j2}`;
          out.set(k, (out.get(k) ?? 0n) + va * vb);
        }
      return out;
    };
    const add = (a: Bivariate, b: Bivariate, sign = 1n): Bivariate => {
      const out = new Map(a);
      for (const [k, v] of b) out.set(k, (out.get(k) ?? 0n) + sign * v);
      return out;
    };
    const compile = (node: ReturnType<typeof parseExpression>): Bivariate => {
      if (node.t === "num") {
        if (!Number.isSafeInteger(node.v)) throw Error("integer");
        return new Map([["0,0", BigInt(node.v)]]);
      }
      if (node.t === "var") return new Map([[node.name === x ? "1,0" : "0,1", 1n]]);
      if (node.t === "neg") return add(new Map(), compile(node.a), -1n);
      if (node.t !== "bin") throw Error("op");
      if (node.op === "^") {
        if (node.b.t !== "num" || !Number.isInteger(node.b.v) || node.b.v < 1 || node.b.v > 4) throw Error("pow");
        const a = compile(node.a);
        let p: Bivariate = new Map([["0,0", 1n]]);
        for (let k = 0; k < node.b.v; k++) p = mul(p, a);
        return p;
      }
      const a = compile(node.a), b = compile(node.b);
      if (node.op === "+") return add(a, b);
      if (node.op === "-") return add(a, b, -1n);
      if (node.op === "*") return mul(a, b);
      throw Error("op");
    };
    const p = compile(parseExpression(expression));
    for (const [k, v] of p) if (v === 0n) p.delete(k);
    return p;
  } catch {
    return null;
  }
}

export const coef = (p: Bivariate, i: number, j: number) => p.get(`${i},${j}`) ?? 0n;

export function bivariateValue(p: Bivariate, x: bigint, y: bigint): bigint {
  let v = 0n;
  for (const [k, c] of p) {
    const [i, j] = k.split(",").map(Number) as [number, number];
    v += c * x ** BigInt(i) * y ** BigInt(j);
  }
  return v;
}

export const abs = (a: bigint) => (a < 0n ? -a : a);
export function gcd(a: bigint, b: bigint): bigint {
  a = abs(a);
  b = abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}
export const mod = (a: bigint, m: bigint) => ((a % m) + m) % m;
export function isqrt(n: bigint): bigint {
  if (n < 0n) return -1n;
  let r = BigInt(Math.floor(Math.sqrt(Number(n))));
  while (r * r > n) r--;
  while ((r + 1n) * (r + 1n) <= n) r++;
  return r;
}
export function positiveDivisors(n: bigint): bigint[] {
  n = abs(n);
  const out: bigint[] = [];
  for (let d = 1n; d * d <= n; d++) if (n % d === 0n) out.push(d, n / d);
  return [...new Set(out)].sort((a, b) => (a < b ? -1 : 1));
}

/** "số nguyên" / "số tự nhiên" / "số nguyên dương" (and English) → the domain of the unknowns. */
export type Domain = "integer" | "natural" | "positive";
export function domainOf(t: string): Domain | null {
  if (/nguyên dương|positive integer/i.test(t)) return "positive";
  if (/tự nhiên|natural number/i.test(t)) return "natural";
  if (/số nguyên|\bintegers?\b/i.test(t)) return "integer";
  return null;
}
export const inDomain = (d: Domain, v: bigint) => (d === "integer" ? true : d === "natural" ? v >= 0n : v >= 1n);
export const domainWord = (d: Domain) => (d === "integer" ? "nguyên" : d === "natural" ? "tự nhiên" : "nguyên dương");

/** Shows a polynomial expression the way the student wrote it, as LaTeX (n^2 stays n^2, * becomes juxtaposition). */
export function latex(expr: string): string {
  return expr.replace(/\^(\d{2,})/g, "^{$1}").replace(/\*/g, "\\cdot ").replace(/sqrt\(([^()]*)\)/g, "\\sqrt{$1}");
}
export const signed = (v: bigint) => (v < 0n ? `-${abs(v)}` : `+${v}`);

/**
 * OCR'd and pasted problems usually keep their numbering ("Bài 2.", "Câu 3:", "Bài 1 (1,5 điểm).") — the solvers, which
 * read the task itself, must not see it (a stray "2" is a number of the problem to them).
 */
export function stripTaskLabel(text: string): string {
  const stripped = text.replace(/^\s*(?:\*\*)?(?:Bài|Câu|Problem|Exercise|Question|Ví dụ)\s*\d+[a-z]?(?:\*\*)?\s*(?:\(\s*\d+(?:[.,]\d+)?\s*điểm\s*\))?\s*[.:)]?\s*(?:\(\s*\d+(?:[.,]\d+)?\s*điểm\s*\)\s*[.:]?\s*)?/iu, "");
  return stripped.trim().length >= 8 ? stripped : text;
}

/**
 * A system as OCR writes it — the brace read as "☐"/"⎧"/"{" boxes, or equations on separate lines or after ";" — becomes
 * one \begin{cases} system, the form the system solvers read. Only plain equations in x, y (or a, b…) are joined.
 */
export function joinSystem(text: string): string {
  const m = /^(.*?hệ phương trình\s*:?\s*)([\s\S]+)$/iu.exec(text);
  if (!m || /\\begin\{cases\}|\$/.test(m[2]!)) return text;
  const parts = m[2]!.split(/\s*(?:[☐□⎧⎨⎩{]|\n|;)\s*|\s+(?:và|and)\s+/u).map((s) => s.trim().replace(/[.。]$/, "")).filter(Boolean);
  if (parts.length < 2 || parts.length > 3 || !parts.every((p) => /^[0-9a-z+\-−*/^²³().\s]+=[0-9a-z+\-−*/^²³().\s]+$/iu.test(p))) return text;
  const tex = parts.map((p) => p.replace(/−/g, "-").replace(/²/g, "^2").replace(/³/g, "^3").replace(/\s+/g, ""));
  return `${m[1]!.trimEnd()} $\\begin{cases}${tex.join("\\\\")}\\end{cases}$.`;
}

const SUPERSCRIPT: Record<string, string> = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9" };
/**
 * Scanned papers write numbers outside $…$ and powers with Unicode superscripts: "chia hết cho 16", "chia hết cho 24²"
 * (PTNK 2026 Câu 3 from a photo, 2026-10-15: the certified solver handles "$16$" / "$24^{2}$" but not these, so the
 * model was asked instead and failed). Outside formulas, "a²" becomes "$a^{2}$" and a bare number after a divisibility
 * or remainder phrase becomes "$n$". The student still sees the statement as scanned.
 */
export function wrapBareNumbers(text: string): string {
  return text.replace(/(\$[^$]*\$)|([^$]+)/g, (whole, math: string | undefined, prose: string | undefined) => {
    if (math) return whole;
    return prose!
      .replace(/(\d+|[A-Za-z])([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/gu, (_m, b: string, sup: string) => `$${b}^{${[...sup].map((c) => SUPERSCRIPT[c]).join("")}}$`)
      .replace(/(chia hết cho|chia cho|không chia hết cho|bội của|ước của|dư)\s+(\d+)(?![\d$^]|\s*[⁰¹²³⁴⁵⁶⁷⁸⁹])/giu, "$1 $$$2$$");
  });
}
