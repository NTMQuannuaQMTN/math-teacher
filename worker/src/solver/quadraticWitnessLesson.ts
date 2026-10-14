import {parseMathText} from '../../../shared/src/mathText';
import {evalExpression} from '../../../shared/src/expr';
import {exactArithmeticIdentity} from '../../../shared/src/polynomialIdentity';
import {algebraProofLesson,type AlgebraDeduction} from './algebraProofLesson';
interface WitnessTask {text:string;numberName:string;variables:[string,string];coefficient:number;divisor:number;digits:2|3;count:2|3;expression:string}
export interface QuadraticWitnessCertificate {task:WitnessTask;witnesses:{number:number;a:number;b:number}[]}
function witnessTask(text:string):WitnessTask|null {
 const maths:string[]=[];if(text.includes('§'))return null;
 const template=parseMathText(text.trim()).map(s=>s.kind==='math'?`§${maths.push(s.value)-1}§`:s.value).join('').replace(/\s+/g,' ').trim();
 const match=/^Số nguyên dương §0§ được gọi là số đẹp nếu tồn tại các số nguyên §1§ sao cho §2§\. Tìm (hai|ba) số đẹp có (hai|ba) chữ số và chia hết cho (?:§3§|(\d+))\.?$/iu.exec(template);
 if(!match||maths.length!==(match[3]?3:4)||!/^[a-z]$/u.test(maths[0]!.trim()))return null;
 const variables=/^([a-z])\s*,\s*([a-z])$/u.exec(maths[1]!);if(!variables)return null;
 const numberName=maths[0]!.trim(),[a,b]=[variables[1]!,variables[2]!];if(new Set([numberName,a,b]).size!==3)return null;
 const sides=maths[2]!.split('=');if(sides.length!==2||sides[0]!.trim()!==numberName)return null;
 let coefficient:number;try{coefficient=evalExpression(sides[1]!,{[a]:0,[b]:1,[numberName]:0});}catch{return null;}
 if(!Number.isSafeInteger(coefficient)||coefficient<1||coefficient>1000)return null;
 const id=exactArithmeticIdentity(sides[1]!,`${a}^2+${coefficient}*${b}^2`);if(!id?.valid||id.denominators.length)return null;
 const literal=match[3]??maths[3]!.trim();if(!/^\d+$/u.test(literal))return null;const divisor=Number(literal);if(divisor<2||divisor>999)return null;
 return {text,numberName,variables:[a,b],coefficient,divisor,digits:match[2]!.toLowerCase()==='hai'?2:3,count:match[1]!.toLowerCase()==='hai'?2:3,expression:sides[1]!};
}
export function quadraticWitnessCertificate(text:string):QuadraticWitnessCertificate|null {
 const task=witnessTask(text);if(!task)return null;
 const lower=10**(task.digits-1),upper=10**task.digits-1,witnesses:QuadraticWitnessCertificate['witnesses']=[];
 for(let number=Math.ceil(lower/task.divisor)*task.divisor;number<=upper&&witnesses.length<task.count;number+=task.divisor){
  let found=false;for(let a=0;a*a<=number&&!found;a++)for(let b=0;task.coefficient*b*b<=number;b++)if(a*a+task.coefficient*b*b===number){witnesses.push({number,a,b});found=true;break;}
 }
 // No found witness is never turned into a false existence claim or an unproved impossibility.
 return witnesses.length===task.count?{task,witnesses}:null;
}
export function verifyQuadraticWitnessCertificate(c:QuadraticWitnessCertificate):boolean {
 try{
  const t=witnessTask(c.task.text);if(!t||JSON.stringify(t)!==JSON.stringify(c.task)||c.witnesses.length!==t.count||new Set(c.witnesses.map(w=>w.number)).size!==t.count)return false;
  return c.witnesses.every(w=>Number.isSafeInteger(w.number)&&Number.isSafeInteger(w.a)&&Number.isSafeInteger(w.b)&&w.number>=10**(t.digits-1)&&w.number<10**t.digits&&w.number%t.divisor===0&&BigInt(w.a)**2n+BigInt(t.coefficient)*BigInt(w.b)**2n===BigInt(w.number));
 }catch{return false;}
}
export function quadraticWitnessLesson(text:string) {
 const c=quadraticWitnessCertificate(text);if(!c||!verifyQuadraticWitnessCertificate(c))return null;
 const {numberName:n,variables:[a,b],coefficient:C,divisor:d,digits,count}=c.task,details:AlgebraDeduction[]=[];
 details.push({title:'Chỉ rõ đối tượng cần tìm và điều kiện của nhân chứng',explanation:`Cần nêu $${count}$ số khác nhau trong đoạn từ $${10**(digits-1)}$ đến $${10**digits-1}$, đều chia hết cho $${d}$. Với mỗi số, phải chỉ rõ hai số nguyên $${a},${b}$ cho biểu diễn $${n}=${a}^2+${C}${b}^2$. Vì bình phương không phụ thuộc dấu, có thể tìm nhân chứng không âm.`,math:`${10**(digits-1)}\\le ${n}\\le ${10**digits-1},\\quad ${n}\\vdots ${d},\\quad ${n}=${a}^2+${C}${b}^2`,reason:'Dùng đủ định nghĩa số đẹp, số chữ số, chia hết và yêu cầu khác nhau',question:'Muốn chứng minh một số là số đẹp, phải nêu thêm những số nguyên nào?'});
 for(const w of c.witnesses)details.push({title:`Nêu nhân chứng cụ thể cho số ${w.number}`,explanation:`Chọn $${n}=${w.number}$, $${a}=${w.a}$, $${b}=${w.b}$. Hai số trong biểu diễn đều nguyên. Tính $${w.a}^2=${w.a*w.a}$, $${w.b}^2=${w.b*w.b}$ rồi nhân với $${C}$, cộng lại đúng bằng $${w.number}$. Số này có đúng $${digits}$ chữ số và bằng $${d}$ nhân $${w.number/d}$, nên thỏa cả điều kiện chia hết.`,math:`\\begin{gathered}${w.a}^2+${C}\\cdot${w.b}^2=${w.a*w.a}+${C*w.b*w.b}=${w.number}\\\\${w.number}=${d}\\cdot${w.number/d}\\end{gathered}`,reason:'Thay nhân chứng cụ thể; tính bình phương, tích và tổng; kiểm tra chữ số và chia hết',question:'Hai số nguyên được chọn có cho đúng số đang xét, và số ấy thỏa các điều kiện còn lại không?'});
 const answer=`Vậy có thể chọn các số $${c.witnesses.map(w=>w.number).join(', ')}$, với các cặp nhân chứng $(${a},${b})$ tương ứng là $${c.witnesses.map(w=>`(${w.a},${w.b})`).join(', ')}$.`;
 details.push({title:'Kết luận với các số và nhân chứng đã nêu',explanation:`Các số được chọn đôi một khác nhau, có đủ số chữ số, chia hết cho $${d}$ và mỗi số có biểu diễn đúng với hai số nguyên cụ thể. Do đó đã nêu đủ $${count}$ đối tượng theo yêu cầu. ${answer}`,math:null,reason:'Mỗi đối tượng thỏa mọi điều kiện; đủ số lượng và khác nhau',question:'Đã nêu đủ các số khác nhau và nhân chứng cho từng số chưa?'});
 const lesson=algebraProofLesson(text,'Biểu diễn số nguyên bằng dạng bậc hai: nhân chứng cụ thể','Chọn các bội trong đoạn yêu cầu, tìm biểu diễn và kiểm tra đầy đủ từng nhân chứng.',details,answer,{givens:[`$${n}=${c.task.expression}$ là định nghĩa số đẹp.`],unknowns:[`${count} số thỏa đồng thời mọi điều kiện.`],constraints:['Nhân chứng phải nguyên; các số cần tìm phải khác nhau.']});
 if(!lesson)return null;lesson.analysis.topic='number_theory';return {lesson,certificate:c};
}
