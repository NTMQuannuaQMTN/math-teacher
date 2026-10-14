// Question request through Worker/D1, JSON/schema parsing, then actual page math rendering.
// Isolated localhost backend only: no hosted inference, no OCR, no desktop capture.
import {chromium} from 'playwright';import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const input=JSON.parse(readFileSync('/tmp/math-game-live-eval-private.json','utf8')),out='tools/specialist-training/game-theory-02',results=[];mkdirSync('tmp/game-theory-02/end-to-end',{recursive:true});
const browser=await chromium.launch();
try{
 for(const c of input.cases){
  const page=await browser.newPage({viewport:{width:390,height:900}}),errors=[];let started=0,answer;
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('http://127.0.0.1:8794/solve-current.json',async route=>{
   started=performance.now();const response=await fetch(`http://localhost:8797/v1/scans/${c.scan}/solve?q=q1`,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${input.token}`},body:'{"regenerate":true}',signal:AbortSignal.timeout(27000)});
   answer=await response.json();await route.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(answer.solution)});
  });
  await page.route('**/v1/**',r=>r.abort());
  await page.goto('http://localhost:8081/dev/lesson?reveal=all&src='+encodeURIComponent('http://127.0.0.1:8794/solve-current.json'),{waitUntil:'networkidle',timeout:30000});
  await page.getByTestId('lesson-problem').waitFor({timeout:10000});
  await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
  const durationMs=performance.now()-started,audit=await page.evaluate(()=>({mathCount:document.querySelectorAll('.katex').length,latexErrors:document.querySelectorAll('.katex-error').length,rawMath:document.querySelectorAll('.math-root .raw').length,overflow:document.documentElement.scrollWidth>innerWidth+2,text:document.body.innerText}));
  const finalCards=await page.getByTestId('final-answer').count(),pass=durationMs<30000&&!errors.length&&!audit.latexErrors&&!audit.rawMath&&!audit.overflow&&audit.mathCount>0&&finalCards===0&&answer.solution.status==='ready';
  results.push({id:c.originalQuestionId,startedAt:new Date(Date.now()-durationMs).toISOString(),durationMs,pass,model:answer.solution.model,promptVersion:answer.solution.promptVersion,...audit,finalCards,errors,scope:'Measured continuously from question HTTP request, full local generation/verification/formatting and JSON/schema parsing to fonts and actual rendered KaTeX ready. Current confirmed text; no upload/OCR; isolated model unavailable locally; no hosted fallbacks.'});
  await page.screenshot({path:`tmp/game-theory-02/end-to-end/${c.originalQuestionId}.png`});console.log(c.originalQuestionId,Math.round(durationMs)+'ms',pass?'PASS':'FAIL');await page.close();
 }
}finally{await browser.close();writeFileSync(out+'/end-to-end-render.json',JSON.stringify(results,null,2)+'\n');}
if(results.some(r=>!r.pass))process.exitCode=1;
