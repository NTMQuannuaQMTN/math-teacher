-- Mistake reports on lessons ("Báo lỗi"), for reviewing what the solver got wrong. Each report keeps a
-- snapshot of the reported text and the problem, so it stays meaningful after the lesson is regenerated.
CREATE TABLE lesson_feedback (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  scan_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  solution_id TEXT,
  target_kind TEXT NOT NULL,      -- lesson | step | hint | answer | figure
  target_id TEXT,                 -- step / hint id
  target_text TEXT,               -- snapshot of the reported content
  category TEXT NOT NULL,
  note TEXT,
  problem_text TEXT,
  model TEXT,
  prompt_version TEXT,
  verification_status TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_lesson_feedback_owner ON lesson_feedback (owner_id, created_at);
