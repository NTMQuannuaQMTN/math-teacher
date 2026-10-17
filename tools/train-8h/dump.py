import json,sys,os
t,rnd,suf=sys.argv[1],sys.argv[2],sys.argv[3]
qs={json.loads(l)['id']:json.loads(l) for l in open(f'data/train-8h/{t}.jsonl')}
only=sys.argv[4].split(',') if len(sys.argv)>4 else None
for r in json.load(open(f'tools/train-8h/results/{t}-r{rnd}-{suf}.json'))['results']:
    if only and r['id'] not in only: continue
    q=qs[r['id']]
    print('#####',r['id'],'|',q['split'],'|',r.get('producedBy'),r.get('status'),'served=',r.get('served'))
    print('Q:',q['input'][:600]); print('REF:',q['reference'][:400])
    if not r['ok']: print('FAILED',r.get('message')); continue
    d=json.load(open(f"tools/train-8h/results/lessons/{t}-r{rnd}-{r['id'].replace('/','_')}.json"))
    L=d['lesson']
    for i,s in enumerate(L['steps'],1): print(f'  {i}. {s["title"]} — {s["explanation"][:420]} || {(s.get("math") or "")[:220]}')
    print('  FINAL:',L['finalAnswer']['text'][:500], '|', (L['finalAnswer'].get('math') or '')[:200])
    bad=[c['label'][:150] for c in d['verification']['checks'] if not c['passed']]
    if bad: print('  FAILED CHECKS:',bad[:4])
