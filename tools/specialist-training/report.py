"""Render complete actual captured lessons; reviews are separate independent annotations."""
import json,pathlib,re
root=pathlib.Path(__file__).resolve().parents[2]
reviews=json.loads((root/'tools/specialist-training/reviews.json').read_text())
references=json.loads((root/'tools/specialist-training/heldout-references.json').read_text()).get('references',{}) if (root/'tools/specialist-training/heldout-references.json').exists() else {}
cases={c['id']:c for c in json.loads((root/'tools/specialist-training/cases.json').read_text())}
def readable(t):
 return re.sub(r'\$([^$]+)\$',lambda m:r'\( '+m[1]+r' \)',t or '')
audits=json.loads((root/'tools/specialist-training/tex-audit.json').read_text()) if (root/'tools/specialist-training/tex-audit.json').exists() else {}
def esc(v):
 mapping={'\\':r'\textbackslash{}','&':r'\&','%':r'\%','#':r'\#','_':r'\_','$':r'\$','{':r'\{','}':r'\}','^':r'\textasciicircum{}','~':r'\textasciitilde{}'}
 return ''.join(mapping.get(ch,ch) for ch in v)
def mathtex(m,display=False):
 a=audits.get(m,{'valid':False,'normalized':m})
 if not a['valid']:return r'\texttt{'+esc(m)+'}'
 return (r'\[' if display else r'\(')+a['normalized']+(r'\]' if display else r'\)')
def tex(t):
 parts=re.split(r'(\$[^$]+\$)',t or '')
 return ''.join(mathtex(p[1:-1]) if p.startswith('$') and p.endswith('$') else esc(p) for p in parts)
def latex_doc(body):
 return '\\documentclass{article}\n\\usepackage{amsmath,amssymb,fontspec,unicode-math}\n\\setmainfont{Arial}\n\\begin{document}\n'+body+'\n\\end{document}'
