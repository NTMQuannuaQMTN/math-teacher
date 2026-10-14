import {linearIntegerTask,type LinearIntegerTask} from '../linearIntegerTask';
import {algebraProofLesson,type AlgebraDeduction} from './algebraProofLesson';
interface Division {dividend:number;divisor:number;quotient:number;remainder:number}
export interface LinearIntegerCertificate {task:LinearIntegerTask;gcd:number;bezout:[number,number];divisions:Division[];x0:number;y0:number;dx:number;dy:number;lower:number|null;upper:number|null;kind:'all'|'none'|'family';witness:[number,number]|null}
function euclid(a:number,b:number){
 let r=Math.abs(a),next=Math.abs(b),s=1,ns=0,t=0,nt=1;const divisions:Division[]=[];
 while(next){const q=Math.floor(r/next),rem=r-q*next;divisions.push({dividend:r,divisor:next,quotient:q,remainder:rem});[r,next]=[next,rem];[s,ns]=[ns,s-q*ns];[t,nt]=[nt,t-q*nt];}
 return {gcd:r,bezout:[s*(a<0?-1:1),t*(b<0?-1:1)] as [number,number],divisions};
}
export function linearIntegerCertificate(text:string):LinearIntegerCertificate|null {
 const task=linearIntegerTask(text);if(!task)return null;const {a,b,c,domain}=task,E=euclid(a,b);
 const base:LinearIntegerCertificate={task,...E,x0:0,y0:0,dx:0,dy:0,lower:null,upper:null,kind:'none',witness:null};
 if(!E.gcd)return {...base,kind:c===0?'all':'none',witness:c===0?[domain==='positive'?1:0,domain==='positive'?1:0]:null};
 if(c%E.gcd)return base;
 const x0=E.bezout[0]*c/E.gcd,y0=E.bezout[1]*c/E.gcd,dx=b/E.gcd,dy=-a/E.gcd;let lower:number|null=null,upper:number|null=null,possible=true;
 if(domain==='positive')for(const [value,slope] of [[x0,dx],[y0,dy]]){
  if(!slope){if(value!<1)possible=false;}
  else if(slope!>0){const bound=Math.ceil((1-value!)/slope!);lower=lower===null?bound:Math.max(lower,bound);}
  else{const bound=Math.floor((1-value!)/slope!);upper=upper===null?bound:Math.min(upper,bound);}
 }
 if(lower!==null&&upper!==null&&lower>upper)possible=false;
 const parameter=lower??upper??0;
 return {...base,x0,y0,dx,dy,lower,upper,kind:possible?'family':'none',witness:possible?[x0+dx*parameter,y0+dy*parameter]:null};
}
const floorDiv=(a:bigint,b:bigint)=>{let q=a/b;if(a%b!==0n&&(a<0n)!==(b<0n))q--;return q;};
/** Checks Bezout and the original equation exactly, with an independent divisor scan
 * and BigInt parameter inequalities. No finite sample is used to certify an infinite family. */
