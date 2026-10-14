import {describe,it,expect} from 'vitest';
import {numericDivisibilityFeedback} from '../../shared/src/numericDivisibility';
import {integerResidueLesson} from '../src/solver/integerResidueLesson';
import {verifyLesson} from '../../shared/src/verify';
import {solveProblem} from '../src/solver/pipeline';
import {VN_GRADE_9} from '../src/solver/curriculum';
import {OcrFailure} from '../src/ocr/provider';
const lesson=()=>integerResidueLesson('Chứng minh với mọi số nguyên $n$, biểu thức $n^3-n$ chia hết cho $6$.')!.lesson;
describe('numeric divisibility assertions include hints, not just final results',()=>{
 it('rejects the actual false20-divisible3 hint despite a correct final proof',()=>{
  const l=lesson();l.hints[0]!.math=String.raw`20 \vdots 3`;
  expect(numericDivisibilityFeedback(l)).toHaveLength(1);const r=verifyLesson(l);expect(r.feedback.some(f=>f.includes('numeric assertion'))).toBe(true);expect(r.verification.status).toBe('unverified');
 });
 it.each([String.raw`20 \not\vdots 3`,String.raw`0 \vdots 3`,String.raw`(-12) \vdots (-3)`])('accepts exact valid relation %s',(formula)=>{
  const l=lesson();l.steps[0]!.math=formula;expect(numericDivisibilityFeedback(l)).toEqual([]);
 });
 it('checks embedded titles, reasons and explanations and undefined zero divisors',()=>{
  const l=lesson();l.steps[0]!.reason=String.raw`Vì $20 \vdots 3$, suy ra kết quả.`;l.hints[1]!.question=String.raw`Dùng $6 \not\vdots 3$ như thế nào?`;l.finalAnswer.math=String.raw`0 \vdots 0`;
  expect(numericDivisibilityFeedback(l)).toHaveLength(3);
 });
 it('does not sample symbolic formulas, alter posed statements or reject explicitly marked questions',()=>{
  const l=lesson();l.analysis.statement=String.raw`Kiểm tra $20 \vdots 3$.`;l.hints[0]!.math=String.raw`n^2 \vdots 3`;l.hints[1]!.math=String.raw`20 \stackrel{?}{\vdots} 3`;
  expect(numericDivisibilityFeedback(l)).toEqual([]);
 });
 it.each([
  String.raw`\begin{gathered}20\vdots3\\12\vdots4\end{gathered}`,
  String.raw`\begin{aligned}20&\vdots3\\12&\vdots4\end{aligned}`,
  String.raw`20\vdots{3},\qquad12\vdots4`,
 ])('rejects false numeric claims inside display structure: %s',formula=>{
  const l=lesson();l.hints[0]!.math=formula;expect(numericDivisibilityFeedback(l)).toHaveLength(1);
 });
 it('does not extract a numeric suffix from a symbolic dividend or a fraction',()=>{
  const l=lesson();l.hints[0]!.math=String.raw`\begin{aligned}n+20&\vdots3\\\frac{20}{3}&\vdots4\end{aligned}`;
  l.hints[1]!.math=String.raw`\begin{gathered}20\not\vdots3\\12\vdots4\end{gathered}`;
  expect(numericDivisibilityFeedback(l)).toEqual([]);
 });
 it.each([1,2])('never retains a false numeric hint when correction cannot complete, attempts%s',async(maxAttempts)=>{
  const l=lesson();l.analysis.statement='Với một số nguyên bất kỳ $n$, hãy chứng minh $n^3-n$ chia hết cho $6$.';l.hints[0]!.math=String.raw`20 \vdots 3`;let calls=0;
  const model={name:'scripted',model:'scripted',complete:async()=>{if(calls++)throw new OcrFailure('timeout','correction timeout',true);return JSON.stringify(l);}};
  await expect(solveProblem(model,VN_GRADE_9,l.analysis.statement,{signal:AbortSignal.timeout(1000),maxAttempts,computeFirst:false,exactAlgebra:false,proofPlanner:false})).rejects.toMatchObject({kind:'incomplete'});
 });
 it.each(['gathered','aligned'])('never retains a wrapped false claim after a correction timeout: %s',async(environment)=>{
  const l=lesson();l.analysis.statement='Với một số nguyên bất kỳ $n$, hãy chứng minh $n^3-n$ chia hết cho $6$.';
  l.hints[0]!.math='\\begin{'+environment+'}20'+(environment==='aligned'?'&':'')+'\\vdots3\\end{'+environment+'}';let calls=0;
  const model={name:'scripted',model:'scripted',complete:async()=>{if(calls++)throw new OcrFailure('timeout','correction timeout',true);return JSON.stringify(l);}};
  await expect(solveProblem(model,VN_GRADE_9,l.analysis.statement,{signal:AbortSignal.timeout(1000),maxAttempts:2,computeFirst:false,exactAlgebra:false,proofPlanner:false})).rejects.toMatchObject({kind:'incomplete'});
 });
});
