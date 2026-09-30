/**
 * Checks the geometric claims a solution makes against the constructed figure.
 *
 * A proof can't be verified by arithmetic, but its intermediate facts can be
 * measured: if a step says "IH ⊥ IK" or "∠IHD = ∠IDK", the exact figure
 * either agrees or it doesn't. A false claim means the reasoning (or the
 * figure) is wrong — exactly the mistakes a weak model makes on hard problems.
 *
 * Parsed from prose and LaTeX: ⊥, ∥, equal segments, products of segments
 * (ID² = IJ·IA), equal angles, angle values, "thẳng hàng" (collinear),
 * "cùng thuộc một đường tròn" / "tứ giác … nội tiếp" (concyclic), and similar
 * triangles (∽ / "đồng dạng"). Sentences with "nếu / giả sử / không" are skipped.
 */
import { angleDeg, dist, evaluateFigureCheck, type ResolvedFigure, type Vec } from "./geometry";
import type { FigureCheck } from "./solution";

export interface ClaimResult {
  label: string;
  passed: boolean;
  detail: string;
}

const P = "[A-Z]'*";
const SEG = `${P}${P}`;
const TRI = `${P}${P}${P}`;

/** LaTeX / Vietnamese wording → a compact symbolic form the patterns below understand. */
function normalize(text: string): string {
  return text
    .replace(/\$/g, " ")
    .replace(/\\left|\\right|\\,|\\;|\\!/g, "")
    // Separators: line breaks, spacing, environments.
    .replace(/\\\\|\\q?quad|\\(?:begin|end)\{[a-z*]+\}/g, " ; ")
    // \frac{AD}{AB} → AD/AB (only simple products of segments, so "a/b" stays a ratio of lengths).
    .replace(/\\d?frac\s*\{\s*([A-Z'·\s²^{}\\cdot]+?)\s*\}\s*\{\s*([A-Z'·\s²^{}\\cdot]+?)\s*\}/g, "$1/$2")
    .replace(/\\(?:widehat|hat|angle)\s*\{\s*([A-Z'\s]+?)\s*\}/g, (_, n: string) => `∠${n.replace(/\s/g, "")}`)
    .replace(/\\angle\s*/g, "∠")
    .replace(/góc\s+(?=[A-Z]'*[A-Z]'*[A-Z])/g, "∠")
    .replace(/\\perp|vuông góc với/g, "⊥")
    .replace(/\\parallel|\/\/|song song với/g, "∥")
    .replace(/\\(?:triangle|Delta)\s*/g, "△")
    .replace(/tam giác\s+(?=[A-Z])/g, "△")
    .replace(/\\sim|đồng dạng với/g, "∽")
    .replace(/\s+bằng\s+(?=[∠A-Z\\]|góc)/g, " = ")
    .replace(/\\cdot|\\times|×|·/g, "·")
    .replace(/\^\{?2\}?|²/g, "²")
    .replace(/\^\{?\\circ\}?|độ\b/g, "°")
    .replace(/\\text\{([^}]*)\}/g, "$1")
    .replace(/\\Rightarrow|\\Leftrightarrow|⇒|⇔|suy ra|nên|do đó|vậy|therefore|so\b/g, " ; ")
    .replace(/góc\s+(?=[A-Z]'*[A-Z]'*[A-Z])/g, "∠")
    .replace(/[{}]/g, "");
}

/** Lettered parts of a statement ("a) …", "b) …"); the whole statement when it has none. */
export function statementParts(statement: string): { letter: string; text: string }[] {
  const re = /(?:^|\s)([a-f])\)\s/g;
  const marks = [...statement.matchAll(re)];
  if (marks.length === 0) return [{ letter: "", text: statement }];
  return marks.map((m, i) => ({ letter: m[1]!, text: statement.slice(m.index!, marks[i + 1]?.index ?? statement.length) }));
}

type Measure = (r: ResolvedFigure) => number | null;

const pts = (name: string) => name.match(/[A-Z]'*/g) ?? [];
const len =
  (seg: string): Measure =>
  (r) => {
    const [a, b] = pts(seg).map((p) => r.points[p]);
    return a && b ? dist(a, b) : null;
  };

/** "ID²", "IJ·IA", "ID/IA" → a product/quotient of lengths (null if it isn't one). */
function product(expr: string): Measure | null {
  const tokens = expr.split(/([·/])/).map((t) => t.trim());
  if (tokens.some((t, i) => i % 2 === 0 && !t)) return null;
  const parts: { m: Measure; divide: boolean }[] = [];
  for (let i = 0; i < tokens.length; i += 2) {
    const f = tokens[i]!;
    const divide = tokens[i - 1] === "/";
    const seg = new RegExp(`^(${SEG})(²)?$`).exec(f);
    if (seg) {
      const l = len(seg[1]!);
      const m: Measure = seg[2] ? (r) => { const v = l(r); return v === null ? null : v * v; } : l;
      parts.push({ m, divide });
    } else if (/^\d+(?:[.,]\d+)?$/.test(f)) {
      const k = Number(f.replace(",", "."));
      parts.push({ m: () => k, divide });
    } else {
      return null;
    }
  }
  return (r) => {
    let acc = 1;
    for (const { m, divide } of parts) {
      const v = m(r);
      if (v === null || (divide && v < 1e-12)) return null;
      acc = divide ? acc / v : acc * v;
    }
    return acc;
  };
}

const relEq = (a: number, b: number) => Math.abs(a - b) <= 2e-3 * Math.max(1, Math.abs(a), Math.abs(b));

interface Claim {
  label: string;
  evaluate: (r: ResolvedFigure) => { passed: boolean; detail: string } | null;
}

const fromCheck = (label: string, check: Omit<FigureCheck, "value" | "role"> & { value?: number | null }): Claim => ({
  label,
  evaluate: (r) => {
    if (!check.refs.every((p) => r.points[p])) return null;
    const res = evaluateFigureCheck({ value: null, role: "derived", ...check }, r);
    return { passed: res.passed, detail: res.detail };
  },
});

function claimsIn(sentence: string): Claim[] {
  const out: Claim[] = [];
  let m: RegExpExecArray | null;

  const perp = new RegExp(`(${SEG})\\s*⊥\\s*(${SEG})(?![A-Z])`, "g");
  while ((m = perp.exec(sentence))) out.push(fromCheck(`${m[1]} ⊥ ${m[2]}`, { kind: "perpendicular", refs: [...pts(m[1]!), ...pts(m[2]!)] }));

  const par = new RegExp(`(${SEG})\\s*∥\\s*(${SEG})(?![A-Z])`, "g");
  while ((m = par.exec(sentence))) out.push(fromCheck(`${m[1]} ∥ ${m[2]}`, { kind: "parallel", refs: [...pts(m[1]!), ...pts(m[2]!)] }));

  // Angle chains: ∠A = ∠B (= ∠C …), or ∠ABC = 90°.
  const angleChain = new RegExp(`∠(${TRI})((?:\\s*=\\s*∠${TRI})+)`, "g");
  while ((m = angleChain.exec(sentence))) {
    const names = [m[1]!, ...[...m[2]!.matchAll(new RegExp(`∠(${TRI})`, "g"))].map((x) => x[1]!)];
    for (let i = 0; i + 1 < names.length; i++) {
      out.push(fromCheck(`∠${names[i]} = ∠${names[i + 1]}`, { kind: "equal_angle", refs: [...pts(names[i]!), ...pts(names[i + 1]!)] }));
    }
  }
  const angleValue = new RegExp(`∠(${TRI})\\s*=\\s*(\\d+(?:[.,]\\d+)?)\\s*°`, "g");
  while ((m = angleValue.exec(sentence))) {
    out.push(fromCheck(`∠${m[1]} = ${m[2]}°`, { kind: "angle_value", refs: pts(m[1]!), value: Number(m[2]!.replace(",", ".")) }));
  }

  // Segment relations: AB = CD, ID² = IJ·IA, AB·CD = EF·GH (no other arithmetic around them).
  const term = `${SEG}²?(?:\\s*[·/]\\s*(?:${SEG}²?|\\d+(?:[.,]\\d+)?))*`;
  // Nothing arithmetic may touch the relation (spaces allowed): "AB = AD + DB" or "AD = AH cos…" isn't a segment claim.
  const segEq = new RegExp(
    `(?<![A-Za-z∠△\\\\])(?<![/+\\-·²*(^]\\s*)(${term})\\s*=\\s*(${term})(?![A-Za-z0-9°(\\\\])(?!\\s*[/+\\-·²*^(\\\\])`,
    "g",
  );
  while ((m = segEq.exec(sentence))) {
    const [lhs, rhs] = [m[1]!.trim(), m[2]!.trim()];
    const a = product(lhs.replace(/\s+/g, ""));
    const b = product(rhs.replace(/\s+/g, ""));
    if (!a || !b) continue;
    out.push({
      label: `${lhs} = ${rhs}`,
      evaluate: (r) => {
        const [x, y] = [a(r), b(r)];
        return x === null || y === null ? null : { passed: relEq(x, y), detail: `${x.toFixed(3)} vs ${y.toFixed(3)}` };
      },
    });
  }

  const collinear = new RegExp(`(${P})\\s*,\\s*(${P})\\s*,\\s*(${P})\\s+(?:thẳng hàng|are collinear|collinear)`, "g");
  while ((m = collinear.exec(sentence))) out.push(fromCheck(`${m[1]}, ${m[2]}, ${m[3]} thẳng hàng`, { kind: "collinear", refs: [m[1]!, m[2]!, m[3]!] }));

  const concyclic = new RegExp(`(${P})\\s*,\\s*(${P})\\s*,\\s*(${P})\\s*,\\s*(${P})\\s+(?:cùng thuộc|cùng nằm trên|are concyclic|lie on)`, "g");
  while ((m = concyclic.exec(sentence))) {
    out.push(fromCheck(`${m[1]}, ${m[2]}, ${m[3]}, ${m[4]} cùng thuộc một đường tròn`, { kind: "concyclic", refs: [m[1]!, m[2]!, m[3]!, m[4]!] }));
  }
  const cyclicQuad = new RegExp(`tứ giác\\s+(${P})(${P})(${P})(${P})\\s+(?:là tứ giác\\s+)?nội tiếp`, "g");
  while ((m = cyclicQuad.exec(sentence))) {
    out.push(fromCheck(`tứ giác ${m[1]}${m[2]}${m[3]}${m[4]} nội tiếp`, { kind: "concyclic", refs: [m[1]!, m[2]!, m[3]!, m[4]!] }));
  }

  // Similar triangles: △XYZ ∽ △UVW → corresponding sides proportional.
  const similar = new RegExp(`△\\s*(${TRI})\\s*∽\\s*△\\s*(${TRI})`, "g");
  while ((m = similar.exec(sentence))) {
    const [x, y] = [pts(m[1]!), pts(m[2]!)];
    out.push({
      label: `△${m[1]} ∽ △${m[2]}`,
      evaluate: (r) => {
        const X = x.map((p) => r.points[p]);
        const Y = y.map((p) => r.points[p]);
        if (X.some((p) => !p) || Y.some((p) => !p)) return null;
        const side = (T: (Vec | undefined)[], i: number) => dist(T[i]!, T[(i + 1) % 3]!);
        const ratios = [0, 1, 2].map((i) => side(X, i) / side(Y, i));
        const passed = relEq(ratios[0]!, ratios[1]!) && relEq(ratios[1]!, ratios[2]!);
        return { passed, detail: `side ratios ${ratios.map((v) => v.toFixed(3)).join(", ")}` };
      },
    });
  }
  return out;
}

const HYPOTHETICAL = /\b(nếu|giả sử|không|chưa|suppose|assume|if|not)\b/i;

/**
 * Measures every recognisable geometric claim in `texts` on the resolved
 * figure. Claims naming points the figure doesn't have are skipped.
 */
export function checkClaims(
  texts: (string | null | undefined)[],
  resolved: ResolvedFigure,
  { exact = true }: { exact?: boolean } = {},
): ClaimResult[] {
  const seen = new Set<string>();
  const out: ClaimResult[] = [];
  for (const text of texts) {
    if (!text) continue;
    for (const sentence of normalize(text).split(/[.;!?\n]|,\s+(?=[a-zà-ỹ])/)) {
      if (HYPOTHETICAL.test(sentence)) continue;
      for (const claim of claimsIn(sentence)) {
        if (seen.has(claim.label)) continue;
        // A schematic figure is one valid instance: shape-independent facts hold, specific angle values needn't.
        if (!exact && /°$/.test(claim.label)) continue;
        seen.add(claim.label);
        const res = claim.evaluate(resolved);
        if (res) out.push({ label: claim.label, ...res });
      }
    }
  }
  return out;
}

/** Exposed for tests. */
export const _internal = { normalize, claimsIn, angleDeg };
