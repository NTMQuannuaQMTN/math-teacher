"""Independent coordinate/time-expanded search; every survivor has a concrete legal history."""
import json
from pathlib import Path

def schedule(n,k):
 if k==4:return [[(r,c) for r in (1,2) for c in (j,j+1)] for j in range(1,n)]
 first=[[(1,j),(2,j+1)] for j in range(1,n)]
 # At turn n, flip the colour predicted by continuing the first sweep.
 row=2 if n%2 else 1
 return first+[[(row,j),(3-row,j+1)] for j in range(1,n)]

def check(n,queries,staying=False,diagonal=False,query_first=False):
 cells=[(r,c) for r in (1,2) for c in range(1,n+1)]
 histories={c:[c] for c in cells};counts=[]
 for turn,q in enumerate(queries,1):
  next_histories={}
  if query_first and turn==1:
   next_histories={c:p for c,p in histories.items() if c not in q}
  else:
   for dst in cells:
    if dst in q:continue
    for src,path in histories.items():
     dr,dc=abs(src[0]-dst[0]),abs(src[1]-dst[1])
     if dr+dc==1 or staying and dr+dc==0 or diagonal and dr==dc==1:
      next_histories[dst]=path+[dst];break
  histories=next_histories;counts.append(len(histories))
 return {'caughtAll':not histories,'survivorCounts':counts,'escapePath':next(iter(histories.values()),None)}

results=[]
for n in range(2,51):
 for k in (2,4):
  q=schedule(n,k);r=check(n,q);rfirst=check(n,q,query_first=True)
  assert r['caughtAll'] and rfirst['caughtAll'],(n,k,r)
  assert all(len(set(t))==k for t in q)
  results.append({'columns':n,'k':k,'turns':len(q),'moveThenQuery':r,'firstQueryBeforeFirstMove':rfirst})
q=schedule(9,2)
mutants={
 'repeat_first_colour_sweep':check(9,q[:8]+q[:8]),
 'omit_last_turn':check(9,q[:-1]),
 'allow_staying':check(9,q,staying=True),
 'allow_diagonal':check(9,q,diagonal=True),
}
assert all(not r['caughtAll'] and r['escapePath'] for r in mutants.values())
out={'scope':'Independent time-expanded exhaustive reachability on all cells and every legal edge, not random sample games. Coordinates one-based. Changed-rule counterexamples are not counterexamples to the original mandatory-edge-movement rules.','boardsChecked':98,'results':results,'board9':{str(k):{'queries':schedule(9,k),**check(9,schedule(9,k))} for k in (2,4)},'incorrectOrChangedRuleCounterexamples':mutants}
Path('tools/specialist-training/iteration-03/board-adversarial-check.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'boardsChecked':98,'board9':out['board9'],'counterexamples':mutants},ensure_ascii=False,indent=2))
