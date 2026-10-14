import {AppError} from './errors';
/** One budget for token loading, fetch, body consumption, parsing and any recovery work.
 * Promise racing also bounds providers that ignore cancellation. */
export const SOLVE_VIEW_DEADLINE_MS=28_000;
export const SOLVE_REQUEST_DEADLINE_MS=27_000;
export async function withinRequestDeadline<T>(caller:AbortSignal|undefined,timeoutMs:number,work:(signal:AbortSignal)=>Promise<T>):Promise<T> {
 const started=Date.now();
 const controller=new AbortController();let rejectDeadline!:(error:AppError)=>void;
 const stopped=new Promise<never>((_,reject)=>{rejectDeadline=reject;});
 const cancel=()=>{rejectDeadline(new AppError('aborted',false));controller.abort();};
 const timer=setTimeout(()=>{rejectDeadline(new AppError('timeout',true));controller.abort();},timeoutMs);
 caller?.addEventListener('abort',cancel);
 try {
  if(caller?.aborted)throw new AppError('aborted',false);
  const result=await Promise.race([stopped,Promise.resolve().then(()=>work(controller.signal))]);
  if(Date.now()-started>=timeoutMs){controller.abort();throw new AppError('timeout',true);}
  return result;
 }finally{clearTimeout(timer);caller?.removeEventListener('abort',cancel);}
}
