import {describe,it,expect} from 'vitest';
import {quadraticNormLesson,verifyNormCertificate} from '../src/solver/quadraticNormLesson';
import {latexFeedback} from '../src/solver/latexCheck';
import {cleanLanguage} from '../../shared/src/language';
import {verifyLesson} from '../../shared/src/verify';
const prefix='Cho các số nguyên dương $m,n$ thỏa mãn: $m^2+m+n^2$ chia hết cho tích $mn$ (1). ';
const parts=[
 prefix+'Chứng minh không tồn tại $m,n$ thỏa mãn (1) khi $n=3$.',
 prefix+'Tìm $m,n$ thỏa mãn (1) biết $m$ chia hết cho $n$.',
 prefix+'Ký hiệu $d$ là ước chung lớn nhất của $m$ và $n$. Chứng minh nếu $m,n$ thỏa mãn (1) thì $m=d^2$.',
];
describe('nonlinear divisibility proofs retain positive integer hypotheses',()=>{
 it.each(parts)('gives a complete Grade9 proof for %s',text=>{
  const r=quadraticNormLesson(text)!;expect(r).not.toBeNull();expect(verifyNormCertificate(r.certificate)).toBe(true);expect(latexFeedback(r.lesson)).toEqual([]);expect(cleanLanguage(r.lesson).feedback).toEqual([]);expect(verifyLesson(r.lesson,{problemText:text}).verification.status).not.toBe('unverified');
 });
 it('fixed n yields ALL possible positive divisors of n² before rejecting every candidate',()=>{
  const c=quadraticNormLesson(parts[0]!)!.certificate;expect(c.divisors).toEqual([1,3,9]);expect(c.solutions).toEqual([]);expect(verifyNormCertificate({...c,divisors:[1,9]})).toBe(false);
 });
 it('a changed fixed value that has a witness refutes false nonexistence with the actual pair',()=>{
  const r=quadraticNormLesson(parts[0]!.replace('n=3','n=2'))!;expect(r.lesson.finalAnswer.text).toContain('(1,2)');expect(r.lesson.finalAnswer.text).toContain('là sai');expect(verifyNormCertificate(r.certificate)).toBe(true);
 });
 it('multiple condition has exactly two solutions; independent bound through necessary reciprocal divides',()=>{
  const r=quadraticNormLesson(parts[1]!)!;expect(r.certificate.solutions).toEqual([[1,1],[4,2]]);expect(r.lesson.steps.some(s=>s.explanation.includes('Hai số nguyên dương chia hết cho nhau'))).toBe(true);
  for(let n=1;n<=200;n++)for(let m=1;m<=200;m++)if(m%n===0&&(m*m+m+n*n)%(m*n)===0)expect([[1,1],[4,2]]).toContainEqual([m,n]);
 });
 it('gcd theorem independently holds across legal pairs; proof covers all positive values',()=>{
  const g=(a:number,b:number):number=>b?g(b,a%b):a;
  for(let n=1;n<=200;n++)for(let m=1;m<=n*n;m++)if((m*m+m+n*n)%(m*n)===0)expect(m,`${m},${n}`).toBe(g(m,n)**2);
  const r=quadraticNormLesson(parts[2]!)!;expect(r.lesson.steps[1]!.explanation).toContain('lũy thừa nguyên tố');expect(r.lesson.steps[2]!.explanation).toContain('hai hạng tử');
 });
 it('accepts renamed variables but never drops a changed coefficient, positivity or extra claim',()=>{
  const clean=parts[2]!.replace(/\$([^$]+)\$/g,(_,math:string)=>`$${math.replace(/m/g,'u').replace(/n/g,'v')}$`);
  expect(quadraticNormLesson(clean)).not.toBeNull();
  expect(quadraticNormLesson(parts[2]!.replace('m^2+m+n^2','m^2+2m+n^2'))).toBeNull();
  expect(quadraticNormLesson(parts[2]!.replace('số nguyên dương','số nguyên'))).toBeNull();
  expect(quadraticNormLesson(parts[2]!+' Tìm thêm n.')).toBeNull();
 });
});
