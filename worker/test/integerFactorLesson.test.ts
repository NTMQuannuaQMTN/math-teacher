import {describe,it,expect} from 'vitest';
import {integerFactorLesson,integerFactorCertificate,verifyIntegerFactorCertificate} from '../src/solver/integerFactorLesson';
import {latexFeedback} from '../src/solver/latexCheck';
import {cleanLanguage} from '../../shared/src/language';
import {solveProblem} from '../src/solver/pipeline';
import {VN_GRADE_9} from '../src/solver/curriculum';

describe('factor equations retain the WHOLE domain and all solution families',()=>{
 it('matches complete original-equation enumerations under both domains and all inequality directions',()=>{
  const sign=(v:number)=>v>=0?`+${v}`:String(v);
  for(const a of [-3,0,4])for(const b of [-3,0,4])for(const product of [-18,-7,-1,1,6,18])for(const positive of [false,true])for(const operator of ['', '>', '<', '>=', '<=']){
   const c=product-a*b,D=Math.abs(product);
   const text=`Tìm tất cả các cặp số nguyên${positive?' dương':''} $(x,y)$ thỏa mãn $xy${sign(a)}x${sign(b)}y=${c}$${operator?` và $x${operator}2$`:''}.`;
   const cert=integerFactorCertificate(text)!;expect(cert,text).not.toBeNull();expect(verifyIntegerFactorCertificate(cert)).toBe(true);
   // Every nonzero integer factor of product has magnitude <=D. Therefore
   // the shifted original coordinates lie in these complete finite intervals.
   const expected:string[]=[];
   for(let x=-b-D;x<=-b+D;x++)for(let y=-a-D;y<=-a+D;y++){
    if(positive&&(x<=0||y<=0))continue;
    if(operator==='>'&&x<=2||operator==='<'&&x>=2||operator==='>='&&x<2||operator==='<='&&x>2)continue;
    if(x*y+a*x+b*y===c)expected.push(`${x},${y}`);
   }
   expect(cert.pairs.map(p=>p.join(',')).sort(),text).toEqual(expected.sort());
  }
 });
 it('repairs the actual positive-integer failure: negative and zero coordinates excluded',async()=>{
  const text='Tìm tất cả các cặp số nguyên dương $(x,y)$ thỏa mãn $xy-3x-4y=8$.';
  const r=integerFactorLesson(text)!;
  const expected:number[][]=[];for(let x=1;x<=24;x++)for(let y=1;y<=23;y++)if(x*y-3*x-4*y===8)expected.push([x,y]);
  expect(r.certificate.pairs).toEqual(expected);expect(expected).toHaveLength(6);expect(verifyIntegerFactorCertificate(r.certificate)).toBe(true);
  expect(latexFeedback(r.lesson)).toEqual([]);expect(cleanLanguage(r.lesson).feedback).toEqual([]);
  const unavailable={name:'unavailable',model:'unavailable',complete:async()=>{throw Error('no inference permitted');}};
  const result=await solveProblem(unavailable,VN_GRADE_9,text,{signal:AbortSignal.timeout(1000)});
  expect(result.model).toBe('deterministic-number-theory');expect(result.lesson.finalAnswer.text).not.toContain('(-16,2)');
 });
 it.each([
  ['Tìm tất cả các cặp số nguyên $(x,y)$ thỏa mãn $xy-3x-4y=-12$.',['first','second']],
  ['Tìm tất cả các cặp số nguyên dương $(a,b)$ thỏa mãn $ab+3a-4b=12$.',['first']],
  ['Tìm tất cả các cặp số nguyên dương $(a,b)$ thỏa mãn $ab+3a+4b=-12$.',[]],
 ] as const)('covers infinite zero-product cases without division by zero: %s',(text,families)=>{
  const r=integerFactorLesson(text)!;expect(r.certificate.families).toEqual(families);expect(verifyIntegerFactorCertificate(r.certificate)).toBe(true);
  expect(r.certificate.divisors).toEqual([]);expect(latexFeedback(r.lesson)).toEqual([]);
 });
 it('checks a negative nonzero product and every signed divisor',()=>{
  const r=integerFactorLesson('Tìm tất cả các cặp số nguyên $(a,b)$ thỏa mãn $ab+2a+3b=-14$.')!;
  const expected:number[][]=[];for(let a=-11;a<=5;a++)for(let b=-10;b<=6;b++)if(a*b+2*a+3*b===-14)expected.push([a,b]);
  expect(r.certificate.pairs).toEqual(expected);expect(verifyIntegerFactorCertificate(r.certificate)).toBe(true);
  expect(verifyIntegerFactorCertificate({...r.certificate,pairs:r.certificate.pairs.slice(1)})).toBe(false);
  expect(verifyIntegerFactorCertificate({...r.certificate,product:8})).toBe(false);
 });
 it('never drops additional conditions or a later subquestion',()=>{
  for(const text of [
   'Tìm tất cả các cặp số nguyên $(x,y)$ thỏa mãn $xy-3x-4y=8$ và $x>4$. Và $y<10$.',
   'Tìm tất cả các cặp số nguyên $(x,y)$ thỏa mãn $xy-3x-4y=-12$ và $x>4$.',
   'Tìm tất cả các cặp số nguyên $(x,y)$ thỏa mãn $xy-3x-4y=8$. Tính tích lớn nhất.',
   'Tìm tất cả các cặp số nguyên $(x,y)$ thỏa mãn $2xy-3x-4y=8$.',
  ])expect(integerFactorLesson(text)).toBeNull();
 });
 it('applies a parsed extra inequality to every finite candidate and shows rejected rows',()=>{
  const text='Tìm tất cả các cặp số nguyên $(x,y)$ thỏa mãn $xy-3x-4y=8$ và $x>4$.';
  const r=integerFactorLesson(text)!;const expected:number[][]=[];
  for(let x=-16;x<=24;x++)for(let y=-17;y<=23;y++)if(x*y-3*x-4*y===8&&x>4)expected.push([x,y]);
  expect(r.certificate.pairs).toEqual(expected);expect(expected).toHaveLength(6);expect(verifyIntegerFactorCertificate(r.certificate)).toBe(true);
  expect(r.lesson.steps.map(s=>s.explanation).join('\n')).toContain('$x>4$');expect(latexFeedback(r.lesson)).toEqual([]);
  const single=integerFactorLesson(text.replace('$x>4$','$y\\le 4$').replace('số nguyên $','số nguyên dương $'))!;
  expect(single.certificate.pairs).toEqual([[24,4]]);expect(verifyIntegerFactorCertificate(single.certificate)).toBe(true);
  expect(verifyIntegerFactorCertificate({...r.certificate,pairs:[[0,-2],...r.certificate.pairs]})).toBe(false);
 });
 it('keeps helper variables distinct when the input itself is named u,v',()=>{
  const r=integerFactorLesson('Tìm tất cả các cặp số nguyên $(u,v)$ thỏa mãn $uv-3u-4v=8$.')!;
  expect(r.lesson.steps[0]!.explanation).toContain('Đặt $a=u-4$, $b=v-3$');
  expect(r.lesson.steps[0]!.explanation).not.toContain('$u=u-4$');expect(verifyIntegerFactorCertificate(r.certificate)).toBe(true);expect(latexFeedback(r.lesson)).toEqual([]);
 });
});
