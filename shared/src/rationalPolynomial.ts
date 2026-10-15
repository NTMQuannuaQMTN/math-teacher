import {parseExpression,splitRelation,variablesOf} from './expr';
import {expressionSource} from './expressionSource';

export interface Fraction {n:bigint;d:bigint}
export type Polynomial=Fraction[];
interface RationalFunction {n:Polynomial;d:Polynomial;excluded:Polynomial[]}
export interface ExactRoot {u:Fraction;v:Fraction;radicand:bigint}
export interface EquationCertificate {
 variable:string;original:string;coefficients:bigint[];excluded:Polynomial[];
 left:RationalFunction;right:RationalFunction;originalLeft:RationalFunction;originalRight:RationalFunction;
 candidates:ExactRoot[];solutions:ExactRoot[];identity:boolean;
}
const LIMIT=10n**30n;
const gcd=(a:bigint,b:bigint):bigint=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b){const t=a%b;a=b;b=t;}return a;};
export function fraction(n:bigint,d=1n):Fraction {
 if(d===0n)throw Error('zero rational denominator');if(d<0n){n=-n;d=-d;}
 const g=gcd(n,d);n/=g;d/=g;if(n>LIMIT||n< -LIMIT||d>LIMIT)throw Error('coefficient bound');return {n,d};
}
const zero=()=>fraction(0n),one=()=>fraction(1n);
const add=(a:Fraction,b:Fraction)=>fraction(a.n*b.d+b.n*a.d,a.d*b.d);
const neg=(a:Fraction)=>fraction(-a.n,a.d);
const mul=(a:Fraction,b:Fraction)=>fraction(a.n*b.n,a.d*b.d);
const div=(a:Fraction,b:Fraction)=>fraction(a.n*b.d,a.d*b.n);
const equal=(a:Fraction,b:Fraction)=>a.n===b.n&&a.d===b.d;
function trim(p:Polynomial):Polynomial {while(p.length>1&&p.at(-1)!.n===0n)p.pop();return p;}
function sum(a:Polynomial,b:Polynomial):Polynomial{return trim(Array.from({length:Math.max(a.length,b.length)},(_,i)=>add(a[i]??zero(),b[i]??zero())));}
function product(a:Polynomial,b:Polynomial):Polynomial {
 if(a.length+b.length-2>12)throw Error('degree bound');
 const p=Array.from({length:a.length+b.length-1},zero);
 for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)p[i+j]=add(p[i+j]!,mul(a[i]!,b[j]!));return trim(p);
}
function constant(n:bigint):RationalFunction{return {n:[fraction(n)],d:[one()],excluded:[]};}
function compile(node:ReturnType<typeof parseExpression>,variable:string):RationalFunction {
 if(node.t==='num'){if(!Number.isSafeInteger(node.v))throw Error('integer literal only');return constant(BigInt(node.v));}
 if(node.t==='var'){if(node.name!==variable)throw Error('unexpected variable');return {n:[zero(),one()],d:[one()],excluded:[]};}
 if(node.t==='neg'){const a=compile(node.a,variable);return {...a,n:a.n.map(neg)};}
 if(node.t!=='bin')throw Error('not a rational expression');
 if(node.op==='^'){
  if(node.b.t!=='num'||!Number.isInteger(node.b.v)||node.b.v<0||node.b.v>6)throw Error('bounded integer powers only');
  const a=compile(node.a,variable);let result=constant(1n);
  for(let i=0;i<node.b.v;i++)result={n:product(result.n,a.n),d:product(result.d,a.d),excluded:a.excluded};
  // Even power zero retains the original base's domain; no undefined division is silently cancelled.
  if(node.b.v===0){if(a.n.every(c=>c.n===0n))throw Error("undefined zero power");return {...result,excluded:[...a.excluded,a.n]};}
  return {...result,excluded:a.excluded};
 }
 const a=compile(node.a,variable),b=compile(node.b,variable),excluded=[...a.excluded,...b.excluded];
 switch(node.op){
  case '+':case '-':return {n:sum(product(a.n,b.d),product(b.n,a.d).map(c=>node.op==='-'?neg(c):c)),d:product(a.d,b.d),excluded};
  case '*':return {n:product(a.n,b.n),d:product(a.d,b.d),excluded};
  case '/':if(b.n.every(c=>c.n===0n))throw Error('identically undefined division');return {n:product(a.n,b.d),d:product(a.d,b.n),excluded:[...excluded,b.n]};
  default:throw Error('unsupported arithmetic');
 }
}
function quotientRemainder(a:Polynomial,b:Polynomial):[Polynomial,Polynomial] {
 if(b.every(c=>c.n===0n))throw Error('zero polynomial divisor');
 let remainder=trim(a.map(c=>({...c})));const quotient=Array.from({length:Math.max(1,a.length-b.length+1)},zero);
 while(remainder.length>=b.length&&!remainder.every(c=>c.n===0n)){
  const shift=remainder.length-b.length,coefficient=div(remainder.at(-1)!,b.at(-1)!);quotient[shift]=coefficient;
  const term=[...Array.from({length:shift},zero),...b.map(c=>neg(mul(c,coefficient)))];remainder=sum(remainder,term);
 }
 return [trim(quotient),remainder];
}
function reduceRational(a:RationalFunction):RationalFunction {
 let p=a.n,q=a.d;
 while(!q.every(c=>c.n===0n)){const remainder=quotientRemainder(p,q)[1];p=q;q=remainder;}
 const common=p.map(c=>div(c,p.at(-1)!));
 return {n:quotientRemainder(a.n,common)[0],d:quotientRemainder(a.d,common)[0],excluded:a.excluded};
}
function primitive(p:Polynomial):bigint[] {
 let lcm=1n;for(const c of p)lcm=lcm/gcd(lcm,c.d)*c.d;
 const ints=p.map(c=>c.n*(lcm/c.d));let common=0n;for(const c of ints)common=gcd(common,c);
 if(common===0n)return [0n];const sign=ints.at(-1)!<0n?-1n:1n;return ints.map(c=>c/common*sign);
}
function squareRoot(n:bigint):bigint|null {
 if(n<0n)return null;if(n<2n)return n;let x=n,y=(x+1n)/2n;
 while(y<x){x=y;y=(x+n/x)/2n;}return x*x===n?x:null;
}
function roots(p:bigint[]):ExactRoot[] {
 if(p.length===1)return [];
 if(p.length===2)return [{u:fraction(-p[0]!,p[1]!),v:zero(),radicand:0n}];
 if(p.length>3){
  if(p.length>5)throw Error('polynomial degree is not supported');
  const divisors=(value:bigint)=>{value=value<0n?-value:value;if(value===0n)return [0n];const out:bigint[]=[];for(let d=1n;d*d<=value;d++)if(value%d===0n){out.push(d);if(d*d!==value)out.push(value/d);}return out;};
  const numerators=p[0]===0n?[0n]:divisors(p[0]!),denominators=divisors(p.at(-1)!);
  let rational:Fraction|null=null;
  outer:for(const n0 of numerators)for(const sign of n0===0n?[1n]:[-1n,1n])for(const d0 of denominators){
   const candidate=fraction(sign*n0,d0),root:ExactRoot={u:candidate,v:zero(),radicand:0n};
   if(rootSatisfiesPolynomial(root,p.map(n=>fraction(n)))){rational=candidate;break outer;}
  }
  if(!rational)throw Error('higher-degree polynomial has no rational factor');
  const [quotient,remainder]=quotientRemainder(p.map(n=>fraction(n)),[neg(rational),fraction(1n)]);
  if(remainder.some(c=>c.n!==0n))throw Error('rational factor division failed');
  const rest=roots(primitive(quotient));
  const first:ExactRoot={u:rational,v:zero(),radicand:0n};
  return [first,...rest].filter((root,index,all)=>all.findIndex(other=>rootKey(other)===rootKey(root))===index);
 }
 const [c,b,a]=p as [bigint,bigint,bigint],d=b*b-4n*a*c;
 if(d<0n)return [];const s=squareRoot(d);
 if(s!==null){const rs=[fraction(-b-s,2n*a),fraction(-b+s,2n*a)];return rs.filter((r,i)=>i===0||!equal(r,rs[0]!)).map(u=>({u,v:zero(),radicand:0n}));}
 return [-1n,1n].map(sign=>({u:fraction(-b,2n*a),v:fraction(sign,2n*a),radicand:d}));
}
function rootProduct(a:ExactRoot,b:ExactRoot):ExactRoot {
 return {u:add(mul(a.u,b.u),mul(mul(a.v,b.v),fraction(a.radicand))),v:add(mul(a.u,b.v),mul(a.v,b.u)),radicand:a.radicand};
}
export function rootSatisfiesPolynomial(root:ExactRoot,p:Polynomial):boolean {
 let value:ExactRoot={u:zero(),v:zero(),radicand:root.radicand};
 for(let i=p.length-1;i>=0;i--){value=rootProduct(value,root);value.u=add(value.u,p[i]!);}
 return value.u.n===0n&&value.v.n===0n;
}
const rootKey=(r:ExactRoot)=>`${r.u.n}/${r.u.d}:${r.v.n}/${r.v.d}:${r.radicand}`;
export const exactPolynomialRoots=(coefficients:bigint[])=>roots(coefficients);
const polynomialKey=(p:Polynomial)=>p.map(c=>`${c.n}/${c.d}`).join(',');
/** Structural symbolic conversion, not degree inference from a handful of numerical samples. */
export function exactRationalEquation(original:string):EquationCertificate|null {
 try{
  const rel=splitRelation(original);if(!rel||rel.rel!=='=')return null;
  const vars=new Set([...variablesOf(rel.sides[0]),...variablesOf(rel.sides[1])]);if(vars.size!==1)return null;
  const variable=[...vars][0]!,originalLeft=compile(parseExpression(rel.sides[0]),variable),originalRight=compile(parseExpression(rel.sides[1]),variable),a=reduceRational(originalLeft),b=reduceRational(originalRight);
  // Complete exact solving is available through degree four when rational
  // linear factors reduce the remainder to a quadratic.  Unsupported
  // irreducible cubics/quartics are rejected by roots(), never approximated.
  const polynomial=sum(product(a.n,b.d),product(b.n,a.d).map(neg));if(polynomial.length>5)return null;
  const coefficients=primitive(polynomial);if(coefficients.some(c=>c>10n**12n||c< -(10n**12n)))return null;
  const excluded=[...a.excluded,...b.excluded].filter((p,i,all)=>all.findIndex(q=>polynomialKey(p)===polynomialKey(q))===i);
  if(excluded.length>8)return null;
  const candidates=roots(coefficients),solutions=candidates.filter(r=>excluded.every(p=>!rootSatisfiesPolynomial(r,p)));
  return {variable,original,coefficients,excluded,left:a,right:b,originalLeft,originalRight,candidates,solutions,identity:coefficients.length===1&&coefficients[0]===0n};
 }catch{return null;}
}
/** Recompute the symbolic identity and every domain restriction, then verify all candidate roots exactly. */
export function verifyEquationCertificate(c:EquationCertificate):boolean {
 try {
 const recomputed=exactRationalEquation(c.original);if(!recomputed)return false;
 if(c.variable!==recomputed.variable||c.identity!==recomputed.identity||c.coefficients.join(',')!==recomputed.coefficients.join(','))return false;
 if(c.excluded.map(polynomialKey).join(';')!==recomputed.excluded.map(polynomialKey).join(';'))return false;
 for(const side of ['left','right','originalLeft','originalRight'] as const){const actual=c[side],expected=recomputed[side];if(polynomialKey(actual.n)!==polynomialKey(expected.n)||polynomialKey(actual.d)!==polynomialKey(expected.d)||actual.excluded.map(polynomialKey).join(';')!==expected.excluded.map(polynomialKey).join(';'))return false;}
 if(c.candidates.map(rootKey).join(';')!==recomputed.candidates.map(rootKey).join(';')||c.solutions.map(rootKey).join(';')!==recomputed.solutions.map(rootKey).join(';'))return false;
 return c.solutions.every(r=>rootSatisfiesPolynomial(r,c.coefficients.map(n=>fraction(n)))&&c.excluded.every(p=>!rootSatisfiesPolynomial(r,p)));
 }catch{return false;}
}
export function rationalValueAt(part:EquationCertificate['left'],root:ExactRoot):ExactRoot {
 const evaluate=(p:Polynomial)=>{let result:ExactRoot={u:zero(),v:zero(),radicand:root.radicand};for(let i=p.length-1;i>=0;i--){result=rootProduct(result,root);result.u=add(result.u,p[i]!);}return result;};
 const numerator=evaluate(part.n),denominator=evaluate(part.d);
 const norm=add(mul(denominator.u,denominator.u),neg(mul(mul(denominator.v,denominator.v),fraction(root.radicand))));
 const inverse={u:div(denominator.u,norm),v:div(neg(denominator.v),norm),radicand:root.radicand};return rootProduct(numerator,inverse);
}
export function cancellationFactor(original:EquationCertificate['left'],reduced:EquationCertificate['left']):Polynomial {
 return quotientRemainder(original.d,reduced.d)[0];
}
export function fractionLatex(r:Fraction):string {return r.d===1n?String(r.n):`${r.n<0n?'-':''}\\frac{${r.n<0n?-r.n:r.n}}{${r.d}}`;}
export function rootLatex(r:ExactRoot):string {
 if(r.v.n===0n)return fractionLatex(r.u);
 let radicand=r.radicand,multiplier=1n;
 // Bounded simplification improves school notation without an unbounded factorization task.
 for(let factor=2n;factor<=1000n&&factor*factor<=radicand;factor++)while(radicand%(factor*factor)===0n){radicand/=factor*factor;multiplier*=factor;}
 const remainderSquare=squareRoot(radicand);
 if(remainderSquare!==null)return fractionLatex(add(r.u,mul(r.v,fraction(multiplier*remainderSquare))));
 r={...r,v:mul(r.v,fraction(multiplier)),radicand};
 const radical=`\\sqrt{${r.radicand}}`,v= r.v.n<0n?fraction(-r.v.n,r.v.d):r.v;
 const term=v.n===v.d?radical:v.n===1n?`\\frac{${radical}}{${v.d}}`:`${fractionLatex(v)}${radical}`;
 return `${r.u.n===0n?'':fractionLatex(r.u)}${r.v.n<0n?'-':r.u.n!==0n?'+':''}${term}`;
}
/** (v − h)^k as a student writes it: v^k when h = 0, (v + |h|)^k when h < 0, no "(0)" or "-(-3)"; no brackets for k = 1. */
export function shiftedPowerLatex(variable:string,center:Fraction,power:number):string {
 const exp=power===1?'':`^{${power}}`;
 if(center.n===0n)return `${variable}${exp}`;
 const abs=fraction(center.n<0n?-center.n:center.n,center.d);
 const body=`${variable}${center.n<0n?'+':'-'}${fractionLatex(abs)}`;
 return power===1?body:`(${body})${exp}`;
}
/** Complete linear factorization for the supported rationally-factorable cubic/quartic certificates. */
export function polynomialLinearFactorizationLatex(coefficients:bigint[],variable:string):string|null {
 try {
  if(coefficients.length<2||coefficients.length>5)return null;
  let remaining=coefficients.map(n=>fraction(n));const factors:{root:Fraction;multiplicity:number}[]=[];
  for(const root of roots(coefficients)){
   if(root.v.n!==0n)continue;let multiplicity=0;
   for(;;){const [quotient,remainder]=quotientRemainder(remaining,[neg(root.u),one()]);if(remainder.some(c=>c.n!==0n))break;remaining=quotient;multiplicity++;}
   if(multiplicity)factors.push({root:root.u,multiplicity});
  }
  if(remaining.length!==1||!factors.length)return null;
  const leading=remaining[0]!,prefix=leading.n===leading.d?'':fractionLatex(leading);
  const body=factors.map(({root,multiplicity})=>{const factor=shiftedPowerLatex(variable,root,multiplicity);return multiplicity===1?`(${factor})`:factor;}).join('');
  return `${prefix}${body}`;
 }catch{return null;}
}
/** Σ coefficient·body without "(4)(…)+(4)": zero terms dropped, unit coefficients hidden, signs merged. body "" = constant. */
export function sumLatex(terms:[Fraction,string][]):string {
 const out:string[]=[];
 for(const [c,body] of terms){if(c.n===0n)continue;
  const abs=fraction(c.n<0n?-c.n:c.n,c.d),coef=body&&abs.n===abs.d?'':fractionLatex(abs);
  out.push(`${c.n<0n?'-':out.length?'+':''}${coef}${body}`);
 }return out.join('')||'0';
}
export function polynomialLatex(p:Polynomial,variable:string):string {
 const terms:string[]=[];
 for(let i=p.length-1;i>=0;i--){const c=p[i]!;if(c.n===0n)continue;
  const abs=fraction(c.n<0n?-c.n:c.n,c.d),coef=i>0&&abs.n===abs.d?'':fractionLatex(abs);
  terms.push(`${c.n<0n?'-':terms.length?'+':''}${coef}${i===0?'':i===1?variable:`${variable}^{${i}}`}`);
 }return terms.join('')||'0';
}

