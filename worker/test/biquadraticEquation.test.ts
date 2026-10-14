import {describe,it,expect} from 'vitest';
import {exactBiquadratic,verifyBiquadraticCertificate,biquadraticRootLatex} from '../../shared/src/rationalPolynomial';
import {biquadraticEquationLesson} from '../src/solver/biquadraticEquation';
import {latexFeedback} from '../src/solver/latexCheck';
import {cleanLanguage} from '../../shared/src/language';
const value=(root:NonNullable<ReturnType<typeof exactBiquadratic>>['solutions'][number])=>root.sign*Math.sqrt(Number(root.square.u.n)/Number(root.square.u.d)+Number(root.square.v.n)/Number(root.square.v.d)*Math.sqrt(Number(root.square.radicand)));
describe('complete quartic substitution with nonnegative auxiliary roots',()=>{
 it('recovers independently constructed symmetric root sets including zero and repeated square roots',()=>{
  for(let a=-4;a<=8;a++)for(let b=-4;b<=8;b++){
   const c=exactBiquadratic(`(x^2-(${a}))*(x^2-(${b}))=0`)!;expect(c).not.toBeNull();expect(verifyBiquadraticCertificate(c)).toBe(true);
   const expected=[...new Set([a,b].filter(n=>n>=0).flatMap(n=>n===0?[0]:[-Math.sqrt(n),Math.sqrt(n)]))].sort((a,b)=>a-b);
   expect(c.solutions.map(value).sort((a,b)=>a-b)).toEqual(expected);
  }
 });
 it('retains holes from nested even denominators despite cancellation',()=>{
  const c=exactBiquadratic('x^2/(1/(x^2-1))=0')!;expect(c).not.toBeNull();expect(c.solutions.map(value)).toEqual([0]);expect(verifyBiquadraticCertificate(c)).toBe(true);
 });
 it.each([
 ['x^4-5x^2+4=0',['-1','1','-2','2']],['x^4+x^2=0',['0']],['x^4+5x^2+4=0',[]],
 ['x^4-2x^2-1=0',['-\\sqrt{1+\\sqrt{2}}','\\sqrt{1+\\sqrt{2}}']],
 ])('finds every real solution of %s',(equation,expected)=>{
  const c=exactBiquadratic(equation)!;expect(c).not.toBeNull();expect(c.solutions.map(biquadraticRootLatex)).toEqual(expected);
 });
 it('rejects unsupported odd or higher powers and forged missing roots',()=>{
  expect(exactBiquadratic('x^4+x=0')).toBeNull();expect(exactBiquadratic('x^6=1')).toBeNull();
  const c=exactBiquadratic('x^4-5x^2+4=0')!;c.solutions.pop();expect(verifyBiquadraticCertificate(c)).toBe(false);
 });
 it.each(['x^4-5x^2+4=0','x^4-2x^2-1=0','\\frac{x^4-1}{x^2-1}=3','\\frac{x^4-1}{x^2-1}=2'])('renders explicit auxiliary sign checks and complete roots for %s',equation=>{
  const r=biquadraticEquationLesson(`Giải phương trình $${equation}$.`)!;expect(r).not.toBeNull();expect(latexFeedback(r.lesson)).toEqual([]);expect(cleanLanguage(r.lesson).feedback).toEqual([]);expect(r.lesson.steps.at(-1)!.explanation).toContain('mọi nghiệm thực');
 });
});
