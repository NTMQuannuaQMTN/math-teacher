import {CURRENT_LESSON_VERSION} from '../../shared/src/lessonQuality';
import {SolutionSchema} from '../../shared/src/solution';
import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {solveProblem} from '../src/solver/pipeline';
import {VN_GRADE_9} from '../src/solver/curriculum';
import {hiddenSearchFeedback,checkHiddenSearchPlan} from '../../shared/src/hiddenSearch';
import {cleanLanguage} from '../../shared/src/language';
import {vertexAssignmentLesson} from '../src/solver/vertexAssignmentLesson';
import {boardSearchLesson} from '../src/solver/boardSearchGame';
const rows=JSON.parse(readFileSync(new URL('../../tools/specialist-training/game-theory-02/active-question-baseline.json',import.meta.url),'utf8'));
const scan=JSON.parse(readFileSync(new URL('../../tools/specialist-training/game-theory-02/active-confirmed-scan.json',import.meta.url),'utf8'))[0];
const confirmed=JSON.parse(scan.questions_json);
describe('the actual lessons served to the user from solver-v2.9',()=>{
 it('rejects the exact prohibited notation and fixed-color proof from the live database',()=>{
  const q2=JSON.parse(rows.find((r:any)=>r.question_id==='q2').lesson_json),q5=JSON.parse(rows.find((r:any)=>r.question_id==='q5').lesson_json);
  expect(cleanLanguage(q2).feedback.join(' ')).toContain('unordered-set equality');
  expect(hiddenSearchFeedback(q5,q5.analysis.statement).join(' ')).toContain('Missing explicit');
 });
 it('recognizes the actual question header, documented typo and a/b requests',()=>{
  const text=confirmed.find((q:any)=>q.id==='q2').text;
  const built=vertexAssignmentLesson(text);expect(built).not.toBeNull();expect(built!.verify()).toBe(true);
  expect(built!.lesson.analysis.statement).toBe(text);expect(built!.lesson.analysis.interpretationNotes.join(' ')).toContain('đối một');
 });
 it('expands the actual saved Q1 into individual algebra operations without inference',async()=>{
  const text=confirmed.find((q:any)=>q.id==='q1').text;
  const result=await solveProblem({name:'local',model:'unused',complete:async()=>{throw Error('No model calls');}},VN_GRADE_9,text,{signal:AbortSignal.timeout(26000)});
  SolutionSchema.parse({id:'test',scanId:'test',questionId:'q1',status:'ready',createdAt:new Date().toISOString(),lesson:result.lesson,verification:result.verification,error:null,model:result.model,promptVersion:CURRENT_LESSON_VERSION,attempts:0});
  expect(result.model).toBe('certified-multipart');expect(result.lesson.steps).toHaveLength(18);
  expect(result.lesson.analysis.statement).toBe(text);
  const c=result.lesson.steps.filter(s=>s.title.startsWith('c)'));
  expect(c.map(s=>s.title).join(' ')).toContain('Chia đẳng thức liên hợp');
  expect(c.map(s=>s.title).join(' ')).toContain('Cộng nghiệm thứ hai rồi trừ căn');
  expect(c.map(s=>s.math).join(' ')).toContain('x_2^2+1');expect(c.map(s=>s.math).join(' ')).not.toContain('+(1)');
  for(const field of ['reason','explanation','title'] as const){
   const bad=structuredClone(result.lesson);bad.steps[0]![field]='Tích hợp razionale';
   expect(cleanLanguage(bad).feedback.join(' ')).toContain('foreign');
  }
 });
 it('solves the actual stored board wording without inference and checks returned plans',async()=>{
  const text=confirmed.find((q:any)=>q.id==='q5').text;
  const result=await solveProblem({name:'local',model:'unused',complete:async()=>{throw Error('No model calls');}},VN_GRADE_9,text,{signal:AbortSignal.timeout(26000)});
  expect(result.model).toBe('deterministic-board-search');expect(hiddenSearchFeedback(result.lesson,text)).toEqual([]);
  expect(result.lesson.gamePlans?.map(p=>checkHiddenSearchPlan(p).valid)).toEqual([true,true]);
 });
 it('does not accept a mandatory-movement certificate for a changed rule',()=>{
  const text=confirmed.find((q:any)=>q.id==='q5').text,lesson=boardSearchLesson(text)!.lesson;
  expect(hiddenSearchFeedback(lesson,text)).toEqual([]);
  for(const extra of [' An được đứng yên.',' An được đi chéo.',' Bình hỏi trước khi An đi.'])expect(hiddenSearchFeedback(lesson,text+extra).join(' ')).toContain('outside');
 });
 it('checks all opponent positions and rejects an incorrect second sweep in the actual returned plan',()=>{
  const text=JSON.parse(rows.find((r:any)=>r.question_id==='q5').lesson_json).analysis.statement;
  const lesson=boardSearchLesson(text)!.lesson,plan=lesson.gamePlans![1]!;
  expect(checkHiddenSearchPlan(plan).survivors).toEqual([16,15,14,13,12,11,10,9,7,6,5,4,3,2,1,0]);
  const broken={...plan,queries:[...plan.queries.slice(0,8),...plan.queries.slice(0,8)]};expect(checkHiddenSearchPlan(broken).valid).toBe(false);
 });
});
