import {readFileSync,writeFileSync} from 'node:fs';
import {tidy} from '../src/solver/pipeline';
import {latexFeedback} from '../src/solver/latexCheck';
const phases=['development-algebra-all-fixed','development-algebra-exam-fixed','validation-algebra-current','validation-algebra-exam-variants','development-geometry-final-v216','validation-geometry-final-v216','development-number-theory-final-v227','validation-number-theory-final-v227','performance-number-theory-v227','development-combinatorics-final-v234','validation-combinatorics-final-v234'];
const results=[];
for(const phase of phases)for(const line of readFileSync(`tools/specialist-training/iteration-03/${phase}.jsonl`,'utf8').trim().split('\n')){
 const r=JSON.parse(line),lesson=r.body?.solution?.lesson;
 if(lesson)results.push({phase,id:r.id,feedback:latexFeedback(tidy(lesson))});
}
const summary={checkedAt:new Date().toISOString(),scope:'Replay of stored actual answers through current normalization and all-displayed-field KaTeX validation; not new model/API calls or held-out rescoring',lessons:results.length,passed:results.filter(r=>r.feedback.length===0).length,results};
writeFileSync('tmp/latex-quality/answer-audit.json',JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({lessons:summary.lessons,passed:summary.passed,failed:results.filter(r=>r.feedback.length)}));
if(summary.lessons!==summary.passed)process.exitCode=1;
