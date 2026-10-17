import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {incircleCaseLesson,incircleCertificate,verifyIncircleCertificate} from '../src/solver/incircleCaseLesson';
import {resolveFigure} from '../../shared/src/geometry';
import {verifyLesson} from '../../shared/src/verify';
import {proofDependencyFeedback} from '../../shared/src/proofDependencies';
import {auditLesson} from '../scripts/lesson-audit';
import {solveProblem} from '../src/solver/pipeline';
import {VN_GRADE_9} from '../src/solver/curriculum';
const text:string=JSON.parse(readFileSync(new URL('../../tools/specialist-training/iteration-03/cases.json',import.meta.url),'utf8')).find((c:any)=>c.id==='geo3-incircle-multipart').text;
describe('complete incircle configuration has an explicit intersection witness',()=>{
 it('covers all parts and keeps the structural certificate distinct from formal proof',()=>{
  expect(incircleCertificate(text)).not.toBeNull();
  const result=incircleCaseLesson(text)!;expect(result).not.toBeNull();const l=result.lesson;
  expect(verifyIncircleCertificate(result.certificate)).toBe(true);
  expect(auditLesson(l)).toMatchObject({schemaValid:true,latexErrors:[],languageErrors:[]});
  expect(proofDependencyFeedback(l,text)).toEqual([]);
  const checked=verifyLesson(l,{problemText:text});expect(checked.feedback).toEqual([]);
  expect(l.steps.at(-1)!.explanation).toContain('điểm $P$ thuộc $(I)$');
  // Review 2026-10-15: prove what is asked directly — no configuration proofs, no symmetry mapping, no "∩" notation.
  expect(l.steps[6]!.explanation).toContain('thẳng hàng');expect(l.steps[6]!.explanation).not.toContain('Nếu');
  expect(l.steps.map(s=>s.explanation+(s.math??'')).join('\n')).not.toMatch(/đối xứng|\\cap|∩|không thẳng hàng|nằm trong đoạn/);
  expect(l.steps[10]!.explanation).toContain('là giao điểm của hai đường thẳng');
  expect(l.hints).toHaveLength(8);
 });
 it('checks the actual dependent figure under diverse admissible acute triangles',()=>{
  const l=incircleCaseLesson(text)!.lesson;
  for(const x of [.03,.11,.33,.49])for(const factor of [1.01,2,5]) {
   const a={x,y:Math.sqrt(x*(1-x))*factor},b={x:0,y:0},c={x:1,y:0};
   const f={...l.figure!,points:l.figure!.points.map(p=>p.id==='A'?{...p,...a}:p.id==='B'?{...p,...b}:p.id==='C'?{...p,...c}:p)};
   const r=resolveFigure(f);expect(r.errors).toEqual([]);const p=r.points;
   const distance=(u:string,v:string)=>Math.hypot(p[u]!.x-p[v]!.x,p[u]!.y-p[v]!.y);
   const cross=(u:string,v:string,w:string)=>Math.abs((p[v]!.x-p[u]!.x)*(p[w]!.y-p[u]!.y)-(p[v]!.y-p[u]!.y)*(p[w]!.x-p[u]!.x));
   expect(distance('I','D')**2).toBeCloseTo(distance('I','J')*distance('I','A'));
   expect(cross('A','G','D')).toBeLessThan(1e-8);
   expect(cross('G','J','P')).toBeLessThan(1e-8);expect(cross('A','L','P')).toBeLessThan(1e-8);
   expect(distance('I','P')).toBeCloseTo(distance('I','D'));
  }
 });
 it('accepts a full point renaming and avoids colliding with the witness name',()=>{
  const map:Record<string,string>={A:'M',B:'N',C:'R',I:'O',D:'X',E:'Y',F:'Z',J:'T',K:'U',H:'V',L:'W',G:'P',S:'Q'};
  const renamed=text.replace(/(?<![\p{L}])[A-Z]{1,4}(?![\p{L}])/gu,t=>[...t].map(q=>map[q]??q).join(''));
  const l=incircleCaseLesson(renamed)!.lesson;
  expect(l.steps[8]!.explanation).toContain('Gọi $S$ là giao điểm thứ hai');
  expect(auditLesson(l)).toMatchObject({schemaValid:true,latexErrors:[],languageErrors:[]});
  expect(proofDependencyFeedback(l,renamed)).toEqual([]);
 });
 it.each([text+' Tính diện tích tam giác ABC.',text.replace('AB < AC','AB = AC'),text.replace('đường tròn đường kính $AI$','đường tròn đường kính $AD$')])('declines a changed complete question',s=>expect(incircleCaseLesson(s)).toBeNull());
 it('returns a complete narrative proof without an inference call while reporting partial formal verification',async()=>{
  const model={name:'local',model:'unavailable',complete:async()=>{throw Error('must not call');}};
  const result=await solveProblem(model,VN_GRADE_9,text,{signal:AbortSignal.timeout(1500)});
  expect(result.model).toBe('geometry-incircle-case-proof');expect(result.verification.status).toBe('partial');expect(result.attempts).toBe(0);
 });
});
