import {parseMathText} from '../../../shared/src/mathText';
import {integerPolynomial} from '../../../shared/src/integerPolynomial';
import {algebraProofLesson,type AlgebraDeduction} from './algebraProofLesson';
type GcdTask={kind:'affine';text:string;variable:string;offsets:[number,number];domain:'integer'|'natural'|'positive'}|{kind:'pair';text:string;variables:[string,string];gcd:number;lcm:number};
export type GcdCertificate={task:Extract<GcdTask,{kind:'affine'}>;difference:number;values:number[];witnesses:number[];minimum:number|null}|{task:Extract<GcdTask,{kind:'pair'}>;ratio:number|null;pairs:number[][]};
const gcd=(a:number,b:number):number=>{a=Math.abs(a);b=Math.abs(b);while(b){const r=a%b;a=b;b=r;}return a;};
const sign=(n:number)=>n>=0?`+${n}`:String(n);
function gcdTask(text:string):GcdTask|null {
 const maths:string[]=[];if(text.includes('§'))return null;
 const template=parseMathText(text.trim()).map(s=>s.kind==='math'?`§${maths.push(s.value)-1}§`:s.value).join('').replace(/\s+/g,' ').trim();
 const affine=/^Cho (số nguyên|số nguyên dương|số tự nhiên) §0§\. Tìm tất cả các giá trị có thể của ước chung lớn nhất của §1§ và §2§\.?$/iu.exec(template);
 if(affine&&maths.length===3&&/^[a-z]$/u.test(maths[0]!.trim())){
  const variable=maths[0]!.trim(),ps=maths.slice(1).map(s=>integerPolynomial(s,variable));
  if(ps.some(p=>!p||p.coefficients.length!==2||p.coefficients[1]!==1n||p.coefficients[0]!>1000n||p.coefficients[0]!< -1000n))return null;
  return {kind:'affine',text,variable,offsets:ps.map(p=>Number(p!.coefficients[0])) as [number,number],domain:affine[1]!.toLowerCase()==='số nguyên'?'integer':affine[1]!.toLowerCase()==='số tự nhiên'?'natural':'positive'};
 }
 const pair=/^Tìm (?:tất cả )?(?:các )?cặp số nguyên dương §0§ có ước chung lớn nhất bằng §1§ và bội chung nhỏ nhất bằng §2§\.?$/iu.exec(template);
 const vars=maths[0]?/^\(?\s*([a-z])\s*,\s*([a-z])\s*\)?$/u.exec(maths[0]):null;
 if(!pair||maths.length!==3||!vars||vars[1]===vars[2]||!maths.slice(1).every(s=>/^\d+$/u.test(s.trim())))return null;
 const [g,l]=maths.slice(1).map(Number) as [number,number];if(g<1||l<1||g>1e6||l>1e9||l/g>10000)return null;
 return {kind:'pair',text,variables:[vars[1]!,vars[2]!],gcd:g,lcm:l};
}
export function gcdCertificate(text:string):GcdCertificate|null {
 const task=gcdTask(text);if(!task)return null;
 if(task.kind==='affine'){
  const [a,b]=task.offsets,difference=Math.abs(b-a),values:number[]=[],witnesses:number[]=[];
  if(!difference){const minimum=task.domain==='integer'?0:Math.max(0,a+(task.domain==='natural'?0:1));if(minimum<1)return null;return {task,difference,values,witnesses,minimum};} // Decline possible gcd(0,0), undefined in the school convention.
  for(let d=1;d<=difference;d++)if(difference%d===0){values.push(d);witnesses.push(task.domain==='integer'?d-a:d+difference*(Math.abs(a)+1)-a);}
  if(values.length>40)return null;return {task,difference,values,witnesses,minimum:null};
 }
 if(task.lcm%task.gcd!==0)return {task,ratio:null,pairs:[]};
 const ratio=task.lcm/task.gcd,pairs:number[][]=[];
 for(let u=1;u<=ratio;u++)if(ratio%u===0&&gcd(u,ratio/u)===1)pairs.push([task.gcd*u,task.gcd*ratio/u]);
 if(pairs.length>40)return null;return {task,ratio,pairs};
}
export function verifyGcdCertificate(c:GcdCertificate):boolean {
 try{
  const task=gcdTask(c.task.text);if(!task||JSON.stringify(task)!==JSON.stringify(c.task))return false;
  if('difference' in c&&task.kind==='affine'){
   const [a,b]=task.offsets,D=Math.abs(b-a);if(c.difference!==D)return false;
   if(!D)return c.minimum!==null&&c.minimum>=1&&c.minimum===(task.domain==='integer'?0:Math.max(0,a+(task.domain==='natural'?0:1)))&&!c.values.length&&!c.witnesses.length;
   if(c.minimum!==null)return false;
   const values:number[]=[];for(let d=1;d<=D;d++)if(D%d===0)values.push(d);
   if(values.join(',')!==c.values.join(',')||c.witnesses.length!==values.length)return false;
   return c.witnesses.every((n,i)=>Number.isSafeInteger(n)&&(task.domain==='integer'||n>=(task.domain==='natural'?0:1))&&gcd(n+a,n+b)===values[i]);
  }
  if(!('pairs' in c)||task.kind!=='pair')return false;
  if(task.lcm%task.gcd)return c.ratio===null&&!c.pairs.length;
  const ratio=task.lcm/task.gcd;if(c.ratio!==ratio)return false;
  const expected:number[][]=[];
  // Independent coprimality: scan common divisors rather than the generator's Euclidean algorithm.
  for(let u=1;u<=ratio;u++)if(ratio%u===0){const v=ratio/u;let coprime=true;for(let d=2;d<=Math.min(u,v);d++)if(u%d===0&&v%d===0){coprime=false;break;}if(coprime)expected.push([task.gcd*u,task.gcd*v]);}
  return JSON.stringify(expected)===JSON.stringify(c.pairs)&&c.pairs.every(p=>gcd(p[0]!,p[1]!)===task.gcd&&p[0]!*p[1]!/task.gcd===task.lcm);
 }catch{return false;}
}
export function gcdLesson(text:string) {
 const c=gcdCertificate(text);if(!c||!verifyGcdCertificate(c))return null;
 const details:AlgebraDeduction[]=[];let answer:string;
 if('difference' in c){
  const {variable:n,offsets:[a,b],domain}=c.task,A=`${n}${sign(a)}`,B=`${n}${sign(b)}`,D=c.difference,g=['d','g','h'].find(v=>v!==n)!;
  if(!D){
   answer=`Vậy các giá trị có thể của ước chung lớn nhất là mọi số nguyên $${g}\\ge${c.minimum}$.`;
   details.push({title:'Hai số bằng nhau: xét đúng miền và nêu giá trị đạt',explanation:`Hai số đã cho đều bằng $${A}$. Ước chung lớn nhất của một số với chính nó là trị tuyệt đối của số ấy. Trong miền đã cho, giá trị nhỏ nhất có thể là $${c.minimum}$. Với mỗi số nguyên $${g}\\ge${c.minimum}$, chọn $${n}=${g}${sign(-a)}$ thuộc đúng miền; khi đó hai số bằng $${g}$ và ước chung lớn nhất bằng $${g}$. ${answer}`,math:`\\gcd(${A},${B})=|${A}|,\\quad ${n}=${g}${sign(-a)}\\Rightarrow\\gcd(${A},${B})=${g}`,reason:'Định nghĩa ước chung lớn nhất; chứng minh miền và chỉ rõ mỗi giá trị đạt được',question:'Với mỗi giá trị ước chung dự định, có thể chọn n cụ thể thế nào?'});
  }else{
   details.push({title:'Dùng hiệu để xác định mọi ước chung có thể',explanation:`Gọi $${g}=\\gcd(${A},${B})$. Một số là ước chung của $${A}$ và $${B}$ khi và chỉ khi nó là ước chung của $${A}$ và hiệu $${b-a}$: ước của hai số là ước của hiệu; ngược lại, ước của số thứ nhất và hiệu cũng là ước của tổng của chúng, tức số thứ hai. Vì thế hai cặp có cùng tập ước chung và cùng ước chung lớn nhất. Do hiệu khác $0$, $${g}$ dương và là một ước dương của $${D}$.`,math:`\\gcd(${A},${B})=\\gcd(${A},${D})`,reason:'Tập ước chung không đổi khi thay một số bằng hiệu; chứng minh cả hai chiều',question:'Vì sao hiệu chia hết cho một ước chung của hai số?'});
   details.push({title:'Liệt kê tất cả khả năng từ hiệu cố định',explanation:`Các ước dương của $${D}$ là $${c.values.join(', ')}$. Do đó không giá trị nào ngoài danh sách có thể là ước chung lớn nhất. Tuy nhiên cần chứng minh từng giá trị trong danh sách thật sự đạt được, chứ chưa thể kết luận chỉ từ điều kiện cần.`,math:`${g}\\in\\{${c.values.join(',')}\\}`,reason:'Một ước chung lớn nhất dương là ước của hiệu cố định',question:'Tại sao danh sách ứng viên chưa đủ nếu chưa nêu giá trị n làm đạt?'});
   for(let i=0;i<c.values.length;i+=6){const ds=c.values.slice(i,i+6);details.push({title:'Nêu các giá trị n cụ thể làm đạt từng ước',explanation:`Với mỗi ước $${g}$ của $${D}$, chọn $${n}=${domain==='integer'?`${g}${sign(-a)}`:`${g}+${D}\\cdot${Math.abs(a)+1}${sign(-a)}`}$. Giá trị này thuộc miền đề cho; khi đó $${A}$ bằng $${g}$ cộng một bội của $${D}$. Vì $${g}$ là ước của $${D}$, thuật toán Euclid cho ước chung lớn nhất với $${D}$ đúng bằng $${g}$. Bảng ghi các lựa chọn cụ thể.`,math:`\\begin{gathered}${ds.map((d,j)=>`${n}=${c.witnesses[i+j]}\\quad\\Rightarrow\\quad\\gcd(${A},${B})=${d}`).join('\\\\')}\\end{gathered}`,reason:'Chọn nhân chứng cụ thể; ước của hiệu và thuật toán Euclid',question:'Làm sao chọn n để ước chung lớn nhất bằng đúng giá trị mong muốn?'});}
   answer=`Vậy tất cả các giá trị có thể là $${c.values.join(', ')}$.`;
   details.push({title:'Kết luận cả điều kiện cần và khả năng đạt',explanation:`Mọi giá trị đều phải thuộc danh sách ước của hiệu; ngược lại, từng ước đã có giá trị $${n}$ cụ thể làm đạt. ${answer}`,math:null,reason:'Hai chiều; mỗi khả năng có nhân chứng thỏa miền',question:'Danh sách có vừa bao quát mọi trường hợp vừa đạt được từng giá trị không?'});
  }
 }else{
  const {variables:[a,b],gcd:g,lcm:l}=c.task;
  if(c.ratio===null){answer='Vậy không có cặp số nguyên dương thỏa mãn.';details.push({title:'Đối chiếu điều kiện bắt buộc giữa ước và bội chung',explanation:`Ước chung lớn nhất là ước của cả hai số, nên cũng là ước của bội chung nhỏ nhất. Nhưng $${l}$ không chia hết cho $${g}$. Các dữ kiện mâu thuẫn. ${answer}`,math:`${l}\\not\\vdots ${g}`,reason:'Ước chung lớn nhất là ước của bội chung nhỏ nhất',question:'Bội chung nhỏ nhất có thể không chia hết cho ước chung lớn nhất không?'});}
  else{
   const N=c.ratio;
   details.push({title:'Tách ước chung lớn nhất và chứng minh điều kiện nguyên tố cùng nhau',explanation:`Đặt $${a}=${g}x$, $${b}=${g}y$ với $x,y$ nguyên dương. Vì ước chung lớn nhất của hai số là $${g}$, nên $\\gcd(x,y)=1$. Bội chung nhỏ nhất của hai số nguyên tố cùng nhau bằng tích: trong phân tích thừa số nguyên tố, không nguyên tố nào xuất hiện ở cả hai, nên bội chung lấy toàn bộ các lũy thừa của từng số. Do đó bội chung nhỏ nhất ban đầu bằng $${g}xy$.`,math:`${a}=${g}x,\\quad ${b}=${g}y,\\quad\\gcd(x,y)=1,\\quad ${g}xy=${l}\\Rightarrow xy=${N}`,reason:'Tách ước chung; phân tích thừa số nguyên tố của bội chung',question:'Sau tách ước chung, hai số mới có quan hệ gì và tích phải bằng bao nhiêu?'});
   details.push({title:'Giới hạn xét và giữ đúng điều kiện nguyên tố cùng nhau',explanation:`Vì $x,y$ nguyên dương và $xy=${N}$, mỗi $x$ là một ước dương của $${N}$, và $y=${N}/x$. Chỉ giữ cặp có $\\gcd(x,y)=1$; không bỏ cặp đảo thứ tự vì đề hỏi cặp có thứ tự.`,math:`${N}\\vdots x,\\quad y=${N}/x,\\quad\\gcd(x,y)=1`,reason:'Phân tích tích hữu hạn; giữ điều kiện nguyên tố cùng nhau và thứ tự',question:'Vì sao một cặp thừa số có ước chung lớn hơn1 phải bị loại?'});
   for(let i=0;i<c.pairs.length;i+=6){const ps=c.pairs.slice(i,i+6);details.push({title:'Khôi phục các cặp thỏa cả hai điều kiện',explanation:`Mỗi cặp thừa số được nhận cho $${a}=${g}x$, $${b}=${g}y$. Kiểm tra ước chung bằng $${g}$ và bội chung bằng $${l}$ theo các điều kiện $\\gcd(x,y)=1$ và $xy=${N}$.`,math:`\\begin{gathered}${ps.map(p=>`(x,y)=(${p[0]!/g},${p[1]!/g})\\Rightarrow(${a},${b})=(${p.join(',')})`).join('\\\\')}\\end{gathered}`,reason:'Đổi biến ngược; kiểm tra ước và bội chung từ điều kiện đã chứng minh',question:'Từ các thừa số nguyên tố cùng nhau, khôi phục cặp ban đầu ra sao?'});}
   answer=`Vậy tất cả các cặp cần tìm là $${c.pairs.map(p=>`(${p.join(',')})`).join(', ')}$.`;
   details.push({title:'Kết luận đầy đủ và đối chiếu cả hai dữ kiện',explanation:`Mọi nghiệm phải cho một cặp thừa số nguyên tố cùng nhau của $${N}$; ngược lại mọi cặp đã nêu cho đúng ước chung và bội chung yêu cầu. ${answer}`,math:null,reason:'Điều kiện cần và đủ; liệt kê đầy đủ cặp có thứ tự',question:'Có cặp nào thỏa tích nhưng vi phạm ước chung còn bị bỏ qua không?'});
  }
 }
 const lesson=algebraProofLesson(text,'Ước chung lớn nhất, bội chung nhỏ nhất và giá trị đạt','Dùng hiệu hoặc tách ước chung; chứng minh đầy đủ và nêu nhân chứng cho mọi khả năng.',details,answer,{unknowns:['Tất cả khả năng theo đúng miền và thứ tự của đề.']});
 if(!lesson)return null;lesson.analysis.topic='number_theory';return {lesson,certificate:c};
}