for domain,file in [('algebra','algebra-training.md'),('geometry','geometry-training.md'),('number_theory','number-theory-training.md'),('combinatorics','combinatorics-training.md')]:
 records=[]
 for p in sorted((root/'tools/specialist-training/results').glob('*.jsonl')):
  for line in p.read_text().splitlines():
   if not line:continue
   r=json.loads(line)
   if r.get('domain')!=domain:continue
   if p.name.startswith('application-'):
    solution=r.get('body',{}).get('solution',{})
    r={**r,'phase':'application-'+r['phase'],'result':solution,'error':solution.get('error',{}).get('code') if solution.get('error') else r.get('error') or r.get('body',{}).get('error',{}).get('code','Unknown failure')}
   r['latencyScope']=r.get('scope','Pipeline only; excludes HTTP/database/mobile delivery')
   records.append(r)
 if not records:continue
 out=[f'# {domain.replace("_"," ").title()} Bot — actual specialist evaluation','', 'These are actual pipeline outputs, not manually substituted solutions. Raw provider output, returned typed lesson, verifier checks, and latency are retained in `tools/specialist-training/results/`. Free-only inference; no model weights were trained. Pipeline-only runs and actual application HTTP runs are labelled separately below. HTTP timing includes text confirmation, parsing, solving, verification, formatting, D1 persistence, full JSON consumption and, for final runs, a client schema/KaTeX/language audit. Fixture OCR is excluded. Mobile painting and production network latency are unmeasured. The fenced LaTeX transcription normalizes delimiters and equation environments only; unrenderable formulas are preserved as escaped literal text. Mathematical content and actual answers are not substituted. A full XeLaTeX/LuaLaTeX installation is unavailable here, so document compilation is unmeasured; formula checks use the application KaTeX renderer.','']
 for i,r in enumerate(records,1):
  c=cases[r['id']];rv=reviews.get(r['phase']+'/'+r['id']);l=r.get('result',{}).get('lesson')
  out += [f'## Question {i} — {r["id"]} ({r["phase"]})','',f'**Type:** {c["group"]}',f'**Difficulty:** {c["difficulty"]}',f'**Source:** {c["source"]}; {r["id"]}.',f'**Split:** {r["split"]}','', '**Question statement:**',readable(r['question']),'','**LaTeX question:**','```latex',latex_doc(tex(r['question'])),'```','','**Bot\'s answer:**']
  if not l:
   out += ['Controlled failure: '+r.get('error','Unknown failure'),'','**LaTeX solution:**','```latex',latex_doc(tex('Không nhận được lời giải: '+r.get('error',''))),'```','','**Step-by-step explanation:** No generated solution was returned.','', '**Independent verification:** No mathematical answer to verify.' + (' Independent reference, not the bot answer: '+references[r['id']] if r['id'] in references else ''),'', '**Evaluation:**','- Mathematical correctness: Unverified.','- Completeness: Fail.','- Explanation quality: Fail.','- LaTeX and formatting: Fail.',f'- Response latency: {r["durationMs"]/1000:.3f} seconds; scope: {r["latencyScope"]}.','- Final verdict: Fail.','', '**Failure analysis:** '+r.get('error',''), ''];continue
  out += ['**Interpretation:** '+readable(l['analysis']['statement']),'**Strategy:** '+readable(l['strategy'])]
  for key in ['givens','unknowns','constraints','interpretationNotes']:
   if l['analysis'][key]:out.append('**'+key+':** '+readable('; '.join(l['analysis'][key])))
  out+=['','**Actual hints:**']
  for h in l['hints']:
   out += [f'- {h["id"]}: '+readable(h['question']), '  '+readable(h['cue']), '  '+readable(h['explanation'])]
   if h['math']:out.append(r'  \[ '+h['math']+r' \]')
  out+=['','**Actual worked steps:**']
  for j,s in enumerate(l['steps'],1):
   out += [f'{j}. **{readable(s["title"])}** — '+readable(s['explanation'])]
   if s['math']:out.append(r'\[ '+s['math']+r' \]')
   if s['reason']:out.append('Reason: '+readable(s['reason']))
  out += ['', '**Returned conclusion metadata:** '+readable(l['finalAnswer']['text'])]
  if l['finalAnswer']['math']:out.append(r'\[ '+l['finalAnswer']['math']+r' \]')
  solution=tex(l['strategy'])+'\n\\begin{enumerate}\n'
  for s in l['steps']:solution+='\\item '+tex(s['title'])+'. '+tex(s['explanation'])+'\n'+(mathtex(s['math'],True) if s['math'] else '')+'\n'+tex(s['reason'])+'\n'
  solution+='\\end{enumerate}\n'+tex(l['finalAnswer']['text'])+'\n'+(mathtex(l['finalAnswer']['math'],True) if l['finalAnswer']['math'] else '')
  out+=['','**LaTeX solution:**','```latex',latex_doc(solution),'```','','**Step-by-step explanation:**']
  if rv:out.append(rv['verification'])
  else:out.append('Independent review pending; do not treat machine labels as proof validity.')
  out+=['','**Independent verification:**', rv['verification'] if rv else 'Unverified — independent review pending.', '', '**Evaluation:**',f'- Mathematical correctness: {rv["correctness"] if rv else "Unverified"}.',f'- Completeness: {rv["completeness"] if rv else "Fail"}.',f'- Explanation quality: {rv["explanation"] if rv else "Fail"}.',f'- LaTeX and formatting: {rv["formatting"] if rv else "Fail"}.',f'- Response latency: {r["durationMs"]/1000:.3f} seconds; scope: {r["latencyScope"]}.',f'- Final verdict: {"Pass" if rv and all(rv[k]=="Pass" for k in ["correctness","completeness","explanation","formatting"]) else "Fail"}.']
  if rv:out += [f'- Automated review proxy: {sum(rv["score"])}/100; components {rv["score"]} (40/20/15/10/10/5). Human satisfaction remains unmeasured.']
  out += ['', '**Failure analysis:** '+(rv['failure'] if rv else 'Review pending.'),'']
 (root/'docs/specialist-training'/file).write_text('\n'.join(line.rstrip() for line in out).rstrip()+'\n')
