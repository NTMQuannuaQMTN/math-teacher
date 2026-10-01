import { z } from "zod";
import { ModelLessonSchema, type ModelLesson, type Verification } from "../../../shared/src/solution";
import { normalizeProblemText, wrapBareLatex } from "../../../shared/src/mathText";
import { verifyLesson } from "../../../shared/src/verify";
import { OcrFailure } from "../ocr/provider";
import type { Curriculum } from "./curriculum";
import { toGrammarJsonSchema, toStrictJsonSchema } from "./jsonSchema";
import type { ChatMessage, JsonModel } from "./llm";
import { buildEscalationMessage, buildRetryMessage, buildSystemPrompt, buildUserMessage } from "./prompts";
import { looksLikeGeometry } from "./routing";
import { addUsage, emptyUsage, estimateCost, formatUsage, type Usage } from "./pricing";

const LESSON_JSON_SCHEMA = toStrictJsonSchema(ModelLessonSchema);
/** Same schema with figure fixed to null: ~40% smaller, for non-geometry problems. */
const LESSON_JSON_SCHEMA_NO_FIGURE = toStrictJsonSchema(ModelLessonSchema.extend({ figure: z.null() }));
const LESSON_GRAMMAR_SCHEMA = toGrammarJsonSchema(ModelLessonSchema);
const LESSON_GRAMMAR_SCHEMA_NO_FIGURE = toGrammarJsonSchema(ModelLessonSchema.extend({ figure: z.null() }));

export interface SolveResult {
  lesson: ModelLesson;
  verification: Verification;
  attempts: number;
  durationMs: number;
  /** Tokens used across all attempts, per model (for cost monitoring). */
  usage: Record<string, Usage>;
  /** Estimated USD cost of this solve (all attempts). */
  costUsd: number;
  /** The model that produced the returned lesson. */
  model: string;
}

export interface SolveOptions {
  signal: AbortSignal;
  /** Total generations allowed (first try + corrective retries). */
  maxAttempts?: number;
  /**
   * Stronger model used for the corrective retry. The cheap primary model
   * writes the lesson; only when the deterministic checks fail does the
   * expensive model get involved.
   */
  fallback?: JsonModel;
  log?: (message: string) => void;
  /**
   * "any": retry whenever the verifier has feedback. "serious": retry only for problems that can make a
   * lesson wrong or incomplete (failed checks, false claims, invalid/missing figure, broken structure),
   * not for ones that only reduce how much could be checked (a malformed check, a hint pointing to a
   * missing step). Default: "serious" for slow local models, "any" otherwise.
   */
  retryPolicy?: "any" | "serious";
  /** Debugging: receives each attempt's raw model output. */
  onRaw?: (attempt: number, text: string) => void;
}

export function parseLesson(text: string): { lesson: ModelLesson } | { problems: string[] } {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { problems: ["the response was not valid JSON"] };
  }
  let data = sanitizeIds(json);
  let parsed = ModelLessonSchema.safeParse(data);
  // Mechanical slips (a malformed figure check, one list item too many, an over-long label, an empty id)
  // shouldn't cost a whole new lesson: repair them and parse again.
  for (let round = 0; !parsed.success && round < 3; round++) {
    const next = salvageFigureChecks(data, parsed.error.issues) ?? salvageLimits(data, parsed.error.issues);
    if (!next) break;
    data = next;
    parsed = ModelLessonSchema.safeParse(data);
  }
  if (!parsed.success) {
    return {
      problems: parsed.error.issues.slice(0, 10).map((issue) => `${issue.path.join(".")}: ${issue.message}`),
    };
  }
  return { lesson: parsed.data };
}

type Json = Record<string, unknown>;

const ID_KEYS = new Set(["id", "stepId", "refs", "targets", "focus", "from", "to", "vertex", "center", "through"]);
const cleanId = (v: unknown) =>
  typeof v === "string" ? v.trim().replace(/[′’]/g, "'").replace(/[^A-Za-z0-9_']+/g, "_").replace(/^_+|_+$/g, "") || v : v;

/**
 * Ids like "step 1" or "seg_A-B" fail the schema and would cost a whole new lesson. Clean every
 * id-valued field the same way, so references (stepId, targets, refs…) still match their objects.
 */
function sanitizeIds(value: unknown, key = ""): unknown {
  if (Array.isArray(value)) return value.map((v) => (ID_KEYS.has(key) && typeof v === "string" ? cleanId(v) : sanitizeIds(v)));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Json).map(([k, v]) => [k, ID_KEYS.has(k) && typeof v === "string" ? cleanId(v) : sanitizeIds(v, k)]));
  }
  return value;
}

