import {describe,it,expect} from 'vitest';
import {plannerLesson} from '../src/solver/pipeline';
import {proofDependencyFeedback} from '../../shared/src/proofDependencies';
import {planProof} from '../../shared/src/proof/planner';
import {normalizeProblemText} from '../../shared/src/mathText';
import {resolveFigure} from '../../shared/src/geometry';

describe('geometry prerequisites remain explicit after proof presentation',()=>{
 it.each([
  ['ABC','E','F'],['PQR','X','Y'],['KLM','N','T'],
 ])('shows both right angles for altitude feet after renaming %s',(tri,e,f)=>{
  const [a,b,c]=tri;
  const text=`Cho tam giác $${tri}$ nhọn. Gọi $${e},${f}$ lần lượt là chân đường cao từ $${b},${c}$. Chứng minh tứ giác $${b}${c}${e}${f}$ nội tiếp.`;
  const r=plannerLesson(text).result;
  expect(r).not.toBeNull();
  expect(proofDependencyFeedback(r!.lesson,text)).toEqual([]);
  const shown=r!.lesson.steps.map(s=>s.explanation).join('\n');
  expect(shown).toMatch(new RegExp(`∠[${b}${c}]${e}[${b}${c}] = 90°`));
  expect(shown).toMatch(new RegExp(`∠[${b}${c}]${f}[${b}${c}] = 90°`));
  expect(shown).toContain('đường tròn đường kính');
  // Verify the construction separately at a different admissible triangle.
  const fig=r!.lesson.figure!;
  const moved={...fig,points:fig.points.map(p=>p.kind==='free'?{...p,x:p.id===a?2:p.id===b?0:6,y:p.id===a?4:0}:p)};
  const pts=resolveFigure(moved).points;
  const dot=(x:string,v:string,y:string)=>(pts[x]!.x-pts[v]!.x)*(pts[y]!.x-pts[v]!.x)+(pts[x]!.y-pts[v]!.y)*(pts[y]!.y-pts[v]!.y);
  expect(dot(b!,e,c!)).toBeCloseTo(0);expect(dot(b!,f,c!)).toBeCloseTo(0);
 });
 it.each([['A','B','C','O'],['P','Q','R','I']])('proves equal tangents before using their perpendicular bisector (%s)',(a,b,c,o)=>{
  const text=`Từ điểm $${a}$ nằm ngoài đường tròn $(${o})$, kẻ hai tiếp tuyến $${a}${b},${a}${c}$ với $${b},${c}$ là các tiếp điểm. Chứng minh $${a}${b}=${a}${c}$ và $${a}${o}\\perp ${b}${c}$.`;
  const plan=planProof(normalizeProblemText(text));
  expect(plan.status).toBe('VERIFIED');
  expect(plan.goals[0]!.fact.t).toBe('cong');
  const lesson=plannerLesson(text).result!.lesson;
  const equal=lesson.steps.findIndex(s=>s.title.includes(`${a}${b} = ${a}${c}`));
  const perp=lesson.steps.findIndex(s=>s.title.includes('⊥'));
  expect(equal).toBeGreaterThanOrEqual(0);expect(perp).toBeGreaterThan(equal);
  expect(lesson.steps[perp]!.explanation).toContain('đường trung trực');
  expect(lesson.steps[perp]!.uses).toContain(lesson.steps[equal]!.id);
  expect(proofDependencyFeedback(lesson,text)).toEqual([]);
 });
 it('does not use an unsupported cyclic goal as a premise',()=>{
  const r=plannerLesson('Cho tam giác $ABC$, $E$ thuộc $AC$, $F$ thuộc $AB$. Chứng minh tứ giác $BCEF$ nội tiếp.');
  expect(r.result).toBeNull();
 });
 it('explains both right angles of a rectangle using parallel sides',()=>{
  const text='Cho hình chữ nhật $ABCD$. Chứng minh tứ giác $ABCD$ nội tiếp.';
  const lesson=plannerLesson(text).result!.lesson;
  expect(proofDependencyFeedback(lesson,text)).toEqual([]);
  const shown=lesson.steps.map(s=>s.explanation).join('\n');
  expect((shown.match(/= 90°/g)??[]).length).toBeGreaterThanOrEqual(2);
  expect(shown).toContain('song song');
 });
 it.each([['O','AB','CD','M'],['I','PQ','RS','T']])('constructs two intersecting chords from the statement (%s)',(o,ab,cd,m)=>{
  const text=`Cho đường tròn $(${o})$, hai dây $${ab}$ và $${cd}$ cắt nhau tại điểm $${m}$ nằm trong đường tròn. Chứng minh $${m}${ab[0]}\\cdot ${m}${ab[1]}=${m}${cd[0]}\\cdot ${m}${cd[1]}$.`;
  const p=planProof(normalizeProblemText(text));expect(p.status).toBe('VERIFIED');
  expect(p.figure!.points.find(q=>q.id===m)!.kind).toBe('intersection');
  const l=plannerLesson(text).result!.lesson;
  expect(proofDependencyFeedback(l,text)).toEqual([]);
  expect(l.steps.some(s=>s.explanation.includes('cắt nhau'))).toBe(true);
 });
 it('derives diameter right angles for a point reflected through the circle center',()=>{
  const text='Cho tứ giác $ABCD$ nội tiếp đường tròn $(O)$, $AC$ đi qua tâm $O$. Chứng minh $AB\\perp BC$.';
  const plan=planProof(normalizeProblemText(text));
  expect(plan.status).toBe('VERIFIED');
  expect(plan.goals[0]!.proof.some(d=>d.method==='THALES_CIRCLE')).toBe(true);
  expect(plan.figure!.points.find(p=>p.id==='C')!.kind).toBe('reflect');
 });
 it('explains why the midpoint theorem applies in hints',()=>{
  const text='Cho tam giác $ABC$. Gọi $M,N$ lần lượt là trung điểm của $AB,AC$. Chứng minh $MN\\parallel BC$ và $MN=\\frac{BC}{2}$.';
  const l=plannerLesson(text).result!.lesson;
  expect(l.hints.every(h=>h.explanation.includes('trung điểm')&&h.explanation.includes('một nửa'))).toBe(true);
 });
});

