import {solveProblem} from '../src/solver/pipeline';
import {VN_GRADE_9} from '../src/solver/curriculum';
import type {JsonModel} from '../src/solver/llm';
import {describe,it,expect} from 'vitest';
import {parameterDiscriminant,verifyParameterCertificate,polynomialValueAtFraction} from '../../shared/src/rationalPolynomial';
import {parameterEquationLesson} from '../src/solver/parameterEquation';
import {latexFeedback} from '../src/solver/latexCheck';
import {cleanLanguage} from '../../shared/src/language';
describe('universal parameter claims with exact proofs or explicit counterexamples',()=>{
 it('accepts the complete entrance-exam wording and keeps its quantified parameter',()=>{
  const q='Cho phương trình $x^2-2(m+1)x+2m=0$ ($m$ là tham số). Chứng minh rằng với mọi $m$ phương trình luôn có hai nghiệm phân biệt $x_1,x_2$.';
  expect(parameterEquationLesson(q)).not.toBeNull();expect(parameterEquationLesson(q.replace('với mọi $m$','với mọi $n$'))).toBeNull();expect(parameterEquationLesson(q+' Tìm tích hai nghiệm.')).toBeNull();
 });
 it('proves the reported parameter family without testing just one m',()=>{
  const c=parameterDiscriminant('x^2-2(m+1)x+2m=0','m')!;
  expect(c.discriminant.map(f=>f.n/f.d)).toEqual([4n,0n,4n]);expect(c.universallyDistinct).toBe(true);expect(c.minimum!.n).toBe(4n);expect(verifyParameterCertificate(c)).toBe(true);
 });
 it('agrees with independently known complete-square families, including false claims',()=>{
  for(let q=-9;q<=9;q++)for(const shifted of [false,true]){
   // (x-m)^2=q has two distinct real roots exactly when q>0.
   // x²-2mx-q=0 has minimum discriminant4q at m0.
   const eq=shifted?`x^2-2mx+m^2-(${q})=0`:`x^2-2mx-(${q})=0`;
   const c=parameterDiscriminant(eq,'m')!;expect(c).not.toBeNull();expect(c.universallyDistinct).toBe(q>0);expect(verifyParameterCertificate(c)).toBe(true);
   if(q<=0){expect(c.counterexample).not.toBeNull();expect(polynomialValueAtFraction(c.discriminant,c.counterexample!).n).toBeLessThanOrEqual(0n);}
  }
 });
 it.each(['x^2+m=0','x^2+m^2+1=0','x^2-2mx+m^2+m=0'])('gives an actual counterexample for %s',eq=>{
  const c=parameterDiscriminant(eq,'m')!;expect(c).not.toBeNull();expect(c.universallyDistinct).toBe(false);expect(polynomialValueAtFraction(c.discriminant,c.counterexample!).n).toBeLessThanOrEqual(0n);
 });
 it.each(['mx^2+x+1=0','x^3+m=0','x^2+1/m=0','x^2+sqrt(m)=0'])('declines unsupported hypotheses without sampling around them',eq=>expect(parameterDiscriminant(eq,'m')).toBeNull());
 it('renders the complete proof and a concrete false-claim response in Vietnamese',()=>{
  for(const eq of ['x^2-2(m+1)x+2m=0','x^2+m^2+1=0']){
   const l=parameterEquationLesson(`Cho phương trình $${eq}$, với $m$ là số thực. Chứng minh phương trình luôn có hai nghiệm phân biệt.`)!;
   expect(l).not.toBeNull();expect(latexFeedback(l.lesson)).toEqual([]);expect(cleanLanguage(l.lesson).feedback).toEqual([]);expect(l.lesson.steps.at(-1)!.explanation).toContain('Vậy');
  }
 });
 it('returns a verified universal proof without inference through the application pipeline',async()=>{
  const unavailable:JsonModel={name:'none',model:'none',complete:async()=>{throw Error('inference unnecessary');}};
  const result=await solveProblem(unavailable,VN_GRADE_9,'Cho phương trình $x^2-2(m+1)x+2m=0$, với $m$ là số thực. Chứng minh phương trình luôn có hai nghiệm phân biệt.',{signal:AbortSignal.timeout(26000)});
  expect(result.model).toBe('deterministic-algebra');expect(result.verification.status).toBe('verified');expect(result.lesson.steps[2]!.explanation).toContain('mọi số thực');
 });
 it('rejects a forged universal flag and minimum',()=>{
  const c=parameterDiscriminant('x^2+m^2+1=0','m')!;c.universallyDistinct=true;expect(verifyParameterCertificate(c)).toBe(false);
 });
});
