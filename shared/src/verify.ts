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
import { checkClaims, statementGivens, statementParts } from "./claims";
import { regularizeTriangle } from "./figureShape";
import { gradeLevelFeedback, unsupportedFeedback } from "./gradeLevel";
import { derivationSlips } from "./derivations";
import { adoptStatementFigure } from "./figureFromText";
import { isKnownTechnique, problemDomains } from "./knowledgeBase";
import { cleanLanguage } from "./language";
import { constructNamedPoints } from "./pointDefinitions";
import { completeFigure, defineReferencedObjects } from "./figureComplete";
import { evalCondition, evalExpression, evalRelation, approxEqual, splitRelation, variablesOf, type Env } from "./expr";
import { dist, evaluateFigureCheck, resolveFigure, type ResolvedFigure } from "./geometry";
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
  circle_circle: [2, 3],
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
  /** Worth a retry, but say nothing about the maths (e.g. a geometry lesson without a figure). */
  retryHints?: string[];
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
    const circleArgs =
      p.kind === "line_circle" ? [2] : p.kind === "on_circle" ? [0] : p.kind === "tangent" ? [1] : p.kind === "circle_circle" ? [0, 1] : [];
    p.refs.forEach((ref, i) => {
      const isCircle = circleArgs.includes(i);
      const ok = isCircle ? circleIds.has(ref) : pointIds.has(ref);
      if (!ok) report.figureErrors.push(`point ${p.id}: ref "${ref}" is not a ${isCircle ? "circle" : "point"}`);
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
  const report: StructureReport = { errors: [], warnings: [], figureErrors: [], retryHints: [] };
  const solvable = lesson.analysis.status === "solvable";

  if (solvable) {
    // Only when the problem really describes a figure: a model can label "Giải phương trình …" as geometry, and a
    // retry for a figure there costs a paid request for nothing.
    if (lesson.analysis.topic === "geometry" && !lesson.figure && problemDomains(lesson.analysis.statement).includes("geometry")) {
      // A presentation gap, not a mathematical error: retry for it, but it doesn't un-verify correct answers.
      report.retryHints!.push("a geometry problem needs a figure (figure is null)");
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
  // Declared techniques must be knowledge-base ids; dependencies must point to earlier steps.
  const techniques = [...new Set(lesson.analysis.techniques.map((t) => t.trim().toLowerCase()))].filter(isKnownTechnique);
  if (techniques.length !== lesson.analysis.techniques.length) {
    report.warnings.push(`unknown technique ids dropped: ${lesson.analysis.techniques.filter((t) => !isKnownTechnique(t.trim().toLowerCase())).join(", ") || "duplicates"}`);
  }
  const earlier = new Set<string>();
  const steps = lesson.steps.map((s) => {
    const uses = [...new Set(s.uses)].filter((u) => earlier.has(u));
    earlier.add(s.id);
    return uses.length === s.uses.length ? s : { ...s, uses };
  });
  if (steps.some((s, i) => s !== lesson.steps[i])) report.warnings.push("step dependencies on later or unknown steps were dropped");
  lesson = { ...lesson, analysis: { ...lesson.analysis, techniques }, steps };
  const hintIds = new Set<string>();
  // Trailing hints that point past the last step (5 hints for 4 steps) lead to the end of the solution:
  // attach them to the last step. A bad reference anywhere else is a real inconsistency and is reported.
  const knownSteps = new Set(lesson.steps.map((s) => s.id));
  const lastStep = lesson.steps.at(-1)?.id;
  const lastValid = lesson.hints.reduce((last, h, i) => (knownSteps.has(h.stepId) ? i : last), -1);
  // An extra hint ("h5" → "step5" when there are 4 steps) points past the end wherever it sits (the app
  // reorders hints by step). A low-numbered hint with a bad reference stays an error: moving it to the end
  // would turn the first hint into the last.
  const num = (id: string) => Number(/(\d+)$/.exec(id)?.[1] ?? 0);
  const extraHint = (h: ModelLesson["hints"][number]) => num(h.stepId) > lesson.steps.length && num(h.id) > lesson.steps.length;
  const repairable = (h: ModelLesson["hints"][number], i: number) => !knownSteps.has(h.stepId) && (i > lastValid || extraHint(h));
  if (lastStep && lastValid >= 0 && lesson.hints.some(repairable)) {
    report.warnings.push("hints pointing past the last step were attached to it");
    lesson = { ...lesson, hints: lesson.hints.map((h, i) => (repairable(h, i) ? { ...h, stepId: lastStep } : h)) };
  }
  // Nothing references hint ids except the app's progress state: renumber duplicates instead of rejecting.
  if (new Set(lesson.hints.map((h) => h.id)).size < lesson.hints.length) {
    report.warnings.push("duplicate hint ids were renumbered");
    lesson = { ...lesson, hints: lesson.hints.map((h, i) => ({ ...h, id: `h${i + 1}` })) };
  }
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
  /** The check itself couldn't be evaluated (unknown variable, bad syntax): it says nothing about the answer. */
  malformed?: boolean;
}

/**
 * A check that computes nothing — a bare number ("3" expecting "3") or a
 * relation between plain numbers ("3 = 3") — restates the answer instead of
 * testing it. Such checks must never make a lesson "verified".
 */
/**
 * Models write checks in programming style: "a == b and c % d == 0". Write "==" as "=", and split a conjunction into
 * separate statements (all must hold — the meaning of a check's statement list). Only for kinds whose statements are
 * all conditions; "identity"/"inequality"/"integers" give statements[0] a special role.
 */
export function normalizeCheck(check: AnswerCheck): AnswerCheck {
  const eq = (s: string) => s.replace(/==/g, "=");
  if (check.kind !== "substitute" && check.kind !== "value") return { ...check, statements: check.statements.map(eq) };
  const statements = check.statements.flatMap((s) => eq(s).split(/\s+and\s+|\s*&&\s*/i)).filter((s) => s.trim());
  return { ...check, statements: statements.slice(0, 6) };
}

/** splitRelation, but a statement it can't split ("a == b and c == d", "1 < x < 3") is simply not a single relation. */
function relationOf(s: string): ReturnType<typeof splitRelation> {
  try {
    return splitRelation(s);
  } catch {
    return null;
  }
}

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
    const sides = relationOf(s)?.sides ?? [s];
    return sides.some((side) => /[\d)a-z]\s*[-+*/^:]|sqrt|cbrt|abs|sin|cos|tan|cot|\(/i.test(side.replace(/^[-+]/, "")));
  };
  if (check.kind === "substitute") {
    // Substituting into statements that contain no variables tests nothing — unless the model already
    // substituted the values itself ("2^2 - 5*2 + 6 = 0"): that relation is real arithmetic and is evaluated.
    // A computation with an expected value ("((2*(2+1))^2 - 2*(2^2+3))" → 22) is real work too.
    const first = check.statements[0] ?? "";
    if (check.expected && first && !relationOf(first.replace(/\s+/g, "")) && hasWork(first)) return false;
    return check.statements.every((st) => {
      try {
        return variablesOf(st).size === 0 && !(splitRelation(st.replace(/\s+/g, "")) && hasWork(st));
      } catch {
        return true;
      }
    });
  }
  return !check.statements.some(hasWork);
}

/** Numbers in a text, ignoring 0, 1, 2 (exponents, halves, "2x"). Decimal commas are read as points. */
function significantNumbers(text: string): Set<string> {
  return new Set((text.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => n.replace(",", ".")).filter((n) => !["0", "1", "2"].includes(n)));
}

/**
 * A "value" check that only rewrites the final answer ("sqrt(2) * 10" expecting "10*sqrt(2)") passes any
 * answer, right or wrong (EXP-008: a wrong 10√2 was shown as verified). It restates when it uses no number
 * from the problem's givens, its expected value is not a given either (then it would test the answer against
 * a condition, like a magic-square sum), and every number it uses already appears in the final answer.
 */
export function restatesAnswer(check: AnswerCheck, lesson: ModelLesson): boolean {
  if (check.kind !== "value" || !check.expected) return false;
  const problem = lesson.analysis.statement.replace(/^\s*(Câu|Bài|Question)\s*\d+\s*(\([^)]*\))?\s*[.:]?/iu, "");
  const givens = significantNumbers(problem);
  if (givens.size === 0) return false;
  const used = significantNumbers(check.statements.join(" "));
  const answer = significantNumbers(`${lesson.finalAnswer.text} ${lesson.finalAnswer.math ?? ""}`);
  if ([...used].some((n) => givens.has(n)) || [...significantNumbers(check.expected)].some((n) => givens.has(n))) return false;
  return [...used].every((n) => answer.has(n));
}

