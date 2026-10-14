import {parseMathText} from '../../../shared/src/mathText';
import {algebraProofLesson,type AlgebraDeduction} from './algebraProofLesson';
interface Task {text:string;variables:[string,string];constant:number;positive:boolean}
interface Row {difference:number;quotient:number;discriminant:number;root:number|null;pairs:number[][]}
export interface CubeDifferenceCertificate {task:Task;bound:number;rows:Row[];pairs:number[][];all:boolean}
function parseTask(text:string):Task|null {
 if(text.includes('§'))return null;const maths:string[]=[];
 const template=parseMathText(text.trim()).map(s=>s.kind==='math'?`§${maths.push(s.value)-1}§`:s.value).join('').replace(/\s+/g,' ').trim();
 const command=/^Tìm (?:tất cả )?(?:các )?cặp số nguyên( dương)? §0§ thỏa mãn §1§\.?$/iu.exec(template);
 if(!command||maths.length!==2)return null;const vars=/^\(?\s*([a-z])\s*,\s*([a-z])\s*\)?$/u.exec(maths[0]!);
 if(!vars||vars[1]===vars[2])return null;const variables:[string,string]=[vars[1]!,vars[2]!];
 const expression=maths[1]!.replace(/\s/g,'').replace(/−/g,'-').replace(/\^\{3\}/g,'^3');
 const equation=new RegExp(`^${variables[0]}\\^3-${variables[1]}\\^3=(-?\\d+)$`).exec(expression);
 if(!equation)return null;const constant=Number(equation[1]);if(!Number.isSafeInteger(constant)||Math.abs(constant)>1000)return null;
 return {text,variables,constant,positive:!!command[1]};
}
const pairKey=(pair:number[])=>pair.join(',');
export function cubeDifferenceCertificate(text:string):CubeDifferenceCertificate|null {
 const task=parseTask(text);if(!task)return null;const C=task.constant,rows:Row[]=[],pairs:number[][]=[];
 if(!C)return {task,bound:0,rows,pairs,all:true};
 for(let d=-Math.abs(C);d<=Math.abs(C);d++)if(d&&C%d===0){
  const q=C/d,D=12*q-3*d*d,r=D>=0?Math.floor(Math.sqrt(D)):null,root=r!==null&&r*r===D?r:null,accepted:number[][]=[];
  if(root!==null)for(const sign of [-1,1]){
   const numerator=-3*d+sign*root;if(numerator%6!==0)continue;const y=numerator/6,x=y+d;
   if(task.positive&&(x<=0||y<=0))continue;if(!accepted.some(p=>p[0]===x&&p[1]===y))accepted.push([x,y]);
  }
  rows.push({difference:d,quotient:q,discriminant:D,root,pairs:accepted});pairs.push(...accepted);
 }
 if(rows.length>48)return null;pairs.sort((a,b)=>a[0]!-b[0]!||a[1]!-b[1]!);
 return {task,bound:Math.floor(Math.sqrt(2*Math.abs(C))),rows,pairs,all:false};
}
/** Uses an independent enumeration of the ORIGINAL cubes. For C!=0,
 * 2(x²+xy+y²)=(x+y)²+x²+y² and |x-y|>=1 imply
 * x²+y²<=2|C|. This proves the finite box is exhaustive. */
