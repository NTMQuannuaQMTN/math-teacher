import type { Solution } from "@shared/solution";
import {reusableLesson} from '@shared/lessonQuality';

/** Lessons are per question of a scan. */
export const lessonKey = (scanId: string, questionId = "q1") => `${scanId}:${questionId}`;

/**
 * Per-question lesson state for this app session: the solution (so returning
 * to a lesson is instant and never re-solves) and how far the student got.
 */
export interface LessonProgress {
  /** Hints whose explanation has been revealed. */
  revealed: string[];
  /** Number of hint cards shown (hints are unlocked one at a time). */
  unlocked: number;
  showSolution: boolean;
}

const solutions = new Map<string, Solution>();
const safety=new WeakMap<Solution,boolean>();
const progress = new Map<string, LessonProgress>();

export const lessonStore = {
  getSolution: (key: string) => {
    const solution=solutions.get(key);
    if(!solution)return undefined;
    if(!safety.has(solution))safety.set(solution,reusableLesson(solution));
    if(!safety.get(solution)){solutions.delete(key);progress.delete(key);return undefined;}
    return solution;
  },
  putSolution: (key: string, solution: Solution) => void solutions.set(key, solution),
  getProgress: (key: string): LessonProgress => progress.get(key) ?? { revealed: [], unlocked: 1, showSolution: false },
  putProgress: (key: string, value: LessonProgress) => void progress.set(key, value),
  /** Forget one question's lesson, or every question of a scan (e.g. after the problem was edited). */
  reset: (key: string) => {
    for (const map of [solutions, progress] as Map<string, unknown>[]) {
      for (const k of [...map.keys()]) if (k === key || k.startsWith(`${key}:`)) map.delete(k);
    }
  },
};
