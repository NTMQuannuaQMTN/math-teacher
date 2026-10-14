// Isolated local application server: only the configured :free solver key is copied.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {spawnSync,spawn} from 'node:child_process';
import {resolve} from 'node:path';
const root=process.cwd(), dir='/tmp/math-specialist-training';mkdirSync(dir,{recursive:true,mode:0o700});
const vars=Object.fromEntries(readFileSync('worker/.dev.vars','utf8').split('\n').filter(l=>/^[A-Z_]+=/.test(l)).map(l=>[l.slice(0,l.indexOf('=')),l.slice(l.indexOf('=')+1).trim()]));
if(new URL(vars.LOCAL_LLM_URL).hostname!=='openrouter.ai'||!vars.LOCAL_SOLVER_MODEL.endsWith(':free'))throw Error('Explicit free model required');
let config=readFileSync('worker/wrangler.toml','utf8').replace('main = "src/index.ts"',`main = "${root}/worker/src/index.ts"`).replace('migrations_dir = "migrations"',`migrations_dir = "${root}/worker/migrations"`).replace(/name = "math-teacher-worker"/, 'name = "math-specialist-training"');
config=config.replace(/ENVIRONMENT = "production"/,'ENVIRONMENT = "development"').replace(/OCR_PROVIDER = "gemini"/,'OCR_PROVIDER = "mock"').replace(/SOLVER_PROVIDER = "gemini"/,'SOLVER_PROVIDER = "local"').replace(/SOLVE_TIMEOUT_MS = "170000"/,'SOLVE_TIMEOUT_MS = "30000"').replace(/SOLVE_LIMIT_PER_DEVICE_PER_HOUR = "30"/,'SOLVE_LIMIT_PER_DEVICE_PER_HOUR = "100"');
writeFileSync(`${dir}/wrangler.toml`,config);
writeFileSync(`${dir}/.dev.vars`,['IMAGE_URL_SECRET=isolated-local-training-secret-0123456789','SOLVER_GEMINI_FALLBACK=off',`LOCAL_LLM_URL=${vars.LOCAL_LLM_URL}`,`LOCAL_SOLVER_MODEL=${vars.LOCAL_SOLVER_MODEL}`,`LOCAL_LLM_API_KEY=${vars.LOCAL_LLM_API_KEY}`].join('\n')+'\n',{mode:0o600});
const cli=resolve('worker/node_modules/.bin/wrangler'),args=['--config',`${dir}/wrangler.toml`];
const db=spawnSync(cli,[...args,'d1','migrations','apply','math_teacher_db','--local','--persist-to',`${dir}/state`],{stdio:'inherit',env:{...process.env,WRANGLER_SEND_METRICS:'false'}});
if(db.status!==0)process.exit(db.status??1);
const child=spawn(cli,[...args,'dev','--port','8791','--persist-to',`${dir}/state`],{stdio:'inherit',env:{...process.env,WRANGLER_SEND_METRICS:'false'}});
process.on('SIGTERM',()=>child.kill());process.on('SIGINT',()=>child.kill());child.on('exit',code=>process.exit(code??0));
