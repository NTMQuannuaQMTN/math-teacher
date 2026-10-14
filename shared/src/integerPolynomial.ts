import {parseExpression,variablesOf} from './expr';

export interface IntegerPolynomial {expression:string;variable:string;coefficients:bigint[]}
export interface ResidueCertificate extends IntegerPolynomial {modulus:number;remainders:number[];zeros:number[]}
const LIMIT=10n**30n;
const bounded=(x:bigint)=>{if(x>LIMIT||x< -LIMIT)throw Error('coefficient bound');return x;};
const trim=(p:bigint[])=>{while(p.length>1&&p.at(-1)===0n)p.pop();return p;};
const add=(a:bigint[],b:bigint[],sign=1n)=>trim(Array.from({length:Math.max(a.length,b.length)},(_,i)=>bounded((a[i]??0n)+sign*(b[i]??0n))));
const multiply=(a:bigint[],b:bigint[])=>{
 if(a.length+b.length>14)throw Error('degree bound');
 const p=Array<bigint>(a.length+b.length-1).fill(0n);
 for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)p[i+j]=bounded(p[i+j]!+a[i]!*b[j]!);
 return trim(p);
};
/** Structural conversion proves integral coefficients. Rational functions, fractional literals,
 * variable exponents and zero powers are declined; samples never establish polynomiality. */
export function integerPolynomial(expression:string,variable?:string):IntegerPolynomial|null {
 try {
  if(expression.length>500)return null;
  const vars=[...variablesOf(expression)];if(vars.length!==1||variable&&vars[0]!==variable)return null;
  const name=vars[0]!;
  const compile=(node:ReturnType<typeof parseExpression>):bigint[]=>{
   if(node.t==='num'){if(!Number.isSafeInteger(node.v))throw Error('integer literal required');return [bounded(BigInt(node.v))];}
   if(node.t==='var'){if(node.name!==name)throw Error('unexpected variable');return [0n,1n];}
   if(node.t==='neg')return compile(node.a).map(n=>-n);
   if(node.t!=='bin')throw Error('integer polynomial operations only');
   if(node.op==='^'){
    if(node.b.t!=='num'||!Number.isInteger(node.b.v)||node.b.v<1||node.b.v>12)throw Error('power bound');
    const a=compile(node.a);let p=[1n];for(let i=0;i<node.b.v;i++)p=multiply(p,a);return p;
   }
   const a=compile(node.a),b=compile(node.b);
   if(node.op==='+')return add(a,b);if(node.op==='-')return add(a,b,-1n);if(node.op==='*')return multiply(a,b);
   throw Error('division and remainder are not polynomial operations');
  };
  return {expression,variable:name,coefficients:compile(parseExpression(expression))};
 }catch{return null;}
}
export function integerPolynomialValue(p:IntegerPolynomial,n:bigint):bigint {
 let v=0n;for(let i=p.coefficients.length-1;i>=0;i--)v=v*n+p.coefficients[i]!;return v;
}
const mod=(x:bigint,m:bigint)=>(x%m+m)%m;
export function residueCertificate(expression:string,modulus:number,variable?:string):ResidueCertificate|null {
 if(!Number.isSafeInteger(modulus)||modulus<2||modulus>720)return null;
 const p=integerPolynomial(expression,variable);if(!p)return null;
 const remainders=Array.from({length:modulus},(_,r)=>Number(mod(integerPolynomialValue(p,BigInt(r)),BigInt(modulus))));
 return {...p,modulus,remainders,zeros:remainders.flatMap((v,r)=>v===0?[r]:[])};
}
/** Independent AST modular evaluator, not Horner/coefficient evaluation. Every allowed operation
 * preserves congruence, so the finite table covers ALL integers, including negative inputs. */
export function verifyResidueCertificate(c:ResidueCertificate):boolean {
 try {
  if(!Number.isSafeInteger(c.modulus)||c.modulus<2||c.modulus>720)return false;
  const p=integerPolynomial(c.expression,c.variable);
  if(!p||p.coefficients.join(',')!==c.coefficients.join(',')||c.remainders.length!==c.modulus)return false;
  const m=BigInt(c.modulus),ast=parseExpression(c.expression);
  const value=(node:typeof ast,r:bigint):bigint=>{
   if(node.t==='num')return mod(BigInt(node.v),m);
   if(node.t==='var'){if(node.name!==c.variable)throw Error('variable mismatch');return r;}
   if(node.t==='neg')return mod(-value(node.a,r),m);
   if(node.t!=='bin')throw Error('unsupported operation');
   const a=value(node.a,r);
   if(node.op==='^'){if(node.b.t!=='num')throw Error('power');return mod(a**BigInt(node.b.v),m);}
   const b=value(node.b,r);if(node.op==='+')return mod(a+b,m);if(node.op==='-')return mod(a-b,m);if(node.op==='*')return mod(a*b,m);
   throw Error('unsupported operation');
  };
  const zeros:number[]=[];
  for(let r=0;r<c.modulus;r++){const v=Number(value(ast,BigInt(r)));if(c.remainders[r]!==v)return false;if(!v)zeros.push(r);}
  return zeros.join(',')===c.zeros.join(',');
 }catch{return false;}
}
