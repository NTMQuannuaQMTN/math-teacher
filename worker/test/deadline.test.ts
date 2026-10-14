import { afterEach,describe,expect,it,vi } from 'vitest';
import { withinSignal } from '../src/solver/deadline';
import { solveProblem as solveWithModel } from '../src/solver/pipeline';
import { VN_GRADE_9 } from '../src/solver/curriculum';
import type { JsonModel } from '../src/solver/llm';
import { solveScan } from '../src/routes/solve';
import type { RouteContext } from '../src/routes/scans';

// These tests exercise inference, retries and hygiene; exact algebra is tested separately.
const solveProblem:typeof solveWithModel=(model,curriculum,text,options)=>solveWithModel(model,curriculum,text,{...options,exactAlgebra:false});
afterEach(()=>{vi.restoreAllMocks();vi.useRealTimers();});
describe('deadline enforcement',()=>{
 it('bounds the complete route while its initial database read never resolves',async()=>{
  vi.useFakeTimers();
  // Node's native AbortSignal.timeout bypasses Vitest's clock; use the platform timer contract.
  vi.spyOn(AbortSignal,'timeout').mockImplementation(ms=>{const c=new AbortController();setTimeout(()=>c.abort(),ms);return c.signal;});
  const stalled={bind:()=>stalled,first:()=>new Promise(()=>{})};
  const rc={request:new Request('http://localhost/v1/scans/test/solve',{method:'POST'}),ownerId:'test',env:{DB:{prepare:()=>stalled},SOLVE_TIMEOUT_MS:'170000'},ctx:{waitUntil:()=>{}},origin:'http://localhost'} as unknown as RouteContext;
  const assertion=expect(solveScan(rc,'test')).rejects.toMatchObject({status:503,code:'solve_timeout'});
  await vi.advanceTimersByTimeAsync(29000);await assertion;
 });
 it('terminates waiting on a provider that ignores AbortSignal',async()=>{
  vi.useFakeTimers();const controller=new AbortController();let calls=0;
  const model:JsonModel={name:'local',model:'unresponsive',complete:async()=>{calls++;return new Promise(()=>{});}};
  const result=solveProblem(model,VN_GRADE_9,'Giải phương trình $x+1=2$.',{signal:controller.signal,computeFirst:false});
  const assertion=expect(result).rejects.toMatchObject({kind:'timeout'});
  await vi.advanceTimersByTimeAsync(26000);controller.abort();await assertion;expect(calls).toBe(1);
 });
 it('never starts work after cancellation',async()=>{
  const c=new AbortController();c.abort();const work=vi.fn(async()=>1);
  await expect(withinSignal(c.signal,work)).rejects.toMatchObject({kind:'timeout'});expect(work).not.toHaveBeenCalled();
 });
 it('removes its abort listener on success',async()=>{
  const c=new AbortController();const remove=vi.spyOn(c.signal,'removeEventListener');
  expect(await withinSignal(c.signal,async()=>42)).toBe(42);expect(remove).toHaveBeenCalled();
 });
});
