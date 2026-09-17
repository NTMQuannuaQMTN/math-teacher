import type { Env } from "./types";
import type { GeometrySpec, QuestionExtraction, Solution } from "./schema";

export interface QuestionRow {
  id: string;
  status: "processing" | "complete" | "failed";
  image_r2_key: string;
  image_content_type: string;
  extracted_text: string | null;
  subject: string | null;
  topic: string | null;
  is_geometry: number | null;
  difficulty: string | null;
  concepts_json: string | null;
  diagram_required: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export async function insertProcessingQuestion(
  env: Env,
  id: string,
  imageR2Key: string,
  contentType: string
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO questions (id, status, image_r2_key, image_content_type)
     VALUES (?, 'processing', ?, ?)`
  )
    .bind(id, imageR2Key, contentType)
    .run();
}

export async function saveExtraction(
  env: Env,
  id: string,
  extraction: QuestionExtraction
): Promise<void> {
  await env.DB.prepare(
    `UPDATE questions
     SET extracted_text = ?, subject = ?, topic = ?, is_geometry = ?, difficulty = ?,
         concepts_json = ?, diagram_required = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE id = ?`
  )
    .bind(
      extraction.extracted_text,
      extraction.subject,
      extraction.topic,
      extraction.is_geometry ? 1 : 0,
      extraction.difficulty,
      JSON.stringify(extraction.concepts),
      extraction.diagram_required ? 1 : 0,
      id
    )
    .run();
}

export async function saveGeometrySpec(env: Env, questionId: string, spec: GeometrySpec): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO geometry_specs (id, question_id, spec_json) VALUES (?, ?, ?)`
  )
    .bind(crypto.randomUUID(), questionId, JSON.stringify(spec))
    .run();
}

export async function saveSolution(env: Env, questionId: string, solution: Solution): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO solutions (id, question_id, steps_json, final_answer, explanation) VALUES (?, ?, ?, ?, ?)`
  )
    .bind(
      crypto.randomUUID(),
      questionId,
      JSON.stringify(solution.solution_steps),
      solution.final_answer,
      solution.explanation
    )
    .run();
}

export async function markQuestionComplete(env: Env, id: string): Promise<void> {
  await env.DB.prepare(
    `UPDATE questions SET status = 'complete', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`
  )
    .bind(id)
    .run();
}

/** `errorMessage` is served to clients verbatim via GET /api/questions/:id —
 * callers must pass a user-safe message, never a raw provider/validation
 * error. Log diagnostic detail separately with console.error. */
export async function markQuestionFailed(env: Env, id: string, errorMessage: string): Promise<void> {
  await env.DB.prepare(
    `UPDATE questions
     SET status = 'failed', error_message = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE id = ?`
  )
    .bind(errorMessage.slice(0, 1000), id)
    .run();
}

export async function getQuestion(env: Env, id: string): Promise<QuestionRow | null> {
  const row = await env.DB.prepare("SELECT * FROM questions WHERE id = ?").bind(id).first<QuestionRow>();
  return row ?? null;
}

export async function getGeometrySpecForQuestion(env: Env, questionId: string) {
  return env.DB.prepare("SELECT spec_json FROM geometry_specs WHERE question_id = ? ORDER BY created_at DESC LIMIT 1")
    .bind(questionId)
    .first<{ spec_json: string }>();
}

export async function getSolutionForQuestion(env: Env, questionId: string) {
  return env.DB.prepare(
    "SELECT steps_json, final_answer, explanation FROM solutions WHERE question_id = ? ORDER BY created_at DESC LIMIT 1"
  )
    .bind(questionId)
    .first<{ steps_json: string; final_answer: string; explanation: string }>();
}
