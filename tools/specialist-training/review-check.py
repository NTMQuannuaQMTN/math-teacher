import json,pathlib
base=pathlib.Path('tools/specialist-training')
reviews=json.loads((base/'reviews.json').read_text());pending=[]
for p in (base/'results').glob('*.jsonl'):
 for line in p.read_text().splitlines():
  r=json.loads(line);app=p.name.startswith('application-');result=r.get('body',{}).get('solution',{}) if app else r.get('result',{});key=('application-' if app else '')+r['phase']+'/'+r['id']
  if result.get('lesson') and key not in reviews:pending.append(key)
for key,r in reviews.items():
 assert len(r['score'])==6 and all(0<=n<=cap for n,cap in zip(r['score'],[40,20,15,10,10,5])),key
 assert r['correctness'] in ['Pass','Fail','Unverified'],key
 for f in ['completeness','explanation','formatting']:assert r[f] in ['Pass','Fail'],key
print('Independent mathematical reviews pending:',len(pending));print('\n'.join(pending))
