import {readFileSync,writeFileSync} from 'node:fs';
import {certifiedNumberTheoryLesson} from '../src/solver/certifiedNumberTheory';
import {latexFeedback} from '../src/solver/latexCheck';
import {cleanLanguage} from '../../shared/src/language';
import {numericDivisibilityFeedback} from '../../shared/src/numericDivisibility';
import {tidy} from '../src/solver/pipeline';
import {verifyLesson} from '../../shared/src/verify';
const cases=JSON.parse(readFileSync('tools/specialist-training/iteration-03/cases.json','utf8')).filter((c:any)=>c.domain==='number_theory');
const result=[];const warnings:string[]=[];const originalWarn=console.warn;
for(const c of cases){
 console.warn=(...args)=>warnings.push(args.join(' '));const start=warnings.length;
 try{const r=certifiedNumberTheoryLesson(c.text),cleaned=r?cleanLanguage(tidy(r.lesson)):null;const latex=cleaned?latexFeedback(cleaned.lesson):[],language=cleaned?cleaned.feedback:[],arithmetic=cleaned?numericDivisibilityFeedback(cleaned.lesson):[];
 const checked=cleaned?verifyLesson(cleaned.lesson,{problemText:c.text}):null;
 result.push({id:c.id,implemented:!!r,certificate:r?.verify()??false,latex,language,arithmetic,verification:checked?.verification??null,feedback:checked?.feedback??[],rendererWarnings:warnings.slice(start)});
 }finally{console.warn=originalWarn;}
}
writeFileSync('tools/specialist-training/iteration-03/number-theory-source-preflight.json',JSON.stringify({scope:'Source-level generator/certificate preflight only. Not actual app execution or independent mathematics.',result},null,2)+'\n');
const bad=result.filter(r=>!r.implemented||!r.certificate||r.verification?.status==='unverified'||r.latex.length||r.language.length||r.arithmetic.length||r.rendererWarnings.length);
console.log(JSON.stringify({total:result.length,passed:result.length-bad.length,bad},null,2));if(bad.length)process.exitCode=1;
