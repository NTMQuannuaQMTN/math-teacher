/** Actual localhost HTTP → Worker → local D1 → free model → validation → response consumption. */
import {readFileSync,appendFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {assertFrozen} from './freeze.mjs';
import {auditLesson,routingForQuestion} from '../../worker/scripts/.lesson-audit.mjs';
const API='http://127.0.0.1:8791';const token=randomBytes(32).toString('base64url');
const [phase='validation',split='validation',only='all']=process.argv.slice(2);
if(split==='held_out')assertFrozen();
const cases=JSON.parse(readFileSync('tools/specialist-training/cases.json','utf8')).filter(c=>c.split===split&&(only==='all'||only.split(',').includes(c.id)||c.domain===only));
const fixture=readFileSync('tools/ocr-eval/fixtures/02-quadratic-vi.jpg');
async function call(path,body,extra={}){
 const r=await fetch(API+path,{method:'POST',headers:{authorization:`Bearer ${token}`,...extra},body,signal:AbortSignal.timeout(31000)});
 return {httpStatus:r.status,body:await r.json()};
}
for(const c of cases){
 // Fixture OCR creates a scan only. Its text is replaced by the complete actual question.
 // Do NOT report mock OCR duration as real OCR timing.
 const form=new FormData();form.append('image',new Blob([fixture],{type:'image/jpeg'}),'fixture.jpg');
 const created=await call('/v1/scans',form,{'Idempotency-Key':randomBytes(32).toString('base64url')});
 const id=created.body.scan?.id;if(!id)throw Error('Scan setup failed: '+JSON.stringify(created));
 const startedAt=new Date().toISOString(),t0=performance.now();let record;
 try{
  const confirmed=await call(`/v1/scans/${id}/confirm`,JSON.stringify({text:c.text}),{'content-type':'application/json'});
  if(confirmed.httpStatus!==200)throw Error('Confirmation failed: '+JSON.stringify(confirmed));
  const response=await call(`/v1/scans/${id}/solve`,JSON.stringify({regenerate:true}),{'content-type':'application/json'});
  const renderAudit=response.body?.solution?.lesson?auditLesson(response.body.solution.lesson):null;
  record={renderAudit,routedDomains:routingForQuestion(c.text),...response,id:c.id,domain:c.domain,phase,split,question:c.text,startedAt,durationMs:performance.now()-t0,scope:'Complete text confirmation + HTTP solve + D1 persistence + full JSON response consumption + schema/KaTeX/all-field language audit; fixture OCR excluded'};
 }catch(err){record={id:c.id,domain:c.domain,phase,split,question:c.text,startedAt,durationMs:performance.now()-t0,error:err.message};}
 appendFileSync(`tools/specialist-training/results/application-${phase}.jsonl`,JSON.stringify(record)+'\n');
 console.log(`${c.id}: ${record.durationMs.toFixed(0)}ms ${record.body?.solution?.status??record.error??record.body?.error?.code}`);
}
