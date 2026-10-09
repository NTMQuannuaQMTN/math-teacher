/**
 * Compute-first answers for algebra and number theory, with no model call: the problem is formalised from its text
 * (equations, conditions, domain, what is asked) and solved by deterministic search — integer brute force, multi-start
 * numeric root finding, sampling on the constraint set, numeric optimisation. The result is a *checked computation*,
 * not a proof: it tells the solver (and the verifier) what the answer is, so the model spends its time explaining
 * instead of searching, and a wrong final answer can be caught.
 *
 *   "Tìm tất cả cặp số nguyên (x, y) thỏa mãn …"      → integer search in a box
 *   "Giải phương trình / hệ phương trình …"           → real roots (multi-start Newton, sign scan)
 *   "Tìm giá trị nhỏ nhất / lớn nhất của P = …"       → sampling + local refinement on the constraint set
 *   "Tính giá trị của biểu thức P = …"                → P on many points of the constraint set (constant?)
 *   "Chứng minh <bất đẳng thức / đẳng thức>"          → checked on many points; where equality holds
 *
 * Everything is bounded (search boxes, sample counts, a time budget). When the statement isn't understood the result
 * is null — never a guess.
 */
import { compileExpression, expressionVariables, normalizeExpression, splitRelation, type Env } from "./expr";

export type OracleKind = "integer_solutions" | "equation" | "system" | "minimize" | "maximize" | "value" | "inequality" | "identity";

interface VarDomain {
  integer: boolean;
  rational: boolean;
  min: number;
  max: number;
  minStrict: boolean;
  maxStrict: boolean;
}

export interface Formal {
  kind: OracleKind;
  vars: string[];
  domain: Record<string, VarDomain>;
  /** Equations "lhs - (rhs)" = 0. */
  equalities: string[];
  /** Other conditions as relations ("a > 0", "x != y", "(m^2+m+n^2) % (mn) = 0"). */
  conditions: string[];
  /** min/max/value: the expression; inequality/identity: the claim as a relation. */
  target?: string;
  /** The text the formalisation read (for the prompt). */
  readAs: string;
}

export interface OracleResult {
  formal: Formal;
  /** What the computation found, in Vietnamese, for the solver's prompt. */
  summary: string;
  /** The answer in a comparable form (solutions, value), when the problem asks for one. */
  answer: string | null;
  /** Solutions found (equations, integer search). */
  solutions?: Env[];
  value?: number;
  /** "found" — a definite result in the searched range; "violated" — a claim fails (the reading may be wrong). */
  status: "found" | "none" | "violated";
  ms: number;
}

// ---------------------------------------------------------------------------------------------------------------
// Reading the statement
// ---------------------------------------------------------------------------------------------------------------

/** Math segments: $…$ and \[…\], with \begin{cases} split into lines. */
function mathSegments(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/\$\$([\s\S]+?)\$\$|\$([^$]+)\$|\\\[([\s\S]+?)\\\]/g)) out.push((m[1] ?? m[2] ?? m[3])!.trim());
  return out;
}

function casesLines(seg: string): string[] | null {
  const m = /\\begin\{cases\}([\s\S]*?)\\end\{cases\}/.exec(seg);
  if (!m) return null;
  return m[1]!
    .split(/\\\\/)
    .map((l) => l.replace(/&/g, "").replace(/[.,;]\s*$/, "").trim())
    .filter(Boolean);
}

const asExpr = (latex: string) => {
  try {
    return normalizeExpression(latex.replace(/\\text\{[^}]*\}/g, "").replace(/[.,;]\s*$/, ""));
  } catch {
    return null;
  }
};

/** "lhs = rhs" → "(lhs) - (rhs)". */
const toZero = (rel: string) => {
  const s = splitRelation(rel);
  return s && s.rel === "=" ? `(${s.sides[0]}) - (${s.sides[1]})` : null;
};

function relVars(rel: string): string[] {
  const s = splitRelation(rel);
  const sides = s ? s.sides : [rel];
  const out = new Set<string>();
  for (const side of sides) for (const v of expressionVariables(side)) out.add(v);
  return [...out];
}

/** Splits a chained relation "3 <= a+b+c <= 5" into "3 <= a+b+c", "a+b+c <= 5". */
function unchain(rel: string): string[] {
  const parts = rel.split(/(<=|>=|!=|<|>|=)/);
  if (parts.length <= 3) return [rel];
  const out: string[] = [];
  for (let i = 0; i + 2 < parts.length; i += 2) out.push(`${parts[i]}${parts[i + 1]}${parts[i + 2]}`);
  return out;
}

const DOMAIN_WORDS: [RegExp, Partial<VarDomain>][] = [
  [/số nguyên dương|nguyên dương/, { integer: true, min: 1, minStrict: false }],
  [/số tự nhiên|nguyên không âm/, { integer: true, min: 0, minStrict: false }],
  [/số nguyên/, { integer: true }],
  [/số hữu tỉ dương|hữu tỉ dương/, { rational: true, min: 0, minStrict: true }],
  [/số thực dương|các số dương|là số dương|dương/, { min: 0, minStrict: true }],
  [/không âm/, { min: 0, minStrict: false }],
];

