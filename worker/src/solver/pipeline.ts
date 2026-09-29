import { z } from "zod";
import { ModelLessonSchema, type ModelLesson, type Verification } from "../../../shared/src/solution";
import { normalizeProblemText } from "../../../shared/src/mathText";
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
}

function parseLesson(text: string): { lesson: ModelLesson } | { problems: string[] } {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { problems: ["the response was not valid JSON"] };
  }
  const parsed = ModelLessonSchema.safeParse(json);
  if (!parsed.success) {
    return {
      problems: parsed.error.issues.slice(0, 10).map((issue) => `${issue.path.join(".")}: ${issue.message}`),
    };
  }
  return { lesson: parsed.data };
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

/** Normalizes all student-facing strings (NFC for Vietnamese, no control characters). */
function tidy(lesson: ModelLesson): ModelLesson {
  const t = (s: string) => fixDoubledEscapes(normalizeProblemText(s));
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
  { signal, maxAttempts = 2, fallback, log = () => undefined }: SolveOptions,
): Promise<SolveResult> {
  const started = Date.now();
  // Geometry rules and the figure schema are only sent when a figure is needed (input-token saving).
  let withFigure = looksLikeGeometry(problemText);
  let messages: ChatMessage[] = [
    { role: "system", content: buildSystemPrompt(curriculum, { withFigure }) },
    { role: "user", content: buildUserMessage(problemText) },
  ];
  let best: { lesson: ModelLesson; verification: Verification; score: number; model: string } | null = null;
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
    const parsed = parseLesson(text);
    let problems: string[];

    if ("lesson" in parsed) {
      const result = verifyLesson(tidy(parsed.lesson));
      const score =
        result.verification.status === "verified" ? 3 : result.verification.status === "partial" ? 2 : result.verification.status === "not_checkable" ? 2 : 1;
      if (!best || score > best.score || (score === best.score && !result.verification.figureIssue)) {
        best = { lesson: result.lesson, verification: result.verification, score, model: current.model };
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
