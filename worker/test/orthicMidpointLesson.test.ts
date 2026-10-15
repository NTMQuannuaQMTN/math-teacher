import {describe,it,expect} from 'vitest';
import {auditLesson} from '../scripts/lesson-audit';
import {proofDependencyFeedback} from '../../shared/src/proofDependencies';
import {verifyLesson} from '../../shared/src/verify';
import {orthicMidpointCertificate,orthicMidpointLesson,verifyOrthicMidpointCertificate} from '../src/solver/orthicMidpointLesson';

const text='Cho tam giác nhọn $ABC$ ($AB<AC$) nội tiếp đường tròn $(O)$ có $BE,CF$ là các đường cao. Gọi $M,K$ theo thứ tự là trung điểm của $BC,EF$. Gọi $N=AM\\cap EF$. Kẻ $ND\\perp BC$ tại $D$. Chứng minh $\\widehat{AKE}=\\widehat{AMB}$ và ba điểm $A,K,D$ thẳng hàng.';

describe('orthic midpoint proof',()=>{
 it('includes every cyclicity, similarity, point-order, and supplementary-angle dependency',()=>{
  const r=orthicMidpointLesson(text)!;expect(r).not.toBeNull();
  expect(r.lesson.steps).toHaveLength(9);
  expect(r.lesson.steps[0]!.math).toContain('BEC');
  expect(r.lesson.steps[3]!.explanation).toContain('cạnh–góc–cạnh');
  expect(r.lesson.steps[5]!.math).toContain('AB^{2}');
  expect(r.lesson.steps[7]!.title).toContain('không dựa vào hình vẽ');
  expect(r.lesson.steps.at(-1)!.explanation).toContain('hai tia $KD,KA$ đối nhau');
  expect(proofDependencyFeedback(r.lesson,text)).toEqual([]);
  expect(verifyLesson(r.lesson,{problemText:text}).verification.status).not.toBe('unverified');
  expect(auditLesson(r.lesson)).toMatchObject({schemaValid:true,latexErrors:[],languageErrors:[]});
  expect(JSON.stringify(r.lesson)).not.toMatch(/(?:AI|BE|CF|MK|ND)(?:perp|in)|(?<!\\)(?:coswidehat|lambda)/);
 });
 it('is numerically valid on varied acute scalene triangles with AB<AC',()=>{
  type P=[number,number];
  const foot=(p:P,x:P,y:P):P=>{const d:P=[y[0]-x[0],y[1]-x[1]],t=((p[0]-x[0])*d[0]+(p[1]-x[1])*d[1])/(d[0]**2+d[1]**2);return [x[0]+t*d[0],x[1]+t*d[1]]};
  const angle=(x:P,v:P,y:P)=>{const a:P=[x[0]-v[0],x[1]-v[1]],b:P=[y[0]-v[0],y[1]-v[1]];return Math.acos((a[0]*b[0]+a[1]*b[1])/Math.hypot(...a)/Math.hypot(...b));};
  for(const [u,v] of [[-.2,1.2],[-.45,1.1],[-.1,1.5],[-.6,1.4]] as P[]){
   const A:P=[u,v],B:P=[-1,0],C:P=[1,0],M:P=[0,0],E=foot(B,A,C),F=foot(C,A,B),K:P=[(E[0]+F[0])/2,(E[1]+F[1])/2];
   const cross=(x:P,y:P)=>x[0]*y[1]-x[1]*y[0];const ef:P=[F[0]-E[0],F[1]-E[1]];
   const t=cross(E,ef)/cross(A,ef),N:P=[t*u,t*v],D:P=[N[0],0];
   expect(angle(A,K,E)).toBeCloseTo(angle(A,M,B),9);
   expect(cross([A[0]-K[0],A[1]-K[1]],[D[0]-K[0],D[1]-K[1]])).toBeCloseTo(0,9);
  }
 });
 it('supports point renaming and declines changed constructions or extra goals',()=>{
  const names:Record<string,string>={A:'P',B:'Q',C:'R',O:'I',E:'S',F:'T',M:'U',K:'V',N:'W',D:'X'};
  const renamed=text.replace(/\$[^$]*\$/g,p=>p.replace(/[A-Z]/g,x=>names[x]??x));
  expect(orthicMidpointLesson(renamed)?.certificate).toMatchObject({a:'P',m:'U',k:'V',d:'X'});
  expect(orthicMidpointLesson(text.replace('trung điểm của $BC,EF$','trung điểm của $AB,EF$'))).toBeNull();
  expect(orthicMidpointLesson(text+' Tính diện tích tam giác.')).toBeNull();
  const c=orthicMidpointCertificate(text)!;expect(verifyOrthicMidpointCertificate({...c,k:'X'})).toBe(false);
 });
});
