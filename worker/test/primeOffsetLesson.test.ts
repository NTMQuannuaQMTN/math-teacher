import {describe,it,expect} from 'vitest';
import {primeOffsetLesson,verifyPrimeOffsetCertificate} from '../src/solver/primeOffsetLesson';
import {latexFeedback} from '../src/solver/latexCheck';
import {cleanLanguage} from '../../shared/src/language';
import {verifyLesson} from '../../shared/src/verify';
describe('prime residue cover proves finite completeness, not sample patterns',()=>{
 it.each([['p+2','p+4',[3]],['p+4','p+8',[3]],['p-2','p+2',[5]],['p+1','p+2',[]]] as const)('solves %s,%s with every exceptional candidate checked',(a,b,expected)=>{
  const text=`Tìm tất cả các số nguyên tố $p$ sao cho $${a}$ và $${b}$ cũng là số nguyên tố.`,r=primeOffsetLesson(text)!;
  expect(r).not.toBeNull();expect(r.certificate.solutions).toEqual(expected);expect(verifyPrimeOffsetCertificate(r.certificate)).toBe(true);
  expect(latexFeedback(r.lesson)).toEqual([]);expect(cleanLanguage(r.lesson).feedback).toEqual([]);expect(verifyLesson(r.lesson,{problemText:text}).verification.status).not.toBe('unverified');
 });
 it('requires a full residue cover; cannot extrapolate an unbounded prime search',()=>{
  expect(primeOffsetLesson('Tìm tất cả các số nguyên tố $p$ sao cho $p+2$ và $p+6$ cũng là số nguyên tố.')).toBeNull();
  expect(primeOffsetLesson('Tìm tất cả các số nguyên tố $p$ sao cho $2p+2$ và $p+4$ cũng là số nguyên tố.')).toBeNull();
 });
 it('retains every condition; refuses extra clauses and later subquestions',()=>{
  expect(primeOffsetLesson('Tìm tất cả các số nguyên tố $p$ sao cho $p+2$ và $p+4$ cũng là số nguyên tố và $p>3$.')).toBeNull();
 });
 it('rejects a missing residue/candidate, nonprime answer and fake composite divisor',()=>{
  const c=primeOffsetLesson('Tìm tất cả các số nguyên tố $p$ sao cho $p-2$ và $p+2$ cũng là số nguyên tố.')!.certificate;
  expect(verifyPrimeOffsetCertificate({...c,cover:[...c.cover.slice(1)]})).toBe(false);
  expect(verifyPrimeOffsetCertificate({...c,candidates:c.candidates.slice(1)})).toBe(false);
  expect(verifyPrimeOffsetCertificate({...c,solutions:[3]})).toBe(false);
  expect(verifyPrimeOffsetCertificate({...c,compositeDivisors:c.compositeDivisors.map(row=>row.map(()=>null))})).toBe(false);
 });
});
