/**
 * Proof planner → lesson for one dataset problem, through the schema and the lesson verifier (no model call).
 *
 *   npx tsx scripts/proof-lesson.ts <id>
 */
import { readFileSync } from "node:fs";
import { ModelLessonSchema } from "../../shared/src/solution";
import { planProof } from "../../shared/src/proof/planner";
import { explainPlan } from "../../shared/src/proof/explain";
import { verifyLesson } from "../../shared/src/verify";
import { normalizeProblemText } from "../../shared/src/mathText";

const id = process.argv[2];
for (const f of ["chuyen.jsonl", "problems.jsonl"])
  for (const line of readFileSync(new URL(`../../tools/benchmark/dataset/${f}`, import.meta.url), "utf8").trim().split("\n")) {
    const d = JSON.parse(line);
    if (d.id !== id) continue;
    const text = normalizeProblemText(d.problem_text);
    const plan = planProof(text);
    console.log(plan.status, plan.reason);
    if (!plan.goals.some((g) => g.proved)) process.exit(0);
    const lesson = explainPlan(plan, { statement: text });
    const parsed = ModelLessonSchema.safeParse(lesson);
    if (!parsed.success) console.log("SCHEMA", parsed.error.issues.slice(0, 5));
    const checked = verifyLesson(lesson, { problemText: text });
    console.log("verification:", checked.verification.status, checked.feedback.slice(0, 6));
    console.log("strategy:", lesson.strategy);
    for (const s of checked.lesson.steps) console.log(`\n[${s.id}] ${s.title}  (uses ${s.uses.join(",")}; ${s.reason})\n  ${s.explanation}\n  $$${s.math}$$`);
    for (const h of checked.lesson.hints) console.log(`\nhint→${h.stepId}: ${h.question}\n  cue: ${h.cue}\n  ${h.explanation}`);
    process.exit(0);
  }
