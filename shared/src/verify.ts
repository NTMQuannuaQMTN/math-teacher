/**
 * Deterministic checks on an AI-generated lesson. No AI involved:
 *
 * 1. Structure — every id referenced by hints, steps, marks and the figure
 *    exists; construction arguments have the right shape.
 * 2. Figure    — the construction resolves, satisfies the problem's givens,
 *    and (where measurable) the solution's derived claims.
 * 3. Answer    — substituting the answer back, sampling identities and
 *    inequalities, evaluating numeric results.
 *
 * Used by the Worker before a lesson is stored/shown, and to build precise
 * feedback when asking the model to correct itself.
 */
import { evalCondition, evalExpression, evalRelation, approxEqual, splitRelation, variablesOf, type Env } from "./expr";
import { evaluateFigureCheck, resolveFigure, type ResolvedFigure } from "./geometry";
import type { AnswerCheck, Figure, FigureCheck, ModelLesson, Verification } from "./solution";

// ---------------------------------------------------------------------------
// Target aliases
// ---------------------------------------------------------------------------

/**
 * Maps the many ways a model may name an object ("AB", "BA", "seg_AB",
 * "ABC", "angle_B", "∠ABC") to canonical figure ids, so small naming slips
 * don't break step ↔ figure synchronization.
 */
export function buildTargetIndex(figure: Figure): Map<string, string> {
  const index = new Map<string, string>();
  const add = (alias: string, id: string) => {
    const key = alias.replace(/^(seg|line|ray|ang|angle|circle|c|pt|point)_/i, "").replace(/[∠^\s]/g, "");
    if (!index.has(alias)) index.set(alias, id);
    if (key && !index.has(key)) index.set(key, id);
  };
  const labelOf = (pid: string) => figure.points.find((p) => p.id === pid)?.label || pid;

  for (const p of figure.points) add(p.id, p.id);
  for (const c of figure.circles) add(c.id, c.id);
  for (const l of figure.lines) add(l.id, l.id);
  for (const a of figure.angles) add(a.id, a.id);
  for (const l of figure.lines) {
    const [a, b] = [labelOf(l.from), labelOf(l.to)];
    add(`${a}${b}`, l.id);
    add(`${b}${a}`, l.id);
    add(`${l.from}${l.to}`, l.id);
    add(`${l.to}${l.from}`, l.id);
  }
  const anglesByVertex = new Map<string, string[]>();
  for (const a of figure.angles) {
    const [f, v, t] = [labelOf(a.from), labelOf(a.vertex), labelOf(a.to)];
    add(`${f}${v}${t}`, a.id);
    add(`${t}${v}${f}`, a.id);
    anglesByVertex.set(v, [...(anglesByVertex.get(v) ?? []), a.id]);
  }
  for (const [vertex, ids] of anglesByVertex) {
    if (ids.length === 1) {
      add(`angle_${vertex}`, ids[0]!);
      add(`ang_${vertex}`, ids[0]!);
    }
  }
  return index;
}

// ---------------------------------------------------------------------------
// Structural validation
// ---------------------------------------------------------------------------

const REF_COUNTS: Record<string, [number, number]> = {
  free: [0, 0],
  polar: [1, 1],
  midpoint: [2, 2],
  on_segment: [2, 2],
  foot: [3, 3],
  intersection: [4, 4],
  line_circle: [3, 3],
  on_circle: [1, 1],
  tangent: [2, 2],
  reflect: [2, 3],
  rotate: [2, 2],
  translate: [3, 3],
  centroid: [3, 3],
  circumcenter: [3, 3],
  incenter: [3, 3],
  orthocenter: [3, 3],
};

export interface StructureReport {
  /** Problems that make the lesson unusable (retry-worthy). */
  errors: string[];
  /** Problems that were repaired automatically (e.g. unknown highlight target dropped). */
  warnings: string[];
  /** Problems that make only the figure unusable. */
  figureErrors: string[];
}

