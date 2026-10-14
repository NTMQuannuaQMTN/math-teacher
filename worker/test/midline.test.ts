import { describe, expect, it } from 'vitest';
import { planProof } from '../../shared/src/proof/planner';
import { verifyProof } from '../../shared/src/proof/verify';
import { solveProblem } from '../src/solver/pipeline';
import { VN_GRADE_9 } from '../src/solver/curriculum';
import type { JsonModel } from '../src/solver/llm';
describe('midpoint theorem: actual proof generation and independent verification',()=>{
 it.each([['ABC','M','N'],['PQR','X','Y']])('proves parallelism and half-length for %s',async(tri,m,n)=>{
  const [a,b,c]=tri!.split('');
  const text=`Cho tam giác $${tri}$, $${m}$ là trung điểm của $${a}${b}$, $${n}$ là trung điểm của $${a}${c}$. Chứng minh $${m}${n}\\parallel ${b}${c}$ và $${m}${n}=\\frac{${b}${c}}{2}$.`;
  const plan=planProof(text);
  expect(plan.unparsed).toEqual([]);expect(plan.goals).toHaveLength(2);expect(plan.status).toBe('VERIFIED');
  for(const g of plan.goals)expect(g.verification?.ok).toBe(true);
  const never:JsonModel={name:'unavailable',model:'unavailable',complete:async()=>{throw Error('must not call model');}};
  const result=await solveProblem(never,VN_GRADE_9,text,{signal:AbortSignal.timeout(26000)});
  expect(result.model).toBe('proof-planner');expect(result.lesson.steps.map(s=>s.explanation).join(' ')).toContain('đường trung bình');
  const g=plan.goals.find(g=>g.fact.t==='prod')!;
  const broken=g.proof.map(d=>d.method==='MIDLINE'&&d.fact.t==='prod'?{...d,fact:{...d.fact,rhs:d.fact.rhs.map(f=>'number' in f?{...f,number:3}:f)}}:d);
  expect(verifyProof(plan.figure!,broken,[g.fact]).ok).toBe(false);
 });
});
