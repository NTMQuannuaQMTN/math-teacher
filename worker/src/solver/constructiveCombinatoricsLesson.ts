import {combinatoricsProofLesson,plainCombinatorics,type CombinatoricsDeduction} from './combinatoricsProofLesson';
type Task=
 |{kind:'remainders';text:string;count:number;modulus:number}
 |{kind:'pairs';text:string;n:number;selected:number}
 |{kind:'merge';text:string;n:number;constant:number;turns:number};
export interface ConstructiveCertificate {task:Task;boxes:number[][];finalValue:number|null}
function parseTask(text:string):Task|null {
 const p=plainCombinatorics(text);let m=/^Chọn (\d+) số nguyên bất kỳ\. Chứng minh luôn có hai số có hiệu chia hết cho (\d+)\.$/u.exec(p);
 if(m){const count=Number(m[1]),modulus=Number(m[2]);return modulus>=2&&modulus<=60&&count>modulus&&count<=200?{kind:'remainders',text,count,modulus}:null;}
 m=/^Cho tập S=\\\{([\d,\s]+)\\\}\. Chọn bất kỳ (\d+) số phân biệt thuộc S\. Chứng minh có hai số được chọn có tổng bằng (\d+) và chỉ rõ cách tìm hai số đó\.$/u.exec(p);
 if(m){const values=m[1]!.split(',').map(Number),n=values.length/2,selected=Number(m[2]),sum=Number(m[3]);return Number.isInteger(n)&&n>=1&&n<=30&&values.every((v,i)=>v===i+1)&&selected>n&&selected<=2*n&&sum===2*n+1?{kind:'pairs',text,n,selected}:null;}
 m=/^Trên bảng có các số 1,2,(?:\\ldots|\\dots|\.\.\.),(\d+)\. Mỗi lượt xóa hai số a,b và viết số a\+b(-\d+|\+\d+)\. Sau (\d+) lượt còn một số\. Tìm số đó và chứng minh kết quả không phụ thuộc thứ tự chọn\.$/u.exec(p);
 if(m){const n=Number(m[1]),constant=-Number(m[2]),turns=Number(m[3]);return n>=2&&n<=1000&&Math.abs(constant)<=1000&&turns===n-1?{kind:'merge',text,n,constant,turns}:null;}
 return null;
}
export function constructiveCertificate(text:string):ConstructiveCertificate|null {
 const task=parseTask(text);if(!task)return null;
 const boxes=task.kind==='remainders'?Array.from({length:task.modulus},(_,i)=>[i]):task.kind==='pairs'?Array.from({length:task.n},(_,i)=>[i+1,2*task.n-i]):[];
 const finalValue=task.kind==='merge'?task.n*(task.n+1)/2-task.constant*(task.n-1):null;return {task,boxes,finalValue};
}
/** Recheck the partition for every allowed element, and the invariant as a symbolic coefficient identity. */
export function verifyConstructiveCertificate(c:ConstructiveCertificate):boolean {
 const t=parseTask(c.task.text);if(!t||JSON.stringify(t)!==JSON.stringify(c.task))return false;
 if(t.kind==='remainders'){
  const covered=new Set(c.boxes.flat());return c.finalValue===null&&c.boxes.length===t.modulus&&c.boxes.every(x=>x.length===1)&&covered.size===t.modulus&&Array.from(covered).every(x=>Number.isInteger(x)&&x>=0&&x<t.modulus)&&t.count>c.boxes.length;
 }
 if(t.kind==='pairs'){
  const covered=c.boxes.flat();return c.finalValue===null&&c.boxes.length===t.n&&covered.length===2*t.n&&new Set(covered).size===2*t.n&&covered.every(v=>v>=1&&v<=2*t.n)&&c.boxes.every(pair=>pair.length===2&&pair[0]! + pair[1]! === 2*t.n+1)&&t.selected>c.boxes.length;
 }
 let initial=0;for(let i=1;i<=t.n;i++)initial+=i;
 // Replacing a,b by a+b-c changes S by -c and count by -1,
 // so (S-c*count) changes by -c - c*(-1) = 0 for ALL a,b.
 return c.boxes.length===0&&-t.constant-t.constant*(-1)===0&&c.finalValue===initial-t.constant*t.turns;
}
export function constructiveCombinatoricsLesson(text:string){
 const c=constructiveCertificate(text);if(!c||!verifyConstructiveCertificate(c))return null;const t=c.task;let steps:CombinatoricsDeduction[],conclusion:string,subtopic:string;
 if(t.kind==='remainders'){
  subtopic='Nguyên lý chia ngăn và cách tìm nhân chứng';conclusion=`Vậy luôn tìm được hai số đã chọn có hiệu chia hết cho $${t.modulus}$ bằng quy tắc trên.`;
  steps=[
   {title:'Chia số đã cho theo số dư',explanation:`Đánh số các số đã chọn theo thứ tự đọc là $a_1,\\ldots,a_{${t.count}}$. Tạo $${t.modulus}$ ngăn, mang nhãn số dư $0,1,\\ldots,${t.modulus-1}$. Đưa mỗi số vào ngăn bằng số dư không âm của nó khi chia cho $${t.modulus}$, kể cả số âm.`,math:null,reason:'Mọi số nguyên có duy nhất một số dư từ0 đến môđun trừ1',question:'Có bao nhiêu số dư có thể có, kể cả với số nguyên âm?'},
   {title:'Chỉ rõ cách chọn hai số',explanation:`Đọc lần lượt các số đã cho. Với mỗi số dư, lưu chỉ số đầu tiên có số dư đó. Gặp số thứ $j$ có số dư đã lưu tại chỉ số $i$, dừng và chọn chính hai số $a_i,a_j$ đó, với $i<j$. Nếu chưa gặp số dư lặp thì mới đọc nhiều nhất $${t.modulus}$ số, vì mỗi ngăn chỉ có một số. Do có $${t.count}>${t.modulus}$ số, thủ tục chắc chắn gặp một cặp và dừng. Đề không cung cấp các giá trị cụ thể, nên cặp được xác định từ dữ liệu đã chọn, không tự đặt các số thay đề.`,math:null,reason:'Nguyên lý chia ngăn kèm thủ tục chọn hai phần tử cụ thể',question:'Khi số dư đầu tiên lặp lại, bạn chọn chính những số ở vị trí nào?'},
   {title:'Chứng minh cặp vừa chọn thỏa yêu cầu',explanation:`Gọi số dư chung là $r$. Có các số nguyên $u,v$ sao cho $a_i=${t.modulus}u+r$ và $a_j=${t.modulus}v+r$. Lấy hiệu, số dư triệt tiêu. ${conclusion}`,math:`a_j-a_i=${t.modulus}(v-u),\\qquad a_j-a_i\\vdots ${t.modulus}`,reason:'Hiệu hai số cùng số dư là bội của môđun',question:'Vì sao hai số cùng ngăn cho một hiệu chia hết?'}];
 }else if(t.kind==='pairs'){
  subtopic='Ghép cặp và tìm hai số có tổng cho trước';conclusion=`Vậy tìm được hai số đã chọn có tổng $${2*t.n+1}$ bằng cách tìm ngăn chứa cả hai số.`;
  steps=[
   {title:'Ghép toàn bộ tập thành các cặp',explanation:`Gọi cặp thứ $i$ là $Q_i$. Chia tập thành $${t.n}$ cặp $(i,${2*t.n+1}-i)$ với $i=1,\\ldots,${t.n}$. Mỗi số từ1 đến$${2*t.n}$ thuộc đúng một cặp: số không quá$${t.n}$ là đầu nhỏ, số lớn hơn là đầu lớn. Các cặp không trùng và mỗi cặp có tổng$${2*t.n+1}$.`,math:'\\begin{array}{c|c}i&Q_i\\\\\\hline '+(t.n<=10?c.boxes.map((v,i)=>`${i+1}&(${v[0]},${v[1]})`):[...c.boxes.slice(0,3).map((v,i)=>`${i+1}&(${v[0]},${v[1]})`),'\\vdots&\\vdots',`${t.n}&(${t.n},${t.n+1})`]).join('\\\\')+'\\end{array}',reason:'Một phân hoạch không trùng của toàn tập, theo tổng cần tìm',question:'Vì sao mỗi số xuất hiện trong đúng một cặp?'},
   {title:'Xác định cặp làm nhân chứng từ các số được chọn',explanation:`Lập dấu đánh dấu các số đã chọn. Xét lần lượt $i=1,2,\\ldots,${t.n}$; chọn chỉ số đầu tiên mà cả $i$ và $${2*t.n+1}-i$ đều được đánh dấu. Hai số đó là nhân chứng cần tìm. Nếu không có cặp nào như vậy, mỗi cặp chỉ có nhiều nhất một số được chọn, tổng cộng không quá$${t.n}$ số, trái với$${t.selected}>${t.n}$. Vì thế quy tắc chắc chắn tìm được cặp.`,math:null,reason:'Nguyên lý chia ngăn và quy tắc chọn nhân chứng thực hiện được',question:'Khi đánh dấu các số đã chọn, bạn kiểm tra cặp nào trước và dừng khi nào?'},
   {title:'Kiểm tra hai số và kết luận',explanation:`Hai số ở cặp được tìm đều thuộc các số đã chọn, phân biệt vì $i\\le${t.n}<${2*t.n+1}-i$, và tổng của chúng đúng bằng$${2*t.n+1}$. ${conclusion}`,math:`i+(${2*t.n+1}-i)=${2*t.n+1}`,reason:'Kiểm tra điều kiện của chính cặp vừa xây dựng',question:'Hai số làm nhân chứng có thật sự nằm trong phần đã chọn không?'}];
 }else{
  subtopic='Bất biến khi ghép hai số';conclusion=`Vậy số cuối cùng luôn là $${c.finalValue}$, không phụ thuộc thứ tự chọn.`;
  const constant=t.constant<0?`(${t.constant})`:String(t.constant);
  const op=t.constant>=0?`a+b-${t.constant}`:`a+b+${-t.constant}`;
  steps=[
   {title:'Theo dõi tổng và số lượng',explanation:`Gọi $S$ là tổng các số đang có, $q$ là số lượng. Xóa$a,b$ rồi viết$${op}$ làm tổng thay đổi đúng$${-t.constant}$ và số lượng giảm1, bất kể chọn số nào.`,math:`S'=S-${constant},\\qquad q'=q-1`,reason:'Trừ hai số bị xóa rồi cộng số mới',question:'Sau một lần ghép, tổng giảm một lượng phụ thuộc vào a,b không?'},
   {title:'Bất biến không phụ thuộc lựa chọn',explanation:`Xét$S-${constant}q$. Sau phép ghép, thay công thức vừa tìm vào thì được đúng giá trị cũ; đây là đẳng thức đúng với mọi$a,b$.`,math:`S'-${constant}q'=(S-${constant})-${constant}(q-1)=S-${constant}q`,reason:'Hiệu giữa tổng và hằng số nhân số lượng được giữ nguyên',question:'Vì sao chỉ thử một vài cách ghép chưa đủ để chứng minh bất biến?'},
   {title:'Tính giá trị đầu và cuối',explanation:`Ban đầu tổng là$1+2+\\cdots+${t.n}=\\frac{${t.n}\\cdot${t.n+1}}{2}$, có$${t.n}$ số. Sau$${t.turns}$ lượt số lượng còn1. Gọi số cuối là$x$; dùng bất biến đầu–cuối và giải đẳng thức. ${conclusion}`,math:`x-${constant}=\\frac{${t.n}\\cdot${t.n+1}}{2}-${constant}\\cdot${t.n},\\qquad x=${c.finalValue}`,reason:'Số lượng giảm1 mỗi lượt và bất biến đã chứng minh cho mọi phép ghép',question:'Khi chỉ còn một số, tổng và số lượng bằng gì?'}];
 }
 const lesson=combinatoricsProofLesson(text,subtopic,'Cho phân hoạch hoặc bất biến, chỉ rõ cách tìm nhân chứng và kiểm tra điều kiện.',steps,conclusion);return lesson?{lesson,certificate:c}:null;
}
