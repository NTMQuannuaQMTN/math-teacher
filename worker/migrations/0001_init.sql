-- Core schema for the Math Teacher MVP.
-- Kept intentionally flat: one row per question, one optional geometry spec,
-- one solution. No user accounts yet (see docs/DECISIONS.md).

CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('processing', 'complete', 'failed')),
  image_r2_key TEXT NOT NULL,
  image_content_type TEXT NOT NULL,
  extracted_text TEXT,
  subject TEXT,
  topic TEXT,
  is_geometry INTEGER,
  difficulty TEXT,
  concepts_json TEXT,
  diagram_required INTEGER,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE geometry_specs (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  spec_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE solutions (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  steps_json TEXT NOT NULL,
  final_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE request_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_geometry_specs_question_id ON geometry_specs(question_id);
CREATE INDEX idx_solutions_question_id ON solutions(question_id);
CREATE INDEX idx_request_log_ip_created_at ON request_log(ip, created_at);
