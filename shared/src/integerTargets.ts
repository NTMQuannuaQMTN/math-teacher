import { integerPolynomial, integerPolynomialValue } from "./integerPolynomial";

/**
 * Two kinds of integer questions whose answer can be computed or checked exactly, so a wrong answer is never served
 * (training run 2026-10-14, held-out: "chữ số tận cùng của 2^2026 + 3^2026" answered 9 instead of 3; "n² + 4n + 97 là số
 * chính phương" answered n ∈ {0; 3} instead of {12; 44} — both shown as "not checkable").
 *
 *  1. "chữ số tận cùng / hai chữ số tận cùng / số dư khi chia E cho m" for a closed integer expression E (sums, products,
 *     huge powers): E mod m by modular exponentiation — exact.
 *  2. "Tìm các số (tự nhiên|nguyên|nguyên dương) n sao cho P(n) là số chính phương | là số nguyên tố": every value the
 *     answer states is substituted back, and an exhaustive search of a window finds values the answer misses. This is a
 *     check, not a proof of completeness beyond the window.
 */
export type IntegerTarget =
  | { kind: "residue"; modulus: bigint; value: bigint; what: "last" | "last2" | "remainder"; summary: string }
  | { kind: "predicate"; variable: string; predicate: "square" | "prime"; poly: NonNullable<ReturnType<typeof integerPolynomial>>; domain: "integer" | "natural" | "positive"; window: number; found: bigint[]; summary: string };

const abs = (a: bigint) => (a < 0n ? -a : a);
const mod = (a: bigint, m: bigint) => ((a % m) + m) % m;
function powMod(b: bigint, e: bigint, m: bigint): bigint {
  let r = 1n % m, x = mod(b, m);
  while (e > 0n) {
    if (e & 1n) r = (r * x) % m;
    x = (x * x) % m;
    e >>= 1n;
  }
  return r;
}

/** A closed integer expression (LaTeX allowed) evaluated modulo m; exponents are evaluated exactly. Null if not one. */
export function expressionMod(latex: string, m: bigint): bigint | null {
  const s = latex.replace(/\\left|\\right|\\,|\\;|\s+/g, "").replace(/\\cdot|\\times/g, "*").replace(/\{/g, "(").replace(/\}/g, ")");
  if (!/^[\d+\-*^()]+$/.test(s) || !/\d/.test(s)) return null;
  let i = 0;
  const peek = () => s[i];
  // exact value (for exponents) and residue (for the result) are computed together
  type V = { exact: bigint | null; r: bigint };
  const BIG = 10n ** 18n;
  const lift = (exact: bigint | null, r: bigint): V => ({ exact: exact !== null && abs(exact) < BIG ? exact : null, r: mod(r, m) });
  const atom = (): V => {
    if (peek() === "(") { i++; const v = sum(); if (s[i++] !== ")") throw Error("paren"); return v; }
    if (peek() === "-") { i++; const v = atom(); return lift(v.exact === null ? null : -v.exact, -v.r); }
    const d = /^\d+/.exec(s.slice(i));
    if (!d) throw Error("num");
    i += d[0].length;
    const n = BigInt(d[0]);
    return lift(n, n);
  };
  const power = (): V => {
    const b = atom();
    if (peek() === "^") {
      i++;
      const e = power();
      if (e.exact === null || e.exact < 0n) throw Error("exponent");
      const exact = b.exact !== null && e.exact < 64n && abs(b.exact) < 10n ** 6n ? b.exact ** e.exact : null;
      return lift(exact, powMod(b.r, e.exact, m));
    }
    return b;
  };
  const product = (): V => {
    let v = power();
    while (peek() === "*") { i++; const w = power(); v = lift(v.exact !== null && w.exact !== null ? v.exact * w.exact : null, v.r * w.r); }
    return v;
  };
  const sum = (): V => {
    let v = product();
    while (peek() === "+" || peek() === "-") {
      const op = s[i++];
      const w = product();
      v = op === "+" ? lift(v.exact !== null && w.exact !== null ? v.exact + w.exact : null, v.r + w.r) : lift(v.exact !== null && w.exact !== null ? v.exact - w.exact : null, v.r - w.r);
    }
    return v;
  };
  try {
    const v = sum();
    return i === s.length ? v.r : null;
  } catch {
    return null;
  }
}

function isPrime(n: bigint): boolean {
  if (n < 2n) return false;
  for (const p of [2n, 3n, 5n, 7n]) if (n % p === 0n) return n === p;
  for (let d = 11n; d * d <= n; d += 2n) if (n % d === 0n) return false;
  return true;
}
function isSquare(n: bigint): boolean {
  if (n < 0n) return false;
  let r = BigInt(Math.floor(Math.sqrt(Number(n))));
  while (r * r > n) r--;
  while ((r + 1n) * (r + 1n) <= n) r++;
  return r * r === n;
}

