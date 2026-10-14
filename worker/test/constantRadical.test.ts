import {describe,it,expect} from 'vitest';
import {exactConstantRadical,verifyConstantRadicalCertificate,rootLatex} from '../../shared/src/rationalPolynomial';
import {constantRadicalLesson} from '../src/solver/constantRadical';
import {latexFeedback} from '../src/solver/latexCheck';
import {cleanLanguage} from '../../shared/src/language';
import {evalExpression} from '../../shared/src/expr';
const numeric=(r:NonNullable<ReturnType<typeof exactConstantRadical>>['value'])=>Number(r.u.n)/Number(r.u.d)+Number(r.v.n)/Number(r.v.d)*Math.sqrt(Number(r.radicand));
describe('exact constant radical identities with the nonnegative square root',()=>{
 it('returns 2sqrt3 rather than the contradictory scalar4 in the captured answer',()=>{
  const c=exactConstantRadical('sqrt(7+4sqrt(3))-sqrt(7-4sqrt(3))')!;expect(rootLatex(c.value)).toBe('2\\sqrt{3}');expect(verifyConstantRadicalCertificate(c)).toBe(true);
 });
 it('checks sign reversal in independently constructed nested-square families',()=>{
  for(let a=1;a<=6;a++)for(let b=1;b<=4;b++)for(const d of [2,3,5]){
   const u=a*a+b*b*d,v=2*a*b,c=exactConstantRadical(`sqrt(${u}+${v}sqrt(${d}))-sqrt(${u}-${v}sqrt(${d}))`)!;
   expect(c).not.toBeNull();expect(verifyConstantRadicalCertificate(c)).toBe(true);
   // sqrt((a-bsqrt(d))²)=|a-bsqrt(d)|, even when this flips the sign.
   expect(numeric(c.value)).toBeCloseTo(a+b*Math.sqrt(d)-Math.abs(a-b*Math.sqrt(d)),11);
  }
 });
 it.each(['sqrt(12)-2sqrt(3)','sqrt(2)/sqrt(8)','1/(2+sqrt(3))','sqrt(9/4)','sqrt(0)','sqrt(2+sqrt(3))*sqrt(2-sqrt(3))'])('agrees with independently evaluated %s or declines unsupported extensions',expr=>{
  const c=exactConstantRadical(expr);if(expr.startsWith('sqrt(2+sqrt(3))'))expect(c).toBeNull();else{expect(c).not.toBeNull();expect(numeric(c!.value)).toBeCloseTo(evalExpression(expr),12);}
 });
 it.each(['sqrt(-1)','1/(sqrt(3)-sqrt(3))','sqrt(x)','sqrt(2)+sqrt(3)'])('declines nonreal, undefined, variable or unsupported fields for %s',expr=>expect(exactConstantRadical(expr)).toBeNull());
 it('rejects a forged scalar answer',()=>{const c=exactConstantRadical('sqrt(7+4sqrt(3))-sqrt(7-4sqrt(3))')!;c.value={u:{n:4n,d:1n},v:{n:0n,d:1n},radicand:0n};expect(verifyConstantRadicalCertificate(c)).toBe(false);});
 it.each(['\\sqrt{7+4\\sqrt{3}}-\\sqrt{7-4\\sqrt{3}}','\\sqrt{11-6\\sqrt{2}}','\\frac{1}{2+\\sqrt{3}}'])('renders the sign check for %s',expr=>{
  const r=constantRadicalLesson(`Rút gọn $A=${expr}$.`)!;expect(r).not.toBeNull();expect(latexFeedback(r.lesson)).toEqual([]);expect(cleanLanguage(r.lesson).feedback).toEqual([]);
 });
 it('does not discard an extra question',()=>expect(constantRadicalLesson('Rút gọn $A=\\sqrt3$. Chứng minh $A>1$.')).toBeNull());
});
