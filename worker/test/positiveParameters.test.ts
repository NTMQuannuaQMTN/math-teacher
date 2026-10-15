import {describe,it,expect} from 'vitest';
import {exactPositiveParameters,verifyPositiveParameterCertificate,rootInInterval,fraction,type ExactRoot,intervalLatex} from '../../shared/src/rationalPolynomial';
import {positiveParameterLesson} from '../src/solver/positiveParameters';
import {latexFeedback} from '../src/solver/latexCheck';
import {cleanLanguage} from '../../shared/src/language';
import {solveProblem} from '../src/solver/pipeline';
import {VN_GRADE_9} from '../src/solver/curriculum';
import type {JsonModel} from '../src/solver/llm';
const root=(n:number):ExactRoot=>({u:fraction(BigInt(n),2n),v:fraction(0n),radicand:0n});
describe('positive distinct parameter roots through necessary and sufficient conditions',()=>{
 it('recovers independent roots m,s even when the quadratic is multiplied by a negative constant',()=>{
  for(let s=-3;s<=4;s++)for(const a of [-3,1,2]){
   const c=exactPositiveParameters(`${a}*(x-m)*(x-(${s}))=0`,'m')!;expect(c).not.toBeNull();expect(verifyPositiveParameterCertificate(c)).toBe(true);
   for(let doubled=-12;doubled<=16;doubled++)expect(c.intervals.some(interval=>rootInInterval(root(doubled),interval))).toBe(s>0&&doubled/2>0&&doubled/2!==s);
  }
 });
 it('retains the irrational discriminant boundary and excludes a repeated root',()=>{
  const c=exactPositiveParameters('x^2-mx+2=0','m')!;expect(c.intervals.map(intervalLatex)).toEqual(['(2\\sqrt{2};+\\infty)']);
 });
 it('does not mistake positive sum alone for two positive roots',()=>{
  const c=exactPositiveParameters('x^2-mx-1=0','m')!;expect(c.intervals).toEqual([]);
 });
 it('rejects a forged interval and a parameter-dependent leading coefficient',()=>{
  const c=exactPositiveParameters('x^2-(m+2)x+2m=0','m')!;c.intervals[0]!.lowerClosed=true;expect(verifyPositiveParameterCertificate(c)).toBe(false);expect(exactPositiveParameters('mx^2-x+2=0','m')).toBeNull();
 });
 it.each(['x^2-(m+2)x+2m=0','x^2-mx+2=0','x^2-mx-1=0'])('renders sign arguments and both directions for %s',eq=>{
  const r=positiveParameterLesson(`Cho phương trình $${eq}$. Tìm tất cả $m$ để phương trình có hai nghiệm phân biệt và cả hai nghiệm đều dương.`)!;
  expect(r).not.toBeNull();expect(latexFeedback(r.lesson)).toEqual([]);expect(cleanLanguage(r.lesson).feedback).toEqual([]);expect(r.lesson.steps[1]!.explanation).toContain('Ngược lại');
 });
 it('accepts a real-domain annotation and natural wording from the application',()=>{
  const text='Cho phương trình $x^2-2(m+2)x+4m+3=0$. Tìm tất cả $m\\in\\mathbb R$ để phương trình có hai nghiệm thực phân biệt và đều dương.';
  const result=positiveParameterLesson(text);
  expect(result).not.toBeNull();
  expect(result!.lesson.finalAnswer.text).toContain('\\frac{3}{4}');
 });
 it('routes the real-domain form through the application pipeline without inference',async()=>{
  const unavailable:JsonModel={name:'unavailable',model:'unavailable',complete:async()=>{throw Error('no inference allowed');}};
  const text='Tìm tất cả $m\\in\\mathbb R$ để phương trình $x^2-2(m+2)x+4m+3=0$ có hai nghiệm thực phân biệt và đều dương.';
  const result=await solveProblem(unavailable,VN_GRADE_9,text,{signal:AbortSignal.timeout(26000)});
  expect(result.model).toBe('deterministic-algebra');
  expect(result.lesson.finalAnswer.text).toContain('\\frac{3}{4}');
 });
});
