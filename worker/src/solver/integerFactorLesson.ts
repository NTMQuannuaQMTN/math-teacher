import {parseMathText} from '../../../shared/src/mathText';
import {exactArithmeticIdentity} from '../../../shared/src/polynomialIdentity';
import {algebraProofLesson,type AlgebraDeduction} from './algebraProofLesson';

export interface IntegerFactorTask {text:string;left:string;right:string;variables:[string,string];a:number;b:number;c:number;domain:'integer'|'positive';condition?:{index:0|1;operator:'>'|'<'|'>='|'<=';bound:number;latex:string}}
export interface IntegerFactorCertificate {task:IntegerFactorTask;product:number;divisors:number[];pairs:number[][];families:('first'|'second')[]}
const sign=(n:number)=>n>=0?`+${n}`:String(n);
const key=(p:number[])=>p.join(',');
export function integerFactorTask(text:string):IntegerFactorTask|null {
 const maths:string[]=[];if(text.includes('§'))return null;
 const template=parseMathText(text.trim()).map(s=>s.kind==='math'?`§${maths.push(s.value)-1}§`:s.value).join('').replace(/\s+/g,' ').trim();
 const command=/^Tìm (?:tất cả )?(?:các )?cặp số nguyên( dương)? §0§ thỏa mãn §1§( và §2§)?\.?$/iu.exec(template);
 if(!command||maths.length!==(command[2]?3:2))return null;
 const vars=/^\(?\s*([a-z])\s*,\s*([a-z])\s*\)?$/u.exec(maths[0]!);if(!vars||vars[1]===vars[2])return null;
 const [x,y]=[vars[1]!,vars[2]!];
 const equation=maths[1]!.replace(/\s/g,''),m=new RegExp(`^${x}${y}([+-]\\d+)${x}([+-]\\d+)${y}=(-?\\d+)$`).exec(equation);
 if(!m)return null;
 const [a,b,c]=m.slice(1).map(Number) as [number,number,number];
 if(![a,b,c].every(Number.isSafeInteger)||Math.abs(a)>1e6||Math.abs(b)>1e6||Math.abs(c)>1e9||Math.abs(c+a*b)>10000)return null;
 let condition:IntegerFactorTask['condition'];
 if(command[2]){
  const inequality=new RegExp(`^(${x}|${y})(>=|<=|>|<|\\\\geq?|\\\\leq?)(-?\\d+)$`).exec(maths[2]!.replace(/\s/g,''));
  if(!inequality||c+a*b===0)return null; // Infinite families need a separate parameter-domain proof.
  const bound=Number(inequality[3]);if(!Number.isSafeInteger(bound)||Math.abs(bound)>1e9)return null;
  const op=inequality[2]!,operator=(op.startsWith('\\ge')?'>=':op.startsWith('\\le')?'<=':op) as '>'|'<'|'>='|'<=';
  condition={index:inequality[1]===x?0:1,operator,bound,latex:maths[2]!.trim()};
 }
 return {text,left:equation.split('=')[0]!,right:String(c),variables:[x,y],a,b,c,domain:command[1]?'positive':'integer',...(condition?{condition}:{})};
}
function admissible(t:IntegerFactorTask,p:number[]):boolean {
 if(t.domain==='positive'&&!p.every(v=>v>0))return false;
 if(!t.condition)return true;const {index,operator,bound}=t.condition,v=p[index]!;
 return operator==='>'?v>bound:operator==='<'?v<bound:operator==='>='?v>=bound:v<=bound;
}
export function integerFactorCertificate(text:string):IntegerFactorCertificate|null {
 const task=integerFactorTask(text);if(!task)return null;
 const {a,b,c,domain}=task,d=c+a*b,divisors:number[]=[],pairs:number[][]=[],families:('first'|'second')[]=[];
 if(d===0){if(domain==='integer'||-b>0)families.push('first');if(domain==='integer'||-a>0)families.push('second');}
 else{
  for(let u=1;u*u<=Math.abs(d);u++)if(d%u===0){divisors.push(u,-u);if(u*u!==Math.abs(d))divisors.push(Math.abs(d)/u,-Math.abs(d)/u);}
  divisors.sort((a,b)=>a-b);
  for(const u of divisors){const p=[u-b,d/u-a];if(admissible(task,p))pairs.push(p);}
  if(divisors.length>48||pairs.length>40)return null;
 }
 return {task,product:d,divisors,pairs,families};
}
/** Uses symbolic expansion and a separate linear divisor scan, including domain constraints.
 * A justified |u|≤|d| bound makes that scan exhaustive. Infinite d=0 is a separate proof branch. */
