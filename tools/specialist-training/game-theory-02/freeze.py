import hashlib,json,subprocess
from pathlib import Path
from datetime import datetime,timezone
base=Path(__file__).resolve().parent;files=[]
for root in ['worker/src','shared/src','mobile/src']:
 for p in sorted(Path(root).rglob('*')):
  if p.is_file():files.append({'path':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
record={'frozenAt':datetime.now(timezone.utc).isoformat(),'lessonVersion':'solver-v2.40','sourceFiles':files,'provider':'unavailable loopback model; hosted and SocLaas/Gemini fallbacks off for evaluation','trainingVsHeldout':'Known user questions and 2x9 policy are development data. Fresh parameter variants in existing families are held out; no cross-family success claim. Unsupported new families are explicit controlled-failure diagnostics.'}
(base/'freeze.json').write_text(json.dumps(record,indent=2)+'\n');print('Frozen',len(files),'source files before held-out question selection.')
