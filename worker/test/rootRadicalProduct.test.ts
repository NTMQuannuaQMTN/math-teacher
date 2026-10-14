import {describe,it,expect} from 'vitest';
import {exactRootRadicalProduct,verifyRootRadicalProductCertificate,rootLatex} from '../../shared/src/rationalPolynomial';
import {rootRadicalProductLesson} from '../src/solver/rootRadicalProduct';
import {radicalSequenceLesson} from '../src/solver/radicalSequence';
import {latexFeedback} from '../src/solver/latexCheck';
import {cleanLanguage} from '../../shared/src/language';
describe('root-radical product iff with both implications and a positive residual factor',()=>{
 it.each([1,2,5,7])('handles the general κ=%i identity',k=>{
  const c=exactRootRadicalProduct('x^2-2(m+1)x+2m=0','m',`(x_1+sqrt(x_1^2+${k}))*(x_2+sqrt(x_2^2+${k}))=${k}`)!;
  expect(c).not.toBeNull();expect(verifyRootRadicalProductCertificate(c)).toBe(true);expect(c.sumZero.solutions.map(rootLatex)).toEqual(['-1']);
 });
 it('matches the independently established real-number identity over many pairs',()=>{
  for(let u=-5;u<=5;u++)for(let v=-5;v<=5;v++)for(const k of [1,2,5]){
   const product=(u+Math.sqrt(u*u+k))*(v+Math.sqrt(v*v+k));expect(Math.abs(product-k)<1e-9).toBe(u+v===0);
   expect(Math.sqrt(u*u+k)+Math.sqrt(v*v+k)+u-v).toBeGreaterThan(0);
  }
 });
 it('rejects wrong signs, radicands, and an unproved universal real-root assumption',()=>{
  expect(exactRootRadicalProduct('x^2+m=0','m','(x_1+sqrt(x_1^2+1))*(x_2+sqrt(x_2^2+1))=1')).toBeNull();
  expect(exactRootRadicalProduct('x^2-2(m+1)x+2m=0','m','(x_1+sqrt(x_1^2+1))*(x_2+sqrt(x_2^2+2))=1')).toBeNull();
 });
 it('renders the captured entrance-exam relation without assuming the roots are opposite',()=>{
  const q='Cho phương trình $x^2-2(m+1)x+2m=0$ ($m$ là tham số). Chứng minh $\\left(x_1+\\sqrt{x_1^2+1}\\right)\\left(x_2+\\sqrt{x_2^2+1}\\right)=1$ khi và chỉ khi $m=-1$.';
  const r=rootRadicalProductLesson(q)!;expect(r).not.toBeNull();expect(r.lesson.steps.map(s=>s.explanation).join(' ')).toContain('không thể tự giả sử');expect(latexFeedback(r.lesson)).toEqual([]);expect(cleanLanguage(r.lesson).feedback).toEqual([]);expect(rootRadicalProductLesson(q.replace('m=-1','m=0'))).toBeNull();
 });
});
describe('radical power sequence using a characteristic equation rather than checking examples',()=>{
 it.each([[2,3],[3,2],[4,5]])('proves new bases %isqrt%i by the same algebraic identity',(a,d)=>{
  const S=2*a,P=a*a-d,text=`Với mỗi số tự nhiên $n$, đặt $a_n=(${a}+\\sqrt${d})^n+(${a}-\\sqrt${d})^n$. Chứng minh $a_{n+2}=${S}a_{n+1}-(${P})a_n$ với mọi $n=0,1,2,\\ldots$`;
  const r=radicalSequenceLesson(text)!;expect(r).not.toBeNull();expect(latexFeedback(r.lesson)).toEqual([]);expect(cleanLanguage(r.lesson).feedback).toEqual([]);
  const term=(n:number)=>(a+Math.sqrt(d))**n+(a-Math.sqrt(d))**n;for(let n=0;n<=8;n++)expect((S*term(n+1)-P*term(n))/term(n+2)).toBeCloseTo(1,12);
 });
 it('declines a false requested recurrence',()=>expect(radicalSequenceLesson('Với mỗi số tự nhiên $n$, đặt $a_n=(2+\\sqrt3)^n+(2-\\sqrt3)^n$. Chứng minh $a_{n+2}=3a_{n+1}-a_n$ với mọi $n=0,1,2,\\ldots$')).toBeNull());
});
