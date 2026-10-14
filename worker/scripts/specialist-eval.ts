/** Free-only, resumable actual pipeline evaluation. Bundle with the installed esbuild. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { LocalJsonModel } from '../src/solver/localModel';
import { solveProblem } from '../src/solver/pipeline';
import { VN_GRADE_9 } from '../src/solver/curriculum';
import { normalizeProblemText } from '../../shared/src/mathText';
import { ModelLessonSchema } from '../../shared/src/solution';
import { latexFeedback } from '../src/solver/latexCheck';
const root = process.cwd();
const vars = Object.fromEntries(readFileSync(`${root}/worker/.dev.vars`, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0,l.indexOf('=')), l.slice(l.indexOf('=')+1).trim()]));
const url = vars.LOCAL_LLM_URL;
const model = vars.LOCAL_SOLVER_MODEL;
if (new URL(url).hostname !== 'openrouter.ai' || !model.endsWith(':free')) throw new Error('Evaluation requires explicitly free OpenRouter model; no fallback allowed');
const [phase = 'baseline', domain = 'algebra', split = 'development'] = process.argv.slice(2);
if (split === 'held_out' && phase !== 'frozen') throw new Error('Freeze configuration before held-out evaluation');
const cases = JSON.parse(readFileSync(`${root}/tools/specialist-training/cases.json`, 'utf8')).filter((c: any) => (domain === 'remaining' ? c.domain !== 'algebra' : c.domain === domain) && c.split === split);
mkdirSync(`${root}/tools/specialist-training/results`, {recursive:true});
const llm = new LocalJsonModel(url, model, {apiKey:vars.LOCAL_LLM_API_KEY, maxTokens:5500, reasoningEffort:'none',requestTimeoutMs:22000});
for (const c of cases) {
 const domain=c.domain;
 const output = `${root}/tools/specialist-training/results/${phase}-${domain}-${split}.jsonl`;
 const startedAt = new Date().toISOString(); const start = performance.now(); const raw: unknown[]=[]; const logs:string[]=[];
 let record: any;
 try {
  const result = await solveProblem(llm,VN_GRADE_9,normalizeProblemText(c.text),{signal:AbortSignal.timeout(26000),maxAttempts:1,onRaw:(attempt,text)=>raw.push({attempt,text}),log:m=>logs.push(m)});
  const rendered = ModelLessonSchema.parse(result.lesson);
  // Serialize the actual returned lesson, including verification and render validation, within timing.
  record = JSON.parse(JSON.stringify({id:c.id,domain,split,phase,startedAt,model,question:c.text,result:{...result,lesson:rendered},latexIssues:latexFeedback(rendered),raw,logs}));
 } catch(err) { record={id:c.id,domain,split,phase,startedAt,model,question:c.text,error:err instanceof Error?err.message:String(err),raw,logs}; }
 record.durationMs=performance.now()-start;
 writeFileSync(output,JSON.stringify(record)+'\n',{flag:'a'});
 console.log(`${c.id}: ${record.durationMs.toFixed(0)}ms ${record.error ?? record.result.verification.status}`);
}
