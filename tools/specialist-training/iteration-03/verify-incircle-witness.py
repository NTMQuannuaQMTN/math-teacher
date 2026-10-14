"""Independent numeric sanity check, not a substitute for the synthetic proof.
No geometry or proof-planner implementation is imported."""
import math,random,json
from pathlib import Path
add=lambda a,b:(a[0]+b[0],a[1]+b[1]);sub=lambda a,b:(a[0]-b[0],a[1]-b[1]);mul=lambda a,t:(a[0]*t,a[1]*t)
dot=lambda a,b:a[0]*b[0]+a[1]*b[1];cross=lambda a,b:a[0]*b[1]-a[1]*b[0];norm=lambda a:math.sqrt(dot(a,a));dist=lambda a,b:norm(sub(a,b))
def foot(p,a,b):v=sub(b,a);return add(a,mul(v,dot(sub(p,a),v)/dot(v,v)))
def intersection(a,b,c,d):u=sub(b,a);v=sub(d,c);t=cross(sub(c,a),v)/cross(u,v);return add(a,mul(u,t)),t
def center(a,b,c):
 u=sub(b,a);v=sub(c,a);k=2*cross(u,v);return add(a,((dot(u,u)*v[1]-dot(v,v)*u[1])/k,(u[0]*dot(v,v)-v[0]*dot(u,u))/k))
def angle(a,v,b):u=sub(a,v);w=sub(b,v);return math.acos(max(-1,min(1,dot(u,w)/(norm(u)*norm(w)))))
rng=random.Random(20261012);worst={};minimum={}
for n in range(1000):
 x=rng.uniform(.002,.499),
 x=x[0];height=math.sqrt(x*(1-x))*rng.uniform(1.001,8)
 a=(x,height);b=(0,0);c=(1,0);ab=dist(a,b);ac=dist(a,c);bc=1
 i=mul(add(add(mul(a,bc),mul(b,ac)),mul(c,ab)),1/(ab+ac+bc));d=foot(i,b,c);e=foot(i,c,a);f=foot(i,a,b);j=mul(add(e,f),.5);k,tk=intersection(a,d,e,f)
 v=sub(k,i);th=dot(sub(a,i),v)/dot(v,v);h=add(i,mul(v,th));s=center(i,d,j);r=dist(i,d);rs=dist(s,i)
 delta=sub(s,i);ds=norm(delta);u=mul(delta,1/ds);cx=(r*r-rs*rs+ds*ds)/(2*ds);cy=math.sqrt(max(0,r*r-cx*cx));base=add(i,mul(u,cx));normal=(-u[1],u[0]);hits=[add(base,mul(normal,cy)),add(base,mul(normal,-cy))];g=max(hits,key=lambda q:dist(q,d))
 v=sub(j,d);tl=-2*dot(sub(d,i),v)/dot(v,v);l=add(d,mul(v,tl));p,_=intersection(a,l,g,j);witness=sub(mul(foot(d,i,a),2),d)
 checks={'radiusProduct':abs(r*r-dist(i,j)*dist(i,a)),'angleGoal':abs(angle(i,h,d)-angle(i,d,k)),'cyclicH':abs(dist(s,h)-rs),'collinearG':abs(cross(sub(g,a),sub(d,a))),'finalIntersectionOnCircle':abs(dist(i,p)-r),'explicitWitness':dist(p,witness),'witnessOnGJ':abs(cross(sub(witness,g),sub(j,g)))}
 for name,error in checks.items():worst[name]=max(worst.get(name,0),error)
 for name,value in {'KinsideAD':min(tk,1-tk),'HpositiveRay':th,'JinsideCircle':r-dist(i,j),'GdistinctD':dist(g,d)}.items():minimum[name]=min(minimum.get(name,float('inf')),value)
 assert tk>0 and tk<1 and th>0 and dist(i,j)<r and dist(g,d)>1e-9
 assert max(checks.values())<1e-6,(n,checks)
result={'configurations':1000,'scope':'Acute triangles AB<AC, independent coordinate calculations; sanity only, synthetic deductions required','maxResiduals':worst,'minimumMargins':minimum}
Path('tools/specialist-training/iteration-03/incircle-independent-sanity.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
