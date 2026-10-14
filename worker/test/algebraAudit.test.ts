import { describe, expect, it } from 'vitest';
import { factorizationFeedback } from '../../shared/src/algebraAudit';
import { verifyLesson } from '../../shared/src/verify';
import { mockAlgebraLesson } from '../src/solver/mock';

describe('factorisation signs in hints',()=>{
 it('does not infer a quadratic degree from a few samples of a higher-degree polynomial',()=>{
  const l=mockAlgebraLesson();l.analysis.statement='Giải phương trình $x^2-5x+6+(x+3)(x+2)(x+1)x(x-1)(x-2)(x-3)=0$.';
  l.hints[0]!.question='Viết dưới dạng $(x+a)(x+b)$.';l.hints[0]!.explanation='Ta cần $a+b=5$ và $ab=6$.';
  expect(factorizationFeedback(l)).toEqual([]);
 });
 it.each([[7,12],[9,20],[-5,6]])('checks coefficient matching for x²-%sx+%s', (sum,product)=>{
  const l=mockAlgebraLesson();l.analysis.statement=`Giải phương trình $x^{2}-${sum}x+${product}=0$.`;
  l.hints[0]!.question='Viết đa thức dưới dạng $(x+a)(x+b)$.';
  l.hints[0]!.explanation=`Ta cần $a+b=${sum}$ và $ab=${product}$.`;
  expect(factorizationFeedback(l).join(' ')).toContain(`requires sum ${-sum}`);
  l.hints[0]!.explanation=`Ta cần $a+b=${-sum}$ và $ab=${product}$.`;
  expect(factorizationFeedback(l)).toEqual([]);
 });
 it('accepts consistent subtraction notation',()=>{
  const l=mockAlgebraLesson();l.hints[0]!.question='Viết dưới dạng $(x-a)(x-b)$.';
  l.hints[0]!.explanation='Ta cần $a+b=5$ và $ab=6$.';
  expect(factorizationFeedback(l)).toEqual([]);
 });
 it('does not certify wrong hint reasoning when the final roots substitute correctly',()=>{
  const l=mockAlgebraLesson();l.hints[0]!.question='Viết dưới dạng $(x+a)(x+b)$.';
  l.hints[0]!.explanation='Ta cần $a+b=5$ và $ab=6$.';
  expect(verifyLesson(l).verification.status).toBe('unverified');
 });
});

it('numeric equality examples do not certify a mixed proof-and-equality question',()=>{
 const l=mockAlgebraLesson();l.analysis.statement='Cho $a,b>0$, $a+b=6$. Chứng minh $ab\\le9$ và tìm trường hợp dấu bằng.';
 l.answerChecks=[{kind:'substitute',statements:['a+b=6'],assignments:[[{variable:'a',value:'3'},{variable:'b',value:'3'}]],expected:null}];
 expect(verifyLesson(l).verification.status).not.toBe('verified');
});
