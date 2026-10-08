/**
 * Geometry facts — the structured representation the proof planner reasons with (never prose).
 *
 * A fact is valid only if it is given (stated, or produced by a construction in the statement) or derived by a
 * registered method from earlier facts. The constructed figure (exact, from the statement) is used as an *oracle*:
 * to propose which facts might be worth proving and to orient angles (which side a point is on) — never as a proof.
 */
import { equation, type Equation } from "./linear";

export type Seg = [string, string];
export type Tri = [string, string, string];

export type Factor = { seg: Seg; power: 1 | 2; divide: boolean } | { number: number; divide: boolean };

export type Fact =
  | { t: "col"; p: Tri }
  | { t: "para"; a: Seg; b: Seg }
  | { t: "perp"; a: Seg; b: Seg }
  | { t: "cong"; a: Seg; b: Seg }
  /** ∠a = ∠b (the usual undirected angles, vertex in the middle). */
  | { t: "eqangle"; a: Tri; b: Tri }
  | { t: "aval"; a: Tri; v: number }
  /** ∠a + ∠b = 180°. */
  | { t: "suppl"; a: Tri; b: Tri }
  /** Line VL bisects the angle between VA and VB — internal or external (both satisfy 2θ(VL) = θ(VA) + θ(VB)). */
  | { t: "bisector"; v: string; a: string; b: string; l: string; external: boolean }
  | { t: "cyclic"; p: [string, string, string, string] }
  /** Π lhs = Π rhs (segments, possibly squared or dividing; numbers). */
  | { t: "prod"; lhs: Factor[]; rhs: Factor[] }
  /** △a ∽ △b with vertices in corresponding order. */
  | { t: "simtri"; a: Tri; b: Tri }
  | { t: "midp"; m: string; a: string; b: string };

/** Orientation of three points in the constructed figure: +1 counter-clockwise, −1 clockwise, 0 collinear. */
export type Orient = (a: string, b: string, c: string) => number;

const sortedPair = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
export const lineVar = (a: string, b: string) => `L:${sortedPair(a, b)}`;
export const segVar = (a: string, b: string) => `S:${sortedPair(a, b)}`;
const segKey = (s: Seg) => sortedPair(s[0], s[1]);

/** A canonical key: the same fact written differently gets the same key. */
export function factKey(f: Fact): string {
  switch (f.t) {
    case "col":
      return `col:${[...f.p].sort().join(",")}`;
    case "para":
    case "perp":
    case "cong":
      return `${f.t}:${[segKey(f.a), segKey(f.b)].sort().join("~")}`;
    case "eqangle": {
      const k = (a: Tri) => `${[a[0], a[2]].sort().join("")}@${a[1]}`;
      return `eqangle:${[k(f.a), k(f.b)].sort().join("=")}`;
    }
    case "aval":
      return `aval:${[f.a[0], f.a[2]].sort().join("")}@${f.a[1]}=${Math.round(f.v * 1000) / 1000}`;
    case "suppl": {
      const k = (a: Tri) => `${[a[0], a[2]].sort().join("")}@${a[1]}`;
      return `suppl:${[k(f.a), k(f.b)].sort().join("+")}`;
    }
    case "bisector":
      return `bisector:${f.v}${f.l}/${[f.a, f.b].sort().join("")}`;
    case "cyclic":
      return `cyclic:${[...f.p].sort().join(",")}`;
    case "prod": {
      const side = (fs: Factor[], flip: boolean) =>
        fs
          .map((x) => (("seg" in x ? `${segKey(x.seg)}^${x.power}` : `#${x.number}`) + ((x.divide !== flip) ? "/" : "*")))
          .sort()
          .join(" ");
      const l = side(f.lhs, false);
      const r = side(f.rhs, false);
      return `prod:${[l, r].sort().join(" = ")}`;
    }
    case "simtri": {
      // △ABC ∽ △DEF is △BCA ∽ △EFD and △DEF ∽ △ABC: canonical rotation with the smallest vertex of the first first.
      const rots = (a: Tri, b: Tri) => [0, 1, 2].map((i) => [[a[i], a[(i + 1) % 3], a[(i + 2) % 3]], [b[i], b[(i + 1) % 3], b[(i + 2) % 3]]] as [Tri, Tri]);
      const rev = (t: Tri): Tri => [t[0], t[2], t[1]];
      const all = [...rots(f.a, f.b), ...rots(f.b, f.a), ...rots(rev(f.a), rev(f.b)), ...rots(rev(f.b), rev(f.a))].map(([x, y]) => `${x.join("")}~${y.join("")}`);
      return `simtri:${all.sort()[0]}`;
    }
    case "midp":
      return `midp:${f.m}@${sortedPair(f.a, f.b)}`;
  }
}

