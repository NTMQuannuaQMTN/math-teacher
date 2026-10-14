import { OcrFailure } from '../ocr/provider';

/** Bounds waiting even when a provider ignores cancellation; always releases its listener. */
export async function withinSignal<T>(signal: AbortSignal, work: () => Promise<T>): Promise<T> {
 if(signal.aborted) throw new OcrFailure('timeout','solve deadline exceeded',true);
 let abort!:()=>void;
 const cancelled=new Promise<never>((_,reject)=>{
  abort=()=>reject(new OcrFailure('timeout','solve deadline exceeded',true));
  signal.addEventListener('abort',abort,{once:true});
 });
 try{return await Promise.race([Promise.resolve().then(work),cancelled]);}
 finally{signal.removeEventListener('abort',abort);}
}
