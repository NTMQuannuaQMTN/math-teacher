import {describe,it,expect} from 'vitest';
import {circleBisectorLesson,circleBisectorCertificate,verifyCircleBisectorCertificate} from '../src/solver/circleBisectorLesson';
import {auditLesson} from '../scripts/lesson-audit';
import {verifyLesson} from '../../shared/src/verify';
import {checkClaims} from '../../shared/src/claims';
import {resolveFigure} from '../../shared/src/geometry';
const text='Cho tam giác $ABC$ nhọn nội tiếp đường tròn $(O)$ có $\\hat A>\\hat B>\\hat C$ và điểm $D$ trên cung nhỏ $AC$ sao cho $CD>AB$. Đường trung trực của $DB$ cắt $AB$ tại $E$; đường trung trực của $DC$ cắt $AC$ tại $F$. Chứng minh các điểm $A,D,E,F$ thuộc một đường tròn và đường tròn này đi qua tâm $O$ của $(O)$.';
type P=[number,number];
const point=(degrees:number):P=>[Math.cos(degrees*Math.PI/180),Math.sin(degrees*Math.PI/180)];
const dot=(a:P,b:P)=>a[0]*b[0]+a[1]*b[1];
const sub=(a:P,b:P):P=>[a[0]-b[0],a[1]-b[1]];
const bisector=(a:P,b:P,d:P):[P,number]=>{
 const dir=sub(b,a),normal=sub(d,b);const t=-dot(a,normal)/dot(dir,normal);
 return [[a[0]+t*dir[0],a[1]+t*dir[1]],t];
};
const angle=(a:P,v:P,b:P)=>{const x=sub(a,v),y=sub(b,v);return Math.acos(Math.max(-1,Math.min(1,dot(x,y)/Math.sqrt(dot(x,x)*dot(y,y)))))*180/Math.PI;};
describe('circle and chord-bisector proof covers every point-order case',()=>{
 it('checks the synthetic case split against diverse admissible constructions independently',()=>{
  let inside=0,outside=0,coincident=0;
  for(const B of [51,57,65,70,78,84])for(const C of [17,25,30,37,44]) {
   const A=180-B-C;if(A<=0||A>=90)continue;
   const a:P=[1,0],b=point(-2*C),c=point(2*B),o:P=[0,0];
   for(let theta=1;theta<2*B;theta+=2) {
    const d=point(theta),[e,t]=bisector(a,b,d),[f,s]=bisector(a,c,d);
    // Independent circle equation through O,A,D: x²+y²=x+[(1-Dx)/Dy]y.
    const k=(1-d[0])/d[1];
    for(const q of [e,f])expect(dot(q,q)-q[0]-k*q[1]).toBeCloseTo(0,7);
    expect(s).toBeGreaterThan(0);expect(s).toBeLessThan(1);
    expect(angle(a,f,d)).toBeCloseTo(theta,6);
    expect(t).toBeLessThan(1);
    if(Math.abs(t)<1e-9){coincident++;continue;}
    if(t>0){inside++;expect(angle(a,e,d)).toBeCloseTo(theta,6);}
    else {outside++;expect(angle(a,e,d)+angle(a,o,d)).toBeCloseTo(180,6);}
   }
   // The boundary E=A is not an ordinary quadrilateral and needs its separate clause.
   const d=point(2*C),[e,t]=bisector(a,b,d);
   expect(t).toBeCloseTo(0);expect(e[0]).toBeCloseTo(1);expect(e[1]).toBeCloseTo(0);coincident++;
  }
  expect(inside).toBeGreaterThan(100);expect(outside).toBeGreaterThan(100);expect(coincident).toBeGreaterThan(0);
 });
 it('checks the endpoint D=A with the circle of diameter AO',()=>{
  const a:P=[1,0],b=point(300),c=point(140);
  const e:P=[(a[0]+b[0])/2,(a[1]+b[1])/2],f:P=[(a[0]+c[0])/2,(a[1]+c[1])/2];
  for(const q of [e,f])expect((q[0]-.5)**2+q[1]**2).toBeCloseTo(.25);
 });
 it('retains explicit derivations and all three possible positions of E',()=>{
  const r=circleBisectorLesson(text)!;expect(r).not.toBeNull();
  expect(r.lesson.steps).toHaveLength(8);
  expect(r.lesson.steps[2]!.explanation).toContain('nằm giữa');
  expect(r.lesson.steps[4]!.explanation).toContain('$E=A$');
  expect(r.lesson.steps[5]!.explanation).toContain('hai tia $EA,EB$ đối nhau');
  expect(r.lesson.steps[6]!.explanation).toContain('180^\\circ');
  expect(r.lesson.steps.at(-1)!.explanation).toContain('đã được xét hết');
  expect(r.lesson.steps[6]!.uses).not.toContain('s6');
  expect(r.lesson.steps[5]!.uses).toEqual(['s4','s5']);
  expect(r.lesson.hints).toHaveLength(8);
 });
 it('validates every displayed field and keeps conditional branches honestly unmeasured',()=>{
  const r=circleBisectorLesson(text)!;
  expect(auditLesson(r.lesson)).toMatchObject({schemaValid:true,latexErrors:[],languageErrors:[]});
  const v=verifyLesson(r.lesson,{problemText:text});expect(v.verification.status).toBe('partial');
  expect(v.feedback.some(f=>f.includes('false in the constructed figure'))).toBe(false);
  expect(v.verification.steps![0]!.status).toBe('not_checked');
 });
 it('supports renaming and declines a changed construction or an extra request',()=>{
  const names:Record<string,string>={A:'P',B:'Q',C:'R',D:'S',E:'X',F:'Y',O:'I'};
  const renamed=text.replace(/\$[^$]*\$/g,part=>part.replace(/[A-Z]/g,s=>names[s]??s));
  expect(circleBisectorLesson(renamed)?.certificate.a).toBe('P');
  expect(circleBisectorLesson(text.replace('cắt $AB$','cắt $AC$'))).toBeNull();
  expect(circleBisectorLesson(text+' Tính diện tích.')).toBeNull();
  expect(circleBisectorLesson(text.replace('trên cung nhỏ','trên cung lớn'))).toBeNull();
  const cert=circleBisectorCertificate(text)!;
  expect(verifyCircleBisectorCertificate({...cert,e:'X'})).toBe(false);
 });
 it('accepts braced and unbraced widehat spellings from normalized exam text',()=>{
  expect(circleBisectorLesson(text.replace(/\\hat ([ABC])/g,'\\widehat $1'))).not.toBeNull();
  expect(circleBisectorLesson(text.replace(/\\hat ([ABC])/g,'\\widehat{$1}'))).not.toBeNull();
 });
 it('does not turn a conditional paragraph into an unconditional claim when punctuation changes',()=>{
  const f=circleBisectorLesson(text)!.lesson.figure!,r=resolveFigure(f);
  const bad=String.raw`\widehat{AEO}=\widehat{AFO}`;
  expect(checkClaims([`Nếu D=A thì xét trung điểm. Khi ấy ${bad}.`],r)).toEqual([]);
  expect(checkClaims([`Nếu D=A thì xét trung điểm.\n\n${bad}.`],r).some(c=>!c.passed)).toBe(true);
  expect(checkClaims([bad],r).some(c=>!c.passed)).toBe(true);
 });
});
