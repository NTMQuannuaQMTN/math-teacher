/**
 * A small, safe arithmetic expression evaluator used to verify solutions.
 *
 * - No `eval`, no property access, no user-defined functions: the only
 *   things an expression can do are arithmetic on numbers and a fixed set
 *   of maths functions. Model output is therefore safe to evaluate.
 * - Grammar: numbers, variables (a letter optionally followed by digits,
 *   e.g. x, y1, x_2), + - * / ^, parentheses, unary minus, implicit
 *   multiplication (2x, 3(x+1), (x+1)(x-1), xy = x*y), functions
 *   sqrt cbrt abs sin cos tan cot (degrees), constant pi.
 * - Relations: = == != < <= > >= (and Unicode ≤ ≥ ≠).
 */

export type Env = Record<string, number>;

type Node =
  | { t: "num"; v: number }
  | { t: "var"; name: string }
  | { t: "neg"; a: Node }
  | { t: "bin"; op: "+" | "-" | "*" | "/" | "^"; a: Node; b: Node }
  | { t: "call"; fn: string; a: Node };

const FUNCTIONS: Record<string, (x: number) => number> = {
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  abs: Math.abs,
  sin: (d) => Math.sin((d * Math.PI) / 180),
  cos: (d) => Math.cos((d * Math.PI) / 180),
  tan: (d) => Math.tan((d * Math.PI) / 180),
  cot: (d) => 1 / Math.tan((d * Math.PI) / 180),
};

export class ExprError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExprError";
  }
}

/** Maps common Unicode maths notation to the ASCII grammar. */
export function normalizeExpression(input: string): string {
  return input
    .replace(/[−–—]/g, "-")
    .replace(/[×·⋅∙]/g, "*")
    .replace(/÷|:/g, "/")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .replace(/∛/g, "cbrt")
    .replace(/√/g, "sqrt")
    .replace(/π/g, "pi")
    .replace(/≤/g, "<=")
    .replace(/≥/g, ">=")
    .replace(/≠/g, "!=")
    .replace(/\*\*/g, "^")
    .replace(/°/g, "");
}

type Token = { k: "num"; v: number } | { k: "id"; v: string } | { k: "op"; v: string };

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i]!;
    if (c === " " || c === "\t") {
      i++;
      continue;
    }
    if (/[0-9.]/.test(c)) {
      const m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i.exec(src.slice(i));
      if (!m) throw new ExprError(`Bad number at ${i}`);
      tokens.push({ k: "num", v: Number(m[0]) });
      i += m[0].length;
      continue;
    }
    if (/[a-zA-Z]/.test(c)) {
      const word = /^[a-zA-Z]+/.exec(src.slice(i))![0];
      const lower = word.toLowerCase();
      if (FUNCTIONS[lower] || lower === "pi") {
        tokens.push({ k: "id", v: lower });
        i += word.length;
        continue;
      }
      // A variable is one letter plus optional digits / _digits (x, x1, x_1).
      const m = /^[a-zA-Z](?:_?\d+)?/.exec(src.slice(i))!;
      tokens.push({ k: "id", v: m[0].replace("_", "") });
      i += m[0].length;
      continue;
    }
    const two = src.slice(i, i + 2);
    if (["<=", ">=", "!=", "=="].includes(two)) {
      tokens.push({ k: "op", v: two });
      i += 2;
      continue;
    }
    if ("+-*/^()=<>".includes(c)) {
      tokens.push({ k: "op", v: c });
      i++;
      continue;
    }
    throw new ExprError(`Unexpected character '${c}'`);
  }
  return tokens;
}

class Parser {
  private pos = 0;
  constructor(private readonly tokens: Token[]) {}

