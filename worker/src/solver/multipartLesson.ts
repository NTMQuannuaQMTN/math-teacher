import {repairLatex} from '../../../shared/src/mathText';
import {ModelLessonSchema,type ModelLesson} from '../../../shared/src/solution';
import {parameterEquationLesson} from './parameterEquation';
import {rootFourthPowerLesson} from './rootFourthPower';
import {rootRadicalProductLesson} from './rootRadicalProduct';
import {verifyParameterCertificate,verifyRootFourthPowerCertificate,verifyRootRadicalProductCertificate} from '../../../shared/src/rationalPolynomial';
import {quadraticNormLesson,verifyNormCertificate} from './quadraticNormLesson';

/** Compose whole, independently checked parts. Never slice away steps to fit
 * the schema or omit an unrecognized subquestion. */
export function multipartLesson(text:string):{lesson:ModelLesson;verify:()=>boolean;coverage:'complete'|'partial'}|null {
 const normalized=repairLatex(text).replace(/^(?:Câu|Bài)\s+\d+(?:\s*\([\d.,]+\s*điểm\))?\.\s*/u,'').replace(/\(([a-z]) là tham số\)/u,'($$$1$$ là tham số)').replace(/với mọi ([a-z]) phương trình/u,'với mọi $$$1$$ phương trình');
 const chunks=normalized.trim().split(/(?:^|\s)([a-c])\)\s*/u);
 if(chunks.length!==7||chunks[1]!=='a'||chunks[3]!=='b'||chunks[5]!=='c')return null;
 let prefix=chunks[0]!.trim();
 const tasks=[chunks[2]!,chunks[4]!,chunks[6]!].map(s=>s.trim());
 // The shared numbered condition is optional in ordinary question wording.
 const numberTheory=/^Cho các số nguyên dương /u.test(prefix);
 if(numberTheory&&!/\(1\)\.$/.test(prefix))prefix=prefix.replace(/\.\s*$/,' (1).');
 const parts:ModelLesson[]=[],checks:(()=>boolean)[]=[];let coverage:'complete'|'partial'='complete';
 for(let i=0;i<tasks.length;i++) {
  let task=tasks[i]!;
  if(numberTheory) {
   task=task.replace(/thỏa mãn khi /u,'thỏa mãn (1) khi ').replace(/thỏa mãn biết /u,'thỏa mãn (1) biết ').replace(/thỏa mãn thì /u,'thỏa mãn (1) thì ');
   const r=quadraticNormLesson(prefix+' '+task);if(!r)return null;
   parts.push(r.lesson);checks.push(()=>verifyNormCertificate(r.certificate));
   if(r.certificate.task.kind!=='fixed')coverage='partial';
  }else{
   const input=prefix+' '+task;
   if(i===0){const r=parameterEquationLesson(input);if(!r||!r.certificate.universallyDistinct)return null;parts.push(r.lesson);checks.push(()=>verifyParameterCertificate(r.certificate));}
   if(i===1){const r=rootFourthPowerLesson(input);if(!r)return null;parts.push(r.lesson);checks.push(()=>verifyRootFourthPowerCertificate(r.certificate));}
   if(i===2){const r=rootRadicalProductLesson(input);if(!r)return null;parts.push(r.lesson);checks.push(()=>verifyRootRadicalProductCertificate(r.certificate));}
  }
 }
 if(!checks.every(check=>check()))return null;
 const steps=parts.flatMap((part,index)=>part.steps.map(s=>({...s,id:`p${index+1}_${s.id}`,title:`${String.fromCharCode(97+index)}) ${s.title}`,uses:s.uses.map(id=>`p${index+1}_${id}`)})));
 const hints=parts.flatMap((part,index)=>{
  const selected=part.hints.length<=2?part.hints:[part.hints[0]!,part.hints[Math.floor(part.hints.length/2)]!,part.hints.at(-1)!];
  // Two hints for a), three for each remaining part; no solution steps lost.
  return selected.slice(0,index===0?2:3).map(h=>({...h,id:`p${index+1}_${h.id}`,question:`${String.fromCharCode(97+index)}) ${h.question}`,stepId:`p${index+1}_${h.stepId}`}));
 });
 const parsed=ModelLessonSchema.safeParse({...parts[0],analysis:{...parts[0]!.analysis,statement:text,topic:numberTheory?'number_theory':'algebra',unknowns:tasks,concepts:[...new Set(parts.flatMap(p=>p.analysis.concepts))].slice(0,12)},strategy:parts.map((p,i)=>`${String.fromCharCode(97+i)}) ${p.strategy}`).join('\n'),steps,hints,answerChecks:parts.flatMap(p=>p.answerChecks),finalAnswer:{text:parts.map((p,i)=>`${String.fromCharCode(97+i)}) ${p.finalAnswer.text}`).join('\n'),math:null}});
 return parsed.success?{lesson:parsed.data,verify:()=>checks.every(check=>check()),coverage}:null;
}
