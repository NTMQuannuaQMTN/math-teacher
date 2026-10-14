// Read-only discovery of the user's already authorized fallback; never prints credentials.
import {readFileSync,writeFileSync} from 'node:fs';
const vars=Object.fromEntries(readFileSync('worker/.dev.vars','utf8').split('\n').filter(l=>/^[A-Z_]+=/.test(l)).map(l=>[l.slice(0,l.indexOf('=')),l.slice(l.indexOf('=')+1).trim()]));
const base=new URL(vars.SOCLAAS_BASE_URL||'https://soclaas-api.comp.nus.edu.sg/v1');
if(base.hostname!=='soclaas-api.comp.nus.edu.sg')throw Error('Unexpected fallback host');
const response=await fetch(base.href.replace(/\/$/,'')+'/models',{headers:{authorization:`Bearer ${vars.SOCLAAS_API_KEY}`},signal:AbortSignal.timeout(15000)});
let json;try{json=await response.json();}catch{json={};}
const models=Array.isArray(json.data)?json.data.map(model=>({id:String(model.id)})):[];
const result={checkedAt:new Date().toISOString(),httpStatus:response.status,configuredModel:vars.SOCLAAS_MODEL||'qwen3.6:35b',models};
writeFileSync('tools/specialist-training/iteration-03/soclaas-model-inventory.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
