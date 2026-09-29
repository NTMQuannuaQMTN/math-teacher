import {
  OcrResultSchema,
  QuestionSchema,
  type Question,
  type ErrorCode,
  type OcrResult,
  type Scan,
  type ScanSource,
} from "../../shared/src/contract";
import type { Env } from "./env";
import { signImageUrl } from "./imageUrls";

/** Raw D1 row. Only this module knows about column names. */
export interface ScanRow {
  id: string;
  owner_id: string;
  idempotency_key: string | null;
  status: "draft" | "confirmed";
  source: ScanSource;
  image_key: string;
  image_content_type: string;
  image_bytes: number;
  image_width: number;
  image_height: number;
  ocr_json: string | null;
  ocr_error_code: string | null;
  ocr_attempts: number;
  ocr_started_at: string | null;
  problem_text: string | null;
  problem_edited: number | null;
  questions_json: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
}

export interface NewScan {
  id: string;
  ownerId: string;
  idempotencyKey: string | null;
  source: ScanSource;
  imageKey: string;
  imageContentType: string;
  imageBytes: number;
  imageWidth: number;
  imageHeight: number;
}

const NON_RETRYABLE_OCR_ERRORS: ReadonlySet<string> = new Set(["ocr_refused"]);

export function nowIso(now = Date.now()): string {
  return new Date(now).toISOString();
}

export function isUniqueViolation(err: unknown): boolean {
  return err instanceof Error && /UNIQUE constraint failed/i.test(err.message);
}

export class ScanRepository {
  constructor(private readonly db: D1Database) {}

