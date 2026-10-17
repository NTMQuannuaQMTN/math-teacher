import {parseMathText} from '../../../shared/src/mathText';
import {integerPolynomial,integerPolynomialValue,residueCertificate,verifyResidueCertificate,type IntegerPolynomial,type ResidueCertificate} from '../../../shared/src/integerPolynomial';
import {polynomialLatex,fraction} from '../../../shared/src/rationalPolynomial';
import {exactArithmeticIdentity} from '../../../shared/src/polynomialIdentity';
import {algebraProofLesson,type AlgebraDeduction} from './algebraProofLesson';
interface Task {text:string;variable:string;name:string;expression:string;domain:'positive'|'natural'|'integer';targets:number[]}
interface Part {target:number;factor:number;reducedModulus:number;quotient:string;tables:ResidueCertificate[];zeros:number[];period:number;residues:number[]}
export interface PolynomialDivisibilityCertificate {task:Task;polynomial:IntegerPolynomial;parts:Part[]}
const gcd=(a:bigint,b:bigint):bigint=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b){const r=a%b;a=b;b=r;}return a;};
function task(text:string):Task|null {
 const maths:string[]=[];if(text.includes('§'))return null;
 const template=parseMathText(text.trim()).map(s=>s.kind==='math'?`§${maths.push(s.value)-1}§`:s.value).join('').replace(/\s+/g,' ').trim();
 const m=/^(?:Câu \d+\. )?Với mỗi số (nguyên dương|nguyên|tự nhiên) §0§, đặt §1§\. a\) Chứng minh §2§ chia hết cho §3§ với mọi §4§\. b\) Tìm §5§ để §6§ chia hết cho §7§\. c\) Tìm §8§ để §9§ chia hết cho §10§\.?$/iu.exec(template);
 if(!m||maths.length!==11)return null;
 const variable=maths[0]!.trim();if(!/^[a-z]$/u.test(variable)||[4,5,8].some(i=>maths[i]!.trim()!==variable))return null;
 const def=new RegExp(`^([A-Za-z])\\(${variable}\\)=([\\s\\S]+)$`).exec(maths[1]!.replace(/\s/g,''));if(!def||[2,6,9].some(i=>maths[i]!.replace(/\s/g,'')!==`${def[1]}(${variable})`))return null;
 const targets:number[]=[];for(const i of [3,7,10]){const value=/^(\d+)(?:\^\{?([1-3])\}?)?$/u.exec(maths[i]!.replace(/\s/g,''));if(!value)return null;const target=Number(value[1])**Number(value[2]??1);if(!Number.isSafeInteger(target)||target<2||target>1e6)return null;targets.push(target);}
 return {text,variable,name:def[1]!,expression:def[2]!,domain:m[1]!.toLowerCase()==='nguyên dương'?'positive':m[1]!.toLowerCase()==='tự nhiên'?'natural':'integer',targets};
}
function primePowers(n:number):number[]{const result:number[]=[];for(let p=2;p*p<=n;p++)if(n%p===0){let power=1;while(n%p===0){power*=p;n/=p;}result.push(power);}if(n>1)result.push(n);return result;}
export function polynomialDivisibilityCertificate(text:string):PolynomialDivisibilityCertificate|null {
 const t=task(text),p=t&&integerPolynomial(t.expression,t.variable);if(!t||!p)return null;
 const content=p.coefficients.reduce((a,b)=>gcd(a,b),0n),parts:Part[]=[];
 for(const target of t.targets){
  const factor=Number(gcd(content,BigInt(target))),reducedModulus=target/factor;if(reducedModulus>720)return null;
  const quotient=polynomialLatex(p.coefficients.map(n=>fraction(n/BigInt(factor))),t.variable),powers=primePowers(reducedModulus);if(powers.some(v=>v>60))return null;
  const tables=powers.map(m=>residueCertificate(quotient,m,t.variable));if(tables.some(c=>!c))return null;
  const zeros=Array.from({length:reducedModulus},(_,r)=>r).filter(r=>(tables as ResidueCertificate[]).every(c=>c.remainders[r%c.modulus]===0));
  let period=reducedModulus;for(let d=1;d<=reducedModulus;d++)if(reducedModulus%d===0&&Array.from({length:reducedModulus},(_,r)=>zeros.includes(r)===zeros.includes(r%d)).every(Boolean)){period=d;break;}
  parts.push({target,factor,reducedModulus,quotient,tables:tables as ResidueCertificate[],zeros,period,residues:zeros.filter(r=>r<period)});
 }
 return {task:t,polynomial:p,parts};
}
export function verifyPolynomialDivisibilityCertificate(c:PolynomialDivisibilityCertificate):boolean {
 try{
  const t=task(c.task.text),p=t&&integerPolynomial(t.expression,t.variable);if(!t||!p||JSON.stringify(t)!==JSON.stringify(c.task)||c.polynomial.expression!==p.expression||c.polynomial.variable!==p.variable||c.polynomial.coefficients.join(',')!==p.coefficients.join(',')||c.parts.length!==3)return false;
  for(let i=0;i<3;i++){
   const part=c.parts[i]!;if(part.target!==t.targets[i]||!Number.isInteger(part.factor)||part.factor<1||part.target%part.factor||part.reducedModulus!==part.target/part.factor||part.reducedModulus>720)return false;
   const identity=exactArithmeticIdentity(p.expression,`${part.factor}*(${part.quotient})`);if(!identity?.valid||identity.denominators.length)return false;
   if(primePowers(part.reducedModulus).join(',')!==part.tables.map(t=>t.modulus).join(','))return false;
   if(part.tables.some(q=>q.expression!==part.quotient||q.variable!==t.variable||!verifyResidueCertificate(q)))return false;
   const zeros:number[]=[];for(let r=0;r<part.reducedModulus;r++)if(integerPolynomialValue(p,BigInt(r))%BigInt(part.target)===0n)zeros.push(r);
   if(zeros.join(',')!==part.zeros.join(',')||!Number.isInteger(part.period)||part.period<1||part.reducedModulus%part.period||part.residues.join(',')!==zeros.filter(r=>r<part.period).join(','))return false;
   if(Array.from({length:part.reducedModulus},(_,r)=>zeros.includes(r)===part.residues.includes(r%part.period)).some(v=>!v))return false;
  }
  return true;
 }catch{return false;}
}
/** "X^{2h} - Y^{2h}" (h = 1 or 2) → A = X^h, B = Y^h and the factored product with common factors taken out. */
function differenceOfSquares(expression:string,v:string):{a:string;b:string;k:bigint;factors:string;F:IntegerPolynomial;product:string}|null {
 const e=expression.replace(/\s+/g,'');
 const m=/^(\([^()]+\)|[a-z0-9]+)\^\{?(2|4)\}?-(\([^()]+\)|[a-z0-9]+)\^\{?(2|4)\}?$/u.exec(e);
 if(!m||m[2]!==m[4])return null;
 const h=Number(m[2])/2,pow=(x:string)=>h===1?x:`${x}^{2}`,A=pow(m[1]!),B=pow(m[3]!);
 const minus=integerPolynomial(`${m[1]}^${h}-${m[3]}^${h}`,v),plus=integerPolynomial(`${m[1]}^${h}+${m[3]}^${h}`,v);
 if(!minus||!plus)return null;
 const split=(q:IntegerPolynomial)=>{let g=q.coefficients.reduce((a,b)=>gcd(a,b),0n);if(g===0n)return null;if(q.coefficients.at(-1)!<0n)g=-g;return {g,tex:polynomialLatex(q.coefficients.map(x=>fraction(x/g)),v),deg:q.coefficients.length-1};};
 const x=split(minus),y=split(plus);if(!x||!y||x.deg<1)return null;
 const wrap=(t:{tex:string;deg:number})=>/^[a-z]$/u.test(t.tex)?t.tex:`(${t.tex})`;
 const k=x.g*y.g,factors=`${wrap(x)}${wrap(y)}`,F=integerPolynomial(`(${x.tex})*(${y.tex})`,v);
 if(!F)return null;
 return {a:A,b:B,k,factors,F,product:`${k===1n?'':k===-1n?'-':String(k)}${factors}`};
}

