import {chromium} from 'playwright';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1100,height:900}}),info=[];let bundle;
page.on('console',m=>{if(m.text().startsWith('[api] Using API_URL='))info.push(m.text());});
page.on('response',r=>{if(r.url().includes('entry.bundle'))bundle=r;});
try{
 await page.goto('http://localhost:8081',{waitUntil:'networkidle',timeout:30000});
 const code=bundle?await bundle.text():'';
 const result={url:page.url(),apiConfiguration:info,bundleHasV236:code.includes('solver-v2.36'),bundleHasDisplayGuard:code.includes('lesson-quality-failure'),title:await page.title(),scope:'New local app tab only; no access to user browser session or desktop'};
 writeFileSync('tools/specialist-training/game-theory-02/active-app-trace.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}finally{await browser.close();}
