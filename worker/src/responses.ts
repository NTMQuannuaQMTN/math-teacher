import type { QuestionRow } from "./db";

export function toClientQuestion(
  row: QuestionRow,
  geometrySpecJson: string | null,
  solution: { steps_json: string; final_answer: string; explanation: string } | null
) {
  return {
    id: row.id,
    status: row.status,
    error: row.error_message,
    created_at: row.created_at,
    classification:
      row.extracted_text === null
        ? null
        : {
            extracted_text: row.extracted_text,
            subject: row.subject,
            topic: row.topic,
            is_geometry: !!row.is_geometry,
            difficulty: row.difficulty,
            concepts: row.concepts_json ? JSON.parse(row.concepts_json) : [],
            diagram_required: !!row.diagram_required,
          },
    geometry: geometrySpecJson ? JSON.parse(geometrySpecJson) : null,
    solution: solution
      ? {
          steps: JSON.parse(solution.steps_json),
          final_answer: solution.final_answer,
          explanation: solution.explanation,
        }
      : null,
  };
}