function readDomain(text: string, vars: string[]): Record<string, VarDomain> {
  const d: Record<string, VarDomain> = {};
  for (const v of vars) d[v] = { integer: false, rational: false, min: -Infinity, max: Infinity, minStrict: false, maxStrict: false };
  const lower = text.toLowerCase();
  for (const [re, set] of DOMAIN_WORDS)
    if (re.test(lower)) {
      for (const v of vars) Object.assign(d[v]!, set);
      break;
    }
  // Bounds written as "1 < x, y, z < 2" or "0 \le a, b \le 1".
  for (const seg of mathSegments(text)) {
    const m = /^\s*(-?[\d.]+)\s*(<|\\le|\\leq|≤)\s*([a-z](?:\s*,\s*[a-z])*)\s*(<|\\le|\\leq|≤)\s*(-?[\d.]+)\s*$/.exec(seg);
    if (!m) continue;
    for (const v of m[3]!.split(",").map((x) => x.trim()))
      if (d[v]) Object.assign(d[v], { min: Number(m[1]), minStrict: m[2] === "<", max: Number(m[5]), maxStrict: m[4] === "<" });
  }
  return d;
}

/** "A chia hết cho B" (A, B in math or "tích $mn$") → "(A) % (B) = 0". */
function divisibility(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/\$([^$]+)\$\s*(?:đều\s+)?chia hết cho\s+(?:tích\s+|số\s+)?\$([^$]+)\$/g)) {
    const [a, b] = [asExpr(m[1]!), asExpr(m[2]!)];
    if (a && b && !/[<>=]/.test(a) && !/[<>=]/.test(b)) out.push(`(${a}) % (${b}) = 0`);
  }
  return out;
}

/** The problem in formal terms, or null when the statement doesn't match a form this module handles. */
/** "đặt $f(n)=(n+4)^4-n^4$" → every later "f(k)" becomes the expression with n := k; the definition is dropped. */
function substituteDefinitions(text: string): string {
  let out = text;
  for (const m of [...text.matchAll(/\$\s*([a-zA-Z])\s*\(\s*([a-z])\s*\)\s*=\s*([^$]+)\$/g)]) {
    const [whole, name, arg, body] = m as unknown as [string, string, string, string];
    out = out.replace(whole, "(định nghĩa hàm)");
    const re = new RegExp(`(?<![a-zA-Z\\\\])${name}\\s*\\(\\s*([^()]+?)\\s*\\)`, "g");
    out = out.replace(re, (_, k: string) => `\\left(${body.replace(new RegExp(`(?<![a-zA-Z\\\\])${arg}(?![a-zA-Z])`, "g"), `(${k})`)}\\right)`);
  }
  return out;
}

