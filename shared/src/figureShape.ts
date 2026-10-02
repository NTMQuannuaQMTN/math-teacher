import type { ModelLesson } from "./solution";

/**
 * Gives the problem's triangle a clear, textbook shape when the model drew it nearly degenerate.
 *
 * Only when the triangle's three vertices are the figure's only free points (everything else is constructed
 * from them, so it follows the move). If the statement says "AB < AC" (or ">") and the drawn sides differ by
 * less than 20 %, or says "nhọn" and an angle is ≥ 85°, the shared vertex is moved: it keeps the base,
 * goes 35 % of the way along it (towards the shorter side) at height 0.65 × base. That makes the sides differ
 * by about 25 % and all angles clearly acute, so constructions like the incircle's contact points don't
 * collapse onto each other.
 */
export function regularizeTriangle(lesson: ModelLesson): { lesson: ModelLesson; moved: string | null } {
  const figure = lesson.figure;
  if (!figure) return { lesson, moved: null };
  const statement = lesson.analysis.statement.replace(/\$/g, "");
  const tri = /tam giác\s+([A-Z])([A-Z])([A-Z])(?![A-Z])/u.exec(statement);
  if (!tri) return { lesson, moved: null };
  const vertices = [tri[1]!, tri[2]!, tri[3]!];
  const free = figure.points.filter((p) => p.kind === "free");
  if (free.length !== 3 || !vertices.every((v) => free.some((p) => p.id === v && p.x !== null && p.y !== null))) return { lesson, moved: null };
  const at = (id: string) => {
    const p = free.find((q) => q.id === id)!;
    return { x: p.x!, y: p.y! };
  };
  const d = (a: string, b: string) => Math.hypot(at(a).x - at(b).x, at(a).y - at(b).y);
  const angleAt = (v: string, a: string, b: string) => {
    const [p, q, r] = [at(v), at(a), at(b)];
    const u = { x: q.x - p.x, y: q.y - p.y };
    const w = { x: r.x - p.x, y: r.y - p.y };
    return (Math.acos((u.x * w.x + u.y * w.y) / (Math.hypot(u.x, u.y) * Math.hypot(w.x, w.y))) * 180) / Math.PI;
  };

  // Which vertex to move, and towards which base vertex.
  let apex: string | null = null;
  let nearer: string | null = null;
  const ineq = new RegExp(`(?<![A-Z])([A-Z])([A-Z])\\s*(<|>)\\s*([A-Z])([A-Z])(?![A-Z])`, "u").exec(statement);
  if (ineq) {
    const [s1, s2, op] = [[ineq[1]!, ineq[2]!], [ineq[4]!, ineq[5]!], ineq[3]!];
    const shared = s1.find((v) => s2.includes(v));
    if (shared && vertices.includes(shared)) {
      const [shortSide, longSide] = op === "<" ? [s1, s2] : [s2, s1];
      const [short, long] = [d(shortSide[0]!, shortSide[1]!), d(longSide[0]!, longSide[1]!)];
      if (!(long > short * 1.2)) {
        apex = shared;
        nearer = shortSide.find((v) => v !== shared)!;
      }
    }
  }
  if (!apex && /nhọn/u.test(statement.slice(tri.index, tri.index + 40))) {
    const worst = vertices.map((v) => ({ v, angle: angleAt(v, ...(vertices.filter((x) => x !== v) as [string, string])) })).sort((a, b) => b.angle - a.angle)[0]!;
    if (worst.angle >= 85) {
      apex = worst.v;
      nearer = null;
    }
  }
  if (!apex) return { lesson, moved: null };

  const [p, q] = vertices.filter((v) => v !== apex) as [string, string];
  const [from, to] = nearer === q ? [q, p] : [p, q];
  const P = at(from);
  const Q = at(to);
  const A = at(apex);
  const L = Math.hypot(Q.x - P.x, Q.y - P.y);
  const u = { x: (Q.x - P.x) / L, y: (Q.y - P.y) / L };
  let n = { x: -u.y, y: u.x };
  // Keep the apex on the side of the base where the model drew it.
  if ((A.x - P.x) * n.x + (A.y - P.y) * n.y < 0) n = { x: -n.x, y: -n.y };
  const t = nearer ? 0.35 : 0.42;
  const target = { x: P.x + u.x * t * L + n.x * 0.65 * L, y: P.y + u.y * t * L + n.y * 0.65 * L };
  const round = (v: number) => Math.round(v * 100) / 100;
  return {
    lesson: {
      ...lesson,
      figure: { ...figure, points: figure.points.map((pt) => (pt.id === apex ? { ...pt, x: round(target.x), y: round(target.y) } : pt)) },
    },
    moved: apex,
  };
}
