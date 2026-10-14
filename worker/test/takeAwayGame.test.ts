import {describe,expect,it} from 'vitest';
import {solveTakeAway,verifyGameCertificate,parseTakeAway,takeAwayLesson} from '../src/solver/takeAwayGame';
import {solveProblem} from '../src/solver/pipeline';
import {VN_GRADE_9} from '../src/solver/curriculum';
import {ModelLessonSchema} from '../../shared/src/solution';
import {latexFeedback} from '../src/solver/latexCheck';
import {cleanLanguage} from '../../shared/src/language';
import type {JsonModel} from '../src/solver/llm';
function independent(n:number,moves:number[],lastLoses:boolean):boolean {
 if(n===0)return lastLoses;
 return moves.filter(m=>m<=n).some(m=>!independent(n-m,moves,lastLoses));
}
const question=(n:number,moves:string,end='Người lấy viên sỏi cuối cùng thắng')=>`Có ${n} viên sỏi. Hai người chơi luân phiên, mỗi lượt lấy ${moves} viên sỏi. ${end}. Ai có chiến lược thắng? Hãy chứng minh.`;
describe('finite games with every legal reply checked',()=>{
 it('agrees with independent recursive minimax for all small subsets and both terminal conventions',()=>{
  for(let mask=1;mask<16;mask++)for(const lastLoses of [false,true]){
   const moves=[1,2,3,4].filter(m=>mask&(1<<(m-1)));
   const c=solveTakeAway({stones:12,moves,lastLoses});
   for(let n=1;n<=12;n++)expect(c.winning[n]).toBe(independent(n,moves,lastLoses));
   expect(verifyGameCertificate(c)).toBe(true);
  }
 });
 it('rejects corruption of a losing state, recommended move, or game domain',()=>{
  const c=solveTakeAway({stones:21,moves:[1,2,3],lastLoses:false});
  expect(verifyGameCertificate({...c,winning:c.winning.map((v,i)=>i===20?!v:v)})).toBe(false);
  expect(verifyGameCertificate({...c,move:c.move.map((v,i)=>i===21?3:v)})).toBe(false);
  expect(verifyGameCertificate({...c,moves:[0]})).toBe(false);
 });
 it('gives an executable reply rule rather than merely asserting that a winning move exists',()=>{
  const lesson=takeAwayLesson(question(16,'2 hoặc 5','Ai không lấy được viên nào thì thua'))!.lesson;
  expect(lesson.steps.at(-1)!.explanation).toContain('theo thứ tự tăng');
  expect(lesson.steps.at(-1)!.explanation).toContain('số đầu tiên');
 });
 it('does not guess terminal conventions, extra rules, multiple piles or oversized games',()=>{
  for(const q of [question(21,'2 hoặc 5'),question(21,'2 hoặc 5','Người lấy viên sỏi cuối cùng thua'),question(201,'1 hoặc 2'),question(21,'1 hoặc 2')+' Được bỏ lượt.'])expect(parseTakeAway(q)).toBeNull();
  expect(parseTakeAway(question(16,'2 hoặc 5','Ai không lấy được viên nào thì thua'))).not.toBeNull();
 });
 it.each([[21,'từ 1 đến 3','thắng',true],[25,'1 hoặc 2','thua',false],[40,'từ 1 đến 4','thua',true]] as const)('delivers a typed Vietnamese proof without inference for %s stones',async(n,moves,end,winning)=>{
  const q=question(n,moves,`Người lấy viên sỏi cuối cùng ${end}`);
  const l=takeAwayLesson(q)!;expect(l.certificate.winning[n]).toBe(winning);
  expect(ModelLessonSchema.safeParse(l.lesson).success).toBe(true);
  expect(latexFeedback(l.lesson)).toEqual([]);expect(cleanLanguage(l.lesson).feedback).toEqual([]);
  const model:JsonModel={name:'local',model:'unused',complete:async()=>{throw Error('should not call');}};
  const r=await solveProblem(model,VN_GRADE_9,q,{signal:AbortSignal.timeout(26000)});
  expect(r.model).toBe('deterministic-combinatorics');expect(r.verification.status).toBe('verified');
  expect(r.lesson.steps.at(-1)!.explanation).toContain(winning?'người đi trước':'người đi sau');
 });
});

describe('worked finite-state deductions rather than an unexplained list',()=>{
 it('shows subtraction for every state in a nonconsecutive game',()=>{
  const q='Có 58 viên sỏi. Hai người chơi luân phiên, mỗi lượt lấy 1, 3 hoặc 4 viên sỏi. Người lấy viên sỏi cuối cùng thua. Ai có chiến lược thắng? Hãy chứng minh.';
  const built=takeAwayLesson(q)!;expect(built).not.toBeNull();
  const tables=built.lesson.steps.filter(s=>s.title.startsWith('Tính từng trạng thái:'));
  const content=tables.map(s=>s.math!).join(' ');
  for(let state=1;state<=58;state++)expect(content).toMatch(new RegExp(`(?:hline |\\\\\\\\)${state}&`));
  expect(content).toContain('1-1=0');expect(content).toContain('58-');
  expect(built.lesson.hints.length).toBeLessThanOrEqual(8);expect(latexFeedback(built.lesson)).toEqual([]);
 });
});
