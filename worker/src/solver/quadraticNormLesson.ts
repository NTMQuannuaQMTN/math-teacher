import {parseMathText} from '../../../shared/src/mathText';
import {exactArithmeticIdentity} from '../../../shared/src/polynomialIdentity';
import {algebraProofLesson,type AlgebraDeduction} from './algebraProofLesson';
interface NormTask {text:string;variables:[string,string];kind:'fixed'|'multiple'|'gcd';fixed:number|null;gcdName:string|null}
export interface NormCertificate {task:NormTask;divisors:number[];solutions:number[][]}
function normTask(text:string):NormTask|null {
 const maths:string[]=[];if(text.includes('§'))return null;
 const template=parseMathText(text.trim()).map(s=>s.kind==='math'?`§${maths.push(s.value)-1}§`:s.value).join('').replace(/\s+/g,' ').trim();
 const prefix=/^Cho các số nguyên dương §0§ thỏa mãn: §1§ chia hết cho tích §2§ \(1\)\. (.+)$/iu.exec(template),vars=/^([a-z])\s*,\s*([a-z])$/u.exec(maths[0]??'');
 if(!prefix||!vars||vars[1]===vars[2])return null;
 const [m,n]=[vars[1]!,vars[2]!],norm=exactArithmeticIdentity(maths[1]!,`${m}^2+${m}+${n}^2`),product=exactArithmeticIdentity(maths[2]!,`${m}*${n}`);
 if(!norm?.valid||!product?.valid||norm.denominators.length||product.denominators.length)return null;
 if(prefix[1]==='Chứng minh không tồn tại §3§ thỏa mãn (1) khi §4§.'&&maths.length===5&&maths[3]!.replace(/\s/g,'')===`${m},${n}`){
  const fixed=new RegExp(`^${n}\\s*=\\s*(\\d+)$`).exec(maths[4]!);if(!fixed)return null;const value=Number(fixed[1]);if(value<1||value>100)return null;return {text,variables:[m,n],kind:'fixed',fixed:value,gcdName:null};
 }
 if(prefix[1]==='Tìm §3§ thỏa mãn (1) biết §4§ chia hết cho §5§.'&&maths.length===6&&maths[3]!.replace(/\s/g,'')===`${m},${n}`&&maths[4]!.trim()===m&&maths[5]!.trim()===n)return {text,variables:[m,n],kind:'multiple',fixed:null,gcdName:null};
 if(prefix[1]==='Ký hiệu §3§ là ước chung lớn nhất của §4§ và §5§. Chứng minh nếu §6§ thỏa mãn (1) thì §7§.'&&maths.length===8){
  const d=maths[3]!.trim();if(!/^[a-z]$/u.test(d)||[m,n].includes(d)||maths[4]!.trim()!==m||maths[5]!.trim()!==n||maths[6]!.replace(/\s/g,'')!==`${m},${n}`)return null;
  const conclusion=exactArithmeticIdentity(maths[7]!.split('=')[1]??'',`${d}^2`);if(maths[7]!.split('=')[0]?.trim()!==m||!conclusion?.valid||conclusion.denominators.length)return null;
  return {text,variables:[m,n],kind:'gcd',fixed:null,gcdName:d};
 }
 return null;
}
export function normCertificate(text:string):NormCertificate|null {
 const task=normTask(text);if(!task)return null;
 if(task.kind!=='fixed')return {task,divisors:[],solutions:task.kind==='multiple'?[[1,1],[4,2]]:[]};
 const n=task.fixed!,divisors:number[]=[],solutions:number[][]=[];
 for(let m=1;m<=n*n;m++)if(n*n%m===0){divisors.push(m);if((m*m+m+n*n)%(m*n)===0)solutions.push([m,n]);}
 if(divisors.length>48)return null;return {task,divisors,solutions};
}
export function verifyNormCertificate(c:NormCertificate):boolean {
 try{
  const t=normTask(c.task.text);if(!t||JSON.stringify(t)!==JSON.stringify(c.task))return false;
  if(t.kind==='fixed'){
   const n=t.fixed!,expected:number[]=[],solutions:number[][]=[];
   for(let m=1;m*m<=n*n;m++)if(n*n%m===0){expected.push(m);if(m*m!==n*n)expected.push(n*n/m);}
   expected.sort((a,b)=>a-b);for(const m of expected)if((BigInt(m)**2n+BigInt(m)+BigInt(n)**2n)%(BigInt(m)*BigInt(n))===0n)solutions.push([m,n]);
   return expected.join(',')===c.divisors.join(',')&&JSON.stringify(solutions)===JSON.stringify(c.solutions);
  }
  if(c.divisors.length)return false;
  if(t.kind==='multiple')return JSON.stringify(c.solutions)===JSON.stringify([[1,1],[4,2]])&&c.solutions.every(([m,n])=>(m!)%(n!)===0&&((m!)*(m!)+(m!)+(n!)*(n!))%((m!)*(n!))===0);
  return !c.solutions.length;
 }catch{return false;}
}
export function quadraticNormLesson(text:string) {
 const c=normCertificate(text);if(!c||!verifyNormCertificate(c))return null;
 const [m,n]=c.task.variables,details:AlgebraDeduction[]=[];let answer:string;
 if(c.task.kind==='fixed'){
  const N=c.task.fixed!;
  if(c.solutions.length){const [M]=c.solutions[0]!,value=M!*M!+M!+N*N;
   answer=`Vậy khẳng định không tồn tại trong đề là sai: $(${m},${n})=(${M},${N})$ là một cặp nguyên dương thỏa điều kiện.`;
   details.push({title:'Nêu một cặp cụ thể và kiểm tra từng giả thiết',explanation:`Chọn $${m}=${M}$, $${n}=${N}$, đều nguyên dương và đúng giá trị cố định. Khi đó $${m}^2+${m}+${n}^2=${value}$, còn $${m}${n}=${M!*N}$. Thương bằng $${value/(M!*N)}$, là số nguyên. ${answer}`,math:`${value}=(${M!*N})\\cdot${value/(M!*N)}`,reason:'Một nhân chứng thỏa mọi giả thiết bác bỏ mệnh đề không tồn tại',question:'Cặp cụ thể có thỏa giá trị cố định và phép chia hết không?'});
  }else{
   details.push({title:'Từ chia hết cho tích, chặn tập ứng viên bằng một ước cố định',explanation:`Vì $${m}${n}$ là ước của biểu thức nên $${m}$ cũng là ước của biểu thức. Trừ $${m}^2+${m}$, đều chia hết cho $${m}$, được $${n}^2$ chia hết cho $${m}$. Với $${n}=${N}$, suy ra $${m}$ là một ước dương của $${N*N}$; vì $${m}>0$, các ứng viên đều được liệt kê bên dưới.`,math:`${N*N}\\vdots ${m},\\quad ${m}\\in\\{${c.divisors.join(',')}\\}`,reason:'Ước của tích; trừ các bội; liệt kê hết ước dương của số cố định',question:'Tại sao m chỉ có thể là một ước dương của bình phương n?'});
   for(let i=0;i<c.divisors.length;i+=6){const ds=c.divisors.slice(i,i+6);details.push({title:'Kiểm tra từng ứng viên trong điều kiện gốc',explanation:`Thay $${n}=${N}$ và từng giá trị $${m}$ vào cả tử và tích. Mỗi dòng bên dưới đều có số dư khác0 khi chia biểu thức cho tích, nên đều bị loại.`,math:`\\begin{gathered}${ds.map(M=>`${m}=${M}:\\quad ${M*M+M+N*N}\\not\\vdots ${M*N}`).join('\\\\')}\\end{gathered}`,reason:'Thử tất cả ứng viên trong chính điều kiện gốc, không chỉ điều kiện cần',question:'Có ứng viên nào làm phép chia cho tích cho thương nguyên không?'});}
   answer=`Vậy không tồn tại cặp số nguyên dương thỏa điều kiện khi $${n}=${N}$.`;details.push({title:'Kết luận từ tập ứng viên đã xét đầy đủ',explanation:`Mọi cặp hợp lệ phải cho một trong các ước vừa xét, nhưng tất cả đều vi phạm điều kiện gốc. ${answer}`,math:null,reason:'Điều kiện cần bao quát và loại hết từng ứng viên',question:'Vì sao không còn m lớn hơn những ứng viên trong bảng?'});
  }
 }else if(c.task.kind==='multiple'){
  const k=['k','t','u','v'].find(v=>![m,n].includes(v))!;
  details.push({title:'Dùng giả thiết một ẩn chia hết cho ẩn kia',explanation:`Vì $${m}$ chia hết cho $${n}$ và cả hai nguyên dương, đặt $${m}=${k}${n}$ với $${k}$ nguyên dương. Từ điều kiện chia hết cho tích, $${m}$ là ước của $${n}^2$, nên $${k}${n}$ là ước của $${n}^2$; triệt tiêu $${n}\\ne0$ cho $${n}$ chia hết cho $${k}$.`,math:`${m}=${k}${n},\\quad ${n}^2\\vdots ${k}${n}\\Rightarrow ${n}\\vdots ${k}`,reason:'Tách bội nguyên dương; trừ các bội của m; triệt tiêu nhân tử khác0',question:'Sau đặt m là bội của n, điều kiện chia hết buộc k là ước của số nào?'});
  details.push({title:'Suy ra điều kiện chia hết ngược lại',explanation:`Tích $${m}${n}=${k}${n}^2$ là ước của biểu thức, nên $${n}^2$ cũng là ước của biểu thức. Sau thay $${m}=${k}${n}$, trừ các hạng tử $${k}^2${n}^2+${n}^2$, suy ra $${n}^2$ là ước của $${k}${n}$, hay $${k}$ chia hết cho $${n}$. Hai số nguyên dương chia hết cho nhau phải bằng nhau, nên $${k}=${n}$ và $${m}=${n}^2$.`,math:`${k}${n}\\vdots ${n}^2\\Rightarrow ${k}\\vdots ${n},\\quad ${k}=${n},\\quad ${m}=${n}^2`,reason:'Trừ các bội của n²; hai số nguyên dương là ước của nhau thì bằng nhau',question:'Vì sao hai điều kiện chia hết ngược chiều buộc k=n?'});
  details.push({title:'Giảm điều kiện ban đầu và thử lại từng cặp',explanation:`Thay $${m}=${n}^2$, biểu thức là $${n}^4+2${n}^2$, tích là $${n}^3$. Chia hết tương đương $${n}^2+2$ chia hết cho $${n}$, hay $2$ chia hết cho $${n}$. Vì $${n}$ nguyên dương nên $${n}=1$ hoặc $2$, cho các cặp $(1,1)$ và $(4,2)$. Thử lại: cặp đầu cho tử3, tích1; cặp sau cho tử24, tích8, đều chia hết.`,math:`${n}^4+2${n}^2\\vdots ${n}^3\\Longleftrightarrow 2\\vdots ${n}\\Longleftrightarrow ${n}\\in\\{1,2\\}`,reason:'Triệt tiêu nhân tử khác0; trừ bội; xét hết các ước dương của2 và kiểm tra lại',question:'Khi m=n², vì sao n chỉ có thể là1 hoặc2?'});
  answer=`Vậy tất cả các cặp cần tìm là $(${m},${n})=(1,1)$ hoặc $(4,2)$.`;details.push({title:'Kết luận đầy đủ',explanation:`Mọi nghiệm đều buộc phải thuộc hai cặp vừa suy ra; cả hai cặp đã được kiểm tra với điều kiện gốc và giả thiết chia hết bổ sung. ${answer}`,math:null,reason:'Điều kiện cần và đủ; đối chiếu mọi giả thiết',question:'Đã thử lại cả hai điều kiện trên từng cặp và loại hết khả năng khác chưa?'});
 }else{
  const d=c.task.gcdName!,aux=['x','y','u','v','a','b'].filter(v=>![m,n,d].includes(v)),x=aux[0]!,y=aux[1]!;
  details.push({title:'Tách đúng ước chung lớn nhất',explanation:`Đặt $${m}=${d}${x}$, $${n}=${d}${y}$, với $${d},${x},${y}$ nguyên dương và $\\gcd(${x},${y})=1$. Nếu hai số sau tách còn có một ước chung lớn hơn1 thì $${d}$ không phải ước chung lớn nhất, mâu thuẫn định nghĩa.`,math:`${m}=${d}${x},\\quad ${n}=${d}${y},\\quad\\gcd(${x},${y})=1`,reason:'Định nghĩa ước chung lớn nhất; sau chia cho nó, hai số nguyên tố cùng nhau',question:'Sau tách ước chung lớn nhất, vì sao hai số mới nguyên tố cùng nhau?'});
  details.push({title:'Chứng minh x là ước của d',explanation:`Điều kiện gốc suy ra $${m}$ là ước của $${n}^2$ sau khi trừ $${m}^2+${m}$. Thay đổi biến và triệt tiêu $${d}$ cho $${x}$ là ước của $${d}${y}^2$. Vì $\\gcd(${x},${y})=1$, không nguyên tố nào của $${x}$ là ước của $${y}^2$; vì vậy mọi lũy thừa nguyên tố của $${x}$ phải nằm trong $${d}$. Suy ra $${x}$ là ước của $${d}$.`,math:`${d}${y}^2\\vdots ${x},\\quad\\gcd(${x},${y}^2)=1\\Rightarrow ${d}\\vdots ${x}`,reason:'Ước của tích và trừ bội; nguyên tố cùng nhau; phân tích thừa số nguyên tố',question:'Nếu x nguyên tố cùng nhau với y² nhưng là ước của d·y², thừa số của x phải nằm ở đâu?'});
  details.push({title:'Chứng minh d là ước của x bằng điều kiện đầy đủ',explanation:`Tích $${m}${n}=${d}^2${x}${y}$ là ước của biểu thức nên $${d}^2$ là ước của biểu thức. Thay đổi biến được $${d}^2${x}^2+${d}${x}+${d}^2${y}^2$. Trừ hai hạng tử có nhân tử $${d}^2$, suy ra $${d}${x}$ chia hết cho $${d}^2$. Triệt tiêu $${d}\\ne0$ cho $${x}$ chia hết cho $${d}$.`,math:`${d}^2${x}^2+${d}${x}+${d}^2${y}^2\\vdots ${d}^2\\Rightarrow ${d}${x}\\vdots ${d}^2\\Rightarrow ${x}\\vdots ${d}`,reason:'Dùng ước d² của tích; trừ các bội; triệt tiêu d khác0',question:'Hạng tử nào còn lại khi trừ hai bội của d²?'});
  answer=`Vậy $${m}=${d}^2$, đúng với mọi cặp nguyên dương thỏa điều kiện.`;details.push({title:'Kết luận từ hai điều kiện chia hết',explanation:`Hai số nguyên dương $${x},${d}$ chia hết cho nhau nên bằng nhau: $${x}=${d}$. Thay vào $${m}=${d}${x}$ cho $${m}=${d}^2$. ${answer}`,math:`${x}=${d}\\Rightarrow ${m}=${d}^2`,reason:'Hai số nguyên dương là ước của nhau thì bằng nhau; thay lại đổi biến',question:'Tại sao không chỉ biết x≤d mà xác định được x=d?'});
 }
 const lesson=algebraProofLesson(text,'Chia hết biểu thức bậc hai và ước chung','Giữ miền nguyên dương, dùng các ước bắt buộc của tích và trừ bội để suy ra điều kiện hai chiều.',details,answer,{givens:[`$${m},${n}$ nguyên dương.`,`$${m}^2+${m}+${n}^2\\vdots ${m}${n}$`],unknowns:['Kết luận đúng theo đúng phần hỏi của đề.'],constraints:['Các ẩn và thương chia hết đều là số nguyên; chỉ triệt tiêu nhân tử khác0.']});
 if(!lesson)return null;lesson.analysis.topic='number_theory';return {lesson,certificate:c};
}
