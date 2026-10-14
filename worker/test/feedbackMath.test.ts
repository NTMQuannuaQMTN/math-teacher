import {describe,expect,it} from 'vitest';
import katex from 'katex';
import {divisibilityLatex} from '../../shared/src/divisibility';
import {repairLatex} from '../../shared/src/mathText';
import {proofDependencyFeedback} from '../../shared/src/proofDependencies';
import {mockGeometryLesson} from '../src/solver/mock';
import {solveProblem,tidy} from '../src/solver/pipeline';
import {VN_GRADE_9} from '../src/solver/curriculum';
import {latexFeedback} from '../src/solver/latexCheck';
const make=(explanation:string,math:string|null=null)=>({...mockGeometryLesson().steps[0]!,explanation,math,reason:null});
describe('Vietnamese divisibility without altering other bar meanings',()=>{
 it.each([[String.raw`a\mid b`,String.raw`b \vdots a`],[String.raw`n|n^2+1`,String.raw`n^2+1 \vdots n`],[String.raw`(a+b)\mid (n^2+1)`,String.raw`(n^2+1) \vdots (a+b)`],[String.raw`a\nmid b`,String.raw`b \not\vdots a`],[String.raw`uv=12,\quad u\mid 12`,String.raw`uv=12,\quad 12 \vdots u`]])('formats %s correctly',(source,expected)=>{expect(divisibilityLatex(source)).toBe(expected);expect(()=>katex.renderToString(expected,{throwOnError:true})).not.toThrow();});
 it.each([String.raw`|x|`,String.raw`P(A\mid B)`,String.raw`\{x\mid x>0\}`,String.raw`|x|+|y|`])('preserves %s',s=>expect(divisibilityLatex(s)).toBe(s));
 it('audits bare commands in all analysis fields and repairs AMS environments',()=>{
  const l=mockGeometryLesson();l.analysis.constraints=[String.raw`Điều kiện \unknowncommand{1}`];
  expect(latexFeedback(tidy(l)).length).toBeGreaterThan(0);
  const aligned=repairLatex(String.raw`\begin{align*}x&=1\\y&=2\end{align*}`);
  expect(aligned).toContain('begin{aligned}');expect(()=>katex.renderToString(aligned,{throwOnError:true})).not.toThrow();
 });
});
describe('cyclicity must be a given or explicitly proved first',()=>{
 const text='Cho các điểm A, E, O, F. Chứng minh tứ giác AEOF nội tiếp.';
 it('does not promote the question goal or model givens into a premise',()=>{
  const l=mockGeometryLesson();l.analysis.givens=['Tứ giác AEOF nội tiếp'];l.hints=[];l.steps=[make('Vì tứ giác AEOF nội tiếp nên hai góc bằng nhau.')];
  expect(proofDependencyFeedback(l,text)).toHaveLength(1);
  expect(proofDependencyFeedback(l,'Cho tứ giác AEOF nội tiếp. Tính một góc.')).toEqual([]);
 });
 it('accepts an explicit diameter proof and reordered later uses',()=>{
  const l=mockGeometryLesson();l.hints=[];l.steps=[make('Hai góc vuông cùng chắn đoạn AO, nên tứ giác AEOF nội tiếp.',String.raw`\widehat{AEO}=90^{\circ},\quad\widehat{AFO}=90^{\circ}`),{...make('Vì tứ giác FEOA nội tiếp nên các góc cùng chắn cung bằng nhau.'),id:'s2'}];
  expect(proofDependencyFeedback(l,text)).toEqual([]);
 });
 it('requires both the named chord-side condition and the explicit angle equation for a converse proof',()=>{
  const l=mockGeometryLesson();l.hints=[];
  l.steps=[make('Les points E, F are on the same side. Vậy tứ giác AEOF nội tiếp.',String.raw`\widehat{AEO}=\widehat{AFO}`)];
  expect(proofDependencyFeedback(l,text)).toHaveLength(1);
  l.steps=[make('E, F ở cùng phía đối với đường thẳng AO. Vậy tứ giác AEOF nội tiếp.',String.raw`\widehat{AEO}=\widehat{AFO}`)];
  expect(proofDependencyFeedback(l,text)).toEqual([]);
  l.steps=[make('E, F ở cùng phía đối với đường thẳng AO. Vậy tứ giác AEOF nội tiếp.')];
  expect(proofDependencyFeedback(l,text)).toHaveLength(1);
 });
 it('does not interpret an explicitly unresolved claim as an established cyclic premise',()=>{
  const l=mockGeometryLesson();l.hints=[];l.steps=[make('Đã chứng minh một hệ thức. Phần chưa được giải: A, E, O, F cùng thuộc một đường tròn.')];
  expect(proofDependencyFeedback(l,text)).toEqual([]);
  l.steps=[make('Vì tứ giác AEOF nội tiếp nên hai góc bằng nhau. Phần chưa được giải: một hệ thức khác.')];
  expect(proofDependencyFeedback(l,text)).toHaveLength(1);
 });
 it('cannot justify an early hint from a later proof',()=>{
  const l=mockGeometryLesson();l.steps=[make('Xét các điểm.'),{...make('Nên tứ giác AEOF nội tiếp.',String.raw`\widehat{AEO}=90^{\circ},\quad\widehat{AFO}=90^{\circ}`),id:'s2'}];
  l.hints=[{...l.hints[0]!,stepId:'s1',explanation:'Vì tứ giác AEOF nội tiếp, xét các góc.'}];
  expect(proofDependencyFeedback(l,text).join(' ')).toContain('hint');
 });
 it('recognizes confirmed circle intersections without promoting a requested circle',()=>{
  const l=mockGeometryLesson();l.hints=[];l.steps=[make('Vì tứ giác ABED nội tiếp nên các góc cùng chắn cung bằng nhau.')];
  const given='Cho tứ giác ABCD nội tiếp đường tròn (O), I là trung điểm BD. Gọi E là giao điểm khác A của AI với (O). Chứng minh một đẳng thức.';
  expect(proofDependencyFeedback(l,given)).toEqual([]);
  expect(proofDependencyFeedback(l,'Cho tam giác ABD. Gọi E là một điểm. Chứng minh tứ giác ABED nội tiếp.')).toHaveLength(1);
 });
 it('returns controlled failure rather than storing an unsupported full proof',async()=>{
  const l=mockGeometryLesson();l.hints=[];l.steps=[make('Vì tứ giác AEOF nội tiếp nên hai góc bằng nhau.')];
  const model={name:'local',model:'bad-proof',complete:async()=>JSON.stringify(l)};
  await expect(solveProblem(model,VN_GRADE_9,text,{signal:AbortSignal.timeout(26000),proofPlanner:false,computeFirst:false,maxAttempts:1})).rejects.toMatchObject({kind:'malformed_output'});
 });
});
