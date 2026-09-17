// Mirrors worker/src/responses.ts's toClientQuestion() shape. Keep in sync
// manually for the MVP (no shared package between app/worker yet).

export type Difficulty = "easy" | "medium" | "hard";

export interface Classification {
  extracted_text: string;
  subject: string | null;
  topic: string | null;
  is_geometry: boolean;
  difficulty: Difficulty | null;
  concepts: string[];
  diagram_required: boolean;
}

export interface GeometryPoint {
  id: string;
  x: number;
  y: number;
  label?: string;
}

export interface GeometrySegment {
  from: string;
  to: string;
  label?: string;
  style: "solid" | "dashed";
}

export interface GeometryCircle {
  center: string;
  radius: number;
  label?: string;
}

export interface GeometryPolygon {
  points: string[];
  label?: string;
  fill: boolean;
}

export interface GeometryAngle {
  vertex: string;
  from: string;
  to: string;
  label?: string;
  degrees?: number;
}

export interface GeometrySpec {
  points: GeometryPoint[];
  segments: GeometrySegment[];
  circles: GeometryCircle[];
  polygons: GeometryPolygon[];
  angles: GeometryAngle[];
  title?: string;
}

export interface SolutionStep {
  step_number: number;
  description: string;
  math_expression?: string;
}

export interface Solution {
  steps: SolutionStep[];
  final_answer: string;
  explanation: string;
}

export type QuestionStatus = "processing" | "complete" | "failed";

export interface QuestionResult {
  id: string;
  status: QuestionStatus;
  error: string | null;
  created_at?: string;
  classification: Classification | null;
  geometry: GeometrySpec | null;
  solution: Solution | null;
}

export interface ApiErrorBody {
  error: string;
  code?: string;
}
