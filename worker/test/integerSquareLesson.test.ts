import {describe,it,expect} from 'vitest';
import {integerSquareLesson,integerSquareCertificate,verifyIntegerSquareCertificate} from '../src/solver/integerSquareLesson';
import {latexFeedback} from '../src/solver/latexCheck';
import {cleanLanguage} from '../../shared/src/language';
import {verifyLesson} from '../../shared/src/verify';
describe('square conditions are complete in the original integer domain',()=>{
 it('agrees with every square in the proved finite bound for signed constants and all three domains',()=>{
  for(let c=-200;c<=200;c++)for(const domain of ['số nguyên','số nguyên dương','số tự nhiên']){
   const text=`Tìm tất cả các ${domain} $n$ sao cho $n^2${c>=0?'+':''}${c}$ là số chính phương.`,cert=integerSquareCertificate(text)!;
   expect(cert,`${domain},${c}`).not.toBeNull();expect(verifyIntegerSquareCertificate(cert)).toBe(true);
   if(c===0){expect(cert.kind).toBe('gap');if(cert.kind==='gap')expect(cert.all).toBe(true);continue;}
   // For nonzero c, (root-n)(root+n)=c bounds both factors by |c|,
   // hence |n|<=|c|. This is the complete interval, not a heuristic sample.
   const expected:number[]=[];
   for(let n=-Math.abs(c);n<=Math.abs(c);n++){
    if(domain==='số nguyên dương'&&n<=0||domain==='số tự nhiên'&&n<0)continue;
    const value=n*n+c,root=value>=0?Math.round(Math.sqrt(value)):-1;
    if(root>=0&&root*root===value)expected.push(n);
   }
   expect(cert.kind==='gap'?cert.solutions:[],`${domain},${c}`).toEqual(expected);
  }
 });
 it.each([[15,[-7,-1,1,7]],[4,[0]],[-3,[-2,2]],[-4,[-2,2]]])('uses all signed factors for n²+%s',(constant,expected)=>{
  const text=`Tìm tất cả các số nguyên $n$ sao cho $n^2${constant as number>=0?'+':''}${constant}$ là số chính phương.`,r=integerSquareLesson(text)!;
  expect(r).not.toBeNull();expect(r.certificate.kind).toBe('gap');if(r.certificate.kind==='gap')expect(r.certificate.solutions).toEqual(expected);
  expect(verifyIntegerSquareCertificate(r.certificate)).toBe(true);expect(latexFeedback(r.lesson)).toEqual([]);expect(cleanLanguage(r.lesson).feedback).toEqual([]);expect(verifyLesson(r.lesson,{problemText:text}).verification.status).not.toBe('unverified');
 });
 it('preserves positivity, zero and the infinite all-integer case',()=>{
  const positive=integerSquareLesson('Tìm tất cả các số nguyên dương $n$ sao cho $n^2+4$ là số chính phương.')!;
  expect(positive.lesson.finalAnswer.text).toContain('không có');
  expect(integerSquareLesson('Tìm tất cả các số tự nhiên $n$ sao cho $n^2+4$ là số chính phương.')!.lesson.finalAnswer.text).toContain('\\{0\\}');
  const all=integerSquareLesson('Tìm tất cả các số nguyên $n$ sao cho $n^2$ là số chính phương.')!;
  expect(all.lesson.finalAnswer.text).toContain('mọi');expect(verifyIntegerSquareCertificate(all.certificate)).toBe(true);
 });
 it.each(['n^2+2','n^4+2'])('proves disjoint residue sets for %s',(expression)=>{
  const r=integerSquareLesson(`Tìm tất cả các số nguyên $n$ sao cho $${expression}$ là số chính phương.`)!;
  expect(r.certificate.kind).toBe('obstruction');expect(r.lesson.finalAnswer.text).toContain('không có');expect(verifyIntegerSquareCertificate(r.certificate)).toBe(true);
 });
 it('certificate rejects a missing signed solution or row; no false residue obstruction',()=>{
  const c=integerSquareLesson('Tìm tất cả các số nguyên $n$ sao cho $n^2+15$ là số chính phương.')!.certificate;
  if(c.kind!=='gap')throw Error('expected factor certificate');
  expect(verifyIntegerSquareCertificate({...c,solutions:c.solutions.slice(1)})).toBe(false);expect(verifyIntegerSquareCertificate({...c,rows:c.rows.slice(1)})).toBe(false);
  expect(integerSquareLesson('Tìm tất cả các số nguyên $n$ sao cho $n^3+2$ là số chính phương.')).toBeNull(); // n=-1 gives1
  expect(integerSquareLesson('Tìm tất cả các số nguyên $n$ sao cho $n^4+3$ là số chính phương.')).toBeNull(); // n=1 gives4; no false impossibility
 });
 it('declines additional conditions instead of silently solving a different question',()=>{
  expect(integerSquareLesson('Tìm tất cả các số nguyên $n$ sao cho $n^2+15$ là số chính phương và $n>0$.')).toBeNull();
 });
 it('introduces a distinct square root and factors when the input is t or u',()=>{
  const t=integerSquareLesson('Tìm tất cả các số nguyên $t$ sao cho $t^2-7$ là số chính phương.')!;
  expect(t.lesson.steps[0]!.math).toContain('s^2-t^2=-7');expect(t.lesson.steps[0]!.explanation).toContain('$u=s-t$');expect(latexFeedback(t.lesson)).toEqual([]);
  const u=integerSquareLesson('Tìm tất cả các số nguyên $u$ sao cho $u^2+15$ là số chính phương.')!;
  expect(u.lesson.steps[0]!.explanation).not.toContain('$u=t-u$');expect(u.lesson.steps[0]!.explanation).toContain('$v=t-u$');expect(verifyIntegerSquareCertificate(u.certificate)).toBe(true);
 });
});
