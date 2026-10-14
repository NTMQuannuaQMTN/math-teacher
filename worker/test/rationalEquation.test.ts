import {describe,it,expect} from 'vitest';
import {exactRationalEquation,verifyEquationCertificate,fraction} from '../../shared/src/rationalPolynomial';
import {rationalEquationLesson} from '../src/solver/rationalEquation';
import {latexFeedback} from '../src/solver/latexCheck';
import {cleanLanguage} from '../../shared/src/language';
import {solveProblem} from '../src/solver/pipeline';
import {VN_GRADE_9} from '../src/solver/curriculum';
import type {JsonModel} from '../src/solver/llm';
const unavailable:JsonModel={name:'unavailable',model:'unavailable',complete:async()=>{throw Error('model must not be called');}};
const numeric=(r:NonNullable<ReturnType<typeof exactRationalEquation>>['solutions'][number])=>Number(r.u.n)/Number(r.u.d)+Number(r.v.n)/Number(r.v.d)*Math.sqrt(Number(r.radicand));
describe('complete exact rational-equation solutions',()=>{
 it('recovers every independently constructed factored quadratic, including repeated roots',()=>{
  for(let a=-8;a<=8;a++)for(let b=-8;b<=8;b++){
   const c=exactRationalEquation(`(x-(${a}))*(x-(${b}))=0`)!;
   expect(c,`${a},${b}`).not.toBeNull();expect(verifyEquationCertificate(c)).toBe(true);
   expect(c.solutions.map(numeric).sort((a,b)=>a-b)).toEqual([...new Set([a,b])].sort((a,b)=>a-b));
  }
 });
 it.each([
  ['3(2x-1)-4=2(x+5)',[17/4]],['2x^2-5x-3=0',[-.5,3]],
  ['(x^2-4)/(x-2)=4',[]],['(x^2-4)/(x-2)=1',[-1]],
  ['x/(1/x)=4',[-2,2]],['(x^2-1)/(x-1)=0',[-1]],
  ['1/(x-1)=2/(x-1)',[]],['x-x+1=0',[]],['x^2+1=0',[]],
  ['(x^2-2)/(x^2-2)=x', [1]],['(x-3)^0=x',[1]],
 ])('keeps original domains and all solutions of %s',(eq,expected)=>{
  const c=exactRationalEquation(eq)!;expect(c).not.toBeNull();expect(verifyEquationCertificate(c)).toBe(true);
  expect(c.solutions.map(numeric).sort((a,b)=>a-b)).toEqual(expected);
 });
 it('does not mistake an identity with holes for an empty solution set',()=>{
  const c=exactRationalEquation('(x^2-4)/(x-2)=x+2')!;
  expect(c.identity).toBe(true);expect(c.excluded).toHaveLength(1);
  const l=rationalEquationLesson('Giải phương trình $\\frac{x^2-4}{x-2}=x+2$.')!;
  expect(l.lesson.finalAnswer.text).toContain('mọi số thực');expect(l.lesson.finalAnswer.text).toContain('x-2\\ne0');
 });
 it('checks irrational excluded roots exactly, without floating tolerance',()=>{
  const c=exactRationalEquation('(x^2-2)/(x^2-2)=x^2-1')!;
  expect(c.candidates.map(numeric)).toEqual([-Math.sqrt(2),Math.sqrt(2)]);expect(c.solutions).toEqual([]);
  const allowed=exactRationalEquation('x^2=2')!;expect(allowed.solutions.map(numeric)).toEqual([-Math.sqrt(2),Math.sqrt(2)]);expect(verifyEquationCertificate(allowed)).toBe(true);
 });
 it('rejects tampering in roots, domain restrictions, coefficients and displayed intermediate sides',()=>{
  const source=exactRationalEquation('(x^2-4)/(x-2)=4')!;
  for(const mutate of [(c:typeof source)=>{c.solutions=c.candidates;},(c:typeof source)=>{c.excluded=[];},(c:typeof source)=>{c.coefficients[0]=9n;},(c:typeof source)=>{c.left.n=[fraction(99n)];},(c:typeof source)=>{c.right.d=[fraction(2n)];}]){
   const c=structuredClone(source);mutate(c);expect(verifyEquationCertificate(c)).toBe(false);
  }
 });
 it.each(['x^3=2','sqrt(x)=2','x+y=2','x/(x-x)=1','(x-x)^0=x','x^7=1'])('declines unsupported or undefined input %s',eq=>expect(exactRationalEquation(eq)).toBeNull());
 it.each(['Giải phương trình $x^2=2$ và chỉ lấy nghiệm nguyên.','Giải phương trình $x=2$. Tính $x+1$.','Giải phương trình $x^2=2$, với $x>0$.'])('does not silently omit additional tasks or restrictions',text=>expect(rationalEquationLesson(text)).toBeNull());
 it.each(['3(2x-1)-4=2(x+5)','2x^2-5x-3=0','\\frac{x^2-4}{x-2}=4','x^2=2'])('produces fully renderable Vietnamese steps through the real pipeline for %s',async eq=>{
  const r=await solveProblem(unavailable,VN_GRADE_9,`Giải phương trình $${eq}$ trên tập số thực.`,{signal:AbortSignal.timeout(26000)});
  expect(r.model).toBe('deterministic-algebra');expect(r.verification.status).toBe('verified');
  expect(latexFeedback(r.lesson)).toEqual([]);expect(cleanLanguage(r.lesson).feedback).toEqual([]);
  expect(r.lesson.steps.at(-1)!.explanation).toContain('Vậy');expect(r.durationMs).toBeLessThan(1000);
 });
});