type Issue = { code: string; path: PropertyKey[]; maximum?: number | bigint; origin?: string };

/**
 * Repairs size/format slips anywhere in the lesson: arrays and strings over their maximum are cut,
 * empty or malformed ids are replaced (a hint's empty stepId points at the step with the same index).
 * Returns null when any issue is of another kind (a wrong type or a missing field needs the model).
 */
function salvageLimits(json: unknown, issues: Issue[]): unknown | null {
  const fixable = (i: Issue) => i.code === "too_big" || i.code === "invalid_format" || (i.code === "too_small" && i.origin === "string");
  if (issues.length === 0 || !issues.every(fixable)) return null;
  const copy = structuredClone(json) as Json;
  const steps = Array.isArray(copy.steps) ? (copy.steps as Json[]) : [];
  for (const issue of issues) {
    const path = issue.path;
    const key = path[path.length - 1] as string | number;
    let parent: unknown = copy;
    for (const p of path.slice(0, -1)) parent = (parent as Record<PropertyKey, unknown> | undefined)?.[p as string];
    if (!parent || typeof parent !== "object") continue;
    const holder = parent as Record<string | number, unknown>;
    const value = holder[key];
    if (issue.code === "too_big" && (Array.isArray(value) || typeof value === "string") && issue.maximum !== undefined) {
      holder[key] = value.slice(0, Number(issue.maximum));
    } else if (typeof value === "string" || value === null) {
      const index = typeof path[path.length - 2] === "number" ? (path[path.length - 2] as number) : 0;
      const section = String(path[0]);
      if (key === "stepId") holder[key] = String(steps[Math.min(index, steps.length - 1)]?.id ?? "s1");
      else holder[key] = cleanId(value ?? "") && /^[A-Za-z0-9_']+$/.test(String(cleanId(value ?? ""))) ? cleanId(value ?? "") : `${section}_${index + 1}`;
    }
  }
  return copy;
}

/** Splits "ABC" into ["A", "B", "C"] when it is made only of known point ids (longest ids first). */
function splitIntoPoints(ref: string, pointIds: string[]): string[] | null {
  if (pointIds.includes(ref)) return [ref];
  const ids = [...pointIds].sort((a, b) => b.length - a.length);
  const out: string[] = [];
  let rest = ref;
  while (rest) {
    const id = ids.find((p) => rest.startsWith(p));
    if (!id) return null;
    out.push(id);
    rest = rest.slice(id.length);
  }
  return out;
}

/**
 * Only when every schema problem is inside figure.checks: expand refs written as
 * segment/triangle names, drop checks that are still malformed, and return the repaired JSON.
 */
function salvageFigureChecks(json: unknown, issues: { path: PropertyKey[] }[]): unknown | null {
  if (!issues.every((i) => i.path[0] === "figure" && i.path[1] === "checks")) return null;
  const figure = (json as Json).figure as Json;
  const points = Array.isArray(figure.points) ? (figure.points as Json[]).map((p) => String(p.id)) : [];
  const bad = new Set(issues.map((i) => i.path[2]));
  const checks = (figure.checks as Json[]).flatMap((c, index) => {
    if (!bad.has(index)) return [c];
    const refs = Array.isArray(c.refs) ? (c.refs as unknown[]).flatMap((r) => splitIntoPoints(String(r), points) ?? [String(r)]) : [];
    return [{ ...c, refs }];
  });
  const repaired = { ...(json as Json), figure: { ...figure, checks } };
  const again = ModelLessonSchema.safeParse(repaired);
  if (again.success) return repaired;
  // Still malformed: drop just those checks.
  const stillBad = new Set(again.error.issues.filter((i) => i.path[0] === "figure" && i.path[1] === "checks").map((i) => i.path[2]));
  return { ...repaired, figure: { ...figure, checks: checks.filter((_, i) => !stillBad.has(i)) } };
}

/**
 * Multi-line derivations arrive as LaTeX lines separated by newlines, which
 * KaTeX would run together on one line. Stack them in a gathered block.
 */
export function stackMathLines(math: string | null): string | null {
  if (math === null) return null;
  const lines = math
    .split(/\n|\\\\\s*\n/)
    .map((l) => l.trim().replace(/\\\\$/, "").trim())
    .filter(Boolean);
  if (lines.length <= 1) return lines[0] ?? null;
  if (/\\begin\{/.test(math)) return math.trim();
  return `\\begin{gathered}${lines.join(" \\\\ ")}\\end{gathered}`;
}

const COMMANDS =
  "ge|geq|le|leq|ne|neq|pm|mp|cdot|times|div|frac|dfrac|tfrac|sqrt|left|right|in|notin|infty|approx|equiv|sim|cong|" +
  "circ|angle|widehat|hat|overline|triangle|perp|parallel|Rightarrow|Leftrightarrow|Leftarrow|rightarrow|to|" +
  "text|mathrm|mathbb|begin|end|cases|alpha|beta|gamma|delta|pi|varnothing|emptyset|cup|cap|subset|forall|exists";
const DOUBLED_COMMAND = new RegExp(`(?<!\\\\)\\\\\\\\(?=(?:${COMMANDS})(?![a-zA-Z]))`, "g");

/**
 * Some models (notably Gemini) double-escape LaTeX in JSON, so "\\ge" arrives as two
 * backslashes + "ge" — KaTeX would render a line break followed by "ge". Collapse it.
 */
export function fixDoubledEscapes(s: string): string {
  return s.replace(DOUBLED_COMMAND, "\\");
}

/**
 * Models sometimes name segments in figure checks ("AB ⊥ AC" as refs ["AB", "AC"]) instead of
 * listing points. Split any ref that isn't a known id but is two point ids glued together, so
 * the check can be verified instead of costing a retry.
 */
export function expandSegmentRefs(figure: NonNullable<ModelLesson["figure"]>): NonNullable<ModelLesson["figure"]> {
  const pointIds = new Set(figure.points.map((p) => p.id));
  const known = new Set([...pointIds, ...figure.circles.map((c) => c.id)]);
  const split = (ref: string): string[] => {
    if (known.has(ref)) return [ref];
    for (let i = 1; i < ref.length; i++) {
      const [a, b] = [ref.slice(0, i), ref.slice(i)];
      if (pointIds.has(a) && pointIds.has(b)) return [a, b];
    }
    return [ref];
  };
  return { ...figure, checks: figure.checks.map((c) => ({ ...c, refs: c.refs.flatMap(split) })) };
}

/**
 * Small models refer to objects instead of points: foot(I, "line_BC"), intersection("line_AB",
 * "line_AC"), angle_value(["ang_BAC", "90"]), parallel(["seg_d1", "seg_d2"]). Expand line/segment/
 * angle ids (defined in the figure or named seg_XY / line_XY / ang_XYZ) into their points, move a
 * number given as a ref into `value`, and turn a line × circle "intersection" into line_circle.
 */
export function expandObjectRefs(figure: NonNullable<ModelLesson["figure"]>): NonNullable<ModelLesson["figure"]> {
  const pointIds = new Set(figure.points.map((p) => p.id));
  const circleIds = new Set(figure.circles.map((c) => c.id));
  const lines = new Map(figure.lines.map((l) => [l.id, [l.from, l.to]]));
  const angles = new Map(figure.angles.map((a) => [a.id, [a.from, a.vertex, a.to]]));
  const named = (ref: string): string[] | null => {
    if (pointIds.has(ref) || circleIds.has(ref)) return [ref];
    if (lines.has(ref)) return lines.get(ref)!;
    if (angles.has(ref)) return angles.get(ref)!;
    const m = /^(?:line|seg|ray|segment)_((?:[A-Z]'*){2})$|^(?:ang|angle)_((?:[A-Z]'*){3})$/.exec(ref);
    const letters = (m?.[1] ?? m?.[2])?.match(/[A-Z]'*/g);
    return letters && letters.every((l) => pointIds.has(l)) ? letters : null;
  };
  const points = figure.points.map((p) => {
    if (p.kind === "free") return p;
    const circleRefs = p.refs.filter((r) => circleIds.has(r));
    const refs = p.refs.flatMap((r) => (circleIds.has(r) ? [r] : named(r) ?? [r]));
    if (p.kind === "intersection" && circleRefs.length === 1) {
      const linePts = refs.filter((r) => !circleIds.has(r));
      if (linePts.length === 2) return { ...p, kind: "line_circle" as const, refs: [...linePts, circleRefs[0]!], value: p.value ?? 1 };
    }
    return refs.join() === p.refs.join() ? p : { ...p, refs };
  });
  const checks = figure.checks.map((c) => {
    let value = c.value;
    const refs: string[] = [];
    for (const r of c.refs) {
      if (/^-?\d+(?:[.,]\d+)?$/.test(r.trim()) && (c.kind === "angle_value" || c.kind === "length_value" || c.kind === "length_ratio")) {
        value ??= Number(r.replace(",", "."));
        continue;
      }
      refs.push(...(c.kind === "on_circle" && circleIds.has(r) ? [r] : named(r) ?? [r]));
    }
    return refs.join() === c.refs.join() && value === c.value ? c : { ...c, refs, value };
  });
  return { ...figure, points, checks };
}

const CIRCLE_ARGS: Partial<Record<string, number[]>> = { line_circle: [2], on_circle: [0], tangent: [1], circle_circle: [0, 1] };

/** Models sometimes write a circle's center ("I") where a circle id ("c_I") is expected. */
export function repairCircleRefs(figure: NonNullable<ModelLesson["figure"]>): NonNullable<ModelLesson["figure"]> {
  const circleIds = new Set(figure.circles.map((c) => c.id));
  const byCenter = new Map<string, string[]>();
  for (const c of figure.circles) byCenter.set(c.center, [...(byCenter.get(c.center) ?? []), c.id]);
  const points = figure.points.map((p) => {
    const args = CIRCLE_ARGS[p.kind];
    if (!args) return p;
    const refs = p.refs.map((ref, i) => {
      if (!args.includes(i) || circleIds.has(ref)) return ref;
      const candidates = byCenter.get(ref);
      return candidates?.length === 1 ? candidates[0]! : ref;
    });
    return { ...p, refs };
  });
  const checks = figure.checks.map((c) => {
    const ref = c.refs[1];
    if (c.kind !== "on_circle" || !ref || circleIds.has(ref)) return c;
    const candidates = byCenter.get(ref);
    return candidates?.length === 1 ? { ...c, refs: [c.refs[0]!, candidates[0]!, ...c.refs.slice(2)] } : c;
  });
  return { ...figure, points, checks };
}

/** Normalizes all student-facing strings (NFC for Vietnamese, no control characters). */
export function tidy(lesson: ModelLesson): ModelLesson {
  const t = (s: string) => wrapBareLatex(fixDoubledEscapes(normalizeProblemText(s)));
  const tn = (s: string | null) => (s === null ? null : t(s));
  const stackMathLines = (m: string | null) => stackLines(m === null ? null : fixDoubledEscapes(m));
  return {
    ...lesson,
    analysis: {
      ...lesson.analysis,
      statement: t(lesson.analysis.statement),
      statusReason: tn(lesson.analysis.statusReason),
    },
    strategy: t(lesson.strategy),
    hints: lesson.hints.map((h) => ({ ...h, question: t(h.question), cue: tn(h.cue), explanation: t(h.explanation), math: stackMathLines(h.math) })),
    steps: lesson.steps.map((s) => ({ ...s, title: t(s.title), explanation: t(s.explanation), reason: tn(s.reason), math: stackMathLines(s.math) })),
    finalAnswer: { text: t(lesson.finalAnswer.text), math: stackMathLines(lesson.finalAnswer.math) },
    figure: lesson.figure ? repairCircleRefs(expandSegmentRefs(expandObjectRefs(lesson.figure))) : lesson.figure,
  };
}
const stackLines = (m: string | null) => stackMathLines(m);

/** Feedback that lowers how much of a lesson could be checked, but can't make it wrong (see retryPolicy). */
const MINOR_FEEDBACK = [/can't be evaluated/, /points to unknown step/, /left out of the figure/, /the claim of .* can't be checked/];

/**
 * Problem text → verified lesson.
 *
 * One model call produces the whole lesson (understanding, plan, hints,
 * steps, figure, machine-checkable claims). Deterministic code then
 * validates structure, constructs the figure, and checks the mathematics.
 * If anything fails, the model gets one corrective retry with the exact
 * problems. If the retry still fails verification, the lesson is returned
 * marked "unverified" (never presented as checked); if it isn't even
 * structurally valid, the solve fails.
 */
export async function solveProblem(
  model: JsonModel,
  curriculum: Curriculum,
  problemText: string,
  { signal, maxAttempts = 2, fallback, log = () => undefined, onRaw, retryPolicy = model.grammarConstrained ? "serious" : "any" }: SolveOptions,
): Promise<SolveResult> {
  const started = Date.now();
  // Geometry rules and the figure schema are only sent when a figure is needed (input-token saving).
  let withFigure = looksLikeGeometry(problemText);
  let messages: ChatMessage[] = [
    { role: "system", content: buildSystemPrompt(curriculum, { withFigure }) },
    { role: "user", content: buildUserMessage(problemText) },
  ];
  let best: { lesson: ModelLesson; verification: Verification; score: number; model: string; problems: number; drawn: number } | null = null;
  const usage: Record<string, Usage> = {};
  const finish = (attempts: number, producedBy: string) => {
    let costUsd = 0;
    for (const [name, u] of Object.entries(usage)) {
      costUsd += estimateCost(name, u) ?? 0;
      log(`usage: ${formatUsage(name, u)}`);
    }
    log(`total ≈ $${costUsd.toFixed(4)} over ${attempts} attempt(s); lesson by ${producedBy}`);
    return { attempts, durationMs: Date.now() - started, usage, costUsd, model: producedBy };
  };

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const current = attempt > 1 && fallback ? fallback : model;
    if (current !== model) log(`escalating to ${current.model}`);
    let text: string;
    try {
      text = await current.complete({
        messages,
        schema: current.grammarConstrained
          ? withFigure
            ? LESSON_GRAMMAR_SCHEMA
            : LESSON_GRAMMAR_SCHEMA_NO_FIGURE
          : withFigure
            ? LESSON_JSON_SCHEMA
            : LESSON_JSON_SCHEMA_NO_FIGURE,
        schemaName: "lesson",
        signal,
        onUsage: (u) => (usage[current.model] = addUsage(usage[current.model] ?? emptyUsage(), u)),
      });
    } catch (err) {
      // A failed retry (truncated, overloaded, timed out) must not throw away the lesson we already have.
      if (!best) throw err;
      log(`attempt ${attempt} failed (${(err as Error).message.slice(0, 120)}); keeping attempt ${attempt - 1}`);
      return { lesson: best.lesson, verification: best.verification, ...finish(attempt, best.model) };
    }
    onRaw?.(attempt, text);
    const parsed = parseLesson(text);
    let problems: string[];

    if ("lesson" in parsed) {
      // The model may leave the statement empty (it's the confirmed problem text): fill it in, since
      // the point builder and claim checker read the statement.
      if (!parsed.lesson.analysis.statement.trim()) {
        parsed.lesson.analysis.statement = normalizeProblemText(problemText);
      }
      const result = verifyLesson(tidy(parsed.lesson));
      const score =
        result.verification.status === "verified" ? 3 : result.verification.status === "partial" ? 2 : result.verification.status === "not_checkable" ? 2 : 1;
      // Same score: prefer the more complete figure, then the attempt with fewer remaining problems.
      const f = result.lesson.figure;
      const drawn = f ? f.points.length + f.circles.length + f.lines.length : 0;
      const better =
        !best ||
        score > best.score ||
        (score === best.score && (drawn > best.drawn || (drawn === best.drawn && result.feedback.length < best.problems)));
      if (better) {
        best = { lesson: result.lesson, verification: result.verification, score, model: current.model, problems: result.feedback.length, drawn };
      }
      problems = result.feedback;
      log(`attempt ${attempt}: ${result.verification.status}, ${problems.length} problem(s)${problems.length ? `: ${problems.slice(0, 3).join(" | ")}` : ""}`);
      const worthRetry = retryPolicy === "any" ? problems : problems.filter((p) => !MINOR_FEEDBACK.some((re) => re.test(p)));
      if (worthRetry.length === 0) {
        if (problems.length) log(`attempt ${attempt}: only minor feedback; not retrying`);
        return { lesson: result.lesson, verification: result.verification, ...finish(attempt, current.model) };
      }
    } else {
      problems = parsed.problems;
      log(`attempt ${attempt}: invalid structure: ${problems.slice(0, 3).join(" | ")}`);
    }

    if (attempt < maxAttempts) {
      const needsFigure = !withFigure && problems.some((p) => p.includes("needs a figure"));
      if (needsFigure) withFigure = true;
      const next = attempt + 1 > 1 && fallback ? fallback : model;
      if (next !== current || needsFigure) {
        // Fresh start for a different model (or the full geometry prompt): send what was wrong,
        // not the rejected lesson, which would cost thousands of input tokens.
        messages = [
          { role: "system", content: buildSystemPrompt(curriculum, { withFigure }) },
          { role: "user", content: buildEscalationMessage(problemText, problems) },
        ];
      } else {
        messages.push({ role: "assistant", content: text }, { role: "user", content: buildRetryMessage(problems) });
      }
    }
  }

  if (!best) throw new OcrFailure("malformed_output", "no structurally valid lesson after retries", true);
  return { lesson: best.lesson, verification: best.verification, ...finish(maxAttempts, best.model) };
}
