import {plainCombinatorics,combinatoricsProofLesson,type CombinatoricsDeduction} from './combinatoricsProofLesson';
interface Task {text:string;values:number[];modulus:number}
export interface ExplicitWitnessCertificate {task:Task;remainders:number[];pair:[number,number]|null}
const mod=(x:number,m:number)=>(x%m+m)%m;
function parseTask(text:string):Task|null {
 const m=/^Cho các số (-?\d+(?:\s*,\s*-?\d+)*)\. Hãy chỉ ra hai số phân biệt trong danh sách có hiệu chia hết cho (\d+)\.$/u.exec(plainCombinatorics(text));
 if(!m)return null;const values=m[1]!.split(',').map(Number),modulus=Number(m[2]);return values.length>=2&&values.length<=30&&values.every(v=>Number.isSafeInteger(v)&&Math.abs(v)<=1e9)&&modulus>=2&&modulus<=60?{text,values,modulus}:null;
}
export function explicitWitnessCertificate(text:string):ExplicitWitnessCertificate|null {
 const task=parseTask(text);if(!task)return null;const remainders=task.values.map(v=>mod(v,task.modulus));const first=new Map<number,number>();let pair:[number,number]|null=null;
 for(let j=0;j<task.values.length;j++){
  const r=remainders[j]!,i=first.get(r);if(i!==undefined&&task.values[i]!==task.values[j]){pair=[i,j];break;}if(i===undefined)first.set(r,j);
 }
 return {task,remainders,pair};
}
/** Directly test ALL distinct-value pairs in the original finite input, independent of remainder buckets. */
export function verifyExplicitWitnessCertificate(c:ExplicitWitnessCertificate):boolean {
 const t=parseTask(c.task.text);if(!t||JSON.stringify(t)!==JSON.stringify(c.task)||c.remainders.length!==t.values.length)return false;
 if(c.remainders.some((r,i)=>!Number.isInteger(r)||r<0||r>=t.modulus||(t.values[i]!-r)%t.modulus!==0))return false;
 const pairs:[number,number][]=[];for(let i=0;i<t.values.length;i++)for(let j=i+1;j<t.values.length;j++)if(t.values[i]!==t.values[j]&&(t.values[j]!-t.values[i]!)%t.modulus===0)pairs.push([i,j]);
 if(!c.pair)return pairs.length===0;return pairs.some(([i,j])=>i===c.pair![0]&&j===c.pair![1]);
}
export function explicitWitnessLesson(text:string){
 const c=explicitWitnessCertificate(text);if(!c||!verifyExplicitWitnessCertificate(c))return null;const {values,modulus:m}=c.task,steps:CombinatoricsDeduction[]=[];
 const conclusion=c.pair?`Vậy chọn hai số $${values[c.pair[0]]}$ và $${values[c.pair[1]]}$ trong danh sách.`:`Vậy không có hai số phân biệt trong danh sách thỏa yêu cầu; không thể chỉ ra một cặp như đề yêu cầu.`;
 steps.push({title:'Xác định điều kiện để chọn cặp',explanation:`Hai số nguyên có hiệu chia hết cho$${m}$ khi và chỉ khi chúng có cùng số dư khi chia cho$${m}$. Chiều thuận: hiệu là bội của$${m}$ nên hai số cùng dư. Chiều ngược: viết hai số thành$${m}u+r$ và$${m}v+r$, hiệu bằng$${m}(v-u)$. Phải chọn hai giá trị khác nhau, không chỉ hai vị trí ghi cùng một số.`,math:null,reason:'Hai chiều của điều kiện cùng số dư và yêu cầu phân biệt',question:'Hai vị trí đều ghi cùng một giá trị có thỏa hai số phân biệt không?'});
 for(let start=0;start<values.length;start+=8){const end=Math.min(start+8,values.length);
  steps.push({title:`Số dư của các số từ vị trí$${start+1}$ đến$${end}$`,explanation:`Tính số dư không âm từ0 đến$${m-1}$ cho từng số trong bảng. Với số âm cũng dùng số dư không âm; mỗi dòng thỏa số đã cho bằng$${m}$ nhân một số nguyên cộng số dư.`,math:'\\begin{array}{c|r|r}i&a_i&r_i\\\\\\hline '+values.slice(start,end).map((v,j)=>`${start+j+1}&${v}&${c.remainders[start+j]}`).join('\\\\')+'\\end{array}',reason:'Phép chia có dư đúng cả cho số nguyên âm',question:'Số dư ghi ở mỗi dòng có nằm trong khoảng cho phép không?'});
 }
 const pair=c.pair;steps.push({title:pair?'Chọn và kiểm tra nhân chứng cụ thể':'Kiểm tra yêu cầu không thể thực hiện',explanation:pair?`Hai số ở vị trí$${pair[0]+1}$ và$${pair[1]+1}$ cùng số dư$${c.remainders[pair[0]]}$ và khác nhau. Lấy hiệu theo đúng các giá trị của đề và kiểm tra chia hết. ${conclusion}`:`Trong bảng, không có hai giá trị khác nhau có cùng số dư; nếu số dư lặp thì chỉ là cùng một giá trị được ghi lại. Vì điều kiện cùng dư là cần thiết, mọi cặp giá trị khác nhau đều không thể có hiệu chia hết cho$${m}$. ${conclusion}`,math:pair?`${values[pair[1]]}-(${values[pair[0]]})=${values[pair[1]]!-values[pair[0]]!},\\qquad ${values[pair[1]]!-values[pair[0]]!}\\vdots${m}`:null,reason:pair?'Nhân chứng thuộc dữ liệu gốc, khác giá trị và thỏa điều kiện':'Phân loại đủ dữ liệu gốc và dùng điều kiện cần, không bịa nhân chứng',question:pair?'Hai số được nêu cụ thể có xuất hiện trong đề và có hiệu chia hết không?':'Vì sao không được nêu một cặp bên ngoài danh sách?'});
 const lesson=combinatoricsProofLesson(text,'Chỉ ra nhân chứng từ dữ liệu cụ thể','Phân số theo số dư rồi nêu chính hai giá trị, hoặc chứng minh không có cặp.',steps,conclusion);return lesson?{lesson,certificate:c}:null;
}
