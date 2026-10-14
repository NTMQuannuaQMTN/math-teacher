import {describe,it,expect} from 'vitest';
import {divisorCountLesson,verifyDivisorCountCertificate} from '../src/solver/divisorCountLesson';
import {latexFeedback} from '../src/solver/latexCheck';
import {cleanLanguage} from '../../shared/src/language';
const text='Tìm số nguyên dương $n$ có đúng 6 ước nguyên dương và $n<100$.';
describe('six-divisor classification with exhaustive bounds',()=>{
 it('lists all values and explains the two forms and distinct primes',()=>{
  const r=divisorCountLesson(text)!;expect(r).not.toBeNull();
  expect(r.certificate.rows.map(r=>r.value)).toEqual([12,18,20,28,32,44,45,50,52,63,68,75,76,92,98,99]);
  expect(verifyDivisorCountCertificate(r.certificate)).toBe(true);
  expect(divisorCountLesson('Tìm tất cả các số nguyên dương có đúng $6$ ước dương và nhỏ hơn $100$.')!.certificate.rows).toEqual(r.certificate.rows);
  expect(r.lesson.steps.map(s=>s.explanation).join('\n')).toContain('Không được lấy $p=q$');
  expect(latexFeedback(r.lesson)).toEqual([]);expect(cleanLanguage(r.lesson).feedback).toEqual([]);
 });
 it('handles inclusive bounds, small empty ranges and renamed variables',()=>{
  const r=divisorCountLesson(text.replace('n<100','n\\le 12'))!;expect(r.certificate.rows.map(r=>r.value)).toEqual([12]);
  const empty=divisorCountLesson(text.replace('100','12'))!;expect(empty.certificate.rows).toEqual([]);
  expect(divisorCountLesson(text.replace('$n$','$t$').replace('$n<100$','$t<100$'))!.certificate.task.variable).toBe('t');
  const renamed=divisorCountLesson(text.replace('$n$','$p$').replace('$n<100$','$p<100$'))!;
  expect(renamed.lesson.steps[1]!.math).toContain('p\\in\\{q^5,q^2r');expect(verifyDivisorCountCertificate(renamed.certificate)).toBe(true);
 });
 it('rejects omitted, added or misfactorized numbers independently',()=>{
  const c=divisorCountLesson(text)!.certificate;
  expect(verifyDivisorCountCertificate({...c,rows:c.rows.slice(1)})).toBe(false);
  expect(verifyDivisorCountCertificate({...c,rows:[...c.rows,{value:100,p:2,q:25}]})).toBe(false);
  expect(verifyDivisorCountCertificate({...c,rows:c.rows.map((r,i)=>i?r:{...r,p:3})})).toBe(false);
 });
 it('does not discard extra conditions, other divisor counts or unbounded tasks',()=>{
  expect(divisorCountLesson(text+' Và n là số chẵn.')).toBeNull();
  expect(divisorCountLesson(text.replace('6 ước','8 ước'))).toBeNull();
  expect(divisorCountLesson(text.replace('100','10000'))).toBeNull();
  expect(divisorCountLesson(text.replace(' và $n<100$',''))).toBeNull();
 });
});
