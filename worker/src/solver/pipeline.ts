import { z } from "zod";
import { ModelLessonSchema, type ModelLesson, type Verification } from "../../../shared/src/solution";
import { normalizeProblemText, wrapBareLatex } from "../../../shared/src/mathText";
import { verifyLesson } from "../../../shared/src/verify";
import { OcrFailure } from "../ocr/provider";
import type { Curriculum } from "./curriculum";
import { toStrictJsonSchema } from "./jsonSchema";
import type { ChatMessage, JsonModel } from "./llm";
import { buildEscalationMessage, buildRetryMessage, buildSystemPrompt, buildUserMessage } from "./prompts";
import { looksLikeGeometry } from "./routing";
import { addUsage, emptyUsage, estimateCost, formatUsage, type Usage } from "./pricing";

const LESSON_JSON_SCHEMA = toStrictJsonSchema(ModelLessonSchema);
/** Same schema with figure fixed to null: ~40% smaller, for non-geometry problems. */
const LESSON_JSON_SCHEMA_NO_FIGURE = toStrictJsonSchema(ModelLessonSchema.extend({ figure: z.null() }));

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
  /** Debugging: receives each attempt's raw model output. */
  onRaw?: (attempt: number, text: string) => void;
}

function parseLesson(text: string): { lesson: ModelLesson } | { problems: string[] } {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { problems: ["the response was not valid JSON"] };
  }
  let parsed = ModelLessonSchema.safeParse(sanitizeIds(json));
  if (!parsed.success) {
    // A malformed figure check shouldn't cost a whole new lesson: repair or drop it and parse again.
    const salvaged = salvageFigureChecks(json, parsed.error.issues);
    if (salvaged) parsed = ModelLessonSchema.safeParse(salvaged);
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
function tidy(lesson: ModelLesson): ModelLesson {
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
    figure: lesson.figure ? repairCircleRefs(expandSegmentRefs(lesson.figure)) : lesson.figure,
  };
}
const stackLines = (m: string | null) => stackMathLines(m);

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
  { signal, maxAttempts = 2, fallback, log = () => undefined, onRaw }: SolveOptions,
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
    const text = await current.complete({
      messages,
      schema: withFigure ? LESSON_JSON_SCHEMA : LESSON_JSON_SCHEMA_NO_FIGURE,
      schemaName: "lesson",
      signal,
      onUsage: (u) => (usage[current.model] = addUsage(usage[current.model] ?? emptyUsage(), u)),
    });
    onRaw?.(attempt, text);
    const parsed = parseLesson(text);
    let problems: string[];

    if ("lesson" in parsed) {
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
      if (problems.length === 0) {
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