function validateFigureStructure(figure: Figure, report: StructureReport): void {
  const ids = new Set<string>();
  const dup = (id: string) => {
    if (ids.has(id)) report.figureErrors.push(`duplicate id "${id}"`);
    ids.add(id);
  };
  for (const p of figure.points) dup(p.id);
  for (const c of figure.circles) dup(c.id);
  for (const l of figure.lines) dup(l.id);
  for (const a of figure.angles) dup(a.id);

  const pointIds = new Set(figure.points.map((p) => p.id));
  const circleIds = new Set(figure.circles.map((c) => c.id));
  const lineIds = new Set(figure.lines.map((l) => l.id));

  for (const p of figure.points) {
    const [min, max] = REF_COUNTS[p.kind]!;
    if (p.refs.length < min || p.refs.length > max) {
      report.figureErrors.push(`point ${p.id}: kind ${p.kind} needs ${min === max ? min : `${min}-${max}`} refs, got ${p.refs.length}`);
    }
    if (p.kind === "free" && (p.x === null || p.y === null)) report.figureErrors.push(`free point ${p.id} needs x and y`);
    const circleArg = p.kind === "line_circle" ? 2 : p.kind === "on_circle" ? 0 : p.kind === "tangent" ? 1 : -1;
    p.refs.forEach((ref, i) => {
      const ok = i === circleArg ? circleIds.has(ref) : pointIds.has(ref);
      if (!ok) report.figureErrors.push(`point ${p.id}: ref "${ref}" is not a ${i === circleArg ? "circle" : "point"}`);
    });
  }
  for (const c of figure.circles) {
    if (!pointIds.has(c.center)) report.figureErrors.push(`circle ${c.id}: unknown center ${c.center}`);
    if (c.through !== null && !pointIds.has(c.through)) report.figureErrors.push(`circle ${c.id}: unknown point ${c.through}`);
    if (c.through === null && !(c.radius && c.radius > 0)) report.figureErrors.push(`circle ${c.id}: needs through or radius`);
  }
  for (const l of figure.lines) {
    if (!pointIds.has(l.from) || !pointIds.has(l.to)) report.figureErrors.push(`line ${l.id}: unknown endpoint`);
  }
  for (const a of figure.angles) {
    if (![a.from, a.vertex, a.to].every((id) => pointIds.has(id))) report.figureErrors.push(`angle ${a.id}: unknown point`);
  }
  for (const m of figure.marks) {
    for (const t of m.targets) if (!lineIds.has(t)) report.warnings.push(`mark references unknown line ${t}`);
  }
  for (const c of figure.checks) {
    const refs = c.kind === "on_circle" ? [c.refs[0]] : c.refs;
    for (const r of refs) if (r && !pointIds.has(r)) report.figureErrors.push(`check ${c.kind}: unknown point ${r}`);
    if (c.kind === "on_circle" && !circleIds.has(c.refs[1] ?? "")) report.figureErrors.push(`check on_circle: unknown circle`);
  }
}

/**
 * Validates references and returns a repaired copy: highlight targets are
 * mapped through aliases, unknown ones dropped, marks pruned.
 */