export function verifyLinearIntegerCertificate(c:LinearIntegerCertificate):boolean {
 try{
  const t=linearIntegerTask(c.task.text);if(!t||JSON.stringify(t)!==JSON.stringify(c.task))return false;
  const {a,b,c:value,domain}=t;let g=0;
  if(!a)g=Math.abs(b);else if(!b)g=Math.abs(a);else for(let d=1;d<=Math.min(Math.abs(a),Math.abs(b));d++)if(a%d===0&&b%d===0)g=d;
  if(c.gcd!==g||c.bezout.length!==2||!c.bezout.every(Number.isSafeInteger)||BigInt(a)*BigInt(c.bezout[0])+BigInt(b)*BigInt(c.bezout[1])!==BigInt(g))return false;
  let dividend=Math.abs(a),divisor=Math.abs(b);for(const row of c.divisions){
   if(row.dividend!==dividend||row.divisor!==divisor||!divisor||row.quotient!==Math.floor(dividend/divisor)||row.remainder!==dividend%divisor)return false;[dividend,divisor]=[divisor,row.remainder];
  }if(divisor!==0||dividend!==g)return false;
  if(!g)return c.kind===(value===0?'all':'none')&&(value!==0?c.witness===null:!!c.witness&&c.witness.every(v=>Number.isSafeInteger(v)&&(domain==='integer'||v>0)));
  if(value%g)return c.kind==='none'&&c.witness===null;
  const valid=[c.x0,c.y0,c.dx,c.dy,c.lower??0,c.upper??0].every(Number.isSafeInteger);if(!valid)return false;
  if(BigInt(a)*BigInt(c.x0)+BigInt(b)*BigInt(c.y0)!==BigInt(value)||c.dx!==b/g||c.dy!==-a/g)return false;
  let lower:bigint|null=null,upper:bigint|null=null,possible=true;
  if(domain==='positive')for(const [v,d] of [[c.x0,c.dx],[c.y0,c.dy]]){
   if(d===0){if(v!<1)possible=false;continue;}const num=1n-BigInt(v!),den=BigInt(d!);
   if(den>0n){const bound=-floorDiv(-num,den);lower=lower===null||bound>lower?bound:lower;}
   else{const bound=floorDiv(num,den);upper=upper===null||bound<upper?bound:upper;}
  }
  if(lower!==null&&upper!==null&&lower>upper)possible=false;
  if((lower===null?null:Number(lower))!==c.lower||(upper===null?null:Number(upper))!==c.upper||c.kind!==(possible?'family':'none'))return false;
  if(!possible)return c.witness===null;
  const w=c.witness;return !!w&&w.every(Number.isSafeInteger)&&(domain==='integer'||w.every(v=>v>0))&&BigInt(a)*BigInt(w[0])+BigInt(b)*BigInt(w[1])===BigInt(value);
 }catch{return false;}
}
const term=(base:number,slope:number,k:string)=>slope===0?String(base):`${base===0?'':base}${slope<0?'-':base===0?'':'+'}${Math.abs(slope)===1?'':Math.abs(slope)}${k}`;
export function linearIntegerLesson(text:string) {
 const c=linearIntegerCertificate(text);if(!c||!verifyLinearIntegerCertificate(c))return null;
 const {a,b,c:value,variables:[x,y],domain}=c.task,g=c.gcd,k=['t','k','u','v'].find(v=>![x,y].includes(v))!,details:AlgebraDeduction[]=[];let answer:string;
 details.push({title:'Thu gọn và giữ đúng miền của hai ẩn',explanation:`Chuyển tất cả hạng tử về một vế, thu gọn hệ số và chuyển hằng số sang vế phải, được phương trình bên dưới tương đương đề. Cả hai ẩn phải là số ${domain==='positive'?'nguyên dương, nên còn cần kiểm tra hai tọa độ lớn hơn0':'nguyên; chưa được giới hạn chỉ xét một khoảng nhỏ'}.`,math:`(${a})${x}+(${b})${y}=${value}`,reason:'Thu gọn đa thức đã kiểm tra chính xác; giữ miền của đề',question:'Sau thu gọn, hệ số của mỗi ẩn và miền số cần giữ là gì?'});
 if(!g){
  answer=value===0?`Vậy mọi cặp số ${domain==='positive'?'nguyên dương':'nguyên'} $(${x},${y})$ đều thỏa mãn.`:'Vậy không có cặp số nào thỏa mãn.';
  details.push({title:'Xét riêng khi cả hai hệ số bằng không',explanation:`Vế trái luôn bằng0. ${value===0?'Vế phải cũng bằng0, nên hai ẩn được chọn tùy ý trong miền đề. Chẳng hạn chọn hai ẩn bằng1; đây là một cặp nguyên dương thỏa đúng đẳng thức.':'Vế phải khác0, nên đẳng thức không thể xảy ra.'} ${answer}`,math:`0=${value}`,reason:'Đẳng thức hằng; không chia cho hệ số0',question:'Phương trình còn đặt điều kiện nào lên hai ẩn khi cả hai hệ số bằng0?'});
 }else{
  const E=c.divisions;
  details.push({title:'Tìm ước chung lớn nhất và điều kiện cần',explanation:`Mọi tổ hợp nguyên $(${a})${x}+(${b})${y}$ đều chia hết cho $g=\\gcd(${Math.abs(a)},${Math.abs(b)})=${g}$. Vì vậy vế phải phải chia hết cho $g$. ${a&&b?'Các phép chia liên tiếp bên dưới bảo toàn tập ước chung; số dư khác0 cuối cùng là ước chung lớn nhất.':'Một hệ số bằng0, nên ước chung lớn nhất là trị tuyệt đối hệ số còn lại.'}`,math:E.length?`\\begin{gathered}${E.map(r=>`${r.dividend}=${r.divisor}\\cdot${r.quotient}+${r.remainder}`).join('\\\\')}\\end{gathered}`:`g=${g}`,reason:'Thuật toán Euclid; một ước của cả hai hệ số là ước của mọi tổ hợp nguyên',question:'Vế phải có thỏa điều kiện chia hết bắt buộc cho ước chung lớn nhất không?'});
  if(value%g){answer='Vậy không có cặp số nguyên thỏa mãn.';details.push({title:'Kết luận từ điều kiện cần bị vi phạm',explanation:`Số $${value}$ không chia hết cho $${g}$, trong khi vế trái luôn chia hết cho $${g}$. Hai vế không thể bằng nhau. ${answer}`,math:`${value}\\not\\vdots ${g}`,reason:'Hai vế bằng nhau phải cùng chia hết; điều kiện cần không thỏa',question:'Vì sao đây là chứng minh vô nghiệm trên toàn bộ miền, không chỉ những số đã thử?'});}
  else{
   const [s,t]=c.bezout;
   if(a&&b){
    let first=[a<0?-1:1,0],second=[0,b<0?-1:1];const combinations:string[]=[];
    for(const row of E){const next=[first[0]!-row.quotient*second[0]!,first[1]!-row.quotient*second[1]!];
     if(row.remainder)combinations.push(`${row.remainder}=${row.dividend}-${row.quotient}\\cdot${row.divisor}=(${next[0]})(${a})+(${next[1]})(${b})`);
     [first,second]=[second,next];
    }
    for(let i=0;i<combinations.length;i+=5)details.push({title:'Biểu diễn từng số dư bằng hai hệ số gốc',explanation:`Bắt đầu với hai hệ số gốc. Ở mỗi phép chia, lấy số bị chia trừ thương nhân số chia; thay hai biểu diễn đã biết của chúng để thu được tổ hợp ở dòng sau. Vì vậy từng số dư, cuối cùng là $${g}$, được biểu diễn chính xác bằng hai hệ số ban đầu. Các đẳng thức bên dưới ghi rõ phép trừ và các hệ số sau thu gọn.`,math:`\\begin{gathered}${combinations.slice(i,i+5).join('\\\\')}\\end{gathered}`,reason:'Số dư bằng số bị chia trừ thương nhân số chia; thay đẳng thức đã biết và gộp hệ số',question:'Từ hai biểu diễn trước, phép trừ cho những hệ số nguyên nào ở biểu diễn kế tiếp?'});
   }
   details.push({title:'Xây dựng và kiểm tra một nghiệm nguyên cụ thể',explanation:`${a&&b?`Các phép trừ số dư của thuật toán Euclid vừa biểu diễn $${g}$ thành tổ hợp của hai hệ số.`:`Hệ số khác0 có trị tuyệt đối bằng $${g}$; dùng chính hệ số này với dấu thích hợp cho tổ hợp dưới đây.`} Kiểm tra trực tiếp $(${a})\\cdot(${s})+(${b})\\cdot(${t})=${g}$. Nhân hai hệ số trong tổ hợp với $${value/g}$ cho nghiệm riêng $(${x}_0,${y}_0)=(${c.x0},${c.y0})$. Đây là nghiệm nguyên của phương trình; nếu đề yêu cầu nguyên dương, chưa được kết luận nghiệm riêng này thỏa miền.`,math:`(${a})(${c.x0})+(${b})(${c.y0})=${value}`,reason:'Tổ hợp Euclid được kiểm tra trực tiếp; nhân với thương nguyên của vế phải',question:'Cặp nghiệm riêng có thỏa phương trình, và còn phải kiểm tra miền nào?'});
   const family=`${x}=${term(c.x0,c.dx,k)},\\quad ${y}=${term(c.y0,c.dy,k)}`;
   let completeness:string;
   if(a&&b)completeness=`Lấy một nghiệm bất kỳ rồi trừ nghiệm riêng: $(${a/g})(${x}-(${c.x0}))=-(${b/g})(${y}-(${c.y0}))$. Hai hệ số $${a/g}$ và $${b/g}$ nguyên tố cùng nhau, nên $${x}-(${c.x0})$ phải là bội của $${b/g}$. Đặt $${x}-(${c.x0})=(${b/g})${k}$ với $${k}$ nguyên; thế lại suy ra $${y}-(${c.y0})=-(${a/g})${k}$. Ngược lại thay công thức vào phương trình, các hạng tử theo $${k}$ triệt tiêu, nên mọi tham số nguyên đều cho nghiệm.`;
   else completeness=`Hệ số của $${a?y:x}$ bằng0, nên ẩn này là số nguyên tùy ý; ẩn còn lại bắt buộc bằng $${a?c.x0:c.y0}$. Công thức bên dưới cho đúng các giá trị ấy: hệ số của tham số ở ẩn tự do là1 hoặc−1, nên bao quát mọi số nguyên. Thay vào phương trình giữ nguyên đẳng thức.`;
   details.push({title:'Chứng minh công thức bao gồm mọi nghiệm nguyên',explanation:completeness,math:`${family},\\quad ${k}\\in\\mathbb Z`,reason:'Trừ nghiệm riêng; hai hệ số sau tách ƯCLN nguyên tố cùng nhau; chứng minh cả hai chiều',question:'Tại sao mọi nghiệm đều có tham số nguyên, và mọi tham số nguyên lại cho nghiệm?'});
   const fixedBad=c.dx===0&&c.x0<1?`${x}=${c.x0}`:c.dy===0&&c.y0<1?`${y}=${c.y0}`:null;
   const bounds=[c.lower!==null?`${k}\\ge${c.lower}`:null,c.upper!==null?`${k}\\le${c.upper}`:null].filter(Boolean).join(',\\ ');
   if(domain==='positive')details.push({title:'Lọc toàn bộ tham số theo hai điều kiện nguyên dương',explanation:`Từ công thức nghiệm, yêu cầu riêng $${x}\\ge1$ và $${y}\\ge1$. Với hệ số tham số dương, chuyển vế rồi làm tròn lên cho cận dưới; với hệ số âm, đổi chiều bất đẳng thức rồi làm tròn xuống cho cận trên. Nếu hệ số bằng0 thì giá trị cố định phải dương. ${c.kind==='none'?`${fixedBad?`Tọa độ cố định $${fixedBad}\\le0$ không thuộc miền nguyên dương; mọi tham số đều bị loại.`:`Hai bất đẳng thức cho $${bounds}$, không có tham số nguyên chung.`}`:`Kết hợp cho ${bounds?`$${bounds}$`:'mọi tham số nguyên'}.`}`,math:`${term(c.x0,c.dx,k)}\\ge1,\\qquad ${term(c.y0,c.dy,k)}\\ge1`,reason:'Giải riêng từng bất đẳng thức, đổi chiều khi chia số âm; làm tròn đúng vì tham số nguyên',question:'Điều kiện dương của cả hai tọa độ cho giao những giới hạn tham số nào?'});
   answer=c.kind==='none'?'Vậy không có cặp số nguyên dương thỏa mãn.':`Vậy tất cả nghiệm là $${family}$, với $${k}\\in\\mathbb Z$${bounds?` và $${bounds}$`:''}.`;
   details.push({title:'Kiểm tra nhân chứng thuộc miền và kết luận đầy đủ',explanation:`${c.witness?`Chẳng hạn chọn $(${x},${y})=(${c.witness.join(',')})$; cặp này thuộc miền đề và có $(${a})\\cdot(${c.witness[0]})+(${b})\\cdot(${c.witness[1]})=${value}$. `:''}Công thức đã được chứng minh cho tất cả nghiệm nguyên; ${domain==='positive'?'giới hạn tham số giữ đúng và đủ cả hai điều kiện dương':'không có điều kiện bổ sung cần lọc'}. ${answer}`,math:null,reason:'Kiểm tra cụ thể điều kiện gốc và miền; tính đầy đủ đã chứng minh bằng công thức',question:'Đã nêu một nghiệm thực sự thuộc miền khi có nghiệm và chứng minh không bỏ sót chưa?'});
  }
 }
 const lesson=algebraProofLesson(text,'Phương trình nghiệm nguyên: ƯCLN và toàn bộ họ nghiệm','Chứng minh điều kiện chia hết, nêu nghiệm riêng, chứng minh họ tham số và lọc miền.',details,answer,{givens:[`$${c.task.left}=${c.task.right}$`],unknowns:[`Tất cả cặp $(${x},${y})$ trong miền đề.`],constraints:[`Hai ẩn là số ${domain==='positive'?'nguyên dương':'nguyên'}.`]});
 if(!lesson)return null;lesson.analysis.topic='number_theory';return {lesson,certificate:c};
}