  /** Inserts a draft with the OCR lock already taken (ocr_started_at = now). */
  async insertDraft(scan: NewScan, now = Date.now()): Promise<void> {
    const ts = nowIso(now);
    await this.db
      .prepare(
        `INSERT INTO scans (id, owner_id, idempotency_key, status, source, image_key, image_content_type,
           image_bytes, image_width, image_height, ocr_attempts, ocr_started_at, created_at, updated_at)
         VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      )
      .bind(
        scan.id,
        scan.ownerId,
        scan.idempotencyKey,
        scan.source,
        scan.imageKey,
        scan.imageContentType,
        scan.imageBytes,
        scan.imageWidth,
        scan.imageHeight,
        ts,
        ts,
        ts,
      )
      .run();
  }

  async findOwned(ownerId: string, id: string): Promise<ScanRow | null> {
    return this.db
      .prepare("SELECT * FROM scans WHERE id = ? AND owner_id = ?")
      .bind(id, ownerId)
      .first<ScanRow>();
  }

  async findByIdempotencyKey(ownerId: string, key: string): Promise<ScanRow | null> {
    return this.db
      .prepare("SELECT * FROM scans WHERE owner_id = ? AND idempotency_key = ?")
      .bind(ownerId, key)
      .first<ScanRow>();
  }

  /** Used only by the signed image route, which has already verified the signature. */
  async findImage(id: string): Promise<Pick<ScanRow, "image_key" | "image_content_type"> | null> {
    return this.db
      .prepare("SELECT image_key, image_content_type FROM scans WHERE id = ?")
      .bind(id)
      .first();
  }

  /**
   * Atomically takes the OCR lock. Returns false if another OCR call for this
   * scan started less than `staleAfterMs` ago (a duplicate tap / request).
   */
  async tryLockOcr(ownerId: string, id: string, staleAfterMs: number, now = Date.now()): Promise<boolean> {
    const result = await this.db
      .prepare(
        `UPDATE scans SET ocr_started_at = ?, updated_at = ?
         WHERE id = ? AND owner_id = ? AND status = 'draft'
           AND (ocr_started_at IS NULL OR ocr_started_at < ?)`,
      )
      .bind(nowIso(now), nowIso(now), id, ownerId, nowIso(now - staleAfterMs))
      .run();
    return (result.meta.changes ?? 0) > 0;
  }

  async saveOcrSuccess(id: string, ocr: OcrResult, now = Date.now()): Promise<void> {
    await this.db
      .prepare(
        `UPDATE scans SET ocr_json = ?, ocr_error_code = NULL, ocr_attempts = ocr_attempts + 1,
           ocr_started_at = NULL, updated_at = ? WHERE id = ?`,
      )
      .bind(JSON.stringify(ocr), nowIso(now), id)
      .run();
  }

  /** Keeps any previous successful OCR result; only records the latest failure. */
  async saveOcrFailure(id: string, code: ErrorCode, now = Date.now()): Promise<void> {
    await this.db
      .prepare(
        `UPDATE scans SET ocr_error_code = ?, ocr_attempts = ocr_attempts + 1,
           ocr_started_at = NULL, updated_at = ? WHERE id = ?`,
      )
      .bind(code, nowIso(now), id)
      .run();
  }

  async confirm(ownerId: string, id: string, text: string, questions: Question[], edited: boolean, now = Date.now()): Promise<boolean> {
    const ts = nowIso(now);
    const result = await this.db
      .prepare(
        `UPDATE scans SET status = 'confirmed', problem_text = ?, questions_json = ?, problem_edited = ?,
           confirmed_at = COALESCE(confirmed_at, ?), updated_at = ?
         WHERE id = ? AND owner_id = ?`,
      )
      .bind(text, JSON.stringify(questions), edited ? 1 : 0, ts, ts, id, ownerId)
      .run();
    return (result.meta.changes ?? 0) > 0;
  }

  async delete(ownerId: string, id: string): Promise<boolean> {
    const [, result] = await this.db.batch([
      this.db.prepare("DELETE FROM solutions WHERE scan_id = ? AND owner_id = ?").bind(id, ownerId),
      this.db.prepare("DELETE FROM scans WHERE id = ? AND owner_id = ?").bind(id, ownerId),
    ]);
    return (result?.meta.changes ?? 0) > 0;
  }

  /**
   * Keyset pagination, newest first. Confirmed problems are ordered by when
   * they were confirmed; drafts by when they were created.
   */
  async list(
    ownerId: string,
    status: "draft" | "confirmed",
    limit: number,
    cursor: { time: string; id: string } | null,
    createdAfter: string | null,
  ): Promise<ScanRow[]> {
    const timeColumn = status === "confirmed" ? "confirmed_at" : "created_at";
    const conditions = ["owner_id = ?", "status = ?"];
    const params: (string | number)[] = [ownerId, status];
    if (cursor) {
      conditions.push(`(${timeColumn} < ? OR (${timeColumn} = ? AND id < ?))`);
      params.push(cursor.time, cursor.time, cursor.id);
    }
    if (createdAfter) {
      conditions.push("created_at > ?");
      params.push(createdAfter);
    }
    params.push(limit);
    const { results } = await this.db
      .prepare(
        `SELECT * FROM scans WHERE ${conditions.join(" AND ")}
         ORDER BY ${timeColumn} DESC, id DESC LIMIT ?`,
      )
      .bind(...params)
      .all<ScanRow>();
    return results;
  }

  async listExpiredDrafts(olderThan: string, limit: number): Promise<Pick<ScanRow, "id" | "image_key">[]> {
    const { results } = await this.db
      .prepare("SELECT id, image_key FROM scans WHERE status = 'draft' AND created_at < ? LIMIT ?")
      .bind(olderThan, limit)
      .all<Pick<ScanRow, "id" | "image_key">>();
    return results;
  }

  async deleteByIds(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => "?").join(",");
    await this.db.batch([
      this.db.prepare(`DELETE FROM solutions WHERE scan_id IN (${placeholders})`).bind(...ids),
      this.db.prepare(`DELETE FROM scans WHERE id IN (${placeholders})`).bind(...ids),
    ]);
  }
}

/** Confirmed questions; scans confirmed before splitting existed are one question. */
export function questionsOf(row: Pick<ScanRow, "questions_json" | "problem_text">): Question[] {
  if (row.questions_json) {
    try {
      const parsed = QuestionSchema.array().min(1).safeParse(JSON.parse(row.questions_json));
      if (parsed.success) return parsed.data;
    } catch {
      // fall through
    }
  }
  return row.problem_text ? [{ id: "q1", label: "", text: row.problem_text }] : [];
}

function parseStoredOcr(json: string | null, scanId: string): OcrResult | null {
  if (!json) return null;
  try {
    const parsed = OcrResultSchema.safeParse(JSON.parse(json));
    if (parsed.success) return parsed.data;
    console.error(`Stored OCR JSON for scan ${scanId} failed validation`);
  } catch {
    console.error(`Stored OCR JSON for scan ${scanId} is not JSON`);
  }
  return null;
}

/** Converts a row to the public API shape. Never exposes owner_id or storage keys. */
export async function toApiScan(env: Env, origin: string, row: ScanRow): Promise<Scan> {
  const image = await signImageUrl(env, origin, row.id);
  const errorCode = row.ocr_error_code as ErrorCode | null;
  return {
    id: row.id,
    status: row.status,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    confirmedAt: row.confirmed_at,
    image: { url: image.url, urlExpiresAt: image.expiresAt, width: row.image_width, height: row.image_height },
    ocr: parseStoredOcr(row.ocr_json, row.id),
    ocrError: errorCode ? { code: errorCode, retryable: !NON_RETRYABLE_OCR_ERRORS.has(errorCode) } : null,
    ocrAttempts: row.ocr_attempts,
    problem:
      row.status === "confirmed" && row.problem_text !== null
        ? { text: row.problem_text, edited: row.problem_edited === 1, questions: questionsOf(row) }
        : null,
  };
}