export function verifyCubeDifferenceCertificate(c:CubeDifferenceCertificate):boolean {
 const task=parseTask(c.task.text);if(!task||JSON.stringify(task)!==JSON.stringify(c.task))return false;const C=task.constant;
 if(!C)return c.all&&c.bound===0&&!c.rows.length&&!c.pairs.length;
 const bound=Math.floor(Math.sqrt(2*Math.abs(C)));if(c.all||c.bound!==bound)return false;
 const expected:number[][]=[];for(let x=-bound;x<=bound;x++)for(let y=-bound;y<=bound;y++){
  if(task.positive&&(x<=0||y<=0))continue;if(BigInt(x)**3n-BigInt(y)**3n===BigInt(C))expected.push([x,y]);
 }
 if(c.pairs.map(pairKey).join(';')!==expected.map(pairKey).join(';'))return false;
 const divisors:number[]=[];for(let d=-Math.abs(C);d<=Math.abs(C);d++)if(d&&C%d===0)divisors.push(d);
 if(c.rows.length!==divisors.length)return false;
 return c.rows.every((row,i)=>{
  const d=divisors[i]!,q=C/d,D=12*q-3*d*d,r=D>=0?Math.floor(Math.sqrt(D)):null,root=r!==null&&r*r===D?r:null;
  const group=expected.filter(p=>(p[0]!)-(p[1]!)===d).map(pairKey).sort();
  return row.difference===d&&row.quotient===q&&row.discriminant===D&&row.root===root&&row.pairs.map(pairKey).sort().join(';')===group.join(';');
 });
}
export function cubeDifferenceLesson(text:string){
 const c=cubeDifferenceCertificate(text);if(!c||!verifyCubeDifferenceCertificate(c))return null;
 const {variables:[x,y],constant:C,positive}=c.task,H=['d','h','k'].find(v=>![x,y].includes(v))!,T=['t','s','z'].find(v=>![x,y,H].includes(v))!,tex=String.raw,details:AlgebraDeduction[]=[];let answer:string;
 const explainRow=(r:Row)=>{
  const prefix=tex`$${H}=${r.difference}$: `;
  if(r.discriminant<0)return prefix+tex`$D=${r.discriminant}<0$, không thể là bình phương.`;
  if(r.root===null){const low=Math.floor(Math.sqrt(r.discriminant));return prefix+tex`$${low}^2<${r.discriminant}<${low+1}^2$, nên $D$ không là số chính phương.`;}
  return prefix+(r.root===0?[1]:[-1,1]).map(sign=>{
   const numerator=-3*r.difference+sign*r.root!,calculation=tex`$${y}=\frac{-3\cdot(${r.difference})${sign>0?'+':'-'}${r.root}}{6}=\frac{${numerator}}{6}$`;
   if(numerator%6)return calculation+' không nguyên, loại.';
   const yValue=numerator/6,xValue=yValue+r.difference;
   return calculation+tex` cho $(${x},${y})=(${xValue},${yValue})$; `+(positive&&(xValue<=0||yValue<=0)?'có tọa độ không dương, loại.':'thuộc đúng miền, nhận.');
  }).join(' ');
 };
 details.push({title:'Phân tích hiệu hai lập phương và giữ miền gốc',explanation:tex`Dùng hằng đẳng thức hiệu hai lập phương. Đặt $Q=${x}^2+${x}${y}+${y}^2$. Khai triển cho $2Q=(${x}+${y})^2+${x}^2+${y}^2$, nên $Q\ge0$ và $Q=0$ chỉ khi hai ẩn đều bằng0. Vì vậy nếu hai ẩn khác nhau thì $Q>0$. Các ẩn vẫn phải là số ${positive?'nguyên dương':'nguyên'}.`,math:tex`${x}^3-${y}^3=(${x}-${y})Q=${C},\quad 2Q=(${x}+${y})^2+${x}^2+${y}^2`,reason:'Hiệu hai lập phương; khai triển; bình phương không âm; giữ nguyên miền',question:'Thừa số bậc hai có thể bằng0 trong trường hợp nào?'});
 if(!C){
  answer=tex`Vậy tất cả nghiệm là $${x}=${y}$, với giá trị chung là số ${positive?'nguyên dương':'nguyên'}.`;
  details.push({title:'Xét đủ hai khả năng của tích bằng không',explanation:tex`Tích bằng0 cho $${x}-${y}=0$ hoặc $Q=0$. Khả năng thứ nhất cho $${x}=${y}$. Khả năng thứ hai buộc cả hai ẩn bằng0, cũng thuộc họ $${x}=${y}$; nếu đề yêu cầu nguyên dương, riêng cặp này bị loại nhưng không làm mất những cặp dương bằng nhau. Ngược lại hai số bằng nhau có hai lập phương bằng nhau.`,math:tex`${x}=${y}\Longrightarrow ${x}^3-${y}^3=0`,reason:'Tích bằng không; đặc điểm Q=0 đã chứng minh; đối chiếu miền',question:'Hai nhánh có tạo thêm họ nghiệm nào ngoài hai ẩn bằng nhau không?'});
  details.push({title:'Nêu một nghiệm cụ thể và kết luận toàn bộ họ',explanation:tex`Chẳng hạn $(${x},${y})=(1,1)$ thuộc đúng miền và có $1^3-1^3=0$. Hai chiều vừa chứng minh cho mọi giá trị chung trong miền. ${answer}`,math:null,reason:'Nhân chứng cụ thể; hai chiều của điều kiện bằng nhau',question:'Đã nêu một nghiệm thuộc miền và mô tả mọi nghiệm bằng nhau chưa?'});
 }else{
  details.push({title:'Đặt hiệu và xét mọi ước với cả hai dấu',explanation:tex`Đặt $${H}=${x}-${y}$. Vì vế phải khác0, $${H}\ne0$ và $${C}\vdots ${H}$. Thừa số còn lại bằng $Q=${C}/${H}$. Do đó chỉ cần xét mọi ước nguyên khác0 của $${C}$, gồm cả ước âm; không được bỏ dấu trước khi kiểm tra. Ngược lại mỗi nghiệm ban đầu bắt buộc nằm trong một trường hợp ấy.`,math:tex`${H}=${x}-${y},\quad ${C}\vdots ${H},\quad Q=\frac{${C}}{${H}}`,reason:'Ước của một tích nguyên khác không; mọi nghiệm sinh ra một ước',question:'Vì sao mọi nghiệm phải tương ứng một ước trong danh sách, và có phải xét ước âm không?'});
  details.push({title:'Chứng minh một giới hạn đủ cho việc kiểm tra độc lập',explanation:tex`Vì $|${H}|\ge1$, ta có $Q=|${C}|/|${H}|\le${Math.abs(C)}$. Đẳng thức tổng bình phương đã chứng minh cho $${x}^2+${y}^2\le2Q\le${2*Math.abs(C)}$. Vì hai ẩn nguyên, mỗi ẩn có trị tuyệt đối không quá $${c.bound}$. Đây là giới hạn suy ra từ phương trình, không phải một khoảng tùy chọn rồi đoán hết nghiệm.`,math:tex`${x}^2+${y}^2\le${2*Math.abs(C)},\qquad |${x}|,|${y}|\le${c.bound}`,reason:'Trị tuyệt đối của số nguyên khác0 ít nhất1; tổng bình phương không âm',question:'Tại sao không thể có nghiệm ngoài giới hạn vừa suy ra?'});
  details.push({title:'Giải chính xác từng trường hợp ước bằng hoàn thành bình phương',explanation:tex`Thay $${x}=${y}+${H}$ vào $Q$, được $3${y}^2+3${H}${y}+${H}^2=${C}/${H}$. Nhân với12 rồi chuyển vế, hoàn thành bình phương để có đẳng thức dưới đây. Đặt $D=12\cdot(${C})/${H}-3${H}^2$. Cần $D\ge0$ và $D=${T}^2$ với $${T}$ nguyên không âm; khi đó xét cả hai dấu $${y}=(-3${H}\pm ${T})/6$. Chỉ nhận tử số chia hết cho6, rồi khôi phục $${x}=${y}+${H}$ và kiểm tra miền của cả hai ẩn.`,math:tex`(6${y}+3${H})^2=12\frac{${C}}{${H}}-3${H}^2=D`,reason:'Thay ẩn; khai triển; hoàn thành bình phương; kiểm tra tính nguyên và miền',question:'Một số dư dưới căn là chính phương đã đủ chưa, hay còn phải kiểm tra tử chia hết cho6 và miền?'});
  for(let start=0;start<c.rows.length;start+=6){const rows=c.rows.slice(start,start+6);details.push({title:'Kiểm tra từng ước, căn nguyên và cặp thuộc miền',explanation:tex`Bảng ghi các ước và kết quả kiểm tra; $\varnothing$ nghĩa là không có căn nguyên hoặc không có cặp thuộc miền. Khi căn bằng0, hai dấu trùng nhau nên chỉ ghi một lần. Các phép tính và lý do loại hoặc nhận từng trường hợp: ${rows.map(explainRow).join('\n')}`,math:tex`\begin{array}{r|r|r|l}${H}&D&${T}&(${x},${y})\\\hline ${rows.map(r=>`${r.difference}&${r.discriminant}&${r.root===null?'\\varnothing':r.root}&${r.pairs.length?r.pairs.map(p=>'('+p.join(',')+')').join(','):'\\varnothing'}`).join('\\\\')}\end{array}`,reason:'Tất cả ước; cả hai dấu căn; kiểm tra điều kiện nguyên và miền ban đầu',question:'Mỗi cặp được giữ có thỏa đủ căn nguyên, phép chia cho6 và miền của hai ẩn không?'});}
  answer=c.pairs.length?tex`Vậy tất cả các cặp cần tìm là $${c.pairs.map(p=>'('+p.join(',')+')').join(', ')}$.`:'Vậy không có cặp số nguyên dương thỏa mãn.';
  if(!c.pairs.length&&!positive)answer='Vậy không có cặp số nguyên thỏa mãn.';
  details.push({title:'Thế vào các lập phương gốc và kết luận đầy đủ',explanation:tex`${c.pairs.length?c.pairs.map(([a,b])=>tex`Cặp $(${a},${b})$ cho $(${a})^3-(${b})^3=${C}$.`).join(' '):'Không cặp nào vượt qua tất cả điều kiện của bảng.'} Mọi nghiệm ban đầu đều cho một ước đã xét và một trong hai dấu căn; ngược lại mọi cặp được giữ thỏa phương trình gốc và miền. ${answer}`,math:null,reason:'Thế vào phương trình gốc; chứng minh bao quát mọi trường hợp và điều kiện đủ',question:'Đã kiểm tra từng cặp trong phương trình gốc và chứng minh không bỏ sót trường hợp nào chưa?'});
 }
 const lesson=algebraProofLesson(text,'Phương trình lập phương: phân tích và xét hết nghiệm','Phân tích hiệu lập phương, chứng minh giới hạn và xét mọi ước với điều kiện căn nguyên.',details,answer,{givens:[tex`$${x}^3-${y}^3=${C}$`],unknowns:[tex`Tất cả cặp $(${x},${y})$.`],constraints:[`Hai ẩn là số ${positive?'nguyên dương':'nguyên'}.`]});
 if(!lesson)return null;lesson.analysis.topic='number_theory';return {lesson,certificate:c};
}
