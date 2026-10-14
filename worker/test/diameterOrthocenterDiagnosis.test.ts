import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {diameterOrthocenterDiagnosis} from '../src/solver/diameterOrthocenterDiagnosis';
import {resolveFigure} from '../../shared/src/geometry';
import {auditLesson} from '../scripts/lesson-audit';
import {solveProblem} from '../src/solver/pipeline';
import {VN_GRADE_9} from '../src/solver/curriculum';
import {proofDependencyFeedback} from '../../shared/src/proofDependencies';
const text:string=JSON.parse(readFileSync(new URL('../../tools/specialist-training/iteration-03/cases.json',import.meta.url),'utf8')).find((c:any)=>c.id==='geo3-ptnk-2024-parallelogram').text;
describe('a purported parallelogram needs four distinct vertices',()=>{
 it('constructs the admissible equilateral counterexample and states exactly what is unresolved',()=>{
  const l=diameterOrthocenterDiagnosis(text)!;expect(l).not.toBeNull();
  expect(l.analysis.status).toBe('solvable'); // The counterexample itself is a complete renderable explanation.
  expect(l.finalAnswer.text).toContain('chưa phải chứng minh đẳng thức trong mọi trường hợp');
  expect(auditLesson(l)).toMatchObject({schemaValid:true,latexErrors:[],languageErrors:[]});
  expect(proofDependencyFeedback(l,text)).toEqual([]);
  const p=resolveFigure(l.figure!).points;
  const dist=(a:string,b:string)=>Math.hypot(p[a]!.x-p[b]!.x,p[a]!.y-p[b]!.y);
  expect(dist('A','B')).toBeCloseTo(dist('A','D'));
  expect(dist('A','B')).toBeCloseTo(dist('B','D'));
  expect(dist('E','C')).toBeCloseTo(0);expect(dist('K','H')).toBeCloseTo(0);
  expect(dist('H','O')).toBeCloseTo(0);
  expect(dist('I','B')**2).toBeCloseTo(3);
  expect(dist('I','A')*dist('I','K')).toBeCloseTo(3);
 });
 it('preserves the counterexample under a full renaming',()=>{
  const ids={A:'P',B:'Q',C:'R',D:'S',O:'T',I:'U',H:'V',E:'W',K:'X'};
  const renamed=text.replace(/\b[A-Z]{1,4}\b/g,token=>[...token].map(c=>ids[c as keyof typeof ids]??c).join(''));
  expect(diameterOrthocenterDiagnosis(renamed)?.steps[2]!.explanation).toContain('$W=R$');
 });
 it('declines a changed or extended whole question',()=>{
  expect(diameterOrthocenterDiagnosis(text.replace('là tam giác nhọn','là tam giác nhọn với AB khác AD'))).toBeNull();
  expect(diameterOrthocenterDiagnosis(text+' Tính diện tích tam giác ABD.')).toBeNull();
 });
 it('gives an honest renderable diagnosis without spending on inference',async()=>{
  const model={name:'local',model:'unavailable',complete:async()=>{throw Error('must not call');}};
  const r=await solveProblem(model,VN_GRADE_9,text,{signal:AbortSignal.timeout(1000)});
  expect(r.model).toBe('geometry-degeneracy-diagnosis');expect(r.verification.status).toBe('partial');expect(r.attempts).toBe(0);
 });
});
