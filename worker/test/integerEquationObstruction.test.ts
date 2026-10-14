import {describe,it,expect} from 'vitest';
import {integerEquationObstructionLesson,verifyEquationObstructionCertificate} from '../src/solver/integerEquationObstruction';
import {latexFeedback} from '../src/solver/latexCheck';
import {cleanLanguage} from '../../shared/src/language';
import {verifyLesson} from '../../shared/src/verify';
describe('integer-equation impossibility is proved for all residues, never a bounded sample',()=>{
 it.each(['n^3+(n+1)^3=100','n^2=5'])('proves %s impossible by a complete residue obstruction',equation=>{
  const text=`Chứng minh không có số nguyên $n$ sao cho $${equation}$.`,r=integerEquationObstructionLesson(text)!;
  expect(r).not.toBeNull();expect(r.certificate.residues.zeros).toEqual([]);expect(verifyEquationObstructionCertificate(r.certificate)).toBe(true);expect(latexFeedback(r.lesson)).toEqual([]);expect(cleanLanguage(r.lesson).feedback).toEqual([]);expect(verifyLesson(r.lesson,{problemText:text}).verification.status).not.toBe('unverified');
 });
 it('does not turn a real solution into a modular impossibility',()=>{
  expect(integerEquationObstructionLesson('Chứng minh không có số nguyên $n$ sao cho $n^3+(n+1)^3=9$.')).toBeNull(); // n=1
  expect(integerEquationObstructionLesson('Chứng minh không có số nguyên $n$ sao cho $n^2=4$.')).toBeNull(); // ±2
 });
 it('rejects altered variable, original equation or residue table',()=>{
  const c=integerEquationObstructionLesson('Chứng minh không có số nguyên $n$ sao cho $n^2=5$.')!.certificate;
  expect(verifyEquationObstructionCertificate({...c,residues:{...c.residues,zeros:[0]}})).toBe(false);
  expect(verifyEquationObstructionCertificate({...c,task:{...c.task,expression:'n^2-4'}})).toBe(false);
 });
 it('rejects rational expression domains and additional conditions',()=>{
  expect(integerEquationObstructionLesson('Chứng minh không có số nguyên $n$ sao cho $n/n=1$.')).toBeNull();
  expect(integerEquationObstructionLesson('Chứng minh không có số nguyên $n$ sao cho $n^2=5$ và $n>0$.')).toBeNull();
 });
});
