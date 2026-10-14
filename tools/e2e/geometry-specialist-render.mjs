// Page-only headless browser verification. No desktop/screen capture and no inference requests.
import {chromium} from 'playwright';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
const selectedPhase=process.argv[2];
const root=new URL('../../',import.meta.url).pathname,out=root+'tools/specialist-training/iteration-03/geometry-web-render'+(selectedPhase?'-'+selectedPhase:'');mkdirSync(out,{recursive:true});
const files=selectedPhase?[selectedPhase]:['development-geometry-all-fixed','development-geometry-advanced-fixed'];
const records=files.flatMap(f=>readFileSync(root+`tools/specialist-training/iteration-03/${f}.jsonl`,'utf8').trim().split('\n').map(JSON.parse));
const ids=process.argv[3]?.split(',')??['geo3-cyclic','geo3-tangents','geo3-ptnk-2025-circle','geo3-rectangle-cyclic','geo3-circle-power','geo3-triangle-area'];
const fixtures=ids.map(id=>({id,solution:records.find(r=>r.id===id).body.solution,synthetic:false}));
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
  const title=page.getByTestId(`hint-title-${fixture.solution.lesson.hints[0].id}`);await title.scrollIntoViewIfNeeded();
  const titleMath=await title.locator('.katex').count();
  const hintTitleAudits=[];
  for(const hint of fixture.solution.lesson.hints){
   const node=page.getByTestId(`hint-title-${hint.id}`),expectsMath=/\$[^$]+\$/.test(hint.question);
   const renderedMath=await node.locator('.katex').count();
   hintTitleAudits.push({id:hint.id,expectsMath,renderedMath,pass:!expectsMath||renderedMath>0});
  }
  const separateFinalAnswerCards=await page.getByTestId('final-answer').count();
  let drag=null;
  if(fixture.id==='geo3-cyclic') {
    const svg=page.locator('svg').filter({has:page.locator('text').filter({hasText:/^A$/})}).first();
    await svg.scrollIntoViewIfNeeded();
    const positions=()=>page.evaluate(()=>Object.fromEntries([...document.querySelectorAll('svg text')].filter(t=>/^[ABCEF]$/.test(t.textContent)).map(t=>{const circles=t.parentElement.querySelectorAll('circle');const core=circles[circles.length-1],r=core.getBoundingClientRect();return [t.textContent,{x:r.x+r.width/2,y:r.y+r.height/2}]})));
    const before=await positions(),start=before.A;
    await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(start.x+18,start.y-12,{steps:12});await page.mouse.up();
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const after=await positions();
    const cosine=(x,v,y)=>{const u={x:after[x].x-after[v].x,y:after[x].y-after[v].y},w={x:after[y].x-after[v].x,y:after[y].y-after[v].y};return Math.abs(u.x*w.x+u.y*w.y)/(Math.hypot(u.x,u.y)*Math.hypot(w.x,w.y));};
    const moved=Math.hypot(after.A.x-start.x,after.A.y-start.y),first=cosine('B','E','C'),second=cosine('C','F','B');
    drag={before,after,moved,rightAngleCosines:[first,second],pass:moved>5&&first<.015&&second<.015};
  }
  await page.screenshot({path:`${out}/${fixture.id}-${width}.png`});
  const pass=errors.length===0&&audit.latexErrors===0&&audit.plainFallbacks===0&&!foreignUi&&!audit.pageOverflow&&(!fixture.synthetic||titleMath>0)&&hintTitleAudits.every(h=>h.pass)&&separateFinalAnswerCards===0&&(!drag||drag.pass);
  results.push({id:fixture.id,width,syntheticPresentationFixture:fixture.synthetic,durationMs,scope:'Navigation plus stored actual solution fetch and browser math/font rendering; solver HTTP timing measured separately',...audit,foreignUi,titleMath,hintTitleAudits,separateFinalAnswerCards,errors,drag,pass});
  console.log(`${fixture.id} width${width}: ${Math.round(durationMs)}ms ${pass?'PASS':'FAIL'}`);await context.close();
 }
}finally{await browser.close();writeFileSync(out+'/results.json',JSON.stringify(results,null,2)+'\n');}
if(results.some(r=>!r.pass))process.exitCode=1;
