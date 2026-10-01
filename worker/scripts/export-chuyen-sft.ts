/**
 * Renders the chuyên teaching records (data/training/teaching.jsonl) into supervised fine-tuning examples in
 * the app's own lesson format, and validates every one with the production schema and structure checks.
 *
 *   npx tsx scripts/export-chuyen-sft.ts      → tools/benchmark/sft/chuyen_train.jsonl (chat format)
 *
 * Each example: system = the serving system prompt, user = the serving user message, assistant = the lesson
 * JSON. Only training-split, computer-verified problems are exported (teaching.jsonl already guarantees it).
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { ModelLessonSchema, type ModelLesson } from "../../shared/src/solution";
import { checkLessonStructure } from "../../shared/src/verify";
import { VN_GRADE_9 } from "../src/solver/curriculum";
import { buildSystemPrompt, buildUserMessage } from "../src/solver/prompts";
import { problemTier } from "../src/solver/routing";

interface Teaching {
  problem_id: string;
  question: string;
  problem_type: string;
  required_knowledge: string[];
  key_idea: string;
  hints: string[];
  solution: string[];
  final_answer: string;
  takeaway: string;
}

const ROOT = new URL("../../", import.meta.url).pathname;
const rows = readFileSync(`${ROOT}data/training/teaching.jsonl`, "utf8").trim().split("\n").map((l) => JSON.parse(l) as Teaching);
const topicOf = new Map(readFileSync(`${ROOT}data/processed/problems.jsonl`, "utf8").trim().split("\n").map((l) => JSON.parse(l)).map((p) => [p.problem_id, p.topic as string]));
const TOPIC: Record<string, ModelLesson["analysis"]["topic"]> = { algebra: "algebra", number_theory: "other", combinatorics: "other", geometry: "geometry" };

const out: string[] = [];
const problems: string[] = [];
for (const t of rows) {
  const steps: ModelLesson["steps"] = t.solution.map((line, i) => ({
    id: `s${i + 1}`,
    title: line.replace(/\$[^$]*\$/g, "…").slice(0, 60).replace(/[.:;,]\s*$/, ""),
    explanation: line,
    math: null,
    reason: null,
    geometryActions: [],
  }));
  const hints: ModelLesson["hints"] = t.hints.map((q, i) => ({
    id: `h${i + 1}`,
    level: Math.min(4, i + 1),
    question: q,
    cue: null,
    explanation: i === 0 ? t.key_idea : steps[Math.min(i, steps.length - 1)]!.explanation,
    math: null,
    stepId: steps[Math.min(i, steps.length - 1)]!.id,
    focus: [],
  }));
  const lesson: ModelLesson = {
    analysis: {
      statement: "",
      language: "vi",
      topic: TOPIC[topicOf.get(t.problem_id) ?? ""] ?? "other",
      subtopic: t.problem_type,
      gradeLevel: 9,
      withinCurriculum: true,
      concepts: t.required_knowledge.slice(0, 8),
      givens: [],
      unknowns: [],
      constraints: [],
      status: "solvable",
      statusReason: null,
      interpretationNotes: [],
    },
    strategy: t.key_idea,
    hints,
    steps,
    finalAnswer: { text: `${t.final_answer}. ${t.takeaway}`, math: null },
    figure: null,
    answerChecks: [],
  };
  lesson.analysis.statement = t.question;
  const parsed = ModelLessonSchema.safeParse(lesson);
  if (!parsed.success) {
    problems.push(`${t.problem_id}: schema: ${parsed.error.issues.slice(0, 2).map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
    continue;
  }
  const { report } = checkLessonStructure(parsed.data);
  if (report.errors.length) problems.push(`${t.problem_id}: structure: ${report.errors.join("; ")}`);
  const target = { ...parsed.data, analysis: { ...parsed.data.analysis, statement: "" } }; // the serving prompt asks for "" when the text is correct
  out.push(
    JSON.stringify({
      id: t.problem_id,
      messages: [
        { role: "system", content: buildSystemPrompt(VN_GRADE_9, { withFigure: false }) },
        { role: "user", content: buildUserMessage(t.question, problemTier(t.question)) },
        { role: "assistant", content: JSON.stringify(target) },
      ],
    }),
  );
}
mkdirSync(`${ROOT}tools/benchmark/sft`, { recursive: true });
writeFileSync(`${ROOT}tools/benchmark/sft/chuyen_train.jsonl`, out.join("\n") + "\n");
console.log(`${out.length}/${rows.length} examples valid → tools/benchmark/sft/chuyen_train.jsonl`);
for (const p of problems) console.log(`  INVALID ${p}`);
process.exit(problems.length ? 1 : 0);
