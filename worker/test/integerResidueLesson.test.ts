import {describe,it,expect} from 'vitest';
import {integerResidueLesson,integerResidueTask} from '../src/solver/integerResidueLesson';
import {residueCertificate,verifyResidueCertificate,integerPolynomial} from '../../shared/src/integerPolynomial';
import {latexFeedback} from '../src/solver/latexCheck';
import {cleanLanguage} from '../../shared/src/language';
import {verifyLesson} from '../../shared/src/verify';

describe('complete integer residue reasoning',()=>{
 it.each([['n(n+1)(n+2)',6],['n^3-n',6],['n^5-n',30],['n^7-n',42],['(t-1)t(t+1)',3]] as const)('proves polynomial %s for EVERY residue modulo%s',(expression,m)=>{
  const variable=expression.includes('t')?'t':'n',text=`Chứng minh với mọi số nguyên $${variable}$, biểu thức $${expression}$ chia hết cho $${m}$.`;
  const r=integerResidueLesson(text)!;expect(r).not.toBeNull();expect(r.certificate.zeros).toHaveLength(m);expect(verifyResidueCertificate(r.certificate)).toBe(true);
  expect(r.lesson.steps[1]!.explanation).toContain('hệ số nguyên');expect(latexFeedback(r.lesson)).toEqual([]);expect(cleanLanguage(r.lesson).feedback).toEqual([]);
  expect(verifyLesson(r.lesson,{problemText:text}).verification.status).not.toBe('unverified');
 });
 it('gives complete classes including negative solutions; checks are independent of the generator',()=>{
  const r=integerResidueLesson('Tìm tất cả các số nguyên $n$ sao cho $n^2+3n+2$ chia hết cho $6$.')!;
  expect(r.certificate.zeros).toEqual([1,2,4,5]);
  for(let n=-300;n<=300;n++)expect(r.certificate.zeros.includes((n%6+6)%6),String(n)).toBe((n*n+3*n+2)%6===0);
  expect(r.lesson.finalAnswer.text).toContain('q\\in\\mathbb Z');
 });
 it('a false universal claim has a concrete admissible counterexample, never a fake proof',()=>{
  const r=integerResidueLesson('Chứng minh với mọi số nguyên $n$, biểu thức $n^2+n$ chia hết cho $4$.')!;
  expect(r.lesson.finalAnswer.text).toContain('n=1');expect(r.lesson.steps.at(-1)!.math).toContain('2\\not\\vdots 4');
  expect(latexFeedback(r.lesson)).toEqual([]);expect(cleanLanguage(r.lesson).feedback).toEqual([]);
 });
 it('preserves the natural and positive domain after describing residue classes',()=>{
  expect(integerResidueLesson('Tìm tất cả các số nguyên dương $n$ sao cho $n^2+3n+2$ chia hết cho $6$.')!.lesson.finalAnswer.text).toContain('n\\ge1');
  expect(integerResidueLesson('Tìm tất cả các số tự nhiên $n$ sao cho $n^2+3n+2$ chia hết cho $6$.')!.lesson.finalAnswer.text).toContain('n\\ge0');
 });
 it('checks all operations symbolically and rejects rational/nonpolynomial domains',()=>{
  for(const s of ['n/2','n/n','1/(n-1)','n^0','n^13','(n^2+1)^7','n^n','sqrt(n)','n+0.5','n+m'])expect(integerPolynomial(s)).toBeNull();
  const degree12=residueCertificate('n^12',17)!;expect(degree12.coefficients).toHaveLength(13);expect(verifyResidueCertificate(degree12)).toBe(true);expect(degree12.zeros).toEqual([0]);
  const c=residueCertificate('(n+4)^4-n^4',16)!;expect(verifyResidueCertificate(c)).toBe(true);
  expect(verifyResidueCertificate({...c,remainders:c.remainders.map((v,i)=>i===7?1:v)})).toBe(false);
  expect(verifyResidueCertificate({...c,zeros:c.zeros.slice(1)})).toBe(false);
  expect(verifyResidueCertificate({...c,coefficients:[0n]})).toBe(false);
  expect(verifyResidueCertificate({...c,variable:'x'})).toBe(false);
 });
 it('declines extra conditions, subquestions and partially parsed divisors',()=>{
  for(const text of [
   'Tìm tất cả các số nguyên $n$ sao cho $n^2+3n+2$ chia hết cho $6$ và $n>10$.',
   'Chứng minh với mọi số nguyên $n$, biểu thức $n^3-n$ chia hết cho $6$. Tìm thêm $n$.',
   'Tìm tất cả các số nguyên $n$ sao cho $n^2+3n+2$ chia hết cho $6+1$.',
  ])expect(integerResidueTask(text)).toBeNull();
 });
 it('does not reuse the input name as the quotient, remainder or exponent index',()=>{
  for(const variable of ['q','r','j']){
   const r=integerResidueLesson(`Tìm tất cả các số nguyên $${variable}$ sao cho $${variable}^2-1$ chia hết cho $8$.`)!;
   expect(verifyResidueCertificate(r.certificate)).toBe(true);expect(latexFeedback(r.lesson)).toEqual([]);
   if(variable==='q')expect(r.lesson.steps[0]!.math).toContain('q=8k+r');
   if(variable==='r')expect(r.lesson.steps[0]!.math).toContain('r=8q+s');
   if(variable==='j')expect(r.lesson.steps[1]!.math).toContain('j^{i}');
  }
 });
});
