-- A photo can hold several questions; each is confirmed and solved separately.

-- Confirmed questions as JSON: [{ "id": "q1", "label": "Bài 1", "text": "…" }, …].
-- NULL for scans confirmed before splitting existed (treated as one question = problem_text).
ALTER TABLE scans ADD COLUMN questions_json TEXT;

-- Lessons become per question: (scan_id, question_id) instead of scan_id.
CREATE TABLE solutions_v2 (
  id                 TEXT PRIMARY KEY,
  scan_id            TEXT NOT NULL,
  question_id        TEXT NOT NULL DEFAULT 'q1',
  owner_id           TEXT NOT NULL,
  status             TEXT NOT NULL CHECK (status IN ('pending', 'ready', 'failed')),
  problem_hash       TEXT NOT NULL,
  lesson_json        TEXT,
  verification_json  TEXT,
  error_code         TEXT,
  model              TEXT NOT NULL,
  prompt_version     TEXT NOT NULL,
  attempts           INTEGER NOT NULL DEFAULT 0,
  duration_ms        INTEGER,
  started_at         TEXT,
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL,
  UNIQUE (scan_id, question_id)
);

INSERT INTO solutions_v2 (id, scan_id, question_id, owner_id, status, problem_hash, lesson_json, verification_json,
  error_code, model, prompt_version, attempts, duration_ms, started_at, created_at, updated_at)
SELECT id, scan_id, 'q1', owner_id, status, problem_hash, lesson_json, verification_json,
  error_code, model, prompt_version, attempts, duration_ms, started_at, created_at, updated_at
FROM solutions;

DROP TABLE solutions;
ALTER TABLE solutions_v2 RENAME TO solutions;
CREATE INDEX idx_solutions_owner ON solutions (owner_id);