/** Exact ordering in Q(sqrt(D)); no decimal tolerance decides a domain condition. */
export function rootSign(r:ExactRoot):-1|0|1 {
 const sign=(n:bigint):-1|0|1=>n<0n?-1:n>0n?1:0;
 if(r.radicand<0n)throw Error('nonreal root');
 const u=sign(r.u.n),v=r.radicand===0n?0:sign(r.v.n);if(!v)return u;if(!u)return v;if(u===v)return u;
 const difference=add(mul(r.u,r.u),neg(mul(mul(r.v,r.v),fraction(r.radicand))));
 return difference.n===0n?0:difference.n>0n?u:v;
}
export interface UnaryEquationCertificate {
 original:string;kind:'sqrt'|'abs';argument:string;other:string;variable:string;
 branches:EquationCertificate[];solutions:ExactRoot[];regions:InequalityCertificate[];
}
function arithmeticSource(node:ReturnType<typeof parseExpression>):string {
 if(node.t==='num')return String(node.v);if(node.t==='var')return node.name;
 if(node.t==='neg')return `(-${arithmeticSource(node.a)})`;
 if(node.t==='bin')return `(${arithmeticSource(node.a)}${node.op}${arithmeticSource(node.b)})`;
 throw Error('nested function not supported');
}
/**
 * Isolate one top-level square root or absolute-value term from a sum.  This
 * accepts equations such as p(x)+2sqrt(q(x))=0 without teaching the solver a
 * particular set of coefficients.  Products or nested functions remain out of
 * scope unless the function is multiplied only by a nonzero constant.
 */
