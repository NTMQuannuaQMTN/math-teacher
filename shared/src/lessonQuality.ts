import type {Solution} from './solution';
import {cleanLanguage} from './language';
import {proofDependencyFeedback} from './proofDependencies';
import {hiddenSearchFeedback} from './hiddenSearch';

/** Changes to proof/presentation safety invalidate session answers as well as
 * server solve caches. Archived reports retain their original version. */
export const CURRENT_LESSON_VERSION='solver-v2.40';
export function lessonDisplayFeedback(solution:Solution):string[] {
 if(!solution.lesson)return ['Missing lesson'];
 return [...cleanLanguage(solution.lesson).feedback,...proofDependencyFeedback(solution.lesson,solution.lesson.analysis.statement),...hiddenSearchFeedback(solution.lesson,solution.lesson.analysis.statement)];
}
export function reusableLesson(solution:Solution):boolean {
 return solution.status==='ready'&&solution.promptVersion===CURRENT_LESSON_VERSION&&lessonDisplayFeedback(solution).length===0;
}
