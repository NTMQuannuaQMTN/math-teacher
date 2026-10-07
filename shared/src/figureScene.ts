/**
 * Platform-neutral figure scene: turns a resolved construction plus view
 * state into screen-space primitives, and hit-tests taps against them.
 * Renderers (React Native SVG today, web/Next.js later) only draw these
 * primitives; they contain no geometry logic of their own.
 */
import { angleDeg, distToSegment, extendLine, isDraggable, toScreen, type ResolvedFigure, type Vec, type ViewTransform } from "./geometry";
import type { Figure } from "./solution";

export type Emphasis = "normal" | "highlight" | "dim";

export interface SceneLine {
  id: string;
  a: Vec;
  b: Vec;
  construction: boolean;
  emphasis: Emphasis;
  label: string | null;
  labelAt: Vec | null;
}
export interface SceneCircle {
  id: string;
  c: Vec;
  r: number;
  construction: boolean;
  emphasis: Emphasis;
}
export interface SceneAngle {
  id: string;
  /** SVG path for the arc (or the right-angle square). */
  path: string;
  label: string | null;
  labelAt: Vec;
  emphasis: Emphasis;
  vertex: Vec;
  radius: number;
  /** Directions (screen space, radians) bounding the angle, for hit-testing. */
  start: number;
  sweep: number;
}
export interface ScenePoint {
  id: string;
  p: Vec;
  label: string;
  labelAt: Vec;
  emphasis: Emphasis;
  draggable: boolean;
}
export interface SceneMark {
  /** Short strokes (equal-length ticks or parallel chevrons), as SVG paths. */
  path: string;
  emphasis: Emphasis;
}
export interface Scene {
  lines: SceneLine[];
  circles: SceneCircle[];
  angles: SceneAngle[];
  points: ScenePoint[];
  marks: SceneMark[];
  /** Fills for highlighted polygons ("tam giác ABC" in the selected step): only present while highlighted. */
  polygons: { id: string; path: string }[];
}

export interface SceneState {
  /** Objects to emphasise (current hint/step or the user's selection). Others are dimmed when non-empty. */
  highlighted: ReadonlySet<string>;
  /** Construction elements revealed so far (hidden until a step shows them). */
  shownConstructions: ReadonlySet<string>;
  showLabels: boolean;
}

const sub = (a: Vec, b: Vec): Vec => ({ x: a.x - b.x, y: a.y - b.y });
const norm = (v: Vec): Vec => {
  const l = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / l, y: v.y / l };
};
const fmt = (n: number) => Math.round(n * 10) / 10;

/** Greedy label placement: returns the first candidate whose box doesn't overlap placed labels or points. */
class LabelPlacer {
  private boxes: { x: number; y: number; w: number; h: number }[] = [];
  addPoint(p: Vec, size = 10) {
    this.boxes.push({ x: p.x - size / 2, y: p.y - size / 2, w: size, h: size });
  }
  place(text: string, fontSize: number, candidates: Vec[]): Vec {
    const w = Math.max(10, [...text].length * fontSize * 0.55);
    const h = fontSize * 1.05;
    const boxAt = (c: Vec) => ({ x: c.x - w / 2, y: c.y - h / 2, w, h });
    const overlaps = (b: { x: number; y: number; w: number; h: number }) =>
      this.boxes.some((o) => b.x < o.x + o.w && b.x + b.w > o.x && b.y < o.y + o.h && b.y + b.h > o.y);
    const chosen = candidates.find((c) => !overlaps(boxAt(c))) ?? candidates[0]!;
    this.boxes.push(boxAt(chosen));
    return chosen;
  }
}

/** Ids of objects that should be emphasised given the targets (points pull in nothing; lines pull in their endpoints). */
function emphasisOf(id: string, state: SceneState, related: string[] = []): Emphasis {
  if (state.highlighted.size === 0) return "normal";
  if (state.highlighted.has(id) || related.some((r) => state.highlighted.has(r))) return "highlight";
  return "dim";
}

