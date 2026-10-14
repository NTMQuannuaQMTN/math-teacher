import {ModelLessonSchema,type ModelLesson} from '../../../shared/src/solution';
export interface AlgebraDeduction {title:string;explanation:string;math:string|null;reason:string;question:string}

// These lessons are authored in TypeScript rather than received as JSON. A missed
// escape in a string literal turns `\frac` into a form-feed plus `rac`, while
// unknown escapes such as `\cdot` silently lose the slash. Restore only the
// commands in delimited/display mathematics; prose and the confirmed statement
// are deliberately left untouched.
const AUTHORED_COMMANDS = /(?<![\\A-Za-z])(Longleftrightarrow|Rightarrow|longmapsto|varnothing|widehat|dfrac|begin|cdots|equiv|ldots|mathbb|notin|pmod|qquad|sqrt|times|Delta|cdot|circ|end|frac|gcd|perp|quad|text|vdots|cap|ge|in|le|ne|not)(?![A-Za-z])/g;
function restoreAuthoredMath(input:string):string {
 return input
  .replace(/\x08(?=egin)/g,'\\b')
  .replace(/\x0c(?=rac)/g,'\\f')
  .replace(/\x0b(?=dots|arnothing)/g,'\\v')
  .replace(/\t(?=ext|imes)/g,'\\t')
  .replace(/\r(?=ightarrow)/g,'\\r')
  .replace(/\n(?=e(?:q)?|ot(?:in)?)/g,'\\n')
  .replace(/notequiv/g,'not\\equiv')
  .replace(/([A-Z])cap(?=[ A-Z])/g,'$1\\cap')
  .replace(/varnothingRightarrow/g,'varnothing\\Rightarrow')
  .replace(/(?<!\\)\\(?=\d|[A-Z]{2})/g,'\\\\')
  .replace(AUTHORED_COMMANDS,'\\$1');
}
function restoreAuthoredText(input:string):string {
 return input.split('$').map((part,index)=>index%2?restoreAuthoredMath(part):part).join('$');
}
/** Shared presentation only: callers must independently validate their mathematical certificates. */
export function algebraProofLesson(text:string,subtopic:string,strategy:string,details:AlgebraDeduction[],final:string,metadata:{topic?:ModelLesson['analysis']['topic'];givens?:string[];unknowns?:string[];constraints?:string[]}={}):ModelLesson|null {
 const authored=details.map(s=>({...s,explanation:restoreAuthoredText(s.explanation),math:s.math===null?null:restoreAuthoredMath(s.math)}));
 const steps=authored.map((s,i)=>({id:`s${i+1}`,title:s.title,explanation:s.explanation,math:s.math,reason:s.reason,uses:i?[`s${i}`]:[],geometryActions:[]}));
 const lesson={analysis:{statement:text,language:'vi',topic:metadata.topic??'algebra',subtopic,gradeLevel:9,withinCurriculum:true,concepts:[subtopic],techniques:[],givens:metadata.givens??[],unknowns:metadata.unknowns??['Kết luận cần chứng minh và các trường hợp phải xét'],constraints:metadata.constraints??[],status:'solvable',statusReason:null,interpretationNotes:[]},strategy,steps,hints:authored.filter((_,i)=>[0,1,2,Math.floor((authored.length-1)/2),authored.length-2,authored.length-1].includes(i)).map((s,i)=>({id:`h${i+1}`,level:Math.min(i+1,4) as 1|2|3|4,question:s.question,cue:s.reason,explanation:s.explanation,math:s.math,stepId:steps[authored.indexOf(s)]!.id,focus:[]})),finalAnswer:{text:restoreAuthoredText(final),math:null},answerChecks:[],figure:null} satisfies ModelLesson;
 const parsed=ModelLessonSchema.safeParse(lesson);return parsed.success?parsed.data:null;
}
