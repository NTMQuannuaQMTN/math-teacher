"""Read only isolated inference cost counters; never print credentials or question records."""
import datetime,json,os,subprocess
from pathlib import Path
query="SELECT bucket, window_start, count FROM rate_limits WHERE bucket LIKE 'spend:%' ORDER BY window_start,bucket"
# The bundled D1 SQLite format must be read through Wrangler's supported
# interface; Python's host SQLite cannot read these tables reliably.
process=subprocess.run(['worker/node_modules/.bin/wrangler','--config','/tmp/math-specialist-feedback/wrangler.toml','d1','execute','math_teacher_db','--local','--persist-to','/tmp/math-specialist-feedback/state','--command',query,'--json'],capture_output=True,text=True,env={**os.environ,'WRANGLER_SEND_METRICS':'false'})
if process.returncode:raise RuntimeError('Read-only cost query failed with exit code '+str(process.returncode))
rows=[(r['bucket'],r['window_start'],r['count']) for batch in json.loads(process.stdout) for r in batch['results']]
current=datetime.datetime.now(datetime.timezone.utc);day=int(current.timestamp())//86400*86400
output={'readAt':current.isoformat(),'scope':'Existing stable isolated D1 estimated cost reservations; not a provider billing statement. No counter reset.','days':{}}
for bucket,start,micro in rows:
 date=datetime.datetime.fromtimestamp(start,datetime.timezone.utc).date().isoformat();output['days'].setdefault(date,{})[bucket]=micro/1e6
output['todayEstimatedUsd']=sum(micro/1e6 for _,start,micro in rows if start==day)
Path('tools/specialist-training/iteration-03/cost-ledger-checkpoint.json').write_text(json.dumps(output,indent=2)+'\n')
print(json.dumps(output))
