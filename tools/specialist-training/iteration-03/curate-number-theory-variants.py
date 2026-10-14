"""Exposed-family diagnostic variants, explicitly excluded from held-out."""
import json
from pathlib import Path
b=Path('tools/specialist-training/iteration-03');p=b/'cases.json';rows=json.loads(p.read_text());byid={r['id']:r for r in rows}
variants=[
 ('seventh','nt3-fifth-divisibility','Chứng minh với mọi số nguyên $n$, biểu thức $n^7-n$ chia hết cho $42$.'),
 ('false-positive','nt3-false-divisibility','Chứng minh với mọi số nguyên dương $n$, biểu thức $n^2+n$ chia hết cho $4$.'),
 ('odd-residues','nt3-residue','Tìm tất cả các số nguyên $k$ sao cho $k^2-1$ chia hết cho $8$.'),
 ('square-negative','nt3-square-factor','Tìm tất cả các số nguyên $t$ sao cho $t^2-7$ là số chính phương.'),
 ('square-positive','nt3-square-factor','Tìm tất cả các số nguyên dương $n$ sao cho $n^2+21$ là số chính phương.'),
 ('negative-product','nt3-factors','Tìm tất cả các cặp số nguyên $(a,b)$ thỏa mãn $ab+2a+3b=-14$.'),
 ('zero-positive','nt3-infinite-factors','Tìm tất cả các cặp số nguyên dương $(a,b)$ thỏa mãn $ab+3a-4b=12$.'),
 ('extra-second','nt3-factor-extra-condition','Tìm tất cả các cặp số nguyên dương $(x,y)$ thỏa mãn $xy-3x-4y=8$ và $y\\le4$.'),
 ('prime-offset','nt3-prime','Tìm tất cả các số nguyên tố $q$ sao cho $q+10$ và $q+20$ cũng là số nguyên tố.'),
 ('gcd-positive','nt3-gcd-affine','Cho số nguyên dương $n$. Tìm tất cả các giá trị có thể của ước chung lớn nhất của $n-5$ và $n+7$.'),
 ('gcd-lcm','nt3-gcd-lcm','Tìm tất cả các cặp số nguyên dương $(a,b)$ có ước chung lớn nhất bằng $5$ và bội chung nhỏ nhất bằng $60$.'),
 ('sequence-prefix','nt3-exam-ptnk-2024-chuyen_3b','Với mỗi số tự nhiên $n$, đặt $b_n=(3+\\sqrt5)^n+(3-\\sqrt5)^n$. Tìm $n$ để $b_n$ chia hết cho $4$.'),
 ('sequence-rename','nt3-exam-ptnk-2024-chuyen_3c','Với mỗi số tự nhiên $k$, đặt $b_k=(2+\\sqrt3)^k+(2-\\sqrt3)^k$. Tìm $k$ để $b_k$ chia hết cho $14$.'),
 ('norm-witness','nt3-exam-ptnk-2025-chuyen_3a','Cho các số nguyên dương $m,n$ thỏa mãn: $m^2+m+n^2$ chia hết cho tích $mn$ (1). Chứng minh không tồn tại $m,n$ thỏa mãn (1) khi $n=2$.'),
 ('beautiful-three','nt3-exam-hcm-2025-chuyen_4a','Số nguyên dương $n$ được gọi là số đẹp nếu tồn tại các số nguyên $a,b$ sao cho $n=a^2+7b^2$. Tìm ba số đẹp có hai chữ số và chia hết cho 11.'),
 ('divisors-small','nt3-divisor-count','Tìm tất cả các số nguyên dương có đúng $6$ ước dương và nhỏ hơn $50$.'),
 ('equation-square','nt3-cube-gap','Tìm tất cả các số nguyên $n$ sao cho $n^2=5$.'),
 ('linear-sign','nt3-linear-integer','Tìm tất cả các cặp số nguyên $(a,b)$ thỏa mãn $-9a+14b=5$.'),
 ('linear-positive-infinite','nt3-linear-positive','Tìm tất cả các cặp số nguyên dương $(x,y)$ thỏa mãn $3x-5y=1$.'),
 ('linear-positive-empty','nt3-linear-positive','Tìm tất cả các cặp số nguyên dương $(x,y)$ thỏa mãn $6x+9y=6$.'),
 ('linear-zero-negative','nt3-linear-zero','Tìm tất cả các cặp số nguyên $(x,y)$ thỏa mãn $-4x+0y=12$.'),
 ('linear-both-zero','nt3-linear-zero','Tìm tất cả các cặp số nguyên dương $(x,y)$ thỏa mãn $0x+0y=0$.'),
 ('sequence-index-p','nt3-exam-ptnk-2024-chuyen_3c','Với mỗi số tự nhiên $p$, đặt $b_p=(2+\\sqrt3)^p+(2-\\sqrt3)^p$. Tìm $p$ để $b_p$ chia hết cho $14$.'),
 ('linear-fixed-negative','nt3-linear-zero','Tìm tất cả các cặp số nguyên dương $(x,y)$ thỏa mãn $-4x+0y=12$.'),
 ('residue-input-q','nt3-residue','Tìm tất cả các số nguyên $q$ sao cho $q^2-1$ chia hết cho $8$.'),
]
for name,parent,text in variants:
 id='nt3-val-'+name
 if id in byid:continue
 original=byid[parent];rows.append(dict(id=id,domain='number_theory',text=text,type=original['type'],difficulty=original['difficulty'],source='Generated diagnostic variation of '+parent,split='validation',evaluationRole='diagnostic_family_variant',family=parent,groupingReview='Exposed family: numerical/domain/sign/degeneracy/condition variation. Not held-out or generalization evidence.'))
p.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n');print('Curated25NumberTheory diagnostic variants; no held-out questions.')
