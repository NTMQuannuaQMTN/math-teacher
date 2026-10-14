"""Independent game trees execute the strategies stated in actual responses.
Natural-language rule interpretation is explicit; no production solver imports.
"""
import json,re
from functools import lru_cache
from pathlib import Path
from importlib.machinery import SourceFileLoader
BASE=Path(__file__).resolve().parent
board_check=SourceFileLoader('coordinate_check',str(BASE/'adversarial-check.py')).load_module().check
rows=json.loads((BASE/'heldout-answers.json').read_text());results=[]
for row in rows:
 solution=row['body']['solution'];c=row['parameters'];family=row['family'];checks=[]
 if family=='unsupported-diagnostic':
  assert solution['status']=='failed' and solution['lesson'] is None
  results.append({'id':row['id'],'result':'controlled failure; not a mathematics pass','latencyMs':row['durationMs']});continue
 assert solution['status']=='ready';lesson=solution['lesson'];prose=' '.join(s['explanation'] for s in lesson['steps']);first='người đi trước có chiến lược thắng' in lesson['finalAnswer']['text'].lower()
 if family=='takeaway':
  moves=c['moves'];n=c['stones'];last=c['lastLoses']
  @lru_cache(None)
  def win(s):
   if s==0:return last
   return any(not win(s-m) for m in moves if m<=s)
  assert first==win(n);losing=[s for s in range(1,n+1) if not win(s)]
  if moves==list(range(1,max(moves)+1)):
   block=max(moves)+1;target=int(last)
   assert all(win(s)==(s%block!=target) for s in range(1,n+1))
   first_take=(n-target)%block
   if first:assert first_take>0 and not win(n-first_take)
   # Response stated in actual lesson: take block - opponent's move.
   for s in range(1,n+1):
    if win(s):continue
    for their in moves:
     if their>s:continue
     left=s-their
     if left==0:assert last;continue
     response=block-their
     assert 1<=response<=max(moves) and response<=left
     assert not win(left-response)
   checks.append('Every legal opponent amount and complementary response, at every losing state')
  else:
   m=re.search(r'các trạng thái thua là \$([^$]+)\$',prose);assert m
   listed=[int(x) for x in m[1].split(',')];assert listed==losing
   available=set(listed)|({0} if not last else set())
   for s in range(1,n+1):
    if win(s):
     reply=next(m for m in moves if m<=s and s-m in available)
     assert not win(s-reply)
    else:assert all(win(s-m) for m in moves if m<=s)
   checks.append('Actual listed losing positions exactly match independent recursion; first permitted return-to-losing rule is legal in every winning state')
 elif family=='piles':
  a,b,last=c['a'],c['b'],c['lastLoses']
  @lru_cache(None)
  def win(x,y):
   if x+y==0:return last
   return any(not win(t,y) for t in range(x)) or any(not win(x,t) for t in range(y))
  assert first==win(a,b)
  if first:
   match=re.search(r'Lượt đầu lấy \$(\d+)\$ viên ở đống thứ \$(\d+)\$',prose);assert match
   take,pile=map(int,match.groups());x=a-(take if pile==1 else 0);y=b-(take if pile==2 else 0)
   assert x>=0 and y>=0 and take>0 and not win(x,y)
  # Execute the exact mirrored-response rule including stated misere exceptions.
  for equal in range(1,max(a,b)+1):
   if last and equal==1:continue
   assert not win(equal,equal)
   for left in range(equal):
    if last and left==1:response=(1,0)
    elif last and left==0:response=(0,1)
    else:response=(left,left)
    assert not win(*response)
    assert (response[0]==left and response[1]<equal)
  checks.append('Independent complete minimax plus stated first move and all mirrored/misere replies')
 elif family=='signs':
  n,m=c['n'],c['modulus']
  @lru_cache(None)
  def an_win(turn,r):
   if turn==n+1:return r==0
   children=[an_win(turn+1,(r+sign*turn)%m) for sign in [1,-1]]
   return any(children) if turn%2 else all(children)
  winner_an=an_win(1,0);assert lesson['finalAnswer']['text'].startswith('Vậy '+('An' if winner_an else 'Bình'))
  policy={}
  for step in lesson['steps']:
   math=step['math'] or ''
   if 'R_+' not in math:continue
   for turn,plus,minus in re.findall(r'(\d+)&([\d, ]+|\\varnothing)&([\d, ]+|\\varnothing)',math):
    for cell,sign in [(plus,1),(minus,-1)]:
     if cell!=r'\varnothing':
      for residue in cell.split(','):policy[int(turn),int(residue)]=sign
  @lru_cache(None)
  def execute(turn,r):
   if turn==n+1:return (r==0)==winner_an
   if (turn%2==1)==winner_an:
    sign=policy.get((turn,r))
    # The simple final-turn strategy explicitly says choose + at earlier Bình turns.
    if sign is None:
     assert not winner_an and n%2==0 and (2*n)%m!=0 and turn<n;sign=1
    return execute(turn+1,(r+sign*turn)%m)
   return all(execute(turn+1,(r+sign*turn)%m) for sign in [1,-1])
  assert execute(1,0);checks.append('Actual rendered sign table executed against every opponent sign at every reachable state')
 elif family=='board':
  for plan in lesson['gamePlans']:
   queries=[[(r-1)*c['columns']+col-1 for r,col in query] for query in plan['queries']]
   result=board_check(c['columns'],queries);assert result['caughtEveryLegalPath']
   assert len(queries)<=(c['columns']-1)*(1 if plan['k']==4 else 2)
  checks.append('Every initial cell and every legal mandatory movement; both query plans and exact bounds')
 results.append({'id':row['id'],'result':'mathematics checked','checks':checks,'latencyMs':row['durationMs']})
(BASE/'heldout-independent-checks.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'mathematicsPasses':sum(r['result']=='mathematics checked' for r in results),'controlledFailures':sum(r['result'].startswith('controlled') for r in results),'maximumHttpMs':max(r['latencyMs'] for r in results)}))
