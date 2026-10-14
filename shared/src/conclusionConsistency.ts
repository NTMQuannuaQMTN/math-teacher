import {evalExpression} from './expr';
import {parseMathText} from './mathText';
import type {ModelLesson} from './solution';

/** Rejection guard only: two explicit numerical values for the same scalar may not contradict one another.
 * It proves neither that the common value is correct nor that symbolic/proof conclusions are complete.
 */
export function conclusionConsistencyFeedback(lesson:ModelLesson,question=lesson.analysis.statement):string[] {
 if(!/(?:rút gọn|tính (?:giá trị|biểu thức)|giá trị của)/iu.test(question)||/(?:gần đúng|làm tròn|xấp xỉ)/iu.test(question))return [];
 const quantities=new Set(parseMathText(question).filter(s=>s.kind==='math').flatMap(s=>[...s.value.matchAll(/(?:^|[;,]|\\quad)\s*([A-Za-z](?:_?\d+)?)\s*=/g)].map(m=>m[1]!)));
 const quantity=[...quantities][0],last=lesson.steps.at(-1);if(quantities.size!==1||!quantity||!last)return [];
 const numeric=(source:string):number|null=>{
  try{const value=evalExpression(source,{});return Number.isFinite(value)?value:null;}catch{return null;}
 };
 const rhs=(source:string,allowBare:boolean):number[]=>{
  const formulas=parseMathText(source).filter(s=>s.kind==='math').map(s=>s.value);if(!formulas.length)formulas.push(source);
  return formulas.flatMap(formula=>formula.replace(/\\(?:begin|end)\{(?:gathered|aligned|cases)\}/g,'').replace(/&/g,'').split(/\\\\/u).flatMap(line=>{
   if(/[<>]|\\(?:le|ge|approx)/u.test(line))return [];
   const chain=line.split('=');let expression:string;
   if(chain.length>1){if(chain[0]!.trim()!==quantity)return [];expression=chain.at(-1)!.trim();}
   else{if(!allowBare)return [];expression=line.trim();}
   const value=numeric(expression);return value===null?[]:[value];
  }));
 };
 const worked=[...rhs(last.math??'',false),...rhs(last.result??'',false),...rhs(last.explanation,false)];
 const finals=[...rhs(lesson.finalAnswer.math??'',true),...rhs(lesson.finalAnswer.text,false)];
 const conflicts=worked.flatMap(value=>finals.filter(final=>Math.abs(final-value)>1e-7*Math.max(1,Math.abs(final),Math.abs(value))).map(final=>`final conclusion contradicts the worked last step for ${quantity}: ${final} versus ${value}; recompute the expression and make the last-step conclusion and finalAnswer metadata agree`));
 return [...new Set(conflicts)];
}
