import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { planProof } from '../../shared/src/proof/planner';
import { normalizeProblemText } from '../../shared/src/mathText';
import { verifyProof } from '../../shared/src/proof/verify';
import type { Figure } from '../../shared/src/solution';

type P = [number, number];
const sub = (a:P,b:P):P => [a[0]-b[0],a[1]-b[1]];
const dot = (a:P,b:P) => a[0]*b[0]+a[1]*b[1];
const distance = (a:P,b:P) => Math.hypot(...sub(a,b));
const angle = (a:P,b:P,c:P) => {
  const u=sub(a,b),v=sub(c,b);
  return Math.acos(dot(u,v)/(Math.hypot(...u)*Math.hypot(...v)))*180/Math.PI;
};
const circle = (degrees:number):P => [Math.cos(degrees*Math.PI/180),Math.sin(degrees*Math.PI/180)];
// X=A+t(B-A), |X-B|²=|X-D|² is a linear equation, with no geometry-engine dependency.
const bisectorIntersection = (a:P,b:P,d:P):[P,number] => {
  const direction=sub(b,a),normal=sub(d,b);
  const t=((dot(d,d)-dot(b,b))/2-dot(a,normal))/dot(direction,normal);
  return [[a[0]+t*direction[0],a[1]+t*direction[1]],t];
};