describe('construction facts do not replace theorems',()=>{
 it.each(['ABC','PQR'])('shows two actual altitude prerequisites and concurrency (%s)',tri=>{
  const [a,b,c]=tri;
  const text=`Cho tam giác $${tri}$ nhọn. Gọi $D,E$ lần lượt là chân đường cao từ $${a},${b}$, hai đường cao $${a}D,${b}E$ cắt nhau tại $H$. Chứng minh $${c}H\\perp ${a}${b}$.`;
  const p=planProof(normalizeProblemText(text));expect(p.status).toBe('VERIFIED');
  expect(p.figure!.points.find(q=>q.id==='H')!.kind).toBe('intersection');
  const g=p.goals[0]!;
  const conclusion=g.proof.find(d=>d.method==='ALTITUDE_ORTHOCENTER');
  expect(conclusion?.premises).toHaveLength(2);
  const l=plannerLesson(text).result!.lesson;
  expect(l.steps.at(-1)!.explanation).toContain('ba đường cao đồng quy');
  expect(l.hints[0]!.explanation).toContain(`${a}H ⊥ ${b}${c}`);
  expect(l.hints[0]!.explanation).toContain(`${b}H ⊥ ${a}${c}`);
 });
 it.each(['',' $(O)$'])('derives a right angle from the stated diameter with an actual dependent center (%s)',name=>{
  const text=`Cho đường tròn${name} đường kính $AB$, $C$ là một điểm trên đường tròn khác $A,B$. Gọi $H$ là chân đường vuông góc từ $C$ xuống $AB$. Chứng minh $CA^2=AH\\cdot AB$.`;
  const p=planProof(normalizeProblemText(text));expect(p.status).toBe('VERIFIED');
  expect(p.goals[0]!.proof.some(d=>d.method==='THALES_CIRCLE')).toBe(true);
  const f=p.figure!;
  const center=f.points.find(q=>q.id===f.circles[0]!.center)!;
  expect(center.kind).toBe('midpoint');expect(center.refs).toEqual(['A','B']);
 });
 it('proves both clauses of being a perpendicular bisector',()=>{
  const text='Cho đường tròn tâm $O$ và điểm $P$ ở ngoài đường tròn. Hai tiếp tuyến $PA,PB$ tiếp xúc tại $A,B$. Chứng minh $OP$ là đường trung trực của $AB$.';
  const p=planProof(normalizeProblemText(text));expect(p.status).toBe('VERIFIED');
  expect(p.goals.map(g=>g.fact.t)).toEqual(['perp','col']);
  expect(p.auxiliary[0]!.text).toContain('trung điểm');
 });
 it('accepts a parallel section only with both confirmed segment bounds',()=>{
  const text='Cho tam giác $ABC$, $M$ thuộc đoạn $AB$, $N$ thuộc đoạn $AC$ và $MN\\parallel BC$. Chứng minh $\\triangle AMN\\sim\\triangle ABC$ và $AM\\cdot AC=AN\\cdot AB$.';
  expect(planProof(normalizeProblemText(text)).status).toBe('VERIFIED');
  const unrestricted=text.replace('thuộc đoạn','thuộc đường thẳng');
  expect(planProof(normalizeProblemText(unrestricted)).status).not.toBe('VERIFIED');
 });
});
