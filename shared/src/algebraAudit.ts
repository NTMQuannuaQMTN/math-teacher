import { evalExpression, variablesOf, parseExpression } from './expr';
import type { ModelLesson } from './solution';

/** Coefficient comparison for explicitly stated monic-quadratic factorisation hints.
 * This is a rejection check, not a general proof verifier. Unsupported notation is skipped.
 */
export function factorizationFeedback(lesson: ModelLesson, problemText=lesson.analysis.statement): string[] {
 const degree=(n:ReturnType<typeof parseExpression>):number=>{
  if(n.t==='num')return 0;if(n.t==='var')return 1;if(n.t==='neg')return degree(n.a);if(n.t!=='bin')return Infinity;
  const a=degree(n.a),b=degree(n.b);
  if(n.op==='+'||n.op==='-')return Math.max(a,b);if(n.op==='*')return a+b;
  if(n.op==='/'&&b===0)return a;
  if(n.op==='^'&&n.b.t==='num'&&Number.isInteger(n.b.v)&&n.b.v>=0&&n.b.v<=2)return a*n.b.v;
  return Infinity;
 };
 const equations=[...problemText.matchAll(/\$([^$]+)\$/g)].map(m=>m[1]!);
 let variable:string|null=null;let linear=0;let constant=0;
 for(const e of equations){
  const sides=e.split('=');if(sides.length!==2 || sides[1]!.trim()!=='0')continue;
  try{
   const expr=sides[0]!;if(degree(parseExpression(expr))!==2)continue;const vars=[...variablesOf(expr)];if(vars.length!==1)continue;
   const v=vars[0]!;const f=(x:number)=>evalExpression(expr,{[v]:x});
   const c=f(0),b=(f(1)-f(-1))/2,a=(f(1)+f(-1))/2-c;
   if(![a,b,c].every(Number.isFinite)||Math.abs(a-1)>1e-10)continue;
   if(![-3,-2,2,3].every(x=>Math.abs(f(x)-(x*x+b*x+c))<1e-9))continue;
   variable=v;linear=b;constant=c;break;
  }catch{continue;}
 }
 if(!variable)return [];
 const out:string[]=[];
 for(const h of lesson.hints){
  const text=[h.question,h.cue,h.explanation,h.math].filter(Boolean).join(' ').replace(/\$|\\left|\\right|\s/g,'');
  const factors=/\(([a-z])([+-])([a-z])\)\(\1\2([a-z])\)/.exec(text);
  if(!factors||factors[1]!==variable)continue;
  const [, , sign,p,q]=factors;
  for(const [pattern,wanted,name] of [[`${p}\\+${q}=(-?\\d+(?:\\.\\d+)?)`,sign==='+'?linear:-linear,'sum'],[`${p}${q}=(-?\\d+(?:\\.\\d+)?)`,constant,'product']] as const){
   const claim=new RegExp(pattern+'(?![\\d.])').exec(text);
   if(claim&&Math.abs(Number(claim[1])-wanted)>1e-9)out.push(`hint ${h.id}: factorisation ${factors[0]} requires ${name} ${wanted}, not ${claim[1]}; compare coefficients of the original quadratic and keep the signs consistent`);
  }
 }
 return out;
}
