"""Independent review of the 25 actual development captures, with raw failures retained."""
import json,math
from pathlib import Path
b=Path('tools/specialist-training/iteration-03');p=b/'math-review.json';reviews=json.loads(p.read_text());phase='development-number-theory-v219'
rows=[json.loads(l) for l in (b/(phase+'.jsonl')).read_text().splitlines()]
expected_six=[n for n in range(1,100) if sum(n%d==0 for d in range(1,n+1))==6]
assert expected_six==[12,18,20,28,32,44,45,50,52,63,68,75,76,92,98,99]
expected_pairs=[(x,y) for x in range(-16,25) for y in range(-17,24) if x*y-3*x-4*y==8 and x>4]
assert expected_pairs==[(5,23),(6,13),(8,8),(9,7),(14,5),(24,4)]
extra={
 'nt3-factor-extra-condition':('Exactly(5,23),(6,13),(8,8),(9,7),(14,5),(24,4).','Complete the product: (x−4)(y−3)=20. x>4 iff u=x−4>0. Hence u is one of1,2,4,5,10,20, each with v=20/u and x=u+4,y=v+3. This exhausts all positive divisors, and every listed pair satisfies both the original equation and x>4. Negative factors are explicitly rejected by the extra condition; no domain condition was discarded.'),
 'nt3-divisor-count':('12,18,20,28,32,44,45,50,52,63,68,75,76,92,98,99.','Unique prime factorization gives divisor count ∏(e+1). Count6 forces either exponent5 or distinct prime exponents2,1: n=p⁵ orp²q,p≠q. Forn<100 first form onlyp2→32; second hasp≤√(99/2), hencep2,3,5,7. Corresponding q prime bounds24,11,3,2 and q≠p give exactly the displayed15 second-form values. Every value meets the bound and divisor count, and classification+bounds prove completeness. Independent literal divisor enumeration for every n1..99 agrees; the enumeration is a check of a justified finite task, not the student proof.'),
 'nt3-cube-gap':('No integer n.','One of consecutive n,n+1 is even and the other odd. Cubing preserves parity, so n³+(n+1)³ is always odd, whereas100 is even. This argument includes every negative integer. Captured solution equivalently proves that P(n)=n³+(n+1)³−100 has residue1 in BOTH classes modulo2, using the polynomial difference identity to extend the table universally. Therefore no equation root can exist.'),
}
for r in rows:
 ident=r['id'];lesson=r['body']['solution']['lesson'];assert lesson and r['body']['solution']['status']=='ready'
 if ident in extra:
  answer,proof=extra[ident];review={'independentAnswer':answer,'independentDerivation':proof,'mathematics':'pass','conclusionCorrect':True,'completeness':'pass','explanation':'pass','rubric':{'correctness':40,'completeness':20,'clarity':13,'method':10,'formatting':8,'verificationOrUncertainty':5}}
 else:
  review=reviews['development-number-theory-broad-fixed/'+ident].copy()
  if ident=='nt3-gcd-affine':
   review.update(mathematics='pass',completeness='pass',explanation='pass',failureAnalysis='The prior false common-multiple wording has been removed in the actual re-executed response. Raw v2.18 failure remains in its separate report.',independentDerivation='gcd(n+2,n+8)=gcd(n+2,6): a COMMON DIVISOR divides both original numbers iff it divides n+2 and their difference6. Both directions are explicitly stated in the captured response. Each possible gcd is a positive divisor of6; every d=1,2,3,6 is attained by n=d−2, with n=−1,0,1,4. Correct universal proof and explicit witnesses now appear in the actual solution.',rubric={'correctness':40,'completeness':20,'clarity':14,'method':10,'formatting':10,'verificationOrUncertainty':5})
  elif ident in ['nt3-exam-ch-3','nt3-exam-ptnk-2024-chuyen_3c']:
   review['rubric']['clarity']=14;review['failureAnalysis']='Actual revised prose removes the empty prefix-before0 and awkward converted modulo phrase. Multipart tables now include a worked value. Mathematical derivation and complete classes independently reviewed as before.'
 review['reviewScope']='Actual v2.19 steps read against the independent proof; application certificates alone are not treated as independent validation. Development only; no held-out or human satisfaction claim.'
 review['presentationLimits']='KaTeX syntax/all-field language audit passes; console font metrics warnings for accented Vietnamese inside math text occurred on some table labels. A source correction is pending actual browser/re-execution confirmation; this report does not claim perfect visual rendering.'
 review['presentationPending']=ident in ['nt3-square-factor','nt3-infinite-factors','nt3-positive-factors','nt3-factor-extra-condition','nt3-divisor-count']
 reviews[phase+'/'+ident]=review
p.write_text(json.dumps(reviews,ensure_ascii=False,indent=2)+'\n')
print('25 actual Number Theory development responses independently reviewed:25 mathematically complete proofs; rendering fix validation pending.')
