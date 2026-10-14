// Page-only headless rendering audit. It never captures the desktop and blocks OCR/solve calls.
import {chromium} from 'playwright';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';

const root=new URL('../../',import.meta.url).pathname;
const out=root+'tools/math-ai-4h-02/render';mkdirSync(out,{recursive:true});
const rows=readFileSync(root+'tools/math-ai-4h-02/final-final.jsonl','utf8').trim().split('\n').map(JSON.parse);
const ids=rows.map(row=>row.id);
const browser=await chromium.launch(),results=[];
try{
 for(const width of [320,390,1100])for(const id of ids){
  const row=rows.find(item=>item.id===id);if(!row)throw new Error(`missing final row ${id}`);
  const context=await browser.newContext({viewport:{width,height:900},locale:'vi-VN'}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('http://127.0.0.1:8794/solution.json',route=>route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(row.response.solution)}));
  await page.route('**/v1/**',route=>route.abort('blockedbyclient'));
  const started=performance.now();
  await page.goto('http://localhost:8081/dev/lesson?reveal=all&src='+encodeURIComponent('http://127.0.0.1:8794/solution.json'),{waitUntil:'networkidle',timeout:30000});
  await page.getByTestId('lesson-problem').waitFor({timeout:30000});
  await page.locator('.katex').first().waitFor({timeout:30000});
  await page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
  const audit=await page.evaluate(()=>({
   latexErrors:document.querySelectorAll('.katex-error').length,
   plainFallbacks:document.querySelectorAll('.math-root .raw').length,
   renderedMath:document.querySelectorAll('.katex').length,
   pageOverflow:document.documentElement.scrollWidth>window.innerWidth+2,
   visibleText:document.body.innerText,
  }));
  const foreignUi=/\b(?:Next hint|Hint\s+\d|Show solution|Hide solution|Final answer|Regenerate|Settings|Back)\b/i.test(audit.visibleText);
  const separateFinalCard=/(^|\n)Đáp án cuối cùng($|\n)/i.test(audit.visibleText);
  const pass=!errors.length&&!audit.latexErrors&&!audit.plainFallbacks&&!audit.pageOverflow&&!foreignUi&&!separateFinalCard;
  await page.screenshot({path:`${out}/${id}-${width}.png`,fullPage:true});
  results.push({id,width,durationMs:performance.now()-started,scope:'page-only',...audit,visibleText:undefined,foreignUi,separateFinalCard,errors,pass});
  console.log(`${id} width${width}: ${pass?'PASS':'FAIL'}`);await context.close();
 }
}finally{await browser.close();writeFileSync(out+'/results.json',JSON.stringify(results,null,2)+'\n');}
if(results.some(result=>!result.pass))process.exitCode=1;
