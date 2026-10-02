/**
 * Makes the figure show what the lesson talks about.
 *
 * Models often draw only the opening situation of a geometry problem and
 * leave out the segments the solution reasons with ("ID² = IJ·IA", "∠IHD"),
 * or even points introduced in later parts ("Gọi H là…"). This reads the
 * problem statement, hints and steps and:
 *   - adds every mentioned segment that isn't drawn yet (free, deterministic):
 *     segments named in the problem are drawn from the start; ones the
 *     solution introduces are construction lines revealed by the first step
 *     that uses them;
 *   - adds an arc for every mentioned angle whose three points are drawn;
 *   - adds what each step talks about (segments, angles, named circles) to that
 *     step's highlight, so selecting a step lights up exactly its objects;
 *   - focuses the mentioned objects in hints that focus nothing;
 *   - reports points and circles that are named but missing from the figure,
 *     which can't be invented here and go back to the model as feedback.
 */
import { dist, type ResolvedFigure, type Vec } from "./geometry";
import type { Figure, LineDef, ModelLesson } from "./solution";

const MAX_LINES = 40;
const MAX_ANGLES = 16;
const MAX_ACTIONS = 4;
const MAX_TARGETS = 10;
const MAX_HIGHLIGHT = 6;
const MAX_FOCUS = 6;

type Pair = [string, string];

interface Mentions {
  segments: Pair[];
  /** Angle mentions as [from, vertex, to]. */
  angles: [string, string, string][];
  /** Letters that look like point names but aren't points of the figure. */
  unknownPoints: Set<string>;
  /** Circle names written as "(S)" or "(O; R)". */
  circles: Set<string>;
}

