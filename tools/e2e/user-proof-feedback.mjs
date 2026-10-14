import {readFileSync,writeFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {auditLesson} from '../../worker/scripts/.lesson-audit.mjs';
const rows=readFileSync('tools/benchmark/dataset/chuyen.jsonl','utf8').trim().split('\n').map(JSON.parse),byId=id=>rows.find(r=>r.id===id).problem_text;
const join=(number)=>{
 const a=byId(`ptnk-2025-chuyen_${number}a`),marker=number===1?'Chứng minh':'Chứng minh',at=a.indexOf(marker),prefix=a.slice(0,at);
 return prefix+['a','b','c'].map(letter=>`${letter}) `+byId(`ptnk-2025-chuyen_${number}${letter}`).slice(prefix.length)).join('\n');
};
const q3=join(3).replace(/\s*\(1\)/g,'');
const q5='Cho bàn cờ kích thước $2\\times9$. An chọn một ô ban đầu, sau đó mỗi lượt di chuyển sang một ô kề bên. Bình chọn $k$ ô mỗi lượt để đoán vị trí An. Với $k=4$, chứng minh Bình thắng sau không quá 8 lượt. Với $k=2$, chứng minh Bình thắng sau không quá 16 lượt.';
const cases=[['Q1',join(1)],['Q2a',byId('ptnk-2025-chuyen_2a')],['Q2b',byId('ptnk-2025-chuyen_2b')],['Q3',q3],['Q4a',byId('ptnk-2025-chuyen_4a')],['Q5',q5]];
const fixture=readFileSync('tools/ocr-eval/fixtures/02-quadratic-vi.jpg'),token=randomBytes(32).toString('base64url'),results=[];
async function call(path,body,headers={}){
 const r=await fetch('http://127.0.0.1:8795'+path,{method:'POST',headers:{authorization:`Bearer ${token}`,...headers},body,signal:AbortSignal.timeout(30000)});return {status:r.status,body:await r.json()};
}
for(const [id,text] of cases){
 const form=new FormData();form.append('image',new Blob([fixture],{type:'image/jpeg'}),'fixture.jpg');
 const created=await call('/v1/scans',form,{'Idempotency-Key':randomBytes(32).toString('base64url')});if(!created.body.scan)throw Error('Mock scan setup failed');
 const scan=created.body.scan.id,t0=performance.now(),startedAt=new Date().toISOString();
 await call(`/v1/scans/${scan}/confirm`,JSON.stringify({text}),{'content-type':'application/json'});
 const answer=await call(`/v1/scans/${scan}/solve`,JSON.stringify({regenerate:true}),{'content-type':'application/json'});
 const audit=answer.body.solution?.lesson?auditLesson(answer.body.solution.lesson):null;
 results.push({id,text,startedAt,durationMs:performance.now()-t0,...answer,audit,scope:'Current-text confirmation, actual Worker/D1 solve, full JSON parsing and schema/KaTeX/language audit. Mock upload setup excluded; external inference disabled.'});
 writeFileSync('tmp/user-proof-feedback/answers.json',JSON.stringify(results,null,2)+'\n');
 console.log(id,answer.body.solution?.status,answer.body.solution?.model,Math.round(results.at(-1).durationMs)+'ms');
}
if(results.some(r=>r.body.solution?.status!=='ready'||r.durationMs>30000||!r.audit?.schemaValid||r.audit.latexErrors.length||r.audit.languageErrors.length))process.exitCode=1;
