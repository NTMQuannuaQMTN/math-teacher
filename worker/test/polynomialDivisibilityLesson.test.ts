import {describe,it,expect} from 'vitest';
import {polynomialDivisibilityLesson,verifyPolynomialDivisibilityCertificate} from '../src/solver/polynomialDivisibilityLesson';
import {latexFeedback} from '../src/solver/latexCheck';
import {cleanLanguage} from '../../shared/src/language';
import {verifyLesson} from '../../shared/src/verify';
const source='Câu 3. Với mỗi số nguyên dương $n$, đặt $f(n)=(n+4)^{4}-n^{4}$.\na) Chứng minh $f(n)$ chia hết cho $16$ với mọi $n$.\nb) Tìm $n$ để $f(n)$ chia hết cho $3$.\nc) Tìm $n$ để $f(n)$ chia hết cho $24^{2}$.';
describe('multipart polynomial divisibility reduces moduli without losing conditions',()=>{
 it('solves all three preserved exam parts with complete residue/coprime reasoning',()=>{
  const r=polynomialDivisibilityLesson(source)!;expect(r).not.toBeNull();expect(verifyPolynomialDivisibilityCertificate(r.certificate)).toBe(true);
  expect(r.certificate.parts.map(p=>p.residues)).toEqual([[0],[1],[16]]);expect(r.certificate.parts.map(p=>p.period)).toEqual([1,3,18]);
  expect(r.lesson.finalAnswer.text.split('\n')).toHaveLength(3);expect(r.lesson.finalAnswer.text).toContain('18k+16');expect(r.lesson.steps.some(s=>s.explanation.includes('đôi một nguyên tố cùng nhau'))).toBe(true);
  expect(latexFeedback(r.lesson)).toEqual([]);expect(cleanLanguage(r.lesson).feedback).toEqual([]);expect(verifyLesson(r.lesson,{problemText:source}).verification.status).not.toBe('unverified');
  for(let n=-1000;n<=1000;n++){const value=(BigInt(n)+4n)**4n-BigInt(n)**4n;expect(value%576n===0n,String(n)).toBe(((n%18+18)%18)===16);expect(value%3n===0n,String(n)).toBe(((n%3+3)%3)===1);expect(value%16n).toBe(0n);}
 });
 it('works with different names, polynomial structure and modulus instead of exact source matching',()=>{
  const text='Với mỗi số nguyên $t$, đặt $G(t)=t(t+1)$. a) Chứng minh $G(t)$ chia hết cho $2$ với mọi $t$. b) Tìm $t$ để $G(t)$ chia hết cho $3$. c) Tìm $t$ để $G(t)$ chia hết cho $5$.';
  const r=polynomialDivisibilityLesson(text)!;expect(r).not.toBeNull();expect(r.certificate.parts.map(p=>p.residues)).toEqual([[0],[0,2],[0,4]]);expect(verifyPolynomialDivisibilityCertificate(r.certificate)).toBe(true);
 });
 it('handles a false universal first part with a genuine counterexample, while solving later parts',()=>{
  const text='Với mỗi số nguyên dương $n$, đặt $f(n)=n^2+n$. a) Chứng minh $f(n)$ chia hết cho $4$ với mọi $n$. b) Tìm $n$ để $f(n)$ chia hết cho $3$. c) Tìm $n$ để $f(n)$ chia hết cho $5$.';
  const r=polynomialDivisibilityLesson(text)!;expect(r).not.toBeNull();expect(r.lesson.finalAnswer.text).toContain('n=1');expect(r.lesson.finalAnswer.text).toContain('khẳng định'.replace('k','K'));expect(verifyPolynomialDivisibilityCertificate(r.certificate)).toBe(true);
 });
 it('cannot certify wrong cancellation, removed classes or a forged compressed period',()=>{
  const c=polynomialDivisibilityLesson(source)!.certificate;
  expect(verifyPolynomialDivisibilityCertificate({...c,parts:c.parts.map((p,i)=>i===2?{...p,factor:32}:p)})).toBe(false);
  expect(verifyPolynomialDivisibilityCertificate({...c,parts:c.parts.map((p,i)=>i===2?{...p,zeros:[16]}:p)})).toBe(false);
  expect(verifyPolynomialDivisibilityCertificate({...c,parts:c.parts.map((p,i)=>i===2?{...p,period:9,residues:[7]}:p)})).toBe(false);
 });
 it('declines lost domains, different part references and additional questions',()=>{
  expect(polynomialDivisibilityLesson(source+' d) Tìm giá trị nhỏ nhất.')).toBeNull();
  expect(polynomialDivisibilityLesson(source.replace('$n$ để $f(n)$ chia hết cho $3$','$m$ để $f(n)$ chia hết cho $3$'))).toBeNull();
 });
 it('does not reuse the index or original function as a helper',()=>{
  const text=source.replace(/\$([^$]+)\$/g,(_,math:string)=>`$${math.replace(/n/g,'k').replace(/f/g,'Q')}$`),r=polynomialDivisibilityLesson(text)!;
  expect(r.lesson.finalAnswer.text).toContain('18t+16');expect(r.lesson.steps.some(s=>s.explanation.includes('$G(k)='))).toBe(true);expect(verifyPolynomialDivisibilityCertificate(r.certificate)).toBe(true);expect(latexFeedback(r.lesson)).toEqual([]);
  const renamed=source.replace(/\$([^$]+)\$/g,(_,math:string)=>`$${math.replace(/n/g,'r')}$`),other=polynomialDivisibilityLesson(renamed)!;
  expect(other.lesson.steps.some(s=>s.math?.includes('Q(r)\\equiv Q(s)'))).toBe(true);expect(latexFeedback(other.lesson)).toEqual([]);
 });
});
