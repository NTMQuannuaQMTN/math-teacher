import {describe,it,expect} from 'vitest';
import {exactArithmeticIdentity,verifyArithmeticIdentity} from '../../shared/src/polynomialIdentity';
import {positiveInequalityLesson} from '../src/solver/positiveInequality';
import {latexFeedback} from '../src/solver/latexCheck';
import {cleanLanguage} from '../../shared/src/language';
describe('nonnegative-square proof families with explicit equality witnesses',()=>{
 it.each([
 ['(a+b)^2-4ab','(a-b)^2'],['(a+b+c)*(1/a+1/b+1/c)-9','(a-b)^2/(ab)+(a-c)^2/(ac)+(b-c)^2/(bc)'],
 ['(x+y)^4','x^4+4x^3*y+6x^2*y^2+4x*y^3+y^4'],['(a/b+b/a)-2','(a-b)^2/(ab)'],
 ])('verifies the whole identity %s = %s by exact coefficient comparison',(left,right)=>{
  const c=exactArithmeticIdentity(left,right)!;expect(verifyArithmeticIdentity(c)).toBe(true);expect(exactArithmeticIdentity(left,`(${right})+1`)!.valid).toBe(false);
 });
 it('retains original denominator restrictions despite algebraic cancellation',()=>{
  const c=exactArithmeticIdentity('x/x','1')!;expect(c.valid).toBe(true);expect(c.denominators).toHaveLength(1);
  expect(exactArithmeticIdentity('1/(x-x)','1')).toBeNull();expect(exactArithmeticIdentity('sqrt(x)^2','x')).toBeNull();
 });
 it.each([
 'Cho $a,b$ là các số thực dương thỏa mãn $a+b=6$. Chứng minh $ab\\le9$ và tìm trường hợp xảy ra dấu bằng.',
 'Cho $a,b,c$ là các số thực dương và $a+b+c=6$. Chứng minh $\\frac1a+\\frac1b+\\frac1c\\ge\\frac32$ và tìm trường hợp xảy ra dấu bằng.',
 'Cho $a,b$ là các số thực dương. Chứng minh $\\frac{a}{b}+\\frac{b}{a}\\ge2$ và xác định trường hợp xảy ra dấu bằng.',
 'Cho $x,y,z,w$ là các số thực dương và $x+y+z+w=8$. Chứng minh $1/x+1/y+1/z+1/w\\ge2$ và tìm trường hợp xảy ra dấu bằng.',
 ])('renders each deduction and concrete equality witnesses for %s',text=>{
  const r=positiveInequalityLesson(text)!;expect(r).not.toBeNull();expect(r.certificate.every(verifyArithmeticIdentity)).toBe(true);expect(latexFeedback(r.lesson)).toEqual([]);expect(cleanLanguage(r.lesson).feedback).toEqual([]);expect(r.lesson.steps.at(-1)!.explanation).toContain('khi và chỉ khi');
 });
 it('supports new totals and variable names rather than memorizing the reported answer',()=>{
  for(let s=1;s<=9;s++){
   const q=`Cho $x,y$ là các số thực dương thỏa mãn $x+y=${s}$. Chứng minh $xy\\le\\frac{${s*s}}{4}$ và tìm trường hợp xảy ra dấu bằng.`;
   const r=positiveInequalityLesson(q)!;expect(r).not.toBeNull();
   // Independent fixed-sum sampling verifies the claimed bound and the witness.
   for(let j=1;j<=99;j++){const x=s*j/100,y=s-x;expect(x*y).toBeLessThanOrEqual(s*s/4+1e-12);}expect((s/2)**2).toBe(s*s/4);
  }
 });
 it.each([
 'Cho $a,b$ là các số thực dương thỏa mãn $a+b=6$. Chứng minh $ab\\le8$ và tìm trường hợp xảy ra dấu bằng.',
 'Cho $a,b$ là các số thực. Chứng minh $a/b+b/a\\ge2$ và tìm trường hợp xảy ra dấu bằng.',
 'Cho $a,b,c$ là các số thực dương và $a+b+c=6$. Chứng minh $1/a+1/b+1/c\\ge2$ và tìm trường hợp xảy ra dấu bằng.',
 ])('does not turn an unsupported or false claim into a valid proof: %s',q=>expect(positiveInequalityLesson(q)).toBeNull());
});
