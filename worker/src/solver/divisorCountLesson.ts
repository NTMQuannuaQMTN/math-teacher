import {parseMathText} from '../../../shared/src/mathText';
import {algebraProofLesson,type AlgebraDeduction} from './algebraProofLesson';
interface Task {text:string;variable:string;bound:number;inclusive:boolean}
interface Row {value:number;p:number;q:number|null}
export interface DivisorCountCertificate {task:Task;rows:Row[]}
function task(text:string):Task|null {
 const maths:string[]=[];if(text.includes('§'))return null;
 const template=parseMathText(text.trim()).map(s=>s.kind==='math'?`§${maths.push(s.value)-1}§`:s.value).join('').replace(/\s+/g,' ').trim();
 if(/^Tìm tất cả các số nguyên dương có đúng §0§ ước dương và nhỏ hơn §1§\.?$/iu.test(template)&&maths.length===2&&maths[0]!.trim()==='6'&&/^\d+$/u.test(maths[1]!.trim())){
  const bound=Number(maths[1]);return bound>=2&&bound<=1000?{text,variable:'n',bound,inclusive:false}:null;
 }
 const m=/^Tìm (?:tất cả )?số nguyên dương §0§ (?:có|sao cho §1§ có) đúng (?:6|sáu) ước (?:số )?nguyên dương và §([12])§\.?$/iu.exec(template);
 if(!m||maths.length!==Number(m[1])+1)return null;
 const variable=maths[0]!.trim();if(!/^[a-z]$/u.test(variable)||m[1]==='2'&&maths[1]!.trim()!==variable)return null;
 const relation=new RegExp(`^${variable}(<=|\\\\leq?|<)(\\d+)$`).exec(maths[Number(m[1])]!.replace(/\s/g,''));
 if(!relation)return null;const bound=Number(relation[2]);if(bound<2||bound>1000)return null;
 return {text,variable,bound,inclusive:relation[1]!=='<'};
}
const prime=(n:number)=>{if(n<2)return false;for(let d=2;d*d<=n;d++)if(n%d===0)return false;return true;};
export function divisorCountCertificate(text:string):DivisorCountCertificate|null {
 const t=task(text);if(!t)return null;const limit=t.bound-(t.inclusive?0:1),rows:Row[]=[];
 for(let p=2;p<=limit;p++)if(prime(p)){
  if(p**5<=limit)rows.push({value:p**5,p,q:null});
  for(let q=2;p*p*q<=limit;q++)if(q!==p&&prime(q))rows.push({value:p*p*q,p,q});
 }
 rows.sort((a,b)=>a.value-b.value);if(rows.length>80)return null;return {task:t,rows};
}
/** Independent divisor enumeration checks every integer in the requested finite range.
 * The displayed prime-factor argument explains why these are all cases. */