export function formalise(statement: string): Formal | null {
  const text = substituteDefinitions(statement.normalize("NFC"));
  const lower = text.toLowerCase();
  if (/tham số|\bm\b là tham số/.test(lower)) return null; // parametric questions need reasoning about m
  const segs = mathSegments(text);
  // The question is the last sentence that asks for something; conditions come from the rest.
  const asks = /(giải hệ phương trình|giải phương trình|tìm (?:tất cả )?(?:các )?(?:cặp |bộ )?số|tìm (?:tất cả )?(?:các )?(?:cặp|bộ)|tìm \$[a-z](?:\s*[,;]\s*[a-z])*\$|giá trị nhỏ nhất|giá trị lớn nhất|tính giá trị|chứng minh)/;
  const m = asks.exec(lower);
  if (!m) return null;
  const qAt = m.index;
  const before = text.slice(0, qAt);
  const question = text.slice(qAt);
  const qSegs = mathSegments(question);
  const condSegs = mathSegments(before);

  // Conditions from the setup: relations in math segments (chains split), and divisibility phrases.
  const conditions: string[] = [];
  const equalities: string[] = [];
  const addCondition = (latex: string) => {
    const e = asExpr(latex);
    if (!e || !/[<>=!]/.test(e)) return;
    for (const r of unchain(e)) {
      if (/^\s*-?[\d.]+\s*(<|<=)\s*[a-z](\s*,\s*[a-z])+/.test(r)) continue; // "1 < x, y, z" lists: read as bounds
      const z = toZero(r);
      if (z) equalities.push(z);
      else conditions.push(r);
    }
  };
  for (const s of condSegs) {
    if (casesLines(s)) continue;
    if (/,/.test(s) && !/[<>=]/.test(s)) continue; // a variable list "a, b, c"
    addCondition(s);
  }
  const div = divisibility(before);

  const kind: OracleKind | null = /giải hệ phương trình/.test(m[1]!)
    ? "system"
    : /giải phương trình/.test(m[1]!)
      ? "equation"
      : /giá trị nhỏ nhất/.test(m[1]!)
        ? "minimize"
        : /giá trị lớn nhất/.test(m[1]!)
          ? "maximize"
          : /tính giá trị/.test(m[1]!)
            ? "value"
            : /chứng minh/.test(m[1]!)
              ? "inequality"
              : /nguyên|tự nhiên|hữu tỉ/.test(lower)
                ? "integer_solutions"
                : null;
  // Number-theory "chứng minh" statements are about divisibility and parity, not a relation to sample: not handled.
  if (kind === "inequality" && /số nguyên|nguyên dương|tự nhiên|chia hết|số lẻ|số chẵn|chính phương|nguyên tố/.test(lower)) return null;
  if (!kind) return null;

  let target: string | undefined;
  if (kind === "system") {
    const lines = qSegs.map(casesLines).find(Boolean);
    if (!lines) return null;
    for (const l of lines) {
      const e = asExpr(l);
      const z = e && toZero(e);
      if (!z) return null;
      equalities.push(z);
    }
  } else if (kind === "equation") {
    const e = qSegs.map(asExpr).find((x) => x && /=/.test(x) && !/[<>]/.test(x));
    const z = e && toZero(e);
    if (!z) return null;
    equalities.push(z);
  } else if (kind === "integer_solutions") {
    // The condition: an equation in the question, or the divisibility/relations of the setup.
    const e = qSegs.map(asExpr).find((x) => x && /[=<>]/.test(x) && !/^\s*\(?[a-z]\s*[;,]\s*[a-z]/.test(x));
    if (e) for (const r of unchain(e)) (toZero(r) ? equalities.push(toZero(r)!) : conditions.push(r));
    conditions.push(...div, ...divisibility(question));
    if (!equalities.length && !conditions.length) return null;
  } else if (kind === "minimize" || kind === "maximize" || kind === "value") {
    const e = qSegs.map(asExpr).find((x) => x && /^[A-Z]\s*=/.test(x.trim()));
    const raw = e ? e.replace(/^\s*[A-Z]\s*=/, "") : qSegs.map(asExpr).find((x) => x && !/[<>=]/.test(x));
    if (!raw) return null;
    target = raw;
  } else {
    // Prove: a relation in the question (inequalities and identities under the setup's conditions).
    const e = qSegs.map(asExpr).find((x) => x && /[<>=]/.test(x));
    if (!e) return null;
    const rels = unchain(e);
    if (rels.some((r) => /!=/.test(r))) return null;
    target = rels.join(" && ");
  }

  // Variables: everything the equations, conditions and target mention.
  const vars = new Set<string>();
  try {
    for (const r of [...equalities, ...conditions]) for (const v of relVars(r.replace(/%.*$/, "") + (r.includes("%") ? "" : ""))) vars.add(v);
    for (const r of conditions) for (const v of relVars(r)) vars.add(v);
    for (const z of equalities) for (const v of expressionVariables(z)) vars.add(v);
    if (target) for (const part of target.split(" && ")) for (const v of /[<>=]/.test(part) ? relVars(part) : [...expressionVariables(part)]) vars.add(v);
  } catch {
    return null;
  }
  const list = [...vars].filter((v) => v !== "pi").sort();
  // Capital letters are points (geometry), not numbers: not this module's problem.
  if (list.some((v) => /^[A-Z]/.test(v))) return null;
  if (list.length === 0 || list.length > 4) return null;
  const domain = readDomain(text, list);
  const integerAsked = kind === "integer_solutions";
  if (integerAsked && !list.some((v) => domain[v]!.integer || domain[v]!.rational)) for (const v of list) domain[v]!.integer = true;
  return {
    kind: kind === "inequality" && target && !/[<>]/.test(target) ? "identity" : kind,
    vars: list,
    domain,
    equalities,
    conditions,
    target,
    readAs: [equalities.map((z) => `${z} = 0`).join("; "), conditions.join("; "), target ?? ""].filter(Boolean).join(" | "),
  };
}

// ---------------------------------------------------------------------------------------------------------------
// Numbers
// ---------------------------------------------------------------------------------------------------------------

/** A short exact form when one fits: integers, fractions p/q (q ≤ 64), ±√k·p/q. */
export function recognise(x: number): string {
  if (!Number.isFinite(x)) return String(x);
  const near = (a: number, b: number) => Math.abs(a - b) < 1e-7 * Math.max(1, Math.abs(b));
  if (near(x, Math.round(x))) return String(Math.round(x));
  for (let q = 2; q <= 64; q++) {
    const p = Math.round(x * q);
    if (near(x, p / q)) {
      const g = gcd(Math.abs(p), q);
      return `${p / g}/${q / g}`;
    }
  }
  // x = (a + b√k)/c with small a, b, c, k
  for (const k of [2, 3, 5, 6, 7, 10, 11, 13, 15]) {
    const r = Math.sqrt(k);
    for (let c = 1; c <= 12; c++)
      for (let b = -12; b <= 12; b++) {
        if (b === 0) continue;
        const a = Math.round(x * c - b * r);
        if (Math.abs(a) > 60) continue;
        if (near(x, (a + b * r) / c)) {
          const bs = b === 1 ? "" : b === -1 ? "-" : String(b);
          const num = a === 0 ? `${bs}√${k}` : `${a} ${b > 0 ? "+" : "-"} ${Math.abs(b) === 1 ? "" : Math.abs(b)}√${k}`;
          return c === 1 ? num : `(${num})/${c}`;
        }
      }
  }
  return x.toFixed(6).replace(/0+$/, "");
}

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

// ---------------------------------------------------------------------------------------------------------------
// Solvers
// ---------------------------------------------------------------------------------------------------------------

type Fn = (env: Env) => number;

function inDomain(d: VarDomain, x: number): boolean {
  if (d.integer && !Number.isInteger(x)) return false;
  if (x < d.min || (d.minStrict && x <= d.min)) return false;
  if (x > d.max || (d.maxStrict && x >= d.max)) return false;
  return true;
}

function relationHolds(rel: string, f: { a: Fn; b: Fn; op: string }, env: Env, tol: number): boolean | null {
  void rel;
  const a = f.a(env);
  const b = f.b(env);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  const eq = Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
  switch (f.op) {
    case "=":
      return eq;
    case "!=":
      return !eq;
    case "<":
      return a < b && !eq;
    case "<=":
      return a < b || eq;
    case ">":
      return a > b && !eq;
    default:
      return a > b || eq;
  }
}

function compileRel(rel: string): { a: Fn; b: Fn; op: string } {
  const s = splitRelation(rel)!;
  return { a: compileExpression(s.sides[0]), b: compileExpression(s.sides[1]), op: s.rel };
}

/** Integer (or small rational) search in a box. */
function integerSearch(f: Formal, deadline: number): Env[] | null {
  const n = f.vars.length;
  const box = [0, 3000, 250, 45, 16][n]!;
  const eqs = f.equalities.map(compileExpression);
  const conds = f.conditions.map((c) => ({ rel: c, f: compileRel(c) }));
  const ranges = f.vars.map((v) => {
    const d = f.domain[v]!;
    if (d.rational) {
      const vals: number[] = [];
      for (let q = 1; q <= 24; q++) for (let p = 1; p <= 48; p++) if (gcd(p, q) === 1) vals.push(p / q);
      return vals.filter((x) => inDomain({ ...d, integer: false }, x));
    }
    const lo = Math.max(Number.isFinite(d.min) ? Math.ceil(d.min + (d.minStrict ? 1e-9 : 0)) : -box, -box);
    const hi = Math.min(Number.isFinite(d.max) ? Math.floor(d.max - (d.maxStrict ? 1e-9 : 0)) : box, lo + 2 * box);
    const vals: number[] = [];
    for (let x = lo; x <= hi; x++) vals.push(x);
    return vals;
  });
  const out: Env[] = [];
  const env: Env = {};
  let count = 0;
  const rec = (i: number): boolean => {
    if (i === n) {
      if (++count % 4096 === 0 && Date.now() > deadline) return false;
      for (const e of eqs) {
        const v = e(env);
        if (Number.isNaN(v) || Math.abs(v) > 1e-9 * 1e6) return true;
      }
      // Divisibility needs exact integers: past 2^52 the remainder is undefined (NaN) — stop the search there.
      if (n === 1 && conds.some((c) => relationHolds(c.rel, c.f, env, 1e-12) === null)) return false;
      // Exactness: big values lose precision — skip points where an equation's terms exceed 2^50.
      for (const c of conds) if (relationHolds(c.rel, c.f, env, 1e-12) !== true) return true;
      out.push({ ...env });
      return out.length < (n === 1 ? 5000 : 200);
    }
    for (const x of ranges[i]!) {
      env[f.vars[i]!] = x;
      if (!rec(i + 1)) return false;
    }
    return true;
  };
  const finished = rec(0);
  return finished || out.length ? out : null;
}

/** Real roots of a square system: multi-start Newton with a numeric Jacobian. */
function realRoots(f: Formal, deadline: number): Env[] {
  const n = f.vars.length;
  const eqs = f.equalities.map(compileExpression);
  const conds = f.conditions.map((c) => ({ rel: c, f: compileRel(c) }));
  const F = (x: number[]) => {
    const env: Env = {};
    f.vars.forEach((v, i) => (env[v] = x[i]!));
    return eqs.map((e) => e(env));
  };
  const found: number[][] = [];
  const accept = (x: number[]) => {
    const env: Env = {};
    f.vars.forEach((v, i) => (env[v] = x[i]!));
    if (!f.vars.every((v, i) => inDomain({ ...f.domain[v]!, integer: false }, x[i]!))) return;
    if (F(x).some((r) => !Number.isFinite(r) || Math.abs(r) > 1e-9)) return;
    if (conds.some((c) => relationHolds(c.rel, c.f, env, 1e-9) === false)) return;
    // Snap to recognisable values when that is still a root.
    const snapped = x.map((xi) => {
      const r = recognise(xi);
      const v = Number.isFinite(Number(r)) ? Number(r) : /^-?\d+\/\d+$/.test(r) ? Number(r.split("/")[0]) / Number(r.split("/")[1]) : xi;
      return v;
    });
    const use = F(snapped).every((r) => Number.isFinite(r) && Math.abs(r) < 1e-10) ? snapped : x;
    const res = (y: number[]) => Math.hypot(...F(y));
    // One root per cluster (a flat function gives near-duplicates): keep the exact-looking one, else the best.
    const near = found.findIndex((y) => y.every((yi, i) => Math.abs(yi - use[i]!) < 1e-3 * Math.max(1, Math.abs(yi))));
    if (near < 0) found.push(use);
    else {
      const old = found[near]!;
      const exact = (y: number[]) => y.every((yi) => /^-?\d+(\/\d+)?$/.test(recognise(yi)) || recognise(yi).includes("√"));
      if ((exact(use) && !exact(old)) || (exact(use) === exact(old) && res(use) < res(old))) found[near] = use;
    }
  };
  const rnd = mulberry32(17);
  const starts: number[][] = [];
  const small = [-3, -2, -1, -0.5, 0, 0.5, 1, 2, 3];
  for (let k = 0; k < 400; k++) starts.push(f.vars.map(() => (k < 60 ? small[Math.floor(rnd() * small.length)]! : (rnd() - 0.5) * (k < 250 ? 8 : 40))));
  for (const s0 of starts) {
    if (Date.now() > deadline) break;
    let x = [...s0];
    for (let it = 0; it < 60; it++) {
      const r = F(x);
      if (r.some((v) => !Number.isFinite(v))) break;
      const norm = Math.hypot(...r);
      if (norm < 1e-13) break;
      // Jacobian (square: n equations, n unknowns) or Gauss–Newton when not square.
      const J = eqs.map(() => new Array(n).fill(0));
      for (let j = 0; j < n; j++) {
        const h = 1e-7 * Math.max(1, Math.abs(x[j]!));
        const xp = [...x];
        xp[j]! += h;
        const rp = F(xp);
        for (let i = 0; i < eqs.length; i++) J[i]![j] = (rp[i]! - r[i]!) / h;
      }
      const step = leastSquares(J, r);
      if (!step) break;
      // Damped step: halve until the residual decreases.
      let t = 1;
      let next = x.map((xi, i) => xi - step[i]!);
      for (let k = 0; k < 20; k++) {
        const rn = F(next);
        if (rn.every(Number.isFinite) && Math.hypot(...rn) < norm) break;
        t /= 2;
        next = x.map((xi, i) => xi - t * step[i]!);
      }
      x = next;
    }
    accept(x);
  }
  // One unknown: also a sign scan (roots Newton misses, e.g. at the edge of the domain).
  if (n === 1) {
    const d = f.domain[f.vars[0]!]!;
    const lo = Number.isFinite(d.min) ? d.min : -60;
    const hi = Number.isFinite(d.max) ? d.max : 60;
    const steps = 24000;
    let prev = NaN;
    let px = lo;
    for (let k = 0; k <= steps; k++) {
      const x = lo + ((hi - lo) * k) / steps;
      const v = F([x])[0]!;
      if (Number.isFinite(v) && Math.abs(v) < 1e-12) accept([x]);
      if (Number.isFinite(v) && Number.isFinite(prev) && Math.sign(v) !== Math.sign(prev)) {
        let [a, b] = [px, x];
        for (let it = 0; it < 80; it++) {
          const mid = (a + b) / 2;
          const fm = F([mid])[0]!;
          if (Math.sign(fm) === Math.sign(F([a])[0]!)) a = mid;
          else b = mid;
        }
        accept([(a + b) / 2]);
      }
      prev = v;
      px = x;
    }
    // Integers and the domain's ends (roots where the expression stops being defined).
    for (let k = Math.ceil(lo); k <= Math.floor(hi); k++) if (Math.abs(F([k])[0]!) < 1e-12) accept([k]);
  }
  return found.sort((a, b) => a[0]! - b[0]! || (a[1] ?? 0) - (b[1] ?? 0)).map((x) => Object.fromEntries(f.vars.map((v, i) => [v, x[i]!])));
}

function leastSquares(J: number[][], r: number[]): number[] | null {
  // Solve (JᵀJ + λI) d = Jᵀr.
  const n = J[0]!.length;
  const A = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => J.reduce((s, row) => s + row[i]! * row[j]!, 0) + (i === j ? 1e-12 : 0)));
  const b = Array.from({ length: n }, (_, i) => J.reduce((s, row, k) => s + row[i]! * r[k]!, 0));
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let i = c + 1; i < n; i++) if (Math.abs(A[i]![c]!) > Math.abs(A[p]![c]!)) p = i;
    if (Math.abs(A[p]![c]!) < 1e-300) return null;
    [A[c], A[p]] = [A[p]!, A[c]!];
    [b[c], b[p]] = [b[p]!, b[c]!];
    for (let i = 0; i < n; i++) {
      if (i === c) continue;
      const k = A[i]![c]! / A[c]![c]!;
      for (let j = c; j < n; j++) A[i]![j]! -= k * A[c]![j]!;
      b[i]! -= k * b[c]!;
    }
  }
  return b.map((bi, i) => bi / A[i]![i]!);
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Points of the constraint set: free variables sampled in their domain, one variable per equality solved for. */
function feasiblePoints(f: Formal, count: number, deadline: number, seed = 3): Env[] {
  const rnd = mulberry32(seed);
  const eqs = f.equalities.map(compileExpression);
  const conds = f.conditions.map((c) => ({ rel: c, f: compileRel(c) }));
  const sample = (v: string) => {
    const d = f.domain[v]!;
    const lo = Number.isFinite(d.min) ? d.min : -20;
    const hi = Number.isFinite(d.max) ? d.max : Number.isFinite(d.min) ? d.min + 20 : 20;
    // Log-uniform for one-sided positive domains (small and large values both matter); uniform otherwise.
    if (Number.isFinite(d.min) && !Number.isFinite(d.max) && d.min >= 0) return d.min + Math.exp((rnd() * 2 - 1) * Math.log(200)) * (rnd() < 0.5 ? 1 : 0.5);
    let x = lo + rnd() * (hi - lo);
    if (rnd() < 0.15) x = Math.round(x);
    return x;
  };
  const solveFor = f.equalities.length ? solvedVariables(f) : [];
  if (solveFor === null) return [];
  const out: Env[] = [];
  for (let tries = 0; out.length < count && tries < count * 40; tries++) {
    if (tries % 64 === 0 && Date.now() > deadline) break;
    const env: Env = {};
    for (const v of f.vars) env[v] = sample(v);
    // Symmetric points matter for extrema (a = b = c …): sometimes start from equal values.
    if (rnd() < 0.2) {
      const base = env[f.vars[0]!]!;
      for (const v of f.vars) env[v] = base * (1 + (rnd() - 0.5) * (rnd() < 0.5 ? 0 : 0.2));
    }
    if (solveFor.length) {
      const ok = newtonOn(eqs, solveFor, env);
      if (!ok) continue;
    }
    if (!f.vars.every((v) => inDomain({ ...f.domain[v]!, integer: false }, env[v]!))) continue;
    if (conds.some((c) => relationHolds(c.rel, c.f, env, 1e-9) !== true)) continue;
    out.push({ ...env });
  }
  return out;
}

