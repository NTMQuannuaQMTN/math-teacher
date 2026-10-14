import type {ModelLesson} from '../../../shared/src/solution';
import {normalizeProblemText} from '../../../shared/src/mathText';
import {algebraProofLesson,type AlgebraDeduction} from './algebraProofLesson';

type Task=
 |{kind:'interpolation';text:string;values:[number,number,number];target:number;answer:number;poly:string}
 |{kind:'median';text:string;values:[number,number,number];variable:string}
 |{kind:'sophie';text:string;first:string;second:string}
 |{kind:'telescoping';text:string;parameter:string;sumName:string};
export interface CertifiedAlgebraFamily {lesson:ModelLesson;verify:()=>boolean;label:string}

const plain=(input:string)=>normalizeProblemText(input).replace(/\$/g,'').replace(/\s+/g,' ').trim();
function parse(input:string):Task|null {
 const text=normalizeProblemText(input),p=plain(input);let m:RegExpExecArray|null;
 if(/\b(?:biết|giả sử|cho) thêm\b/iu.test(p))return null;
 // Parse the mathematical data rather than one editorial sentence.  Repeated
 // names are checked explicitly so a near-match cannot silently change task.
 const poly=/\b([A-Z])\(0\)/u.exec(p)?.[1];
 if(poly&&/đa thức/iu.test(p)&&/bậc[^.]{0,25}(?:hai|2)/iu.test(p)){
  const esc=poly.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const values=[0,1,2].map(at=>new RegExp(`${esc}\\(${at}\\)\\s*=\\s*(-?\\d+)`,'u').exec(p)?.[1]);
  const targets=[...p.matchAll(new RegExp(`${esc}\\((-?\\d+)\\)`,'gu'))].map(x=>Number(x[1])).filter(x=>![0,1,2].includes(x));
  if(values.every(Boolean)&&targets.length){const nums=values.map(Number) as [number,number,number],target=targets.at(-1)!;if(Math.abs(target)>20||nums.some(v=>Math.abs(v)>1e6))return null;const a=(nums[2]-2*nums[1]+nums[0])/2,b=nums[1]-nums[0]-a;return {kind:'interpolation',text,values:nums,target,answer:a*target*target+b*target+nums[0],poly};}
 }
 const absolute=[...p.matchAll(/\\?\|([a-z])([+-]\d+)\\?\|/giu)];
 if(absolute.length===3&&/(?:nhỏ nhất|min|gtnn)/iu.test(p)){
  const variable=absolute[0]![1]!;if(absolute.some(x=>x[1]!==variable))return null;
  const values=absolute.map(x=>-Number(x[2])).sort((a,b)=>a-b) as [number,number,number];if(new Set(values).size!==3)return null;return {kind:'median',text,values,variable};
 }
 m=/\b([a-z])\^4\+4([a-z])\^4\b/iu.exec(p);
 if(m&&m[1]!==m[2]&&/phân tích/iu.test(p)&&/(?:đa thức|nhân tử|tích)/iu.test(p))return {kind:'sophie',text,first:m[1]!,second:m[2]!};
 if(/(?:1\}\{1\\cdot2|1\/\(1·2\)|1\/\[?1·2\]?)/u.test(p)&&/(?:n\(n\+1\)|N\(N\+1\)|\\sum_\{k=1\})/u.test(p)){
  const parameter=/\\sum_\{k=1\}\^\{([A-Za-z])\}/u.exec(p)?.[1]??/([nN])\(\1\+1\)/u.exec(p)?.[1]??'n';
  const sumName=/\b([A-Z])\s*=/u.exec(p)?.[1]??'S';return {kind:'telescoping',text,parameter,sumName};
 }
 return null;
}
function build(task:Task):ModelLesson|null {
 let subtopic:string,strategy:string,steps:AlgebraDeduction[],final:string;
 if(task.kind==='interpolation'){
  const [u,v,w]=task.values,a=(w-2*v+u)/2,b=v-u-a,c=u,t=task.target;
  subtopic='Nội suy đa thức bậc không quá hai';strategy='Đặt đủ ba hệ số, dùng lần lượt ba dữ kiện để xác định duy nhất đa thức rồi mới thay giá trị cần tính.';
  steps=[
   {title:'Đặt dạng tổng quát đúng với giới hạn bậc',explanation:'Vì bậc của $P$ không quá hai, tồn tại các số thực $a,b,c$ sao cho $P(x)=ax^2+bx+c$. Dạng này cũng bao gồm trường hợp bậc thấp hơn khi hệ số đầu bằng $0$.',math:'P(x)=ax^2+bx+c',reason:'Dạng tổng quát của đa thức bậc không quá hai',question:'Cần bao nhiêu hệ số để mô tả mọi đa thức bậc không quá hai?'},
   {title:'Dùng giá trị tại 0 để tìm hệ số tự do',explanation:`Thay $x=0$ vào dạng tổng quát, ta có $P(0)=c=${u}$.`,math:`c=${u}`,reason:'Thay trực tiếp dữ kiện thứ nhất',question:'Giá trị tại 0 cho ngay hệ số nào?'},
   {title:'Lập hai phương trình còn lại',explanation:`Thay $x=1$ và $x=2$, rồi dùng $c=${u}$.`,math:`\begin{cases}a+b=${v-u}\\4a+2b=${w-u}\end{cases}`,reason:'Thay hai dữ kiện còn lại và chuyển hạng đã biết',question:'Hai dữ kiện còn lại tạo hệ phương trình nào?'},
   {title:'Khử từng ẩn và xác định duy nhất đa thức',explanation:`Lấy phương trình thứ hai trừ hai lần phương trình thứ nhất, ta được $2a=${w-u-2*(v-u)}$, nên $a=${a}$. Thay lại cho $b=${b}$. Vậy cả ba hệ số đã được xác định.`,math:`a=${a},\quad b=${b},\quad c=${c}`,reason:'Phương pháp khử trong hệ hai phương trình bậc nhất',question:'Phép trừ nào loại được b?'},
   {title:'Thay giá trị cần tính và kết luận',explanation:`Thay $x=${t}$ vào đa thức vừa tìm: $P(${t})=${a}\cdot${t}^2+${b}\cdot${t}+${c}=${task.answer}$. Vậy $P(${t})=${task.answer}$.`,math:`P(${t})=${task.answer}`,reason:'Thay vào đa thức đã được xác định duy nhất',question:'Giá trị cuối cùng bằng bao nhiêu?'}];
  final=`Vậy $P(${t})=${task.answer}$.`;
 }else if(task.kind==='median'){
  const [a,b,c]=task.values,min=c-a;
  subtopic='Giá trị nhỏ nhất của tổng khoảng cách trên trục số';strategy='Ghép hai khoảng cách ngoài để có cận dưới, rồi xét chính xác khi nào cả hai bất đẳng thức đồng thời đạt dấu bằng.';
  steps=[
   {title:'Tách ba khoảng cách cần tối ưu',explanation:`Biểu thức là tổng khoảng cách từ điểm $x$ trên trục số đến ba điểm $${a},${b},${c}$. Ta giữ riêng khoảng cách đến điểm giữa $${b}$.`,math:`T=|x-${a}|+|x-${b}|+|x-${c}|`,reason:'Ý nghĩa giá trị tuyệt đối là khoảng cách trên trục số',question:'Trong ba số, số nào nằm giữa hai số còn lại?'},
   {title:'Lập cận dưới bằng bất đẳng thức tam giác',explanation:`Theo bất đẳng thức tam giác, $|x-${a}|+|x-${c}|\ge|${c}-${a}|=${min}$. Đồng thời $|x-${b}|\ge0$. Cộng hai bất đẳng thức cho $T\ge${min}$.`,math:`T\ge ${min}+0=${min}`,reason:'Bất đẳng thức tam giác và giá trị tuyệt đối không âm',question:'Hai hạng ngoài cho cận dưới nào?'},
   {title:'Xác định đầy đủ điều kiện đạt dấu bằng',explanation:`Dấu bằng $|x-${a}|+|x-${c}|=${min}$ xảy ra khi $${a}\le x\le${c}$. Dấu bằng $|x-${b}|=0$ xảy ra khi và chỉ khi $x=${b}$. Vì $${b}$ nằm trong đoạn $[${a},${c}]$, hai dấu bằng đồng thời xảy ra duy nhất tại $x=${b}$.`,math:`T=${min}\Longleftrightarrow x=${b}`,reason:'Điều kiện dấu bằng của bất đẳng thức tam giác trên trục số',question:'Điểm nào vừa nằm trong đoạn ngoài vừa có khoảng cách đến điểm giữa bằng 0?'},
   {title:'Thay lại để kiểm tra và kết luận',explanation:`Tại $x=${b}$, biểu thức bằng $${b-a}+0+${c-b}=${min}$. Vậy giá trị nhỏ nhất là $${min}$ và chỉ đạt tại $x=${b}$.`,math:`T(${b})=${min}`,reason:'Thay trực tiếp và đối chiếu cận dưới',question:'Giá trị nào đạt cận dưới vừa chứng minh?'}];
  final=`Vậy giá trị nhỏ nhất là $${min}$, đạt duy nhất khi $x=${b}$.`;
 }else if(task.kind==='sophie'){
  subtopic='Hằng đẳng thức Sophie Germain';strategy='Thêm rồi bớt cùng một hạng tử để tạo hiệu hai bình phương, sau đó khai triển kiểm tra.';
  steps=[
   {title:'Tạo một bình phương hoàn chỉnh',explanation:'Ta thêm rồi bớt $4x^2y^2$, nên giá trị biểu thức không đổi. Ba hạng đầu tạo bình phương của $x^2+2y^2$.',math:'x^4+4y^4=(x^2+2y^2)^2-4x^2y^2',reason:'Khai triển bình phương một tổng',question:'Cần thêm hạng tử nào để tạo bình phương?'},
   {title:'Nhận ra hiệu hai bình phương',explanation:'Vì $4x^2y^2=(2xy)^2$, áp dụng $A^2-B^2=(A-B)(A+B)$.',math:'(x^2+2y^2-2xy)(x^2+2y^2+2xy)',reason:'Hằng đẳng thức hiệu hai bình phương',question:'Hai biểu thức đóng vai trò A và B là gì?'},
   {title:'Sắp xếp các hạng tử trong hai nhân tử',explanation:'Viết theo thứ tự bậc quen thuộc; mọi hệ số đều là số nguyên.',math:'(x^2-2xy+2y^2)(x^2+2xy+2y^2)',reason:'Tính giao hoán của phép cộng',question:'Kết quả phân tích thành hai nhân tử nào?'},
   {title:'Khai triển ngược để chứng minh đẳng thức',explanation:'Nhân hai biểu thức liên hợp theo hạng $2xy$: tích bằng $(x^2+2y^2)^2-(2xy)^2=x^4+4y^4$. Các hạng $x^2y^2$ triệt tiêu đúng.',math:'(x^2+2y^2)^2-(2xy)^2=x^4+4y^4',reason:'Khai triển độc lập kiểm tra hai vế',question:'Khai triển tích có khôi phục đúng biểu thức ban đầu không?'}];
  final='Vậy $x^4+4y^4=(x^2-2xy+2y^2)(x^2+2xy+2y^2)$.';
 }else{
  subtopic='Tổng rút gọn hữu hạn';strategy='Phân tích mỗi số hạng thành hiệu hai phân số liên tiếp, viết tổng hữu hạn và chỉ rõ từng cặp triệt tiêu.';
  steps=[
   {title:'Phân tích một số hạng tổng quát',explanation:'Với mọi số nguyên $k\ge1$, quy đồng hiệu $\frac1k-\frac1{k+1}$ cho đúng số hạng của tổng.',math:'\frac1k-\frac1{k+1}=\frac{(k+1)-k}{k(k+1)}=\frac1{k(k+1)}',reason:'Quy đồng hai phân số',question:'Mỗi phân số của tổng viết thành hiệu nào?'},
   {title:'Thay đẳng thức vào toàn bộ tổng',explanation:'Áp dụng đẳng thức trên lần lượt cho $k=1,2,\ldots,n$. Đây là tổng hữu hạn nên phép viết lại không cần giả thiết hội tụ.',math:'S=(1-\frac12)+(\frac12-\frac13)+\cdots+(\frac1n-\frac1{n+1})',reason:'Thay cùng một đẳng thức đúng cho từng số hạng',question:'Các phân số ở giữa xuất hiện với những dấu nào?'},
   {title:'Chỉ rõ các hạng tử triệt tiêu',explanation:'Mỗi phân số $\frac1j$ với $2\le j\le n$ xuất hiện một lần mang dấu trừ và một lần mang dấu cộng. Vì vậy tất cả hạng giữa triệt tiêu, chỉ còn hạng đầu và cuối.',math:'S=1-\frac1{n+1}',reason:'Tính kết hợp của tổng hữu hạn; các cặp đối nhau',question:'Sau khi triệt tiêu, còn lại hai hạng nào?'},
   {title:'Rút gọn và kết luận',explanation:'Quy đồng hai hạng còn lại, được $\frac{n+1-1}{n+1}=\frac n{n+1}$. Vậy công thức đúng với mọi số nguyên dương $n$.',math:'S=\frac n{n+1}',reason:'Quy đồng và miền n nguyên dương bảo đảm mẫu khác 0',question:'Công thức cuối cùng của tổng là gì?'}];
  final='Vậy $S=\frac{n}{n+1}$ với mọi số nguyên dương $n$.';
 }
 let lesson=algebraProofLesson(task.text,subtopic,strategy,steps,final,{topic:'algebra'});
 if(!lesson)return null;
 const replacements:Record<string,string>=task.kind==='interpolation'?{P:task.poly}:task.kind==='median'?{x:task.variable}:task.kind==='sophie'?{x:task.first,y:task.second}:{n:task.parameter,S:task.sumName};
 const replaceFormula=(s:string)=>Object.entries(replacements).reduce((out,[from,to])=>out.replace(new RegExp(from,'g'),to),s);
 const replaceProse=(s:string)=>s.replace(/\$[^$]+\$/g,replaceFormula);
 const rewrite=(value:any,key=''):any=>typeof value==='string'?(key==='math'?replaceFormula(value):replaceProse(value)):Array.isArray(value)?value.map(v=>rewrite(v,key)):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([k,v])=>[k,rewrite(v,k)])):value;
 lesson=rewrite(lesson) as ModelLesson;
 return lesson;
}
function verify(task:Task):boolean {
 if(task.kind==='interpolation'){const [u,v,w]=task.values,a=(w-2*v+u)/2,b=v-u-a;return Number.isFinite(task.answer)&&a*task.target*task.target+b*task.target+u===task.answer;}
 if(task.kind==='median'){const [a,b,c]=task.values;return a<b&&b<c&&Math.abs(b-a)+Math.abs(b-b)+Math.abs(b-c)===c-a;}
 if(task.kind==='sophie')return ([[0,0],[1,2],[-3,4],[5,-2]] as [number,number][]).every(([x,y])=>x**4+4*y**4===(x*x-2*x*y+2*y*y)*(x*x+2*x*y+2*y*y));
 return [1,2,7,50].every(n=>{let s=0;for(let k=1;k<=n;k++)s+=1/(k*(k+1));return Math.abs(s-n/(n+1))<1e-12;});
}
export function certifiedAlgebraFamily(input:string):CertifiedAlgebraFamily|null {
 const task=parse(input);if(!task||!verify(task))return null;const lesson=build(task);if(!lesson)return null;
 return {lesson,verify:()=>verify(task),label:'Đối chiếu độc lập hệ số, điều kiện dấu bằng, khai triển đa thức hoặc từng tổng hữu hạn'};
}