/** The points a fact is about. */
export function factPoints(f: Fact): string[] {
  switch (f.t) {
    case "col":
    case "cyclic":
      return [...f.p];
    case "para":
    case "perp":
    case "cong":
      return [...f.a, ...f.b];
    case "eqangle":
      return [...f.a, ...f.b];
    case "aval":
      return [...f.a];
    case "suppl":
      return [...f.a, ...f.b];
    case "bisector":
      return [f.v, f.a, f.b, f.l];
    case "prod":
      return [...f.lhs, ...f.rhs].flatMap((x) => ("seg" in x ? x.seg : []));
    case "simtri":
      return [...f.a, ...f.b];
    case "midp":
      return [f.m, f.a, f.b];
  }
}

/** ∠ABC as a signed difference of line directions: s·(θ(BC) − θ(BA)) ≡ ∠ABC (mod 180°), s the orientation of A, B, C. */
function angleTerms(a: Tri, orient: Orient, scale = 1): [string, number][] | null {
  const s = orient(a[0], a[1], a[2]);
  if (s === 0) return null; // a straight angle has no side to read
  return [
    [lineVar(a[1], a[2]), s * scale],
    [lineVar(a[1], a[0]), -s * scale],
  ];
}

/** The angle equations a fact contributes (directions of lines, mod 180°). */
export function angleEquations(f: Fact, orient: Orient): Equation[] {
  switch (f.t) {
    case "col":
      return [equation([[lineVar(f.p[0], f.p[1]), 1], [lineVar(f.p[0], f.p[2]), -1]]), equation([[lineVar(f.p[0], f.p[1]), 1], [lineVar(f.p[1], f.p[2]), -1]])];
    case "para":
      return [equation([[lineVar(...f.a), 1], [lineVar(...f.b), -1]])];
    case "perp":
      return [equation([[lineVar(...f.a), 1], [lineVar(...f.b), -1]], 90)];
    case "eqangle": {
      const x = angleTerms(f.a, orient);
      const y = angleTerms(f.b, orient, -1);
      return x && y ? [equation([...x, ...y])] : [];
    }
    case "aval": {
      const x = angleTerms(f.a, orient);
      return x ? [equation(x, f.v)] : [];
    }
    case "suppl": {
      // ∠a + ∠b ≡ 0 (mod 180°).
      const x = angleTerms(f.a, orient);
      const y = angleTerms(f.b, orient);
      return x && y ? [equation([...x, ...y])] : [];
    }
    case "bisector":
      return [equation([[lineVar(f.v, f.l), 2], [lineVar(f.v, f.a), -1], [lineVar(f.v, f.b), -1]])];
    case "cyclic": {
      // Inscribed angles on one chord are equal as directed angles: ∠(PX, PY) = ∠(QX, QY) — no case analysis needed.
      const [a, b, c, d] = f.p;
      const chord = (x: string, y: string, p: string, q: string) =>
        equation([[lineVar(p, y), 1], [lineVar(p, x), -1], [lineVar(q, y), -1], [lineVar(q, x), 1]]);
      return [chord(a, b, c, d), chord(a, c, b, d), chord(a, d, b, c)];
    }
    case "midp":
      return angleEquations({ t: "col", p: [f.a, f.m, f.b] }, orient);
    case "simtri": {
      // Corresponding angles: equal with the same orientation, opposite with a reflected copy.
      const same = orient(...f.a) === orient(...f.b);
      const out: Equation[] = [];
      for (let i = 0; i < 3; i++) {
        const ta: Tri = [f.a[(i + 2) % 3]!, f.a[i]!, f.a[(i + 1) % 3]!];
        const tb: Tri = [f.b[(i + 2) % 3]!, f.b[i]!, f.b[(i + 1) % 3]!];
        const x = [[lineVar(ta[1], ta[2]), 1], [lineVar(ta[1], ta[0]), -1]] as [string, number][];
        const y = [[lineVar(tb[1], tb[2]), same ? -1 : 1], [lineVar(tb[1], tb[0]), same ? 1 : -1]] as [string, number][];
        out.push(equation([...x, ...y]));
      }
      return out;
    }
    default:
      return [];
  }
}

