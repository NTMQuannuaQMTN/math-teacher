import {parseMathText} from '../../shared/src/mathText';
import {evalExpression} from '../../shared/src/expr';
import {exactArithmeticIdentity} from '../../shared/src/polynomialIdentity';
export interface LinearIntegerTask {text:string;variables:[string,string];a:number;b:number;c:number;domain:'integer'|'positive';left:string;right:string}
/** Infer coefficients only to propose an identity, then certify it symbolically.
 * Evaluating a few points alone can never establish linearity. */
export function linearIntegerTask(text:string):LinearIntegerTask|null {
 const maths:string[]=[];if(text.includes('§'))return null;
 const template=parseMathText(text.trim()).map(s=>s.kind==='math'?`§${maths.push(s.value)-1}§`:s.value).join('').replace(/\s+/g,' ').trim();
 const command=/^Tìm (?:tất cả )?(?:các )?cặp số nguyên( dương)? §0§ thỏa mãn §1§\.?$/iu.exec(template);
 if(!command||maths.length!==2)return null;
 const vars=/^\(?\s*([a-z])\s*,\s*([a-z])\s*\)?$/u.exec(maths[0]!);if(!vars||vars[1]===vars[2])return null;
 const variables:[string,string]=[vars[1]!,vars[2]!],[x,y]=variables,sides=maths[1]!.split('=');if(sides.length!==2)return null;
 const [left,right]=sides as [string,string],difference=`(${left})-(${right})`;
 try{
  const c=-evalExpression(difference,{[x]:0,[y]:0}),a=evalExpression(difference,{[x]:1,[y]:0})+c,b=evalExpression(difference,{[x]:0,[y]:1})+c;
  if(![a,b,c].every(Number.isSafeInteger)||Math.abs(a)>10000||Math.abs(b)>10000||Math.abs(c)>1e6)return null;
  const id=exactArithmeticIdentity(difference,`${a}*${x}+${b}*${y}-(${c})`);if(!id?.valid||id.denominators.length)return null;
  return {text,variables,a,b,c,domain:command[1]?'positive':'integer',left,right};
 }catch{return null;}
}