export function isolateUnaryTerm(original:string):string|null {
 const relation=splitRelation(original);if(!relation||relation.rel!=='=')return null;
 type Node=ReturnType<typeof parseExpression>;
 const terms:{node:Node;sign:1|-1}[]=[];
 const flatten=(node:Node,sign:1|-1):void=>{
  if(node.t==='neg'){flatten(node.a,sign===1?-1:1);return;}
  if(node.t==='bin'&&(node.op==='+'||node.op==='-')){flatten(node.a,sign);flatten(node.b,node.op==='+'?sign:sign===1?-1:1);return;}
  terms.push({node,sign});
 };
 flatten(parseExpression(relation.sides[0]),1);flatten(parseExpression(relation.sides[1]),-1);
 const callCount=(node:Node):number=>node.t==='call'?1:node.t==='neg'?callCount(node.a):node.t==='bin'?callCount(node.a)+callCount(node.b):0;
 const unary=terms.flatMap((term,index)=>{
  const node=term.node;
  if(node.t==='call'&&(node.fn==='sqrt'||node.fn==='abs'))return [{index,term,call:node,coefficient:'1'}];
  if(node.t==='bin'&&node.op==='*'){
   const call=node.a.t==='call'&&(node.a.fn==='sqrt'||node.a.fn==='abs')?node.a:node.b.t==='call'&&(node.b.fn==='sqrt'||node.b.fn==='abs')?node.b:null;
   const factor=call===node.a?node.b:call===node.b?node.a:null;
   if(call&&factor&&callCount(factor)===0&&variablesOf(expressionSource(factor)).size===0)return [{index,term,call,coefficient:expressionSource(factor)}];
  }
  return [];
 });
 if(unary.length!==1||terms.some((term,index)=>index!==unary[0]!.index&&callCount(term.node)>0))return null;
 const u=unary[0]!,signedCoefficient=u.term.sign===1?u.coefficient:`-(${u.coefficient})`;
 // Verify that the coefficient is a defined, nonzero rational constant.
 const coefficient=compile(parseExpression(signedCoefficient),'x');
 if(coefficient.n.length!==1||coefficient.d.length!==1||coefficient.n[0]!.n===0n)return null;
 const remaining=terms.filter((_,index)=>index!==u.index);
 const rest=remaining.map((term,index)=>`${term.sign===1?(index?' + ':''):(index?' - ':'-')}(${expressionSource(term.node)})`).join('')||'0';
 return `${u.call.fn}(${expressionSource(u.call.a)})=(-(${rest}))/(${signedCoefficient})`;
}
export function exactUnaryEquation(original:string):UnaryEquationCertificate|null {
 try {
  const relation=splitRelation(original);if(!relation||relation.rel!=='=')return null;
  const normalizeAbs=(s:string)=>s.trim().replace(/\\left|\\right/g,'').replace(/^\\left\|([\s\S]+)\\right\|$/,'abs($1)').replace(/^\|([^|]+)\|$/,'abs($1)').replace(/^\\lvert([\s\S]+)\\rvert$/,'abs($1)').replace(/^\\vert([\s\S]+)\\vert$/,'abs($1)');
  let a=parseExpression(normalizeAbs(relation.sides[0])),b=parseExpression(normalizeAbs(relation.sides[1]));
  if(b.t==='call'&&(b.fn==='sqrt'||b.fn==='abs'))[a,b]=[b,a];
  if(a.t!=='call'||(a.fn!=='sqrt'&&a.fn!=='abs')){
   const isolated=isolateUnaryTerm(original);if(!isolated)return null;
   const inner=exactUnaryEquation(isolated);return inner?{...inner,original}:null;
  }
  const argument=arithmeticSource(a.a),other=arithmeticSource(b),kind=a.fn;
  const expressions=kind==='sqrt'?[`${argument}=(${other})^2`]:[`${argument}=${other}`,`${argument}=-(${other})`];
  const branches=expressions.map(exactRationalEquation);if(branches.some(c=>!c))return null;
  const checked=branches as EquationCertificate[];if(new Set(checked.map(c=>c.variable)).size!==1)return null;
  // Squaring loses the sign of the original right side; check that side, never its square.
  const variable=checked[0]!.variable,originalOther=compile(b,variable);
  const regions=checked.filter(c=>c.identity).map(c=>{
   const factors=c.excluded.map(p=>`*((${polynomialLatex(p,variable)})/(${polynomialLatex(p,variable)}))`).join('');
   return exactRationalInequality(`(${other})+0*${variable}${factors}>=0`);
  });if(regions.some(c=>!c))return null;
  const actualRegions=regions as InequalityCertificate[];
  const accepted=checked.flatMap(c=>c.solutions.filter(r=>rootSign(rationalValueAt(originalOther,r))>=0));
  const unique=accepted.filter((r,i,all)=>all.findIndex(q=>rootKey(q)===rootKey(r))===i&&!actualRegions.some(region=>region.intervals.some(interval=>rootInInterval(r,interval))));
  return {original,kind,argument,other,variable,branches:checked,solutions:unique,regions:actualRegions};
 }catch{return null;}
}
export function verifyUnaryCertificate(c:UnaryEquationCertificate):boolean {
 try {
  const expected=exactUnaryEquation(c.original);if(!expected)return false;
  return c.kind===expected.kind&&c.variable===expected.variable&&c.argument===expected.argument&&c.other===expected.other&&c.branches.length===expected.branches.length&&c.branches.every((b,i)=>b.original===expected.branches[i]!.original&&verifyEquationCertificate(b))&&c.solutions.map(rootKey).join(';')===expected.solutions.map(rootKey).join(';')&&JSON.stringify(c.regions,(_,v)=>typeof v==='bigint'?v.toString():v)===JSON.stringify(expected.regions,(_,v)=>typeof v==='bigint'?v.toString():v)&&c.regions.every(verifyInequalityCertificate);
 }catch{return false;}
}

export function expressionValueAt(expression:string,variable:string,root:ExactRoot):ExactRoot {
 return rationalValueAt(compile(parseExpression(expression),variable),root);
}
export function rationalExpressionLatex(expression:string,variable:string):string {
 const part=compile(parseExpression(expression),variable),n=polynomialLatex(part.n,variable),d=polynomialLatex(part.d,variable);
 return d==='1'?n:`\\frac{${n}}{${d}}`;
}

/** Compare two quadratic surds, even when their radicands differ, by exact sign-aware squaring. */
export function compareRoots(a:ExactRoot,b:ExactRoot):-1|0|1 {
 const u=add(a.u,neg(b.u)),v=a.radicand===0n?zero():a.v,w=b.radicand===0n?zero():neg(b.v);
 const first:ExactRoot={u,v,radicand:a.radicand},sf=rootSign(first),ss=w.n<0n?-1:w.n>0n?1:0;
 if(!sf)return ss;if(!ss||sf===ss)return sf;
 const norm:ExactRoot={u:add(add(mul(u,u),mul(mul(v,v),fraction(a.radicand))),neg(mul(mul(w,w),fraction(b.radicand)))),v:mul(fraction(2n),mul(u,v)),radicand:a.radicand};
 const sn=rootSign(norm);return sn===0?0:sn>0?sf:ss;
}

