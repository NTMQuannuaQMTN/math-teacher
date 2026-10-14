// Iteration-03 server reuses the prior isolated D1 state so its daily cap is not reset.
// User-authorized feedback server: free primary and SocLaas fallback, capped at $1/day.
// Other paid providers remain disabled; temporary local DB/images only.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {spawnSync,spawn} from 'node:child_process';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=process.cwd(), dir='/tmp/math-specialist-feedback';mkdirSync(dir,{recursive:true,mode:0o700});
// Stable build: repository edits do not replace a Worker while a question is in flight.
const snapshot=`${dir}/snapshot`;mkdirSync(snapshot,{recursive:true,mode:0o700});
const bundle=`${snapshot}/worker.mjs`,metafile=`${snapshot}/build-meta.json`;
const built=spawnSync(resolve('worker/node_modules/esbuild/bin/esbuild'),['worker/src/index.ts','--bundle','--format=esm','--platform=browser','--target=es2022','--conditions=workerd,worker,browser','--external:cloudflare:*','--external:node:*',`--outfile=${bundle}`,`--metafile=${metafile}`],{stdio:'inherit'});
if(built.status!==0)process.exit(built.status??1);
const sourceHashes=Object.fromEntries(Object.keys(JSON.parse(readFileSync(metafile,'utf8')).inputs).filter(p=>!p.includes('node_modules')).map(p=>[p,createHash('sha256').update(readFileSync(p)).digest('hex')]));


const vars=Object.fromEntries(readFileSync('worker/.dev.vars','utf8').split('\n').filter(l=>/^[A-Z_]+=/.test(l)).map(l=>[l.slice(0,l.indexOf('=')),l.slice(l.indexOf('=')+1).trim()]));
if(new URL(vars.LOCAL_LLM_URL).hostname!=='openrouter.ai'||!vars.LOCAL_SOLVER_MODEL.endsWith(':free'))throw Error('Explicit free model required');
const selectedModel=process.argv[2]||vars.SOCLAAS_MODEL||'qwen3.6:35b';
if(process.argv[2]&&!JSON.parse(readFileSync('tools/specialist-training/iteration-03/soclaas-model-inventory.json','utf8')).models.some(m=>m.id===selectedModel))throw Error('Requested audit model is not in authorized fallback inventory');
writeFileSync('tools/specialist-training/iteration-03/server-snapshot.json',JSON.stringify({createdAt:new Date().toISOString(),bundleSha256:createHash('sha256').update(readFileSync(bundle)).digest('hex'),sourceHashes,solverModel:vars.LOCAL_SOLVER_MODEL,fallbackModel:selectedModel,harnessPolicy:{ocrProvider:'mock',solverProvider:'local',geminiFallback:'off',soclaasFallback:'on',estimatedDailyBudgetUsd:1,dailyCapScope:'aggregate-paid-spend-per-UTC-day',twoStage:'off',stableDatabase:'/tmp/math-specialist-feedback/state',solveTimeoutMs:30000,wholeApiDeadlineMs:29000,ocrProviderDeadlineMs:20000,clientWholeUploadDeadlineMs:27000,isolatedSolveLimitPerIpPerHour:10000,isolatedOcrLimitPerIpPerHour:10000,productionQuotasUnchanged:true}},null,2)+'\n');

let config=readFileSync('worker/wrangler.toml','utf8').replace('main = "src/index.ts"',`main = "${bundle}"`).replace('migrations_dir = "migrations"',`migrations_dir = "${root}/worker/migrations"`).replace(/name = "math-teacher-worker"/, 'name = "math-specialist-training"');
config=config.replace(/ENVIRONMENT = "production"/,'ENVIRONMENT = "development"').replace(/OCR_PROVIDER = "gemini"/,'OCR_PROVIDER = "mock"').replace(/SOLVER_PROVIDER = "gemini"/,'SOLVER_PROVIDER = "local"').replace(/SOLVE_TIMEOUT_MS = "170000"/,'SOLVE_TIMEOUT_MS = "30000"').replace(/SOLVE_LIMIT_PER_DEVICE_PER_HOUR = "30"/,'SOLVE_LIMIT_PER_DEVICE_PER_HOUR = "100"');
config=config.replace(/^main = .*$/m,match=>match+'\nno_bundle = true');
// Repeated development/diagnostic evaluations share one localhost IP. Raise only
// this isolated harness's request quotas; never reset spend buckets or alter production limits.
config=config.replace(/^SOLVE_LIMIT_PER_IP_PER_HOUR = "\d+"$/m,'SOLVE_LIMIT_PER_IP_PER_HOUR = "10000"')
 .replace(/^OCR_LIMIT_PER_IP_PER_HOUR = "\d+"$/m,'OCR_LIMIT_PER_IP_PER_HOUR = "10000"');
writeFileSync(`${dir}/wrangler.toml`,config);
writeFileSync(`${dir}/.dev.vars`,['IMAGE_URL_SECRET=isolated-local-training-secret-0123456789','SOLVER_GEMINI_FALLBACK=off','SOLVER_SOCLAAS_FALLBACK=on','SOLVER_DAILY_BUDGET_USD=1','SOLVER_TWO_STAGE=off',`SOCLAAS_API_KEY=${vars.SOCLAAS_API_KEY}`,`SOCLAAS_MODEL=${selectedModel}`,`SOCLAAS_BASE_URL=${vars.SOCLAAS_BASE_URL || 'https://soclaas-api.comp.nus.edu.sg/v1'}`,`LOCAL_LLM_URL=${vars.LOCAL_LLM_URL}`,`LOCAL_SOLVER_MODEL=${vars.LOCAL_SOLVER_MODEL}`,`LOCAL_LLM_API_KEY=${vars.LOCAL_LLM_API_KEY}`].join('\n')+'\n',{mode:0o600});
const cli=resolve('worker/node_modules/.bin/wrangler'),args=['--config',`${dir}/wrangler.toml`];
const db=spawnSync(cli,[...args,'d1','migrations','apply','math_teacher_db','--local','--persist-to',`${dir}/state`],{stdio:'inherit',env:{...process.env,WRANGLER_SEND_METRICS:'false'}});
if(db.status!==0)process.exit(db.status??1);
const child=spawn(cli,[...args,'dev','--port','8793','--persist-to',`${dir}/state`],{stdio:'inherit',env:{...process.env,WRANGLER_SEND_METRICS:'false'}});
process.on('SIGTERM',()=>child.kill());process.on('SIGINT',()=>child.kill());child.on('exit',code=>process.exit(code??0));
