import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({token:vi.fn(async()=> 'test-token')}));
vi.mock('expo-file-system',()=>({File:class{}}));
vi.mock('react-native',()=>({Platform:{OS:'web'}}));
vi.mock('../src/lib/config',()=>({API_URL:'http://test.local'}));
vi.mock('../src/lib/deviceToken',()=>({getDeviceToken:mocks.token}));
import {api} from '../src/api/client';
import {withinRequestDeadline,SOLVE_VIEW_DEADLINE_MS,SOLVE_REQUEST_DEADLINE_MS} from '../src/api/deadline';
beforeEach(()=>{vi.useFakeTimers();vi.stubGlobal('__DEV__',false);mocks.token.mockReset();mocks.token.mockResolvedValue('test-token');});
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
describe('the complete application question deadline',()=>{
 it('bounds a stalled local image blob before upload or OCR can start',async()=>{
  const fetch=vi.fn(async()=>({blob:()=>new Promise(()=>{})}));vi.stubGlobal('fetch',fetch);
  const check=expect(api.createScan({imageUri:'blob:test-image',source:'library',idempotencyKey:'test-upload-key'})).rejects.toMatchObject({kind:'timeout'});
  await vi.advanceTimersByTimeAsync(SOLVE_REQUEST_DEADLINE_MS);await check;expect(fetch).toHaveBeenCalledOnce();expect(mocks.token).not.toHaveBeenCalled();
 });
 it('bounds the complete upload response body after an image is read',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce({blob:async()=>new Blob(['image'],{type:'image/jpeg'})}).mockResolvedValueOnce({ok:true,status:201,json:()=>new Promise(()=>{})}));
  const check=expect(api.createScan({imageUri:'blob:test-image',source:'library',idempotencyKey:'test-upload-key'})).rejects.toMatchObject({kind:'timeout'});
  await vi.advanceTimersByTimeAsync(SOLVE_REQUEST_DEADLINE_MS);await check;expect(mocks.token).toHaveBeenCalledOnce();
 });
 it('bounds token loading before any network request',async()=>{
  mocks.token.mockImplementation(()=>new Promise(()=>{}));const fetch=vi.fn();vi.stubGlobal('fetch',fetch);
  const check=expect(api.solve('scan')).rejects.toMatchObject({kind:'timeout',retryable:true});
  await vi.advanceTimersByTimeAsync(SOLVE_REQUEST_DEADLINE_MS);await check;expect(fetch).not.toHaveBeenCalled();
 });
 it('keeps the timer running after headers while the JSON body stalls',async()=>{
  const read=vi.fn(()=>new Promise(()=>{}));vi.stubGlobal('fetch',vi.fn(async()=>({status:200,ok:true,json:read})));
  const check=expect(api.solve('scan')).rejects.toMatchObject({kind:'timeout'});
  await vi.advanceTimersByTimeAsync(SOLVE_REQUEST_DEADLINE_MS);await check;expect(read).toHaveBeenCalledOnce();
 });
 it('bounds fetch even when the transport ignores cancellation',async()=>{
  vi.stubGlobal('fetch',vi.fn(()=>new Promise(()=>{})));
  const check=expect(api.solve('scan')).rejects.toMatchObject({kind:'timeout'});
  await vi.advanceTimersByTimeAsync(SOLVE_REQUEST_DEADLINE_MS);await check;
 });
 it('uses a single screen budget across a failed request and a stuck recovery',async()=>{
  const signals:AbortSignal[]=[];
  const result=withinRequestDeadline(undefined,SOLVE_VIEW_DEADLINE_MS,async signal=>{
   signals.push(signal);await new Promise(resolve=>setTimeout(resolve,27000));return new Promise(()=>{});
  });
  const check=expect(result).rejects.toMatchObject({kind:'timeout'});
  await vi.advanceTimersByTimeAsync(28000);await check;expect(signals[0]!.aborted).toBe(true);
 });
 it('honors user cancellation without invoking a pre-cancelled operation',async()=>{
  const controller=new AbortController();controller.abort();const work=vi.fn();
  await expect(withinRequestDeadline(controller.signal,28000,work)).rejects.toMatchObject({kind:'aborted',retryable:false});expect(work).not.toHaveBeenCalled();expect(vi.getTimerCount()).toBe(0);
 });
 it('rejects a stale result after clock advances without a scheduled timer callback',async()=>{
  vi.spyOn(Date,'now').mockReturnValueOnce(0).mockReturnValueOnce(30000);
  await expect(withinRequestDeadline(undefined,27000,async()=>42)).rejects.toMatchObject({kind:'timeout'});vi.restoreAllMocks();
 });
 it('cleans up on successful parsing and preserves typed errors',async()=>{
  expect(await withinRequestDeadline(undefined,1000,async()=>42)).toBe(42);expect(vi.getTimerCount()).toBe(0);
  const error=Object.assign(new Error('invalid'),{kind:'invalid_response'});
  await expect(withinRequestDeadline(undefined,1000,async()=>{throw error;})).rejects.toBe(error);expect(vi.getTimerCount()).toBe(0);
 });
});
