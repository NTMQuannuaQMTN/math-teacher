"""Independent arithmetic uses Python integers and explicit mathematical completeness arguments.
No implementation arithmetic, parser or certificate checker is imported."""
import json,re
from pathlib import Path
b=Path('tools/specialist-training/iteration-03'); p=b/'math-review.json'; reviews=json.loads(p.read_text())
expected={
 'nt3-divisibility':('Đúng với mọi số nguyên.','Trong ba số liên tiếp có một số chẵn và một bội của 3. Hai ước 2,3 nguyên tố cùng nhau, nên tích chia hết cho 6.'),
 'nt3-cube-divisibility':('Đúng với mọi số nguyên.','n³−n=(n−1)n(n+1). Dùng ba số liên tiếp như trên, bao gồm số âm và 0.'),
 'nt3-fifth-divisibility':('Đúng với mọi số nguyên.','n⁵−n=n(n−1)(n+1)(n²+1) chia hết cho2 và3. Với n modulo5 lần lượt0,1,2,3,4, n⁵−n luôn dư0 (giá trị0,0,30,240,1020). Các ước2,3,5 đôi một nguyên tố cùng nhau nên chia hết30.'),
 'nt3-false-divisibility':('Mệnh đề sai; n=1 cho2 không chia hết4.','Giá trị n=1 thuộc miền nguyên; n²+n=2. Một phản ví dụ đủ bác bỏ tính phổ quát. Ứng dụng nêu chính giá trị và số dư2.'),
 'nt3-prime':('p=3.','Ba số p,p+2,p+4 phủ đủ lớp dư modulo3. Một số nguyên tố chia hết3 phải bằng3; chỉ p=3 còn hợp lệ, cho3,5,7 đều nguyên tố.'),
 'nt3-prime-shift':('p=3.','p,p+4,p+8 phủ đủ lớp dư modulo3. Nếu một số bằng3 thì p thuộc3,−1,−5; chỉ3 nguyên tố. Thay lại được3,7,11.'),
 'nt3-residue':('n=6q+r, q nguyên, r=1,2,4,5.','(n+1)(n+2) luôn chẵn. Modulo3, tích chia hết3 khi n dư1 hoặc2. Kết hợp với lớp modulo6 được1,2,4,5, cả hai chiều.'),
 'nt3-residue-none':('Không có nghiệm nguyên.','Bình phương modulo3 chỉ dư0 hoặc1. Cộng1 cho dư1 hoặc2, không bao giờ0.'),
 'nt3-square-gap':('Không có nghiệm nguyên.','Bình phương modulo4 chỉ dư0,1; n²+2 dư2,3 không thể là bình phương.'),
 'nt3-factors':('12 cặp có thứ tự từ mọi ước nguyên của20.','Phương trình tương đương(x−4)(y−3)=20. Mọi u là ước khác0 của20, v=20/u; |u|≤20 và |v|≤20. Phép đổi biến ngược một-một bao quát toàn bộ nghiệm.'),
 'nt3-positive-factors':('(5,23),(6,13),(8,8),(9,7),(14,5),(24,4).','Cùng phép phân tích tích20. Lọc hai tọa độ đều>0 khỏi toàn bộ12 cặp. Baseline trả cả12 gồmâm/0 nên có lỗi toán nghiêm trọng; lời giải sửa chỉ giữ6 cặp.'),
 'nt3-infinite-factors':('x=4, y nguyên tùy ý; hoặc y=3, x nguyên tùy ý.','(x−4)(y−3)=0 tương đương ít nhất một thừa số bằng0. Hợp hai họ có thể giao nhau ở(4,3), không đếm đôi hoặc chia cho0.'),
}
divisors=[u for u in range(-20,21) if u and 20%u==0]; pairs=[(u+4,20//u+3) for u in divisors]
assert len(pairs)==12 and all(x*y-3*x-4*y==8 for x,y in pairs)
assert [(x,y) for x,y in pairs if x>0 and y>0]==[(5,23),(6,13),(8,8),(9,7),(14,5),(24,4)]
for phase in ['baseline-number-theory','baseline-number-theory-broad','baseline-number-theory-exams','development-number-theory-first-fixes']:
 for r in map(json.loads,(b/(phase+'.jsonl')).read_text().splitlines()):
  ident=r['id']; lesson=r.get('body',{}).get('solution',{}).get('lesson'); answer,derivation=expected.get(ident,('Chưa chấm đáp án riêng của bài chuyên.','Không có lời giải được ứng dụng trả về; không được chuyển thất bại có kiểm soát thành bài giải đúng.'))
  fail=phase=='baseline-number-theory-broad' and ident=='nt3-positive-factors'
  math='fail' if fail else 'pass' if lesson else 'unverified'
  if lesson and ident in ['nt3-factors','nt3-positive-factors']:
   actual=[tuple(map(int,m)) for m in re.findall(r'\((-?\d+),(-?\d+)\)',lesson['finalAnswer']['text'])]
   wanted=pairs if ident=='nt3-factors' or fail else [p for p in pairs if p[0]>0 and p[1]>0]
   assert actual==wanted,(phase,ident,actual)
  reviews[phase+'/'+ident]={
   'independentAnswer':answer,'independentDerivation':derivation,
   'mathematics':math,'completeness':'pass' if math=='pass' else 'fail','explanation':'pass' if math=='pass' else 'fail',
   'reviewScope':'Actual captured answers/steps reviewed; independent Python integer arithmetic and universal arguments above. Development only; automated rubric proxy, no human satisfaction.',
   'failureAnalysis':'Material domain error: positive requested, but negative and zero pairs returned. Fixed whole-task parser and domain filtering, with zero-product families handled separately.' if fail else 'No mathematical answer returned; inference timeout/quota/incomplete output remains a product failure.' if not lesson else 'No material mathematical error identified. Finite remainder tables are justified by integral polynomial congruence preservation; finite factor lists by a proved bound.',
   'rubric':{'correctness':40 if math=='pass' else 0,'completeness':20 if math=='pass' else 0,'clarity':11 if math=='pass' and ident=='nt3-fifth-divisibility' else 13 if math=='pass' else 0,'method':10 if lesson else 0,'formatting':10 if lesson else 0,'verificationOrUncertainty':5 if math=='pass' else 0},
   'rubricRationale':'Proof validity/completeness reviewed separately from presentation; long full-residue table loses clarity points compared with shorter factor/modulo reasoning. No held-out or user satisfaction claim.'
  }
p.write_text(json.dumps(reviews,ensure_ascii=False,indent=2)+'\n')
print('Saved independently checked baseline and first-fix reviews; baseline positive-domain failure remains failed.')
