import { z } from "zod";

// ---- Question extraction & classification (spec §6) ----------------------
export const QuestionExtractionSchema = z.object({
  extracted_text: z.string().min(1).max(4000),
  subject: z.literal("mathematics"),
  topic: z.string().min(1).max(120),
  is_geometry: z.boolean(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  concepts: z.array(z.string().min(1).max(80)).max(12),
  diagram_required: z.boolean(),
  not_a_math_question: z.boolean().default(false),
});
export type QuestionExtraction = z.infer<typeof QuestionExtractionSchema>;

// ---- Geometry scene graph --------------------------------------------------
// Normalized 0-100 coordinate space so the client can render at any size.
const PointSchema = z.object({
  id: z.string().min(1).max(20),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  label: z.string().max(20).optional(),
});

const SegmentSchema = z.object({
  from: z.string().min(1).max(20),
  to: z.string().min(1).max(20),
  label: z.string().max(40).optional(),
  style: z.enum(["solid", "dashed"]).default("solid"),
});

const CircleSchema = z.object({
  center: z.string().min(1).max(20),
  radius: z.number().positive().max(100),
  label: z.string().max(40).optional(),
});

const PolygonSchema = z.object({
  points: z.array(z.string().min(1).max(20)).min(3).max(12),
  label: z.string().max(40).optional(),
  fill: z.boolean().default(false),
});

const AngleMarkSchema = z.object({
  vertex: z.string().min(1).max(20),
  from: z.string().min(1).max(20),
  to: z.string().min(1).max(20),
  label: z.string().max(20).optional(),
  degrees: z.number().min(0).max(360).optional(),
});

export const GeometrySpecSchema = z.object({
  points: z.array(PointSchema).min(1).max(30),
  segments: z.array(SegmentSchema).max(60).default([]),
  circles: z.array(CircleSchema).max(10).default([]),
  polygons: z.array(PolygonSchema).max(10).default([]),
  angles: z.array(AngleMarkSchema).max(20).default([]),
  title: z.string().max(120).optional(),
});
export type GeometrySpec = z.infer<typeof GeometrySpecSchema>;

// ---- Solution --------------------------------------------------------------
export const SolutionStepSchema = z.object({
  step_number: z.number().int().positive(),
  description: z.string().min(1).max(2000),
  math_expression: z.string().max(500).optional(),
});

export const SolutionSchema = z.object({
  solution_steps: z.array(SolutionStepSchema).min(1).max(30),
  final_answer: z.string().min(1).max(500),
  explanation: z.string().min(1).max(4000),
});
export type Solution = z.infer<typeof SolutionSchema>;

/** Parses `raw` as JSON and validates it against `schema`. Never throws;
 * callers get a discriminated result so a malformed AI response becomes a
 * handled pipeline failure instead of a silent pass-through or a crash. */
export function parseAndValidate<S extends z.ZodTypeAny>(
  raw: string,
  schema: S
): { ok: true; data: z.infer<S> } | { ok: false; error: string } {
  let json: unknown;
  try {
    // Models sometimes wrap JSON in markdown fences despite instructions.
    const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
    json = JSON.parse(cleaned);
  } catch {
    return { ok: false, error: "AI response was not valid JSON" };
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    return { ok: false, error: `AI response failed schema validation: ${result.error.message}` };
  }
  return { ok: true, data: result.data };
}
