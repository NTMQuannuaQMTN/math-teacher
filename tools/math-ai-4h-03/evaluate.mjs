import {randomBytes} from 'node:crypto';
import {appendFileSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {auditLesson,routingForQuestion} from './current-lesson-audit.mjs';

const phase=process.argv[2]??'baseline',split=process.argv[3]??'development';
const output=`tools/math-ai-4h-03/${phase}-${split}.jsonl`;rmSync(output,{force:true});
const rows=readFileSync('tools/math-ai-4h-03/benchmark-v1.jsonl','utf8').trim().split('\n').map(JSON.parse).filter(row=>row.split===split);
const fixture=readFileSync('tools/ocr-eval/fixtures/02-quadratic-vi.jpg');
const token=randomBytes(32).toString('base64url');
async function request(path,body,headers={}){const response=await fetch(`http://127.0.0.1:8799${path}`,{method:'POST',headers:{authorization:`Bearer ${token}`,...headers},body,signal:AbortSignal.timeout(30000)});const raw=await response.text();let parsed;try{parsed=JSON.parse(raw)}catch{parsed={error:{code:'non_json',message:raw}}}return{httpStatus:response.status,body:parsed};}
const fold=value=>value.normalize('NFC').toLowerCase().replace(/\\(?:dfrac|frac)/g,'').replace(/[\s{}$\\]/g,'');
for(const row of rows){
 const startedAt=new Date().toISOString(),start=performance.now();let result;
 try{
  // OCR is invoked only to create the upload object.  The confirmed benchmark text is the sole solve input.
  const form=new FormData();form.append('image',new Blob([fixture],{type:'image/jpeg'}),'setup.jpg');
  const scan=await request('/v1/scans',form,{'Idempotency-Key':randomBytes(18).toString('base64url')});const scanId=scan.body.scan?.id;if(!scanId)throw new Error(`scan setup failed: ${JSON.stringify(scan.body)}`);
  const confirmed=await request(`/v1/scans/${scanId}/confirm`,JSON.stringify({text:row.normalizedStatement}),{'content-type':'application/json'});if(confirmed.httpStatus!==200)throw new Error(`confirm failed: ${JSON.stringify(confirmed.body)}`);
  const solved=await request(`/v1/scans/${scanId}/solve`,JSON.stringify({regenerate:true}),{'content-type':'application/json'});
  const durationMs=performance.now()-start,lesson=solved.body.solution?.lesson,renderAudit=lesson?auditLesson(lesson):null,displayed=lesson?fold(JSON.stringify(lesson)):'';
  const fragmentPass=Boolean(lesson&&row.evaluationCriteria.acceptAllFragments.every(fragment=>displayed.includes(fold(fragment))));
  const qualityPass=Boolean(lesson&&renderAudit?.schemaValid&&renderAudit.latexErrors.length===0&&renderAudit.languageErrors.length===0);
  const ready=solved.body.solution?.status==='ready',verified=solved.body.solution?.verification?.status==='verified';
  const controlled=durationMs<30000&&(ready||Boolean(solved.body.error)||['failed','partial'].includes(solved.body.solution?.status));
  result={...row,phase,startedAt,durationMs,httpStatus:solved.httpStatus,status:solved.body.solution?.status??'controlled_error',verificationStatus:solved.body.solution?.verification?.status??null,model:solved.body.solution?.model??null,routedDomains:routingForQuestion(row.normalizedStatement),renderAudit,fragmentPass,qualityPass,mathematicalProxyPass:ready&&verified&&fragmentPass&&qualityPass,controlledWithin30s:controlled,response:solved.body};
 }catch(error){result={...row,phase,startedAt,durationMs:performance.now()-start,status:'harness_error',controlledWithin30s:false,error:String(error)}}
 appendFileSync(output,JSON.stringify(result)+'\n');console.log(`${row.id}: ${result.durationMs.toFixed(0)}ms ${result.status} verified=${result.verificationStatus??'-'} proxy=${result.mathematicalProxyPass??false}`);
}
const results=readFileSync(output,'utf8').trim().split('\n').map(JSON.parse),domains=['algebra','geometry','number_theory','combinatorics'];
const measure=xs=>({n:xs.length,ready:xs.filter(r=>r.status==='ready').length,verified:xs.filter(r=>r.verificationStatus==='verified').length,mathematicalProxyPasses:xs.filter(r=>r.mathematicalProxyPass).length,qualityPasses:xs.filter(r=>r.qualityPass).length,controlledWithin30s:xs.filter(r=>r.controlledWithin30s).length,maxMs:Math.max(...xs.map(r=>r.durationMs)),meanMs:xs.reduce((s,r)=>s+r.durationMs,0)/xs.length});
const summary={phase,split,...measure(results),perDomain:Object.fromEntries(domains.map(domain=>[domain,measure(results.filter(r=>r.topic===domain))]))};writeFileSync(`tools/math-ai-4h-03/${phase}-${split}-summary.json`,JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary,null,2));
