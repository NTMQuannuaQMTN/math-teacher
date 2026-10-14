import {readFileSync,writeFileSync} from 'node:fs';
const input=JSON.parse(readFileSync('/tmp/math-game-live-eval-private.json','utf8')),results=[];
for(const c of input.cases){
 const start=performance.now(),startedAt=new Date().toISOString();
 const response=await fetch(`http://localhost:8797/v1/scans/${c.scan}/solve?q=q1`,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${input.token}`},body:JSON.stringify({regenerate:true}),signal:AbortSignal.timeout(30000)});
 const body=await response.json(),durationMs=performance.now()-start;
 results.push({id:c.originalQuestionId,text:c.text,startedAt,durationMs,status:response.status,body,scope:'Actual localhost:8797 HTTP request, parsing and complete serialized solution; current text already confirmed; no upload/OCR; no user authentication used; hosted inference and all fallbacks disabled'});
 writeFileSync('tools/specialist-training/game-theory-02/live-api-answers.json',JSON.stringify(results,null,2)+'\n');
 console.log(c.originalQuestionId,response.status,body.solution?.status,body.solution?.model,Math.round(durationMs)+'ms');
}
if(results.some(r=>r.status!==200||r.body.solution?.status!=='ready'||r.durationMs>30000))process.exitCode=1;
