import {parseMathText} from '../../../shared/src/mathText';
import {algebraProofLesson,type AlgebraDeduction} from './algebraProofLesson';
interface Task {text:string;kind:'zeros'|'exponent';n:number;denominators:number[];expression:string;prime:number;variable:string}
interface Row {power:number;numerator:number;denominators:number[];net:number}
export interface FactorialExponentCertificate {task:Task;rows:Row[];exponent:number}
const isPrime=(p:number)=>{if(p<2)return false;for(let d=2;d*d<=p;d++)if(p%d===0)return false;return true;};
function parseTask(text:string):Task|null {
 if(text.includes('§'))return null;const maths:string[]=[];
 const template=parseMathText(text.trim()).map(s=>s.kind==='math'?`§${maths.push(s.value)-1}§`:s.value).join('').replace(/\s+/g,' ').trim();
 const zeros=/^Tìm số chữ số §0§ tận cùng của §1§\.?$/iu.test(template)&&maths.length===2&&maths[0]!.trim()==='0';
 const exponent=/^Tìm số nguyên không âm §0§ lớn nhất sao cho §1§ chia hết cho §2§\.?$/iu.test(template)&&maths.length===3;
 if(!zeros&&!exponent)return null;
 const variable=zeros?'k':maths[0]!.trim();if(!/^[a-z]$/u.test(variable))return null;
 let prime=5;
 if(exponent){const m=new RegExp(`^(\\d+)\\^(?:${variable}|\\{${variable}\\})$`).exec(maths[2]!.replace(/\s/g,''));if(!m)return null;prime=Number(m[1]);if(prime>1000||!isPrime(prime))return null;}
 const expression=maths[1]!,clean=expression.replace(/\s/g,'');let n:number,denominators:number[]=[];
 const factorial=/^(\d+)!$/u.exec(clean);
 if(factorial)n=Number(factorial[1]);
 else{
  // Only an integer binomial quotient is admitted. An arbitrary rational
  // factorial quotient cannot be treated as an integer divisibility task.
  const quotient=/^\\(?:dfrac|frac)\{(\d+)!\}\{(\d+)!(?:\\cdot|\\times)?(\d+)!\}$/u.exec(clean);
  if(!quotient||zeros)return null;n=Number(quotient[1]);denominators=[Number(quotient[2]),Number(quotient[3])];
  if((denominators[0]!)+(denominators[1]!) !== n)return null;
 }
 if(!Number.isSafeInteger(n)||n<0||n>10000)return null;
 return {text,kind:zeros?'zeros':'exponent',n,denominators,expression,prime,variable};
}
export function factorialExponentCertificate(text:string):FactorialExponentCertificate|null {
 const task=parseTask(text);if(!task)return null;const rows:Row[]=[];
 for(let power=task.prime;power<=task.n;power*=task.prime){
  const numerator=Math.floor(task.n/power),denominators=task.denominators.map(n=>Math.floor(n/power));
  rows.push({power,numerator,denominators,net:numerator-denominators.reduce((a,b)=>a+b,0)});
 }
 return {task,rows,exponent:rows.reduce((sum,row)=>sum+row.net,0)};
}
/** Independent check factors each individual integer, instead of using the
 * floor-sum algorithm. The finite interval is exactly the defined factorial. */