export interface InequalityBoundary {root:ExactRoot;numeratorMultiplicity:number;denominatorMultiplicity:number;excluded:boolean}
export interface RealInterval {lower:ExactRoot|null;upper:ExactRoot|null;lowerClosed:boolean;upperClosed:boolean}
export interface InequalityCertificate {
 original:string;variable:string;relation:'<'|'<='|'>'|'>=';difference:RationalFunction;
 boundaries:InequalityBoundary[];intervalSigns:number[];intervals:RealInterval[];
}
export function exactRationalInequality(original:string):InequalityCertificate|null {
 try {
  const relation=splitRelation(original);if(!relation||!['<','<=','>','>='].includes(relation.rel))return null;
  const vars=new Set([...variablesOf(relation.sides[0]),...variablesOf(relation.sides[1])]);if(vars.size!==1)return null;
  const variable=[...vars][0]!,a=compile(parseExpression(relation.sides[0]),variable),b=compile(parseExpression(relation.sides[1]),variable);
  const difference=reduceRational({n:sum(product(a.n,b.d),product(b.n,a.d).map(neg)),d:product(a.d,b.d),excluded:[...a.excluded,...b.excluded]});
  if([difference.n,difference.d,...difference.excluded].some(p=>p.length>3))return null;
  const boundaries:InequalityBoundary[]=[];
  const collect=(p:Polynomial,kind:'numerator'|'denominator'|'excluded')=>{
   const candidates=roots(primitive(p)),multiplicity=p.length===3&&candidates.length===1?2:1;
   for(const root of candidates){let boundary=boundaries.find(c=>compareRoots(c.root,root)===0);if(!boundary){boundary={root,numeratorMultiplicity:0,denominatorMultiplicity:0,excluded:false};boundaries.push(boundary);}
    if(kind==='numerator')boundary.numeratorMultiplicity=multiplicity;
    if(kind==='denominator'){boundary.denominatorMultiplicity=multiplicity;boundary.excluded=true;}
    if(kind==='excluded')boundary.excluded=true;
   }
  };
  collect(difference.n,'numerator');collect(difference.d,'denominator');for(const p of difference.excluded)collect(p,'excluded');
  boundaries.sort((a,b)=>compareRoots(a.root,b.root));if(boundaries.length>6)return null;
  let sign=difference.n.every(c=>c.n===0n)?0:(difference.n.at(-1)!.n<0n?-1:1)*(difference.d.at(-1)!.n<0n?-1:1);
  const intervalSigns=Array.from({length:boundaries.length+1},()=>0);intervalSigns[boundaries.length]=sign;
  for(let i=boundaries.length-1;i>=0;i--){const boundary=boundaries[i]!;if((boundary.numeratorMultiplicity+boundary.denominatorMultiplicity)%2===1)sign=-sign;intervalSigns[i]=sign;}
  const rel=relation.rel as InequalityCertificate['relation'];
  const accepts=(s:number)=>rel==='<'?s<0:rel==='<='?s<=0:rel==='>'?s>0:s>=0;
  const selected=intervalSigns.map(accepts),points=boundaries.map(boundary=>!boundary.excluded&&accepts(0));
  const intervals:RealInterval[]=[];
  for(let i=0;i<selected.length;i++){
   if(!selected[i])continue;
   const next:RealInterval={lower:i?boundaries[i-1]!.root:null,upper:boundaries[i]?.root??null,lowerClosed:i?points[i-1]!:false,upperClosed:points[i]??false};
   const previous=intervals.at(-1);
   if(previous?.upper&&next.lower&&compareRoots(previous.upper,next.lower)===0&&(previous.upperClosed||next.lowerClosed)){previous.upper=next.upper;previous.upperClosed=next.upperClosed;}
   else intervals.push(next);
  }
  for(let i=0;i<points.length;i++)if(points[i]&&!selected[i]&&!selected[i+1])intervals.push({lower:boundaries[i]!.root,upper:boundaries[i]!.root,lowerClosed:true,upperClosed:true});
  intervals.sort((a,b)=>a.lower===null?b.lower===null?0:-1:b.lower===null?1:compareRoots(a.lower,b.lower));
  return {original,variable,relation:rel,difference,boundaries,intervalSigns,intervals};
 }catch{return null;}
}
export function verifyInequalityCertificate(c:InequalityCertificate):boolean {
 try {
  const expected=exactRationalInequality(c.original);if(!expected)return false;
  const serialize=(value:unknown)=>JSON.stringify(value,(_,v)=>typeof v==='bigint'?v.toString():v);
  return serialize(c)===serialize(expected);
 }catch{return false;}
}
export function intervalLatex(interval:RealInterval):string {
 if(interval.lower&&interval.upper&&compareRoots(interval.lower,interval.upper)===0)return `\\{${rootLatex(interval.lower)}\\}`;
 return `${interval.lowerClosed?'[':'('}${interval.lower?rootLatex(interval.lower):'-\\infty'};${interval.upper?rootLatex(interval.upper):'+\\infty'}${interval.upperClosed?']':')'}`;
}
export function polynomialRootDerivation(p:Polynomial,variable:string):string|null {
 const coefficients=primitive(p),candidates=roots(coefficients);if(coefficients.length===1)return null;
 const raw=polynomialLatex(p,variable),normalized=polynomialLatex(coefficients.map(n=>fraction(n)),variable);
 const equation=`${raw}=0${raw!==normalized?`\\Leftrightarrow ${normalized}=0`:""}`;
 const values=candidates.map(r=>`${variable}=${rootLatex(r)}`).join(',\\quad ');
 if(coefficients.length===2)return `${equation}\\quad\\Rightarrow\\quad ${values}`;
 const [c,b,a]=coefficients as [bigint,bigint,bigint],d=b*b-4n*a*c;
 return `${equation}:\\quad\\Delta=(${b})^2-4(${a})(${c})=${d}${values?`\\quad\\Rightarrow\\quad ${values}`:'<0'}`;
}

export interface ParameterDiscriminantCertificate {
 original:string;variable:string;parameter:string;a:Fraction;b:Polynomial;c:Polynomial;discriminant:Polynomial;
 vertex:Fraction|null;minimum:Fraction|null;universallyDistinct:boolean;counterexample:Fraction|null;
}
export function parameterDiscriminant(original:string,parameter:string):ParameterDiscriminantCertificate|null {
 try {
  const relation=splitRelation(original);if(!relation||relation.rel!=='=')return null;
  const vars=new Set([...variablesOf(relation.sides[0]),...variablesOf(relation.sides[1])]);if(vars.size!==2||!vars.has(parameter))return null;
  const variable=[...vars].find(v=>v!==parameter)!,left=parseExpression(relation.sides[0]),right=parseExpression(relation.sides[1]);
  const degree=(node:ReturnType<typeof parseExpression>):number=>{
   if(node.t==='num')return 0;if(node.t==='var')return node.name===variable?1:0;if(node.t==='neg')return degree(node.a);
   if(node.t!=='bin')throw Error('polynomial only');const a=degree(node.a),b=degree(node.b);
   if(node.op==='+'||node.op==='-')return Math.max(a,b);if(node.op==='*')return a+b;
   if(node.op==='^'&&node.b.t==='num'&&Number.isInteger(node.b.v)&&node.b.v>=1&&node.b.v<=4)return a*node.b.v;
   if(node.op==='/'&&b===0&&variablesOf(arithmeticSource(node.b)).size===0)return a;
   throw Error('polynomial coefficients only');
  };
  if(Math.max(degree(left),degree(right))>2)return null;
  const substitute=(node:ReturnType<typeof parseExpression>,value:number):ReturnType<typeof parseExpression>=>{
   if(node.t==='var'&&node.name===variable)return {t:'num',v:value};if(node.t==='neg')return {...node,a:substitute(node.a,value)};
   if(node.t==='bin')return {...node,a:substitute(node.a,value),b:substitute(node.b,value)};return node;
  };
  const evaluate=(value:number):Polynomial=>{
   const a=compile(substitute(left,value),parameter),b=compile(substitute(right,value),parameter);
   if(a.d.length!==1||b.d.length!==1||a.excluded.some(p=>p.length>1)||b.excluded.some(p=>p.length>1))throw Error('parameter denominator');
   return sum(a.n.map(c=>div(c,a.d[0]!)),b.n.map(c=>neg(div(c,b.d[0]!))));
  };
  // The structural degree check above proves the coefficient identities; no sampled parameter proves a universal claim.
  const c=evaluate(0),positive=evaluate(1),negative=evaluate(-1);
  const aPolynomial=sum(sum(positive,negative),c.map(coefficient=>mul(fraction(-2n),coefficient))).map(coefficient=>div(coefficient,fraction(2n)));
  const b=sum(positive,negative.map(neg)).map(coefficient=>div(coefficient,fraction(2n)));
  trim(aPolynomial);trim(b);if(aPolynomial.length!==1||aPolynomial[0]!.n===0n||b.length>2||c.length>3)return null;
  const a=aPolynomial[0]!,discriminant=sum(product(b,b),c.map(coefficient=>neg(mul(fraction(4n),mul(a,coefficient)))));
  const A=discriminant[2]??zero(),B=discriminant[1]??zero(),C=discriminant[0]!;
  let vertex:Fraction|null=null,minimum:Fraction|null=null,counterexample:Fraction|null=null,universallyDistinct=false;
  if(A.n>0n){vertex=div(neg(B),mul(fraction(2n),A));minimum=add(C,neg(div(mul(B,B),mul(fraction(4n),A))));universallyDistinct=minimum.n>0n;if(!universallyDistinct)counterexample=vertex;}
  else if(A.n===0n&&B.n===0n){minimum=C;universallyDistinct=C.n>0n;if(!universallyDistinct)counterexample=zero();}
  else if(A.n===0n)counterexample=div(neg(add(C,one())),B);
  else counterexample=add(one(),div(add(B.n<0n?neg(B):B,C.n<0n?neg(C):C),neg(A)));
  return {original,variable,parameter,a,b,c,discriminant,vertex,minimum,universallyDistinct,counterexample};
 }catch{return null;}
}
export function verifyParameterCertificate(c:ParameterDiscriminantCertificate):boolean {
 try {
  const expected=parameterDiscriminant(c.original,c.parameter);if(!expected)return false;
  const serialize=(value:unknown)=>JSON.stringify(value,(_,v)=>typeof v==='bigint'?v.toString():v);
  return serialize(c)===serialize(expected);
 }catch{return false;}
}
export function polynomialValueAtFraction(p:Polynomial,x:Fraction):Fraction {
 let value=zero();for(let i=p.length-1;i>=0;i--)value=add(mul(value,x),p[i]!);return value;
}

