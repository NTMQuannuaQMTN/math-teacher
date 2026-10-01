/**
 * Solver contract: structured problem understanding, hint-first lesson,
 * step-by-step solution, interactive geometry, and verification results.
 *
 * The AI produces `ModelLesson` (validated here, server-side); the API
 * returns `Solution` (the lesson plus server-computed verification). The
 * app renders this data — it never parses free-form AI prose for structure.
 *
 * Conventions for all text fields: prose with inline maths in `$…$`
 * (LaTeX), same format as problem text. `math` fields are a single LaTeX
 * expression rendered as a display equation.
 */
import { z } from "zod";

const Id = z.string().min(1).max(40).regex(/^[A-Za-z0-9_']+$/);
const Text = z.string().max(1500);
const ShortText = z.string().max(300);
const Latex = z.string().max(800);

// ---------------------------------------------------------------------------
// Problem understanding
// ---------------------------------------------------------------------------

export const TopicSchema = z.enum([
  "arithmetic",
  "algebra",
  "equation",
  "inequality",
  "system",
  "function",
  "geometry",
  "word_problem",
  "statistics_probability",
  "other",
]);
export type Topic = z.infer<typeof TopicSchema>;

export const AnalysisSchema = z.strictObject({
  /** The problem restated cleanly (OCR noise fixed), same markup as problem text. */
  statement: Text,
  language: z.enum(["vi", "en", "mixed"]),
  topic: TopicSchema,
  subtopic: ShortText,
  /** Grade level the problem is pitched at (e.g. 9). */
  gradeLevel: z.number().int().min(1).max(12),
  /** Can it be solved with the configured curriculum's methods? */
  withinCurriculum: z.boolean(),
  concepts: z.array(ShortText).max(8),
  givens: z.array(ShortText).max(12),
  unknowns: z.array(ShortText).max(8),
  constraints: z.array(ShortText).max(8),
  /**
   * solvable      — understood; a lesson follows
   * ambiguous     — cannot be solved without guessing (e.g. OCR garbled a key value)
   * unsupported   — needs mathematics beyond the configured curriculum
   * not_a_problem — no maths question to answer
   */
  status: z.enum(["solvable", "ambiguous", "unsupported", "not_a_problem"]),
  /** Why the status is not "solvable", in the student's language. */
  statusReason: ShortText.nullable(),
  /** Places where the OCR text looked doubtful and how it was interpreted. */
  interpretationNotes: z.array(ShortText).max(5),
});
export type Analysis = z.infer<typeof AnalysisSchema>;

// ---------------------------------------------------------------------------
// Geometry (construction-based; resolved by geometry.ts)
// ---------------------------------------------------------------------------

export const PointKindSchema = z.enum([
  "free", // x, y
  "polar", // refs [P]; value = direction (deg, counter-clockwise from +x); value2 = distance
  "midpoint", // refs [A, B]
  "on_segment", // refs [A, B]; value = t (A + t·AB); t outside [0,1] extends the line
  "foot", // refs [P, A, B]; foot of perpendicular from P to line AB
  "intersection", // refs [A, B, C, D]; lines AB and CD
  "line_circle", // refs [A, B, circleId]; value 0 = hit nearer to A, 1 = farther from A
  "circle_circle", // refs [c1, c2] (value 0|1 picks the side) or [c1, c2, P]: the intersection other than P
  "on_circle", // refs [circleId]; value = angle (deg) around the centre
  "tangent", // refs [P, circleId]; value 0|1 chooses which tangent point
  "reflect", // refs [P, O] (through a point) or [P, A, B] (over line AB)
  "rotate", // refs [P, O]; value = angle (deg, counter-clockwise)
  "translate", // refs [P, A, B]; value = t, P + t·AB (parallel through P)
  "centroid", // refs [A, B, C]
  "circumcenter", // refs [A, B, C]
  "incenter", // refs [A, B, C]
  "orthocenter", // refs [A, B, C]
]);

export const PointDefSchema = z.strictObject({
  id: Id,
  label: z.string().max(8),
  kind: PointKindSchema,
  refs: z.array(Id).max(4),
  x: z.number().nullable(),
  y: z.number().nullable(),
  value: z.number().nullable(),
  value2: z.number().nullable(),
  /**
   * Legacy hint from the model; not used for interaction. Draggability is
   * derived from the construction (free points, points on a segment/circle).
   */
  draggable: z.boolean(),
  /** Helper point that isn't drawn or labelled. */
  hidden: z.boolean(),
});
export type PointDef = z.infer<typeof PointDefSchema>;

/** given = part of the problem; construction = auxiliary line the solution adds; hidden until shown by a step. */
export const StyleSchema = z.enum(["given", "construction"]);

export const LineDefSchema = z.strictObject({
  id: Id,
  kind: z.enum(["segment", "line", "ray"]),
  from: Id,
  to: Id,
  style: StyleSchema,
  /** e.g. "6 cm" or "x"; shown next to the element. */
  label: z.string().max(20).nullable(),
});
export type LineDef = z.infer<typeof LineDefSchema>;

export const CircleDefSchema = z.strictObject({
  id: Id,
  center: Id,
  /** Radius defined by a point on the circle… */
  through: Id.nullable(),
  /** …or by a number. */
  radius: z.number().nullable(),
  style: StyleSchema,
  label: z.string().max(20).nullable(),
});
export type CircleDef = z.infer<typeof CircleDefSchema>;

export const AngleDefSchema = z.strictObject({
  id: Id,
  /** ∠(from, vertex, to) */
  from: Id,
  vertex: Id,
  to: Id,
  /** e.g. "40°", "?", "x". Null = arc only. */
  label: z.string().max(20).nullable(),
  right: z.boolean(),
  style: StyleSchema,
});
export type AngleDef = z.infer<typeof AngleDefSchema>;

export const MarkDefSchema = z.strictObject({
  kind: z.enum(["equal", "parallel"]),
  /** Line ids carrying the same mark. */
  targets: z.array(Id).min(2).max(6),
  /** Number of ticks/arrows, to distinguish groups. */
  group: z.number().int().min(1).max(3),
});

export const FigureCheckSchema = z.strictObject({
  kind: z.enum([
    "equal_length", // refs [A, B, C, D]: AB = CD
    "length_value", // refs [A, B]; value
    "length_ratio", // refs [A, B, C, D]; value = AB / CD
    "angle_value", // refs [A, V, B]; value (deg)
    "equal_angle", // refs [A, V, B, C, W, D]
    "perpendicular", // refs [A, B, C, D]: AB ⊥ CD
    "parallel", // refs [A, B, C, D]: AB ∥ CD
    "collinear", // refs [A, B, C]
    "on_circle", // refs [P, circleId]
    "concyclic", // refs [A, B, C, D]
  ]),
  refs: z.array(Id).min(2).max(6),
  value: z.number().nullable(),
  /** given = stated in the problem; derived = claimed by the solution. */
  role: z.enum(["given", "derived"]),
});
export type FigureCheck = z.infer<typeof FigureCheckSchema>;

export const FigureSchema = z.strictObject({
  /**
   * exact     — constructed from the given numbers, so measurements are true to the problem
   * schematic — the problem has no fixed shape; the figure is one valid example
   */
  scale: z.enum(["exact", "schematic"]),
  points: z.array(PointDefSchema).min(1).max(30),
  lines: z.array(LineDefSchema).max(40),
  circles: z.array(CircleDefSchema).max(6),
  angles: z.array(AngleDefSchema).max(16),
  marks: z.array(MarkDefSchema).max(8),
  checks: z.array(FigureCheckSchema).max(16),
});
export type Figure = z.infer<typeof FigureSchema>;

// ---------------------------------------------------------------------------
// Lesson: hints, steps, answer
// ---------------------------------------------------------------------------

export const GeometryActionSchema = z.strictObject({
  /** highlight = emphasise; show = reveal a construction element from this step on. */
  action: z.enum(["highlight", "show"]),
  targets: z.array(Id).min(1).max(10),
});
export type GeometryAction = z.infer<typeof GeometryActionSchema>;

export const StepSchema = z.strictObject({
  id: Id,
  title: ShortText,
  explanation: Text,
  /** The mathematical statement of this step (display LaTeX), if any. */
  math: Latex.nullable(),
  /** The property/theorem used, named as a Grade 9 student learned it. */
  reason: ShortText.nullable(),
  geometryActions: z.array(GeometryActionSchema).max(4),
});
export type Step = z.infer<typeof StepSchema>;

export const HintSchema = z.strictObject({
  id: Id,
  /** 1 = guiding question … 4 = explicit setup. */
  level: z.number().int().min(1).max(4),
  /** Shown first: a question that points at the next idea without giving it away. */
  question: ShortText,
  /** Optional nudge shown with the question (a concept to recall). */
  cue: ShortText.nullable(),
  /** Hidden until the student asks: the idea, explained. */
  explanation: Text,
  math: Latex.nullable(),
  /** The solution step this hint leads to. */
  stepId: Id,
  /** Figure objects to highlight when this hint is revealed. */
  focus: z.array(Id).max(10),
});
export type Hint = z.infer<typeof HintSchema>;

export const AnswerCheckSchema = z.strictObject({
  /**
   * substitute — every assignment set satisfies every statement (equations, systems, word problems)
   * identity   — statements[0] is "LHS = RHS" true for all allowed values; statements[1..] are domain conditions
   * inequality — statements[0] is the original inequality; expected is the solution set ("x >= -5", "x < 1 or x > 3")
   * value      — statements[0] is an expression whose value is `expected`
   * integers   — statements[0] is the problem's condition on one integer variable (e.g. "((n+4)^4 - n^4) % 3 = 0"),
   *              statements[1..] its domain ("n >= 1"); expected is the claimed answer set ("n % 3 = 1", or "none").
   *              Checked by trying every integer in -200..200.
   */
  kind: z.enum(["substitute", "identity", "inequality", "value", "integers"]),
  statements: z.array(z.string().max(300)).min(1).max(6),
  assignments: z
    .array(z.array(z.strictObject({ variable: z.string().max(10), value: z.string().max(120) })).max(6))
    .max(6),
  expected: z.string().max(200).nullable(),
});
export type AnswerCheck = z.infer<typeof AnswerCheckSchema>;

export const ModelLessonSchema = z.strictObject({
  analysis: AnalysisSchema,
  /** One or two sentences: the plan, in plain words. */
  strategy: Text,
  hints: z.array(HintSchema).max(8),
  steps: z.array(StepSchema).max(14),
  finalAnswer: z.strictObject({ text: Text, math: Latex.nullable() }),
  answerChecks: z.array(AnswerCheckSchema).max(6),
  /**
   * Last on purpose: models write fields in schema order, so the figure is drawn
   * after the solution is worked out and checked, and can include everything it uses.
   */
  figure: FigureSchema.nullable(),
});
export type ModelLesson = z.infer<typeof ModelLessonSchema>;

// ---------------------------------------------------------------------------
// API shapes
// ---------------------------------------------------------------------------

export const VerificationSchema = z.strictObject({
  /**
   * verified       — every machine check passed
   * partial        — some claims were checked and passed, others couldn't be checked
   * unverified     — at least one check failed even after a retry: don't present as correct
   * not_checkable  — the problem type has nothing machine-checkable (e.g. a proof)
   */
  status: z.enum(["verified", "partial", "unverified", "not_checkable"]),
  checks: z.array(z.strictObject({ label: z.string(), passed: z.boolean() })).max(40),
  /** Why the figure is missing, if the lesson had one that couldn't be trusted. */
  figureIssue: z.string().nullable(),
});
export type Verification = z.infer<typeof VerificationSchema>;

/**
 * Live progress of a pending solve. The preview fields come from the model's partial output and are
 * NOT verified: the app shows them as a draft, never as a checked result.
 */
export const SolveProgressSchema = z.object({
  /** thinking = the model is reasoning (nothing visible yet); writing = the lesson is arriving;
   *  checking = the verifier runs; retrying = a corrected attempt was requested. */
  stage: z.enum(["thinking", "writing", "checking", "retrying"]),
  attempt: z.number().int(),
  elapsedMs: z.number().int(),
  stepsWritten: z.number().int(),
  problemKind: z.string().nullable(),
  strategy: z.string().nullable(),
});
export type SolveProgress = z.infer<typeof SolveProgressSchema>;

export const SolutionSchema = z.object({
  id: z.string(),
  scanId: z.string(),
  /** Which question of the scan this lesson is for ("q1", "q2", …). */
  questionId: z.string(),
  /** pending = being generated (poll GET …/solution); ready; failed (see error). */
  status: z.enum(["pending", "ready", "failed"]),
  createdAt: z.string(),
  lesson: ModelLessonSchema.nullable(),
  verification: VerificationSchema.nullable(),
  /** Set when status is "failed". */
  error: z.object({ code: z.string(), retryable: z.boolean() }).nullable(),
  model: z.string(),
  promptVersion: z.string(),
  attempts: z.number().int(),
  /** Present while status is "pending" and the server reports progress (older servers omit it). */
  progress: SolveProgressSchema.nullable().optional(),
});
export type Solution = z.infer<typeof SolutionSchema>;

export const SolutionResponseSchema = z.object({ solution: SolutionSchema });
export type SolutionResponse = z.infer<typeof SolutionResponseSchema>;

export const SolveRequestSchema = z.object({ regenerate: z.boolean().default(false) });
