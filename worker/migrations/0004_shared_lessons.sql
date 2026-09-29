-- Shared lesson library: a verified lesson for a problem is reused for anyone who asks to solve
-- the same problem, instead of paying for a new AI solve.
-- problem_key = SHA-256 of the normalized problem text (see src/solver/problemKey.ts).
ALTER TABLE solutions ADD COLUMN problem_key TEXT;
CREATE INDEX idx_solutions_problem_key ON solutions (problem_key, prompt_version, status);
