// Page-only audit of user-facing routes; no desktop capture and no backend calls.
import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
const root=new URL('../../',import.meta.url).pathname,out=root+'tools/math-ai-4h-02/ui';mkdirSync(out,{recursive:true});
const routes=['/','/history','/feedback'];
const forbidden=/\b(?:Scan a problem|Upload from photos|Recent problems|My problems|No problems yet|Report a mistake|Back|Cancel|Save|Delete|Try again|Loading|Problem|Lesson|Settings)\b/i;
const browser=await chromium.launch(),results=[];
try{
 for(const path of routes)for(const width of [320,390,1100]){
  const context=await browser.newContext({viewport:{width,height:900},locale:'en-US'}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));await page.route('**/v1/**',route=>route.abort('blockedbyclient'));
  await page.goto(`http://localhost:8081${path}`,{waitUntil:'networkidle',timeout:30000});
  await page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
  const audit=await page.evaluate(()=>({text:document.body.innerText,lang:document.documentElement.lang,title:document.title,pageOverflow:document.documentElement.scrollWidth>window.innerWidth+2}));
  const english=forbidden.exec(audit.text)?.[0]??null,pass=audit.lang==='vi'&&audit.title==='Trợ lý Toán học'&&!audit.pageOverflow&&!english&&!errors.length;
  const name=path==='/'?'home':path.slice(1).replaceAll('/','-');await page.screenshot({path:`${out}/${name}-${width}.png`,fullPage:true});
  results.push({path,width,lang:audit.lang,title:audit.title,pageOverflow:audit.pageOverflow,english,errors,pass});console.log(`${path} width${width}: ${pass?'PASS':'FAIL'}`);await context.close();
 }
}finally{await browser.close();writeFileSync(out+'/results.json',JSON.stringify(results,null,2)+'\n');}
if(results.some(result=>!result.pass))process.exitCode=1;
