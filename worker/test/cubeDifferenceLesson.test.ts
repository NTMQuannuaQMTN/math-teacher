import {describe,it,expect} from 'vitest';
import {cubeDifferenceLesson,cubeDifferenceCertificate,verifyCubeDifferenceCertificate} from '../src/solver/cubeDifferenceLesson';
import {latexFeedback} from '../src/solver/latexCheck';
import {cleanLanguage} from '../../shared/src/language';
import {solveProblem} from '../src/solver/pipeline';
import {VN_GRADE_9} from '../src/solver/curriculum';
const task=(c:number,positive=false)=>`Tìm tất cả các cặp số nguyên${positive?' dương':''} $(x,y)$ thỏa mãn $x^3-y^3=${c}$.`;
describe('cube difference equations prove a complete finite bound before checking solutions',()=>{
 it.each([[7,[[-1,-2],[2,1]]],[9,[[1,-2],[2,-1]]],[2,[[1,-1]]],[-7,[[-2,-1],[1,2]]],[1,[[0,-1],[1,0]]]])('finds all signed solutions of difference%s',(c,expected)=>{
  const r=cubeDifferenceLesson(task(c as number))!;expect(r).not.toBeNull();expect(r.certificate.pairs).toEqual(expected);
  expect(verifyCubeDifferenceCertificate(r.certificate)).toBe(true);expect(latexFeedback(r.lesson)).toEqual([]);expect(cleanLanguage(r.lesson).feedback).toEqual([]);
  expect(r.lesson.steps[3]!.explanation).toContain('12\\cdot(');expect(r.lesson.steps[3]!.explanation).not.toContain('\\pmt');
 });
 it('keeps the positive domain and gives an explicit witness for the infinite equal family',()=>{
  const none=cubeDifferenceLesson(task(9,true))!;expect(none.certificate.pairs).toEqual([]);expect(none.lesson.finalAnswer.text).toContain('không có');
  const explanation=none.lesson.steps.map(s=>s.explanation).join(' ');
  expect(explanation).toContain('(1,-2)');expect(explanation).toContain('(2,-1)');expect(explanation).toContain('có tọa độ không dương');expect(explanation).toContain('10^2<105<11^2');
  for(const positive of [true,false]){const equal=cubeDifferenceLesson(task(0,positive))!;expect(equal.certificate.all).toBe(true);expect(equal.lesson.steps[2]!.explanation).toContain('(1,1)');expect(verifyCubeDifferenceCertificate(equal.certificate)).toBe(true);}
 });
 it('independently matches a direct original-cube enumeration for every nonzero constant through200',()=>{
  for(let c=-200;c<=200;c++)if(c)for(const positive of [true,false]){
   const cert=cubeDifferenceCertificate(task(c,positive))!;expect(cert).not.toBeNull();
   // Factorization proves x²+y²<=2|c|, so the integer box is exhaustive.
   const bound=Math.floor(Math.sqrt(2*Math.abs(c))),expected:number[][]=[];
   for(let x=-bound;x<=bound;x++)for(let y=-bound;y<=bound;y++)if((!positive||x>0&&y>0)&&x*x*x-y*y*y===c)expected.push([x,y]);
   expect(cert.pairs,`${c},${positive}`).toEqual(expected);expect(verifyCubeDifferenceCertificate(cert)).toBe(true);
  }
 });
 it('rejects a missing solution, shortened divisor list, fake root and unproved smaller box',()=>{
  const c=cubeDifferenceLesson(task(7))!.certificate;
  expect(verifyCubeDifferenceCertificate({...c,pairs:c.pairs.slice(1)})).toBe(false);
  expect(verifyCubeDifferenceCertificate({...c,rows:c.rows.slice(1)})).toBe(false);
  expect(verifyCubeDifferenceCertificate({...c,rows:c.rows.map((r,i)=>i?r:{...r,root:1})})).toBe(false);
  expect(verifyCubeDifferenceCertificate({...c,bound:c.bound-1})).toBe(false);
 });
 it('declines changed terms, extra restrictions, fractional constants and unbounded output',()=>{
  expect(cubeDifferenceLesson(task(7)+' Và $x>0$.')).toBeNull();expect(cubeDifferenceLesson(task(7).replace('x^3-y^3','x^3+y^3'))).toBeNull();
  expect(cubeDifferenceLesson(task(7).replace('=7','=7/2'))).toBeNull();expect(cubeDifferenceLesson(task(1001))).toBeNull();
  expect(cubeDifferenceLesson(task(7).replace('x^3-y^3','x^{3}-y^{3}'))).not.toBeNull();
 });
 it('returns a complete certified application answer without inference',async()=>{
  const model={name:'disabled',model:'disabled',complete:async()=>{throw Error('Unexpected inference');}};
  const r=await solveProblem(model,VN_GRADE_9,task(7),{signal:AbortSignal.timeout(1000)});expect(r.model).toBe('deterministic-number-theory');expect(r.verification.status).toBe('verified');
 });
});