export function polynomialDivisibilityLesson(text:string) {
 const c=polynomialDivisibilityCertificate(text);if(!c||!verifyPolynomialDivisibilityCertificate(c))return null;
 const {variable:n,name:f,domain}=c.task,expanded=polynomialLatex(c.polynomial.coefficients.map(n=>fraction(n)),n),details:AlgebraDeduction[]=[],conclusions:string[]=[],H=['Q','G','H','P'].find(v=>v!==f)!,R=['r','s','h'].find(v=>v!==n)!,M=['m','d','l'].find(v=>![n,R].includes(v))!;
 // Reviewer 2026-10-15: "dùng hằng đẳng thức khi tốt hơn khai triển": X^{2h} − Y^{2h} is factored as a difference of
 // two squares first, e.g. (n+4)^4 − n^4 = ((n+4)^2 − n^2)((n+4)^2 + n^2) = 16(n+2)(n^2+4n+8).
 const squares=differenceOfSquares(c.task.expression,n);
 if(squares)details.push({title:'Dùng hằng đẳng thức hiệu hai bình phương',explanation:`Biểu thức có dạng $A^2-B^2$ với $A=${squares.a}$, $B=${squares.b}$, nên $A^2-B^2=(A-B)(A+B)$. Thu gọn từng thừa số rồi đặt nhân tử chung, ta được ngay dạng tích bên dưới.`,math:`${f}(${n})=${c.task.expression}=\\left(${squares.a}-${squares.b}\\right)\\left(${squares.a}+${squares.b}\\right)=${squares.product}`,reason:'Hằng đẳng thức $A^2-B^2=(A-B)(A+B)$',question:'Biểu thức có dạng hiệu hai bình phương không?'});
 // Product form for every part (review 2026-10-15: "too unnecessary to expand and do 1·…"): with f = k·F and t = g·m,
 // g = gcd(k, t), k/g and m are coprime, so f ⋮ t ⟺ F ⋮ m; F's remainders are tabulated in factored form. Used only when
 // its zero classes agree with the verified certificate's.
 const mod=(a:bigint,m:bigint)=>((a%m)+m)%m;
 const productPart=(part:Part)=>{
  if(!squares)return null;const g=Number(gcd(squares.k,BigInt(part.target))),m=part.target/g;
  if(m!==part.reducedModulus)return null;
  const tables=part.tables.map(t=>({modulus:t.modulus,remainders:Array.from({length:t.modulus},(_,r)=>Number(mod(integerPolynomialValue(squares.F,BigInt(r)),BigInt(t.modulus))))}));
  if(tables.some((t,j)=>t.remainders.some((v,r)=>(v===0)!==(part.tables[j]!.remainders[r]===0))))return null;
  return {g,m,tables};
 };
 const usesProduct=!!squares&&c.parts.every(p=>productPart(p));
 if(!usesProduct)details.push({title:squares?'Khai triển để xét số dư':'Khai triển biểu thức chung cho cả ba câu',explanation:`Khai triển các lũy thừa và tích trong định nghĩa, gộp các hạng tử cùng bậc; các hạng tử đối nhau triệt tiêu. Ta được đa thức hệ số nguyên bên dưới. Các câu sau dùng cùng biểu thức này và giữ miền của $${n}$ như đề.`,math:`${f}(${n})=${c.task.expression}=${expanded}`,reason:'Hằng đẳng thức và phép khai triển; thu gọn hệ số chính xác',question:'Sau khai triển, hệ số nào có thể đặt chung để xét chia hết?'});
 for(let i=0;i<3;i++){
  const part=c.parts[i]!,label=String.fromCharCode(97+i),all=part.zeros.length===part.reducedModulus;
  if(i===0&&!all){
   const r=Array.from({length:part.reducedModulus},(_,r)=>r).find(r=>!part.zeros.includes(r))!,witness=domain==='positive'&&r===0?part.reducedModulus:r,value=integerPolynomialValue(c.polynomial,BigInt(witness));
   const answer=`${label}) Khẳng định với mọi giá trị là sai: $${n}=${witness}$ cho $${f}(${n})=${value}$ không chia hết cho $${part.target}$.`;conclusions.push(answer);
   details.push({title:`${label}) Kiểm tra một phản ví dụ thuộc miền gốc`,explanation:`Chọn $${n}=${witness}$ thuộc miền đề. Thay vào định nghĩa được $${value}$, có số dư khác 0 khi chia $${part.target}$; vì thế không thể chứng minh khẳng định phổ quát trong câu này. ${answer}`,math:`${f}(${witness})=${value},\\quad ${value}\\not\\vdots ${part.target}`,reason:'Một phản ví dụ hợp lệ bác bỏ khẳng định với mọi giá trị',question:'Giá trị được chọn có thỏa miền nhưng vi phạm chia hết không?'});continue;
  }
  const pp=usesProduct?productPart(part):null;
  if(pp&&squares){
   const F=H,Ftex=squares.factors,k=squares.k,kg=k/BigInt(pp.g);
   if(pp.m===1)details.push({title:`${label}) Chia hết cho ${part.target}`,explanation:`Từ dạng tích ở trên, $${f}(${n})=${squares.product}$ có thừa số $${k}$ chia hết cho $${part.target}$, nên $${f}(${n})$ chia hết cho $${part.target}$ với mọi $${n}$.`,math:`${f}(${n})=${squares.product}\\ \\vdots\\ ${part.target}`,reason:'Tích có một thừa số chia hết cho số chia',question:`Thừa số nào của tích chia hết cho $${part.target}$?`});
   else details.push({title:`${label}) Đưa về điều kiện cho $${Ftex}$`,explanation:`Đặt $${F}(${n})=${Ftex}$, khi đó $${f}(${n})=${k}\\cdot ${F}(${n})$. ${pp.g===1?`Vì $${k}$ và $${part.target}$ nguyên tố cùng nhau`:kg===1n?`Vì $${part.target}=${k}\\cdot${pp.m}$`:`Vì $${part.target}=${pp.g}\\cdot${pp.m}$, $${k}=${pp.g}\\cdot${kg}$ và $${kg}$, $${pp.m}$ nguyên tố cùng nhau`} nên $${f}(${n})$ chia hết cho $${part.target}$ khi và chỉ khi $${F}(${n})$ chia hết cho $${pp.m}$.`,math:`${f}(${n})\\ \\vdots\\ ${part.target}\\iff ${Ftex}\\ \\vdots\\ ${pp.m}`,reason:'Bỏ thừa số nguyên tố cùng nhau với số chia',question:`Cần xét $${F}(${n})$ chia hết cho số nào?`});
   if(pp.m>1){
    if(pp.tables.length>1)details.push({title:`${label}) Tách số chia`,explanation:`$${pp.m}=${pp.tables.map(t=>t.modulus).join('\\cdot ')}$ là tích các số đôi một nguyên tố cùng nhau, nên $${F}(${n})$ chia hết cho $${pp.m}$ khi và chỉ khi chia hết cho từng số. Vì $${F}$ có hệ số nguyên, $${F}(${n})$ và $${F}(${R})$ có cùng số dư khi $${n}$ và $${R}$ có cùng số dư, nên chỉ cần xét các số dư.`,math:null,reason:'Chia hết cho các số nguyên tố cùng nhau',question:'Vì sao chỉ cần xét các số dư?'});
    for(const t of pp.tables)details.push({title:`${label}) Xét số dư khi chia ${t.modulus}`,explanation:`${pp.tables.length>1?'':`Vì $${F}$ có hệ số nguyên, chỉ cần xét số dư của $${n}$ khi chia $${t.modulus}$. `}Thay từng số dư $${R}$ vào $${F}(${R})=${Ftex.split(n).join(R)}$:`,math:`\\begin{array}{c|${'c'.repeat(t.modulus)}}${R}&${Array.from({length:t.modulus},(_,r)=>r).join('&')}\\\\\\hline ${F}(${R})\\bmod ${t.modulus}&${t.remainders.join('&')}\\end{array}`,reason:'Tính số dư theo từng lớp',question:`Lớp số dư nào cho $${F}$ chia hết cho $${t.modulus}$?`});
   }
  }
  else details.push({title:`${label}) Tách nhân tử và giảm đúng điều kiện chia hết`,explanation:`${part.factor===1?'Không cần tách thêm nhân tử; dùng trực tiếp đa thức đã khai triển.':`Từ khai triển, đặt $${part.factor}$ làm nhân tử chung để được đẳng thức bên dưới.`} Đa thức còn lại có hệ số nguyên. Vì $${part.target}=${part.factor}\\cdot${part.reducedModulus}$ và nhân tử chung khác 0, $${f}(${n})$ chia hết cho $${part.target}$ khi và chỉ khi đa thức còn lại chia hết cho $${part.reducedModulus}$.${part.reducedModulus===1?' Mọi số nguyên đều chia hết cho 1, nên điều kiện này đúng với mọi giá trị.':''}`,math:`${f}(${n})=${part.factor}(${part.quotient}),\\qquad ${part.target}=${part.factor}\\cdot${part.reducedModulus}`,reason:'Đặt nhân tử chung; triệt tiêu cùng nhân tử khác 0 trong điều kiện chia hết',question:'Sau tách nhân tử, cần xét chia hết cho môđun nào để điều kiện tương đương?'});
  if(part.tables.length&&!pp){
   details.push({title:`${label}) Chứng minh các bảng số dư bao quát mọi giá trị`,explanation:`Gọi đa thức còn lại là $${H}(${n})=${part.quotient}$. Nếu $${n}$ và $${R}$ có cùng số dư khi chia một số $${M}$, hiệu từng lũy thừa của chúng chia hết cho $${M}$ nhờ hằng đẳng thức hiệu lũy thừa. Vì hệ số đều nguyên, $${H}(${n})-${H}(${R})$ cũng chia hết cho $${M}$. Do đó xét đủ các số dư là xét mọi giá trị. Môđun còn lại có phân tích $${part.reducedModulus}=${part.tables.map(t=>t.modulus).join('\\cdot ')}$; các thừa số là lũy thừa của các nguyên tố khác nhau, nên đôi một nguyên tố cùng nhau. Điều kiện chia hết cho tích tương đương chia hết cho từng thừa số.`,math:`${H}(${n})\\equiv ${H}(${R})\\pmod{${M}}`,reason:'Đa thức nguyên giữ đồng dư; tính chất chia hết với các ước nguyên tố cùng nhau',question:'Vì sao kết hợp các bảng theo các lũy thừa nguyên tố cho điều kiện cần và đủ?'});
   for(const table of part.tables)for(let start=0;start<table.modulus;start+=10){const rs=Array.from({length:Math.min(10,table.modulus-start)},(_,j)=>start+j);details.push({title:`${label}) Số dư khi chia ${table.modulus}: trường hợp ${start} đến ${rs.at(-1)}`,explanation:`Thay từng $${R}$ vào $${H}(${R})$, tính rồi chia $${table.modulus}$. Chẳng hạn $${H}(${start})=${integerPolynomialValue(integerPolynomial(part.quotient,n)!,BigInt(start))}$ có số dư $${table.remainders[start]}$. Chỉ cột có số dư 0 được nhận.`,math:`\\begin{array}{c|${'c'.repeat(rs.length)}}${R}&${rs.join('&')}\\\\\\hline ${H}(${R})\\bmod ${table.modulus}&${rs.map(r=>table.remainders[r]).join('&')}\\end{array}`,reason:'Tính chính xác tất cả lớp số dư trong bảng',question:`Những lớp số dư nào có số dư của $${H}$ bằng0?`});}
  }
  const K=['k','t','u','v'].find(v=>v!==n)!;
  const min=domain==='positive'?1:0;
  const answer=all?`${label}) Mọi giá trị $${n}$ thuộc miền đề đều thỏa mãn.`:!part.zeros.length?`${label}) Không có giá trị $${n}$ thuộc miền đề thỏa mãn.`:`${label}) ${part.residues.map(r=>`$${n}=${part.period}${K}+${r}$, $${K}\\in\\mathbb Z$${domain==='integer'?'':`, $${K}\\ge${Math.ceil((min-r)/part.period)}$`}`).join(' hoặc ')}.`;
  conclusions.push(answer);
  if(pp&&pp.m>1){
   const each=pp.tables.map(t=>{const z=t.remainders.flatMap((v,r)=>v===0?[r]:[]);return z.length?`$${n}$ chia $${t.modulus}$ dư $${z.join('$ hoặc $')}$`:`không có số dư nào khi chia $${t.modulus}$`;});
   details.push({title:`${label}) Kết luận`,explanation:`Theo ${pp.tables.length>1?'các bảng':'bảng'}, $${f}(${n})$ chia hết cho $${part.target}$ khi và chỉ khi ${each.join(' và ')}${pp.tables.length>1&&part.zeros.length?`, tức là $${n}\\equiv ${part.residues.join(', ')}\\pmod{${part.period}}$`:''}. ${answer}`,math:all||!part.zeros.length?null:`${n}\\equiv ${part.residues.join(',')}\\pmod{${part.period}}`,reason:'Kết hợp các điều kiện số dư',question:'Những giá trị nào thỏa mọi bảng?'});
  }
  else if(part.tables.length&&!pp)details.push({title:`${label}) Kết hợp điều kiện và nêu toàn bộ nghiệm`,explanation:`Xét tất cả lớp số dư khi chia $${part.reducedModulus}$, các bảng đồng thời có số dư 0 đúng tại $${R}\\in\\{${part.zeros.join(',')}\\}$. ${part.period!==part.reducedModulus?`Các lớp này đúng bằng các lớp $${part.residues.join(',')}$ khi chia $${part.period}$, vì danh sách bao gồm trọn các số dư cách nhau $${part.period}$ trong mỗi lớp đó.`:''} Các biến đổi đều tương đương và đã giữ miền ban đầu. ${answer}`,math:all||!part.zeros.length?null:`${n}\\equiv ${part.residues.join(',')}\\pmod{${part.period}}`,reason:'Kết hợp toàn bộ điều kiện; ghép các lớp số dư đầy đủ; giữ miền gốc',question:'Có lớp nào không thỏa một bảng nhưng bị nhận nhầm khi kết hợp không?'});
 }
 const answer=conclusions.join('\n');details.push({title:'Kết luận riêng từng câu theo miền đề',explanation:`Các phép khai triển, tách nhân tử và xét số dư đã được chứng minh đầy đủ.\n${answer}`,math:null,reason:'Mỗi câu có điều kiện cần và đủ hoặc phản ví dụ rõ ràng; các kết luận trên từng dòng',question:'Mỗi câu đã có kết luận riêng và mọi điều kiện miền đều được giữ chưa?'});
 const lesson=algebraProofLesson(text,'Chia hết đa thức nhiều phần: nhân tử chung và lũy thừa nguyên tố','Khai triển chung, giảm đúng môđun, chứng minh tính đầy đủ của số dư và kết hợp từng câu.',details,answer,{givens:[`$${f}(${n})=${c.task.expression}$`],unknowns:['Chứng minh câu a; tất cả giá trị của n trong câu b và c.'],constraints:[`Miền của chỉ số là số ${domain==='positive'?'nguyên dương':domain==='natural'?'tự nhiên (kể cả0)':'nguyên'}.`]});
 if(!lesson)return null;lesson.analysis.topic='number_theory';return {lesson,certificate:c};
}