export function checkLessonStructure(lesson: ModelLesson): { lesson: ModelLesson; report: StructureReport } {
  const report: StructureReport = { errors: [], warnings: [], figureErrors: [] };
  const solvable = lesson.analysis.status === "solvable";

  if (solvable) {
    if (lesson.analysis.topic === "geometry" && !lesson.figure) {
      report.errors.push("a geometry problem needs a figure (figure is null)");
    }
    if (lesson.steps.length === 0) report.errors.push("a solvable problem needs at least one step");
    if (lesson.hints.length === 0) report.errors.push("a solvable problem needs at least one hint");
    if (!lesson.finalAnswer.text.trim()) report.errors.push("final answer is empty");
  }
  const stepIds = new Set<string>();
  for (const s of lesson.steps) {
    if (stepIds.has(s.id)) report.errors.push(`duplicate step id ${s.id}`);
    stepIds.add(s.id);
  }
  const hintIds = new Set<string>();
  for (const h of lesson.hints) {
    if (hintIds.has(h.id)) report.errors.push(`duplicate hint id ${h.id}`);
    hintIds.add(h.id);
    if (!stepIds.has(h.stepId)) report.errors.push(`hint ${h.id} points to unknown step ${h.stepId}`);
  }
  // Hints must follow the order of the steps they lead to; repair rather than reject.
  const stepOrder = new Map(lesson.steps.map((s, i) => [s.id, i]));
  const sorted = [...lesson.hints].sort((a, b) => (stepOrder.get(a.stepId) ?? 0) - (stepOrder.get(b.stepId) ?? 0));
  if (sorted.some((h, i) => h !== lesson.hints[i])) {
    report.warnings.push("hints were reordered to follow the steps");
    lesson = { ...lesson, hints: sorted };
  }
  // Hints should get more explicit, never less.
  for (let i = 1; i < lesson.hints.length; i++) {
    if (lesson.hints[i]!.level < lesson.hints[i - 1]!.level - 1) {
      report.warnings.push(`hint ${lesson.hints[i]!.id} is much less explicit than the previous one`);
    }
  }

  let figure = lesson.figure;
  if (figure) {
    validateFigureStructure(figure, report);
    const index = buildTargetIndex(figure);
    const mapTargets = (targets: string[], where: string) =>
      targets.flatMap((t) => {
        const id = index.get(t) ?? index.get(t.replace(/[∠\s]/g, ""));
        if (!id) report.warnings.push(`${where}: unknown figure target "${t}" dropped`);
        return id ? [id] : [];
      });
    lesson = {
      ...lesson,
      hints: lesson.hints.map((h) => ({ ...h, focus: mapTargets(h.focus, `hint ${h.id}`) })),
      steps: lesson.steps.map((s) => ({
        ...s,
        geometryActions: s.geometryActions
          .map((a) => ({ ...a, targets: mapTargets(a.targets, `step ${s.id}`) }))
          .filter((a) => a.targets.length > 0),
      })),
    };
    const lineIds = new Set(figure.lines.map((l) => l.id));
    figure = {
      ...figure,
      marks: figure.marks
        .map((m) => ({ ...m, targets: m.targets.filter((t) => lineIds.has(t)) }))
        .filter((m) => m.targets.length >= 2),
    };
    lesson = { ...lesson, figure };
  } else {
    const hasTargets = lesson.steps.some((s) => s.geometryActions.length > 0) || lesson.hints.some((h) => h.focus.length > 0);
    if (hasTargets) {
      report.warnings.push("geometry actions without a figure were dropped");
      lesson = {
        ...lesson,
        hints: lesson.hints.map((h) => ({ ...h, focus: [] })),
        steps: lesson.steps.map((s) => ({ ...s, geometryActions: [] })),
      };
    }
  }
  return { lesson, report };
}

// ---------------------------------------------------------------------------
// Answer checks
// ---------------------------------------------------------------------------

export interface CheckOutcome {
  label: string;
  passed: boolean;
  detail: string;
}

/**
 * A check that computes nothing — a bare number ("3" expecting "3") or a
 * relation between plain numbers ("3 = 3") — restates the answer instead of
 * testing it. Such checks must never make a lesson "verified".
 */
export function isTrivialCheck(check: AnswerCheck): boolean {
  const hasWork = (src: string) => {
    const s = src.replace(/\s+/g, "");
    if (!s) return false;
    try {
      if (variablesOf(s).size > 0) return true;
    } catch {
      return false;
    }
    // Arithmetic between numbers (not just a sign on a single number).
    const sides = splitRelation(s)?.sides ?? [s];
    return sides.some((side) => /[\d)a-z]\s*[-+*/^:]|sqrt|cbrt|abs|sin|cos|tan|cot|\(/i.test(side.replace(/^[-+]/, "")));
  };
  if (check.kind === "substitute") {
    // Substituting into statements that contain no variables tests nothing.
    return check.statements.every((st) => {
      try {
        return variablesOf(st).size === 0;
      } catch {
        return true;
      }
    });
  }
  return !check.statements.some(hasWork);
}