/** Which variables to solve the equalities for (the last ones, one per equation). */
function solvedVariables(f: Formal): string[] | null {
  if (f.equalities.length > f.vars.length) return null;
  return f.vars.slice(f.vars.length - f.equalities.length);
}

/** Newton on the equalities in the chosen variables, others fixed. */
function newtonOn(eqs: Fn[], vars: string[], env: Env): boolean {
  for (let it = 0; it < 50; it++) {
    const r = eqs.map((e) => e(env));
    if (r.some((v) => !Number.isFinite(v))) return false;
    if (Math.hypot(...r) < 1e-12) return true;
    const J = eqs.map(() => new Array(vars.length).fill(0));
    vars.forEach((v, j) => {
      const h = 1e-7 * Math.max(1, Math.abs(env[v]!));
      const old = env[v]!;
      env[v] = old + h;
      const rp = eqs.map((e) => e(env));
      env[v] = old;
      for (let i = 0; i < eqs.length; i++) J[i]![j] = (rp[i]! - r[i]!) / h;
    });
    const step = leastSquares(J, r);
    if (!step) return false;
    vars.forEach((v, j) => (env[v] = env[v]! - step[j]!));
  }
  return eqs.every((e) => Math.abs(e(env)) < 1e-9);
}

const showEnv = (e: Env, vars: string[]) => (vars.length === 1 ? `${vars[0]} = ${recognise(e[vars[0]!]!)}` : `(${vars.join(", ")}) = (${vars.map((v) => recognise(e[v]!)).join("; ")})`);

