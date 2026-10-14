import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {geometryHypothesisDiagnosis} from '../src/solver/geometryHypothesisDiagnosis';
import {resolveFigure} from '../../shared/src/geometry';
import {auditLesson} from '../scripts/lesson-audit';
import {proofDependencyFeedback} from '../../shared/src/proofDependencies';
import {solveProblem} from '../src/solver/pipeline';
import {VN_GRADE_9} from '../src/solver/curriculum';
const cases=JSON.parse(readFileSync(new URL('../../tools/specialist-training/iteration-03/cases.json',import.meta.url),'utf8'));
const text=(id:string):string=>cases.find((c:{id:string})=>c.id===id).text;
const feet=text('geo3-cyclic-unrestricted'),angles=text('geo3-circle-converse-missing-side');
const rename=(s:string)=>s.replace(/\b[A-Z]{1,4}\b/g,t=>[...t].map(c=>({A:'K',B:'L',C:'M',D:'N',E:'P',F:'Q'})[c as 'A']??c).join(''));
describe('missing geometry hypotheses require explicit constructive diagnoses',()=>{
 it('exhibits coincident altitude feet and explains all three right-triangle cases',()=>{
  const l=geometryHypothesisDiagnosis(feet)!;expect(l).not.toBeNull();
  const p=resolveFigure(l.figure!).points;
  for(const id of ['E','F']) {expect(p[id]!.x).toBeCloseTo(p.A!.x);expect(p[id]!.y).toBeCloseTo(p.A!.y);}
  expect(l.steps.map(s=>s.explanation).join()).toContain('$F=B$');
  expect(l.steps.map(s=>s.explanation).join()).toContain('$E=C$');
  expect(l.finalAnswer.text).toContain('nếu tam giác không vuông');
 });
 it('constructs equal opposite-side angles that are not concyclic, and keeps the witness valid while translated',()=>{
  const l=geometryHypothesisDiagnosis(angles)!;expect(l).not.toBeNull();
  const angle=(a:{x:number;y:number},v:{x:number;y:number},b:{x:number;y:number})=>Math.acos(((a.x-v.x)*(b.x-v.x)+(a.y-v.y)*(b.y-v.y))/(Math.hypot(a.x-v.x,a.y-v.y)*Math.hypot(b.x-v.x,b.y-v.y)));
  for(const [x,y] of [[0,0],[5,-7],[-3,4]] as [number,number][]) {
   const figure={...l.figure!,points:l.figure!.points.map(p=>p.id==='A'?{...p,x,y}:p)},r=resolveFigure(figure);
   expect(r.errors).toEqual([]);const p=r.points;
   const alpha=angle(p.A!,p.C!,p.B!),beta=angle(p.A!,p.D!,p.B!);
   expect(alpha).toBeCloseTo(beta);expect(alpha+beta).toBeLessThan(Math.PI);
   const center=p.O_ACB!;
   expect(Math.hypot(p.A!.x-center.x,p.A!.y-center.y)).toBeCloseTo(1.25);
   expect(Math.hypot(p.D!.x-center.x,p.D!.y-center.y)).toBeCloseTo(2.75);
  }
 });
 it.each([feet,angles,rename(feet),rename(angles)])('keeps renamed full fields renderable and avoids auxiliary-name collisions',s=>{
  const l=geometryHypothesisDiagnosis(s)!;expect(l).not.toBeNull();
  expect(auditLesson(l)).toMatchObject({schemaValid:true,latexErrors:[],languageErrors:[]});
  expect(proofDependencyFeedback(l,s)).toEqual([]);
  expect(new Set(l.figure!.points.map(p=>p.id)).size).toBe(l.figure!.points.length);
  if(s===rename(angles))expect(l.steps[0]!.explanation).toContain('$PM=PN=2$');
 });
 it.each([feet+' Tính diện tích tam giác ABC.',feet.replace('tam giác $ABC$,','tam giác $ABC$ nhọn,'),angles.replace('thỏa mãn','nằm cùng phía so với AB, thỏa mãn')])('does not silently drop an extra condition or question',s=>expect(geometryHypothesisDiagnosis(s)).toBeNull());
 it.each([feet,angles])('serves an honest diagnosis without inference',async s=>{
  const model={name:'local',model:'unavailable',complete:async()=>{throw Error('must not call');}};
  const r=await solveProblem(model,VN_GRADE_9,s,{signal:AbortSignal.timeout(1000)});
  expect(r.model).toBe('geometry-hypothesis-diagnosis');expect(r.verification.status).toBe('partial');expect(r.attempts).toBe(0);
 });
});