const SAMPLE_POOL = [0.37, 1.73, 2.9, 4.41, 6.2, 9.7, -0.61, -2.3, -3.7, 13.1, 0.83, 5.55];

function evalValue(src: string): number {
  return evalExpression(src.replace(/,(\d)/g, ".$1"), {});
}

export function runAnswerCheck(check: AnswerCheck): CheckOutcome {
  const label = check.statements[0] ?? check.kind;
  try {
    switch (check.kind) {
      case "substitute": {
        // A computation labelled "substitute" ("((2*(2+1))^2 - 2*(2^2+3))" expecting "22", with "m > 1"):
        // evaluate it as a value under each assignment; the other statements are conditions.
        const [first, ...conditions] = check.statements;
        if (first && check.expected && !splitRelation(first.replace(/\s+/g, ""))) {
          for (const set of check.assignments.length ? check.assignments : [[]]) {
            const env: Env = {};
            for (const { variable, value } of set) env[variable.replace("_", "")] = evalValue(value);
            if (conditions.some((c) => evalCondition(c, env) !== true)) return { label, passed: false, detail: `a condition fails for ${JSON.stringify(env)}` };
            const got = evalExpression(first.replace(/,(\d)/g, ".$1"), env);
            const want = evalValue(check.expected);
            if (!approxEqual(got, want, 1e-6)) return { label, passed: false, detail: `${got} vs ${want}` };
          }
          return { label, passed: true, detail: "the computed value matches" };
        }
        if (check.assignments.length === 0) {
          // Already-substituted numeric relations ("3^2 - 5*3 + 6 = 0"): each must hold as written.
          const numeric = check.statements.length > 0 && check.statements.every((st) => variablesOf(st).size === 0 && splitRelation(st.replace(/\s+/g, "")));
          if (!numeric) return { label, passed: false, detail: "no values to substitute" };
          const failed = check.statements.find((st) => evalRelation(st, {}) !== true);
          return failed ? { label, passed: false, detail: `${failed} is false` } : { label, passed: true, detail: "the substituted equations hold" };
        }
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
      case "integers": {
        const condition = check.statements[0]!;
        const domain = check.statements.slice(1);
        if (!check.expected) return { label, passed: false, detail: "missing expected answer set" };
        const vars = [...new Set([condition, ...domain].flatMap((st) => [...variablesOf(st.replace(/\b(or|and|hoặc|và)\b/gi, " "))]))];
        if (vars.length !== 1) return { label, passed: false, detail: "integers checks support one variable" };
        const v = vars[0]!;
        const none = /^\s*(none|không có|∅|\\varnothing|\\emptyset)\s*$/i.test(check.expected);
        let compared = 0;
        for (let n = -200; n <= 200; n++) {
          const env = { [v]: n };
          if (!domain.every((d) => evalCondition(d, env) === true)) continue;
          const actual = evalCondition(condition, env);
          const claimed = none ? false : evalCondition(check.expected, env);
          if (actual === null || claimed === null) continue;
          if (actual !== claimed) {
            // Show the true pattern so the retry can find the right answer set.
            const holds: number[] = [];
            for (let k = -30; k <= 200 && holds.length < 12; k++) {
              const e = { [v]: k };
              if (domain.every((d) => evalCondition(d, e) === true) && evalCondition(condition, e) === true) holds.push(k);
            }
            return {
              label,
              passed: false,
              detail: `at ${v}=${n}: the condition is ${actual} but the claimed answer says ${claimed}. The condition actually holds for ${v} = ${holds.length ? `${holds.join(", ")}, …` : "no value in the tested range"}`,
            };
          }
          compared++;
        }
        return { label, passed: compared >= 20, detail: `agrees for ${compared} integers` };
      }
      case "value": {
        if (!check.expected) return { label, passed: false, detail: "missing expected value" };
        // "((16+4)^4 - 16^4) % 576 == 0" expecting "true": a relation, evaluated as one.
        if (/^\s*(true|false|đúng|sai)\s*$/i.test(check.expected)) {
          const holds = evalCondition(check.statements[0]!, {});
          if (holds === null) return { label, passed: false, detail: "could not evaluate the relation", malformed: true };
          const want = /^\s*(true|đúng)\s*$/i.test(check.expected);
          return { label, passed: holds === want, detail: `relation is ${holds}, expected ${want}` };
        }
        // Several quantities in one check ("sqrt(6^2+8^2)", "6*8/10" expecting "10 4,8"): compare pairwise.
        // Separators: ";", ", " (comma + space) or spaces — "4,8" without a space is a Vietnamese decimal.
        const expectedValues = check.expected.trim().split(/\s*;\s*|\s*,\s+|\s+/).filter(Boolean);
        if (check.statements.length > 1 && expectedValues.length === check.statements.length) {
          const pairs = check.statements.map((st, i) => [evalValue(st), evalValue(expectedValues[i]!)] as const);
          const bad = pairs.findIndex(([x, y]) => !approxEqual(x, y, 1e-6));
          return { label, passed: bad < 0, detail: bad < 0 ? `${pairs.length} values match` : `${check.statements[bad]} = ${pairs[bad]![0]}, expected ${pairs[bad]![1]}` };
        }
        const a = evalValue(check.statements[0]!);
        const b = evalValue(check.expected);
        return { label, passed: approxEqual(a, b, 1e-6), detail: `${a} vs ${b}` };
      }
    }
  } catch (err) {
    return { label, passed: false, detail: `could not evaluate: ${(err as Error).message}`, malformed: true };
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

/** How many refs each figure check kind takes (collinear/concyclic: at least). */
const CHECK_ARITY: Record<FigureCheck["kind"], number> = {
  equal_length: 4,
  length_value: 2,
  length_ratio: 4,
  angle_value: 3,
  equal_angle: 6,
  perpendicular: 4,
  parallel: 4,
  collinear: 3,
  on_circle: 2,
  concyclic: 4,
};

/**
 * Repairs figure checks whose kind doesn't match their refs when the intent is clear (equal_length with
 * two points and a value is a length_value), and sets aside the rest. A malformed check must never
 * count as a false claim: that would mark a correct lesson unverified and cost a retry.
 */
export function normalizeFigureChecks(checks: FigureCheck[]): { checks: FigureCheck[]; dropped: string[] } {
  const out: FigureCheck[] = [];
  const dropped: string[] = [];
  for (const c of checks) {
    const n = CHECK_ARITY[c.kind];
    const fits = c.kind === "collinear" || c.kind === "concyclic" ? c.refs.length >= n : c.refs.length === n;
    if (fits) out.push(c);
    // "on_circle I, D, J, H" means the four points are concyclic.
    else if (c.kind === "on_circle" && c.refs.length >= 4) out.push({ ...c, kind: "concyclic" });
    else if ((c.kind === "equal_length" || c.kind === "length_ratio") && c.refs.length === 2 && c.value !== null) out.push({ ...c, kind: "length_value" });
    else if (c.kind === "equal_angle" && c.refs.length === 3 && c.value !== null) out.push({ ...c, kind: "angle_value" });
    else dropped.push(`${c.kind} check on ${c.refs.join(", ")} has ${c.refs.length} points (needs ${n}); it was left out of the figure`);
  }
  return { checks: out, dropped };
}

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

/**
 * Keeps only the given points/circles (plus circles whose defining points survive),
 * and drops every line, angle, mark, check and highlight that refers to something removed.
 */
function pruneFigure(lesson: ModelLesson, keepPoints: Set<string>, keepCircles: Set<string>): ModelLesson {
  const f = lesson.figure!;
  const points = f.points.filter((p) => keepPoints.has(p.id));
  const pts = new Set(points.map((p) => p.id));
  const circles = f.circles.filter((c) => keepCircles.has(c.id) && pts.has(c.center) && (c.through === null || pts.has(c.through)));
  const cs = new Set(circles.map((c) => c.id));
  const lines = f.lines.filter((l) => pts.has(l.from) && pts.has(l.to));
  const lineIds = new Set(lines.map((l) => l.id));
  const figure: Figure = {
    ...f,
    points,
    circles,
    lines,
    angles: f.angles.filter((a) => [a.from, a.vertex, a.to].every((id) => pts.has(id))),
    marks: f.marks.filter((m) => m.targets.every((t) => lineIds.has(t))),
    checks: f.checks.filter((c) => c.refs.every((r) => pts.has(r) || cs.has(r))),
  };
  const keep = new Set([...figure.points, ...figure.circles, ...figure.lines, ...figure.angles].map((x) => x.id));
  return {
    ...lesson,
    figure,
    steps: lesson.steps.map((s) => ({
      ...s,
      geometryActions: s.geometryActions.map((a) => ({ ...a, targets: a.targets.filter((t) => keep.has(t)) })).filter((a) => a.targets.length > 0),
    })),
    hints: lesson.hints.map((h) => ({ ...h, focus: h.focus.filter((t) => keep.has(t)) })),
  };
}

/**
 * A few malformed points shouldn't cost the whole figure: drop the objects the
 * structure errors blame (and whatever depends on them) until the rest is valid.
 * Gives up (returns null) on errors that can't be pinned on one object, like duplicate ids.
 */
function salvageStructure(lesson: ModelLesson, errors: string[]): { lesson: ModelLesson; dropped: string[] } | null {
  let current = lesson;
  let remaining = errors;
  const dropped: string[] = [];
  for (let round = 0; round < 6 && remaining.length > 0; round++) {
    const badPoints = new Set<string>();
    const badCircles = new Set<string>();
    for (const e of remaining) {
      const point = /^(?:free )?point (\S+?):? /.exec(e);
      const circle = /^circle (\S+?): /.exec(e);
      if (point) badPoints.add(point[1]!);
      else if (circle) badCircles.add(circle[1]!);
      else if (!/^(line|angle|check) /.test(e)) return null;
    }
    dropped.push(...remaining);
    const f = current.figure!;
    current = pruneFigure(
      current,
      new Set(f.points.map((p) => p.id).filter((id) => !badPoints.has(id))),
      new Set(f.circles.map((c) => c.id).filter((id) => !badCircles.has(id))),
    );
    const report: StructureReport = { errors: [], warnings: [], figureErrors: [] };
    validateFigureStructure(current.figure!, report);
    remaining = report.figureErrors;
  }
  return remaining.length === 0 && current.figure!.points.length > 0 ? { lesson: current, dropped } : null;
}

/** Two circles that coincide are almost always a mis-constructed circle (e.g. "(S) through I, D, J" drawn as (I)). */
function duplicateCircles(figure: Figure, resolved: ResolvedFigure): string[] {
  const out: string[] = [];
  const ids = Object.keys(resolved.circles);
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const [a, b] = [resolved.circles[ids[i]!]!, resolved.circles[ids[j]!]!];
      const tol = 1e-6 * Math.max(1, a.r, b.r);
      if (Math.hypot(a.cx - b.cx, a.cy - b.cy) < tol && Math.abs(a.r - b.r) < tol) {
        out.push(
          `figure: circles ${ids[i]} and ${ids[j]} are the same circle. A circle through three points P, Q, R needs a hidden center O = circumcenter(P, Q, R) and through P; a circle with diameter PQ needs center midpoint(P, Q).`,
        );
      }
    }
  }
  return out.slice(0, 2);
}

/** Lettered parts of a problem that ask for a result ("b) Tìm n…", "c) Tính…"), e.g. ["b", "c"]. */
export function resultParts(statement: string): string[] {
  const out: string[] = [];
  const re = /(?:^|[\s(])([a-f])\)\s*(?:\$[^$]*\$\s*)?(Tìm|Tính|Giải|Rút gọn|Xác định|Find|Compute|Calculate|Solve|Simplify|Determine|Evaluate)/giu;
  for (const m of statement.matchAll(re)) {
    const letter = m[1]!.toLowerCase();
    if (!out.includes(letter)) out.push(letter);
  }
  return out;
}

/**
 * A complete lesson (steps, hints, final answer) labelled "ambiguous"/"unsupported"/"not_a_problem"
 * contradicts itself: hosted models fill the status enum carelessly (e.g. "ambiguous" with the reason
 * "the problem is clear"). Treat it as solvable so it is shown and fully verified; a stated reason is
 * kept as an interpretation note so a genuine concern stays visible.
 */
export function reconcileStatus(lesson: ModelLesson): ModelLesson {
  const a = lesson.analysis;
  if (a.status === "solvable" || lesson.steps.length === 0 || lesson.hints.length === 0 || !lesson.finalAnswer.text.trim()) return lesson;
  const reason = a.statusReason?.trim();
  const notes = reason && a.interpretationNotes.length < 5 ? [...a.interpretationNotes, reason] : a.interpretationNotes;
  return { ...lesson, analysis: { ...a, status: "solvable", statusReason: null, interpretationNotes: notes } };
}

const answerTextOf = (l: ModelLesson) => `${l.finalAnswer.text} ${l.finalAnswer.math ?? ""}`;

/** A question for one value ("Hỏi … lúc mấy giờ?", "Tính …") — not "tìm tất cả", "có … không", "chứng minh". */
export function presupposesAnswer(statement: string): boolean {
  const t = statement.normalize("NFC").toLowerCase();
  if (/tìm tất cả|tìm mọi|có (tồn tại|thể)|hay không|được không|có .{0,40} không\s*\?|chứng minh|biện luận|xác định .{0,20} để|với giá trị nào|tìm (điều kiện|m|tham số)/u.test(t)) return false;
  return /hỏi .{0,80}(mấy|bao nhiêu|bao lâu|lúc nào)|\bmấy giờ|\btính\b|bao nhiêu/u.test(t);
}

export const deniesAnswer = (answer: string) =>
  /vô nghiệm|không tồn tại|không có (giá trị|thời điểm|thời gian|số) .{0,20}(nào|thỏa)|không có lời giải|no solution|does not exist/iu.test(answer.normalize("NFC"));

/** What the figure shows instead, for a false "A, B, C, D cùng thuộc một đường tròn": usually three are collinear. */
function whyFalse(label: string, resolved: ResolvedFigure): string {
  const m = /^((?:[A-Z]'*\s*,\s*){3}[A-Z]'*) cùng thuộc một đường tròn$/.exec(label);
  if (!m) return "";
  const pts = m[1]!.split(/\s*,\s*/);
  for (let i = 0; i < 4; i++) {
    const t = pts.filter((_, k) => k !== i);
    const [a, b, c] = t.map((p) => resolved.points[p]);
    if (!a || !b || !c) continue;
    const cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    if (Math.abs(cross) < 1e-6 * (dist(a, b) * dist(a, c) || 1)) return `; ${t.join(", ")} are collinear, so these four points can't be concyclic`;
  }
  return "";
}

/** "Chứng minh …" with nothing to find or compute. */
export function isProofOnly(statement: string): boolean {
  const t = statement.normalize("NFC");
  const word = (w: string) => `(?<!\\p{L})(?:${w})(?!\\p{L})`;
  return new RegExp(word("chứng minh|chứng tỏ|prove|show that"), "iu").test(t) &&
    !new RegExp(word("tìm|tính|giải|rút gọn|xác định|hỏi|find|compute|calculate|solve|simplify|determine"), "iu").test(t);
}

/**
 * Which steps the machine actually checked: a step's geometric claims measured on the exact figure, or the
 * final step backed by a passing answer check. Everything else is "not_checked" — said plainly, never implied.
 */
export function perStepStatus(lesson: ModelLesson, resolved: ResolvedFigure | null, answerChecked: boolean): NonNullable<Verification["steps"]> {
  return lesson.steps.map((s, i) => {
    const claims = resolved && lesson.figure ? checkClaims([s.title, s.explanation, s.math], resolved, { exact: lesson.figure.scale === "exact" }) : [];
    if (claims.some((c) => !c.passed)) return { stepId: s.id, status: "failed" as const, claims: claims.length };
    if (claims.length > 0) return { stepId: s.id, status: "checked" as const, claims: claims.length };
    if (answerChecked && i === lesson.steps.length - 1) return { stepId: s.id, status: "answer" as const, claims: 0 };
    return { stepId: s.id, status: "not_checked" as const, claims: 0 };
  });
}

/** `problemText`: the student's confirmed problem text (the figure is built from it when possible). */
export function verifyLesson(input: ModelLesson, { problemText }: { problemText?: string } = {}): LessonVerification {
  const language = cleanLanguage(reconcileStatus(input));
  input = language.lesson;
  // Points the text defines exactly ("Gọi M là trung điểm BC") are built from the definition, not left to the model.
  // The statement's own construction is the base of the figure whenever it can be built and checked: every point the
  // statement defines is drawn exactly from its definition, not where the model put it.
  input = adoptStatementFigure(input, problemText).lesson;
  const { lesson: repaired, report } = checkLessonStructure(defineReferencedObjects(regularizeTriangle(constructNamedPoints(input).lesson).lesson));
  let lesson = repaired;
  const feedback = [...report.errors, ...(report.retryHints ?? []), ...language.feedback, ...gradeLevelFeedback(repaired), ...unsupportedFeedback(repaired)];
  const checks: Verification["checks"] = [];
  let answerLevelPassed = 0;
  let answerLevelFailed = 0;
  let figureIssue: string | null = report.retryHints?.length ? "figure_missing" : null;
  /** Proof parts whose claim couldn't be measured on the figure (e.g. it uses a point the figure lacks). */
  const proofUncovered: string[] = [];
  let resolved: ResolvedFigure | null = null;

  if (lesson.figure) {
    const normalized = normalizeFigureChecks(lesson.figure.checks);
    if (normalized.dropped.length || normalized.checks.some((c, i) => c !== lesson.figure!.checks[i])) {
      lesson = { ...lesson, figure: { ...lesson.figure, checks: normalized.checks } };
      feedback.push(...normalized.dropped.map((d) => `figure: ${d}`));
    }
    const figureProblems = [...report.figureErrors];
    if (figureProblems.length > 0) {
      const salvaged = salvageStructure(lesson, figureProblems);
      if (salvaged) {
        feedback.push(...salvaged.dropped.map((e) => `figure: ${e} (left out of the figure)`));
        lesson = salvaged.lesson;
        figureProblems.length = 0;
      }
    }
    if (figureProblems.length === 0) {
      resolved = resolveFigure(lesson.figure!);
      if (resolved.errors.length > 0) {
        // Keep what can be drawn: leave out the objects that couldn't be constructed (and what depends on them).
        feedback.push(...resolved.errors.map((e) => `figure: ${e} (left out of the figure)`));
        lesson = pruneFigure(lesson, new Set(Object.keys(resolved.points)), new Set(Object.keys(resolved.circles)));
        resolved = resolveFigure(lesson.figure!);
        figureProblems.push(...resolved.errors);
      }
      feedback.push(...duplicateCircles(lesson.figure!, resolved));
    }
    if (figureProblems.length === 0 && resolved) {
      const figure = lesson.figure!;
      // The model's own checks plus the facts the statement's shape words imply ("vuông tại A", "cân", "đều"…).
      const implied = statementGivens(lesson.analysis.statement, new Set(figure.points.map((p) => p.id))).filter(
        (g) => !figure.checks.some((c) => c.kind === g.kind && c.refs.join() === g.refs.join()),
      );
      for (const check of [...figure.checks, ...implied]) {
        const measurable = check.role === "given" || figure.scale === "exact" || SHAPE_INDEPENDENT.has(check.kind);
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
      const givenCount = figure.checks.filter((c) => c.role === "given").length;
      if (givenCount > 0 && figureProblems.length === 0) checks.push({ label: "figure matches the givens", passed: true });
    }
    if (figureProblems.length === 0 && resolved) {
      // Measure the solution's geometric claims on the exact figure: a false "IH ⊥ IK" means wrong reasoning.
      const l = lesson;
      // The problem's own claims from the student's confirmed text: a model restatement may garble or change them.
      const claimTexts = [
        problemText ?? l.analysis.statement,
        ...l.steps.flatMap((s) => [s.title, s.explanation, s.math]),
        ...l.hints.flatMap((h) => [h.explanation, h.math]),
        l.finalAnswer.text,
        l.finalAnswer.math,
      ];
      // Inequalities in the statement ("AB < AC") must hold in the figure with a visible margin,
      // or constructions degenerate (a nearly-isosceles triangle makes I, J, D almost collinear).
      const ineq = /(?<![A-Z])([A-Z]'*)([A-Z]'*)\s*(<|>)\s*([A-Z]'*)([A-Z]'*)(?![A-Z])/g;
      for (const m of l.analysis.statement.replace(/\$/g, "").matchAll(ineq)) {
        const [a, b, op, c, d] = [m[1]!, m[2]!, m[3]!, m[4]!, m[5]!];
        const pa = resolved.points[a], pb = resolved.points[b], pc = resolved.points[c], pd = resolved.points[d];
        if (!pa || !pb || !pc || !pd) continue;
        const [x, y] = [dist(pa, pb), dist(pc, pd)];
        const [small, big] = op === "<" ? [x, y] : [y, x];
        if (!(big > small * 1.2)) {
          feedback.push(
            `the problem says ${a}${b} ${op} ${c}${d}, but in the figure ${a}${b} = ${x.toFixed(2)} and ${c}${d} = ${y.toFixed(2)}: make the difference clear (20–40%), or constructions degenerate.`,
          );
        }
      }
      // Each "Chứng minh …" part must have at least one of its claims measured (and passing) to count as verified.
      for (const part of statementParts(l.analysis.statement)) {
        if (!/chứng minh|prove|show that/i.test(part.text)) continue;
        const measured = checkClaims([part.text.replace(/^.*?(chứng minh|prove|show that)/is, "")], resolved, { exact: l.figure!.scale === "exact" });
        if (measured.length === 0) proofUncovered.push(part.letter || "the proof");
      }
      for (const claim of checkClaims(claimTexts, resolved, { exact: l.figure!.scale === "exact" }).slice(0, 12)) {
        checks.push({ label: claim.label, passed: claim.passed });
        if (claim.passed) answerLevelPassed++;
        else {
          answerLevelFailed++;
          feedback.push(
            `the lesson states "${claim.label}", but it is false in the constructed figure (${claim.detail}${whyFalse(claim.label, resolved)}). Either that step's reasoning is wrong or the figure is built wrongly — re-derive it and fix whichever is wrong.`,
          );
        }
      }
    }
    if (figureProblems.length === 0 && resolved) {
      // Draw everything the lesson talks about; missing points/circles go back to the model.
      const completion = completeFigure(lesson, resolved);
      lesson = completion.lesson;
      if (completion.missing.length > 0) {
        feedback.push(
          `figure is missing ${completion.missing.join(", ")}, which the problem or solution names. The figure must show every point, line and circle from ALL parts of the problem and everything the solution uses (use circle_circle for an intersection of two circles, line_circle with value 1 for "the second intersection").`,
        );
      }
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

  let answerChecksPassed = 0;
  for (const check of lesson.answerChecks) {
    // A check the evaluator can't even read ("1 < x < 3", a chained relation) is a malformed check, never a crash.
    let trivial: boolean;
    let outcome: CheckOutcome;
    try {
      const normalized = normalizeCheck(check);
      trivial = isTrivialCheck(normalized) || restatesAnswer(normalized, lesson);
      outcome = trivial ? { label: "", passed: false, detail: "" } : runAnswerCheck(normalized);
    } catch (err) {
      feedback.push(
        `answer check "${check.statements.join("; ").slice(0, 120)}" can't be evaluated (${(err as Error).message}). Write one relation per statement (e.g. "x > 1" and "x < 3", not "1 < x < 3").`,
      );
      continue;
    }
    if (trivial) {
      feedback.push(
        `answer check "${check.statements.join("; ")}" only restates the answer; write a check that recomputes the answer from the problem's givens or substitutes it into the original equation/condition`,
      );
      continue;
    }
    if (outcome.malformed) {
      // A check we can't evaluate proves nothing either way: ask for a proper one, don't count it as a failure.
      feedback.push(
        `answer check "${outcome.label}" can't be evaluated (${outcome.detail}). Checks must be self-contained arithmetic (no unknown letters in "value" checks; substitute concrete values), or use the "integers"/"substitute" kinds.`,
      );
      continue;
    }
    checks.push({ label: outcome.label, passed: outcome.passed });
    if (outcome.passed) answerChecksPassed++;
    if (outcome.passed) answerLevelPassed++;
    else {
      answerLevelFailed++;
      feedback.push(`answer check "${outcome.label}" failed: ${outcome.detail}`);
    }
  }

  // "Verified" must cover every part that asks for a result, not just one of them.
  const parts = resultParts(lesson.analysis.statement);
  const uncovered = lesson.analysis.status === "solvable" && parts.length >= 2 && answerChecksPassed < parts.length;
  if (uncovered) {
    feedback.push(
      `the problem has ${parts.length} parts that ask for a result (${parts.join(", ")}) but only ${answerChecksPassed} answer check(s) pass: add one answerCheck per part that independently re-derives that part's result (kind "integers" for "find all integers n such that…", "substitute" for equations, "value" for computed quantities)`,
    );
  }

  // "Hỏi xe tải đến giao lộ lúc mấy giờ?" presupposes an answer: concluding "vô nghiệm" from a contradiction
  // means the model set the problem up wrongly (a distance without |…|, a vehicle that has already passed).
  if (lesson.analysis.status === "solvable" && presupposesAnswer(lesson.analysis.statement) && deniesAnswer(answerTextOf(lesson))) {
    checks.push({ label: "the question asks for a value, but the answer says none exists", passed: false });
    answerLevelFailed++;
    feedback.push(
      `the question asks for a specific value, so the exam expects one to exist, but the final answer says there is none. A contradiction here means the setup is wrong: re-read the problem (distances are non-negative — use |…| or consider that a moving object may already have passed the point; check units and which quantity is unknown) and solve it again.`,
    );
  }

  // A final answer that states a value needs a check that re-derives it.
  const answerText = `${lesson.finalAnswer.text} ${lesson.finalAnswer.math ?? ""}`;
  const statesValue = /=\s*-?\s*(?:\d|\\d?frac|\\sqrt)/.test(answerText.replace(/\$/g, ""));
  if (lesson.analysis.status === "solvable" && statesValue && lesson.answerChecks.length === 0) {
    feedback.push(
      `the final answer states a value ("${answerText.slice(0, 80).trim()}") but no answerCheck re-derives it: add one (for a quantity that doesn't depend on parameters, a "value" check on one concrete choice of the parameters that satisfies all conditions)`,
    );
  }

  if (proofUncovered.length > 0 && lesson.figure) {
    feedback.push(
      `the claim of ${proofUncovered.map((p) => (p.length === 1 ? `part ${p}` : p)).join(", ")} can't be checked on the figure: draw every point that claim names, constructed exactly from its definition.`,
    );
  }

  // Arithmetic slips inside a step's derivation: wrong even when the final answer happens to be right.
  const slips = lesson.analysis.status === "solvable" ? derivationSlips(lesson) : [];
  for (const slip of slips) {
    checks.push({ label: `step ${slip.stepId}: derivation is consistent`, passed: false });
    answerLevelFailed++;
    feedback.push(slip.message);
  }

  const stepStatus = perStepStatus(lesson, resolved, answerChecksPassed > 0 && !uncovered).map((s) =>
    slips.some((x) => x.stepId === s.stepId) ? { ...s, status: "failed" as const } : s,
  );

  // A method outside the curriculum that survived the retries: the lesson isn't fit to show as checked.
  const outside = gradeLevelFeedback(lesson).filter((f) => f.startsWith("the solution uses "));
  if (outside.length > 0) {
    checks.push({ label: `methods within the curriculum (${outside.map((f) => f.slice(18).split(",")[0]).join("; ")})`, passed: false });
    answerLevelFailed++;
  }

  let status: Verification["status"];
  if (lesson.analysis.status !== "solvable") status = "not_checkable";
  else if (answerLevelFailed > 0 || report.errors.length > 0) status = "unverified";
  else if (answerLevelPassed > 0 && (uncovered || proofUncovered.length > 0)) status = "partial";
  else if (answerLevelPassed > 0) status = "verified";
  else if (checks.length > 0) status = "partial";
  else status = "not_checkable";
  // Machine checks test claims and answers, never the argument itself: a problem that only asks for a proof is at
  // most "partial" (PTNK 2025 1a: a check of Δ at m = 0 must not label "Δ > 0 với mọi m" as verified).
  if (status === "verified" && isProofOnly(lesson.analysis.statement)) status = "partial";

  // Repairs can remove every point of a broken figure; an empty figure is not a valid lesson (the schema needs
  // ≥ 1 point), so drop it like any unusable figure — the text lesson is still served.
  if (lesson.figure && lesson.figure.points.length === 0) {
    lesson = {
      ...lesson,
      figure: null,
      hints: lesson.hints.map((h) => ({ ...h, focus: [] })),
      steps: lesson.steps.map((s) => ({ ...s, geometryActions: [] })),
    };
    figureIssue = figureIssue ?? "figure_invalid";
    resolved = null;
  }

  return {
    verification: { status, checks: checks.slice(0, 40), figureIssue, steps: stepStatus },
    feedback,
    lesson,
    resolvedFigure: resolved,
  };
}
