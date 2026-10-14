import {parseMathText} from '../../../shared/src/mathText';
import {integerPolynomialValue,residueCertificate,verifyResidueCertificate,type ResidueCertificate} from '../../../shared/src/integerPolynomial';
import {algebraProofLesson,type AlgebraDeduction} from './algebraProofLesson';

export interface IntegerResidueTask {kind:'prove'|'find';variable:string;expression:string;modulus:number;domain:'integer'|'natural'|'positive'}
/** Consume the entire task. Additional inequalities/subquestions are never discarded. */
export function integerResidueTask(text:string):IntegerResidueTask|null {
 const maths:string[]=[];
 if(text.includes('§'))return null;
 const template=parseMathText(text.trim()).map(s=>s.kind==='math'?`§${maths.push(s.value)-1}§`:s.value).join('').replace(/\s+/g,' ').trim();
 const prove=/^Chứng minh (?:rằng )?với mọi (số nguyên|số tự nhiên|số nguyên dương) §0§, (?:tích |biểu thức )?§1§ chia hết cho (?:§2§|(\d+))\.?$/iu.exec(template);
 const find=/^Tìm (?:tất cả )?(?:các )?(số nguyên|số tự nhiên|số nguyên dương) §0§ sao cho §1§ chia hết cho (?:§2§|(\d+))\.?$/iu.exec(template);
 const match=prove??find;if(!match||maths.length!==(match[2]?2:3))return null;
 const variable=maths[0]!.trim();if(!/^[a-z]$/u.test(variable))return null;
 const literal=match[2]??maths[2]!.trim();if(!/^\d+$/u.test(literal))return null;
 const modulus=Number(literal);if(modulus<2||modulus>60)return null;
 const domain=match[1]!.toLowerCase()==='số nguyên dương'?'positive':match[1]!.toLowerCase()==='số tự nhiên'?'natural':'integer';
 return {kind:prove?'prove':'find',variable,expression:maths[1]!,modulus,domain};
}
export function integerResidueLesson(text:string):{lesson:NonNullable<ReturnType<typeof algebraProofLesson>>;certificate:ResidueCertificate;task:IntegerResidueTask}|null {
 const task=integerResidueTask(text);if(!task)return null;
 const {variable:n,expression,modulus:m,domain}=task,c=residueCertificate(expression,m,n);if(!c||!verifyResidueCertificate(c))return null;
 const domainDescription=domain==='integer'?'nguyên':domain==='natural'?'tự nhiên (kể cả 0)':'nguyên dương';
 const domainMath=domain==='integer'?`${n}\\in\\mathbb Z`:domain==='natural'?`${n}\\in\\mathbb Z,\\ ${n}\\ge0`:`${n}\\in\\mathbb Z,\\ ${n}\\ge1`;
 const Q=['q','k','t','u'].find(v=>v!==n)!,R=['r','s','v','h'].find(v=>![n,Q].includes(v))!,J=['j','i','l'].find(v=>![n,Q,R].includes(v))!;
 const details:AlgebraDeduction[]=[];
 let answer:string;
 if(task.kind==='prove'&&c.zeros.length!==m){
  const r=c.remainders.findIndex(v=>v!==0),witness=domain==='positive'&&r===0?m:r,value=integerPolynomialValue(c,BigInt(witness)),rem=c.remainders[r]!;
  answer=`Vậy khẳng định trong đề không đúng với mọi số ${domainDescription}; $${n}=${witness}$ là một phản ví dụ cụ thể.`;
  details.push({title:'Kiểm tra một giá trị thỏa miền của đề',explanation:`Gọi $P(${n})=${expression}$. Chọn $${n}=${witness}$, là số ${domainDescription} thỏa miền đã cho. Thay vào biểu thức gốc, tính lần lượt các phép toán, được $${value}$.`,math:`${n}=${witness},\\qquad P(${witness})=${value}`,reason:'Phản ví dụ phải thỏa chính giả thiết và dùng biểu thức ban đầu',question:'Muốn bác bỏ một khẳng định với mọi số nguyên, cần bao nhiêu phản ví dụ?'});
  details.push({title:'Chỉ rõ vì sao phản ví dụ bác bỏ chia hết',explanation:`Gọi $P(${n})=${expression}$. Số $${value}$ chia $${m}$ dư $${rem}\\ne0$, nên không chia hết cho $${m}$. Một giá trị hợp lệ không thỏa kết luận đã đủ bác bỏ mệnh đề với mọi giá trị. ${answer}`,math:`${value}=${m}\\cdot(${(value-BigInt(rem))/BigInt(m)})+${rem},\\quad ${value}\\not\\vdots ${m}`,reason:'Định nghĩa chia hết; phủ định mệnh đề với mọi giá trị',question:'Số dư khác không của giá trị vừa tính mâu thuẫn kết luận thế nào?'});
 }else{
  details.push({title:'Chia miền vô hạn thành các lớp số dư đầy đủ',explanation:`Gọi $P(${n})=${expression}$. Theo phép chia có dư, mọi số ${domainDescription} $${n}$ viết duy nhất thành $${n}=${m}${Q}+${R}$ với $${Q}$ nguyên và $0\\le ${R}<${m}$. Vì biểu thức là đa thức có hệ số nguyên, ta sẽ kiểm tra tất cả $${m}$ số dư, không giới hạn giá trị của $${n}$.`,math:`${n}=${m}${Q}+${R},\\quad ${Q}\\in\\mathbb Z,\\quad ${R}\\in\\{${m===2?'0,1':`0,1,\\ldots,${m-1}`}\\}`,reason:'Phép chia có dư đúng cả khi số bị chia âm',question:'Mọi số nguyên, kể cả âm, có những khả năng số dư nào?'});
  details.push({title:'Chứng minh vì sao chỉ số dư quyết định chia hết',explanation:`Vì $${n}-${R}=${m}${Q}$, hiệu $${n}^{${J}}-${R}^{${J}}$ chia hết cho $${m}$: với $${J}\\ge2$, dùng hằng đẳng thức hiệu hai lũy thừa; với $${J}=1$ là hiệu $${n}-${R}$, còn hạng tử hằng có hiệu bằng 0. Nhân từng hiệu với hệ số nguyên và cộng lại cho $P(${n})-P(${R})$ chia hết cho $${m}$. Do đó $P(${n})$ và $P(${R})$ có cùng số dư. Đây là lý do bảng hữu hạn bao quát mọi giá trị.`,math:`${n}^{${J}}-${R}^{${J}}=(${n}-${R})(${n}^{${J}-1}+${n}^{${J}-2}${R}+\\cdots+${R}^{${J}-1}),\\qquad P(${n})\\equiv P(${R})\\pmod{${m}}`,reason:'Hằng đẳng thức hiệu lũy thừa; tính chất cộng và nhân của chia hết',question:'Vì sao thay một số nguyên bằng số dư của nó không đổi số dư của đa thức?'});
  for(let start=0;start<m;start+=10){
   const indices=Array.from({length:Math.min(10,m-start)},(_,j)=>start+j);
   details.push({title:`Tính số dư trong các trường hợp ${start} đến ${indices.at(-1)}`,explanation:`Thay từng số dư $${R}$ vào $P(${R})=${expression.replace(new RegExp(`(?<![a-z])${n}(?![a-z])`,'g'),R)}$, tính các lũy thừa rồi chia cho $${m}$. Bảng ghi số dư không âm, nhỏ hơn $${m}$; số dư 0 là đúng điều kiện chia hết.`,math:`\\begin{array}{c|${'c'.repeat(indices.length)}}${R}&${indices.join('&')}\\\\\\hline P(${R})\\bmod ${m}&${indices.map(r=>c.remainders[r]).join('&')}\\end{array}`,reason:'Thay từng khả năng số dư; phép chia có dư chính xác',question:'Những cột nào trong bảng có số dư bằng không?'});
  }
  if(task.kind==='prove')answer=`Vậy với mọi số ${domainDescription} $${n}$, $${expression}$ chia hết cho $${m}$.`;
  else if(!c.zeros.length)answer=`Vậy không có số ${domainDescription} $${n}$ thỏa mãn yêu cầu.`;
  else if(c.zeros.length===m)answer=`Vậy mọi số ${domainDescription} $${n}$ đều thỏa mãn yêu cầu.`;
  else answer=`Vậy tất cả nghiệm là các số ${domainDescription} có dạng $${n}=${m}${Q}+${R}$, với $${R}\\in\\{${c.zeros.join(',')}\\}$ và $${Q}\\in\\mathbb Z$${domain==='integer'?'':`, đồng thời $${n}\\ge${domain==='natural'?0:1}$`}.`;
  details.push({title:'Đối chiếu mọi trường hợp và kết luận hai chiều',explanation:`${task.kind==='prove'?'Mọi cột của bảng đều có số dư 0, nên không còn trường hợp nào phải loại.':c.zeros.length?'Bảng đã xét hết mọi số dư. Một số thuộc các lớp có số dư 0 làm biểu thức chia hết; một số thuộc lớp khác không thể thỏa. Điều kiện này vừa cần vừa đủ.':'Bảng đã xét hết mọi số dư và không cột nào có số dư 0, nên không có trường hợp bị bỏ sót.'} ${answer}`,math:task.kind==='prove'?`${expression}\\vdots ${m}`:c.zeros.length&&c.zeros.length<m?`${n}\\equiv ${c.zeros.join(',')}\\pmod{${m}}`:null,reason:'Phân chia đầy đủ, không trùng các lớp số dư; điều kiện cần và đủ',question:'Vì sao bảng cho tất cả nghiệm, chứ không chỉ vài nghiệm tìm được?'});
 }
 const lesson=algebraProofLesson(text,'Đa thức nguyên và các lớp số dư','Chứng minh tính đầy đủ của các lớp số dư, rồi tính chính xác và kết luận.',details,answer,{givens:[`$${domainMath}$`],unknowns:[task.kind==='prove'?'Tính đúng của khẳng định với mọi giá trị':'Tất cả các giá trị thỏa điều kiện chia hết'],constraints:[`Các giá trị thuộc miền số ${domainDescription}.`]});
 if(!lesson)return null;lesson.analysis.topic='number_theory';return {lesson,certificate:c,task};
}
