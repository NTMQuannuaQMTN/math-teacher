import {readFileSync,writeFileSync} from 'node:fs';
const privateInput=JSON.parse(readFileSync('/tmp/math-game-heldout-private.json','utf8'));
const cases=JSON.parse(readFileSync('tools/specialist-training/game-theory-02/heldout-questions.json','utf8')).cases,results=[];
for(const c of cases){
 const start=performance.now(),startedAt=new Date().toISOString();
 const response=await fetch(`http://localhost:8797/v1/scans/${c.scan}/solve?q=q1`,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${privateInput.token}`},body:JSON.stringify({regenerate:true}),signal:AbortSignal.timeout(30000)});
 const body=await response.json();results.push({...c,startedAt,durationMs:performance.now()-start,status:response.status,body,scope:'Frozen-source isolated local Worker/D1: confirmation already seeded, actual HTTP parsing/generation/verification/serialization; all hosted inference/fallbacks and OCR disabled. Render latency is measured separately.'});
 writeFileSync('tools/specialist-training/game-theory-02/heldout-answers.json',JSON.stringify(results,null,2)+'\n');
 console.log(c.id,response.status,body.solution?.status,body.solution?.model,Math.round(results.at(-1).durationMs)+'ms');
}
if(results.some(r=>r.durationMs>30000||r.body.solution?.status==='pending'))process.exitCode=1;
