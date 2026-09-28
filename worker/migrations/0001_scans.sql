-- Milestone 1 schema: scanned problems only (image -> OCR -> confirmed text).
-- Solving, steps, and learning data belong to later milestones and later tables.

CREATE TABLE scans (
  id                  TEXT PRIMARY KEY,
  -- SHA-256 of the device token. Every query filters on this column.
  owner_id            TEXT NOT NULL,
  -- Client-generated key that makes POST /v1/scans idempotent per owner.
  idempotency_key     TEXT,
  status              TEXT NOT NULL CHECK (status IN ('draft', 'confirmed')),
  source              TEXT NOT NULL CHECK (source IN ('camera', 'library')),

  image_key           TEXT NOT NULL,
  image_content_type  TEXT NOT NULL,
  image_bytes         INTEGER NOT NULL,
  image_width         INTEGER NOT NULL,
  image_height        INTEGER NOT NULL,

  -- Latest OCR result as validated JSON (shape: OcrResult in shared/src/contract.ts).
  -- Stored as JSON so the OCR model can evolve without migrations.
  ocr_json            TEXT,
  ocr_error_code      TEXT,
  ocr_attempts        INTEGER NOT NULL DEFAULT 0,
  -- Set while an OCR call is running; used to reject concurrent duplicates.
  ocr_started_at      TEXT,

  -- The student-confirmed problem text (same format as OcrResult.formattedText).
  problem_text        TEXT,
  problem_edited      INTEGER,

  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL,
  confirmed_at        TEXT
);

CREATE UNIQUE INDEX idx_scans_owner_idempotency
  ON scans (owner_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX idx_scans_owner_status_confirmed ON scans (owner_id, status, confirmed_at DESC, id DESC);
CREATE INDEX idx_scans_owner_status_created ON scans (owner_id, status, created_at DESC, id DESC);
CREATE INDEX idx_scans_status_created ON scans (status, created_at);

-- Fixed-window counters for abuse protection.
CREATE TABLE rate_limits (
  bucket        TEXT NOT NULL,
  window_start  INTEGER NOT NULL,
  count         INTEGER NOT NULL,
  PRIMARY KEY (bucket, window_start)
);
