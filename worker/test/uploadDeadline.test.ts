import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {runOcr} from '../src/ocr/service';
import {questionRequestDeadline,QUESTION_API_DEADLINE_MS} from '../src/requestDeadline';
import worker from '../src/index';
import type {Env} from '../src/env';
import type {OcrProvider} from '../src/ocr/provider';
const mocks=vi.hoisted(()=>({owner:vi.fn()}));
vi.mock('../src/auth',()=>({requireOwner:mocks.owner}));
beforeEach(()=>{vi.useFakeTimers();mocks.owner.mockReset();mocks.owner.mockResolvedValue('owner');vi.spyOn(AbortSignal,'timeout').mockImplementation(ms=>{const c=new AbortController();setTimeout(()=>c.abort(),ms);return c.signal;});});
afterEach(()=>{vi.restoreAllMocks();vi.useRealTimers();});
const image={bytes:new ArrayBuffer(4),contentType:'image/jpeg' as const};
describe('upload and whole question request deadlines',()=>{
 it('caps an oversized OCR setting and a provider that ignores abort at20 seconds',async()=>{
  const provider:OcrProvider={name:'unused',extract:vi.fn(()=>new Promise<never>(()=>{}))};
  const result=runOcr(provider,{OCR_TIMEOUT_MS:'450000'} as Env,image);
  const check=expect(result).rejects.toMatchObject({kind:'timeout'});await vi.advanceTimersByTimeAsync(20_000);await check;expect(provider.extract).toHaveBeenCalledOnce();
 });
 it('bounds OCR retries with one shared budget',async()=>{
  const provider:OcrProvider={name:'unused',extract:vi.fn().mockImplementationOnce(async()=>{await new Promise(resolve=>setTimeout(resolve,15_000));return {text:'not valid OCR JSON',model:'unused'};}).mockImplementation(()=>new Promise(()=>{}))};
  const result=runOcr(provider,{OCR_TIMEOUT_MS:'20000'} as Env,image);
  const check=expect(result).rejects.toMatchObject({kind:'timeout'});await vi.advanceTimersByTimeAsync(20_000);await check;expect(provider.extract).toHaveBeenCalledTimes(2);
 });
 it('bounds upload authentication before body parsing, and keeps a Vietnamese controlled API response',async()=>{
  mocks.owner.mockImplementation(()=>new Promise(()=>{}));
  const request=new Request('http://test.local/v1/scans',{method:'POST'});
  const result=worker.fetch(request,{ALLOWED_ORIGINS:''} as Env,{waitUntil:vi.fn()} as unknown as ExecutionContext);
  await vi.advanceTimersByTimeAsync(QUESTION_API_DEADLINE_MS);const response=await result;
  expect(response.status).toBe(503);expect(await response.json()).toMatchObject({error:{code:'ocr_timeout',retryable:true,message:expect.stringContaining('Không thể đọc ảnh')}});
 });
 it('bounds stalled current-question JSON parsing before confirmation persistence',async()=>{
  const request=new Request('http://test.local/v1/scans/00000000-0000-0000-0000-000000000000/confirm',{method:'POST'});vi.spyOn(request,'json').mockImplementation(()=>new Promise(()=>{}));
  const result=worker.fetch(request,{ALLOWED_ORIGINS:''} as Env,{waitUntil:vi.fn()} as unknown as ExecutionContext);
  await vi.advanceTimersByTimeAsync(QUESTION_API_DEADLINE_MS);expect((await (await result).json()) as object).toMatchObject({error:{code:'solve_timeout'}});
 });
 it('rejects stale completion after a clock jump even before the timer callback runs',async()=>{
  vi.spyOn(Date,'now').mockReturnValueOnce(0).mockReturnValueOnce(30000);
  await expect(questionRequestDeadline('ocr',async()=>42)).rejects.toMatchObject({code:'ocr_timeout'});
 });
 it('releases the timer on normal completion and retains existing errors',async()=>{
  expect(await questionRequestDeadline('solve',async()=>42)).toBe(42);expect(vi.getTimerCount()).toBe(0);
  const err=new Error('existing failure');await expect(questionRequestDeadline('ocr',async()=>{throw err;})).rejects.toBe(err);expect(vi.getTimerCount()).toBe(0);
 });
});
