import type { ModelLesson } from './solution';
import { figureFromStatement } from './figureFromText';

const key=(points:string)=>[...points].sort().join('');
function cyclicClaims(text:string):{points:string;index:number}[] {
  const plain=text.replace(/\$/g,'').replace(/\\text\{([^}]*)\}/g,'$1');
  const out=[...plain.matchAll(/\b([A-Z]{4})\s+(?:là\s+(?:tứ giác\s+)?)?nội tiếp/gu)].map(m=>({points:m[1]!,index:m.index!}));
  for(const m of plain.matchAll(/([A-Z])\s*,\s*([A-Z])\s*,\s*([A-Z])\s*(?:,|và)\s*([A-Z])\s+(?:cùng thuộc|cùng nằm trên|thuộc một đường tròn|nằm trên một đường tròn)/gu))out.push({points:m.slice(1,5).join(''),index:m.index!});
  return out.filter(c=>new Set(c.points).size===4);
}
/** A concrete diameter witness; the two right angles must have different vertices and the same endpoints. */
function hasDiameterWitness(points:string,text:string):boolean {
  const angles=[...text.matchAll(/(?:\\(?:widehat|angle)\s*\{([A-Z]{3})\}|∠([A-Z]{3}))\s*=\s*90\s*(?:\^\{?\\circ\}?|°)/g)].map(m=>m[1]??m[2]!);
  for(const a of angles)for(const b of angles) {
    if(a[1]!==b[1]&&key(a[0]!+a[2]!)===key(b[0]!+b[2]!)&&key(a+b[1])===key(points))return true;
  }
  return false;
}
/** A narrowly parsed converse theorem witness. Equations alone do not prove
 * vertex sides; insist on an explicit statement naming both vertices/chord. */
