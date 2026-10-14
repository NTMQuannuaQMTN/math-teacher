import {describe,it,expect} from 'vitest';
import {conclusionConsistencyFeedback} from '../../shared/src/conclusionConsistency';
import {mockAlgebraLesson} from '../src/solver/mock';
import {solveProblem} from '../src/solver/pipeline';
import {VN_GRADE_9} from '../src/solver/curriculum';
import {OcrFailure} from '../src/ocr/provider';
import type {JsonModel} from '../src/solver/llm';
const text='Rút gọn $A=\\sqrt{7+4\\sqrt3}-\\sqrt{7-4\\sqrt3}$.';
function lesson(){
 const l=mockAlgebraLesson();l.analysis.statement=text;l.analysis.topic='algebra';l.figure=null;l.hints=[];l.answerChecks=[];
 l.steps=[{...l.steps[0]!,id:'s1',uses:[],title:'Rút gọn hai căn',explanation:'Vì $2>\\sqrt3$, dùng hằng đẳng thức và dấu của căn thức.',math:'A=(2+\\sqrt3)-(2-\\sqrt3)=2\\sqrt3',reason:'Căn bậc hai của một bình phương',geometryActions:[]}];l.finalAnswer={text:'Giá trị rút gọn là $4$.',math:'4'};return l;
}
describe('actual scalar conclusion contradiction',()=>{
 it('rejects the reported final4 versus worked2√3, independently of model topic metadata',()=>{
  const l=lesson();expect(conclusionConsistencyFeedback(l,text)).toHaveLength(1);
  l.analysis.topic='geometry';expect(conclusionConsistencyFeedback(l,text)).toHaveLength(1);
 });
 it('accepts equivalent numerical expressions without pretending to prove correctness',()=>{
  const l=lesson();l.finalAnswer={text:'Giá trị là $2\\sqrt3$.',math:'\\sqrt{12}'};expect(conclusionConsistencyFeedback(l,text)).toEqual([]);
 });
 it('does not compare unrelated named quantities or documented rounding',()=>{
  const l=lesson();l.steps[0]!.math='B=2\\sqrt3';expect(conclusionConsistencyFeedback(l,text)).toEqual([]);
  l.steps[0]!.math='A=2\\sqrt3';expect(conclusionConsistencyFeedback(l,text+' Làm tròn đến hàng đơn vị.')).toEqual([]);
  expect(conclusionConsistencyFeedback(l,'Rút gọn $A=1$ và $B=2$.')).toEqual([]);
 });
 it('returns a controlled failure when a contradictory conclusion survives the correction budget',async()=>{
  const model:JsonModel={name:'scripted',model:'scripted',complete:async()=>JSON.stringify(lesson())};
  await expect(solveProblem(model,VN_GRADE_9,text,{signal:AbortSignal.timeout(26000),maxAttempts:1,computeFirst:false,proofPlanner:false,exactAlgebra:false})).rejects.toMatchObject({kind:'incomplete'});
 });
 it('does not retain the contradictory first answer when a correction provider fails',async()=>{
  let calls=0;const model:JsonModel={name:'scripted',model:'scripted',complete:async()=>{if(calls++)throw new OcrFailure('timeout','correction timed out',true);return JSON.stringify(lesson());}};
  await expect(solveProblem(model,VN_GRADE_9,text,{signal:AbortSignal.timeout(26000),maxAttempts:2,computeFirst:false,proofPlanner:false,exactAlgebra:false})).rejects.toMatchObject({kind:'incomplete'});
 });
});
