/**
 * Builds a results document (experiments/*.json) from measured benchmark runs in tools/benchmark/results.
 * Nothing is estimated here: fields that a run did not measure are null.
 *
 *   npx tsx scripts/build-results.ts <out.json> <label=EXP-file[,EXP-file…]> [label=…]
 *   e.g. npx tsx scripts/build-results.ts ../experiments/baseline_results.json \
 *          hosted-nemotron-low=EXP-010_or-nemotron-3-super_validation local-qwen3.5-9b=EXP-004b_qwen3.5-9b_validation
 */
import { readFileSync, writeFileSync } from "node:fs";
import { gradeLevelReport } from "../../shared/src/gradeLevel";
import type { ModelLesson } from "../../shared/src/solution";
import { problemTier } from "../src/solver/routing";

const ROOT = new URL("../../tools/benchmark/", import.meta.url).pathname;
const [out, ...specs] = process.argv.slice(2);
if (!out || specs.length === 0) {
  console.error("usage: build-results.ts <out.json> <label=EXP-file[,EXP-file…]> …");
  process.exit(2);
}

interface Item {
  id: string;
  topic: string;
  difficulty: string;
  format: string;
  problem_text: string;
  ground_truth_answer: string | null;
  ground_truth_solution: string | null;
}
interface Row {
  id: string;
  grade: "PASS" | "PARTIAL" | "FAIL" | "CRITICAL";
  answerCorrect: boolean | null;
  status: string | null;
  attempts: number;
  outputTokens: number;
  modelSeconds: number;
  answer: string;
  lesson: ModelLesson | null;
  log?: string[];
  slept?: boolean;
  error?: string;
}
interface Run {
  summary: { exp: string; system: string; split: string; promptVersion: string; cache?: { misses: number; hits: number } | null; createdAt: string };
  rows: Row[];
}

const items = new Map<string, Item>(
  readFileSync(`${ROOT}dataset/problems.jsonl`, "utf8")
    .trim()
    .split("\n")
    .map((l) => JSON.parse(l) as Item)
    .map((i) => [i.id, i]),
);

function failureCategory(r: Row): string {
  if (r.error) return /truncated/.test(r.error) ? "truncated_output" : /timed out|timeout/.test(r.error) ? "timeout" : /429|quota/.test(r.error) ? "rate_limited" : "error";
  if (r.answerCorrect === false) return "wrong_answer";
  if (r.grade === "CRITICAL") return "wrong_but_verified";
  if (r.status === "unverified") return "unverified";
  if (r.status === "not_checkable") return "not_checkable";
  if (r.status === "partial") return "partially_verified";
  return "none";
}

const quantile = (xs: number[], q: number) => {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos);
  return Math.round((s[lo]! + (s[Math.ceil(pos)]! - s[lo]!) * (pos - lo)) * 10) / 10;
};
const mean = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);

const systems = specs.map((spec) => {
  const [label, files] = spec.split("=");
  const runs = files!.split(",").map((f) => JSON.parse(readFileSync(`${ROOT}results/${f}.json`, "utf8")) as Run);
  const rows = runs.flatMap((run) => run.rows.map((r) => ({ run, r })));
  const problems = rows.map(({ run, r }) => {
    const item = items.get(r.id);
    const gl = r.lesson ? gradeLevelReport(r.lesson) : null;
    const timed = !r.error && !r.slept && r.modelSeconds > 0;
    return {
      id: r.id,
      run: run.summary.exp,
      topic: item?.topic ?? null,
      difficulty: item ? Number(item.difficulty) : null,
      tier: item ? problemTier(item.problem_text) : null,
      expectedApproach: item?.ground_truth_solution ?? null,
      referenceAnswer: item?.ground_truth_answer ?? null,
      solverAnswer: r.answer || null,
      answerCorrect: r.answerCorrect,
      grade: r.grade,
      verification: r.status,
      gradeLevel: gl ? { suitable: gl.rubric.curriculumFit && gl.rubric.familiarMethods, ...gl.rubric, forbidden: gl.forbidden, advisory: gl.advisory } : null,
      latencySeconds: timed ? r.modelSeconds : null,
      attempts: r.attempts,
      outputTokens: r.outputTokens || null,
      failureCategory: failureCategory(r),
      ...(r.log?.length ? { log: r.log } : {}),
    };
  });
  const lat = problems.map((p) => p.latencySeconds).filter((x): x is number => x !== null);
  const gradable = problems.filter((p) => p.answerCorrect !== null);
  const withLesson = problems.filter((p) => p.gradeLevel);
  const cache = runs.map((r) => r.summary.cache).filter(Boolean) as { misses: number; hits: number }[];
  return {
    label,
    runs: runs.map((r) => ({ exp: r.summary.exp, system: r.summary.system, split: r.summary.split, promptVersion: r.summary.promptVersion, createdAt: r.summary.createdAt })),
    summary: {
      n: problems.length,
      pass: problems.filter((p) => p.grade === "PASS").length,
      partial: problems.filter((p) => p.grade === "PARTIAL").length,
      fail: problems.filter((p) => p.grade === "FAIL").length,
      critical: problems.filter((p) => p.grade === "CRITICAL").length,
      finalAnswerAccuracy: gradable.length ? `${gradable.filter((p) => p.answerCorrect).length}/${gradable.length}` : null,
      completeSolutionRate: `${problems.filter((p) => p.grade === "PASS").length}/${problems.length}`,
      gradeLevelSuitable: `${withLesson.filter((p) => p.gradeLevel!.suitable).length}/${withLesson.length}`,
      rubric: Object.fromEntries(
        (["curriculumFit", "familiarMethods", "concise", "noHandWaving", "hintsProgressive"] as const).map((k) => [k, `${withLesson.filter((p) => p.gradeLevel![k]).length}/${withLesson.length}`]),
      ),
      latencySeconds: { timedN: lat.length, median: quantile(lat, 0.5), p90: quantile(lat, 0.9), mean: mean(lat) },
      timeToFirstTokenSeconds: null,
      meanAttempts: mean(problems.map((p) => p.attempts)),
      /** Model requests including in-call retries, from the response cache (null when not recorded). */
      modelRequests: cache.length ? cache.reduce((s, c) => s + c.misses + c.hits, 0) : null,
      meanOutputTokens: mean(problems.map((p) => p.outputTokens).filter((x): x is number => x !== null)),
      failures: Object.fromEntries([...new Set(problems.map((p) => p.failureCategory))].map((c) => [c, problems.filter((p) => p.failureCategory === c).length])),
    },
    problems,
  };
});

writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), dataset: "tools/benchmark/dataset v1", note: "Measured runs only; null = not measured. See docs/SOLVER_EVALUATION.md.", systems }, null, 1));
for (const s of systems) console.log(s.label, JSON.stringify(s.summary));