const SAMPLE_POOL = [0.37, 1.73, 2.9, 4.41, 6.2, 9.7, -0.61, -2.3, -3.7, 13.1, 0.83, 5.55];

function evalValue(src: string): number {
  return evalExpression(src.replace(/,(\d)/g, ".$1"), {});
}

function runAnswerCheck(check: AnswerCheck): CheckOutcome {
  const label = check.statements[0] ?? check.kind;
  try {
    switch (check.kind) {
      case "substitute": {
        if (check.assignments.length === 0) return { label, passed: false, detail: "no values to substitute" };
        for (const set of check.assignments) {
          const env: Env = {};
          for (const { variable, value } of set) env[variable.replace("_", "")] = evalValue(value);
          for (const statement of check.statements) {
            const holds = evalRelation(statement, env);
            if (holds !== true) {
              const shown = set.map((a) => `${a.variable}=${a.value}`).join(", ");
              return { label, passed: false, detail: `${shown} does not satisfy ${statement}` };
            }
          }
        }
        return { label, passed: true, detail: "all values satisfy the equations" };
      }
      case "identity": {
        const [identity, ...conditions] = check.statements;
        if (!identity || splitRelation(identity)?.rel !== "=") return { label, passed: false, detail: "identity must be LHS = RHS" };
        const vars = [...variablesOf(identity)];
        let valid = 0;
        for (let i = 0; i < SAMPLE_POOL.length && valid < 6; i++) {
          const env: Env = {};
          vars.forEach((v, k) => (env[v] = SAMPLE_POOL[(i + 3 * k) % SAMPLE_POOL.length]!));
          if (conditions.some((c) => evalCondition(c, env) !== true)) continue;
          const holds = evalRelation(identity, env, 1e-7);
          if (holds === null) continue;
          if (!holds) return { label, passed: false, detail: `differs at ${JSON.stringify(env)}` };
          valid++;
        }
        return valid >= 3 ? { label, passed: true, detail: `holds at ${valid} sample points` } : { label, passed: false, detail: "not enough valid sample points" };
      }
      case "inequality": {
        const original = check.statements[0]!;
        if (!check.expected) return { label, passed: false, detail: "missing expected solution set" };
        const vars = [...variablesOf(original)];
        if (vars.length !== 1) return { label, passed: false, detail: "inequality checks support one variable" };
        const v = vars[0]!;
        let compared = 0;
        const samples: number[] = [];
        for (let x = -60; x <= 60; x += 0.125) samples.push(x);
        for (let x = -1000; x <= 1000; x += 7.3) samples.push(x);
        for (const x of samples) {
          const env = { [v]: x };
          const a = evalRelation(original, env);
          const b = evalCondition(check.expected, env);
          if (a === null || b === null) continue;
          if (a !== b) return { label, passed: false, detail: `at ${v}=${x}: original ${a}, claimed ${b}` };
          compared++;
        }
        return { label, passed: compared > 50, detail: `agrees at ${compared} points` };
      }
      case "value": {
        if (!check.expected) return { label, passed: false, detail: "missing expected value" };
        const a = evalValue(check.statements[0]!);
        const b = evalValue(check.expected);
        return { label, passed: approxEqual(a, b, 1e-6), detail: `${a} vs ${b}` };
      }
    }
  } catch (err) {
    return { label, passed: false, detail: `could not evaluate: ${(err as Error).message}` };
  }
}

// ---------------------------------------------------------------------------
// Whole-lesson verification
// ---------------------------------------------------------------------------

const SHAPE_INDEPENDENT: ReadonlySet<FigureCheck["kind"]> = new Set([
  "equal_length",
  "equal_angle",
  "perpendicular",
  "parallel",
  "collinear",
  "on_circle",
  "concyclic",
]);

