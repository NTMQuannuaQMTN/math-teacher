import {describe,it,expect} from 'vitest';
import {quadraticWitnessLesson,verifyQuadraticWitnessCertificate} from '../src/solver/quadraticWitnessLesson';
import {latexFeedback} from '../src/solver/latexCheck';
import {cleanLanguage} from '../../shared/src/language';
import {solveProblem} from '../src/solver/pipeline';
import {VN_GRADE_9} from '../src/solver/curriculum';
const text='Số nguyên dương $n$ được gọi là số đẹp nếu tồn tại các số nguyên $a,b$ sao cho $n=a^2+7b^2$. Tìm hai số đẹp có hai chữ số và chia hết cho 11.';
describe('bounded quadratic-form existence names every promised witness',()=>{
 it('gives two distinct actual numbers and a,b for each, not an unsupported existence claim',async()=>{
  const r=quadraticWitnessLesson(text)!;expect(r).not.toBeNull();expect(r.certificate.witnesses).toEqual([{number:11,a:2,b:1},{number:44,a:4,b:2}]);expect(verifyQuadraticWitnessCertificate(r.certificate)).toBe(true);
  expect(latexFeedback(r.lesson)).toEqual([]);expect(cleanLanguage(r.lesson).feedback).toEqual([]);expect(r.lesson.finalAnswer.text).toContain('(2,1), (4,2)');
  const unavailable={name:'unavailable',model:'unavailable',complete:async()=>{throw Error('must not use inference');}};
  const result=await solveProblem(unavailable,VN_GRADE_9,text,{signal:AbortSignal.timeout(1000)});expect(result.model).toBe('deterministic-number-theory');expect(result.attempts).toBe(0);expect(result.verification.status).toBe('verified');
 });
 it('honors count, coefficient, digits and variable renaming',()=>{
  const three=quadraticWitnessLesson(text.replace('Tìm hai','Tìm ba'))!;expect(three.certificate.witnesses).toHaveLength(3);expect(verifyQuadraticWitnessCertificate(three.certificate)).toBe(true);
  const renamed=text.replace(/\$([^$]+)\$/g,(_,math:string)=>`$${math.replace(/n/g,'k').replace(/a/g,'x').replace(/b/g,'y')}$`);
  expect(quadraticWitnessLesson(renamed)).not.toBeNull();
  const other=quadraticWitnessLesson(text.replace('7b^2','b^2').replace('11.','7.'))!;expect(verifyQuadraticWitnessCertificate(other.certificate)).toBe(true);
  expect(quadraticWitnessLesson(text.replace('Tìm hai','Tìm Hai'))!.certificate.witnesses).toHaveLength(2);
 });
 it('rejects duplicate, wrong arithmetic, wrong range or nonmultiple witnesses',()=>{
  const c=quadraticWitnessLesson(text)!.certificate;
  expect(verifyQuadraticWitnessCertificate({...c,witnesses:[c.witnesses[0]!,c.witnesses[0]!]})).toBe(false);
  expect(verifyQuadraticWitnessCertificate({...c,witnesses:c.witnesses.map((w,i)=>i?{...w,a:3}:w)})).toBe(false);
  expect(verifyQuadraticWitnessCertificate({...c,witnesses:[{number:4,a:2,b:0},c.witnesses[1]!]})).toBe(false);
 });
 it('does not invent a witness when search finds too few, nor ignore extra constraints',()=>{
  expect(quadraticWitnessLesson(text.replace('11.','99.'))).toBeNull(); // only one two-digit multiple exists
  expect(quadraticWitnessLesson(text+' Chỉ lấy số nhỏ hơn20.')).toBeNull();
  expect(quadraticWitnessLesson(text.replace('7b^2','7b^2+ab'))).toBeNull();
 });
});
