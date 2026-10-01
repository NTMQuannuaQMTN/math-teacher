import type { ModelLesson } from "./solution";

/**
 * Deterministic grade-level review of a lesson for Vietnamese Grade 9 (see docs/GRADE_LEVEL_METHODOLOGY.md).
 *
 * - forbidden: methods outside the Grade 9 curriculum (calculus, vectors, law of sines/cosines, matrices,
 *   complex numbers, coordinates in a synthetic geometry problem). Sent back to the model as retry feedback.
 * - advisory: methods or habits that are acceptable in some problems (named olympiad inequalities and
 *   congruences appear in chuyên exams) or style issues. Scored in the benchmark rubric, never retried.
 */

export interface GradeLevelReport {
  forbidden: string[];
  advisory: string[];
  /** Rubric criteria: true = pass. */
  rubric: {
    curriculumFit: boolean;
    familiarMethods: boolean;
    concise: boolean;
    noHandWaving: boolean;
    hintsProgressive: boolean;
  };
}

interface Marker {
  re: RegExp;
  label: string;
}

const FORBIDDEN: Marker[] = [
  { re: /đạo hàm|derivative|tích phân|nguyên hàm|integral|\\int\b|\\lim\b|\\frac\{d[a-z]?\}\{d[a-z]\}|\bf'\(|f′\(/iu, label: "calculus (derivatives, integrals, limits)" },
  { re: /\\vec\b|\\overrightarrow|vectơ|véc-?tơ|tích vô hướng|dot product|\bvector\b/iu, label: "vectors" },
  { re: /định lí (hàm số )?(sin|côsin|cosin|cos)\b|law of (sines|cosines)|-\s*2\s*[a-z]{1,2}\s*(\\cdot\s*)?\\cos/iu, label: "the law of sines/cosines" },
  // Words only: \begin{matrix} is also how a grid (e.g. a magic square) is typeset.
  { re: /ma trận|định thức|\bmatrices\b|\bmatrix (multiplication|of)|determinant|số phức|complex number/iu, label: "matrices or complex numbers" },
];

const ADVISORY: Marker[] = [
  { re: /bunh?iac[oô]p?xki|bunyakovsky|cauchy[\s–-]*schwarz|jensen|chebyshev|trê-?bư-?sép|schur|h[oö]lder|minkowski/iu, label: "a named olympiad inequality" },
  { re: /≡|\\equiv|\\pmod|\bmod\b|đồng dư/iu, label: "congruence notation" },
  { re: /quy nạp|induction/iu, label: "mathematical induction" },
  { re: /fermat nhỏ|little fermat|fermat's little|định lí euler|wilson/iu, label: "a number-theory theorem beyond Grade 9" },
];

const COORDINATES_IN_TEXT = /tọa độ|toạ độ|hệ trục|\bOxy\b|coordinate/iu;
const HAND_WAVING = /(dễ (dàng )?(thấy|chứng minh được|suy ra)|hiển nhiên|ta chứng minh được|it can be shown|obviously|clearly)/iu;

/** Every student-facing text that carries the method: strategy, hints, steps, final answer. */
function methodText(lesson: ModelLesson): string {
  return [
    lesson.strategy,
    lesson.finalAnswer.text,
    lesson.finalAnswer.math ?? "",
    ...lesson.hints.flatMap((h) => [h.question, h.cue ?? "", h.explanation, h.math ?? ""]),
    ...lesson.steps.flatMap((s) => [s.title, s.explanation, s.math ?? "", s.reason ?? ""]),
  ].join("\n");
}

/** A short problem with one question and no figure: the student expects a short solution. */
export function isSimpleProblem(statement: string, topic: string): boolean {
  const parts = statement.match(/(?:^|\s)[a-e]\)/g)?.length ?? 0;
  return topic !== "geometry" && parts <= 1 && statement.length <= 220 && !/chứng minh|prove|show that/iu.test(statement);
}

/** The key value of the final answer ("x \le 2", "18"), used to catch hints that give the answer away. */
function answerKey(lesson: ModelLesson): string | null {
  const m = (lesson.finalAnswer.math ?? "").replace(/\s+/g, "");
  return m.length >= 2 && m.length <= 40 ? m : null;
}

export function gradeLevelReport(lesson: ModelLesson): GradeLevelReport {
  const text = methodText(lesson);
  const statement = lesson.analysis.statement;
  const forbidden = FORBIDDEN.filter((m) => m.re.test(text) && !m.re.test(statement)).map((m) => m.label);
  if (lesson.analysis.topic === "geometry" && COORDINATES_IN_TEXT.test(text) && !COORDINATES_IN_TEXT.test(statement)) {
    forbidden.push("coordinates for a synthetic geometry problem that doesn't mention them");
  }
  const advisory = ADVISORY.filter((m) => m.re.test(text) && !m.re.test(statement)).map((m) => `uses ${m.label}`);

  const simple = isSimpleProblem(statement, lesson.analysis.topic);
  const longExplanations = lesson.steps.filter((s) => s.explanation.length > 320).length;
  const concise = !(simple && lesson.steps.length > 6) && longExplanations === 0;
  if (simple && lesson.steps.length > 6) advisory.push(`${lesson.steps.length} steps for a simple problem`);
  if (longExplanations) advisory.push(`${longExplanations} step explanation(s) longer than ~3 sentences`);

  const handWaving = HAND_WAVING.test(lesson.steps.map((s) => `${s.explanation} ${s.reason ?? ""}`).join("\n"));
  if (handWaving) advisory.push('a step asserts a result without showing it ("dễ thấy", "ta chứng minh được")');

  const key = answerKey(lesson);
  const first = lesson.hints[0];
  const revealsEarly = !!(key && first && `${first.question} ${first.cue ?? ""}`.replace(/\s+/g, "").includes(key));
  const tooManyHints = lesson.hints.length > (simple ? 4 : 6);
  if (revealsEarly) advisory.push("the first hint gives the final answer away");
  if (tooManyHints) advisory.push(`${lesson.hints.length} hints (expected ≤ ${simple ? 4 : 6})`);

  return {
    forbidden,
    advisory,
    rubric: {
      curriculumFit: forbidden.length === 0,
      familiarMethods: !advisory.some((a) => a.startsWith("uses ")),
      concise,
      noHandWaving: !handWaving,
      hintsProgressive: !revealsEarly && !tooManyHints && lesson.hints.length > 0,
    },
  };
}

/** Retry feedback for methods outside the curriculum. */
export function gradeLevelFeedback(lesson: ModelLesson): string[] {
  if (lesson.analysis.status !== "solvable" || !lesson.analysis.withinCurriculum) return [];
  return gradeLevelReport(lesson).forbidden.map(
    (f) => `the solution uses ${f}, which a Vietnamese Grade 9 student has not learned: solve it again with Grade 9 methods (identities, factorising, Vi-ét, congruent/similar triangles, circle angle theorems, …)`,
  );
}
