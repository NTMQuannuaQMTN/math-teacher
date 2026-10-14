import {readFileSync} from 'node:fs';
import {normalizeProblemText} from '../../shared/src/mathText';
import {planProof} from '../../shared/src/proof/planner';
for(const id of ['ch-4','ptnk-2025-chuyen_4a','ptnk-2025-chuyen_4b']){
 const records=['chuyen.jsonl','problems.jsonl'].flatMap(f=>readFileSync('tools/benchmark/dataset/'+f,'utf8').trim().split('\n').map(x=>JSON.parse(x)));
 const plan=planProof(normalizeProblemText(records.find(x=>x.id===id).problem_text));
 console.log(JSON.stringify({id,status:plan.status,goals:plan.goals.map(g=>({label:g.label,proved:g.proved,problems:g.verification?.steps.flatMap(s=>s.problems)})),aux:plan.auxiliary}));
}
