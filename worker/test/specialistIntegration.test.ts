import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {tidy,solveProblem as solveWithModel} from '../src/solver/pipeline';
import {latexFeedback,plainUnrenderable} from '../src/solver/latexCheck';
import {mockAlgebraLesson} from '../src/solver/mock';
import {VN_GRADE_9} from '../src/solver/curriculum';
import {problemDomains} from '../../shared/src/knowledgeBase';
import {verifyLesson} from '../../shared/src/verify';
import type {JsonModel} from '../src/solver/llm';

// These tests exercise inference, retries and hygiene; exact algebra is tested separately.
const solveProblem:typeof solveWithModel=(model,curriculum,text,options)=>solveWithModel(model,curriculum,text,{...options,exactAlgebra:false});
describe('specialist integration regressions',()=>{
 it('does not certify invented subject metadata or ungrounded OCR corrections',()=>{
  const l=mockAlgebraLesson();l.analysis.topic='combinatorics';l.analysis.interpretationNotes=['Sửa "cocom" thành "co".'];
  const r=verifyLesson(l,{problemText:l.analysis.statement});
  expect(r.verification.status).toBe('unverified');
  expect(r.feedback.join(' ')).toContain('absent from the confirmed question');
 });
 it('detects and preserves meaning when Vietnamese prose was swallowed by delimiters',()=>{
  const l=mockAlgebraLesson();l.steps[0]!.explanation='Kết hợp với $a+b=6 được a=b=3$.';
  l.analysis.constraints=['Điều kiện $x>0'];
  expect(latexFeedback(l).join(' ')).toContain('broken mathematical delimiters');
  const repaired=plainUnrenderable(l);
  expect(latexFeedback(repaired)).toEqual([]);
  expect(repaired.steps[0]!.explanation).toContain('được a=b=3');
  expect(repaired.analysis.constraints[0]).toContain('x>0');
 });
 it('repairs dollar-wrapped math fields without downgrading them to plain text',()=>{
  const l=mockAlgebraLesson();l.hints[0]!.math='$a+b=-5$, $ab=6$';l.steps[0]!.math='$$x^2-5x+6=(x-2)(x-3)$$';
  const result=tidy(l);expect(latexFeedback(result)).toEqual([]);expect(result.steps[0]!.math).not.toContain('$');
  expect(result.hints[0]!.math).toContain('a+b=-5');
 });
 it('returns a controlled failure when untranslated language survives generation',async()=>{
  const l=mockAlgebraLesson();l.steps[0]!.explanation='Hằng đẳng thức külön hai bình phương';
  const model:JsonModel={name:'scripted',model:'scripted',complete:async()=>JSON.stringify(l)};
  await expect(solveProblem(model,VN_GRADE_9,l.analysis.statement,{signal:AbortSignal.timeout(26000),maxAttempts:1})).rejects.toMatchObject({kind:'malformed_output'});
 });
 it('does not allow a false English language label to bypass Vietnamese hygiene',async()=>{
  const l=mockAlgebraLesson();l.analysis.language='en';l.hints[0]!.explanation='Hai người luôn อยู่ bên nhau.';
  const model:JsonModel={name:'scripted',model:'scripted',complete:async()=>JSON.stringify(l)};
  await expect(solveProblem(model,VN_GRADE_9,'Giải phương trình $x^2=4$.',{signal:AbortSignal.timeout(26000),maxAttempts:1})).rejects.toMatchObject({kind:'malformed_output'});
 });
 it('routes all development questions through their declared specialist',()=>{
  const cases=JSON.parse(readFileSync(new URL('../../tools/specialist-training/cases.json',import.meta.url),'utf8'));
  for(const c of cases.filter((c:{split:string})=>c.split!=='held_out'))expect(problemDomains(c.text),c.id).toContain(c.domain);
 });
});
