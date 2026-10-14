import {parseExpression,variablesOf} from './expr';
import {fraction,type Fraction} from './rationalPolynomial';
type Polynomial=Map<string,Fraction>;
interface Form {n:Polynomial;d:Polynomial;excluded:Polynomial[]}
export interface ArithmeticIdentityCertificate {left:string;right:string;variables:string[];denominators:string[];valid:boolean}
const plus=(a:Fraction,b:Fraction)=>fraction(a.n*b.d+b.n*a.d,a.d*b.d);
const times=(a:Fraction,b:Fraction)=>fraction(a.n*b.n,a.d*b.d);
/** Bounded exact multivariate polynomial arithmetic; only proves identity where original denominators are nonzero. */
export function exactArithmeticIdentity(left:string,right:string):ArithmeticIdentityCertificate|null {
 try {
 const variables=[...new Set([...variablesOf(left),...variablesOf(right)])].sort();if(variables.length>4)return null;
 const key=(powers:number[])=>powers.join(','),unit=key(variables.map(()=>0));
 const constant=(n:bigint):Polynomial=>n===0n?new Map():new Map([[unit,fraction(n)]]);
 const sum=(a:Polynomial,b:Polynomial,sign=1n):Polynomial=>{
  const p=new Map(a);for(const [k,c] of b){const value=plus(p.get(k)??fraction(0n),times(c,fraction(sign)));if(value.n===0n)p.delete(k);else p.set(k,value);}if(p.size>256)throw Error('term bound');return p;
 };
 const product=(a:Polynomial,b:Polynomial):Polynomial=>{
  let p:Polynomial=new Map();for(const [ka,ca] of a)for(const [kb,cb] of b){const powers=variables.length?ka.split(',').map(Number).map((n,i)=>n+Number(kb.split(',')[i])):[];if(powers.reduce((a,b)=>a+b,0)>20)throw Error('degree bound');p=sum(p,new Map([[key(powers),times(ca,cb)]]));}return p;
 };
 const compile=(node:ReturnType<typeof parseExpression>):Form=>{
  if(node.t==='num'){if(!Number.isSafeInteger(node.v))throw Error('integer only');return {n:constant(BigInt(node.v)),d:constant(1n),excluded:[]};}
  if(node.t==='var'){const powers=variables.map(v=>v===node.name?1:0);return {n:new Map([[key(powers),fraction(1n)]]),d:constant(1n),excluded:[]};}
  if(node.t==='neg'){const a=compile(node.a);return {...a,n:sum(new Map(),a.n,-1n)};}
  if(node.t!=='bin')throw Error('rational arithmetic only');
  if(node.op==='^'){
   if(node.b.t!=='num'||!Number.isInteger(node.b.v)||node.b.v<0||node.b.v>6)throw Error('power bound');const a=compile(node.a);if(node.b.v===0&&!a.n.size)throw Error('zero power');let n=constant(1n),d=constant(1n);for(let i=0;i<node.b.v;i++){n=product(n,a.n);d=product(d,a.d);}return {n,d,excluded:node.b.v===0?[...a.excluded,a.n]:a.excluded};
  }
  const a=compile(node.a),b=compile(node.b),excluded=[...a.excluded,...b.excluded];
  if(node.op==='+'||node.op==='-')return {n:sum(product(a.n,b.d),product(b.n,a.d),node.op==='+'?1n:-1n),d:product(a.d,b.d),excluded};
  if(node.op==='*')return {n:product(a.n,b.n),d:product(a.d,b.d),excluded};
  if(node.op==='/'){if(!b.n.size)throw Error('identically undefined denominator');return {n:product(a.n,b.d),d:product(a.d,b.n),excluded:[...excluded,b.n]};}throw Error('unsupported op');
 };
 const a=compile(parseExpression(left)),b=compile(parseExpression(right));
 const serialized=(p:Polynomial)=>[...p.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([k,c])=>`${k}:${c.n}/${c.d}`).join(';');
 return {left,right,variables,denominators:[...new Set([...a.excluded,...b.excluded].map(serialized))],valid:sum(product(a.n,b.d),product(b.n,a.d),-1n).size===0};
 }catch{return null;}
}
export function verifyArithmeticIdentity(c:ArithmeticIdentityCertificate):boolean {
 try{const expected=exactArithmeticIdentity(c.left,c.right);return c.valid&&!!expected&&JSON.stringify(c)===JSON.stringify(expected);}catch{return false;}
}