/** The length equations a fact contributes (log-lengths). */
export function lengthEquations(f: Fact): Equation[] {
  switch (f.t) {
    case "cong":
      return [equation([[segVar(...f.a), 1], [segVar(...f.b), -1]])];
    case "midp":
      return [
        equation([[segVar(f.a, f.m), 1], [segVar(f.m, f.b), -1]]),
        equation([[segVar(f.a, f.m), 1], [segVar(f.a, f.b), -1]], -Math.LN2),
      ];
    case "prod": {
      const terms: [string, number][] = [];
      let c = 0;
      const side = (fs: Factor[], sign: number) => {
        for (const x of fs) {
          const s = sign * (x.divide ? -1 : 1);
          if ("seg" in x) terms.push([segVar(...x.seg), s * x.power]);
          else c -= s * Math.log(x.number);
        }
      };
      side(f.lhs, 1);
      side(f.rhs, -1);
      return [equation(terms, c)];
    }
    case "simtri": {
      const [a, b] = [f.a, f.b];
      const r = (i: number) => [[segVar(a[i]!, a[(i + 1) % 3]!), 1], [segVar(b[i]!, b[(i + 1) % 3]!), -1]] as [string, number][];
      return [equation([...r(0), ...r(1).map(([v, k]) => [v, -k] as [string, number])]), equation([...r(1), ...r(2).map(([v, k]) => [v, -k] as [string, number])])];
    }
    default:
      return [];
  }
}

const seg = (s: Seg) => `${s[0]}${s[1]}`;
const ang = (a: Tri) => `∠${a.join("")}`;
const factor = (x: Factor) => ("seg" in x ? `${seg(x.seg)}${x.power === 2 ? "²" : ""}` : `${x.number}`);
const product = (fs: Factor[]) => {
  const num = fs.filter((x) => !x.divide).map(factor).join(" · ") || "1";
  const den = fs.filter((x) => x.divide).map(factor).join(" · ");
  return den ? `${num} / ${den}` : num;
};

/** The fact in school notation (the same in Vietnamese and English lessons). */
export function factText(f: Fact): string {
  switch (f.t) {
    case "col":
      return `${f.p.join(", ")} thẳng hàng`;
    case "para":
      return `${seg(f.a)} ∥ ${seg(f.b)}`;
    case "perp":
      return `${seg(f.a)} ⊥ ${seg(f.b)}`;
    case "cong":
      return `${seg(f.a)} = ${seg(f.b)}`;
    case "eqangle":
      return `${ang(f.a)} = ${ang(f.b)}`;
    case "aval":
      return `${ang(f.a)} = ${Math.round(f.v * 100) / 100}°`;
    case "suppl":
      return `${ang(f.a)} + ${ang(f.b)} = 180°`;
    case "bisector":
      return `${f.v}${f.l} là đường phân giác ${f.external ? "ngoài" : "trong"} của ∠${f.a}${f.v}${f.b}`;
    case "cyclic":
      return `${f.p.join(", ")} cùng thuộc một đường tròn`;
    case "prod":
      return `${product(f.lhs)} = ${product(f.rhs)}`;
    case "simtri":
      return `△${f.a.join("")} ∽ △${f.b.join("")}`;
    case "midp":
      return `${f.m} là trung điểm của ${f.a}${f.b}`;
  }
}

/** The same in LaTeX (for the step's display formula). */
export function factLatex(f: Fact): string {
  const t = factText(f);
  return t
    .replace(/∠([A-Z]'*[A-Z]'*[A-Z]'*)/g, "\\widehat{$1}")
    .replace(/△/g, "\\triangle ")
    .replace(/∽/g, "\\backsim")
    .replace(/∥/g, "\\parallel")
    .replace(/⊥/g, "\\perp")
    .replace(/·/g, "\\cdot")
    .replace(/°/g, "^\\circ")
    .replace(/²/g, "^2")
    .replace(/ thẳng hàng$/, "\\text{ thẳng hàng}")
    .replace(/ cùng thuộc một đường tròn$/, "\\text{ cùng thuộc một đường tròn}")
    .replace(/ là trung điểm của /, "\\text{ là trung điểm của }")
    .replace(/ là đường phân giác (trong|ngoài) của /, "\\text{ là đường phân giác $1 của }");
}