  parse(): Node {
    const node = this.additive();
    if (this.pos < this.tokens.length) throw new ExprError("Unexpected trailing input");
    return node;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private isOp(v: string): boolean {
    const t = this.peek();
    return t?.k === "op" && t.v === v;
  }

  private additive(): Node {
    let left = this.multiplicative();
    while (this.isOp("+") || this.isOp("-")) {
      const op = (this.tokens[this.pos++] as { v: "+" | "-" }).v;
      left = { t: "bin", op, a: left, b: this.multiplicative() };
    }
    return left;
  }

  /** Starts an implicit multiplication? (number, identifier, or "(" directly after an operand) */
  private startsOperand(): boolean {
    const t = this.peek();
    return !!t && (t.k === "num" || t.k === "id" || (t.k === "op" && t.v === "("));
  }

  private multiplicative(): Node {
    let left = this.unary();
    for (;;) {
      if (this.isOp("*") || this.isOp("/")) {
        const op = (this.tokens[this.pos++] as { v: "*" | "/" }).v;
        left = { t: "bin", op, a: left, b: this.unary() };
      } else if (this.startsOperand()) {
        left = { t: "bin", op: "*", a: left, b: this.power() };
      } else {
        return left;
      }
    }
  }

  private unary(): Node {
    if (this.isOp("-")) {
      this.pos++;
      return { t: "neg", a: this.unary() };
    }
    if (this.isOp("+")) {
      this.pos++;
      return this.unary();
    }
    return this.power();
  }

  private power(): Node {
    const base = this.primary();
    if (this.isOp("^")) {
      this.pos++;
      // right-associative; allow unary minus in the exponent
      return { t: "bin", op: "^", a: base, b: this.unary() };
    }
    return base;
  }

  private primary(): Node {
    const t = this.tokens[this.pos++];
    if (!t) throw new ExprError("Unexpected end of expression");
    if (t.k === "num") return { t: "num", v: t.v };
    if (t.k === "id") {
      if (t.v === "pi") return { t: "num", v: Math.PI };
      if (FUNCTIONS[t.v]) {
        // sqrt(x) or sqrt x / sqrt2
        const arg = this.isOp("(") ? this.primary() : this.power();
        return { t: "call", fn: t.v, a: arg };
      }
      return { t: "var", name: t.v };
    }
    if (t.v === "(") {
      const inner = this.additive();
      if (!this.isOp(")")) throw new ExprError("Missing )");
      this.pos++;
      return inner;
    }
    throw new ExprError(`Unexpected '${t.v}'`);
  }
}

export function parseExpression(src: string): Node {
  const tokens = tokenize(normalizeExpression(src));
  if (tokens.length === 0) throw new ExprError("Empty expression");
  if (tokens.length > 400) throw new ExprError("Expression too long");
  return new Parser(tokens).parse();
}

function evaluate(node: Node, env: Env): number {
  switch (node.t) {
    case "num":
      return node.v;
    case "var": {
      const v = env[node.name];
      if (v === undefined) throw new ExprError(`Unknown variable ${node.name}`);
      return v;
    }
    case "neg":
      return -evaluate(node.a, env);
    case "call":
      return FUNCTIONS[node.fn]!(evaluate(node.a, env));
    case "bin": {
      const a = evaluate(node.a, env);
      const b = evaluate(node.b, env);
      switch (node.op) {
        case "+":
          return a + b;
        case "-":
          return a - b;
        case "*":
          return a * b;
        case "/":
          return a / b;
        case "^":
          return a ** b;
      }
    }
  }
}

export function variablesOf(src: string): Set<string> {
  const out = new Set<string>();
  const walk = (n: Node): void => {
    if (n.t === "var") out.add(n.name);
    else if (n.t === "neg" || n.t === "call") walk(n.a);
    else if (n.t === "bin") {
      walk(n.a);
      walk(n.b);
    }
  };
  for (const side of splitRelation(src)?.sides ?? [src]) walk(parseExpression(side));
  return out;
}

/** Evaluates an expression; returns NaN when undefined (division by zero, sqrt of negative…). */
export function evalExpression(src: string, env: Env = {}): number {
  const value = evaluate(parseExpression(src), env);
  return Number.isFinite(value) ? value : NaN;
}

export type Relation = "=" | "!=" | "<" | "<=" | ">" | ">=";

export function splitRelation(src: string): { sides: [string, string]; rel: Relation } | null {
  const s = normalizeExpression(src);
  const m = /^(.*?)(<=|>=|!=|==|=|<|>)(.*)$/.exec(s);
  if (!m) return null;
  const rel = (m[2] === "==" ? "=" : m[2]) as Relation;
  if (/(<=|>=|!=|=|<|>)/.test(m[3]!)) throw new ExprError("Chained relations are not supported");
  return { sides: [m[1]!.trim(), m[3]!.trim()], rel };
}

export function approxEqual(a: number, b: number, tol = 1e-6): boolean {
  return Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
}

/**
 * Evaluates a relation like "x^2 + 5x + 6 = 0" or "3(x-2) <= 5x + 4".
 * Returns null when either side is undefined at this point.
 */
export function evalRelation(src: string, env: Env = {}, tol = 1e-6): boolean | null {
  const split = splitRelation(src);
  if (!split) throw new ExprError("Not a relation");
  const a = evalExpression(split.sides[0], env);
  const b = evalExpression(split.sides[1], env);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  const eq = approxEqual(a, b, tol);
  switch (split.rel) {
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
    case ">=":
      return a > b || eq;
  }
}

/** Evaluates "cond1 and cond2" / "cond1 or cond2" combinations of relations (no nesting). */
export function evalCondition(src: string, env: Env = {}): boolean | null {
  const orParts = src.split(/\s+(?:or|hoặc)\s+/i);
  let anyNull = false;
  for (const part of orParts) {
    const andParts = part.split(/\s+(?:and|và)\s+|,/i).map((p) => p.trim()).filter(Boolean);
    let all = true;
    for (const rel of andParts) {
      const r = evalRelation(rel, env);
      if (r === null) anyNull = true;
      if (r !== true) all = false;
    }
    if (all) return true;
  }
  return anyNull ? null : false;
}
