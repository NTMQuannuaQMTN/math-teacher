"""Unpruned BFS on small boards compares both independent optimized solvers."""
import itertools,json,subprocess
from pathlib import Path
BASE=Path(__file__).resolve().parent

def naive(n,k):
 v=2*n;full=(1<<v)-1
 moves=[]
 for s in range(1<<v):
  moved=0
  for a in range(v):
   if (s>>a)&1:
    for b in range(v):
     if abs(a//n-b//n)+abs(a%n-b%n)==1:moved|=1<<b
  moves.append(moved)
 queries=[sum(1<<i for i in q) for q in itertools.combinations(range(v),k)]
 level={full};seen={full}
 for h in range(1,2*n+1):
  nxt={moves[s]&~q for s in level for q in queries}
  if 0 in nxt:return h
  level=nxt-seen;seen|=nxt
 raise AssertionError('no winning policy')

rows=[]
for n in [2,3,4]:
 for k in [2,4]:
  expected=naive(n,k)
  forward=json.loads(subprocess.check_output(['/tmp/math-game-exact-search',str(n),str(k),str(2*n),'30']))
  backward=json.loads(subprocess.check_output(['/tmp/math-game-backward',str(n),str(k),str(2*n)],stderr=subprocess.DEVNULL))
  assert expected==forward['depth']==backward['optimalTurns']
  rows.append({'n':n,'k':k,'unprunedBfs':expected,'forward':forward['depth'],'backward':backward['optimalTurns']})
(BASE/'small-board-audit.json').write_text(json.dumps(rows,indent=2)+'\n');print(json.dumps(rows))
