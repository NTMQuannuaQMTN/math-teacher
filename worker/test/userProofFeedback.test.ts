import {describe,it,expect,vi} from 'vitest';
import {solveProblem,tidy} from '../src/solver/pipeline';
import {VN_GRADE_9} from '../src/solver/curriculum';
import {mockAlgebraLesson} from '../src/solver/mock';
import {cleanLanguage} from '../../shared/src/language';
import {proofDependencyFeedback} from '../../shared/src/proofDependencies';
import {previewPartialLesson} from '../../shared/src/progressPreview';
import {latexFeedback} from '../src/solver/latexCheck';
import {boardSearchLesson,verifyBoardSearch} from '../src/solver/boardSearchGame';
import {multipartLesson} from '../src/solver/multipartLesson';
import {vertexAssignmentLesson} from '../src/solver/vertexAssignmentLesson';
import {readFileSync} from 'node:fs';

export const q5='Cho bàn cờ kích thước $2\\times9$. An chọn một ô ban đầu, sau đó mỗi lượt di chuyển sang một ô kề bên. Bình chọn $k$ ô mỗi lượt để đoán vị trí An. Với $k=4$, chứng minh Bình thắng sau không quá 8 lượt. Với $k=2$, chứng minh Bình thắng sau không quá 16 lượt.';
export const q1='Cho phương trình $x^2-2(m+1)x+2m=0$ ($m$ là tham số).\na) Chứng minh rằng với mọi $m$ phương trình luôn có hai nghiệm phân biệt $x_1,x_2$.\nb) Chứng minh $x_1^4+x_2^4>\\frac92$.\nc) Chứng minh $\\left(x_1+\\sqrt{x_1^2+1}\\right)\\left(x_2+\\sqrt{x_2^2+1}\\right)=1$ khi và chỉ khi $m=-1$.';
export const q3='Cho các số nguyên dương $m,n$ thỏa mãn: $m^2+m+n^2$ chia hết cho tích $mn$.\na) Chứng minh không tồn tại $m,n$ thỏa mãn khi $n=3$.\nb) Tìm $m,n$ thỏa mãn biết $m$ chia hết cho $n$.\nc) Ký hiệu $d$ là ước chung lớn nhất của $m$ và $n$. Chứng minh nếu $m,n$ thỏa mãn thì $m=d^2$.';
const unavailable={name:'local' as const,model:'unused',complete:vi.fn(async()=>{throw Error('must not use inference');})};
describe('the user-reported Q1 to Q5 failures',()=>{
 it('routes the exact Q5 paraphrase to the verified moving-position sweep',async()=>{
  const r=await solveProblem(unavailable,VN_GRADE_9,q5,{signal:AbortSignal.timeout(26000)});
  expect(r.model).toBe('deterministic-board-search');const b=boardSearchLesson(q5)!;
  expect(b.certificates.every((c,i)=>verifyBoardSearch(c,i===0?4:2))).toBe(true);
  expect(r.lesson.steps.some(s=>s.explanation.includes('cột ít nhất'))).toBe(true);
  expect(r.lesson.steps.flatMap(s=>s.explanation).join(' ')).not.toContain('4 lượt đầu chọn 4 ô đen');
  expect(boardSearchLesson(q5+' An được đứng yên.')).toBeNull();
 });
 it.each([q1,q3])('answers every multipart request without inference',async q=>{
  const m=multipartLesson(q);expect(m).not.toBeNull();expect(m!.verify()).toBe(true);
  const r=await solveProblem(unavailable,VN_GRADE_9,q,{signal:AbortSignal.timeout(26000)});
  expect(r.model).toBe('certified-multipart');expect(latexFeedback(r.lesson)).toEqual([]);expect(cleanLanguage(r.lesson).feedback).toEqual([]);
  expect(['a)','b)','c)'].every(p=>r.lesson.steps.some(s=>s.title.startsWith(p)))).toBe(true);
  expect(r.lesson.steps.at(-1)!.title.startsWith('c)')).toBe(true);
  expect(multipartLesson(q+'\nd) Tính thêm một giá trị khác.')).toBeNull();
 });
 it('blocks Cyrillic in streaming fields before final verification',()=>{
  const p=previewPartialLesson(JSON.stringify({subtopic:'Phương trình четвертая',strategy:'Dùng четвертая để biến đổi.'}),{vietnamese:true});
  expect(p.problemKind).toBeNull();expect(p.strategy).toBeNull();
  expect(previewPartialLesson(JSON.stringify({strategy:'Dùng phương trình with hai nghiệm.'}),{vietnamese:true}).strategy).toBeNull();
 });
 it('solves Q2 with two explicit assignments and no unordered-set notation',async()=>{
  const rows=readFileSync(new URL('../../tools/benchmark/dataset/chuyen.jsonl',import.meta.url),'utf8').trim().split('\n').map(l=>JSON.parse(l));
  const a=rows.find(r=>r.id==='ptnk-2025-chuyen_2a').problem_text,b=rows.find(r=>r.id==='ptnk-2025-chuyen_2b').problem_text;
  for(const q of [a,b]){
   const v=vertexAssignmentLesson(q);expect(v).not.toBeNull();expect(v!.verify()).toBe(true);
   const r=await solveProblem(unavailable,VN_GRADE_9,q,{signal:AbortSignal.timeout(26000)});
   expect(r.model).toBe('certified-vertex-assignment');expect(cleanLanguage(r.lesson).feedback).toEqual([]);expect(latexFeedback(r.lesson)).toEqual([]);
   expect(JSON.stringify(r.lesson)).not.toMatch(/\\\\\{b\+c/);
  }
  expect(vertexAssignmentLesson(a+' Cần thêm một điều kiện khác.')).toBeNull();
  for(let p=1;p<=8;p++)for(let q=p+1;q<=10;q++){
   const variant=b.replace('1, 2, 3.',`${p}, ${q}, ${p+q}.`);expect(vertexAssignmentLesson(variant)!.verify()).toBe(true);
   // Independent rational arithmetic at both explicit minimizers.
   const t=(x:number)=>2*x*x+(x+p)**2+(q-x)**2;
   const center=(q-p)/4,bound=(3*p*p+2*p*q+3*q*q)/4;
   expect(t(center)).toBe(bound);for(const shift of [-3,-1,.25,2])expect(t(center+shift)-bound).toBeCloseTo(4*shift*shift,10);
  }
 });
 it.each([String.raw`\left\{b+c,c+d,d+a\right\}=\left\{1,2,3\right\}`,String.raw`\{b+c,c+d,d+a\}=\{1,2,3\}`])('blocks the disallowed unordered notation %s',math=>{
  const l=mockAlgebraLesson();l.hints[0]!.math=math;
  expect(cleanLanguage(l).feedback.join(' ')).toContain('invalid unordered-set equality');
 });
 it('repairs only the unambiguous JSON tab escape and rejects a fused imes formula',()=>{
  const l=mockAlgebraLesson();l.steps[0]!.math='k\times d\times a\times ab';
  expect(tidy(l).steps[0]!.math).toBe(String.raw`k\times d\times a\times ab`);
  l.steps[0]!.math='kimesdimesaimesab';expect(cleanLanguage(l).feedback.join(' ')).toContain('damaged LaTeX');
 });
 it('rejects Q4 isosceles double-angle and collinearity-only supplementation',()=>{
  const l=mockAlgebraLesson();l.steps[0]!.explanation='Trong tam giác cân DBE, ∠BED = 2∠DBE. Vì A, E, B thẳng hàng, ∠AED = 180° − ∠BED.';
  const f=proofDependencyFeedback(l,'Cho tam giác DBE cân tại E, với A, E, B thẳng hàng.');
  expect(f.join(' ')).toContain('isosceles');expect(f.join(' ')).toContain('collinearity alone');
  l.steps[0]!.explanation='E nằm giữa A và B. Hai tia EA và EB đối nhau, nên ∠AED = 180° − ∠BED.';
  expect(proofDependencyFeedback(l,'Cho E nằm giữa A và B.')).toEqual([]);
 });
 it('does not publish forbidden notation after its one correction attempt',async()=>{
  const l=mockAlgebraLesson();l.hints[0]!.math=String.raw`\left\{b+c,c+d,d+a\right\}=\left\{1,2,3\right\}`;
  await expect(solveProblem({name:'local',model:'bad',complete:async()=>JSON.stringify(l)},VN_GRADE_9,l.analysis.statement,{signal:AbortSignal.timeout(26000),maxAttempts:1,exactAlgebra:false,computeFirst:false,proofPlanner:false})).rejects.toMatchObject({kind:'malformed_output'});
 });
});
