import {parseMathText} from './mathText';
import type {ModelLesson} from './solution';
/** Inspect complete clauses separated by actual display rows, or a comma and
 * explicit spacing. Never extract a numeric tail from a symbolic expression. */
function numericClauses(formula:string):string[] {
 const unwrapped=formula.replace(/\\(?:begin|end)\{(?:gathered|aligned)\}/gu,'');
 return unwrapped.split(/\\\\|[,;]\s*\\(?:qquad|quad)(?![A-Za-z])/gu)
  .map(row=>row.replace(/&/gu,' ').replace(/\{([+-]?\d{1,60})\}/gu,'$1').trim());
}
/** A narrowly scoped exact check. It never tests symbolic claims by sampling,
 * and never mistakes the original question or requested conclusion for a proved fact. */
export function numericDivisibilityFeedback(lesson:ModelLesson):string[] {
 const fields:{where:string;value:string|null;math?:boolean}[]=[];
 const text=(where:string,value:string|null)=>fields.push({where,value});
 const math=(where:string,value:string|null)=>fields.push({where,value,math:true});
 text('strategy',lesson.strategy);
 for(const h of lesson.hints){text(`hint ${h.id} question`,h.question);text(`hint ${h.id} cue`,h.cue);text(`hint ${h.id} explanation`,h.explanation);math(`hint ${h.id} math`,h.math);}
 for(const s of lesson.steps){text(`step ${s.id} title`,s.title);text(`step ${s.id} explanation`,s.explanation);text(`step ${s.id} reason`,s.reason);math(`step ${s.id} math`,s.math);}
 text('conclusion',lesson.finalAnswer.text);math('conclusion math',lesson.finalAnswer.math);
 const issues:string[]=[];
 for(const f of fields){
  if(!f.value)continue;const formulae=f.math?[f.value]:parseMathText(f.value).flatMap(s=>s.kind==='math'?[s.value]:[]);
  for(const formula of formulae.flatMap(numericClauses)){
   const match=/^\s*(\(?[+-]?\d{1,60}\)?)\s*(\\not\s*)?\\vdots\s*(\(?[+-]?\d{1,60}\)?)\s*$/u.exec(formula);if(!match)continue;
   const integer=(s:string)=>BigInt(s.replace(/[()]/g,''));
   let left:bigint,right:bigint;try{left=integer(match[1]!);right=integer(match[3]!);}catch{continue;}
   if(right===0n)issues.push(`${f.where}: numeric divisibility by0 is undefined; use a nonzero divisor.`);
   else if((left%right===0n)===!!match[2])issues.push(`${f.where}: the displayed numeric assertion ${formula} is false; actual remainder is ${left%right}. Check hints as well as solution steps.`);
  }
 }
 return [...new Set(issues)];
}
