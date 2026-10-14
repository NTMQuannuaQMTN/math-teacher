"""Local tabular Q-learning of query policies, NOT language-model fine tuning.
The environment tracks every legal evader path. A policy is accepted only by
an independent exhaustive checker. Exact-search solutions are never training data.
"""
import argparse,gzip,itertools,json,time,random,subprocess
from pathlib import Path
import numpy as np
from importlib.machinery import SourceFileLoader
BASE=Path(__file__).resolve().parent
check=SourceFileLoader('coordinate_check',str(BASE/'adversarial-check.py')).load_module().check
p=argparse.ArgumentParser();p.add_argument('--k',type=int,choices=[2,4],required=True);p.add_argument('--seconds',type=int,default=60);p.add_argument('--seed',type=int,default=42);p.add_argument('--episodes',type=int,default=20000);p.add_argument('--init',choices=['heuristic','zero'],default='heuristic');p.add_argument('--max-frames',type=int,default=7000);p.add_argument('--resume',action='store_true');p.add_argument('--epsilon',type=float,default=.55);p.add_argument('--curriculum',type=float,default=.2);args=p.parse_args()
n=9;k=args.k;horizon=8 if k==4 else 16;V=18;full=(1<<V)-1
rng=random.Random(args.seed);start=time.monotonic();last_save=start
# Transition table built from coordinate adjacency, not the exact solver's bit shifts.
moves=np.zeros(1<<V,dtype=np.uint32)
adjacency=[]
for v in range(V):
 r,c=divmod(v,n); adjacency.append(sum(1<<w for w in range(V) if abs(r-w//n)+abs(c-w%n)==1))
for s in range(1,1<<V):
 bit=s&-s;moves[s]=int(moves[s^bit])|adjacency[bit.bit_length()-1]
pop=np.array([bin(i).count("1") for i in range(1<<V)],dtype=np.int16)
actions=np.array([sum(1<<i for i in q) for q in itertools.combinations(range(V),k)],dtype=np.uint32)
frames={};updates=0;successes=0;trace=[];best=None

def frame(t,s):
 key=(t,s)
 if key not in frames:
  moved=int(moves[s]); available=actions[(actions&moved)==actions]
  if pop[moved]<=k: available=np.array([moved|sum(1<<i for i in [v for v in range(V) if not (moved>>v)&1][:k-int(pop[moved])])],dtype=np.uint32)
  nexts=moved&~available
  # Optimistic initialization is documented shaping, not an optimality certificate.
  values=(100-1-pop[moves[nexts]].astype(np.float32)/max(k-1,1)).astype(np.float32) if args.init=='heuristic' else np.zeros(len(available),dtype=np.float32)
  values[nexts==0]=100
  frames[key]=[available,nexts,values,np.zeros(len(available),dtype=np.uint32)]
 return frames[key]

def greedy():
 s=full;qs=[]
 for t in range(horizon):
  a,nxt,q,vis=frame(t,s);i=int(np.argmax(q));mask=int(a[i]);qs.append([v for v in range(V) if (mask>>v)&1]);s=int(nxt[i])
  if not s:break
 result=check(n,qs)
 return {'queries':qs,'turns':len(qs),**result}

def save(episode):
 global last_save,best
 policy=greedy()
 if policy['caughtEveryLegalPath'] and (best is None or policy['turns']<best['turns']):best=policy
 snapshot={'seed':args.seed,'k':k,'episode':episode,'updates':updates,'successes':successes,'frames':len(frames),'elapsedSeconds':time.monotonic()-start,'greedy':policy,'bestVerified':best,'history':trace,'epsilon':args.epsilon,'curriculum':args.curriculum,'initialization':args.init,'initialGreedy':initial_greedy,'trainingSource':'self-generated belief states; no exact-search demonstrations; no hosted inference'}
 (BASE/(f'rl-{k}-{args.seed}'+('-zero' if args.init=='zero' else '')+'.json')).write_text(json.dumps(snapshot,ensure_ascii=False,indent=2)+'\n')
 # Save actual numeric learned Q values and visit counts, with keys/time for resume.
 with gzip.open(BASE/(f'rl-{k}-{args.seed}'+('-zero' if args.init=='zero' else '')+'-weights.json.gz'),'wt') as f:
  json.dump({'format':'tabular-q-v1-visited-only; unvisited values use documented initialization','seed':args.seed,'horizon':horizon,'episode':episode,'frames':[{'t':t,'belief':s,'actions':a[v>0].tolist(),'q':q[v>0].tolist(),'visits':v[v>0].tolist()} for (t,s),(a,nxt,q,v) in frames.items()]},f,separators=(',',':'))
 subprocess.run(['python3',str(BASE/'checkpoint.py'),'heartbeat'],capture_output=True,check=True)
 last_save=time.monotonic();print(json.dumps({key:snapshot[key] for key in ['k','episode','updates','frames','elapsedSeconds']},default=str),flush=True)

initial_greedy=greedy()
if args.resume:
 with gzip.open(BASE/(f'rl-{k}-{args.seed}'+('-zero' if args.init=='zero' else '')+'-weights.json.gz'),'rt') as f:previous=json.load(f)
 for record in previous['frames']:
  a,nxt,q,v=frame(record['t'],record['belief']);lookup={int(action):i for i,action in enumerate(a)}
  for action,value,visits in zip(record['actions'],record['q'],record['visits']):
   i=lookup[action];q[i]=value;v[i]=visits

for ep in range(args.episodes):
 if time.monotonic()-start>=args.seconds or len(frames)>args.max_frames:break
 # 20% curriculum starts in random smaller belief states with a valid remaining horizon.
 t=0;s=full
 if rng.random()<args.curriculum:
  t=rng.randrange(horizon);size=rng.randint(1,max(1,int(V*(horizon-t)/horizon)))
  s=sum(1<<v for v in rng.sample(range(V),size))
 epsilon=max(.03,args.epsilon*(1-ep/args.episodes))
 for turn in range(t,horizon):
  a,nxt,q,vis=frame(turn,s)
  i=rng.randrange(len(a)) if rng.random()<epsilon else int(np.argmax(q))
  ns=int(nxt[i]);reward=100 if ns==0 else (-100 if turn==horizon-1 else -1)
  if args.init=='zero':reward+=5*(int(pop[s])-int(pop[ns])) # potential-based shaping, constant total for every successful full-root episode
  target=reward if ns==0 or turn==horizon-1 else reward+float(np.max(frame(turn+1,ns)[2]))
  q[i]+=.25*(target-float(q[i]));vis[i]+=1;updates+=1;s=ns
  if not ns:successes+=1;break
 if ep%100==0:
  result=greedy();trace.append({'episode':ep,'verified':result['caughtEveryLegalPath'],'turns':result['turns'],'survivors':result['survivors']})
 if time.monotonic()-last_save>=20:save(ep+1)
save(ep+1)
