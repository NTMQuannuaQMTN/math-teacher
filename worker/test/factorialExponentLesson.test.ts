import {describe,it,expect} from 'vitest';
import {factorialExponentLesson,verifyFactorialExponentCertificate} from '../src/solver/factorialExponentLesson';
import {latexFeedback} from '../src/solver/latexCheck';
import {cleanLanguage} from '../../shared/src/language';
import {ModelLessonSchema} from '../../shared/src/solution';
import {solveProblem} from '../src/solver/pipeline';
import {VN_GRADE_9} from '../src/solver/curriculum';
import {problemDomains} from '../../shared/src/knowledgeBase';
const question=(expression:string,p=2,k='k')=>`Tìm số nguyên không âm $${k}$ lớn nhất sao cho $${expression}$ chia hết cho $${p}^${k}$.`;
const factorial=(n:number)=>{let value=1n;for(let i=2;i<=n;i++)value*=BigInt(i);return value;};
const exponent=(value:bigint,p:number)=>{let e=0;while(value%BigInt(p)===0n){e++;value/=BigInt(p);}return e;};
describe('factorial exponent proofs count every prime factor and prove maximality',()=>{
 it('routes trailing digits to Number Theory and returns the certified proof without inference',async()=>{
  const text='Tìm số chữ số $0$ tận cùng của $100!$.';
  expect(problemDomains(text)).toContain('number_theory');
  const model={name:'disabled',model:'disabled',complete:async()=>{throw Error('Unexpected inference');}};
  const result=await solveProblem(model,VN_GRADE_9,text,{signal:AbortSignal.timeout(1000)});
  expect(result.model).toBe('deterministic-number-theory');expect(result.lesson.finalAnswer.text).toContain('$24$');expect(result.verification.status).toBe('verified');
  expect(problemDomains('Có bao nhiêu cách sắp xếp5 người thành một hàng?')).not.toContain('number_theory');
 });
 it.each([[50,3,22],[100,5,24],[0,2,0],[1,2,0],[10,7,1]])('certifies %s! at prime %s',(n,p,e)=>{
  const r=factorialExponentLesson(question(`${n}!`,p))!;expect(r).not.toBeNull();expect(r.certificate.exponent).toBe(e);
  expect(verifyFactorialExponentCertificate(r.certificate)).toBe(true);expect(latexFeedback(r.lesson)).toEqual([]);expect(cleanLanguage(r.lesson).feedback).toEqual([]);expect(ModelLessonSchema.safeParse(r.lesson).success).toBe(true);
 });
 it.each([0,1,4,5,24,25,100])('matches actual decimal trailing zeros for %s!',n=>{
  const r=factorialExponentLesson(`Tìm số chữ số $0$ tận cùng của $${n}!$.`)!;
  const trailing=/0*$/.exec(String(factorial(n)))![0].length;expect(r.certificate.exponent).toBe(trailing);expect(verifyFactorialExponentCertificate(r.certificate)).toBe(true);
  expect(r.lesson.steps.some(s=>s.explanation.includes('không thể thêm chữ số0'))).toBe(true);
  expect(r.lesson.steps.map(s=>s.explanation).join(' ')).not.toContain('Nếu $1=0$');
  if(n===0)expect(r.lesson.steps.map(s=>s.explanation).join(' ')).not.toContain('1,2,');
 });
 it('matches exact integer factorial quotients across every binomial of size up to25',()=>{
  for(let n=0;n<=25;n++)for(let a=0;a<=n;a++)for(const p of [2,3,5,7]){
   const expression=`\\dfrac{${n}!}{${a}!${n-a}!}`,r=factorialExponentLesson(question(expression,p))!;
   expect(r,`${n},${a},${p}`).not.toBeNull();expect(r.certificate.exponent).toBe(exponent(factorial(n)/(factorial(a)*factorial(n-a)),p));
   expect(verifyFactorialExponentCertificate(r.certificate)).toBe(true);
  }
 });
 it('never treats a nonintegral factorial quotient or composite base as an admitted task',()=>{
  expect(factorialExponentLesson(question('\\frac{3!}{2!2!}'))).toBeNull();
  expect(factorialExponentLesson(question('10!',4))).toBeNull();
  expect(factorialExponentLesson(question('10001!'))).toBeNull();
  expect(factorialExponentLesson(question('10!')+' Và $k>20$.')).toBeNull();
  expect(factorialExponentLesson(question('10!+1'))).toBeNull();
  expect(factorialExponentLesson(question('10!').replace('2^k','2^{k'))).toBeNull();
  expect(factorialExponentLesson(question('10!').replace('2^k','2^k}'))).toBeNull();
  expect(factorialExponentLesson(question('10!').replace('2^k','2^{k}'))).not.toBeNull();
 });
 it('rejects omitted levels, altered contributions and an exaggerated exponent',()=>{
  const c=factorialExponentLesson(question('100!',5))!.certificate;
  expect(verifyFactorialExponentCertificate({...c,rows:c.rows.slice(1)})).toBe(false);
  expect(verifyFactorialExponentCertificate({...c,exponent:c.exponent+1})).toBe(false);
  expect(verifyFactorialExponentCertificate({...c,rows:c.rows.map((r,i)=>i? r:{...r,net:r.net+1})})).toBe(false);
 });
 it('keeps a renamed unknown distinct from the index used to count prime-power levels',()=>{
  const r=factorialExponentLesson(question('50!',3,'j'))!;
  expect(r.lesson.steps[1]!.explanation).toContain('$i$');
  expect(r.lesson.finalAnswer.text).toContain('$j=22$');
  expect(latexFeedback(r.lesson)).toEqual([]);
 });
});