function hasEqualAngleSideWitness(points:string,text:string):boolean {
 const angle=String.raw`(?:\\widehat\{([A-Z]{3})\}|∠([A-Z]{3}))`;
 const plain=text.replace(/\$/g,'').replace(/\s+/g,' ');
 for(const m of plain.matchAll(new RegExp(angle+'\\s*=\\s*'+angle,'gu'))) {
  const a=m[1]??m[2]!,b=m[3]??m[4]!;
  if(a[1]===b[1]||key(a[0]!+a[2]!)!==key(b[0]!+b[2]!)||key(a+b[1])!==key(points))continue;
  const x=a[0]!,y=a[2]!,p=a[1]!,q=b[1]!;
  if(new RegExp(`(?:${p}\\s*(?:,|và)\\s*${q}|${q}\\s*(?:,|và)\\s*${p})\\s+(?:nằm |ở )?cùng phía (?:đối với |so với )?(?:đường thẳng )?(?:${x}${y}|${y}${x})(?:[,. ]|$)`,'u').test(plain))return true;
 }
 return false;
}
/** Narrow dependency guard, not a claim that arbitrary prose is a formal proof. Figure measurements are never givens. */
export function proofDependencyFeedback(lesson:ModelLesson,confirmedText:string):string[] {
  const hypotheses=confirmedText.split(/chứng minh|(?:^|\s)[a-f]\)\s/iu)[0]!;
  const established=new Set(cyclicClaims(hypotheses).map(c=>key(c.points)));
  // Reconstruct only the confirmed hypotheses, never the model's diagram or a requested conclusion.
  // Membership follows construction types, not measured distances in the drawing.
  const figure=figureFromStatement(hypotheses)?.figure;
  if(figure)for(const circle of figure.circles) {
    const members=new Set<string>();
    if(circle.through)members.add(circle.through);
    const center=figure.points.find(p=>p.id===circle.center);
    if(center?.kind==='circumcenter')center.refs.forEach(p=>members.add(p));
    if(center?.kind==='midpoint'&&circle.through&&center.refs.includes(circle.through))center.refs.forEach(p=>members.add(p));
    for(const p of figure.points)if(!p.hidden&&(
      (p.kind==='on_circle'&&p.refs[0]===circle.id)||
      (p.kind==='line_circle'&&p.refs[2]===circle.id)||
      (p.kind==='circle_circle'&&p.refs.slice(0,2).includes(circle.id))||
      (p.kind==='tangent'&&p.refs[1]===circle.id)))members.add(p.id);
    const visible=[...members].filter(id=>!figure.points.find(p=>p.id===id)?.hidden);
    for(let a=0;a<visible.length;a++)for(let b=a+1;b<visible.length;b++)for(let c=b+1;c<visible.length;c++)for(let d=c+1;d<visible.length;d++)established.add(key(visible[a]!+visible[b]!+visible[c]!+visible[d]!));
  }
  const before=new Map<string,Set<string>>(),beforeText=new Map<string,string>(),feedback:string[]=[];
  let earlier= hypotheses;
  for(const step of lesson.steps) {
    before.set(step.id,new Set(established));beforeText.set(step.id,earlier);
    // An explicitly unresolved list reports missing claims; it is not an assertion of them.
    const explained=step.explanation.split(/Phần chưa được giải(?: trong bài này)?:/u)[0]!;
    const text=[explained,step.math??'',step.reason??''].join(' ');
    const angles=(s:string)=>s.replace(/\$/g,'').replace(/\\(?:widehat|angle)\s*\{?([A-Z]{3})\}?/g,'∠$1').replace(/\s+/g,' ');
    const plain=angles(text),prior=angles(earlier);
    // Collinearity alone gives no order of the three points. The rays may
    // coincide rather than oppose one another.
    for(const m of plain.matchAll(/∠([A-Z]{3})\s*=\s*180(?:\^\{?\\circ\}?|°)?\s*[-−]\s*∠([A-Z]{3})/gu)){
      const a=m[1]!,b=m[2]!;
      if(a[1]!==b[1])continue;
      const common=[a[0],a[2]].filter(p=>p===b[0]||p===b[2]);if(common.length!==1)continue;
      const x=[a[0],a[2]].find(p=>p!==common[0])!,y=[b[0],b[2]].find(p=>p!==common[0])!,v=a[1]!;
      const order=new RegExp(`${v} (?:nằm )?giữa (?:${x}\\s*(?:,|và)\\s*${y}|${y}\\s*(?:,|và)\\s*${x})`,'u');
      const rays=new RegExp(`(?:${v}${x}\\s*(?:,|và)\\s*${v}${y}|${v}${y}\\s*(?:,|và)\\s*${v}${x}) (?:là hai tia |hai tia )?đối nhau`,'u');
      if(!order.test(prior+' '+plain)&&!rays.test(prior+' '+plain))feedback.push(`step ${step.id}: supplementary angles require opposite rays or a proved between-point order; collinearity alone is insufficient.`);
    }
    if(/tam giác (?:cân [A-Z]{3}|[A-Z]{3} cân)/u.test(plain))for(const m of plain.matchAll(/∠([A-Z]{3})\s*=\s*2\s*∠([A-Z]{3})/gu)){
      const a=m[1]!,b=m[2]!;if(key(a)!==key(b)||a[1]===b[1])continue;
      const numeric=new RegExp(`(?:∠${a}\\s*=\\s*90|∠${b}\\s*=\\s*45)(?:\\D|$)`,'u');
      if(!numeric.test(prior+' '+plain))feedback.push(`step ${step.id}: an isosceles triangle has equal base angles and apex 180 degrees minus twice a base angle; apex equals twice the base does not follow from isosceles alone. Prove the additional angle condition.`);
    }
    for(const claim of cyclicClaims(text)) {
      const k=key(claim.points);
      if(established.has(k))continue;
      // The conclusion must follow explicit angle equations, not its own assertion or a diagram alone.
      if((hasDiameterWitness(claim.points,earlier+' '+text)||hasEqualAngleSideWitness(claim.points,earlier+' '+text)) && /nên|suy ra|vậy|do đó|⇒|\\Rightarrow/iu.test(text))established.add(k);
      else feedback.push(`step ${step.id}: prove that ${claim.points} is cyclic before using it; it is not a confirmed given or an earlier proved fact. State the concrete angle/radius deductions, not just the cyclic assertion.`);
    }
    earlier+=' '+text;
  }
  for(const hint of lesson.hints) {
    const allowed=before.get(hint.stepId)??new Set<string>();
    const own=lesson.steps.find(s=>s.id===hint.stepId);
    const witness=own?[own.explanation,own.math??'',own.reason??''].join(' '):'';
    for(const claim of cyclicClaims([hint.cue??'',hint.explanation,hint.math??'', /vì|do |theo /iu.test(hint.question)?hint.question:''].join(' '))) {
      const prerequisites=(beforeText.get(hint.stepId)??hypotheses)+' '+witness;
      if(!allowed.has(key(claim.points))&&!hasDiameterWitness(claim.points,prerequisites)&&!hasEqualAngleSideWitness(claim.points,prerequisites))feedback.push(`hint ${hint.id}: cyclicity of ${claim.points} needs a proof before it can be used as a premise.`);
    }
  }
  return [...new Set(feedback)];
}
