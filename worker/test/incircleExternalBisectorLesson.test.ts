import {describe,it,expect} from 'vitest';
import {auditLesson} from '../scripts/lesson-audit';
import {proofDependencyFeedback} from '../../shared/src/proofDependencies';
import {incircleExternalBisectorCertificate,incircleExternalBisectorLesson,verifyIncircleExternalBisectorCertificate} from '../src/solver/incircleExternalBisectorLesson';

const text='Cho tam giác $ABC$. Gọi $D,E,F$ là các tiếp điểm của đường tròn $(I)$ nội tiếp tam giác $ABC$ với $BC,CA,AB$. Từ chân đường phân giác ngoài $L$ của góc $\\widehat{BAC}$ ($L\\in BC$), kẻ tiếp tuyến $LH$ đến $(I)$ ($H\\in(I)$, $H\\ne D$). Chứng minh đường tròn ngoại tiếp tam giác $ALH$ đi qua $I$.';

describe('external-angle-bisector incircle proof',()=>{
 it('states both right-angle reasons before applying the diameter criterion',()=>{
  const r=incircleExternalBisectorLesson(text)!;expect(r).not.toBeNull();
  expect(r.lesson.steps[0]!.math).toBe('AI\\perp AL');
  expect(r.lesson.steps[1]!.math).toBe('\\widehat{LAI}=90^\\circ');
  expect(r.lesson.steps[2]!.math).toBe('\\widehat{LHI}=90^\\circ');
  expect(r.lesson.steps[3]!.uses).toEqual(['s2','s3']);
  expect(proofDependencyFeedback(r.lesson,text)).toEqual([]);
  expect(auditLesson(r.lesson)).toMatchObject({schemaValid:true,latexErrors:[],languageErrors:[]});
  expect(JSON.stringify(r.lesson)).not.toMatch(/(?:AI|BE|CF|MK|ND)(?:perp|in)|(?<!\\)(?:coswidehat|lambda)/);
 });
 it('generalizes to renamed points and accepts the longer circle wording',()=>{
  const names:Record<string,string>={A:'P',B:'Q',C:'R',D:'S',E:'T',F:'U',I:'J',L:'V',H:'W'};
  const renamed=text.replace(/\$[^$]*\$/g,part=>part.replace(/[A-Z]/g,x=>names[x]??x)).replace('đến $(J)$','đến đường tròn $(J)$');
  expect(incircleExternalBisectorLesson(renamed)?.certificate).toMatchObject({a:'P',i:'J',l:'V',h:'W'});
 });
 it('declines a wrong side, a secant, an extra goal, and a forged certificate',()=>{
  expect(incircleExternalBisectorLesson(text.replace('$L\\in BC$','$L\\in AC$'))).toBeNull();
  expect(incircleExternalBisectorLesson(text.replace('tiếp tuyến $LH$','cát tuyến $LH$'))).toBeNull();
  expect(incircleExternalBisectorLesson(text+' Tính độ dài $LH$.')).toBeNull();
  const c=incircleExternalBisectorCertificate(text)!;expect(verifyIncircleExternalBisectorCertificate({...c,h:'X'})).toBe(false);
 });
});
