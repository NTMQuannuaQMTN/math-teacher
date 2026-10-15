import {solveProblem} from '../src/solver/pipeline';
import {VN_GRADE_9} from '../src/solver/curriculum';
import type {JsonModel} from '../src/solver/llm';
import {describe,it,expect} from 'vitest';
import {exactUnaryEquation,verifyUnaryCertificate,rootSign,fraction,isolateUnaryTerm,exactRationalEquation,exactPolynomialRoots} from '../../shared/src/rationalPolynomial';
import {unaryEquationLesson} from '../src/solver/unaryEquation';
import {latexFeedback} from '../src/solver/latexCheck';
import {cleanLanguage} from '../../shared/src/language';
const value=(r:NonNullable<ReturnType<typeof exactUnaryEquation>>['solutions'][number])=>Number(r.u.n)/Number(r.u.d)+Number(r.v.n)/Number(r.v.d)*Math.sqrt(Number(r.radicand));
describe('radical and absolute-value equivalence',()=>{
 it.each([
 ['sqrt(2x+3)=x',[3]],['sqrt(x+2)=-x',[-1]],['sqrt(x^2)=x',[]],
 ['sqrt(x+1)=-2',[]],['sqrt(x^2+1)=x',[]],['sqrt(4x+5)=x+1',[1+Math.sqrt(5)]],
 ['abs(3x+2)=7',[-3,5/3]],['abs(x-2)=x', [1]],['abs(x)= -1',[]],['abs(x+1)=0',[-1]],
 ['3=abs(2x-1)',[-1,2]],
 ])('solves %s without extraneous roots',(eq,expected)=>{
  const c=exactUnaryEquation(eq);if(expected===null){expect(c).toBeNull();return;}
  expect(c).not.toBeNull();expect(verifyUnaryCertificate(c!)).toBe(true);expect(c!.solutions.map(value).sort((a,b)=>a-b)).toEqual(expected);
 });
 it.each([
  ['sqrt(x^2)=x','[0;+\\infty)'],['sqrt(x^2)=-x','(-\\infty;0]'],
  ['abs(1/(x-1))=1/(x-1)','(1;+\\infty)'],['sqrt((x+1)^2/(x-1)^2)=(x+1)/(x-1)','(-\\infty;-1]\\cup(1;+\\infty)'],
  ['abs(x)=x','[0;+\\infty)'],['abs(x^2)=x^2','(-\\infty;+\\infty)'],['abs(x-x)=0','(-\\infty;+\\infty)'],
 ])('solves the remaining sign condition for identity %s',(eq,expected)=>{
  const c=exactUnaryEquation(eq)!;expect(c).not.toBeNull();expect(verifyUnaryCertificate(c)).toBe(true);expect(c.regions).not.toHaveLength(0);
  const l=unaryEquationLesson(`Giải phương trình $${eq}$.`)!;expect(l).not.toBeNull();expect(l.lesson.finalAnswer.text).toContain(expected);expect(latexFeedback(l.lesson)).toEqual([]);expect(cleanLanguage(l.lesson).feedback).toEqual([]);
 });
 it('agrees with independent original-function evaluation across many radicand families',()=>{
  for(let a=-5;a<=5;a++)for(let b=-8;b<=8;b++){
   const c=exactUnaryEquation(`sqrt(${a}x+(${b}))=x`)!;
   expect(c).not.toBeNull();
   const discriminant=a*a+4*b;const expected=discriminant<0?[]:[(a-Math.sqrt(discriminant))/2,(a+Math.sqrt(discriminant))/2].filter((x,i,all)=>x>=0&&all.indexOf(x)===i);
   expect(c.solutions.map(value).sort((a,b)=>a-b)).toEqual(expected);
   for(const x of c.solutions.map(value))expect(Math.abs(Math.sqrt(a*x+b)-x)).toBeLessThan(1e-7);
  }
 });
 it('orders near-cancelling surds exactly',()=>{
  expect(rootSign({u:fraction(140n),v:fraction(-99n),radicand:2n})).toBe(-1);
  expect(rootSign({u:fraction(-140n),v:fraction(99n),radicand:2n})).toBe(1);
 });
 it('renders full Vietnamese explanations for both families',()=>{
  for(const eq of ['\\sqrt{2x+3}=x','|3x+2|=7','\\sqrt{\\frac{x^2-4}{x-2}}=2']){
   const l=unaryEquationLesson(`Giải phương trình $${eq}$.`)!;expect(l).not.toBeNull();expect(latexFeedback(l.lesson)).toEqual([]);expect(cleanLanguage(l.lesson).feedback).toEqual([]);expect(l.lesson.steps.at(-1)!.explanation).toContain('Vậy');
  }
 });
 it('uses exact verified branches in the application without a model call',async()=>{
  const unavailable:JsonModel={name:'unavailable',model:'unavailable',complete:async()=>{throw Error('no inference allowed');}};
  for(const equation of ['\\sqrt{2x+3}=x','|3x+2|=7']){
   const result=await solveProblem(unavailable,VN_GRADE_9,`Giải phương trình $${equation}$.`,{signal:AbortSignal.timeout(26000)});
   expect(result.model).toBe('deterministic-algebra');expect(result.verification.status).toBe('verified');expect(result.lesson.steps.at(-1)!.math).toContain('\\text{VP}');
  }
 });
 it('rejects missing or altered branches',()=>{
  const c=exactUnaryEquation('abs(3x+2)=7')!;c.branches.pop();expect(verifyUnaryCertificate(c)).toBe(false);
 });
 it('accepts a request for a complete domain check after the equation',()=>{
  const result=unaryEquationLesson('Giải phương trình $\\sqrt{x+5}=x-1$ và trình bày bước kiểm tra điều kiện đầy đủ.');
  expect(result).not.toBeNull();
  expect(result!.lesson.finalAnswer.text).toContain('x=4');
  expect(result!.lesson.steps.at(-1)!.explanation).toContain('Không có nghiệm khác');
 });
 it('isolates a single radical from a polynomial sum before squaring',()=>{
  const certificate=exactUnaryEquation('x^2-4x+2\\sqrt{2x-1}+1=0');
  expect(isolateUnaryTerm('x^2-4x+2\\sqrt{2x-1}+1=0')).toContain('sqrt');
  expect(exactPolynomialRoots([5n,-16n,18n,-8n,1n])).toHaveLength(2);
  expect(exactRationalEquation('((2*x)-1)=((-(x^2-4*x+1))/2)^2')).not.toBeNull();
  expect(certificate).not.toBeNull();
  const result=unaryEquationLesson('Giải phương trình $x^2-4x+2\\sqrt{2x-1}+1=0$.');
  expect(result).not.toBeNull();
  expect(result!.lesson.finalAnswer.text).toContain('x=1');
  expect(result!.lesson.steps.some(step=>step.math?.includes('(x-1)^{3}(x-5)'))).toBe(true);
  expect(result!.lesson.steps[0]!.explanation).toContain('không âm');
 });
});