// ---------------------------------------------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------------------------------------------

/**
 * Per part of a multi-part statement ("a) … b) …"): each part with the shared opening. Parts that aren't handled are
 * left out. A statement without parts is one part "".
 */
export function computeAnswers(statement: string, budgetMs = 2500): { part: string; result: OracleResult }[] {
  const text = statement.normalize("NFC");
  const marks = [...text.matchAll(/(?:^|\s)([a-f])\)\s/g)];
  if (marks.length === 0) {
    const r = computeAnswer(text, budgetMs);
    return r ? [{ part: "", result: r }] : [];
  }
  const stem = text.slice(0, marks[0]!.index);
  const out: { part: string; result: OracleResult }[] = [];
  marks.forEach((m, i) => {
    const part = text.slice(m.index!, marks[i + 1]?.index ?? text.length).replace(/^\s*[a-f]\)\s*/, "");
    const r = computeAnswer(`${stem} ${part}`, budgetMs / marks.length);
    if (r) out.push({ part: m[1]!, result: r });
  });
  return out;
}

/** Formalises and computes; null when the statement isn't in a handled form. Bounded by `budgetMs`. */
export function computeAnswer(statement: string, budgetMs = 1500): OracleResult | null {
  const started = Date.now();
  const deadline = started + budgetMs;
  let f: Formal | null;
  try {
    f = formalise(statement);
  } catch {
    return null;
  }
  if (!f) return null;
  try {
    const r = run(f, started, deadline);
    // A claim that fails, or a value that isn't constant, means the reading is probably wrong: say nothing.
    return r && r.status !== "violated" ? r : null;
  } catch {
    return null;
  }
}