export function verifyFactorialExponentCertificate(c:FactorialExponentCertificate):boolean {
 const task=parseTask(c.task.text);if(!task||JSON.stringify(task)!==JSON.stringify(c.task))return false;
 const factorCount=(n:number,p:number)=>{let count=0;for(let i=1;i<=n;i++){let value=i;while(value%p===0){count++;value/=p;}}return count;};
 const expected=factorCount(task.n,task.prime)-task.denominators.reduce((sum,n)=>sum+factorCount(n,task.prime),0);
 if(!Number.isSafeInteger(c.exponent)||c.exponent<0||c.exponent!==expected)return false;
 let power=task.prime;
 for(const row of c.rows){
  if(power>task.n||row.power!==power||row.numerator!==Math.floor(task.n/power)||row.denominators.length!==task.denominators.length)return false;
  if(row.denominators.some((v,i)=>v!==Math.floor(task.denominators[i]!/power))||row.net!==row.numerator-row.denominators.reduce((a,b)=>a+b,0))return false;
  power*=task.prime;
 }
 if(power<=task.n||c.rows.reduce((sum,r)=>sum+r.net,0)!==expected)return false;
 if(task.kind==='zeros'&&factorCount(task.n,2)<expected)return false;
 return true;
}
export function factorialExponentLesson(text:string){
 const c=factorialExponentCertificate(text);if(!c||!verifyFactorialExponentCertificate(c))return null;
 const {n,prime:p,expression,denominators,kind,variable:k}=c.task,J=k==='j'?'i':'j',details:AlgebraDeduction[]=[];
 details.push({title:'Giữ đúng ý nghĩa giai thừa và điều kiện chia hết',explanation:`Với số nguyên không âm $N$, ký hiệu $N!$ là tích các số từ1 đến $N$; quy ước $0!=1$. ${denominators.length?`Đề cho $${denominators[0]}+${denominators[1]}=${n}$. Khi xếp $${n}$ phần tử phân biệt, ${n===0?'có đúng một thứ tự của tập rỗng, bằng $0!=1$':`vị trí đầu có $${n}$ cách chọn, vị trí sau còn $${n-1}$ cách, rồi tiếp tục; quy tắc nhân cho $${n}!$ thứ tự`}. Lấy $${denominators[0]}$ vị trí đầu làm nhóm được chọn. Với một nhóm cố định, sắp xếp trong nhóm đầu có $${denominators[0]}!$ cách, nhóm còn lại có $${denominators[1]}!$ cách. Vì vậy mỗi nhóm được đếm đúng $${denominators[0]}!${denominators[1]}!$ lần. Vì vậy thương trong đề là số nguyên, rồi mới xét chia hết.`:'Ta xét đúng toàn bộ thừa số của giai thừa, không thay bằng một vài giá trị thử.'} ${kind==='zeros'?'Một chữ số0 tận cùng tương ứng một thừa số10, tức một cặp thừa số2 và5.':'Cần đếm chính xác số lần thừa số nguyên tố xuất hiện trong phân tích của biểu thức.'}`,math:denominators.length?`${expression}\\in\\mathbb Z`:null,reason:'Định nghĩa giai thừa; phân tích nguyên tố; kiểm tra biểu thức là số nguyên',question:'Biểu thức là số nguyên vì sao, và điều kiện của đề đòi hỏi đếm thừa số nào?'});
 if(n>0)details.push({title:`Đếm các bội của $${p}$ và của những lũy thừa tiếp theo`,explanation:`Mỗi số từ1 đến $${n}$ chia hết cho $${p}$ đóng góp ít nhất một thừa số $${p}$. Số chia hết cho $${p}^2$ đóng góp thêm một; số chia hết cho $${p}^3$ đóng góp thêm một nữa, và cứ tiếp tục. Một số có đúng $${J}$ thừa số $${p}$ được đếm đúng ở $${J}$ mức, nên không thiếu hoặc đếm thừa. Các bội của $${p}^${J}$ là $${p}^${J},2\\cdot${p}^${J},\\ldots$, có đúng $\\lfloor${n}/${p}^${J}\\rfloor$ số. Khi lũy thừa vượt $${n}$, không còn bội nào.`,math:`\\left\\lfloor\\frac{${n}}{${p}}\\right\\rfloor+\\left\\lfloor\\frac{${n}}{${p}^2}\\right\\rfloor+\\cdots`,reason:'Mỗi mức lũy thừa đếm đúng một thừa số nguyên tố bổ sung; giới hạn suy ra từ định nghĩa tích',question:`Vì sao một bội của $${p}^3$ phải được đếm ở cả ba mức, và vì sao phép đếm dừng?`});
 if(denominators.length)details.push({title:'Trừ đúng những thừa số đã có trong mẫu',explanation:`Tích của thương với hai giai thừa ở mẫu bằng giai thừa ở tử. Phân tích nguyên tố duy nhất cho số thừa số $${p}$ của thương bằng số ở tử trừ tổng số ở hai giai thừa mẫu. Áp dụng phép đếm vừa chứng minh cho từng giai thừa; bảng sau ghi riêng mỗi lượng và hiệu.`,math:null,reason:'Số mũ nguyên tố cộng khi nhân; thương đã chứng minh là số nguyên',question:'Tại mỗi mức, cần trừ số bội ở những giai thừa mẫu nào?'});
 for(let start=0;start<c.rows.length;start+=6){const rows=c.rows.slice(start,start+6);details.push({title:'Tính từng mức lũy thừa và phần đóng góp',explanation:`Gọi $E_{${J}}$ là phần đóng góp ở mức lũy thừa thứ $${J}$. Mỗi hàng dùng phép chia lấy phần nguyên ở từng giai thừa. ${denominators.length?'Cột cuối trừ cả hai lượng ở mẫu.':'Cột cuối chính là số bội ở giai thừa.'} Cộng các đóng góp; không bỏ những thừa số có nhiều lần chia hết.`,math:`\\begin{array}{c|${'c'.repeat(denominators.length+2)}}${p}^${J}&\\lfloor${n}/${p}^${J}\\rfloor${denominators.map(d=>`&\\lfloor${d}/${p}^${J}\\rfloor`).join('')}&E_${J}\\\\\\hline ${rows.map(r=>`${r.power}&${r.numerator}${r.denominators.map(v=>`&${v}`).join('')}&${r.net}`).join('\\\\')}\\end{array}`,reason:'Phép chia có dư; mỗi hàng thể hiện số thừa số bổ sung',question:'Các phép chia lấy phần nguyên và phép trừ ở từng hàng cho kết quả nào?'});}
 if(!c.rows.length)details.push({title:'Xét trường hợp chưa có thừa số nguyên tố cần đếm',explanation:`Ta có $${p}>${n}$, nên không số nào trong tích từ1 đến $${n}$ là bội của $${p}$. ${n===0?'Theo quy ước, $0!=1$.':''} Vì vậy số thừa số $${p}$ là0, không cần tạo một bảng có hàng giả.`,math:null,reason:'Số nguyên tố cần đếm vượt mọi thừa số của tích',question:'Có thừa số nào của tích chia hết cho số nguyên tố đang xét không?'});
 if(kind==='zeros')details.push({title:'Chứng minh đủ thừa số2 để ghép với tất cả thừa số5',explanation:`Ở mỗi mức $${J}\\ge1$, ta có $2^${J}<5^${J}$, nên $\\lfloor${n}/2^${J}\\rfloor\\ge\\lfloor${n}/5^${J}\\rfloor$. Cộng các mức cho số thừa số2 ít nhất bằng số thừa số5. Mỗi thừa số5 ghép được với một thừa số2 để tạo10; sau khi dùng hết5, phần còn lại không chia hết cho5 nên không thể thêm chữ số0 tận cùng.`,math:null,reason:'So sánh số bội ở từng mức; số thừa số10 bằng số nhỏ hơn giữa thừa số2 và5',question:'Vì sao không thiếu thừa số2, và vì sao không thể có thêm một chữ số0?'});
 const answer=kind==='zeros'?`Vậy $${expression}$ có đúng $${c.exponent}$ chữ số0 tận cùng.`:`Vậy số nguyên không âm lớn nhất cần tìm là $${k}=${c.exponent}$.`;
 details.push({title:'Chứng minh tính lớn nhất rồi kết luận',explanation:`${c.rows.length?`Cộng các đóng góp đã tính: $${c.rows.map(r=>r.net).join('+')}=${c.exponent}$.`:`Tổng số thừa số bằng0.`} Phân tích nguyên tố của $${expression}$ chứa đúng $${c.exponent}$ thừa số $${p}$. ${kind==='zeros'?'Lập luận ghép thừa số2 và5 đã chứng minh số chữ số0 đúng bằng lượng này.':`Do đó biểu thức chia hết cho $${p}^{${c.exponent}}$ nhưng không chia hết cho $${p}^{${c.exponent+1}}$; điều này chứng minh cả việc đạt giá trị và không thể tăng thêm.`} ${answer}`,math:null,reason:'Phân tích nguyên tố duy nhất; đếm chính xác và chứng minh không thể tăng số mũ',question:'Đã chứng minh vừa chia hết ở số mũ tìm được, vừa không chia hết ở số mũ kế tiếp chưa?'});
 const lesson=algebraProofLesson(text,'Giai thừa và số mũ nguyên tố','Đếm số bội ở từng mức lũy thừa, giữ đúng thương nguyên và chứng minh số mũ lớn nhất.',details,answer,{givens:[`$${expression}$`],unknowns:[kind==='zeros'?'Số chữ số0 tận cùng.':`Số nguyên không âm lớn nhất $${k}$.`],constraints:['Chỉ xét đúng biểu thức nguyên của đề; không suy rộng từ các giá trị thử.']});
 if(!lesson)return null;lesson.analysis.topic='number_theory';return {lesson,certificate:c};
}
