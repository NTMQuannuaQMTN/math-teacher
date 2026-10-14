import {describe,it,expect} from 'vitest';
import {radicalSequenceDivisibilityLesson,verifySequenceDivisibilityCertificate} from '../src/solver/radicalSequenceDivisibility';
import {latexFeedback} from '../src/solver/latexCheck';
import {cleanLanguage} from '../../shared/src/language';
import {verifyLesson} from '../../shared/src/verify';
const question=(m:number)=>`Với mỗi số tự nhiên $n$, đặt $a_n=\\left(2+\\sqrt3\\right)^n+\\left(2-\\sqrt3\\right)^n$. Tìm $n$ để $a_n$ chia hết cho ${m}.`;
describe('radical-sequence divisibility uses an actual complete pair-state cycle',()=>{
 it.each([[4,2,[1]],[14,8,[2,6]]])('proves integrality and complete period modulo%s',(m,period,zeros)=>{
  const text=question(m as number),r=radicalSequenceDivisibilityLesson(text)!;
  expect(r).not.toBeNull();expect(r.certificate.period).toBe(period);expect(r.certificate.prefix).toBe(0);expect(r.certificate.cycleZeros).toEqual(zeros);expect(verifySequenceDivisibilityCertificate(r.certificate)).toBe(true);
  expect(latexFeedback(r.lesson)).toEqual([]);expect(cleanLanguage(r.lesson).feedback).toEqual([]);expect(verifyLesson(r.lesson,{problemText:text}).verification.status).not.toBe('unverified');
  // Independent integer recurrence across many periods; certificate has a universal pair-cycle argument.
  let a=2n,b=4n;for(let n=0;n<500;n++){expect((a%BigInt(m as number))===0n,String(n)).toBe((zeros as number[]).includes(n%(period as number)));[a,b]=[b,4n*b-a];}
 });
 it('rejects a truncated cycle, wrong transition and omitted valid residue',()=>{
  const c=radicalSequenceDivisibilityLesson(question(14))!.certificate;
  expect(verifySequenceDivisibilityCertificate({...c,states:c.states.slice(0,4),period:4})).toBe(false);
  expect(verifySequenceDivisibilityCertificate({...c,cycleZeros:[2]})).toBe(false);
  expect(verifySequenceDivisibilityCertificate({...c,states:c.states.map((s,i)=>i===3?[10,11]:s)})).toBe(false);
  expect(verifySequenceDivisibilityCertificate({...c,product:-1})).toBe(false);
 });
 it('generalizes to another conjugate pair and handles a nonzero prefix',()=>{
  const r=radicalSequenceDivisibilityLesson('Với mỗi số tự nhiên $j$, đặt $b_j=(3+\\sqrt5)^j+(3-\\sqrt5)^j$. Tìm $j$ để $b_j$ chia hết cho 4.')!;
  expect(r).not.toBeNull();expect(r.certificate.sum).toBe(6);expect(r.certificate.product).toBe(4);expect(r.certificate.prefix).toBeGreaterThan(0);expect(verifySequenceDivisibilityCertificate(r.certificate)).toBe(true);
  let a=2n,b=6n;for(let j=0;j<100;j++){const c=r.certificate,accepted=j<c.prefix?c.prefixZeros.includes(j):c.cycleZeros.includes((j-c.prefix)%c.period);expect(a%4n===0n,String(j)).toBe(accepted);[a,b]=[b,6n*b-4n*a];}
 });
 it('declines zero bases, noninteger recurrences and extra conditions',()=>{
  expect(radicalSequenceDivisibilityLesson('Với mỗi số tự nhiên $n$, đặt $a_n=0^n+2^n$. Tìm $n$ để $a_n$ chia hết cho 4.')).toBeNull();
  expect(radicalSequenceDivisibilityLesson('Với mỗi số tự nhiên $n$, đặt $a_n=(1+\\sqrt2)^n+3^n$. Tìm $n$ để $a_n$ chia hết cho 4.')).toBeNull();
  expect(radicalSequenceDivisibilityLesson(question(4)+' Chỉ lấy chỉ số lớn hơn10.')).toBeNull();
 });
 it('keeps the family parameter distinct from an index already called k',()=>{
  const r=radicalSequenceDivisibilityLesson('Với mỗi số tự nhiên $k$, đặt $b_k=(2+\\sqrt3)^k+(2-\\sqrt3)^k$. Tìm $k$ để $b_k$ chia hết cho 14.')!;
  expect(r.lesson.finalAnswer.text).toContain('k=2+8t');expect(r.lesson.finalAnswer.text).not.toContain('k=2+8k');expect(verifySequenceDivisibilityCertificate(r.certificate)).toBe(true);
 });
 it('does not give the two bases the same name as the index or sequence',()=>{
  const r=radicalSequenceDivisibilityLesson('Với mỗi số tự nhiên $p$, đặt $b_p=(2+\\sqrt3)^p+(2-\\sqrt3)^p$. Tìm $p$ để $b_p$ chia hết cho 14.')!;
  expect(r.lesson.steps[0]!.explanation).toContain('Đặt $q=');expect(r.lesson.steps[0]!.math).toContain('b_p= q^{p}+r^{p}');expect(r.lesson.steps[2]!.math).toContain('q^{p+2}');expect(verifySequenceDivisibilityCertificate(r.certificate)).toBe(true);expect(latexFeedback(r.lesson)).toEqual([]);
 });
});
