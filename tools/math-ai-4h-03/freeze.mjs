import {createHash} from 'node:crypto';
import {readdirSync,readFileSync,statSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {join,relative} from 'node:path';

const roots=['shared/src','worker/src','mobile/src'];
const fixed=['shared/package.json','worker/package.json','worker/wrangler.toml','mobile/package.json','mobile/app.json','tools/math-ai-4h-03/benchmark-v1.jsonl','tools/math-ai-4h-03/evaluate.mjs','tools/math-ai-4h-03/server.mjs'];
const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(join(dir,entry.name)):[join(dir,entry.name)]);
const files=[...roots.flatMap(walk),...fixed].filter(path=>statSync(path).isFile()).sort(),sha=data=>createHash('sha256').update(data).digest('hex');
const entries=files.map(path=>({path:relative('.',path),sha256:sha(readFileSync(path))}));
const benchmark=readFileSync('tools/math-ai-4h-03/benchmark-v1.jsonl','utf8').trim().split('\n').map(JSON.parse);
let gitHead=null;try{gitHead=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();}catch{}
const snapshot=JSON.parse(readFileSync('tools/math-ai-4h-03/server-snapshot.json','utf8'));
const manifest={frozenAt:new Date().toISOString(),gitHead,sourceAndConfigSha256:sha(entries.map(x=>`${x.path}\0${x.sha256}\n`).join('')),benchmarkSha256:sha(readFileSync('tools/math-ai-4h-03/benchmark-v1.jsonl')),evaluatorSha256:sha(readFileSync('tools/math-ai-4h-03/evaluate.mjs')),serverBundleSha256:snapshot.bundleSha256,evaluationMode:{ocrProvider:snapshot.ocrProvider,externalInference:snapshot.externalInference,solveInput:'confirmed benchmark text; OCR output excluded'},splitCounts:Object.fromEntries(['development','validation','final'].map(split=>[split,benchmark.filter(x=>x.split===split).length])),files:entries};
writeFileSync('tools/math-ai-4h-03/freeze-manifest.json',JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify({frozenAt:manifest.frozenAt,sourceAndConfigSha256:manifest.sourceAndConfigSha256,benchmarkSha256:manifest.benchmarkSha256,splitCounts:manifest.splitCounts},null,2));
