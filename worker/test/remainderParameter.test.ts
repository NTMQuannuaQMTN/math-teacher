import {describe,it,expect} from 'vitest';
import {exactRemainderParameter,verifyRemainderParameterCertificate,rootLatex} from '../../shared/src/rationalPolynomial';
import {remainderParameterLesson} from '../src/solver/remainderParameter';
import {latexFeedback} from '../src/solver/latexCheck';
import {cleanLanguage} from '../../shared/src/language';
describe('polynomial divisibility with an exact necessary and sufficient remainder',()=>{
 it('recovers parameters in independently constructed divisible families',()=>{
  for(let r=-4;r<=4;r++)for(let target=-3;target<=3;target++){
   // Explicit quotient Q=x²+x+2, remainder a-target: divisibility iff a=target.
   const original=`(x-(${r}))*(x^2+x+2)+a-(${target})`,c=exactRemainderParameter(original,'x','a',`2x-(${2*r})`)!;
   expect(c).not.toBeNull();expect(verifyRemainderParameterCertificate(c)).toBe(true);expect(c.equation.solutions.map(rootLatex)).toEqual([String(target)]);
  }
 });
 it.each([
 ['x^3-2x^2+ax+4','x-2',['-2']],['x/2+a','2x-1',['-\\frac{1}{4}']],['x^2+a^2','x-1',[]],['x^2+a^2-4','x',['-2','2']],
 ])('retains every real parameter of %s',(p,d,roots)=>{const c=exactRemainderParameter(p,'x','a',d)!;expect(c).not.toBeNull();expect(c.equation.solutions.map(rootLatex)).toEqual(roots);});
 it('handles parameter-independent divisibility identities',()=>{
  const c=exactRemainderParameter('(x-1)*(x+a)','x','a','x-1')!;expect(c.equation.identity).toBe(true);
 });
 it.each(['x^2+1/x','x^2+1/a','sqrt(x)+a'])('does not apply a polynomial theorem to %s',p=>expect(exactRemainderParameter(p,'x','a','x-1')).toBeNull());
 it('rejects nonlinear divisors and a forged parameter',()=>{
  expect(exactRemainderParameter('x^3+ax','x','a','x^2-1')).toBeNull();const c=exactRemainderParameter('x+a','x','a','x-1')!;c.root.n=2n;expect(verifyRemainderParameterCertificate(c)).toBe(false);
 });
 it.each(['x^3-2x^2+ax+4','x/2+a','(x-2)*(x+a)'])('renders substitutions and the reason for the equivalence for %s',p=>{
  const r=remainderParameterLesson(`Tìm $a$ để đa thức $P(x)=${p}$ chia hết cho $x-2$.`)!;expect(r).not.toBeNull();expect(latexFeedback(r.lesson)).toEqual([]);expect(cleanLanguage(r.lesson).feedback).toEqual([]);
 });
});
