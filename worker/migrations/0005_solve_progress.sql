-- Live progress of a pending solve (stage, steps written so far, a draft of the plan), so the app can
-- show something useful during a 20 s – 3 min generation. Cleared when the solve finishes.
ALTER TABLE solutions ADD COLUMN progress_json TEXT;
