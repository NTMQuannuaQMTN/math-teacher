import {
  FeedbackRequestSchema,
  ModelLessonSchema,
  type Feedback,
  type FeedbackRequest,
  type ModelLesson,
} from "../../../shared/src/solution";
import { nowIso } from "../db";
import { intVar } from "../env";
import { ApiError, json } from "../http";
import { consumeRateLimit } from "../rateLimits";
import type { RouteContext } from "./scans";

interface FeedbackRow {
  id: string;
  scan_id: string;
  question_id: string;
  target_kind: Feedback["targetKind"];
  target_id: string | null;
  target_text: string | null;
  category: Feedback["category"];
  note: string | null;
  problem_text: string | null;
  model: string | null;
  prompt_version: string | null;
  verification_status: string | null;
  created_at: string;
}

const toApi = (r: FeedbackRow): Feedback => ({
  id: r.id,
  scanId: r.scan_id,
  questionId: r.question_id,
  targetKind: r.target_kind,
  targetId: r.target_id,
  targetText: r.target_text,
  category: r.category,
  note: r.note,
  problemText: r.problem_text,
  model: r.model,
  promptVersion: r.prompt_version,
  verificationStatus: r.verification_status,
  createdAt: r.created_at,
});

/** The reported content as text, kept with the report so the recap survives a regenerate. */
export function snapshotTarget(lesson: ModelLesson, target: FeedbackRequest["target"]): string | null {
  const clip = (s: string) => s.slice(0, 2000);
  switch (target.kind) {
    case "step": {
      const i = lesson.steps.findIndex((s) => s.id === target.id);
      const s = lesson.steps[i];
      return s ? clip(`Bước ${i + 1} — ${s.title}: ${s.explanation}${s.math ? `\n$$${s.math}$$` : ""}${s.reason ? `\n(${s.reason})` : ""}`) : null;
    }
    case "hint": {
      const i = lesson.hints.findIndex((h) => h.id === target.id);
      const h = lesson.hints[i];
      return h ? clip(`Gợi ý ${i + 1}: ${h.question}\n→ ${h.explanation}`) : null;
    }
    case "answer":
      return clip(`${lesson.finalAnswer.text}${lesson.finalAnswer.math ? `\n$$${lesson.finalAnswer.math}$$` : ""}`);
    case "figure":
      return lesson.figure
        ? clip(lesson.figure.points.filter((p) => !p.hidden).map((p) => `${p.id} = ${p.kind}(${p.refs.join(", ")})`).join("; "))
        : "(không có hình vẽ)";
    case "lesson":
      return clip(lesson.strategy);
  }
}

/** POST /v1/scans/:id/questions/:q/feedback — report a mistake in a lesson. */
export async function createFeedback(rc: RouteContext, scanId: string, questionId: string): Promise<Response> {
  const { env, request, ownerId } = rc;
  const body = FeedbackRequestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) throw new ApiError(400, "bad_request", "Invalid feedback.");
  const req = body.data;
  if ((req.target.kind === "step" || req.target.kind === "hint") && !req.target.id) throw new ApiError(400, "bad_request", "Missing step or hint id.");

  const row = await env.DB.prepare(
    `SELECT s.id, s.lesson_json, s.verification_json, s.model, s.prompt_version, c.problem_text
       FROM solutions s JOIN scans c ON c.id = s.scan_id
      WHERE s.scan_id = ? AND s.question_id = ? AND s.owner_id = ?`,
  )
    .bind(scanId, questionId, ownerId)
    .first<{ id: string; lesson_json: string | null; verification_json: string | null; model: string; prompt_version: string; problem_text: string | null }>();
  if (!row) throw new ApiError(404, "not_found", "Lesson not found.");
  await consumeRateLimit(env.DB, `feedback:device:${ownerId}`, intVar(env.FEEDBACK_LIMIT_PER_DEVICE_PER_HOUR, 120), 3600);

  const lesson = row.lesson_json ? ModelLessonSchema.safeParse(JSON.parse(row.lesson_json)) : null;
  const verification = row.verification_json ? (JSON.parse(row.verification_json) as { status?: string }) : null;
  const record: FeedbackRow = {
    id: crypto.randomUUID(),
    scan_id: scanId,
    question_id: questionId,
    target_kind: req.target.kind,
    target_id: req.target.id,
    target_text: lesson?.success ? snapshotTarget(lesson.data, req.target) : null,
    category: req.category,
    note: req.note || null,
    problem_text: lesson?.success ? lesson.data.analysis.statement || row.problem_text : row.problem_text,
    model: row.model,
    prompt_version: row.prompt_version,
    verification_status: verification?.status ?? null,
    created_at: nowIso(),
  };
  await env.DB.prepare(
    `INSERT INTO lesson_feedback (id, owner_id, scan_id, question_id, solution_id, target_kind, target_id, target_text, category, note,
       problem_text, model, prompt_version, verification_status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(record.id, ownerId, scanId, questionId, row.id, record.target_kind, record.target_id, record.target_text, record.category, record.note,
      record.problem_text, record.model, record.prompt_version, record.verification_status, record.created_at)
    .run();
  console.log(`[feedback ${scanId}/${questionId}] ${record.category} on ${record.target_kind}${record.target_id ? ` ${record.target_id}` : ""}`);
  return json({ feedback: toApi(record) }, 201);
}

/** GET /v1/feedback — this device's reports, newest first (the in-app recap). */
export async function listFeedback(rc: RouteContext): Promise<Response> {
  const { results } = await rc.env.DB.prepare(
    `SELECT id, scan_id, question_id, target_kind, target_id, target_text, category, note, problem_text, model, prompt_version, verification_status, created_at
       FROM lesson_feedback WHERE owner_id = ? ORDER BY created_at DESC LIMIT 200`,
  )
    .bind(rc.ownerId)
    .all<FeedbackRow>();
  return json({ items: results.map(toApi) });
}
