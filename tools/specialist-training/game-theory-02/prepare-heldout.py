import json,random,uuid,hashlib,secrets
from datetime import datetime,timezone
from pathlib import Path
BASE=Path(__file__).resolve().parent
assert (BASE/'freeze.json').exists()
rng=random.Random(1791790897);cases=[]
# New parameter variants, not a claim of generalization to unseen game rules.
for n in rng.sample([97,108,119,136,162,185],2):
 cases.append({'id':f'take-range-{n}','family':'takeaway','text':f'Có {n} viên sỏi. Hai người chơi luân phiên, mỗi lượt lấy từ 1 đến 6 viên sỏi. Người lấy viên sỏi cuối cùng thắng. Ai có chiến lược thắng? Hãy chứng minh.','parameters':{'stones':n,'moves':list(range(1,7)),'lastLoses':False}})
for n in rng.sample([41,59,76,87,103,129],2):
 cases.append({'id':f'take-misere-{n}','family':'takeaway','text':f'Có {n} viên sỏi. Hai người chơi luân phiên, mỗi lượt lấy 1, 3 hoặc 4 viên sỏi. Người lấy viên sỏi cuối cùng thua. Ai có chiến lược thắng? Hãy chứng minh.','parameters':{'stones':n,'moves':[1,3,4],'lastLoses':True}})
for a,b,last in [(25,39,False),(28,28,False),(1,43,True),(18,18,True)]:
 cases.append({'id':f'piles-{a}-{b}-{last}','family':'piles','text':f'Có hai đống sỏi, một đống có {a} viên và một đống có {b} viên. Hai người luân phiên chơi; mỗi lượt chọn đúng một đống và lấy một số nguyên dương viên sỏi từ đống đó. Người lấy viên cuối cùng {"thua" if last else "thắng"}. Người đi trước có chiến lược thắng không? Hãy chứng minh.','parameters':{'a':a,'b':b,'lastLoses':last}})
for n,m in [(25,9),(27,10),(28,7)]:
 cases.append({'id':f'signs-{n}-{m}','family':'signs','text':f'An và Bình luân phiên đặt dấu cộng hoặc dấu trừ trước các số 1, 2, 3, ..., {n} theo đúng thứ tự này; An đặt dấu trước số 1. An thắng nếu tổng có dấu của các số chia hết cho {m}, nếu không Bình thắng. Ai có chiến lược thắng? Hãy chứng minh.','parameters':{'n':n,'modulus':m}})
for n in [15,21]:
 cases.append({'id':f'board-{n}','family':'board','text':f'Cho bàn cờ $2\\times{n}$. An chọn một ô ban đầu, sau đó mỗi lượt An di chuyển sang một ô kề bên. Bình chọn $k$ ô mỗi lượt để hỏi An. Chứng minh Bình có thể thắng sau không quá {n-1} lượt với $k=4$ và không quá {2*(n-1)} lượt với $k=2$.','parameters':{'columns':n}})
for ident,text in [('board-staying','Cho bàn cờ $2\\times7$. An được đứng yên hoặc đi sang ô kề cạnh. Bình hỏi 2 ô mỗi lượt. Bình có bảo đảm bắt được An không? Hãy chứng minh.'),('chomp','Hai người chơi luân phiên trên hình chữ nhật ô vuông $3\\times6$. Mỗi lượt chọn một ô và xóa ô đó cùng các ô ở bên phải và bên trên. Người xóa ô góc dưới bên trái thua. Ai có chiến lược thắng? Hãy chỉ rõ chiến lược.'),('wythoff','Có hai đống sỏi gồm 9 và 15 viên. Mỗi lượt được lấy một số nguyên dương từ một đống hoặc lấy cùng một số từ cả hai đống. Người lấy viên cuối cùng thắng. Ai có chiến lược thắng? Hãy chứng minh.')]:
 cases.append({'id':ident,'family':'unsupported-diagnostic','text':text,'parameters':None})
private={'token':secrets.token_urlsafe(32)};private_path=Path('/tmp/math-game-heldout-private.json');private_path.write_text(json.dumps(private));private_path.chmod(0o600);owner=hashlib.sha256(('device:'+private['token']).encode()).hexdigest();stamp=datetime.now(timezone.utc).isoformat();sql=[]
quote=lambda s:"'"+s.replace("'","''")+"'"
for c in cases:
 c['scan']=str(uuid.uuid4());qs=json.dumps([{'id':'q1','label':'Bài kiểm tra','text':c['text']}],ensure_ascii=False)
 values=[c['scan'],owner,'confirmed','library','game-theory-02/no-upload/'+c['scan'],'image/png',1,1,1,c['text'],stamp,stamp,stamp,qs]
 sql.append('INSERT INTO scans (id,owner_id,status,source,image_key,image_content_type,image_bytes,image_width,image_height,problem_text,created_at,updated_at,confirmed_at,questions_json) VALUES ('+','.join(str(v) if isinstance(v,int) else quote(v) for v in values)+');')
(BASE/'heldout-questions.json').write_text(json.dumps({'createdAt':stamp,'selectionSeed':1791790897,'cases':cases},ensure_ascii=False,indent=2)+'\n')
(BASE/'heldout-seed.sql').write_text('\n'.join(sql)+'\n');print('Prepared',len(cases),'fresh cases after freeze.')
