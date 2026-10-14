import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../../worker/package.json',import.meta.url));const katex=require('katex');
const found=new Set();
function visit(x){if(typeof x==='string'){for(const m of x.matchAll(/\$([^$]+)\$/g))found.add(m[1]);}else if(x&&typeof x==='object'){for(const [k,v]of Object.entries(x)){if(k==='math'&&typeof v==='string')found.add(v);visit(v);}}}
visit(JSON.parse(readFileSync('tools/specialist-training/cases.json','utf8')));
for(const file of readdirSync('tools/specialist-training/results')){if(!file.endsWith('.jsonl'))continue;for(const line of readFileSync('tools/specialist-training/results/'+file,'utf8').split('\n'))if(line)visit(JSON.parse(line));}
const normal=m=>m.replaceAll('$','').replace(/\\begin\{align\*?\}/g,'\\begin{aligned}').replace(/\\end\{align\*?\}/g,'\\end{aligned}').replace(/\\begin\{gather\*?\}/g,'\\begin{gathered}').replace(/\\end\{gather\*?\}/g,'\\end{gathered}');
const out={};for(const raw of found){const m=normal(raw);try{katex.renderToString(m,{throwOnError:true,strict:'ignore',trust:false,maxExpand:300});out[raw]={normalized:m,valid:true};}catch{out[raw]={normalized:m,valid:false};}}
writeFileSync('tools/specialist-training/tex-audit.json',JSON.stringify(out,null,2)+'\n');console.log('Audited',found.size,'unique formulas for report transcription');
