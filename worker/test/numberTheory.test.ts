import { describe,expect,it } from 'vitest';
import { numberTheoryLesson } from '../src/solver/numberTheory';
import { solveProblem } from '../src/solver/pipeline';
import { VN_GRADE_9 } from '../src/solver/curriculum';
import { ModelLessonSchema } from '../../shared/src/solution';
import type { JsonModel } from '../src/solver/llm';
const unavailable:JsonModel={name:'unavailable',model:'unavailable',complete:async()=>{throw Error('no model needed');}};
describe('exact finite integer reasoning',()=>{
 it('never returns a table that exceeds the actual typed lesson contract',()=>{
  for(let c=-200;c<=200;c++){
   const l=numberTheoryLesson(`Tìm tất cả các cặp số nguyên $(x,y)$ thỏa mãn $xy+2x+3y=${c}$.`);
   if(l)expect(ModelLessonSchema.safeParse(l).success,String(c)).toBe(true);
  }
  expect(numberTheoryLesson('Tìm tất cả các cặp số nguyên $(x,y)$ thỏa mãn $xy+2x+3y=42$.')).not.toBeNull();
 });
 it.each([[2,3,7],[1,4,2],[3,2,-9]])('exhausts factor equation with coefficients %s,%s,%s',async(a,b,c)=>{
  const sign=(k:number)=>k>=0?`+${k}`:`${k}`;
  const text=`Tìm tất cả các cặp số nguyên $(x,y)$ thỏa mãn $xy${sign(-a)}x${sign(-b)}y=${c}$.`;
  const r=await solveProblem(unavailable,VN_GRADE_9,text,{signal:AbortSignal.timeout(26000)});
  expect(r.model).toBe('deterministic-number-theory');
  const found=[...r.lesson.finalAnswer.text.matchAll(/\((-?\d+),(-?\d+)\)/g)].map(m=>[Number(m[1]),Number(m[2])]);
  // Independent exhaustive check in a mathematically sufficient box: |x-b|,|y-a| ≤ |c+ab|.
  const d=Math.abs(c+a*b),expected:number[][]=[];
  for(let x=b-d;x<=b+d;x++)for(let y=a-d;y<=a+d;y++)if(x*y-a*x-b*y===c)expected.push([x,y]);
  expect(found.sort()).toEqual(expected.sort());expect(r.lesson.steps[1]!.explanation).toContain('ước âm');
 });
 it.each([2,6,10,14])('proves impossible square n²+%s by exhaustive residues',c=>{
  const l=numberTheoryLesson(`Tìm tất cả các số nguyên $n$ sao cho $n^{2}+${c}$ là số chính phương.`)!;
  expect(l.finalAnswer.text).toContain('không có');
  const squares=new Set([0,1,2,3].map(n=>n*n%4));
  expect([0,1,2,3].every(n=>!squares.has((n*n+c)%4))).toBe(true);
 });
 it('declines unhandled conditions and handles zero-product families explicitly',()=>{
  expect(numberTheoryLesson('Tìm tất cả các cặp số nguyên $(x,y)$, $x>0$, thỏa mãn $xy-2x-3y=7$.')).toBeNull();
  expect(numberTheoryLesson('Tìm tất cả các cặp số nguyên $(x,y)$ thỏa mãn $xy-2x-3y=-6$.')!.finalAnswer.text).toContain('tùy ý');
  expect(numberTheoryLesson('Tìm tất cả các số nguyên $n$ sao cho $n^{2}+4$ là số chính phương.')!.finalAnswer.text).toContain('\\{0\\}');
  expect(numberTheoryLesson('Tìm tất cả các số nguyên $n$ sao cho $n^{2}+3$ là số chính phương.')!.finalAnswer.text).toContain('\\{-1,1\\}');
 });
});
