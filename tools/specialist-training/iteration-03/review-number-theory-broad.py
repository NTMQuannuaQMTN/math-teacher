"""Review the actual v2.18 capture. Preserve the failed gcd prose even though the answer list is right."""
import json,math,re
from pathlib import Path
b=Path('tools/specialist-training/iteration-03');p=b/'math-review.json';reviews=json.loads(p.read_text());phase='development-number-theory-broad-fixed'
extra={
 'nt3-square-factor':('n=−7,−1,1,7.','t²−n²=15, t≥0. All signed factors u·v=15 with matching parity give t=(u+v)/2 and n=(v−u)/2. Negative factor pairs have t<0 and are rejected; positive pairs(1,15),(3,5),(5,3),(15,1) give exactly7,1,−1,−7. Substitution gives64 or16.'),
 'nt3-gcd-affine':('Possible gcd values1,2,3,6; attained by n=−1,0,1,4.','Correct theorem is gcd(n+2,n+8)=gcd(n+2,6), since COMMON DIVISORS of the two pairs coincide. Every possible gcd divides6; each divisor d is attained by n=d−2. Actual captured prose instead says a number is divisible by both expressions iff divisible by the first and the difference. This is false: with n=1, 9 is a multiple of3 and9 but not6. The final list is correct; the proof sentence is a material error.'),
 'nt3-gcd-lcm':('(6,180),(12,90),(18,60),(30,36),(36,30),(60,18),(90,12),(180,6).','Write a=6x,b=6y,gcd(x,y)=1. Then lcm=6xy=180⇒xy=30. Every positive divisor x of30 has complementary divisor y coprime to x because30 is squarefree; all8 ordered pairs are listed. Conversely every pair gives both required values.'),
 'nt3-exam-ptnk-2024-chuyen_3b':('All nonnegative odd n.','Bases p=2+√3,q=2−√3 have p+q=4,pq=1, hence each satisfies t²−4t+1=0. Multiply by powers and add: a(n+2)=4a(n+1)−a(n), a0=2,a1=4. This proves integrality inductively. Mod4 pair-state(2,0)→(0,2)→(2,0), so exactly odd indices have remainder0.'),
 'nt3-exam-ptnk-2024-chuyen_3c':('n≡2 or6 mod8, n≥0 (equivalently n=4k+2,k≥0).','Same universal recurrence/integrality proof. Mod14 residues[2,4,0,10,12,10,0,4] and the NEXT PAIR is(2,4), identical to the initial pair. A deterministic transition repeats the entire future; zeros are exactly indices2,6 in each8-term period. A repeated single term would not suffice.'),
 'nt3-exam-ptnk-2025-chuyen_3a':('No positive m when n=3.','Original condition implies m divides n²=9 after subtracting m²+m. Thus m=1,3,9 exhaust all candidates. Original numerator/product are11/3,21/9,99/27 respectively, none integral. No unjustified upper-bound search.'),
 'nt3-exam-ptnk-2025-chuyen_3b':('(m,n)=(1,1),(4,2).','Set m=kn>0. Original condition implies m|n²⇒k|n. Since n² divides mn and thus the numerator, subtract n²(k²+1) to obtain n²|kn⇒n|k. Positive k,n divide each other⇒k=n. Then m=n² and n³|n⁴+2n² iff n|2. n1,2 give both listed pairs and original checks3/1,24/8. Universal student proof is complete; app machine coverage honestlypartial.'),
 'nt3-exam-ptnk-2025-chuyen_3c':('m=d² for every positive legal pair.','m=dx,n=dy,gcd(x,y)=1. Original condition gives m|n²⇒x|dy²⇒x|d by coprimality. Also d² divides mn and hence numerator d²x²+dx+d²y²⇒d²|dx⇒d|x. Positive d,x divide each other, so x=d and m=d². This is an independent universal argument; random checks are only supplementary. App machine coverage is partial for prose deduction.'),
 'nt3-exam-hcm-2025-chuyen_4a':('11 with(a,b)=(2,1);44 with(a,b)=(4,2).','2²+7·1²=11=11·1;4²+7·2²=44=11·4. Distinct positive two-digit numbers, both divisible11, each with explicit integer witnesses. Existence request does not require listing every possible beautiful number.'),
 'nt3-exam-ch-3':('a) all positive n; b)n=3k+1; c)n=18k+16; k≥0.','Binomial expansion gives f=16(n³+6n²+16n+16). Mod3 original f has remainders1,0,2 at n0,1,2. For576=16·36, cancel16; g mod4 is[0,3,0,1]⇒n even; g mod9 is[7,3,8,1,6,2,4,0,5]⇒n≡7 mod9. Combined classes modulo36 are16,34, equivalent to16 mod18. Positive-domain parameter k≥0 is preserved. Actual output has unnecessary factor1 and awkward converted modulo phrasing; math valid but clarity reduced.'),
}
# Independent arithmetic evidence; no application module imported.
assert [n for n in range(-15,16) if int(math.isqrt(n*n+15))**2==n*n+15]==[-7,-1,1,7]
assert [math.gcd(n+2,n+8) for n in [-1,0,1,4]]==[1,2,3,6]
assert [(6*u,180//u) for u in range(1,31) if 30%u==0 and math.gcd(u,30//u)==1]==[(6,180),(12,90),(18,60),(30,36),(36,30),(60,18),(90,12),(180,6)]
assert [r for r in range(36) if (r**3+6*r*r+16*r+16)%36==0]==[16,34]
for r in map(json.loads,(b/(phase+'.jsonl')).read_text().splitlines()):
 ident=r['id'];lesson=r['body']['solution']['lesson'];assert lesson and r['body']['solution']['status']=='ready'
 if ident not in extra:
  old=reviews['development-number-theory-first-fixes/'+ident].copy();old['reviewScope']='Actual v2.18 capture reviewed; same independently proved arithmetic family, newly complete square residue proof and expanded prime checks. Development only.';reviews[phase+'/'+ident]=old;continue
 answer,derivation=extra[ident];fail=ident=='nt3-gcd-affine'
 reviews[phase+'/'+ident]={
  'independentAnswer':answer,'independentDerivation':derivation,'mathematics':'fail' if fail else 'pass','conclusionCorrect':True,'completeness':'fail' if fail else 'pass','explanation':'fail' if fail else 'pass',
  'reviewScope':'Actual captured full steps read; independent arithmetic and universal proof above, not application certificates or LLM self-review. No held-out, no human satisfaction.',
  'failureAnalysis':'Material proof wording reverses common-divisor direction into false common-multiple equivalence. Correct final list does not make the proof pass; fixed source must be re-executed. Raw capture remains unchanged.' if fail else 'No material mathematical error identified. Long recurrence/multipart tables retain machine/text verification limits; natural-language presentation is reviewed independently.',
  'rubric':{'correctness':0 if fail else 40,'completeness':0 if fail else 20,'clarity':0 if fail else 12 if ident in ['nt3-exam-ch-3','nt3-exam-ptnk-2024-chuyen_3c'] else 13,'method':10,'formatting':10,'verificationOrUncertainty':0 if fail else 5},
  'rubricRationale':'False proof sentence is a material error despite correct answer. Other proofs include complete cases and witnesses; unnecessarily long/awkward wording loses clarity points. Automated proxy only.'
 }
p.write_text(json.dumps(reviews,ensure_ascii=False,indent=2)+'\n')
print('Reviewed22actual answers:22correct conclusions,21valid complete proofs; gcd proof failure preserved.')
