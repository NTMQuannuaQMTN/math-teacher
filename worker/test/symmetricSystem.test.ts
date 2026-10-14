import {describe,it,expect} from 'vitest';
import {exactSymmetricSystem,verifySymmetricSystemCertificate} from '../../shared/src/rationalPolynomial';
import {symmetricSystemLesson} from '../src/solver/symmetricSystem';
import {latexFeedback} from '../src/solver/latexCheck';
import {cleanLanguage} from '../../shared/src/language';
import {evalExpression} from '../../shared/src/expr';
const number=(r:NonNullable<ReturnType<typeof exactSymmetricSystem>>['converted']['solutions'][number][number])=>Number(r.u.n)/Number(r.u.d)+Number(r.v.n)/Number(r.v.d)*Math.sqrt(Number(r.radicand));
describe('symmetric quadratic systems reduced by a proven sum identity',()=>{
 it('recovers all ordered pairs in independently constructed families and checks both original equations',()=>{
  for(let a=-4;a<=4;a++)for(let b=-4;b<=4;b++)for(const weighted of [false,true]){
   const S=a+b,C=weighted?2*(a*a+b*b)+3*a*b+5*S:a*a+b*b;
   const equations=[`x+y=${S}`,weighted?`2*(x^2+y^2)+3xy+5*(x+y)=${C}`:`x^2+y^2=${C}`],c=exactSymmetricSystem(equations)!;
   expect(c).not.toBeNull();expect(verifySymmetricSystemCertificate(c)).toBe(true);
   const expected=a===b?[[a,b]]:[[a,b],[b,a]];
   expect(c.converted.solutions.map(pair=>pair.map(number)).sort((a,b)=>a[0]!-b[0]!)).toEqual(expected.sort((a,b)=>a[0]!-b[0]!));
   for(const pair of c.converted.solutions){const [x,y]=pair.map(number);for(const e of equations){const [l,r]=e.split('=');expect(evalExpression(l!,{x:x!,y:y!})).toBeCloseTo(evalExpression(r!,{x:x!,y:y!}),10);}}
  }
 });
 it('handles dependent or inconsistent second conditions without dividing by zero',()=>{
  expect(exactSymmetricSystem(['x+y=3','(x+y)^2=9'])!.converted.infinite).toBe('line');
  expect(exactSymmetricSystem(['x+y=3','(x+y)^2=8'])!.converted.solutions).toEqual([]);
 });
 it.each(['x^2+2y^2=10','x^3+y^3=8','1/x+1/y=3','x^2+y^2+x=9'])('declines an unsupported reduction for %s',second=>expect(exactSymmetricSystem(['x+y=3',second])).toBeNull());
 it('rejects a forged reduced product',()=>{const c=exactSymmetricSystem(['x+y=5','x^2+y^2=13'])!;c.reducedProduct.n=1n;expect(verifySymmetricSystemCertificate(c)).toBe(false);});
 it.each(['x+y=5\\\\x^2+y^2=13','x^2+y^2=10\\\\x+y=4','x+y=3\\\\(x+y)^2=9','x+y=3\\\\(x+y)^2=8'])('renders the full equivalence and complete original-system answer for %s',body=>{
  const r=symmetricSystemLesson(`Giải hệ phương trình $\\begin{cases}${body}\\end{cases}$.`)!;expect(r).not.toBeNull();expect(latexFeedback(r.lesson)).toEqual([]);expect(cleanLanguage(r.lesson).feedback).toEqual([]);
 });
});
