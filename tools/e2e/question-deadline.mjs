// Page-only actual application pipeline and uncancellable response-body/transport scenarios.
import {chromium} from 'playwright';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {execFileSync} from 'node:child_process';
const selected=process.argv[2],scenarios=['actual-cyclic','actual-degeneracy','actual-foot-diagnosis','actual-converse-diagnosis','actual-incircle','actual-number-theory','actual-combinatorics','stalled-fetch','stalled-body'];
if(selected&&!scenarios.includes(selected))throw Error('Unknown browser scenario');
const root=new URL('../../',import.meta.url).pathname,out=root+'tools/specialist-training/iteration-03/question-deadline'+(selected?'/'+selected+'-latest':'');mkdirSync(out,{recursive:true});
const cases=JSON.parse(readFileSync(root+'tools/specialist-training/iteration-03/cases.json','utf8'));
const serverSnapshot=JSON.parse(readFileSync(root+'tools/specialist-training/iteration-03/server-snapshot.json','utf8'));
const fixture=readFileSync(root+'tools/ocr-eval/fixtures/02-quadratic-vi.jpg'),results=[];
const browser=await chromium.launch();
try {
 for(const scenario of selected?[selected]:scenarios) {
  const token=randomBytes(32).toString('base64url');
  const call=async(path,body,headers={})=>{const response=await fetch('http://127.0.0.1:8793'+path,{method:'POST',headers:{authorization:`Bearer ${token}`,...headers},body});return response.json();};
  const form=new FormData();form.append('image',new Blob([fixture],{type:'image/jpeg'}),'fixture.jpg');
  const created=await call('/v1/scans',form,{'Idempotency-Key':randomBytes(32).toString('base64url')});
  const questionId={'actual-degeneracy':'geo3-ptnk-2024-parallelogram','actual-foot-diagnosis':'geo3-cyclic-unrestricted','actual-converse-diagnosis':'geo3-circle-converse-missing-side','actual-incircle':'geo3-incircle-multipart','actual-number-theory':'nt3-exam-ch-3','actual-combinatorics':'comb3-board-user'}[scenario]??'geo3-cyclic';
  const id=created.scan.id,question=cases.find(c=>c.id===questionId).text;
  // Upload OCR setup is separate. Confirmation is included in the question end-to-end measurement below.
  const context=await browser.newContext({viewport:{width:390,height:900},locale:'en-US'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(token=>localStorage.setItem('device_token_v1',token),token);
  if(scenario==='stalled-body')await page.addInitScript(()=>{
   const original=window.fetch;
   window.fetch=async(...args)=>String(args[0]).includes('/solve')&&args[1]?.method==='POST'?{ok:true,status:200,json:()=>new Promise(()=>{})}:original(...args);
  });
  await page.route('**/v1/**',async route=>{
   const request=route.request(),url=new URL(request.url());
   if(scenario==='stalled-fetch'&&url.pathname.endsWith('/solve')&&request.method()==='POST')return;
   if(scenario.startsWith('stalled-')&&url.pathname.includes('/solutions/'))return route.fulfill({status:404,contentType:'application/json',body:JSON.stringify({error:{code:'not_found',message:'Không có lời giải.',retryable:true}})});
   const forceGeneration=scenario.startsWith('actual-')&&url.pathname.endsWith('/solve')&&request.method()==='POST';
   const response=await route.fetch({url:'http://127.0.0.1:8793'+url.pathname+url.search,headers:{...request.headers(),authorization:`Bearer ${token}`},...(forceGeneration?{postData:JSON.stringify({...request.postDataJSON(),regenerate:true})}:{})});
   await route.fulfill({response});
  });
  const startedAt=new Date().toISOString(),t0=performance.now();
  await call(`/v1/scans/${id}/confirm`,JSON.stringify({text:question}),{'content-type':'application/json'});
  await page.goto(`http://localhost:8081/solve/${id}?questionId=q1`,{waitUntil:'domcontentloaded'});
  if(scenario.startsWith('actual-'))await page.getByTestId('lesson-problem').waitFor({timeout:31000});
  else await page.getByTestId('solve-retry').waitFor({timeout:31000});
  await page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
  const durationMs=performance.now()-t0,text=await page.locator('body').innerText(),latexErrors=await page.locator('.katex-error').count();
  await page.screenshot({path:`${out}/${scenario}.png`});
  const pass=durationMs<=30000&&errors.length===0&&latexErrors===0&&(!scenario.startsWith('stalled-')||/thời gian|hết giờ|quá lâu/i.test(text));
  const record={scenario,questionId,serverSnapshot,startedAt,durationMs,pass,errors,latexErrors,text,forceGeneration:scenario.startsWith('actual-'),scope:'Current text confirmation + page navigation + actual client authentication/HTTP solve with forced generation (actual scenarios) or explicit stalled transport/body scenario + full response parsing + schema/LaTeX/font/browser paint; fixture upload OCR excluded'};
  results.push(record);writeFileSync(out+'/results.json',JSON.stringify(results,null,2)+'\n');
  execFileSync('python3',[root+'tools/specialist-training/iteration-03/checkpoint.py','heartbeat'],{cwd:root,stdio:'ignore'});
  console.log(`${scenario}: ${Math.round(durationMs)}ms ${pass?'PASS':'FAIL'}`);await context.close();
 }
}finally{await browser.close();}
if(results.some(r=>!r.pass))process.exitCode=1;