export function integerTarget(statement: string): IntegerTarget | null {
  const text = statement.normalize("NFC");
  if (/(?:^|\s)[a-e]\)/.test(text)) return null;
  const maths = [...text.matchAll(/\$([^$]+)\$/g)].map((x) => x[1]!.trim());
  // 1. last digit(s) / remainder of a closed expression
  const last2 = /hai chữ số tận cùng của\s*\$([^$]+)\$/iu.exec(text), last = /chữ số tận cùng của\s*\$([^$]+)\$/iu.exec(text);
  const rem = /số dư (?:khi chia|của phép chia)\s*\$([^$]+)\$\s*cho\s*\$?(\d+)\$?/iu.exec(text);
  const residue = (expr: string, m: bigint, what: "last" | "last2" | "remainder"): IntegerTarget | null => {
    if (!/\^/.test(expr) && !/[+*]/.test(expr)) return null; // a plain number needs no machine
    const v = expressionMod(expr, m);
    if (v === null) return null;
    const shown = what === "last2" ? String(v).padStart(2, "0") : String(v);
    return { kind: "residue", modulus: m, value: v, what, summary: `${what === "remainder" ? `Số dư khi chia cho ${m}` : what === "last2" ? "Hai chữ số tận cùng" : "Chữ số tận cùng"} (tính chính xác bằng lũy thừa theo môđun): ${shown}.` };
  };
  if (last2) return residue(last2[1]!, 100n, "last2");
  if (last) return residue(last[1]!, 10n, "last");
  if (rem) return residue(rem[1]!, BigInt(rem[2]!), "remainder");
  // 2. find all n with P(n) a perfect square / prime
  const ask = /tìm (?:tất cả )?(?:các )?(?:giá trị )?(?:số )?(tự nhiên|nguyên dương|nguyên)?\s*\$([a-z])\$\s*(?:sao cho|để)\s*\$([^$]+)\$\s*(?:là|cũng là)\s*(?:một\s+)?số\s*(chính phương|nguyên tố)/iu.exec(text);
  if (!ask || maths.length > 3) return null;
  const v = ask[2]!, poly = integerPolynomial(ask[3]!, v);
  if (!poly) return null;
  const domain = /nguyên dương/i.test(ask[1] ?? "") ? "positive" : /tự nhiên/i.test(ask[1] ?? "") ? "natural" : "integer";
  const predicate = /chính phương/i.test(ask[4]!) ? "square" : "prime";
  const window = predicate === "square" ? 20000 : 2000;
  const found: bigint[] = [];
  for (let n = domain === "integer" ? -window : domain === "natural" ? 0 : 1; n <= window; n++) {
    const val = integerPolynomialValue(poly, BigInt(n));
    if (predicate === "square" ? isSquare(val) : isPrime(val)) found.push(BigInt(n));
    if (found.length > 50) return null; // infinitely many / not a finite answer: say nothing
  }
  return { kind: "predicate", variable: v, predicate, poly, domain, window, found,
    summary: `Tìm kiếm vét cạn với |${v}| ≤ ${window}: ${found.length ? `${v} ∈ {${found.join("; ")}}` : "không có giá trị nào"} (kiểm tra số, không thay cho chứng minh).` };
}

/** Numbers stated in a final answer, ignoring powers and the expression itself ("2^{2026}" contributes nothing). */
function statedIntegers(answer: string): bigint[] {
  const t = answer.replace(/\$/g, " ").replace(/\d+\s*\^\s*\{?\s*\d+\s*\}?/g, " ").replace(/[−–]/g, "-");
  return [...t.matchAll(/(?<![\d.,^_a-zA-Z])-?\d+(?![\d.,]\d)/g)].map((m) => BigInt(m[0]));
}

export function integerTargetFeedback(statement: string, finalAnswer: string, target = integerTarget(statement)): string[] {
  if (!target) return [];
  if (target.kind === "residue") {
    const nums = statedIntegers(finalAnswer);
    const ok = nums.some((n) => n === target.value);
    return ok ? [] : [`the final answer does not state the value computed exactly by modular exponentiation (${target.summary}); re-derive it`];
  }
  const nothing = /không (?:có|tồn tại)/iu.test(finalAnswer);
  const claimed = nothing ? [] : statedIntegers(finalAnswer.replace(new RegExp(`.*?${target.variable}\\s*(?:=|\\\\in|∈)`, "s"), ""));
  const holds = (n: bigint) => {
    const val = integerPolynomialValue(target.poly, n);
    return target.predicate === "square" ? isSquare(val) : isPrime(val);
  };
  const wrong = claimed.filter((n) => !holds(n));
  const missing = target.found.filter((n) => !claimed.includes(n));
  if (!wrong.length && !missing.length) return [];
  return [`the values in the final answer do not match the condition (${target.summary})` + (wrong.length ? ` — fail the condition: ${wrong.join(", ")}` : "") + (missing.length ? ` — missing: ${missing.join(", ")}` : "")];
}
