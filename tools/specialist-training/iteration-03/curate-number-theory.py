"""Development-only questions; never silently move exposed families into held-out."""
import json
from pathlib import Path
b=Path('tools/specialist-training/iteration-03')
p=b/'cases.json'; rows=json.loads(p.read_text()); known={x['id'] for x in rows}
generated=[
 ('nt3-cube-divisibility','Chứng minh với mọi số nguyên $n$, biểu thức $n^3-n$ chia hết cho $6$.','polynomial-divisibility','Medium'),
 ('nt3-fifth-divisibility','Chứng minh với mọi số nguyên $n$, biểu thức $n^5-n$ chia hết cho $30$.','polynomial-divisibility','Hard'),
 ('nt3-false-divisibility','Chứng minh với mọi số nguyên $n$, biểu thức $n^2+n$ chia hết cho $4$.','false-universal-claim','Medium'),
 ('nt3-residue','Tìm tất cả các số nguyên $n$ sao cho $n^2+3n+2$ chia hết cho $6$.','complete-residue-classes','Medium'),
 ('nt3-residue-none','Tìm tất cả các số nguyên $n$ sao cho $n^2+1$ chia hết cho $3$.','residue-impossibility','Easy'),
 ('nt3-square-gap','Tìm tất cả các số nguyên $n$ sao cho $n^2+2$ là số chính phương.','square-residue-obstruction','Easy'),
 ('nt3-square-factor','Tìm tất cả các số nguyên $n$ sao cho $n^2+15$ là số chính phương.','difference-of-squares-completeness','Medium'),
 ('nt3-infinite-factors','Tìm tất cả các cặp số nguyên $(x,y)$ thỏa mãn $xy-3x-4y=-12$.','zero-product-infinite-families','Medium'),
 ('nt3-positive-factors','Tìm tất cả các cặp số nguyên dương $(x,y)$ thỏa mãn $xy-3x-4y=8$.','factor-domain-restriction','Medium'),
 ('nt3-factor-extra-condition','Tìm tất cả các cặp số nguyên $(x,y)$ thỏa mãn $xy-3x-4y=8$ và $x>4$.','additional-condition-parsing','Medium'),
 ('nt3-gcd-affine','Cho số nguyên $n$. Tìm tất cả các giá trị có thể của ước chung lớn nhất của $n+2$ và $n+8$.','gcd-euclidean-reduction','Medium'),
 ('nt3-gcd-lcm','Tìm tất cả các cặp số nguyên dương $(a,b)$ có ước chung lớn nhất bằng $6$ và bội chung nhỏ nhất bằng $180$.','coprime-factor-pairs','Medium'),
 ('nt3-divisor-count','Tìm tất cả các số nguyên dương có đúng $6$ ước dương và nhỏ hơn $100$.','prime-exponents-divisor-count','Hard'),
 ('nt3-prime-shift','Tìm tất cả các số nguyên tố $p$ sao cho $p+4$ và $p+8$ cũng là số nguyên tố.','exceptional-prime-proof','Medium'),
 ('nt3-cube-gap','Chứng minh không có số nguyên $n$ sao cho $n^3+(n+1)^3=100$.','cube-residue-obstruction','Medium'),
]
for ident,text,kind,difficulty in generated:
 if ident not in known: rows.append(dict(id=ident,domain='number_theory',text=text,type=kind,difficulty=difficulty,source='Generated iteration-03 set NT-B; '+ident,split='development',evaluationRole='development',groupingReview='Exposed development family; numerical/theorem variants remain diagnostic.'))
sources={x['id']:x for x in map(json.loads,Path('tools/benchmark/dataset/chuyen.jsonl').read_text().splitlines())}
sources.update({x['id']:x for x in map(json.loads,Path('tools/benchmark/dataset/problems.jsonl').read_text().splitlines())})
for original in ['ptnk-2024-chuyen_3b','ptnk-2024-chuyen_3c','ptnk-2025-chuyen_3a','ptnk-2025-chuyen_3b','ptnk-2025-chuyen_3c','hcm-2025-chuyen_4a','ch-3']:
 ident='nt3-exam-'+original
 if ident not in known:
  x=sources[original]; rows.append(dict(id=ident,domain='number_theory',text=x['problem_text'],type='entrance-exam-'+original,difficulty='Entrance-exam challenge',source='Existing repository transcription: tools/benchmark/dataset/'+('problems.jsonl' if original=='ch-3' else 'chuyen.jsonl')+'; '+original+'. Original OCR is not an official answer key; conditions preserved.',split='development',evaluationRole='development',groupingReview='Past-paper transcription exposed in development; all related variants excluded from held-out.'))
p.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'numberTheoryDevelopmentCount':sum(x['domain']=='number_theory' and x['split']=='development' for x in rows)}))
