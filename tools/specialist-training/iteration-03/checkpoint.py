"""Measured active ledger. Pause for approvals/idle; resume only when engineering resumes."""
import json,sys,time,datetime,fcntl,os
from pathlib import Path
p=Path('tools/specialist-training/iteration-03/run-state.json')
lock=p.parent.joinpath('.checkpoint.lock').open('a')
fcntl.flock(lock,fcntl.LOCK_EX)
now=datetime.datetime.now(datetime.timezone.utc).isoformat();mono=time.monotonic()
if not p.exists():
 s={'iteration':'03','budgetSeconds':28800,'phaseBudgetsSeconds':{'algebra':7200,'geometry':7200,'number_theory':7200,'combinatorics':7200},'activeSeconds':0,'remainingSeconds':28800,'status':'active','phase':'audit','startedAt':now,'lastHeartbeatAt':now,'lastMonotonic':mono,'intervals':[],'phases':[],'baseline':{},'notes':['Supersedes the original four-hour maximum with the user-requested eight-hour maximum. No model weights are trained.','Host UTC timestamps are stored; display times to user in Asia/Singapore. Active intervals use bounded UTC heartbeats; explicit idle/approval waits excluded. Cross-process monotonic clocks were observed to reset and are not used for accounting.']}
else:s=json.loads(p.read_text())
elapsed=(datetime.datetime.fromisoformat(now)-datetime.datetime.fromisoformat(s['lastHeartbeatAt'])).total_seconds()
if elapsed>=0:
 if s['status']=='active':
  # A long silence is unmeasured continuity, not fabricated active work.
  if elapsed>180:s['intervals'].append({'start':s['lastHeartbeatAt'],'end':now,'kind':'unmeasured-continuity','seconds':elapsed,'chargedSeconds':0});s['notes'].append('Heartbeat gap >180s excluded conservatively; exact active work inside that gap is unknown.')
  else:
   s['activeSeconds']+=elapsed
   if s['phases'] and s['phases'][-1]['endedAt'] is None:s['phases'][-1]['activeSeconds']+=elapsed
   s['intervals'].append({'start':s['lastHeartbeatAt'],'end':now,'kind':'active','phase':s['phase'],'seconds':elapsed})
 else:s['intervals'].append({'start':s['lastHeartbeatAt'],'end':now,'kind':'excluded-'+s['status'],'seconds':elapsed})
command=sys.argv[1] if len(sys.argv)>1 else 'checkpoint'
if command=='phase':
 if s['phases'] and s['phases'][-1]['endedAt'] is None:s['phases'][-1]['endedAt']=now
 s['phase']=sys.argv[2];s['phases'].append({'name':s['phase'],'startedAt':now,'endedAt':None,'activeSeconds':0});s['status']='active'
elif command=='pause':s['status']='waiting';s['waitingReason']=' '.join(sys.argv[2:])
elif command=='resume':s['status']='active';s.pop('waitingReason',None)
elif command=='complete':
 s['status']='complete'
 if s['phases'] and s['phases'][-1]['endedAt'] is None:s['phases'][-1]['endedAt']=now
s.update(lastHeartbeatAt=now,lastMonotonic=mono,remainingSeconds=max(0,s['budgetSeconds']-s['activeSeconds']))
temporary=p.with_suffix('.json.tmp')
with temporary.open('w') as handle:
 handle.write(json.dumps(s,ensure_ascii=False,indent=2)+'\n');handle.flush();os.fsync(handle.fileno())
temporary.replace(p)
print(json.dumps({k:s[k] for k in ['status','phase','activeSeconds','remainingSeconds','lastHeartbeatAt']}))
