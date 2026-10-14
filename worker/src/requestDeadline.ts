import {ApiError} from './http';
/** Starts before authentication/body parsing; cannot be extended by provider settings. */
export const QUESTION_API_DEADLINE_MS=29_000;
export async function questionRequestDeadline<T>(kind:'ocr'|'solve',work:()=>Promise<T>):Promise<T> {
 const started=Date.now();
 const timeout=()=>new ApiError(503,kind==='ocr'?'ocr_timeout':'solve_timeout',kind==='ocr'?'Không thể đọc ảnh trong thời gian cho phép. Hãy tải lại ảnh hoặc nhập đề bài.':'Không thể xử lý đề bài trong thời gian cho phép. Hãy thử lại.',true);
 let timer:ReturnType<typeof setTimeout>|undefined;
 const expired=new Promise<never>((_,reject)=>{
  timer=setTimeout(()=>reject(timeout()),QUESTION_API_DEADLINE_MS);
 });
 try{const result=await Promise.race([Promise.resolve().then(work),expired]);if(Date.now()-started>=QUESTION_API_DEADLINE_MS)throw timeout();return result;}
 finally{if(timer!==undefined)clearTimeout(timer);}
}