export function buildScene(figure: Figure, resolved: ResolvedFigure, t: ViewTransform, state: SceneState): Scene {
  const S = (id: string): Vec | null => {
    const p = resolved.points[id];
    return p ? toScreen(p, t) : null;
  };
  // A construction is shown from the step that reveals it — and whenever the selected step or hint names it.
  const visible = (style: "given" | "construction", id: string) => style === "given" || state.shownConstructions.has(id) || state.highlighted.has(id);

  // Figure centre (screen) for placing labels outward.
  const shown = figure.points.filter((p) => !p.hidden && resolved.points[p.id]).map((p) => S(p.id)!);
  const centre = shown.length
    ? { x: shown.reduce((s, p) => s + p.x, 0) / shown.length, y: shown.reduce((s, p) => s + p.y, 0) / shown.length }
    : { x: 0, y: 0 };

  const placer = new LabelPlacer();
  for (const p of figure.points) {
    const sp = !p.hidden ? S(p.id) : null;
    if (sp) placer.addPoint(sp);
  }
  // Equal-length ticks and parallel arrows sit at segment midpoints: keep labels off them.
  for (const m of figure.marks) {
    for (const target of m.targets) {
      const def = figure.lines.find((l) => l.id === target);
      const a = def ? S(def.from) : null;
      const b = def ? S(def.to) : null;
      if (a && b) placer.addPoint({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, 16);
    }
  }
  // Point labels first (most important), pushed outward from the figure's centre, trying 8 directions.
  const pointLabelAt = new Map<string, Vec>();
  for (const p of figure.points) {
    if (p.hidden) continue;
    const sp = S(p.id);
    if (!sp) continue;
    let d = sub(sp, centre);
    if (Math.hypot(d.x, d.y) < 1) d = { x: 1, y: -1 };
    const base = Math.atan2(d.y, d.x);
    const candidates = [0, 0.6, -0.6, 1.2, -1.2, 1.9, -1.9, Math.PI].map((k) => ({
      x: sp.x + Math.cos(base + k) * 15,
      y: sp.y + Math.sin(base + k) * 15,
    }));
    pointLabelAt.set(p.id, placer.place(p.label, 15, candidates));
  }

  const lines: SceneLine[] = [];
  const reach = 4000;
  for (const l of figure.lines) {
    if (!visible(l.style, l.id)) continue;
    let a = S(l.from);
    let b = S(l.to);
    if (!a || !b) continue;
    if (l.kind !== "segment") [a, b] = extendLine(a, b, l.kind, reach);
    const from = S(l.from)!;
    const to = S(l.to)!;
    const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
    const n = norm({ x: -(b.y - a.y), y: b.x - a.x });
    const outward = (mid.x - centre.x) * n.x + (mid.y - centre.y) * n.y >= 0 ? 1 : -1;
    const along = (f: number, off: number) => ({
      x: from.x + (to.x - from.x) * f + n.x * off * outward,
      y: from.y + (to.y - from.y) * f + n.y * off * outward,
    });
    const labelText = state.showLabels ? l.label : null;
    lines.push({
      id: l.id,
      a,
      b,
      construction: l.style === "construction",
      emphasis: emphasisOf(l.id, state),
      label: labelText,
      labelAt: labelText
        ? placer.place(labelText, 12, [along(0.5, 14), along(0.35, 14), along(0.65, 14), along(0.5, -14), along(0.5, 24), along(0.3, -14), along(0.7, -14)])
        : null,
    });
  }

  const circles: SceneCircle[] = [];
  for (const c of figure.circles) {
    const g = resolved.circles[c.id];
    if (!g || !visible(c.style, c.id)) continue;
    circles.push({
      id: c.id,
      c: toScreen({ x: g.cx, y: g.cy }, t),
      r: g.r * t.scale,
      construction: c.style === "construction",
      emphasis: emphasisOf(c.id, state),
    });
  }

  const angles: SceneAngle[] = [];
  const perVertex = new Map<string, number>();
  for (const a of figure.angles) {
    if (!visible(a.style, a.id)) continue;
    const v = S(a.vertex);
    const p1 = S(a.from);
    const p2 = S(a.to);
    if (!v || !p1 || !p2) continue;
    const k = perVertex.get(a.vertex) ?? 0;
    perVertex.set(a.vertex, k + 1);
    const u1 = norm(sub(p1, v));
    const u2 = norm(sub(p2, v));
    const shortest = Math.min(Math.hypot(p1.x - v.x, p1.y - v.y), Math.hypot(p2.x - v.x, p2.y - v.y));
    const r = Math.min(20 + k * 6, Math.max(10, shortest * 0.4));
    const cross = u1.x * u2.y - u1.y * u2.x;
    const start = Math.atan2(u1.y, u1.x);
    const interior = (angleDeg(p1, v, p2) * Math.PI) / 180;
    const sweep = cross >= 0 ? interior : -interior;
    let path: string;
    // A square only when the angle really is 90° — a skewed "square" on a dragged, non-right angle looks broken.
    const isRight = a.right && Math.abs((interior * 180) / Math.PI - 90) < 0.5;
    if (isRight) {
      const s = Math.min(12, r);
      const q1 = { x: v.x + u1.x * s, y: v.y + u1.y * s };
      const q2 = { x: v.x + u2.x * s, y: v.y + u2.y * s };
      const q3 = { x: q1.x + u2.x * s, y: q1.y + u2.y * s };
      path = `M${fmt(q1.x)} ${fmt(q1.y)} L${fmt(q3.x)} ${fmt(q3.y)} L${fmt(q2.x)} ${fmt(q2.y)}`;
    } else {
      const e1 = { x: v.x + u1.x * r, y: v.y + u1.y * r };
      const e2 = { x: v.x + u2.x * r, y: v.y + u2.y * r };
      path = `M${fmt(e1.x)} ${fmt(e1.y)} A${fmt(r)} ${fmt(r)} 0 0 ${cross >= 0 ? 1 : 0} ${fmt(e2.x)} ${fmt(e2.y)}`;
    }
    const bis = norm({ x: u1.x + u2.x, y: u1.y + u2.y });
    // The square mark already says "90°".
    const text = state.showLabels && a.label && !(isRight && /^\s*90\s*°?\s*$/.test(a.label)) ? a.label : null;
    const at = (d: number, turn = 0) => {
      const c = Math.cos(turn);
      const s2 = Math.sin(turn);
      const dir = { x: bis.x * c - bis.y * s2, y: bis.x * s2 + bis.y * c };
      return { x: v.x + dir.x * d, y: v.y + dir.y * d };
    };
    angles.push({
      id: a.id,
      path,
      label: text,
      labelAt: text ? placer.place(text, 12, [at(r + 13), at(r + 22), at(r + 13, 0.35), at(r + 13, -0.35), at(r + 30)]) : at(r + 13),
      emphasis: emphasisOf(a.id, state),
      vertex: v,
      radius: r,
      start,
      sweep,
    });
  }

  const points: ScenePoint[] = [];
  for (const p of figure.points) {
    if (p.hidden) continue;
    const s = S(p.id);
    if (!s) continue;
    points.push({
      id: p.id,
      p: s,
      label: p.label,
      labelAt: pointLabelAt.get(p.id) ?? { x: s.x + 14, y: s.y - 14 },
      emphasis: emphasisOf(p.id, state),
      draggable: isDraggable(p),
    });
  }

  const marks: SceneMark[] = [];
  for (const m of figure.marks) {
    for (const target of m.targets) {
      const line = lines.find((l) => l.id === target);
      const def = figure.lines.find((l) => l.id === target);
      if (!line || !def) continue;
      const a = S(def.from)!;
      const b = S(def.to)!;
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const u = norm(sub(b, a));
      const n = { x: -u.y, y: u.x };
      const parts: string[] = [];
      for (let i = 0; i < m.group; i++) {
        const off = (i - (m.group - 1) / 2) * 5;
        const c = { x: mid.x + u.x * off, y: mid.y + u.y * off };
        if (m.kind === "equal") {
          parts.push(`M${fmt(c.x - n.x * 6)} ${fmt(c.y - n.y * 6)} L${fmt(c.x + n.x * 6)} ${fmt(c.y + n.y * 6)}`);
        } else {
          const tip = { x: c.x + u.x * 4, y: c.y + u.y * 4 };
          parts.push(
            `M${fmt(tip.x - u.x * 7 - n.x * 5)} ${fmt(tip.y - u.y * 7 - n.y * 5)} L${fmt(tip.x)} ${fmt(tip.y)} L${fmt(tip.x - u.x * 7 + n.x * 5)} ${fmt(tip.y - u.y * 7 + n.y * 5)}`,
          );
        }
      }
      marks.push({ path: parts.join(" "), emphasis: line.emphasis });
    }
  }

  // A named polygon (id "poly_ABC") is not part of the figure: it only exists as a fill while it is highlighted.
  const polygons: Scene["polygons"] = [];
  for (const id of state.highlighted) {
    if (!id.startsWith("poly_")) continue;
    const vertices = (id.slice(5).match(/[A-Z]'*/g) ?? []).map((v) => S(v));
    if (vertices.length < 3 || vertices.some((v) => !v)) continue;
    polygons.push({ id, path: `M${vertices.map((v) => `${fmt(v!.x)} ${fmt(v!.y)}`).join(" L")} Z` });
  }
  return { lines, circles, angles, points, marks, polygons };
}

export type HitKind = "point" | "angle" | "line" | "circle";

/** Finds the object under a tap (screen coordinates). Points win, then angles, lines, circles. */
export function hitTest(scene: Scene, at: Vec, tolerance = 14): { id: string; kind: HitKind } | null {
  let best: { id: string; kind: HitKind; d: number } | null = null;
  const consider = (id: string, kind: HitKind, d: number, limit: number) => {
    if (d <= limit && (!best || d < best.d)) best = { id, kind, d };
  };
  for (const p of scene.points) consider(p.id, "point", Math.hypot(p.p.x - at.x, p.p.y - at.y), tolerance + 8);
  if (best) return best;
  for (const a of scene.angles) {
    const d = Math.hypot(at.x - a.vertex.x, at.y - a.vertex.y);
    if (d > a.radius + tolerance || d < 4) continue;
    let rel = Math.atan2(at.y - a.vertex.y, at.x - a.vertex.x) - a.start;
    while (rel > Math.PI) rel -= 2 * Math.PI;
    while (rel < -Math.PI) rel += 2 * Math.PI;
    const inside = a.sweep >= 0 ? rel >= -0.05 && rel <= a.sweep + 0.05 : rel <= 0.05 && rel >= a.sweep - 0.05;
    if (inside) consider(a.id, "angle", Math.abs(d - a.radius) / 2, a.radius + tolerance);
  }
  if (best) return best;
  for (const l of scene.lines) consider(l.id, "line", distToSegment(at, l.a, l.b), tolerance);
  for (const c of scene.circles) consider(c.id, "circle", Math.abs(Math.hypot(at.x - c.c.x, at.y - c.c.y) - c.r), tolerance);
  return best;
}
