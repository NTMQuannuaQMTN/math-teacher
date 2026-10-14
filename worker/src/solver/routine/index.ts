import type { ModelLesson } from "../../../../shared/src/solution";
import { ALGEBRA_ROUTINES } from "./algebra";
import { COMBINATORICS_ROUTINES } from "./combinatorics";
import { GEOMETRY_ROUTINES } from "./geometry";
import { NUMBER_THEORY_ROUTINES, type RoutineResult } from "./numberTheory";
import { flatten } from "./text";

export type { RoutineResult };

/** Words that change the question when ignored; each one in the statement must reappear in the lesson. */
const QUALIFIERS = ["lẻ", "chẵn", "ít nhất", "nhiều nhất", "không", "phân biệt", "khác nhau", "dương", "âm", "nguyên tố", "chính phương", "liên tiếp"];

/**
 * A certificate re-checks the computation, not the reading of the statement: an engine that skipped a condition
 * ("lẻ", "n < 10", a second number) would certify the wrong task. Every number and qualifier of the statement must
 * therefore be used somewhere in the lesson.
 */
export function unconsumed(text: string, lesson: ModelLesson): string[] {
  const t = flatten(text).toLocaleLowerCase("vi").replace(/lớp \d+|thcs|thpt/g, " ");
  const body = flatten([
    lesson.analysis.givens.join(" "), lesson.analysis.unknowns.join(" "), lesson.analysis.constraints.join(" "), lesson.strategy,
    ...lesson.steps.flatMap((s) => [s.title, s.explanation, s.math ?? ""]), lesson.finalAnswer.text,
  ].join(" ")).toLocaleLowerCase("vi");
  const missing: string[] = [];
  for (const n of new Set(t.match(/\d+/g) ?? [])) if (!new RegExp(`(?<!\\d)${n}(?!\\d)`).test(body)) missing.push(n);
  for (const w of QUALIFIERS) {
    const re = new RegExp(`(?<!\\p{L})${w}(?!\\p{L})`, "u");
    if (re.test(t) && !re.test(body)) missing.push(w);
  }
  return missing;
}

/**
 * Routine Grade 9 tasks solved and explained deterministically: each recogniser reads the mathematical features of
 * the task (not one sentence pattern), declines anything it cannot consume completely (extra parts, extra conditions),
 * and carries an independent certificate (exhaustive search, exact identity, coordinates). A lesson is returned only
 * when that certificate re-checks and every number/qualifier of the statement is used; everything else goes on to the
 * model.
 */
export function routineLesson(text: string): RoutineResult | null {
  for (const build of [...ALGEBRA_ROUTINES, ...NUMBER_THEORY_ROUTINES, ...COMBINATORICS_ROUTINES, ...GEOMETRY_ROUTINES]) {
    let r: RoutineResult | null = null;
    try {
      r = build(text);
    } catch {
      r = null;
    }
    if (r && r.verify() && unconsumed(text, r.lesson).length === 0) return r;
  }
  return null;
}
