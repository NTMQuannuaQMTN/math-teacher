import {describe,it,expect} from 'vitest';
import {triangleCalculationLesson} from '../src/solver/triangleCalculation';
import {solveProblem} from '../src/solver/pipeline';
import {VN_GRADE_9} from '../src/solver/curriculum';
import {auditLesson} from '../scripts/lesson-audit';
import {resolveFigure} from '../../shared/src/geometry';
import {verifyLesson} from '../../shared/src/verify';
const iso=(angle:number,tri='ABC')=>`Cho tam giác $${tri}$ cân tại $${tri[0]}$ và $\\widehat{${tri[0]}}=${angle}^\\circ$. Tính $\\widehat{${tri[1]}}$ và $\\widehat{${tri[2]}}$.`;
const thales=(ad:number,db:number,bc:number)=>`Cho tam giác $ABC$, $D$ thuộc đoạn $AB$, $E$ thuộc đoạn $AC$ và $DE\\parallel BC$. Biết $AD=${ad}$, $DB=${db}$, $BC=${bc}$. Tính $DE$.`;
describe('exact triangle computations with actual geometric prerequisites',()=>{
 it.each([1,7,36,47,100.5])('derives midpoint-section area from base and height, including right triangles (%s)',area=>{
  const text=`Cho tam giác $ABC$, $M,N$ lần lượt là trung điểm của $AB,AC$. Biết diện tích tam giác $ABC$ bằng $${area}$. Tính diện tích tam giác $AMN$.`;
  const l=triangleCalculationLesson(text)!.lesson;
  const [n,d]=l.answerChecks[0]!.expected!.split('/').map(Number);
  expect(n!/d!).toBeCloseTo(area/4);
  expect(l.steps[2]!.explanation).toContain('chiều cao');
  expect(l.steps[2]!.explanation).toContain('Trong trường hợp còn lại');
  expect(auditLesson(l)).toMatchObject({schemaValid:true,latexErrors:[],languageErrors:[]});
  const figure=l.figure!;
  const points=figure.points.map(p=>p.kind==='free'?{...p,x:p.id==='A'?0:p.id==='B'?4:0,y:p.id==='C'?6:0}:p);
  const r=resolveFigure({...figure,points}).points;
  const cross=(a:string,b:string,c:string)=>Math.abs((r[b]!.x-r[a]!.x)*(r[c]!.y-r[a]!.y)-(r[c]!.x-r[a]!.x)*(r[b]!.y-r[a]!.y));
  expect(cross('A','M','N')/cross('A','B','C')).toBeCloseTo(.25);
 });
 it('computes every legal integral vertex angle without numerical drawing inference',()=>{
  for(let a=1;a<180;a++) {
   const l=triangleCalculationLesson(iso(a))!.lesson;
   expect(l).toBeDefined();
   const check=l.answerChecks[0]!;
   const [n,d]=check.expected!.split('/').map(Number);
   expect(n!/d!).toBe((180-a)/2);
   expect(l.steps.at(-1)!.explanation).toContain('Vậy');
   expect(auditLesson(l)).toMatchObject({schemaValid:true,latexErrors:[],languageErrors:[]});
  }
 });
 it.each(['PQR','KLM'])('supports renamed vertices %s',tri=>{
  const l=triangleCalculationLesson(iso(47,tri))!.lesson;
  expect(l.finalAnswer.text).toContain('\\frac{133}{2}');
  expect(verifyLesson(l,{problemText:iso(47,tri)}).verification.status).toBe('verified');
 });
 it('checks Thales fractions independently across diverse lengths and constructions',()=>{
  for(let ad=1;ad<=5;ad++)for(let db=1;db<=5;db++)for(const bc of [3,7,13]) {
   const l=triangleCalculationLesson(thales(ad,db,bc))!.lesson;
   const [n,d]=l.answerChecks[0]!.expected!.split('/').map(Number);
   expect(n!/d!).toBeCloseTo(ad*bc/(ad+db));
   const pts=resolveFigure(l.figure!).points;
   const dist=(a:string,b:string)=>Math.hypot(pts[a]!.x-pts[b]!.x,pts[a]!.y-pts[b]!.y);
   expect(dist('D','E')).toBeCloseTo(ad*bc/(ad+db));
   expect(dist('A','D')).toBeCloseTo(ad);expect(dist('D','B')).toBeCloseTo(db);
   expect(l.steps[1]!.explanation).toContain('đồng vị');
   expect(auditLesson(l)).toMatchObject({schemaValid:true,latexErrors:[],languageErrors:[]});
  }
 });
 it.each([iso(0),iso(180),iso(190),thales(0,2,5),iso(36)+' Chứng minh $AB=BC$.',thales(3,2,10).replace('DE\\parallel BC','DE\\perp BC'),iso(36).replace('Tính $\\widehat{B}$','Tính $\\widehat{A}$')])('declines unsupported or inconsistent whole questions',text=>expect(triangleCalculationLesson(text)).toBeNull());
 it('returns a complete solution without inference when the free model is unavailable',async()=>{
  const model={name:'local',model:'unavailable',complete:async()=>{throw Error('must not call');}};
  for(const text of [iso(36),thales(3,2,10)]) {
   const r=await solveProblem(model,VN_GRADE_9,text,{signal:AbortSignal.timeout(1000)});
   expect(r.model).toBe('deterministic-geometry');expect(r.attempts).toBe(0);expect(r.verification.status).toBe('verified');
  }
 });
});