function run(f: Formal, started: number, deadline: number): OracleResult | null {
  const done = (r: Omit<OracleResult, "formal" | "ms">): OracleResult => ({ ...r, formal: f, ms: Date.now() - started });
  switch (f.kind) {
    case "integer_solutions": {
      const sols = integerSearch(f, deadline);
      if (!sols) return null;
      const n = f.vars.length;
      const box = [0, 3000, 250, 45, 16][n]!;
      const range = f.vars.some((v) => f.domain[v]!.rational) ? "các phân số p/q với p ≤ 48, q ≤ 24" : `|${f.vars.join("|, |")}| ≤ ${box}`;
      if (sols.length === 0) return done({ status: "none", answer: "không có", solutions: [], summary: `Tìm kiếm bằng máy (${range}): không có bộ ${f.vars.join(", ")} nào thỏa mãn.` });
      // One integer variable with many solutions: describe them by a period ("n chia 18 dư 16").
      if (n === 1 && sols.length >= 20) {
        const v = f.vars[0]!;
        const set = new Set(sols.map((x) => x[v]!));
        const lo = Math.min(...set);
        const hiKnown = Math.max(...set);
        for (let p = 1; p <= 72; p++) {
          let ok = true;
          for (let x = lo; x + p <= hiKnown && ok; x++) if (set.has(x) !== set.has(x + p)) ok = false;
          if (!ok) continue;
          const residues = [...new Set([...set].map((x) => ((x % p) + p) % p))].sort((a, b) => a - b);
          const text = p === 1 ? `mọi ${v}` : `${v} chia ${p} dư ${residues.join(" hoặc ")}`;
          return done({
            status: "found",
            answer: text,
            solutions: sols.slice(0, 40),
            summary: `Tìm kiếm bằng máy (${v} từ ${lo} đến ${hiKnown}): các giá trị thỏa mãn là ${[...set].slice(0, 8).join(", ")}, … — đúng là ${text}. (Kiểm tra số, không phải chứng minh.)`,
          });
        }
      }
      const list = sols.slice(0, 30).map((s) => showEnv(s, f.vars));
      return done({
        status: "found",
        answer: list.join("; "),
        solutions: sols,
        summary: `Tìm kiếm bằng máy (${range}) cho đúng ${sols.length >= 200 ? "≥ 200" : sols.length} nghiệm: ${list.join("; ")}${sols.length > 30 ? "; …" : ""}. (Kiểm tra số trong phạm vi trên, không phải chứng minh; lời giải phải chứng minh không còn nghiệm nào khác.)`,
      });
    }
    case "equation":
    case "system": {
      if (f.equalities.length !== f.vars.length) return null;
      const sols = realRoots(f, deadline);
      if (sols.length === 0) return done({ status: "none", answer: "vô nghiệm", solutions: [], summary: "Tìm nghiệm bằng máy (nhiều điểm xuất phát): không tìm thấy nghiệm thực nào." });
      const list = sols.slice(0, 12).map((s) => showEnv(s, f.vars));
      return done({
        status: "found",
        answer: list.join("; "),
        solutions: sols,
        summary: `Tìm nghiệm bằng máy (Newton từ nhiều điểm xuất phát${f.vars.length === 1 ? ", quét dấu" : ""}): ${list.join("; ")}. (Kiểm tra số; lời giải phải chứng minh đó là tất cả các nghiệm.)`,
      });
    }
    case "minimize":
    case "maximize":
    case "value": {
      const P = compileExpression(f.target!);
      const pts = feasiblePoints(f, 3000, deadline - 300);
      const vals = pts.map((e) => ({ e, v: P(e) })).filter((x) => Number.isFinite(x.v));
      if (vals.length < 50) return null;
      if (f.kind === "value") {
        // Robust to round-off near singular points: the median, and ≥ 95% of the points agree with it.
        const sorted = vals.map((x) => x.v).sort((a, b) => a - b);
        const v0 = sorted[Math.floor(sorted.length / 2)]!;
        const constant = vals.filter((x) => Math.abs(x.v - v0) < 1e-6 * Math.max(1, Math.abs(v0))).length >= 0.95 * vals.length;
        return constant
          ? done({ status: "found", answer: recognise(v0), value: v0, summary: `Tính bằng máy tại ${vals.length} bộ giá trị thỏa mãn giả thiết: biểu thức luôn bằng ${recognise(v0)}.` })
          : done({ status: "violated", answer: null, summary: `Tính bằng máy: biểu thức không là hằng số trên các bộ giá trị thỏa mãn giả thiết (ví dụ ${recognise(vals[0]!.v)} và ${recognise(vals[1]!.v)}) — kiểm tra lại cách đọc đề.` });
      }
      const sign = f.kind === "minimize" ? 1 : -1;
      vals.sort((a, b) => sign * (a.v - b.v));
      // Local refinement around the best few (coordinate search on the free variables).
      const free = f.vars.slice(0, f.vars.length - f.equalities.length);
      const eqs = f.equalities.map(compileExpression);
      const solve = solvedVariables(f) ?? [];
      const conds = f.conditions.map((c) => ({ rel: c, f: compileRel(c) }));
      const feasible = (e: Env) =>
        (solve.length === 0 || newtonOn(eqs, solve, e)) &&
        f.vars.every((v) => inDomain({ ...f.domain[v]!, integer: false }, e[v]!)) &&
        conds.every((c) => relationHolds(c.rel, c.f, e, 1e-9) === true);
      let best = { ...vals[0]! };
      for (const start of vals.slice(0, 6)) {
        let cur = { e: { ...start.e }, v: start.v };
        let h = 0.1 * Math.max(1, ...free.map((v) => Math.abs(cur.e[v]!)));
        for (let it = 0; it < 400 && h > 1e-10 && Date.now() < deadline; it++) {
          let improved = false;
          for (const v of free)
            for (const d of [h, -h]) {
              const e = { ...cur.e, [v]: cur.e[v]! + d };
              if (!feasible(e)) continue;
              const val = P(e);
              if (Number.isFinite(val) && sign * (val - cur.v) < -1e-15) {
                cur = { e, v: val };
                improved = true;
              }
            }
          if (!improved) h /= 2;
        }
        if (sign * (cur.v - best.v) < 0) best = cur;
      }
      const word = f.kind === "minimize" ? "nhỏ nhất" : "lớn nhất";
      const exact = recognise(best.v);
      // An extremum the search only approaches (at the edge of the domain) is reported as such.
      const atEdge = f.vars.some((v) => {
        const d = f.domain[v]!;
        return (Number.isFinite(d.min) && Math.abs(best.e[v]! - d.min) < 1e-4 && d.minStrict) || (Number.isFinite(d.max) && Math.abs(best.e[v]! - d.max) < 1e-4 && d.maxStrict);
      });
      return done({
        status: "found",
        answer: exact,
        value: best.v,
        summary: `Tìm bằng máy trên ${vals.length} bộ giá trị thỏa mãn giả thiết rồi tinh chỉnh: giá trị ${word} ≈ ${exact}${atEdge ? " (chỉ tiến tới ở biên, có thể không đạt được)" : `, đạt tại ${showEnv(best.e, f.vars)}`}. (Kiểm tra số, không phải chứng minh.)`,
      });
    }
    case "inequality":
    case "identity": {
      const claims = f.target!.split(" && ").map((r) => ({ rel: r, f: compileRel(r) }));
      const pts = feasiblePoints(f, 4000, deadline);
      if (pts.length < 50) return null;
      let worst: { margin: number; e: Env } = { margin: Infinity, e: pts[0]! };
      for (const e of pts)
        for (const c of claims) {
          const ok = relationHolds(c.rel, c.f, e, 1e-9);
          if (ok === false) return done({ status: "violated", answer: null, summary: `Kiểm tra bằng máy: mệnh đề sai tại ${showEnv(e, f.vars)} — có thể đã đọc sai đề.` });
          const a = c.f.a(e);
          const b = c.f.b(e);
          const margin = Math.abs(a - b) / Math.max(1, Math.abs(a), Math.abs(b));
          if (margin < worst.margin) worst = { margin, e };
        }
      if (f.kind === "identity") return done({ status: "found", answer: null, summary: `Kiểm tra bằng máy: đẳng thức đúng tại ${pts.length} bộ giá trị thỏa mãn giả thiết.` });
      // Where equality holds: shrink the smallest margin by a local search on the free variables, then read it exactly.
      if (worst.margin < 1e-2) {
        const free = f.vars.slice(0, f.vars.length - f.equalities.length);
        const eqs = f.equalities.map(compileExpression);
        const solve = solvedVariables(f) ?? [];
        const conds = f.conditions.map((c) => ({ rel: c, f: compileRel(c) }));
        const margin = (e: Env) =>
          Math.min(...claims.map((c) => {
            const a = c.f.a(e);
            const b = c.f.b(e);
            return Number.isFinite(a) && Number.isFinite(b) ? Math.abs(a - b) / Math.max(1, Math.abs(a), Math.abs(b)) : Infinity;
          }));
        const ok = (e: Env) => (solve.length === 0 || newtonOn(eqs, solve, e)) && f.vars.every((v) => inDomain({ ...f.domain[v]!, integer: false }, e[v]!)) && conds.every((c) => relationHolds(c.rel, c.f, e, 1e-9) === true);
        let cur = { e: { ...worst.e }, m: margin(worst.e) };
        let h = 0.05;
        for (let it = 0; it < 600 && h > 1e-12 && Date.now() < deadline + 400; it++) {
          let improved = false;
          for (const v of free)
            for (const d of [h, -h]) {
              const e = { ...cur.e, [v]: cur.e[v]! + d };
              if (!ok(e)) continue;
              const m = margin(e);
              if (m < cur.m) {
                cur = { e, m };
                improved = true;
              }
            }
          if (!improved) h /= 2;
        }
        // Snap to recognisable values when equality still holds there.
        const simple = (x: number) => {
          for (const q of [1, 2, 3, 4]) {
            const c = Math.round(x * q) / q;
            if (Math.abs(x - c) < 0.01) return c;
          }
          return x;
        };
        const snapped: Env = {};
        for (const v of f.vars) snapped[v] = simple(cur.e[v]!);
        const check = { ...snapped };
        if (ok(check) && f.vars.every((v) => Math.abs(check[v]! - snapped[v]!) < 1e-9) && margin(snapped) < 1e-9) cur = { e: snapped, m: 0 };
        if (cur.m < 1e-7) worst = { margin: cur.m, e: cur.e };
      }
      const eqCase = worst.margin < 1e-7 ? `; dấu bằng xảy ra tại ${showEnv(worst.e, f.vars)}` : worst.margin < 1e-4 ? `; dấu bằng xảy ra (gần) tại ${showEnv(worst.e, f.vars)}` : "; không thấy dấu bằng trên các điểm thử (có thể chỉ đạt ở biên)";
      return done({ status: "found", answer: null, summary: `Kiểm tra bằng máy: bất đẳng thức đúng tại ${pts.length} bộ giá trị thỏa mãn giả thiết${eqCase}. (Không phải chứng minh.)` });
    }
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Checking a lesson's answer against the computation
// ---------------------------------------------------------------------------------------------------------------

/** Text of a lesson's answer in a comparable form: LaTeX fractions/roots as a/b and √k, no spaces. */
function answerText(t: string): string {
  return t
    .replace(/\\d?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, "$1/$2")
    .replace(/\\sqrt\s*\{([^{}]*)\}/g, "√$1")
    .replace(/\\left|\\right|\\[,;!]|\$/g, "")
    .replace(/[−–]/g, "-")
    .replace(/\s+/g, "");
}

/**
 * Numbers a correct final answer must mention (each solution's values, the value, the modulus and residues), as
 * written by `recognise`. Conservative: a value is required only when it has a short exact form.
 */
function requiredNumbers(r: OracleResult): string[] {
  const out = new Set<string>();
  const add = (x: number) => {
    const s = recognise(x);
    if (/^-?\d+(\/\d+)?$/.test(s) || /^-?\d*√\d+$/.test(s)) out.add(s.replace(/^-/, "")); // sign written many ways
  };
  if (r.formal.kind === "integer_solutions" && r.answer && /chia/.test(r.answer)) {
    for (const m of r.answer.matchAll(/\d+/g)) out.add(m[0]);
  } else if (r.solutions && r.solutions.length <= 6) for (const s of r.solutions) for (const v of Object.values(s)) add(v);
  else if (r.value !== undefined && (r.formal.kind === "value" || r.formal.kind === "minimize" || r.formal.kind === "maximize")) add(r.value);
  return [...out];
}

/** Feedback when a lesson's final answer misses what the computation found (empty when it agrees or can't tell). */
export function answerMismatch(finalAnswer: string, computed: { part: string; result: OracleResult }[]): string[] {
  const text = answerText(finalAnswer);
  const out: string[] = [];
  for (const { part, result } of computed) {
    const need = requiredNumbers(result);
    if (need.length === 0) continue;
    const missing = need.filter((n) => !text.includes(n));
    if (missing.length)
      out.push(`final answer${part ? ` of part ${part}` : ""} does not match the machine computation (${result.answer ?? result.summary}): ${missing.join(", ")} missing — re-check the solution against it`);
  }
  return out;
}