export function verifyIntegerFactorCertificate(c:IntegerFactorCertificate):boolean {
 try {
  const t=integerFactorTask(c.task.text);if(!t||JSON.stringify(t)!==JSON.stringify(c.task)||c.product!==t.c+t.a*t.b)return false;
  const [x,y]=t.variables;
  const id=exactArithmeticIdentity(`${t.left}-(${t.right})`,`(${x}${sign(t.b)})(${y}${sign(t.a)})-(${c.product})`);
  if(!id?.valid||id.denominators.length)return false;
  if(!c.product){
   const families:('first'|'second')[]=[];if(t.domain==='integer'||-t.b>0)families.push('first');if(t.domain==='integer'||-t.a>0)families.push('second');
   return !c.divisors.length&&!c.pairs.length&&families.join(',')===c.families.join(',');
  }
  if(c.families.length)return false;
  const divisors:number[]=[],pairs:number[][]=[];
  for(let u=-Math.abs(c.product);u<=Math.abs(c.product);u++)if(u&&c.product%u===0){divisors.push(u);const p=[u-t.b,c.product/u-t.a];if(admissible(t,p))pairs.push(p);}
  return divisors.join(',')===c.divisors.join(',')&&pairs.map(key).join(';')===c.pairs.map(key).join(';')&&c.pairs.every(([x,y])=>(x!)*(y!)+t.a*(x!)+t.b*(y!)===t.c);
 }catch{return false;}
}
export function integerFactorLesson(text:string) {
 const c=integerFactorCertificate(text);if(!c||!verifyIntegerFactorCertificate(c))return null;
 const {a,b,variables:[x,y],domain}=c.task,d=c.product,word=domain==='positive'?'nguyên dương':'nguyên';
 const aux=['u','v','a','b','s','t'].filter(v=>![x,y].includes(v)),U=aux[0]!,V=aux[1]!;
 const factor=`(${x}${sign(b)})(${y}${sign(a)})=${d}`;
 const extra=c.task.condition?` Đồng thời giữ điều kiện $${c.task.condition.latex}$ của đề.`:'';
 const details:AlgebraDeduction[]=[{title:'Đưa phương trình về tích, giữ miền của các ẩn',explanation:`Cộng $${a*b}$ vào hai vế, dùng khai triển tích để được đẳng thức bên dưới. Đặt $${U}=${x}${sign(b)}$, $${V}=${y}${sign(a)}$; ngược lại $${x}=${U}${sign(-b)}$, $${y}=${V}${sign(-a)}$. Các ẩn ban đầu phải là số ${word}${domain==='positive'?', nên còn phải giữ cả hai điều kiện lớn hơn 0':''}.${extra}`,math:factor,reason:'Nhóm hạng tử; phép đổi biến ngược được; giữ nguyên miền của đề',question:'Sau đổi biến, điều kiện của hai ẩn ban đầu còn phải kiểm tra thế nào?'}];
 let answer:string;
 if(!d){
  const familyText=c.families.map(f=>f==='first'?`$${x}=${-b}$, $${y}$ là số ${word} tùy ý`:`$${y}=${-a}$, $${x}$ là số ${word} tùy ý`);
  answer=familyText.length?`Vậy tất cả nghiệm là: ${familyText.join('; hoặc ')}.`:`Vậy không có cặp số ${word} thỏa mãn.`;
  details.push({title:'Xét tích bằng không thay vì liệt kê ước',explanation:`Một tích hai số nguyên bằng 0 khi và chỉ khi ít nhất một thừa số bằng 0. Vì vậy $${U}=0$ hoặc $${V}=0$, tương ứng $${x}=${-b}$ hoặc $${y}=${-a}$. Mỗi họ đều thỏa phương trình tích với ẩn còn lại tùy ý; hai họ có thể chung một cặp, nên dùng hợp, không cộng số nghiệm.${domain==='positive'?` Nếu giá trị cố định không dương thì loại cả họ ấy.`:''} ${answer}`,math:null,reason:'Tính chất tích bằng không; hợp các họ nghiệm và điều kiện miền',question:'Tích bằng không cho những họ nghiệm nào? Có được coi 0 là một ước để chia không?'});
 }else{
  details.push({title:'Chứng minh chỉ cần xét hữu hạn các ước, cả hai dấu',explanation:`Vì $${U}${V}=${d}\\ne0$, cả $${U},${V}$ đều khác 0. Ta có $${d}\\vdots ${U}$ và $${V}=${d}/${U}$. Vì $|${V}|\\ge1$, suy ra $1\\le|${U}|\\le${Math.abs(d)}$. Chỉ cần xét mọi ước dương và các ước âm của $${d}$; giới hạn này được chứng minh, không phải tự đặt một khoảng tìm kiếm.`,math:`${U}${V}=${d},\\quad ${d}\\vdots ${U},\\quad 1\\le|${U}|\\le${Math.abs(d)}`,reason:'Thừa số nguyên khác không có trị tuyệt đối ít nhất 1; giới hạn hữu hạn đủ',question:'Vì sao giới hạn của thừa số bảo đảm không bỏ sót nghiệm âm hoặc nghiệm lớn?'});
  for(let start=0;start<c.divisors.length;start+=6){
   const ds=c.divisors.slice(start,start+6);
   details.push({title:`Xét các ước từ ${start+1} đến ${start+ds.length}`,explanation:`Với từng ước $${U}$, tính $${V}=${d}/${U}$, rồi khôi phục $${x},${y}$ theo đổi biến ngược. ${domain==='positive'?'Cặp có một tọa độ không dương bị loại; chỉ giữ hai tọa độ đều lớn hơn 0.':'Giữ cả ước âm; từng cặp được tính từ một cặp thừa số của tích.'} ${extra} Bảng ghi rõ mỗi cặp và kết quả đối chiếu toàn bộ điều kiện. Dấu $\\times$ đánh dấu cặp bị loại vì vi phạm ít nhất một điều kiện.`,math:`\\begin{gathered}${ds.map(u=>{const p=[u-b,d/u-a];return `${U}=${u},\\ ${V}=${d/u}\\Rightarrow (${x},${y})=(${p.join(',')})${!admissible(c.task,p)?'\\quad\\times':''}`;}).join('\\\\')}\\end{gathered}`,reason:'Liệt kê đầy đủ các ước; đổi biến ngược và kiểm tra miền',question:'Cặp khôi phục có thỏa miền số và mọi điều kiện bổ sung của đề không?'});
  }
  answer=c.pairs.length?`Vậy tất cả các cặp số ${word} là $${c.pairs.map(p=>`(${p.join(',')})`).join(', ')}$.`:`Vậy không có cặp số ${word} thỏa mãn.`;
  details.push({title:'Kiểm tra và kết luận toàn bộ nghiệm',explanation:`Mỗi cặp được giữ thỏa phương trình tích, nên thỏa phương trình gốc nhờ phép biến đổi tương đương. Ngược lại, mọi nghiệm phải cho một ước đã liệt kê và qua đúng phép đổi biến ngược.${extra} Không còn cặp nào khác. ${answer}`,math:null,reason:'Hai chiều của phép biến đổi; liệt kê hết ước và giữ điều kiện miền',question:'Vì sao mỗi cặp tìm được đúng, và vì sao không còn cặp nào khác?'});
 }
 const lesson=algebraProofLesson(text,'Nghiệm nguyên bằng phân tích thành nhân tử','Đưa về tích, phân biệt tích bằng không và khác không; xét toàn bộ ước với miền gốc.',details,answer,{givens:[`$${c.task.left}=${c.task.right}$`],unknowns:[`Tất cả cặp số ${word} $(${x},${y})$`],constraints:[`Cả $${x}$ và $${y}$ phải là số ${word}.`,...(c.task.condition?[`$${c.task.condition.latex}$`]:[])]});
 if(!lesson)return null;lesson.analysis.topic='number_theory';return {lesson,certificate:c};
}
