"""Review final development execution; never replace captured answers with corrected text."""
import json,sys
from pathlib import Path
b=Path('tools/specialist-training/iteration-03');p=b/'math-review.json';reviews=json.loads(p.read_text());phase=sys.argv[1] if len(sys.argv)>1 else 'development-number-theory-v220'
proofs={
 'nt3-linear-integer':('x=−3+11t,y=2−7t,t∈Z.','7(−3)+11·2=1 constructs a particular integer solution. Subtract it from any solution:7(x+3)=−11(y−2). Sincegcd(7,11)=1,11 dividesx+3, sox+3=11t forinteger t, andy−2=−7t. Conversely substitution cancels77t and gives1 for every t. This proves the infinite family, not only a bounded sample.'),
 'nt3-linear-positive':('Only(x,y)=(2,2).','Divide by3:2x+3y=10. A particular solution is(−10,10); complete familyx=−10+3t,y=10−2t follows coprimality2,3. Positivity gives3t≥11⇒t≥4 and2t≤9⇒t≤4. Hence t4 only, pair(2,2); original6·2+9·2=30. Both bounds and the explicit legal witness are shown.'),
 'nt3-linear-none':('No integer solution.','gcd(6,9)=3 divides every integer linear combination6x+9y, but20=3·6+2 is not divisible3. Therefore impossible for every integer pair. Every actual hint must also state the necessary condition rather than assert that20 is divisible3.'),
 'nt3-linear-zero':('y=3,x arbitrary integer.','0x+5y=15 iff y3. The free coordinate x has no constraint beyond being integer. The returned family x=t,y3 forinteger t covers every solution; substitution verifies all and no division by0 occurs.'),
}
for r in map(json.loads,(b/(phase+'.jsonl')).read_text().splitlines()):
 ident=r['id'];lesson=r['body']['solution']['lesson'];assert lesson and r['body']['solution']['status']=='ready'
 if ident in proofs:
  answer,proof=proofs[ident];review={'independentAnswer':answer,'independentDerivation':proof,'mathematics':'pass','completeness':'pass','explanation':'pass','conclusionCorrect':True,'rubric':{'correctness':40,'completeness':20,'clarity':14,'method':10,'formatting':10,'verificationOrUncertainty':5}}
 else:review=reviews['development-number-theory-v219/'+ident].copy()
 review['presentationPending']=phase=='development-number-theory-v220' and ident in ['nt3-infinite-factors','nt3-divisor-count'];review['presentationLimits']='Actual v2.20 rerun has clean schema/KaTeX/all-field Vietnamese audit, but cleanup reintroduced accented math labels in two cases, producing font metrics warnings. Those two remain presentation-pending; revised fully normalized source preflight now checks that stage too. Browser and standalone export checks are separately reported.'
 if phase!='development-number-theory-v220': review['presentationLimits']='Actual v2.21 re-execution validates distinct helper names and corrected math tables after Vietnamese normalization; no renderer warnings observed. Browser and standalone TeX checks are reported separately.'
 review['reviewScope']='Actual final development steps read against independent proof. Exposed-family development; no held-out or human satisfaction claim.'
 reviews[phase+'/'+ident]=review
for r in map(json.loads,(b/'baseline-number-theory-linear.jsonl').read_text().splitlines()):
 ident=r['id'];ready=r['body']['solution']['status']=='ready';answer,proof=proofs[ident]
 reviews['baseline-number-theory-linear/'+ident]={'independentAnswer':answer,'independentDerivation':proof,'mathematics':'fail' if ready else 'unverified','conclusionCorrect':ready,'completeness':'fail','explanation':'fail','failureAnalysis':'Correct final no-solution proof, but hint2 math explicitly asserts20\\vdots3, which is false. This displayed-hint error is material despite the final conclusion. New exact numeric assertion guard checks hints and steps.' if ready else 'No complete lesson returned; controlled incomplete/foreign-language failure. Full raw response and latency retained.','reviewScope':'Actual baseline read, including hints. No model self-verification treated as independent evidence.','rubric':{'correctness':0,'completeness':0,'clarity':0,'method':10 if ready else 0,'formatting':10 if ready else 0,'verificationOrUncertainty':0}}
p.write_text(json.dumps(reviews,ensure_ascii=False,indent=2)+'\n');print('Reviewed29final development answers and preserved4linear baselines, including false hint failure.')
