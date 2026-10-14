import {describe,it,expect} from 'vitest';
import {exactQuadraticRange,verifyQuadraticRangeCertificate} from '../../shared/src/rationalPolynomial';
import {quadraticRangeLesson} from '../src/solver/quadraticRange';
import {latexFeedback} from '../src/solver/latexCheck';
import {cleanLanguage} from '../../shared/src/language';
const number=(f:{n:bigint;d:bigint})=>Number(f.n)/Number(f.d);
describe('exact extrema on a closed interval without calculus',()=>{
 it('compares complete-square families against an independent distance argument',()=>{
  for(let a=-3;a<=3;a++)for(let h=-4;h<=4;h++)for(let lower=-2;lower<=2;lower++){
   const upper=lower+3,c=exactQuadraticRange(`${a}*(x-(${h}))^2+7`,String(lower),String(upper))!;
   expect(c).not.toBeNull();expect(verifyQuadraticRangeCertificate(c)).toBe(true);
   const closest=Math.max(lower,Math.min(upper,h)),distances=[(lower-h)**2,(upper-h)**2,(closest-h)**2],values=distances.map(d=>a*d+7);
   expect(number(c.minimum)).toBe(Math.min(...values));expect(number(c.maximum)).toBe(Math.max(...values));
   for(const p of c.points)expect(number(p.value)).toBeCloseTo(a*(number(p.x)-h)**2+7,12);
  }
 });
 it.each([
 ['x^2-4x+1','-1','4',-3,6],['-x^2','-2','2',-4,0],['3x+1','-1/2','3/2',-0.5,5.5],['x-x+8','0','4',8,8],['x^2','2','2',4,4],
 ])('covers endpoints, signs, ties, rational bounds and singleton intervals for %s',(expr,l,u,min,max)=>{
  const c=exactQuadraticRange(expr,l,u)!;expect(number(c.minimum)).toBe(min);expect(number(c.maximum)).toBe(max);expect(verifyQuadraticRangeCertificate(c)).toBe(true);
 });
 it('rejects undefined original expressions, higher degrees and reversed intervals',()=>{
  expect(exactQuadraticRange('(x^2-1)/(x-1)','0','2')).toBeNull();expect(exactQuadraticRange('x^3','0','2')).toBeNull();expect(exactQuadraticRange('x^2','2','0')).toBeNull();
 });
 it('rejects a forged minimum',()=>{const c=exactQuadraticRange('x^2','-1','2')!;c.minimum.n=-1n;expect(verifyQuadraticRangeCertificate(c)).toBe(false);});
 it.each(['x^2-4x+1','-x^2','3x+1','x-x+8'])('renders reasons and explicit achieving points for %s',expr=>{
  const r=quadraticRangeLesson(`Cho $-1\\le x\\le4$. Tìm giá trị nhỏ nhất và lớn nhất của $A=${expr}$.`)!;expect(r).not.toBeNull();expect(latexFeedback(r.lesson)).toEqual([]);expect(cleanLanguage(r.lesson).feedback).toEqual([]);
 });
 it('does not drop an extra subquestion',()=>expect(quadraticRangeLesson('Cho $-1\\le x\\le4$. Tìm giá trị nhỏ nhất và lớn nhất của $A=x^2$. Sau đó giải phương trình $A=2$.')).toBeNull());
});
