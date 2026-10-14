import {parseHiddenBoardQuestion} from './hiddenBoardQuestion';
import type {ModelLesson} from './solution';
export interface HiddenSearchPlan {rows:2;columns:number;k:2|4;queries:[number,number][][]}

/** A query plan is checked against every possible moving position. Each
 * negative reply updates the whole belief set, not just a sampled path. */
export function checkHiddenSearchPlan(plan:HiddenSearchPlan):{valid:boolean;survivors:number[];reason:string|null} {
 const {columns:n,k,queries}=plan;
 if(plan.rows!==2||!Number.isInteger(n)||n<2||n>50||![2,4].includes(k)||queries.length<1||queries.length>2*(n-1))return {valid:false,survivors:[],reason:'Unsupported board, capacity or turn bound'};
 let possible=new Set(Array.from({length:2*n},(_,i)=>i));const survivors:number[]=[];
 for(const query of queries){
  if(query.length!==k||query.some(([r,c])=>!Number.isInteger(r)||!Number.isInteger(c)||r<1||r>2||c<1||c>n))return {valid:false,survivors,reason:'Illegal queried cells'};
  const removed=new Set(query.map(([r,c])=>(r-1)*n+c-1));if(removed.size!==k)return {valid:false,survivors,reason:'Repeated queried cell'};
  const next=new Set<number>();
  for(const cell of possible){
   const r=Math.floor(cell/n),c=cell%n;
   for(const destination of [(1-r)*n+c,...(c>0?[cell-1]:[]),...(c+1<n?[cell+1]:[])])if(!removed.has(destination))next.add(destination);
  }
  possible=next;survivors.push(possible.size);
 }
 return {valid:possible.size===0,survivors,reason:possible.size?'At least one legal evasion path remains':null};
}

/** Conservative scope recognition for enforcement, not a substitute for the
 * whole-task parser. Any full claimed moving-board proof must have a plan. */
export function hiddenSearchFeedback(lesson:ModelLesson,confirmedText:string):string[] {
 const plain=confirmedText.replace(/\$/g,'').replace(/\\+(?=times(?![A-Za-z]))/g,'\\').replace(/\s+/g,' ');
 const board=/2\s*(?:\\times|×)\s*(\d+)/u.exec(plain);
 if(!board||!plain.includes('An')||!plain.includes('Bình')||!/hỏi|kiểm tra|đoán|Truy Tìm|chọn k/u.test(plain))return [];
 if(!parseHiddenBoardQuestion(confirmedText))return ['Hidden-board movement, query order or extra rules are outside the confirmed certified scope'];
 const n=Number(board[1]);if(n<2||n>50)return ['Hidden-board rules exceed the supported certified scope'];
 const wanted=[...plain.matchAll(/k\s*=\s*([24])/gu)].map(m=>Number(m[1]));
 const caps=[...new Set(wanted)] as (2|4)[];
 if(!caps.length)return ['Hidden-board query capacity must be confirmed'];
 const plans=lesson.gamePlans??[];const errors:string[]=[];
 for(const k of caps){
  const plan=plans.find(p=>p.k===k&&p.columns===n);
  if(!plan){errors.push(`Missing explicit independently checkable query plan for k=${k}; counting total queries is not a moving-target proof`);continue;}
  const checked=checkHiddenSearchPlan(plan);
  if(!checked.valid||plan.queries.length>(k===4?n-1:2*(n-1)))errors.push(`Query strategy k=${k} is not a guaranteed win within the stated bound: ${checked.reason??'too many turns'}`);
 }
 return errors;
}