function polynomialDegree(node:ReturnType<typeof parseExpression>,variable:string):number {
 if(node.t==='num')return 0;if(node.t==='var')return node.name===variable?1:0;if(node.t==='neg')return polynomialDegree(node.a,variable);
 if(node.t!=='bin')throw Error('polynomial only');const a=polynomialDegree(node.a,variable),b=polynomialDegree(node.b,variable);
 if(node.op==='+'||node.op==='-')return Math.max(a,b);if(node.op==='*')return a+b;
 if(node.op==='^'&&node.b.t==='num'&&Number.isInteger(node.b.v)&&node.b.v>=1&&node.b.v<=4)return a*node.b.v;
 if(node.op==='/'&&variablesOf(arithmeticSource(node.b)).size===0)return a;
 throw Error('polynomial coefficients only');
}
interface BilinearForm {xy:Fraction;x:Fraction;y:Fraction;constant:Fraction}
function bilinearForm(expression:string,x:string,y:string):BilinearForm {
 const relation=splitRelation(expression);if(!relation||relation.rel!=='=')throw Error('equation required');
 const a=parseExpression(relation.sides[0]),b=parseExpression(relation.sides[1]);if(Math.max(polynomialDegree(a,x),polynomialDegree(b,x))>1)throw Error('bilinear only');
 const substitute=(node:ReturnType<typeof parseExpression>,value:number):ReturnType<typeof parseExpression>=>{
  if(node.t==='var'&&node.name===x)return {t:'num',v:value};if(node.t==='neg')return {...node,a:substitute(node.a,value)};if(node.t==='bin')return {...node,a:substitute(node.a,value),b:substitute(node.b,value)};return node;
 };
 const evaluate=(value:number)=>{
  const left=compile(substitute(a,value),y),right=compile(substitute(b,value),y);
  if(left.d.length!==1||right.d.length!==1||left.excluded.some(p=>p.length>1)||right.excluded.some(p=>p.length>1))throw Error('polynomial only');
  return sum(left.n.map(c=>div(c,left.d[0]!)),right.n.map(c=>neg(div(c,right.d[0]!))));
 };
 const constant=evaluate(0),coefficient=sum(evaluate(1),constant.map(neg));if(constant.length>2||coefficient.length>2)throw Error('bilinear only');
 return {xy:coefficient[1]??zero(),x:coefficient[0]!,y:constant[1]??zero(),constant:constant[0]!};
}
export interface SystemCertificate {
 equations:string[];variables:[string,string];forms:BilinearForm[];kind:'linear'|'sum_product';
 determinant:Fraction|null;sum:Fraction|null;product:Fraction|null;rootEquation:EquationCertificate|null;
 solutions:[ExactRoot,ExactRoot][];infinite:'none'|'line'|'plane';line:BilinearForm|null;
}
export function exactTwoVariableSystem(equations:string[]):SystemCertificate|null {
 try {
  if(equations.length!==2)return null;const vars=new Set(equations.flatMap(e=>[...variablesOf(e)]));if(vars.size!==2)return null;
  const variables=[...vars].sort() as [string,string],forms=equations.map(e=>bilinearForm(e,...variables));
  const rationalRoot=(u:Fraction):ExactRoot=>({u,v:zero(),radicand:0n});
  const base={equations,variables,forms,solutions:[] as [ExactRoot,ExactRoot][],infinite:'none' as const,line:null};
  if(forms.every(f=>f.xy.n===0n)){
   const [a,b]=forms as [BilinearForm,BilinearForm],determinant=add(mul(a.x,b.y),neg(mul(b.x,a.y)));
   const result:SystemCertificate={...base,kind:'linear',determinant,sum:null,product:null,rootEquation:null};
   if(determinant.n!==0n){result.solutions=[[rationalRoot(div(add(mul(a.y,b.constant),neg(mul(b.y,a.constant))),determinant)),rationalRoot(div(add(mul(b.x,a.constant),neg(mul(a.x,b.constant))),determinant))]];return result;}
   if(forms.some(f=>f.x.n===0n&&f.y.n===0n&&f.constant.n!==0n))return result;
   const pivot=forms.find(f=>f.x.n!==0n||f.y.n!==0n);
   if(!pivot){result.infinite='plane';return result;}
   const consistent=forms.every(f=>equal(mul(pivot.x,f.constant),mul(f.x,pivot.constant))&&equal(mul(pivot.y,f.constant),mul(f.y,pivot.constant)));
   if(consistent){result.infinite='line';result.line=pivot;}return result;
  }
  const sumForm=forms.find(f=>f.xy.n===0n&&f.x.n!==0n&&equal(f.x,f.y)),productForm=forms.find(f=>f.xy.n!==0n&&f.x.n===0n&&f.y.n===0n);
  if(!sumForm||!productForm)return null;
  const s=div(neg(sumForm.constant),sumForm.x),p=div(neg(productForm.constant),productForm.xy);
  const rootEquation=exactRationalEquation(`t^2-(${fractionLatex(s)})t+(${fractionLatex(p)})=0`);if(!rootEquation)return null;
  const solutions:[ExactRoot,ExactRoot][]=[];
  if(rootEquation.solutions.length===1)solutions.push([rootEquation.solutions[0]!,rootEquation.solutions[0]!]);
  if(rootEquation.solutions.length===2){const [a,b]=rootEquation.solutions as [ExactRoot,ExactRoot];solutions.push([a,b],[b,a]);}
  return {...base,kind:'sum_product',determinant:null,sum:s,product:p,rootEquation,solutions};
 }catch{return null;}
}
export function verifySystemCertificate(c:SystemCertificate):boolean {
 try {
  const expected=exactTwoVariableSystem(c.equations);if(!expected)return false;
  const serialize=(value:unknown)=>JSON.stringify(value,(_,v)=>typeof v==='bigint'?v.toString():v);
  if(serialize(c)!==serialize(expected))return false;
  for(const [x,y] of c.solutions)for(const f of c.forms){const value=rootProduct(x,y);value.u=mul(value.u,f.xy);value.v=mul(value.v,f.xy);value.u=add(add(add(value.u,mul(x.u,f.x)),mul(y.u,f.y)),f.constant);value.v=add(add(value.v,mul(x.v,f.x)),mul(y.v,f.y));if(rootSign(value)!==0)return false;}
  return true;
 }catch{return false;}
}
export function systemLineParameters(form:SystemCertificate['forms'][number]):{x0:Fraction;xt:Fraction;y0:Fraction;yt:Fraction} {
 return form.x.n!==0n?{x0:div(neg(form.constant),form.x),xt:div(neg(form.y),form.x),y0:zero(),yt:one()}:{x0:zero(),xt:one(),y0:div(neg(form.constant),form.y),yt:zero()};
}
export function systemContradiction(c:SystemCertificate):{first:number;second:number;multiplier:Fraction;constant:Fraction}|null {
 const impossible=c.forms.findIndex(f=>f.x.n===0n&&f.y.n===0n&&f.constant.n!==0n);
 if(impossible>=0)return {first:impossible,second:impossible,multiplier:zero(),constant:c.forms[impossible]!.constant};
 const first=c.forms.findIndex(f=>f.x.n!==0n||f.y.n!==0n);if(first<0)return null;
 const second=1-first,a=c.forms[first]!,b=c.forms[second]!,multiplier=a.x.n!==0n?div(b.x,a.x):div(b.y,a.y),constant=add(b.constant,neg(mul(multiplier,a.constant)));
 return constant.n?{first,second,multiplier,constant}:null;
}
export function systemDependency(c:SystemCertificate):{pivot:number;factors:Fraction[]}|null {
 const pivot=c.forms.findIndex(f=>f.x.n!==0n||f.y.n!==0n);if(pivot<0)return null;
 const base=c.forms[pivot]!;return {pivot,factors:c.forms.map(f=>base.x.n!==0n?div(f.x,base.x):div(f.y,base.y))};
}
export function bilinearLatex(form:SystemCertificate['forms'][number],x:string,y:string):string {
 const terms:string[]=[];
 for(const [coefficient,symbol] of [[form.xy,`${x}${y}`],[form.x,x],[form.y,y],[form.constant,'']] as [Fraction,string][]){
  if(coefficient.n===0n)continue;const absolute=fraction(coefficient.n<0n?-coefficient.n:coefficient.n,coefficient.d),factor=symbol&&absolute.n===absolute.d?'':fractionLatex(absolute);
  terms.push(`${coefficient.n<0n?'-':terms.length?'+':''}${factor}${symbol}`);
 }return terms.join('')||'0';
}
export interface BiquadraticCertificate {
 original:string;variable:string;auxiliary:string;left:RationalFunction;right:RationalFunction;
 transformed:EquationCertificate;squares:ExactRoot[];solutions:{sign:-1|0|1;square:ExactRoot}[];
}
export function exactBiquadratic(original:string):BiquadraticCertificate|null {
 try {
  const relation=splitRelation(original);if(!relation||relation.rel!=='=')return null;
  const vars=new Set([...variablesOf(relation.sides[0]),...variablesOf(relation.sides[1])]);if(vars.size!==1)return null;
  const variable=[...vars][0]!,auxiliary=variable==='t'?'u':'t',left=compile(parseExpression(relation.sides[0]),variable),right=compile(parseExpression(relation.sides[1]),variable);
  const all=[left.n,left.d,right.n,right.d,...left.excluded,...right.excluded];
  if(all.some(p=>p.length>5||p.some((coefficient,i)=>i%2===1&&coefficient.n!==0n))||!all.some(p=>p.length===5))return null;
  const transform=(p:Polynomial)=>p.filter((_,i)=>i%2===0);
  const form=(p:RationalFunction)=>`(${polynomialLatex(transform(p.n),auxiliary)})/(${polynomialLatex(transform(p.d),auxiliary)})`;
  const excluded=[...left.excluded,...right.excluded];
  const identityFactors=excluded.map(p=>`*((${polynomialLatex(transform(p),auxiliary)})/(${polynomialLatex(transform(p),auxiliary)}))`).join('');
  const transformed=exactRationalEquation(`${form(left)}${identityFactors}=${form(right)}`);if(!transformed||transformed.identity)return null;
  const squares=transformed.solutions.filter(r=>rootSign(r)>=0),solutions=squares.flatMap<BiquadraticCertificate['solutions'][number]>(square=>rootSign(square)===0?[{sign:0 as const,square}]:[{sign:-1 as const,square},{sign:1 as const,square}]);
  return {original,variable,auxiliary,left,right,transformed,squares,solutions};
 }catch{return null;}
}
export function verifyBiquadraticCertificate(c:BiquadraticCertificate):boolean {
 try {
  const expected=exactBiquadratic(c.original);if(!expected)return false;
  const serialize=(value:unknown)=>JSON.stringify(value,(_,v)=>typeof v==='bigint'?v.toString():v);
  return serialize(c)===serialize(expected)&&verifyEquationCertificate(c.transformed);
 }catch{return false;}
}
export function biquadraticRootLatex(root:BiquadraticCertificate['solutions'][number]):string {
 if(root.sign===0)return '0';const square=root.square;
 if(square.v.n===0n){const n=squareRoot(square.u.n),d=squareRoot(square.u.d);if(n!==null&&d!==null)return fractionLatex(fraction(BigInt(root.sign)*n,d));}
 return `${root.sign<0?'-':''}\\sqrt{${rootLatex(square)}}`;
}