const RUN = /(?<![\p{L}\d])((?:[A-Z]'*){1,5})(?![\p{L}\d_])/gu;
const ANGLE_BEFORE = /(\\widehat\{|\\hat\{|\\angle\s*|∠\s*|góc\s+)$/;
const POLYGON_BEFORE = /(\\triangle\s*|\\Delta\s*|Δ\s*|tam giác\s+|tứ giác\s+|hình thang\s+|hình bình hành\s+|hình chữ nhật\s+|hình vuông\s+|hình thoi\s+|triangle\s+|quadrilateral\s+)$/i;
const NAMING_BEFORE = /(Gọi\s+|gọi\s+|điểm\s+|tại\s+|lấy\s+|point\s+|at\s+|Let\s+)$/;
const CIRCLE_NAME = /\(\s*([A-Z]'*)\s*(?:\)|;|,)/g;

function splitRun(run: string): string[] {
  return run.match(/[A-Z]'*/g) ?? [];
}

function scan(text: string, pointIds: Set<string>, out: Mentions): void {
  for (const m of text.matchAll(CIRCLE_NAME)) out.circles.add(m[1]!);
  for (const m of text.matchAll(RUN)) {
    const letters = splitRun(m[1]!);
    const before = text.slice(Math.max(0, m.index! - 24), m.index!);
    const unknown = letters.filter((l) => !pointIds.has(l));
    const inCircleName = /\(\s*$/.test(before) && letters.length === 1;

    // Unknown point names: only where the text clearly names points, so that
    // quantities (S, R, P) and abbreviations aren't mistaken for points.
    if (!inCircleName && unknown.length === 1 && (letters.length > 1 || NAMING_BEFORE.test(before))) {
      out.unknownPoints.add(unknown[0]!);
    }
    if (unknown.length > 0) continue;

    if (letters.length === 3 && ANGLE_BEFORE.test(before)) {
      const [a, v, b] = letters as [string, string, string];
      out.angles.push([a, v, b]);
      out.segments.push([v, a], [v, b]);
    } else if (letters.length >= 3 && POLYGON_BEFORE.test(before)) {
      letters.forEach((l, i) => out.segments.push([l, letters[(i + 1) % letters.length]!]));
    } else if (letters.length === 2) {
      out.segments.push([letters[0]!, letters[1]!]);
    }
  }
}

function mentionsOf(texts: (string | null | undefined)[], pointIds: Set<string>): Mentions {
  const out: Mentions = { segments: [], angles: [], unknownPoints: new Set(), circles: new Set() };
  for (const t of texts) if (t) scan(t, pointIds, out);
  return out;
}

/** Is segment PQ already drawn — as its own line, or as part of a drawn line through both points? */
function covered(figure: Figure, resolved: ResolvedFigure, [p, q]: Pair, size: number): LineDef | null {
  const P = resolved.points[p];
  const Q = resolved.points[q];
  for (const l of figure.lines) {
    if ((l.from === p && l.to === q) || (l.from === q && l.to === p)) return l;
    const A = resolved.points[l.from];
    const B = resolved.points[l.to];
    if (!A || !B || !P || !Q) continue;
    const d = { x: B.x - A.x, y: B.y - A.y };
    const len2 = d.x * d.x + d.y * d.y;
    if (len2 < 1e-12) continue;
    const param = (X: Vec) => ((X.x - A.x) * d.x + (X.y - A.y) * d.y) / len2;
    const off = (X: Vec) => Math.abs((X.x - A.x) * d.y - (X.y - A.y) * d.x) / Math.sqrt(len2);
    if (off(P) > 1e-6 * size || off(Q) > 1e-6 * size) continue;
    const [tp, tq] = [param(P), param(Q)];
    const inside = (t: number) => (l.kind === "line" ? true : l.kind === "ray" ? t >= -1e-6 : t >= -1e-6 && t <= 1 + 1e-6);
    if (inside(tp) && inside(tq)) return l;
  }
  return null;
}

export interface FigureCompletion {
  lesson: ModelLesson;
  /** Human-readable names of points/circles the text uses but the figure lacks. */
  missing: string[];
  /** Ids of the segments that were added. */
  added: string[];
}

export function completeFigure(lesson: ModelLesson, resolved: ResolvedFigure): FigureCompletion {
  const figure = lesson.figure;
  if (!figure) return { lesson, missing: [], added: [] };

  const pointIds = new Set(figure.points.map((p) => p.id));
  const visible = new Set(figure.points.filter((p) => !p.hidden).map((p) => p.id));
  const xs = Object.values(resolved.points).map((p) => p.x);
  const ys = Object.values(resolved.points).map((p) => p.y);
  const size = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 1e-6);

  const a = lesson.analysis;
  const problem = mentionsOf([a.statement, ...a.givens, ...a.unknowns], pointIds);
  const perStep = lesson.steps.map((s) => {
    const hintTexts = lesson.hints.filter((h) => h.stepId === s.id).flatMap((h) => [h.question, h.cue, h.explanation, h.math]);
    return mentionsOf([s.title, s.explanation, s.math, s.reason, ...hintTexts], pointIds);
  });

  // Points and circles named anywhere but missing from the figure.
  const missing: string[] = [];
  const unknownPoints = new Set([...problem.unknownPoints, ...perStep.flatMap((m) => [...m.unknownPoints])]);
  for (const p of unknownPoints) missing.push(`point ${p}`);
  const circleNames = new Set([...problem.circles, ...perStep.flatMap((m) => [...m.circles])]);
  for (const name of circleNames) {
    const has = figure.circles.some((c) => c.center === name || c.id === name || c.id === `c_${name}` || (c.label ?? "").includes(name));
    if (!has) missing.push(`circle (${name})`);
  }

  // Add missing segments.
  const lines = [...figure.lines];
  const ids = new Set([...figure.points.map((p) => p.id), ...figure.circles.map((c) => c.id), ...lines.map((l) => l.id), ...figure.angles.map((x) => x.id)]);
  const added: string[] = [];
  const lineFor = new Map<string, string>(); // "A|B" → line id covering it
  const key = ([p, q]: Pair) => (p < q ? `${p}|${q}` : `${q}|${p}`);
  const steps = lesson.steps.map((s) => ({ ...s, geometryActions: s.geometryActions.map((x) => ({ ...x, targets: [...x.targets] })) }));

  /** Reveal a new object in the step that first uses it; drawn from the start if that step has no room. */
  const reveal = (id: string, stepIndex: number | null): "given" | "construction" => {
    if (stepIndex === null) return "given";
    const step = steps[stepIndex]!;
    const show = step.geometryActions.find((x) => x.action === "show" && x.targets.length < MAX_TARGETS);
    if (show) {
      show.targets.push(id);
      return "construction";
    }
    if (step.geometryActions.length < MAX_ACTIONS) {
      step.geometryActions.push({ action: "show", targets: [id] });
      return "construction";
    }
    return "given";
  };

  const ensure = (pair: Pair, stepIndex: number | null): string | null => {
    const k = key(pair);
    if (lineFor.has(k)) return lineFor.get(k)!;
    const [p, q] = pair;
    if (p === q || !visible.has(p) || !visible.has(q)) return null;
    const P = resolved.points[p];
    const Q = resolved.points[q];
    if (!P || !Q || dist(P, Q) < 1e-6 * size) return null;
    const existing = covered({ ...figure, lines }, resolved, pair, size);
    if (existing) {
      lineFor.set(k, existing.id);
      return existing.id;
    }
    if (lines.length >= MAX_LINES) return null;
    let id = `seg_${p}${q}`;
    for (let n = 2; ids.has(id); n++) id = `seg_${p}${q}_${n}`;
    lines.push({ id, kind: "segment", from: p, to: q, style: reveal(id, stepIndex), label: null });
    ids.add(id);
    added.push(id);
    lineFor.set(k, id);
    return id;
  };

  for (const pair of problem.segments) ensure(pair, null);
  perStep.forEach((m, i) => m.segments.forEach((pair) => ensure(pair, i)));

  // Arcs for mentioned angles: the problem's from the start, the solution's revealed by the step that uses them.
  const angles = [...figure.angles];
  const angleId = ([f, v, t]: [string, string, string]) =>
    angles.find((x) => x.vertex === v && ((x.from === f && x.to === t) || (x.from === t && x.to === f)))?.id;
  const ensureAngle = ([f, v, t]: [string, string, string], stepIndex: number | null) => {
    if (angleId([f, v, t]) || angles.length >= MAX_ANGLES || ![f, v, t].every((p) => visible.has(p)) || f === t) return;
    const [F, V, T] = [resolved.points[f], resolved.points[v], resolved.points[t]];
    if (!F || !V || !T || dist(F, V) < 1e-6 * size || dist(T, V) < 1e-6 * size) return;
    // A straight or zero angle has no arc to draw.
    const cross = (F.x - V.x) * (T.y - V.y) - (F.y - V.y) * (T.x - V.x);
    if (Math.abs(cross) < 1e-6 * size * size) return;
    let id = `ang_${f}${v}${t}`;
    for (let n = 2; ids.has(id); n++) id = `ang_${f}${v}${t}_${n}`;
    angles.push({ id, from: f, vertex: v, to: t, label: null, right: false, style: reveal(id, stepIndex) });
    ids.add(id);
    added.push(id);
  };
  problem.angles.forEach((ang) => ensureAngle(ang, null));
  perStep.forEach((m, i) => m.angles.forEach((ang) => ensureAngle(ang, i)));

  const circleId = (name: string) =>
    figure.circles.find((c) => c.center === name || c.id === name || c.id === `c_${name}` || (c.label ?? "").includes(name))?.id;
  const targetsOf = (m: Mentions) => {
    const out: string[] = [];
    for (const pair of m.segments) {
      const id = lineFor.get(key(pair));
      if (id && !out.includes(id)) out.push(id);
    }
    for (const ang of m.angles) {
      const id = angleId(ang);
      if (id && !out.includes(id)) out.push(id);
    }
    for (const name of m.circles) {
      const id = circleId(name);
      if (id && !out.includes(id)) out.push(id);
    }
    return out;
  };
  // Each step highlights what it talks about: added to the model's own highlight (which keeps its order), or
  // as a new highlight when it has none.
  steps.forEach((step, i) => {
    const mentioned = targetsOf(perStep[i]!);
    if (mentioned.length === 0) return;
    const highlight = step.geometryActions.find((x) => x.action === "highlight");
    if (highlight) {
      for (const id of mentioned) if (!highlight.targets.includes(id) && highlight.targets.length < MAX_TARGETS) highlight.targets.push(id);
    } else if (step.geometryActions.length < MAX_ACTIONS) {
      step.geometryActions.push({ action: "highlight", targets: mentioned.slice(0, MAX_HIGHLIGHT) });
    }
  });
  const hints = lesson.hints.map((h) => {
    if (h.focus.length > 0) return h;
    const focus = targetsOf(mentionsOf([h.question, h.cue, h.explanation, h.math], pointIds)).slice(0, MAX_FOCUS);
    return focus.length > 0 ? { ...h, focus } : h;
  });

  return { lesson: { ...lesson, figure: { ...figure, lines, angles }, steps, hints }, missing, added };
}

const REFERENCED = /^(seg|line|ray|ang)_((?:[A-Z]'*){2,3})$/;

/**
 * Hints and steps are written before the figure, and may highlight "seg_IK" or
 * "ang_IHD" that the figure then forgets to define. Define them (when their
 * points exist) instead of dropping the highlight: segments/lines as
 * construction lines revealed by the first step that uses them, angles as arcs.
 */
export function defineReferencedObjects(lesson: ModelLesson): ModelLesson {
  const figure = lesson.figure;
  if (!figure) return lesson;
  const pointIds = new Set(figure.points.map((p) => p.id));
  const ids = new Set([...figure.points, ...figure.circles, ...figure.lines, ...figure.angles].map((x) => x.id));
  const steps = lesson.steps.map((s) => ({ ...s, geometryActions: s.geometryActions.map((x) => ({ ...x, targets: [...x.targets] })) }));
  const lines = [...figure.lines];
  const angles = [...figure.angles];

  const firstStep = new Map<string, number>();
  steps.forEach((s, i) => {
    const hintTargets = lesson.hints.filter((h) => h.stepId === s.id).flatMap((h) => h.focus);
    for (const t of [...s.geometryActions.flatMap((a) => a.targets), ...hintTargets]) if (!firstStep.has(t)) firstStep.set(t, i);
  });
  for (const h of lesson.hints) for (const t of h.focus) if (!firstStep.has(t)) firstStep.set(t, -1);

  for (const [id, stepIndex] of firstStep) {
    if (ids.has(id)) continue;
    const m = REFERENCED.exec(id);
    if (!m) continue;
    const names = m[2]!.match(/[A-Z]'*/g)!;
    if (!names.every((n) => pointIds.has(n))) continue;
    const kind = m[1]!;
    if (kind === "ang" && names.length === 3 && angles.length < 16) {
      angles.push({ id, from: names[0]!, vertex: names[1]!, to: names[2]!, label: null, right: false, style: "given" });
      ids.add(id);
    } else if (kind !== "ang" && names.length === 2 && lines.length < MAX_LINES) {
      let style: LineDef["style"] = "given";
      const step = stepIndex >= 0 ? steps[stepIndex] : undefined;
      if (step) {
        const show = step.geometryActions.find((x) => x.action === "show" && x.targets.length < MAX_TARGETS);
        if (show) {
          show.targets.push(id);
          style = "construction";
        } else if (step.geometryActions.length < MAX_ACTIONS) {
          step.geometryActions.push({ action: "show", targets: [id] });
          style = "construction";
        }
      }
      lines.push({ id, kind: kind === "seg" ? "segment" : (kind as "line" | "ray"), from: names[0]!, to: names[1]!, style, label: null });
      ids.add(id);
    }
  }
  return { ...lesson, steps, figure: { ...figure, lines, angles } };
}

export interface FigureCoverage {
  /** Distinct segments / angles the problem, hints and steps name, and how many of them the figure draws. */
  segments: { mentioned: number; drawn: number };
  angles: { mentioned: number; drawn: number };
  /** Points and circles named in the text but absent from the figure. */
  missing: string[];
  /** Steps that name at least one drawn object, and those whose highlight/show covers all of them. */
  steps: { mentioning: number; synced: number };
}

/** Measures — without changing anything — how completely a figure shows what its lesson talks about. */
export function figureCoverage(lesson: ModelLesson, resolved: ResolvedFigure): FigureCoverage | null {
  const figure = lesson.figure;
  if (!figure) return null;
  const pointIds = new Set(figure.points.map((p) => p.id));
  const xs = Object.values(resolved.points).map((p) => p.x);
  const ys = Object.values(resolved.points).map((p) => p.y);
  const size = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 1e-6);
  const a = lesson.analysis;
  const problem = mentionsOf([a.statement, ...a.givens, ...a.unknowns], pointIds);
  const perStep = lesson.steps.map((s) => {
    const hintTexts = lesson.hints.filter((h) => h.stepId === s.id).flatMap((h) => [h.question, h.cue, h.explanation, h.math]);
    return mentionsOf([s.title, s.explanation, s.math, s.reason, ...hintTexts], pointIds);
  });
  const segKey = ([p, q]: Pair) => (p < q ? `${p}|${q}` : `${q}|${p}`);
  const angKey = ([f, v, t]: [string, string, string]) => (f < t ? `${f}|${v}|${t}` : `${t}|${v}|${f}`);
  const segmentId = (pair: Pair) => (pair[0] === pair[1] ? undefined : covered(figure, resolved, pair, size)?.id);
  const angleId = ([f, v, t]: [string, string, string]) =>
    figure.angles.find((x) => x.vertex === v && ((x.from === f && x.to === t) || (x.from === t && x.to === f)))?.id;

  const all = [problem, ...perStep];
  const segs = new Map<string, Pair>();
  const angs = new Map<string, [string, string, string]>();
  for (const m of all) {
    for (const p of m.segments) if (p[0] !== p[1]) segs.set(segKey(p), p);
    for (const t of m.angles) if (t[0] !== t[2]) angs.set(angKey(t), t);
  }
  const missing = [...new Set(all.flatMap((m) => [...m.unknownPoints]))].map((p) => `point ${p}`);
  for (const name of new Set(all.flatMap((m) => [...m.circles]))) {
    if (!figure.circles.some((c) => c.center === name || c.id === name || c.id === `c_${name}` || (c.label ?? "").includes(name))) missing.push(`circle (${name})`);
  }

  let mentioning = 0;
  let synced = 0;
  lesson.steps.forEach((s, i) => {
    const m = perStep[i]!;
    const wanted = new Set([...m.segments.map(segmentId), ...m.angles.map(angleId)].filter((x): x is string => !!x));
    if (wanted.size === 0) return;
    mentioning++;
    const shown = new Set(s.geometryActions.flatMap((x) => x.targets));
    if ([...wanted].every((id) => shown.has(id))) synced++;
  });

  return {
    segments: { mentioned: segs.size, drawn: [...segs.values()].filter((p) => segmentId(p)).length },
    angles: { mentioned: angs.size, drawn: [...angs.values()].filter((t) => angleId(t)).length },
    missing,
    steps: { mentioning, synced },
  };
}
