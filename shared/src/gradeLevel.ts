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
  { re: /đạo hàm|derivative|tích phân|nguyên hàm|integral|\\int\b|\\lim\b/iu, label: "calculus (derivatives, integrals, limits)" },
  // Case-sensitive: \frac{DE}{DF} is a ratio of segments (point D), not dy/dx.
  { re: /\\frac\{d[a-z]?\}\{d[a-z]\}|\bf'\(|f′\(/u, label: "calculus (derivatives, integrals, limits)" },
  { re: /\\vec\b|\\overrightarrow|vectơ|véc-?tơ|tích vô hướng|dot product|\bvector\b/iu, label: "vectors" },
  { re: /định lí (hàm số )?(sin|côsin|cosin|cos)\b|law of (sines|cosines)|-\s*2\s*[a-z]{1,2}\s*(\\cdot\s*)?\\cos/iu, label: "the law of sines/cosines" },
  // Words only: \begin{matrix} is also how a grid (e.g. a magic square) is typeset.
  { re: /ma trận|định thức|\bmatrices\b|\bmatrix (multiplication|of)|determinant|số phức|complex number/iu, label: "matrices or complex numbers" },
  // Students combine remainder conditions by hand (n = 9k + 7, k lẻ ⇒ n = 18l + 16), not by citing this theorem.
  { re: /chinese remainder|số dư (trung hoa|trung quốc|china)|định l[íý] (số dư )?(trung hoa|china)|\bCRT\b/iu, label: "the Chinese remainder theorem" },
  // Outside the agreed knowledge base (docs/CURRICULUM_KNOWLEDGE_BASE.md). Ceva, Menelaus, Simson, homothety,
  // spiral similarity and radical axis are INSIDE it (B2, B5) — advisory below, not forbidden.
  {
    re: /antiparallel|đối song|inversion|phép nghịch đảo|\bpolar\b|đường đối cực|harmonic (division|range|conjugate)|hàng điểm điều hòa|chùm điều hòa|cross[- ]ratio|tỉ số kép|nine[- ]point|đường tròn chín điểm|đường thẳng euler|euler line/iu,
    label: "geometry tools outside the knowledge base (antiparallel, inversion, pole/polar, harmonic division, cross-ratio, nine-point circle, Euler line)",
  },
  { re: /jensen|schur|h[oö]lder|minkowski/iu, label: "olympiad-only inequalities (Jensen, Schur, Hölder, Minkowski)" },
  { re: /logarit|\\log\b|\\ln\b|\blogarithm/iu, label: "logarithms" },
];

const ADVISORY: Marker[] = [
  // Cô-si and Bunhiacopxki (Cauchy–Schwarz) belong to the entrance-exam topic "bất đẳng thức và cực trị".
  // Advanced chuyên tools inside the knowledge base: allowed, noted so a reviewer can check they were needed.
  { re: /\bceva\b|menelaus|mê-nê-la|simson|homothe|phép vị tự|\bvị tự\b|spiral similarity|đồng dạng xoắn|radical axis|trục đẳng phương|tâm đẳng phương/iu, label: "an advanced chuyên configuration (Ceva, Menelaus, Simson, homothety, radical axis)" },
  { re: /chebyshev|trê-?bư-?sép/iu, label: "Chebyshev's sum inequality" },
  { re: /fermat nhỏ|little fermat|fermat's little|định lí euler|wilson/iu, label: "a number-theory theorem beyond Grade 9" },
];

const COORDINATES_IN_TEXT = /tọa độ|toạ độ|hệ trục|\bOxy\b|coordinate/iu;
const HAND_WAVING = /(dễ (dàng )?(thấy|chứng minh được|suy ra|kiểm tra)|(?<!như )đã thấy|hiển nhiên|rõ ràng là|ta chứng minh được|ta có ngay|it can be shown|obviously|clearly)/iu;
/** A proof (or a "find all" that needs a necessity + sufficiency argument). */
const PROOF_PROBLEM = /chứng minh|chứng tỏ|tìm tất cả|tìm mọi|prove|show that/iu;

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
  const forbidden = [...new Set(FORBIDDEN.filter((m) => m.re.test(text) && !m.re.test(statement)).map((m) => m.label))];
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
      familiarMethods: forbidden.length === 0 && !advisory.some((a) => a.startsWith("uses ")),
      concise,
      noHandWaving: !handWaving,
      hintsProgressive: !revealsEarly && !tooManyHints && lesson.hints.length > 0,
    },
  };
}

/** A problem whose own text needs mathematics beyond Grade 9 (the only case where "unsupported" is right). */
export function needsAdvancedMaths(statement: string): boolean {
  return FORBIDDEN.some((m) => m.re.test(statement));
}

/**
 * "Unsupported" for a problem that uses no outside method: every entrance-exam problem is within the
 * Grade 9 curriculum (the 13 review topics), so the model is asked to solve it.
 */
export function unsupportedFeedback(lesson: ModelLesson): string[] {
  const a = lesson.analysis;
  if (a.status !== "unsupported" || needsAdvancedMaths(a.statement)) return [];
  return [
    "this problem is within the Vietnamese Grade 9 / Grade 10 entrance-exam curriculum (systems, quadratics and Vi-ét, y = ax², simplifying expressions, word problems, right-triangle relations, statistics, probability, cylinder/cone/sphere, circle geometry, inequalities and extremum problems): set status \"solvable\", withinCurriculum true, and solve it with those methods",
  ];
}

/** Retry feedback for methods outside the curriculum. */
export function gradeLevelFeedback(lesson: ModelLesson): string[] {
  if (lesson.analysis.status !== "solvable") return [];
  const out: string[] = [];
  // The model's own withinCurriculum flag is not trusted: only a problem that itself needs advanced maths may use it.
  if (!needsAdvancedMaths(lesson.analysis.statement)) {
    out.push(
      ...gradeLevelReport(lesson).forbidden.map(
        (f) => `the solution uses ${f}, which a Vietnamese Grade 9 student has not learned: solve it again with Grade 9 methods (identities, factorising, Vi-ét, congruent/similar triangles, circle angle theorems, …)`,
      ),
    );
  }
  out.push(...proofGapFeedback(lesson));
  return out;
}

/**
 * In a proof every step must carry its argument. A step that asserts instead ("dễ thấy", "đã thấy",
 * "từ bước 2 và 3 đã thấy …") is sent back: the student needs the deduction, not a reference to it.
 */
export function proofGapFeedback(lesson: ModelLesson): string[] {
  if (!PROOF_PROBLEM.test(lesson.analysis.statement)) return [];
  const gaps = lesson.steps
    .map((s, i) => ({ n: i + 1, text: `${s.title} ${s.explanation} ${s.reason ?? ""}`, match: HAND_WAVING.exec(`${s.title} ${s.explanation} ${s.reason ?? ""}`) }))
    .filter((g) => g.match);
  return gaps.map(
    (g) => `step ${g.n} asserts a result instead of proving it ("${g.match![0]}"): write the deduction itself — the claim and why it holds (a given, a named theorem, or the earlier step it follows from, restating what that step proved)`,
  );
}
