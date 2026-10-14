# Creates isolated test-owned rows in the actual LOCAL development database;
# no user token, upload, OCR or external inference is involved.
import hashlib,json,secrets,uuid
from datetime import datetime,timezone
from pathlib import Path
BASE=Path(__file__).resolve().parent
scan=json.loads((BASE/'active-confirmed-scan.json').read_text())[0]
questions=json.loads(scan['questions_json']);token=secrets.token_urlsafe(32);owner=hashlib.sha256(('device:'+token).encode()).hexdigest();stamp=datetime.now(timezone.utc).isoformat()
quote=lambda s:"'"+s.replace("'","''")+"'"
rows=[];sql=[]
for q in questions:
 if q['id'] not in ['q1','q2','q5']:continue
 ident=str(uuid.uuid4());rows.append({'scan':ident,'originalQuestionId':q['id'],'text':q['text']})
 values=[ident,owner,'confirmed','library','game-theory-02/no-upload/'+ident,'image/png',1,1,1,q['text'],stamp,stamp,stamp,json.dumps([{'id':'q1','label':q['label'],'text':q['text']}],ensure_ascii=False)]
 sql.append('INSERT INTO scans (id,owner_id,status,source,image_key,image_content_type,image_bytes,image_width,image_height,problem_text,created_at,updated_at,confirmed_at,questions_json) VALUES ('+','.join(str(v) if isinstance(v,int) else quote(v) for v in values)+');')
(BASE/'live-eval-seed.sql').write_text('\n'.join(sql)+'\n')
# Test-owned random token kept only in tmp, never in reports or tool outputs.
p=Path('/tmp/math-game-live-eval-private.json');p.write_text(json.dumps({'token':token,'cases':rows}));p.chmod(0o600)
print('Prepared 3 isolated local evaluation scans; no user records changed.')
