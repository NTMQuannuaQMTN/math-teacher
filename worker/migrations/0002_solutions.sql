-- Milestone 2: one generated lesson (hints, steps, figure) per scanned problem.
CREATE TABLE solutions (
  id                 TEXT PRIMARY KEY,
  scan_id            TEXT NOT NULL UNIQUE,
  -- Same owner as the scan; every query filters on it.
  owner_id           TEXT NOT NULL,
  status             TEXT NOT NULL CHECK (status IN ('pending', 'ready', 'failed')),
  -- SHA-256 of the problem text the lesson was generated from: an edited problem gets a new lesson.
  problem_hash       TEXT NOT NULL,
  lesson_json        TEXT,
  verification_json  TEXT,
  error_code         TEXT,
  model              TEXT NOT NULL,
  prompt_version     TEXT NOT NULL,
  attempts           INTEGER NOT NULL DEFAULT 0,
  duration_ms        INTEGER,
  -- Set while generating; a stale value means the generating request died.
  started_at         TEXT,
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
);

CREATE INDEX idx_solutions_owner ON solutions (owner_id);