function describeFigureCheck(check: FigureCheck): string {
  const r = check.refs;
  switch (check.kind) {
    case "equal_length":
      return `${r[0]}${r[1]} = ${r[2]}${r[3]}`;
    case "length_value":
      return `${r[0]}${r[1]} = ${check.value}`;
    case "length_ratio":
      return `${r[0]}${r[1]} : ${r[2]}${r[3]} = ${check.value}`;
    case "angle_value":
      return `∠${r.join("")} = ${check.value}°`;
    case "equal_angle":
      return `∠${r.slice(0, 3).join("")} = ∠${r.slice(3).join("")}`;
    case "perpendicular":
      return `${r[0]}${r[1]} ⊥ ${r[2]}${r[3]}`;
    case "parallel":
      return `${r[0]}${r[1]} ∥ ${r[2]}${r[3]}`;
    case "collinear":
      return `${r.join(", ")} collinear`;
    case "on_circle":
      return `${r[0]} on ${r[1]}`;
    case "concyclic":
      return `${r.join(", ")} concyclic`;
  }
}

export interface LessonVerification {
  verification: Verification;
  /** Specific problems to send back to the model on a retry. Empty = nothing to fix. */
  feedback: string[];
  /** The lesson with an untrustworthy figure removed. */
  lesson: ModelLesson;
  resolvedFigure: ResolvedFigure | null;
}

export function verifyLesson(input: ModelLesson): LessonVerification {
  const { lesson: repaired, report } = checkLessonStructure(input);
  let lesson = repaired;
  const feedback = [...report.errors];
  const checks: Verification["checks"] = [];
  let answerLevelPassed = 0;
  let answerLevelFailed = 0;
  let figureIssue: string | null = null;
  let resolved: ResolvedFigure | null = null;

  if (lesson.figure) {
    const figureProblems = [...report.figureErrors];
    if (figureProblems.length === 0) {
      resolved = resolveFigure(lesson.figure);
      figureProblems.push(...resolved.errors);
    }
    if (figureProblems.length === 0 && resolved) {
      for (const check of lesson.figure.checks) {
        const measurable = check.role === "given" || lesson.figure.scale === "exact" || SHAPE_INDEPENDENT.has(check.kind);
        if (!measurable) continue;
        const result = evaluateFigureCheck(check, resolved);
        const label = describeFigureCheck(check);
        if (check.role === "given") {
          if (!result.passed) figureProblems.push(`figure does not satisfy the given ${label} (${result.detail})`);
        } else {
          checks.push({ label, passed: result.passed });
          if (result.passed) answerLevelPassed++;
          else {
            answerLevelFailed++;
            feedback.push(`derived claim ${label} is false in the constructed figure (${result.detail})`);
          }
        }
      }
      const givenCount = lesson.figure.checks.filter((c) => c.role === "given").length;
      if (givenCount > 0 && figureProblems.length === 0) checks.push({ label: "figure matches the givens", passed: true });
    }
    if (figureProblems.length > 0) {
      feedback.push(...figureProblems.map((p) => `figure: ${p}`));
      figureIssue = "figure_invalid";
      resolved = null;
      lesson = {
        ...lesson,
        figure: null,
        hints: lesson.hints.map((h) => ({ ...h, focus: [] })),
        steps: lesson.steps.map((s) => ({ ...s, geometryActions: [] })),
      };
    }
  }

  for (const check of lesson.answerChecks) {
    if (isTrivialCheck(check)) {
      feedback.push(
        `answer check "${check.statements.join("; ")}" only restates the answer; write a check that recomputes the answer from the problem's givens or substitutes it into the original equation/condition`,
      );
      continue;
    }
    const outcome = runAnswerCheck(check);
    checks.push({ label: outcome.label, passed: outcome.passed });
    if (outcome.passed) answerLevelPassed++;
    else {
      answerLevelFailed++;
      feedback.push(`answer check "${outcome.label}" failed: ${outcome.detail}`);
    }
  }

  let status: Verification["status"];
  if (lesson.analysis.status !== "solvable") status = "not_checkable";
  else if (answerLevelFailed > 0 || report.errors.length > 0) status = "unverified";
  else if (answerLevelPassed > 0) status = "verified";
  else if (checks.length > 0) status = "partial";
  else status = "not_checkable";

  return {
    verification: { status, checks: checks.slice(0, 40), figureIssue },
    feedback,
    lesson,
    resolvedFigure: resolved,
  };
}
