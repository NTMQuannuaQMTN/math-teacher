import {describe,it,expect} from 'vitest';
import {exactTwoRadicals,verifyTwoRadicalCertificate} from '../../shared/src/rationalPolynomial';
import {twoRadicalEquationLesson} from '../src/solver/twoRadicalEquation';
import {latexFeedback} from '../src/solver/latexCheck';
import {cleanLanguage} from '../../shared/src/language';
const value=(r:NonNullable<ReturnType<typeof exactTwoRadicals>>['solutions'][number])=>Number(r.u.n)/Number(r.u.d)+Number(r.v.n)/Number(r.v.d)*Math.sqrt(Number(r.radicand));
describe('two square roots with exact signs at both squaring steps',()=>{
 it.each([
 ['sqrt(x+1)+sqrt(2x-1)=3',[29-6*Math.sqrt(21)]],['sqrt(x+1)+sqrt(2x-1)=-3',[]],
 ['sqrt(x+1)-sqrt(x)=1',[0]],['sqrt(x+1)-sqrt(x)=-1',[]],
 ['sqrt(x)-sqrt(x+1)=-1',[0]],['sqrt(3x+4)+sqrt(x-1)=5',[(45-5*Math.sqrt(61))/2]],
 ['sqrt(x)+sqrt(x)=4',[4]],
 ])('rejects every extraneous root of %s',(eq,expected)=>{
  const c=exactTwoRadicals(eq)!;expect(c).not.toBeNull();expect(verifyTwoRadicalCertificate(c)).toBe(true);expect(c.solutions.map(value)).toHaveLength(expected.length);c.solutions.map(value).forEach((v,i)=>expect(v).toBeCloseTo(expected[i]!,10));
 });
 it('agrees with an independent monotone bisection check across many positive-slope families',()=>{
  for(let a=1;a<=3;a++)for(let b=0;b<=3;b++)for(let d=1;d<=3;d++){
   const c=exactTwoRadicals(`sqrt(${a}x+${b})+sqrt(${d}x)=4`)!;expect(c).not.toBeNull();expect(c.solutions).toHaveLength(1);
   let low=0,high=20;for(let i=0;i<80;i++){const mid=(low+high)/2;if(Math.sqrt(a*mid+b)+Math.sqrt(d*mid)>4)high=mid;else low=mid;}
   expect(value(c.solutions[0]!)).toBeCloseTo((low+high)/2,9);
  }
 });
 it.each(['\\sqrt{x+1}+\\sqrt{2x-1}=3','\\sqrt{x+1}-\\sqrt{x}=1','\\sqrt{x}+\\sqrt{x}=-4'])('renders the conditions and sufficiency argument for %s',eq=>{
  const r=twoRadicalEquationLesson(`Giải phương trình $${eq}$.`)!;expect(r).not.toBeNull();expect(latexFeedback(r.lesson)).toEqual([]);expect(cleanLanguage(r.lesson).feedback).toEqual([]);expect(r.lesson.steps.at(-1)!.explanation).toContain('khôi phục đúng');
 });
 it('rejects a forged accepted extraneous root',()=>{
  const c=exactTwoRadicals('sqrt(x+1)+sqrt(2x-1)=3')!;c.solutions=c.transformed.solutions;expect(verifyTwoRadicalCertificate(c)).toBe(false);
 });
});
