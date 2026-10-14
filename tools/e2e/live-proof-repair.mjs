// Page-only rendering of exact old/current saved answers; no desktop capture.
import {chromium} from 'playwright';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const dir='tools/specialist-training/game-theory-02',old=JSON.parse(readFileSync(dir+'/active-question-baseline.json','utf8')),fresh=JSON.parse(readFileSync(dir+'/live-repair-answers.json','utf8'));
const dto=r=>({id:'render-'+r.id,scanId:'434848a5-4ebc-4d25-affb-05175e16f1d9',questionId:r.id,status:'ready',createdAt:new Date().toISOString(),lesson:r.lesson,verification:r.verification??null,error:null,model:r.model,promptVersion:r.promptVersion,attempts:0});
const cases=fresh.map(r=>({name:r.id,solution:dto(r),blocked:false}));
for(const row of old)cases.push({name:'old-'+row.question_id,solution:dto({id:row.question_id,lesson:JSON.parse(row.lesson_json),model:row.model,promptVersion:row.prompt_version}),blocked:true});
const out='tmp/game-theory-02/render';mkdirSync(out,{recursive:true});const browser=await chromium.launch(),results=[];
try{
 for(const c of cases){
  const page=await browser.newPage({viewport:{width:1100,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('http://127.0.0.1:8794/current.json',r=>r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(c.solution)}));
  await page.route('**/v1/**',r=>r.abort());
  const start=performance.now();await page.goto('http://localhost:8081/dev/lesson?reveal=all&src='+encodeURIComponent('http://127.0.0.1:8794/current.json'),{waitUntil:'networkidle',timeout:30000});
  try{await page.getByTestId(c.blocked?'lesson-quality-failure':'lesson-problem').waitFor({timeout:10000});}catch(e){writeFileSync(`${out}/${c.name}-failure.txt`,await page.locator('body').innerText());await page.screenshot({path:`${out}/${c.name}-failure.png`});throw e;}
  for(const width of c.blocked?[1100]:[1100,390,320]){
   await page.setViewportSize({width,height:900});await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
   const audit=await page.evaluate(()=>({latexErrors:document.querySelectorAll('.katex-error').length,rawMath:document.querySelectorAll('.math-root .raw').length,overflow:document.documentElement.scrollWidth>innerWidth+2,mathCount:document.querySelectorAll('.katex').length,text:document.body.innerText}));
   const forbidden=/razionale|четвертая|kimesdimesaimesab|\{b\s*\+\s*c,\s*c\s*\+\s*d/.test(audit.text);
   const pass=!errors.length&&!audit.latexErrors&&!audit.rawMath&&!audit.overflow&&!forbidden&&(c.blocked||audit.mathCount>0);
   results.push({name:c.name,width,pass,blocked:c.blocked,elapsedToRenderedMs:performance.now()-start,...audit,errors});
   if(c.name==='q1')await page.getByTestId('step-p3_s4').scrollIntoViewIfNeeded();
   if(c.name==='q5')await page.getByTestId('step-s3').scrollIntoViewIfNeeded();
   await page.screenshot({path:`${out}/${c.name}-${width}.png`});console.log(c.name,width,pass?'PASS':'FAIL');
  }
  await page.close();
 }
}finally{await browser.close();writeFileSync(out+'/results.json',JSON.stringify(results,null,2)+'\n');}
if(results.some(r=>!r.pass))process.exitCode=1;
