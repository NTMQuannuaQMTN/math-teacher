"""Independent finite enumeration; bounds follow from each finite question's statement."""
import itertools,json,math,pathlib
out={}
# All permutations of the five labelled friends; 0=An,1=Bình.
perms=list(itertools.permutations(range(5)))
out['comb-val-arrangements']={'total':len(perms),'adjacent':sum(abs(p.index(0)-p.index(1))==1 for p in perms)}
# Label red balls 0..2, blue 3..4, all unordered equally likely pairs.
pairs=list(itertools.combinations(range(5),2))
out['comb-val-probability']={'total':len(pairs),'favourable':sum((a<3)==(b<3) for a,b in pairs)}
out['comb-val-inclusion']={'count':sum(n%2==0 or n%3==0 for n in range(1,101))}
# Each person has degree 2, so the 12 incidences count every handshake twice.
out['comb-val-handshake']={'degreeSum':6*2,'handshakes':6*2//2}
out['nt-val-divisors']={'squareDivisors':[d for d in range(1,73) if 72%d==0 and math.isqrt(d)**2==d]}
# Integer polynomial evaluation mod m depends only on the residue; these exhaustive residue tables prove the claims.
out['nt-val-power']={'residuesMod5':[(n,(n**5-n)%5) for n in range(5)]}
out['nt-val-mod']={'residuesMod3':[(n,(n*n+n+1)%3) for n in range(3)]}
out['nt-val-gcd']={'gcd':math.gcd(84,126),'lcm':math.lcm(84,126)}
# Handled independently by exact factorisation in the written reviews, not numerical root search.
out['alg-val-quartic']={'factorization':'(x²-1)(x²-4)','solutions':[-2,-1,1,2]}
out['alg-val-surd']={'radicandIdentities':['7+4√3=(2+√3)²','7-4√3=(2-√3)²'],'signReason':'2>√3 because 4>3','result':'2√3'}
out['geo-val-menelaus']={'menelausProduct':'(1/2)·(FB/FC)·(1/2)=1','ratio':4,'locationReason':'internal intersections on AB and AC force transversal intersection on extension of BC; ratio4 places F beyond C'}
out['geo-val-incenter']={'BIC':180-50/2-70/2,'reason':'two internal half angles in triangle BIC'}
pathlib.Path('tools/specialist-training/independent-results.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(out,ensure_ascii=False))
