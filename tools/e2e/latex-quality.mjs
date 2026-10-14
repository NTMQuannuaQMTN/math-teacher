// App-page only. Actual saved answers plus a clearly labelled layout stress fixture; no inference/OCR.
import {chromium} from 'playwright';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const stage=process.argv[2]??'current',out=`tmp/latex-quality/${stage}`;mkdirSync(out,{recursive:true});
const record=JSON.parse(readFileSync('tools/specialist-training/iteration-03/development-combinatorics-final-v234.jsonl','utf8').trim().split('\n').find(x=>JSON.parse(x).id==='comb3-board-user'));
const synthetic=structuredClone(record.body.solution);
const long=Array.from({length:5},(_,i)=>String.raw`\frac{x_{${i+1}}+\sqrt{x_{${i+1}}^2+1}}{1+x_{${i+1}}^2}`).join('+');
synthetic.lesson.analysis.statement='Mẫu kiểm tra hiển thị, không phải đáp án đánh giá toán học.';
synthetic.lesson.hints[0].question=`Kiểm tra công thức dài $${long}$ trong tiêu đề.`;
synthetic.lesson.hints[0].explanation=String.raw`Vì \(x_1=\frac12\), suy ra \[x_1+x_2=3\].`;
synthetic.lesson.steps[0].title=String.raw`Biến đổi \(x_1+\sqrt{x_1^2+1}\)`;
synthetic.lesson.steps[0].reason=String.raw`Dùng đẳng thức \(a^2-b^2=(a-b)(a+b)\).`;
synthetic.lesson.steps[0].math=long;
const browser=await chromium.launch(),results=[];
try{
 for(const [name,solution] of [['actual-board',record.body.solution],['synthetic-layout',synthetic]]){
  const page=await browser.newPage({viewport:{width:1100,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('http://127.0.0.1:8794/latex.json',r=>r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(solution)}));
  await page.route('**/v1/**',r=>r.abort());
  await page.goto('http://localhost:8081/dev/lesson?reveal=all&src='+encodeURIComponent('http://127.0.0.1:8794/latex.json'),{waitUntil:'networkidle'});
  await page.getByTestId('lesson-problem').waitFor();
  for(const width of [1100,390,320,1100]){
   await page.setViewportSize({width,height:900});
   await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
   const audit=await page.evaluate(()=>{
    const clipped=[...document.querySelectorAll('.math-root .inline')].filter(e=>e.getBoundingClientRect().width>e.closest('.math-root').clientWidth+2 && getComputedStyle(e).overflowX!=='auto');
    const root=document.querySelector('.math-root');
    const scrollChecks=[...document.querySelectorAll('.inline.wide')].map(e=>{
      e.scrollLeft=e.scrollWidth-e.clientWidth;
      const reachedEnd=e.scrollLeft>0 && e.querySelector('.katex').getBoundingClientRect().right<=e.getBoundingClientRect().right+2;
      e.scrollLeft=0;
      return reachedEnd;
    });
    return {latexErrors:document.querySelectorAll('.katex-error').length,rawFallbacks:document.querySelectorAll('.math-root .raw').length,pageOverflow:document.documentElement.scrollWidth>innerWidth+2,clippedInlineCount:clipped.length,wideInlineCount:document.querySelectorAll('.inline.wide').length,scrollChecks,mathCount:document.querySelectorAll('.katex').length,unparsedDelimiters:/\\[()[\]]/.test(document.body.innerText),text:document.body.innerText,rootWidth:root?.clientWidth};
   });
   const pass=!errors.length&&!audit.latexErrors&&!audit.rawFallbacks&&!audit.pageOverflow&&!audit.clippedInlineCount&&!audit.unparsedDelimiters&&audit.scrollChecks.every(Boolean);
   results.push({name,width,...audit,errors:[...errors],pass,scope:'Stored actual answer or explicitly synthetic layout test; responsive page only, no solver or OCR calls'});
   await page.getByTestId(`hint-title-${solution.lesson.hints[0].id}`).scrollIntoViewIfNeeded();
   await page.screenshot({path:`${out}/${name}-${width}.png`});console.log(name,width,pass?'PASS':'FAIL',audit.clippedInlineCount,audit.wideInlineCount);
  }
  await page.close();
 }
}finally{await browser.close();writeFileSync(out+'/results.json',JSON.stringify(results,null,2)+'\n');}
if(results.some(r=>!r.pass))process.exitCode=1;