export function verifyDivisorCountCertificate(c:DivisorCountCertificate):boolean {
 const t=task(c.task.text);if(!t||JSON.stringify(t)!==JSON.stringify(c.task))return false;
 const expected:number[]=[];for(let n=1;n<=t.bound-(t.inclusive?0:1);n++){
  let count=0;for(let d=1;d<=n;d++)if(n%d===0)count++;
  if(count===6)expected.push(n);
 }
 if(expected.join(',')!==c.rows.map(r=>r.value).join(','))return false;
 return c.rows.every(r=>prime(r.p)&&(r.q===null?r.value===r.p**5:prime(r.q)&&r.q!==r.p&&r.value===r.p*r.p*r.q));
}
export function divisorCountLesson(text:string) {
 const c=divisorCountCertificate(text);if(!c||!verifyDivisorCountCertificate(c))return null;
 const {variable:n,bound,inclusive}=c.task,P=['p','q','r'].find(v=>v!==n)!,Q=['q','r','s'].find(v=>![n,P].includes(v))!,limit=bound-(inclusive?0:1),details:AlgebraDeduction[]=[];
 details.push({title:'Đếm ước từ phân tích thành thừa số nguyên tố',explanation:`Gọi số nguyên dương cần tìm là $${n}$. Nếu $${n}=p_1^{e_1}p_2^{e_2}\\cdots p_s^{e_s}$, mỗi ước dương có đúng dạng $p_1^{f_1}p_2^{f_2}\\cdots p_s^{f_s}$ với $0\\le f_i\\le e_i$. Mỗi số mũ có $e_i+1$ cách chọn; các lựa chọn độc lập nên số ước là tích bên dưới. Số1 chỉ có một ước, nên không được nhận.`,math:`(e_1+1)(e_2+1)\\cdots(e_s+1)=6`,reason:'Phân tích nguyên tố duy nhất; đếm mỗi ước qua các số mũ',question:'Vì sao mỗi lựa chọn số mũ cho đúng một ước và không bỏ sót ước nào?'});
 details.push({title:'Phân loại đầy đủ các số có đúng sáu ước',explanation:`Các thừa số $e_i+1$ đều ít nhất2. Số6 chỉ có hai cách phân tích thành tích các số nguyên ít nhất2: một thừa số6 hoặc hai thừa số3 và2; ba thừa số trở lên cho tích ít nhất8. Vậy số cần tìm có dạng $${P}^5$ hoặc $${P}^2${Q}$, trong đó $${P},${Q}$ là hai số nguyên tố khác nhau. Ngược lại hai dạng này có lần lượt6 và $3\\cdot2=6$ ước. Không được lấy $${P}=${Q}$, vì khi đó thành $${P}^3$ chỉ có4 ước.`,math:`${n}\\in\\{${P}^5,${P}^2${Q}\\},\\quad ${P}\\ne ${Q}`,reason:'Hai cách phân tích6 thành tích các số nguyên ít nhất2; điều kiện cần và đủ',question:'Tại sao không có dạng thứ ba và tại sao phải yêu cầu hai số nguyên tố khác nhau?'});
 const fifth=c.rows.filter(r=>r.q===null);
 details.push({title:'Xét dạng một thừa số nguyên tố',explanation:`Điều kiện $${P}^5\\le${limit}$ giới hạn số nguyên tố $${P}$. ${fifth.length?`Các giá trị được nhận là ${fifth.map(r=>`$${P}=${r.p}$ cho $${n}=${r.value}$`).join('; ')}.`:'Không có giá trị: ngay số nguyên tố nhỏ nhất2 cũng có lũy thừa bậc5 vượt giới hạn.'} Mọi số nguyên tố lớn hơn giá trị cuối cùng đã xét có lũy thừa bậc5 lớn hơn giới hạn.`,math:`${P}^5\\le${limit}`,reason:'Lũy thừa bậc5 tăng với số dương; kiểm tra tất cả số nguyên tố trong giới hạn',question:'Giới hạn của đề cho phép những giá trị nguyên tố nào trong dạng thứ nhất?'});
 const maxP=Math.floor(Math.sqrt(limit/2)),ps=Array.from({length:Math.max(0,maxP-1)},(_,i)=>i+2).filter(prime);
 details.push({title:'Giới hạn từng số nguyên tố trong dạng hai thừa số',explanation:`Vì $${Q}\\ge2$, từ $${P}^2${Q}\\le${limit}$ suy ra $2${P}^2\\le${limit}$. Do đó chỉ cần xét $${P}\\in\\{${ps.join(',')}\\}$. Với mỗi $${P}$, xét tất cả số nguyên tố $${Q}\\le\\lfloor${limit}/${P}^2\\rfloor$ và bỏ $${Q}=${P}$. Các giới hạn này suy ra từ đề, nên không phải thử một số ứng viên rồi đoán đầy đủ.`,math:`2${P}^2\\le${limit},\\qquad ${Q}\\le\\left\\lfloor\\frac{${limit}}{${P}^2}\\right\\rfloor`,reason:'Cả hai thừa số đều nguyên tố ít nhất2; giới hạn hữu hạn bao quát mọi trường hợp',question:`Nếu một nghiệm bị bỏ sót, nó có thể có $${P}$ hoặc $${Q}$ vượt giới hạn vừa chứng minh không?`});
 for(let start=0;start<ps.length;start+=6){const group=ps.slice(start,start+6);details.push({title:'Liệt kê mọi lựa chọn nguyên tố trong giới hạn',explanation:group.map(p=>{const rows=c.rows.filter(r=>r.p===p&&r.q!==null);return `$${P}=${p}$: $${Q}\\le${Math.floor(limit/(p*p))}$; ${rows.length?`nhận $${Q}\\in\\{${rows.map(r=>r.q).join(',')}\\}$, cho $${n}\\in\\{${rows.map(r=>r.value).join(',')}\\}$`:`không có số nguyên tố $${Q}$ khác $${P}$ trong giới hạn`}.`;}).join('\n'),math:null,reason:`Liệt kê toàn bộ số nguyên tố dưới từng giới hạn, loại $${Q}=${P}$`,question:`Danh sách $${Q}$ cho mỗi $${P}$ có giữ điều kiện nguyên tố và khác nhau không?`});}
 const answer=c.rows.length?`Vậy tất cả số nguyên dương cần tìm là $${n}\\in\\{${c.rows.map(r=>r.value).join(',')}\\}$.`:'Vậy không có số nguyên dương thỏa mãn.';
 details.push({title:'Đối chiếu cả số ước và giới hạn rồi kết luận',explanation:`Mỗi số trong danh sách có một trong hai phân tích đã chứng minh, nên có đúng6 ước dương, và đều $${n}${inclusive?'\\le':'<'}${bound}$. Mọi số thỏa mãn phải thuộc một trong hai dạng và đã được liệt kê theo giới hạn của đề. ${answer}`,math:null,reason:'Kiểm tra điều kiện đủ và chứng minh danh sách bao quát điều kiện cần',question:'Đã kiểm tra mỗi số và chứng minh không còn số nào ngoài danh sách chưa?'});
 const lesson=algebraProofLesson(text,'Sáu ước dương: phân loại rồi liệt kê đầy đủ','Dùng phân tích nguyên tố, suy ra hai dạng và giới hạn trước khi xét mọi trường hợp.',details,answer,{givens:['Số cần tìm có đúng6 ước dương.',`$${n}${inclusive?'\\le':'<'}${bound}$`],unknowns:[`Tất cả số nguyên dương $${n}$.`],constraints:[`Các thừa số $${P},${Q}$ là nguyên tố; dạng $${P}^2${Q}$ phải có $${P}\\ne ${Q}$.`]});
 if(!lesson)return null;lesson.analysis.topic='number_theory';return {lesson,certificate:c};
}
