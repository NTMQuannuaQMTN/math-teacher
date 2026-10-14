// Page-only headless browser verification. No desktop/screen capture and no inference requests.
import {chromium} from 'playwright';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
const root=new URL('../../',import.meta.url).pathname,out=root+'tools/specialist-training/iteration-03/web-render';mkdirSync(out,{recursive:true});
const files=['development-algebra-all-fixed','validation-algebra-current'];
const records=files.flatMap(f=>readFileSync(root+`tools/specialist-training/iteration-03/${f}.jsonl`,'utf8').trim().split('\n').map(JSON.parse));
const ids=['alg3-dev-radical-sum','alg3-promoted-alg-val-surd','alg3-val-linear-system','alg3-valC-inequality-four'];
const fixtures=ids.map(id=>({id,solution:records.find(r=>r.id===id).body.solution,synthetic:false}));
// Explicitly synthetic presentation fixture for the exact hint-title issue shown by the user.
const presentation=structuredClone(fixtures[0].solution);
presentation.lesson.hints[0].question='Bạn có thể biến đổi vế phải của phương trình $x_1+\\sqrt{x_1^2+1}=\\sqrt{x_2^2+1}-x_2$ như thế nào để thấy mối liên hệ với $x_1,x_2$?';
presentation.lesson.steps[0].title='Giữ điều kiện $x\\ge\\frac12$ trước khi bình phương';
fixtures.push({id:'synthetic-hint-title',solution:presentation,synthetic:true});
const browser=await chromium.launch(),results=[];
try {
 for(const width of [390,1100])for(const fixture of fixtures){
  const context=await browser.newContext({viewport:{width,height:900},locale:'en-US'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('http://127.0.0.1:8794/solution.json',route=>route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(fixture.solution)}));
  // Fail if a renderer test accidentally calls inference or OCR.
  await page.route('**/v1/**',route=>route.abort('blockedbyclient'));
  const t0=performance.now();await page.goto('http://localhost:8081/dev/lesson?reveal=all&src='+encodeURIComponent('http://127.0.0.1:8794/solution.json'),{waitUntil:'networkidle'});
  await page.getByTestId('lesson-problem').waitFor({timeout:30000});await page.locator('.katex').first().waitFor();
  await page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
  const durationMs=performance.now()-t0;
  const audit=await page.evaluate(()=>({latexErrors:document.querySelectorAll('.katex-error').length,plainFallbacks:document.querySelectorAll('.math-root .raw').length,renderedMath:document.querySelectorAll('.katex').length,visibleText:document.body.innerText,pageOverflow:document.documentElement.scrollWidth>window.innerWidth+2}));
  const foreignUi=/\b(?:Next hint|Hint\s+\d|Show solution|Hide solution|Final answer|Regenerate|Settings|Back)\b/i.test(audit.visibleText);
  const title=page.getByTestId('hint-title-h1');await title.scrollIntoViewIfNeeded();
  const titleMath=await title.locator('.katex').count();
  await page.screenshot({path:`${out}/${fixture.id}-${width}.png`});
  const pass=errors.length===0&&audit.latexErrors===0&&audit.plainFallbacks===0&&!foreignUi&&!audit.pageOverflow&&(!fixture.synthetic||titleMath>0);
  results.push({id:fixture.id,width,syntheticPresentationFixture:fixture.synthetic,durationMs,scope:'Navigation plus stored actual solution fetch and browser math/font rendering; solver HTTP timing measured separately',...audit,foreignUi,titleMath,errors,pass});
  console.log(`${fixture.id} width${width}: ${Math.round(durationMs)}ms ${pass?'PASS':'FAIL'}`);await context.close();
 }
}finally{await browser.close();writeFileSync(out+'/results.json',JSON.stringify(results,null,2)+'\n');}
if(results.some(r=>!r.pass))process.exitCode=1;
