import {describe,expect,it} from 'vitest';
import {boardSearchCertificate,verifyBoardSearch,boardSearchLesson} from '../src/solver/boardSearchGame';
import {solveProblem} from '../src/solver/pipeline';
import {VN_GRADE_9} from '../src/solver/curriculum';
import {latexFeedback} from '../src/solver/latexCheck';
import {cleanLanguage} from '../../shared/src/language';
const question='Cho bàn cờ $2\\times9$. An chọn một ô ban đầu, sau đó mỗi lượt An di chuyển sang một ô kề bên. Bình chọn $k$ ô mỗi lượt để hỏi An. Chứng minh Bình có thể thắng sau không quá 8 lượt với $k=4$ và không quá 16 lượt với $k=2$.';
describe('the actual 2 by 9 board question',()=>{
 it('eliminates every possible starting cell and adversarial path, for boards 2 to 20 columns',()=>{
  for(let n=2;n<=50;n++)for(const k of [2,4] as const){const c=boardSearchCertificate(n,k);expect(c.survivors.at(-1),`${n},${k}`).toBe(0);expect(verifyBoardSearch(c,k)).toBe(true);}
 });
 it('requires the second sweep to track the other moving color',()=>{
  const good=boardSearchCertificate(9,2);const broken={...good,queries:[...good.queries.slice(0,8),...good.queries.slice(0,8)]};
  expect(verifyBoardSearch(broken,2)).toBe(false);
  expect(verifyBoardSearch({...good,survivors:good.survivors.map((x,i)=>i===0?0:x)},2)).toBe(false);
 });
 it('provides both proofs with no OCR or inference and fully renderable Vietnamese fields',async()=>{
  const result=await solveProblem({name:'unused',model:'unused',complete:async()=>{throw Error('no inference');}},VN_GRADE_9,question,{signal:AbortSignal.timeout(26000)});
  expect(result.model).toBe('deterministic-board-search');expect(result.verification.status).toBe('verified');
  expect(latexFeedback(result.lesson)).toEqual([]);expect(cleanLanguage(result.lesson).feedback).toEqual([]);
  expect(result.lesson.steps.some(s=>s.explanation.includes('$6\\le8$'))).toBe(true);
  expect(result.lesson.steps.at(-1)!.explanation).toContain('không quá $16$');
 });
 it('displays executable one-based schedules, including the changed colour on turn nine',()=>{
  const lesson=boardSearchLesson(question)!.lesson;
  const tables=lesson.steps.filter(s=>s.math?.includes('Q_t')).map(s=>s.math!);
  expect(tables).toHaveLength(3);
  const grid=lesson.steps.find(s=>s.title.includes('lượt $1$'))!.math!;
  expect(grid).toContain(String.raw`D_{1}:\quad`);expect(grid).toContain(String.raw`C_{1}:\quad`);
  expect(grid.match(/\\circ/g)).toHaveLength(32);
  expect(tables[0]).toContain('1&(1,1), (1,3), (2,2), (2,4)');
  expect(tables[0]).toContain('6&(1,1), (1,7), (1,9), (2,8)');
  expect(tables[1]).toContain('1&(1,1), (2,2)');
  expect(tables[2]).toContain('9&(1,2), (2,1)');
  expect(tables[2]).toContain('16&(1,9), (2,8)');
  expect(lesson.steps.find(s=>s.title.includes('lượt chuyển'))!.explanation).toContain('giữa lượt $1$ và lượt $9$');
 });
 it('declines extra movement rules, wrong bounds and unclear dimensions',()=>{
  expect(boardSearchLesson(question+' An được đứng yên.')).toBeNull();
  expect(boardSearchLesson(question.replace('8 lượt','7 lượt'))).toBeNull();
  expect(boardSearchLesson(question.replace('2\\times9','2imes9'))).toBeNull();
 });
});