export function rootInInterval(root:ExactRoot,interval:RealInterval):boolean {
 return (!interval.lower||compareRoots(root,interval.lower)>0||interval.lowerClosed&&compareRoots(root,interval.lower)===0)&&(!interval.upper||compareRoots(root,interval.upper)<0||interval.upperClosed&&compareRoots(root,interval.upper)===0);
}
export interface TwoRadicalCertificate {
 original:string;variable:string;sign:1|-1;first:string;second:string;other:string;isolated:string;
 transformed:EquationCertificate;solutions:ExactRoot[];
}
export function exactTwoRadicals(original:string):TwoRadicalCertificate|null {
 try {
  const relation=splitRelation(original);if(!relation||relation.rel!=='=')return null;
  let left=parseExpression(relation.sides[0]),right=parseExpression(relation.sides[1]);
  const isPair=(n:typeof left)=>n.t==='bin'&&(n.op==='+'||n.op==='-')&&n.a.t==='call'&&n.a.fn==='sqrt'&&n.b.t==='call'&&n.b.fn==='sqrt';
  if(isPair(right))[left,right]=[right,left];if(!isPair(left)||left.t!=='bin'||left.a.t!=='call'||left.b.t!=='call')return null;
  const first=arithmeticSource(left.a.a),second=arithmeticSource(left.b.a),other=arithmeticSource(right),sign=left.op==='+'?1 as const:-1 as const,isolated=`((${other})^2-(${first})-(${second}))`;
  const transformed=exactRationalEquation(`(${isolated})^2=4*(${first})*(${second})`);if(!transformed||transformed.identity)return null;
  const variable=transformed.variable;
  const solutions=transformed.solutions.filter(root=>{
   const p=expressionValueAt(first,variable,root),q=expressionValueAt(second,variable,root),r=expressionValueAt(other,variable,root),t=expressionValueAt(isolated,variable,root);
   if(rootSign(p)<0||rootSign(q)<0)return false;
   if(sign===1)return rootSign(r)>=0&&rootSign(t)>=0;
   return rootSign(t)<=0&&compareRoots(p,q)===rootSign(r);
  });
  return {original,variable,sign,first,second,other,isolated,transformed,solutions};
 }catch{return null;}
}
export function verifyTwoRadicalCertificate(c:TwoRadicalCertificate):boolean {
 try {
  const expected=exactTwoRadicals(c.original);if(!expected)return false;
  const serialize=(value:unknown)=>JSON.stringify(value,(_,v)=>typeof v==='bigint'?v.toString():v);
  return serialize(c)===serialize(expected)&&verifyEquationCertificate(c.transformed);
 }catch{return false;}
}
export interface QuadraticRangeCertificate {
 original:string;variable:string;polynomial:Polynomial;lower:Fraction;upper:Fraction;
 vertex:Fraction|null;constant:Fraction|null;points:{x:Fraction;value:Fraction}[];
 minimum:Fraction;maximum:Fraction;minimizers:Fraction[];maximizers:Fraction[];allConstant:boolean;
}
/** Exact complete-square extremum on a closed rational interval, including linear and constant cases. */
export function exactQuadraticRange(original:string,lowerSource:string,upperSource:string):QuadraticRangeCertificate|null {
 try {
 const vars=variablesOf(original);if(vars.size!==1)return null;const variable=[...vars][0]!,compiled=compile(parseExpression(original),variable);
 if(compiled.d.length!==1||compiled.excluded.some(p=>p.length>1)||compiled.n.length>3)return null;
 const polynomial=compiled.n.map(c=>div(c,compiled.d[0]!));
 const endpoint=(s:string)=>{if(variablesOf(s).size)return null;const v=compile(parseExpression(s),variable);if(v.n.length!==1||v.d.length!==1)return null;return div(v.n[0]!,v.d[0]!);};
 const lower=endpoint(lowerSource),upper=endpoint(upperSource);if(!lower||!upper||add(upper,neg(lower)).n<0n)return null;
 const A=polynomial[2]??zero(),B=polynomial[1]??zero(),C=polynomial[0]!;
 const vertex=A.n?div(neg(B),mul(fraction(2n),A)):null,constant=vertex?add(C,neg(div(mul(B,B),mul(fraction(4n),A)))):null;
 const points=[lower,upper,...(vertex&&add(vertex,neg(lower)).n>=0n&&add(upper,neg(vertex)).n>=0n?[vertex]:[])].filter((p,i,all)=>all.findIndex(q=>equal(p,q))===i).map(x=>({x,value:polynomialValueAtFraction(polynomial,x)}));
 let minimum=points[0]!.value,maximum=minimum;for(const p of points){if(add(p.value,neg(minimum)).n<0n)minimum=p.value;if(add(p.value,neg(maximum)).n>0n)maximum=p.value;}
 return {original,variable,polynomial,lower,upper,vertex,constant,points,minimum,maximum,minimizers:points.filter(p=>equal(p.value,minimum)).map(p=>p.x),maximizers:points.filter(p=>equal(p.value,maximum)).map(p=>p.x),allConstant:A.n===0n&&B.n===0n};
 }catch{return null;}
}
export function verifyQuadraticRangeCertificate(c:QuadraticRangeCertificate):boolean {
 try{const e=exactQuadraticRange(c.original,fractionLatex(c.lower),fractionLatex(c.upper));return !!e&&JSON.stringify(c,(_,v)=>typeof v==='bigint'?v.toString():v)===JSON.stringify(e,(_,v)=>typeof v==='bigint'?v.toString():v);}catch{return false;}
}
export interface ConstantRadicalCertificate {original:string;value:ExactRoot;radicals:{argument:ExactRoot;result:ExactRoot}[];operations:{left:ExactRoot;right:ExactRoot;op:string;result:ExactRoot}[]}
/** Exact arithmetic in a single real quadratic field; unsupported field extensions are declined. */
export function exactConstantRadical(original:string):ConstantRadicalCertificate|null {
 try {
 if(variablesOf(original).size)return null;
 const radicals:ConstantRadicalCertificate['radicals']=[],operations:ConstantRadicalCertificate['operations']=[];
 const rational=(u:Fraction):ExactRoot=>({u,v:zero(),radicand:0n});
 const normalize=(r:ExactRoot):ExactRoot=>{
  if(r.v.n===0n||r.radicand===0n)return rational(r.u);
  let d=r.radicand,factor=1n;for(let p=2n;p<=1000n&&p*p<=d;p++)while(d%(p*p)===0n){d/=p*p;factor*=p;}
  const perfect=squareRoot(d);if(perfect!==null)return rational(add(r.u,mul(r.v,fraction(factor*perfect))));
  return {...r,v:mul(r.v,fraction(factor)),radicand:d};
 };
 const align=(a:ExactRoot,b:ExactRoot):[ExactRoot,ExactRoot]=>{
  if(a.v.n===0n)return [{...a,radicand:b.radicand},b];if(b.v.n===0n)return [a,{...b,radicand:a.radicand}];if(a.radicand!==b.radicand)throw Error('different quadratic fields');return [a,b];
 };
 const rootOfRational=(u:Fraction):Fraction|null=>{const n=squareRoot(u.n),d=squareRoot(u.d);return n===null||d===null?null:fraction(n,d);};
 const squareRootOf=(a:ExactRoot):ExactRoot=>{
  if(rootSign(a)<0)throw Error('nonreal radical');
  if(a.v.n===0n){const perfect=rootOfRational(a.u);return perfect?rational(perfect):normalize({u:zero(),v:fraction(1n,a.u.d),radicand:a.u.n*a.u.d});}
  const norm=add(mul(a.u,a.u),neg(mul(mul(a.v,a.v),fraction(a.radicand)))),normRoot=rootOfRational(norm);if(!normRoot)throw Error('higher field degree');
  for(const sign of [1n,-1n]){
   const coefficient=rootOfRational(div(add(a.u,mul(fraction(sign),normRoot)),fraction(2n)));if(!coefficient||coefficient.n===0n)continue;
   for(const coefficientSign of [1n,-1n]){
    const signed=mul(coefficient,fraction(coefficientSign)),result={u:signed,v:div(a.v,mul(fraction(2n),signed)),radicand:a.radicand};
    const squared=rootProduct(result,result);if(equal(squared.u,a.u)&&equal(squared.v,a.v)&&rootSign(result)>=0)return result;
   }
  }throw Error('no square root in quadratic field');
 };
 const evaluate=(node:ReturnType<typeof parseExpression>):ExactRoot=>{
  if(node.t==='num'){if(!Number.isSafeInteger(node.v))throw Error('integer literals only');return rational(fraction(BigInt(node.v)));}
  if(node.t==='neg'){const a=evaluate(node.a);return {...a,u:neg(a.u),v:neg(a.v)};}
  if(node.t==='call'&&node.fn==='sqrt'){const argument=evaluate(node.a),result=squareRootOf(argument);radicals.push({argument,result});if(radicals.length>10)throw Error('radical count bound');return result;}
  if(node.t!=='bin')throw Error('constant arithmetic only');
  if(node.op==='^'){if(node.b.t!=='num'||!Number.isInteger(node.b.v)||node.b.v<1||node.b.v>6)throw Error('bounded powers only');const a=evaluate(node.a);let r=rational(one());for(let i=0;i<node.b.v;i++){const [x,y]=align(r,a);r=normalize(rootProduct(x,y));}return r;}
  const [a,b]=align(evaluate(node.a),evaluate(node.b));
  let result:ExactRoot;
  if(node.op==='+'||node.op==='-')result=normalize({u:add(a.u,node.op==='+'?b.u:neg(b.u)),v:add(a.v,node.op==='+'?b.v:neg(b.v)),radicand:a.radicand});
  else if(node.op==='*')result=normalize(rootProduct(a,b));
  else if(node.op==='/'){if(rootSign(b)===0)throw Error('zero divisor');const norm=add(mul(b.u,b.u),neg(mul(mul(b.v,b.v),fraction(b.radicand)))),numerator=rootProduct(a,{...b,v:neg(b.v)});result=normalize({...numerator,u:div(numerator.u,norm),v:div(numerator.v,norm)});}
  else throw Error('unsupported arithmetic');
  if(a.v.n||b.v.n)operations.push({left:a,right:b,op:node.op,result});if(operations.length>12)throw Error('operation count bound');return result;
 };
 const value=evaluate(parseExpression(original));if(!radicals.length)return null;return {original,value,radicals,operations};
 }catch{return null;}
}
export function verifyConstantRadicalCertificate(c:ConstantRadicalCertificate):boolean {
 try{const expected=exactConstantRadical(c.original);return !!expected&&JSON.stringify(c,(_,v)=>typeof v==='bigint'?v.toString():v)===JSON.stringify(expected,(_,v)=>typeof v==='bigint'?v.toString():v);}catch{return false;}
}
export function intersectRealIntervals(left:RealInterval[],right:RealInterval[]):RealInterval[] {
 const result:RealInterval[]=[];
 for(const a of left)for(const b of right){
  let lower=a.lower,lowerClosed=a.lowerClosed,upper=a.upper,upperClosed=a.upperClosed;
  if(b.lower&&(!lower||compareRoots(b.lower,lower)>0)){lower=b.lower;lowerClosed=b.lowerClosed;}
  else if(lower&&b.lower&&compareRoots(lower,b.lower)===0)lowerClosed=lowerClosed&&b.lowerClosed;
  if(b.upper&&(!upper||compareRoots(b.upper,upper)<0)){upper=b.upper;upperClosed=b.upperClosed;}
  else if(upper&&b.upper&&compareRoots(upper,b.upper)===0)upperClosed=upperClosed&&b.upperClosed;
  if(!lower||!upper||compareRoots(lower,upper)<0||compareRoots(lower,upper)===0&&lowerClosed&&upperClosed)result.push({lower,upper,lowerClosed,upperClosed});
 }return result;
}
export interface PositiveParameterCertificate {base:ParameterDiscriminantCertificate;conditions:InequalityCertificate[];intervals:RealInterval[]}
export function exactPositiveParameters(original:string,parameter:string):PositiveParameterCertificate|null {
 try {
 const base=parameterDiscriminant(original,parameter);if(!base)return null;
 const a=fractionLatex(base.a),conditions=[`${polynomialLatex(base.discriminant,parameter)}>0`,`-(${polynomialLatex(base.b,parameter)})/(${a})>0`,`(${polynomialLatex(base.c,parameter)})/(${a})>0`].map(s=>exactRationalInequality(`${s}+0*${parameter}`));
 if(conditions.some(c=>c===null))return null;const checked=conditions as InequalityCertificate[];
 const intervals=checked.reduce((set,c)=>intersectRealIntervals(set,c.intervals),[{lower:null,upper:null,lowerClosed:false,upperClosed:false}] as RealInterval[]);
 return {base,conditions:checked,intervals};
 }catch{return null;}
}
export function verifyPositiveParameterCertificate(c:PositiveParameterCertificate):boolean {
 try{const expected=exactPositiveParameters(c.base.original,c.base.parameter);return !!expected&&JSON.stringify(c,(_,v)=>typeof v==='bigint'?v.toString():v)===JSON.stringify(expected,(_,v)=>typeof v==='bigint'?v.toString():v);}catch{return false;}
}
export interface RemainderParameterCertificate {original:string;variable:string;parameter:string;divisor:string;root:Fraction;substitution:string;equation:EquationCertificate}
export function exactRemainderParameter(original:string,variable:string,parameter:string,divisor:string):RemainderParameterCertificate|null {
 try {
 if(variable===parameter||[...variablesOf(original)].some(v=>v!==variable&&v!==parameter))return null;
 const node=parseExpression(original);if(polynomialDegree(node,variable)>6)return null;
 const divisorEquation=exactRationalEquation(`(${divisor})=0`);if(!divisorEquation||divisorEquation.variable!==variable||divisorEquation.coefficients.length!==2||divisorEquation.excluded.some(p=>p.length>1))return null;
 const root=divisorEquation.solutions[0]!.u,rootNode=parseExpression(fractionLatex(root));
 const substitute=(n:typeof node):typeof node=>n.t==='var'&&n.name===variable?rootNode:n.t==='neg'?{...n,a:substitute(n.a)}:n.t==='bin'?{...n,a:substitute(n.a),b:substitute(n.b)}:n;
 const substitution=arithmeticSource(substitute(node)),equation=exactRationalEquation(`(${substitution})+0*${parameter}=0`);
 if(!equation||equation.excluded.some(p=>p.length>1)||equation.variable!==parameter||!verifyEquationCertificate(equation))return null;
 return {original,variable,parameter,divisor,root,substitution,equation};
 }catch{return null;}
}
export function verifyRemainderParameterCertificate(c:RemainderParameterCertificate):boolean {
 try{const expected=exactRemainderParameter(c.original,c.variable,c.parameter,c.divisor);return !!expected&&JSON.stringify(c,(_,v)=>typeof v==='bigint'?v.toString():v)===JSON.stringify(expected,(_,v)=>typeof v==='bigint'?v.toString():v);}catch{return false;}
}
export interface SymmetricSystemCertificate {
 equations:string[];variables:[string,string];sumIndex:number;sum:Fraction;
 quadratic:{square:Fraction;product:Fraction;linear:Fraction;constant:Fraction};
 reducedProduct:Fraction;reducedConstant:Fraction;converted:SystemCertificate;
}
export function exactSymmetricSystem(equations:string[]):SymmetricSystemCertificate|null {
 try {
 if(equations.length!==2)return null;const vars=[...new Set(equations.flatMap(e=>[...variablesOf(e)]))].sort();if(vars.length!==2)return null;
 const variables=vars as [string,string],[x,y]=variables;
 let sumIndex=-1,S:Fraction|null=null;
 equations.forEach((e,i)=>{try{const f=bilinearForm(e,x,y);if(f.xy.n===0n&&f.x.n!==0n&&equal(f.x,f.y)){sumIndex=i;S=div(neg(f.constant),f.x);}}catch{}});
 if(sumIndex<0||S===null)return null;const s=S as Fraction,relation=splitRelation(equations[1-sumIndex]!);if(!relation||relation.rel!=='=')return null;
 const left=parseExpression(relation.sides[0]),right=parseExpression(relation.sides[1]);
 const degree=(n:typeof left):number=>{
  if(n.t==='num')return 0;if(n.t==='var')return 1;if(n.t==='neg')return degree(n.a);if(n.t!=='bin')throw Error('polynomial only');
  if(n.op==='+'||n.op==='-')return Math.max(degree(n.a),degree(n.b));if(n.op==='*')return degree(n.a)+degree(n.b);
  if(n.op==='^'&&n.b.t==='num'&&Number.isInteger(n.b.v)&&n.b.v>=1&&n.b.v<=2)return degree(n.a)*n.b.v;
  if(n.op==='/'&&variablesOf(arithmeticSource(n.b)).size===0)return degree(n.a);throw Error('quadratic polynomial only');
 };
 if(Math.max(degree(left),degree(right))>2)return null;
 const substitute=(n:typeof left,a:number,b:number):typeof left=>n.t==='var'?{t:'num',v:n.name===x?a:b}:n.t==='neg'?{...n,a:substitute(n.a,a,b)}:n.t==='bin'?{...n,a:substitute(n.a,a,b),b:substitute(n.b,a,b)}:n;
 const at=(a:number,b:number)=>{const l=compile(substitute(left,a,b),'t'),r=compile(substitute(right,a,b),'t');if(l.n.length!==1||r.n.length!==1||l.d.length!==1||r.d.length!==1)throw Error('constant expected');return add(div(l.n[0]!,l.d[0]!),neg(div(r.n[0]!,r.d[0]!)));};
 // Structural total degree<=2 makes these exact coefficient identities, not numerical evidence of symmetry.
 const C=at(0,0),lx=div(add(at(1,0),neg(at(-1,0))),fraction(2n)),ly=div(add(at(0,1),neg(at(0,-1))),fraction(2n));
 const qx=div(add(add(at(1,0),at(-1,0)),neg(mul(fraction(2n),C))),fraction(2n)),qy=div(add(add(at(0,1),at(0,-1)),neg(mul(fraction(2n),C))),fraction(2n));
 if(!equal(qx,qy)||!equal(lx,ly)||qx.n===0n)return null;
 const xy=add(at(1,1),neg(add(add(add(add(C,lx),ly),qx),qy))),quadratic={square:qx,product:xy,linear:lx,constant:C};
 const reducedProduct=add(xy,neg(mul(fraction(2n),qx))),reducedConstant=add(add(mul(qx,mul(s,s)),mul(lx,s)),C);
 const converted=exactTwoVariableSystem([`${x}+${y}=(${fractionLatex(s)})`,`(${fractionLatex(reducedProduct)})*${x}*${y}+(${fractionLatex(reducedConstant)})=0`]);if(!converted||!verifySystemCertificate(converted))return null;
 return {equations,variables,sumIndex,sum:s,quadratic,reducedProduct,reducedConstant,converted};
 }catch{return null;}
}
export function verifySymmetricSystemCertificate(c:SymmetricSystemCertificate):boolean {
 try{const expected=exactSymmetricSystem(c.equations);return !!expected&&JSON.stringify(c,(_,v)=>typeof v==='bigint'?v.toString():v)===JSON.stringify(expected,(_,v)=>typeof v==='bigint'?v.toString():v)&&verifySystemCertificate(c.converted);}catch{return false;}
}
export interface RootRadicalProductCertificate {base:ParameterDiscriminantCertificate;target:string;rootNames:[string,string];constant:Fraction;sumZero:EquationCertificate}
/** Forκ>0, (u+√(u²+κ))(v+√(v²+κ))=κ iff u+v=0. */
export function exactRootRadicalProduct(original:string,parameter:string,target:string):RootRadicalProductCertificate|null {
 try {
 const base=parameterDiscriminant(original,parameter);if(!base||!base.universallyDistinct)return null;
 const relation=splitRelation(target);if(!relation||relation.rel!=='=')return null;
 const rhs=compile(parseExpression(relation.sides[1]),'t');if(rhs.n.length!==1||rhs.d.length!==1||variablesOf(relation.sides[1]).size)return null;
 const constant=div(rhs.n[0]!,rhs.d[0]!);if(constant.n<=0n)return null;
 const node=parseExpression(relation.sides[0]);if(node.t!=='bin'||node.op!=='*')return null;
 const names=[node.a,node.b].map(part=>{
  if(part.t!=='bin'||part.op!=='+'||part.a.t!=='var'||part.b.t!=='call'||part.b.fn!=='sqrt')throw Error('root plus square root required');
  const name=part.a.name,radicand=compile(part.b.a,name);if(radicand.d.length!==1||radicand.excluded.some(p=>p.length>1)||radicand.n.length!==3)throw Error('quadratic radicand required');
  const coefficients=radicand.n.map(c=>div(c,radicand.d[0]!));if(!equal(coefficients[0]!,constant)||coefficients[1]!.n!==0n||!equal(coefficients[2]!,one()))throw Error('wrong radicand');return name;
 });
 if(names[0]===names[1]||names.some(name=>name===base.variable||name===parameter))return null;
 const sumZero=exactRationalEquation(`(${polynomialLatex(base.b,parameter)})+0*${parameter}=0`);if(!sumZero||!verifyEquationCertificate(sumZero))return null;
 return {base,target,rootNames:names as [string,string],constant,sumZero};
 }catch{return null;}
}
export function verifyRootRadicalProductCertificate(c:RootRadicalProductCertificate):boolean {
 try{const expected=exactRootRadicalProduct(c.base.original,c.base.parameter,c.target);return !!expected&&JSON.stringify(c,(_,v)=>typeof v==='bigint'?v.toString():v)===JSON.stringify(expected,(_,v)=>typeof v==='bigint'?v.toString():v);}catch{return false;}
}
export interface RootFourthPowerCertificate {base:ParameterDiscriminantCertificate;target:string;rootNames:[string,string];threshold:Fraction;sum:Polynomial;product:Polynomial;power:Polynomial;shift:Fraction;depressed:Polynomial;quadraticCenter:Fraction|null;lowerBound:Fraction}
export function exactRootFourthPower(original:string,parameter:string,target:string):RootFourthPowerCertificate|null {
 try {
 const base=parameterDiscriminant(original,parameter);if(!base||!base.universallyDistinct)return null;const rel=splitRelation(target);if(!rel||rel.rel!=='>')return null;
 const node=parseExpression(rel.sides[0]);if(node.t!=='bin'||node.op!=='+')return null;
 const names=[node.a,node.b].map(n=>{if(n.t!=='bin'||n.op!=='^'||n.a.t!=='var'||n.b.t!=='num'||n.b.v!==4)throw Error('fourth powers required');return n.a.name;});if(names[0]===names[1])return null;
 const rhs=compile(parseExpression(rel.sides[1]),'t');if(rhs.n.length!==1||rhs.d.length!==1||variablesOf(rel.sides[1]).size)return null;const threshold=div(rhs.n[0]!,rhs.d[0]!);
 const S=base.b.map(c=>neg(div(c,base.a))),P=base.c.map(c=>div(c,base.a)),S2=product(S,S);
 const power=sum(sum(product(S2,S2),product(P,S2).map(c=>mul(fraction(-4n),c))),product(P,P).map(c=>mul(fraction(2n),c)));
 if(power.length>5||power.length===4)return null;const A=power[4]??zero();if(A.n<0n)return null;
 const shift=A.n?div(neg(power[3]??zero()),mul(fraction(4n),A)):zero();
 const shifted:Polynomial=Array.from({length:power.length},zero);let monomial:Polynomial=[one()];
 for(const coefficient of power){const term=monomial.map(c=>mul(c,coefficient));for(let i=0;i<term.length;i++)shifted[i]=add(shifted[i]!,term[i]!);monomial=product(monomial,[shift,one()]);}
 const depressed=trim(shifted);if((depressed[3]?.n??0n)!==0n)return null;
 const B=depressed[2]??zero(),C=depressed[1]??zero(),D=depressed[0]!;if(B.n<0n||B.n===0n&&C.n!==0n)return null;
 const quadraticCenter=B.n?div(neg(C),mul(fraction(2n),B)):null,lowerBound=B.n?add(D,neg(div(mul(C,C),mul(fraction(4n),B)))):D;
 if(add(lowerBound,neg(threshold)).n<=0n)return null;
 return {base,target,rootNames:names as [string,string],threshold,sum:S,product:P,power,shift,depressed,quadraticCenter,lowerBound};
 }catch{return null;}
}
export function verifyRootFourthPowerCertificate(c:RootFourthPowerCertificate):boolean {
 try{const expected=exactRootFourthPower(c.base.original,c.base.parameter,c.target);return !!expected&&JSON.stringify(c,(_,v)=>typeof v==='bigint'?v.toString():v)===JSON.stringify(expected,(_,v)=>typeof v==='bigint'?v.toString():v);}catch{return false;}
}
