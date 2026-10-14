#!/usr/bin/env python3
"""Compile the actual report's standalone TeX blocks, never replace the captured mathematics."""
import concurrent.futures,datetime,hashlib,json,re,subprocess,time,sys
from pathlib import Path
root=Path(__file__).resolve().parents[3]
base=root/'tools/specialist-training/iteration-03';sources=base/'tex-validation/sources';out=root/'tmp/pdfs/iteration-03-tex'
sources.mkdir(parents=True,exist_ok=True);out.mkdir(parents=True,exist_ok=True)
phases=['development-geometry-final-v216','validation-geometry-final-v216','development-geometry-final','validation-geometry-latest','development-geometry-diagnosis-renderable','development-geometry-honest-partial','development-algebra-all-fixed','development-algebra-exam-fixed','validation-algebra-current','validation-algebra-exam-variants','development-number-theory-final-v227','validation-number-theory-final-v227','performance-number-theory-v227','development-combinatorics-final-v234','validation-combinatorics-final-v234','held-out-frozen-v234']
tasks=[];block_hashes={}
for phase in phases:
 blocks=re.findall(r'```latex\n([\s\S]*?)\n```',(root/'docs/specialist-training/iteration-03'/f'{phase}.md').read_text())
 block_hashes[phase]=hashlib.sha256('\n'.join(blocks).encode()).hexdigest()
 for i in range(0,len(blocks),2):
  question,solution=blocks[i:i+2]
  prefix=question.split('\\begin{document}')[0]
  assert solution.split('\\begin{document}')[0]==prefix
  bodies=[b.split('\\begin{document}',1)[1].rsplit('\\end{document}',1)[0] for b in [question,solution]]
  for kind,block in [('question',question),('solution',solution)]:
   (sources/f'{phase}-{i//2+1:02}-{kind}.tex').write_text(block+'\n')
  combined=prefix+'\\begin{document}\n\\section*{Đề bài}\n'+bodies[0]+'\n\\section*{Lời giải thực tế}\n'+bodies[1]+'\n\\end{document}\n'
  path=sources/f'{phase}-{i//2+1:02}-combined.tex';path.write_text(combined);tasks.append((phase,path,hashlib.sha256(combined.encode()).hexdigest()))
def compile_one(task):
 phase,path,sha=task;started=time.perf_counter()
 p=subprocess.run(['/Users/qnrj/.local/bin/tectonic','--only-cached','--untrusted','--keep-logs','--outdir',str(out),str(path)],capture_output=True,text=True,timeout=45)
 log=(p.stdout+'\n'+p.stderr);missing=re.findall(r'Missing character:[^\n]*|could not represent character[^\n]*',log)
 problems=re.findall(r'(?:error:|Overfull)[^\n]*',log)
 result={'phase':phase,'source':str(path.relative_to(root)),'sha256':sha,'returncode':p.returncode,'durationMs':(time.perf_counter()-started)*1000,'missingCharacters':missing,'problems':problems,'pass':p.returncode==0 and not missing and not problems}
 if not result['pass']:(out/(path.stem+'-compiler.txt')).write_text(log)
 return result
previous=json.loads((base/'tex-validation/summary.json').read_text()) if '--retry-failed' in sys.argv else None
previous_results={r['source']:r for r in previous['results']} if previous else {}
retained=[previous_results[str(path.relative_to(root))] for phase,path,sha in tasks if str(path.relative_to(root)) in previous_results and previous_results[str(path.relative_to(root))]['pass'] and previous_results[str(path.relative_to(root))]['sha256']==sha]
pending=[task for task in tasks if not any(r['source']==str(task[1].relative_to(root)) for r in retained)]
results=retained[:];started=datetime.datetime.now(datetime.timezone.utc).isoformat()
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
 for result in pool.map(compile_one,pending):
  results.append(result);subprocess.run(['python3',str(base/'checkpoint.py'),'heartbeat'],cwd=root,stdout=subprocess.DEVNULL)
  print(result['source'].split('/')[-1], 'PASS' if result['pass'] else 'FAIL',flush=True)
results.sort(key=lambda r:r['source'])
summary={'startedAt':previous['startedAt'] if previous else started,'retryStartedAt':started if previous else None,'endedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'compiler':'Installed Tectonic, XeTeX/Unicode fonts; only-cached run','recompiledThisRun':len(pending),'retainedUnchangedSuccessfulCompilations':len(retained),'standaloneBlocksValidated':len(results)*2,'total':len(results),'passed':sum(r['pass'] for r in results),'phases':{phase:{'total':sum(r['phase']==phase for r in results),'passed':sum(r['phase']==phase and r['pass'] for r in results),'blocksSha256':block_hashes[phase]} for phase in phases},'results':results}
(base/'tex-validation/summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:summary[k] for k in ['total','passed','phases']}),flush=True)
raise SystemExit(0 if summary['passed']==summary['total'] else 1)