describe('point order cannot be inferred from an illustrative configuration',()=>{
  it('does not certify four distinct altitude-foot vertices without excluding right triangles',()=>{
    const text='Cho tam giác ABC, E,F lần lượt là chân đường cao từ B,C. Chứng minh tứ giác BCEF nội tiếp.';
    const plan=planProof(text);expect(plan.status).not.toBe('VERIFIED');
    expect(plan.goals[0]!.proved).toBe(false);
    expect(plan.goals[0]!.verification!.steps.flatMap(s=>s.problems).join()).toContain('four distinct cyclic vertices');
    expect(planProof(text.replace('tam giác ABC,','tam giác ABC nhọn,')).status).toBe('VERIFIED');
  });
  it('does not infer same-side vertices from one drawing when using the converse circle theorem',()=>{
    const figure:Figure={scale:'schematic',points:[['A',-1,0],['B',1,0],['C',0,2],['D',1,1.5]].map(([id,x,y])=>({id:id as string,label:id as string,kind:'free',refs:[],x:x as number,y:y as number,value:null,value2:null,draggable:true,hidden:false})),lines:[],circles:[],angles:[],marks:[],checks:[]};
    const equal={t:'eqangle' as const,a:['A','C','B'] as [string,string,string],b:['A','D','B'] as [string,string,string]};
    const cyclic={t:'cyclic' as const,p:['A','B','C','D'] as [string,string,string,string]};
    const proof=[{id:0,fact:equal,method:'GIVEN',premises:[]},{id:1,fact:cyclic,method:'CYCLIC_QUADRILATERAL',premises:[0]}];
    const result=verifyProof(figure,proof,[cyclic],{statementGivens:[equal]});
    expect(result.ok).toBe(false);
    expect(result.steps[1]!.problems.join()).toContain('drawing does not prove this prerequisite');
    expect(verifyProof(figure,proof,[cyclic],{statementGivens:[equal],statementText:'Cho C, D nằm cùng phía so với đường thẳng AB. Chứng minh ABCD nội tiếp.'}).ok).toBe(true);
    // Same stated angle equality, opposite side: D is not on circle ABC.
    const a:P=[-1,0],b:P=[1,0],c:P=[0,2],d:P=[0,-2];
    expect(angle(a,c,b)).toBeCloseTo(angle(a,d,b));
    expect(distance(d,[0,.75])).toBe(2.75);
    expect(distance(a,[0,.75])).toBe(1.25);
  });
  it('exposes a projection-foot angle that changes when the foot leaves a side',()=>{
    const figure:Figure={scale:'schematic',points:[
      ...[['A',0,0],['B',4,0],['C',1,3]].map(([id,x,y])=>({id:id as string,label:id as string,kind:'free' as const,refs:[],x:x as number,y:y as number,value:null,value2:null,draggable:true,hidden:false})),
      {id:'H',label:'H',kind:'foot',refs:['C','A','B'],x:null,y:null,value:null,value2:null,draggable:false,hidden:false},
    ],lines:[],circles:[],angles:[],marks:[],checks:[]};
    const col={t:'col' as const,p:['A','H','B'] as [string,string,string]};
    const goal={t:'eqangle' as const,a:['C','A','H'] as [string,string,string],b:['C','A','B'] as [string,string,string]};
    const result=verifyProof(figure,[{id:0,fact:col,method:'CONSTRUCTION',premises:[]},{id:1,fact:goal,method:'ANGLE_CHASE',premises:[0]}],[goal]);
    expect(result.ok).toBe(false);
    expect(result.steps[1]!.problems.join()).toContain('point order needs an explicit proof');
    const bounded=verifyProof(figure,[{id:0,fact:col,method:'CONSTRUCTION',premises:[]},{id:1,fact:goal,method:'ANGLE_CHASE',premises:[0]}],[goal],{statementText:'Cho tam giác ABC nhọn. H là chân đường cao từ C.'});
    expect(bounded.ok).toBe(true);
    const unsupported=verifyProof(figure,[{id:0,fact:col,method:'CONSTRUCTION',premises:[]},{id:1,fact:goal,method:'SAME_RAY_ANGLE',premises:[0]}],[goal]);
    expect(unsupported.ok).toBe(false);
    expect(unsupported.steps[1]!.problems.join()).toContain('established right angle');
    const c:P=[-1,3],a:P=[0,0],b:P=[4,0],h:P=[-1,0];
    expect(angle(c,a,h)+angle(c,a,b)).toBeCloseTo(180);
    expect(angle(c,a,h)).not.toBeCloseTo(angle(c,a,b));
    for(const x of [1,-1]) {
      const moved={...figure,points:figure.points.map(p=>p.id==='C'?{...p,x}:p)};
      const perp={t:'perp' as const,a:['C','H'] as [string,string],b:['A','B'] as [string,string]};
      const right={t:'aval' as const,a:['C','H','A'] as [string,string,string],v:90};
      expect(verifyProof(moved,[{id:0,fact:col,method:'CONSTRUCTION',premises:[]},{id:1,fact:perp,method:'CONSTRUCTION',premises:[]},{id:2,fact:right,method:'ANGLE_CHASE',premises:[0,1]}],[right]).ok).toBe(true);
    }
  });
  it('constructs an admissible acute-circle case falsifying the emitted angle chain',()=>{
    const a=circle(0),b=circle(300),c=circle(140),d=circle(70);
    const [e,t]=bisectorIntersection(a,b,d),[f]=bisectorIntersection(a,c,d);
    expect(angle(b,a,c)).toBeCloseTo(80);
    expect(angle(a,b,c)).toBeCloseTo(70);
    expect(angle(a,c,b)).toBeCloseTo(30);
    expect(distance(c,d)).toBeGreaterThan(distance(a,b));
    expect(distance(e,b)).toBeCloseTo(distance(e,d));
    expect(distance(f,c)).toBeCloseTo(distance(f,d));
    expect(t).toBeLessThan(0);
    expect(angle(a,e,d)).toBeCloseTo(110);
    expect(angle(a,f,d)).toBeCloseTo(70);
    expect(angle(e,b,d)).toBeCloseTo(35);
  });

  it('rejects the same unsafe configuration assumption after renaming every visible point',()=>{
    const lines=['problems.jsonl','chuyen.jsonl'].flatMap(f=>readFileSync(new URL('../../tools/benchmark/dataset/'+f,import.meta.url),'utf8').trim().split('\n'));
    const text=(lines.map(x=>JSON.parse(x)).find(x=>x.id==='ptnk-2025-chuyen_4a') as {problem_text:string}).problem_text;
    const names:Record<string,string>={A:'P',B:'Q',C:'R',D:'S',E:'X',F:'Y',O:'I'};
    const plan=planProof(normalizeProblemText(text));
    expect(plan.goals).toHaveLength(2);
    // Rename the constructed figure and candidate derivations independently of
    // the text parser, so this checks the verifier rather than wording templates.
    const rename = <T>(value:T):T => JSON.parse(JSON.stringify(value),(_,v)=>typeof v==='string' && names[v] ? names[v] : v) as T;
    for (const goal of plan.goals) {
      const proof=rename(goal.proof);
      const verified=verifyProof(rename(plan.figure!),proof,[rename(goal.fact)],{
        statementGivens:proof.filter(d=>d.method==='GIVEN').map(d=>d.fact),
      });
      expect(verified.ok).toBe(false);
      expect(verified.steps.flatMap(s=>s.problems).join()).toContain('unrestricted line intersections (X, Y)');
    }
  });
});
