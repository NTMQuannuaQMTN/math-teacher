import {choose,pascalChoose,plainCombinatorics,combinatoricsProofLesson,type CombinatoricsDeduction} from './combinatoricsProofLesson';
type CountTask=
 |{kind:'selection';text:string;boys:number;girls:number;k:number;minimumGirls:number}
 |{kind:'digits';text:string;digits:number[];length:number;divisor:number}
 |{kind:'inclusion';text:string;n:number;a:number;b:number;both:number}
 |{kind:'handshakes';text:string;n:number}
 |{kind:'probability';text:string;red:number;blue:number};
export interface CountingCertificate {task:CountTask;parts:bigint[];total:bigint;denominator:bigint}
const bounded=(x:number,min=0,max=60)=>Number.isInteger(x)&&x>=min&&x<=max;
function parseCounting(text:string):CountTask|null {
 const p=plainCombinatorics(text);if(/(?:chọn có thứ tự|có hoàn lại|được chọn lặp)/iu.test(p))return null;
 let m=/(\d+)\s*(?:học sinh\s*)?nam\s+và\s+(\d+)\s*(?:học sinh\s*)?nữ[\s\S]{0,120}?(?:Chọn đồng thời\s+(\d+)\s*học sinh|nhóm\s+(\d+)\s*bạn)[\s\S]{0,120}?(?:ít nhất|tối thiểu)\s+(một|\d+)\s*(?:học sinh\s*)?nữ/iu.exec(p);
 if(m){const boys=Number(m[1]),girls=Number(m[2]),k=Number(m[3]??m[4]),minimumGirls=m[5]!.toLowerCase()==='một'?1:Number(m[5]);return [boys,girls,k,minimumGirls].every(x=>bounded(x))&&boys+girls<=60&&k<=12&&k<=boys+girls&&minimumGirls<=k?{kind:'selection',text,boys,girls,k,minimumGirls}:null;}
 m=/^Từ các chữ số ([0-9](?:\s*,\s*[0-9])*), lập được bao nhiêu số tự nhiên có (hai|ba|bốn|năm|sáu|\d+) chữ số đôi một khác nhau và chia hết cho (\d+)\?$/u.exec(p);
 if(m){const digits=m[1]!.split(',').map(Number),names:Record<string,number>={hai:2,ba:3,bốn:4,năm:5,sáu:6},length=names[m[2]!]??Number(m[2]),divisor=Number(m[3]);return digits.length<=8&&new Set(digits).size===digits.length&&bounded(length,2,6)&&length<=digits.length&&[2,5,10].includes(divisor)?{kind:'digits',text,digits,length,divisor}:null;}
 m=/^Trong một lớp có (\d+) học sinh, (\d+) em thích Toán, (\d+) em thích Văn và (\d+) em thích cả hai môn\. Có bao nhiêu em không thích môn nào trong hai môn đó\?$/u.exec(p);
 if(m){const [n,a,b,both]=m.slice(1).map(Number);return [n!,a!,b!,both!].every(x=>bounded(x,0,1000))&&a!<=n!&&b!<=n!&&both!<=Math.min(a!,b!)&&a!+b!-both!<=n!?{kind:'inclusion',text,n:n!,a:a!,b:b!,both:both!}:null;}
 m=/(?:Có|có)\s+(\d+)\s+người[^.?!]*(?:mỗi cặp người|hai người bất kỳ)[^.?!]*bắt tay[^.?!]*đúng một lần/iu.exec(p);
 if(m){const n=Number(m[1]);return bounded(n,1,1000)?{kind:'handshakes',text,n}:null;}
 m=/^Trong hộp có (\d+) viên bi đỏ và (\d+) viên bi xanh, các viên phân biệt\. Rút đồng thời ngẫu nhiên 2 viên, mọi cặp có khả năng như nhau\. Tính xác suất hai viên cùng màu\.$/u.exec(p);
 if(m){const red=Number(m[1]),blue=Number(m[2]);return bounded(red)&&bounded(blue)&&red+blue>=2&&red+blue<=60?{kind:'probability',text,red,blue}:null;}
 return null;
}
const arrangement=(n:number,k:number)=>{let v=1n;for(let i=0;i<k;i++)v*=BigInt(n-i);return v;};
export function countingCertificate(text:string):CountingCertificate|null {
 const task=parseCounting(text);if(!task)return null;let parts:bigint[],denominator=1n;
 switch(task.kind){
 case 'selection':parts=Array.from({length:task.k-task.minimumGirls+1},(_,i)=>{const g=i+task.minimumGirls;return choose(task.girls,g)*choose(task.boys,task.k-g);});break;
 case 'digits':parts=task.digits.filter(d=>d%task.divisor===0||task.divisor===10&&d===0).map(d=>BigInt(task.digits.length-1-(d!==0&&task.digits.includes(0)?1:0))*arrangement(task.digits.length-2,task.length-2));break;
 case 'inclusion':parts=[BigInt(task.n-task.a-task.b+task.both)];break;
 case 'handshakes':parts=[BigInt(task.n)*BigInt(task.n-1)/2n];break;
 case 'probability':parts=[choose(task.red,2),choose(task.blue,2)];denominator=choose(task.red+task.blue,2);break;
 }
 return {task,parts,total:parts.reduce((s,x)=>s+x,0n),denominator};
}
/** Independent Pascal recurrence, original-digit enumeration, disjoint-cell model or person-by-person summation. */
export function verifyCountingCertificate(c:CountingCertificate):boolean {
 const task=parseCounting(c.task.text);if(!task||JSON.stringify(task)!==JSON.stringify(c.task)||c.parts.some(x=>typeof x!=='bigint')||typeof c.total!=='bigint'||typeof c.denominator!=='bigint')return false;
 let parts:bigint[],denominator=1n;
 switch(task.kind){
 case 'selection':{
  // Labelled-object DP: each student is either selected or omitted.
  const dp=Array.from({length:task.k+1},()=>Array<bigint>(task.k+1).fill(0n));dp[0]![0]=1n;
  for(let i=0;i<task.boys+task.girls;i++)for(let selected=task.k;selected>=1;selected--)for(let girls=task.k;girls>=0;girls--){const prev=girls-(i>=task.boys?1:0);if(prev>=0)dp[selected]![girls]=dp[selected]![girls]!+dp[selected-1]![prev]!;}
  parts=Array.from({length:task.k-task.minimumGirls+1},(_,i)=>dp[task.k]![i+task.minimumGirls]!);break;
 }
 case 'digits':{
  const ends=task.digits.filter(d=>d%task.divisor===0||task.divisor===10&&d===0),counts=new Map(ends.map(d=>[d,0n]));
  const visit=(used:number[],value:number)=>{if(used.length===task.length){if(value%task.divisor===0)counts.set(used.at(-1)!,counts.get(used.at(-1)!)!+1n);return;}for(const d of task.digits)if(!used.includes(d)&&(used.length!==0||d!==0))visit([...used,d],10*value+d);};visit([],0);parts=ends.map(d=>counts.get(d)!);break;
 }
 case 'inclusion':{
  // Build disjoint cells A-only, B-only, both, neither and count labels directly.
  const aOnly=task.a-task.both,bOnly=task.b-task.both;const labels=Array.from({length:task.n},(_,i)=>i<aOnly?'a':i<aOnly+bOnly?'b':i<aOnly+bOnly+task.both?'both':'neither');
  if(labels.filter(x=>x==='a'||x==='both').length!==task.a||labels.filter(x=>x==='b'||x==='both').length!==task.b)return false;parts=[BigInt(labels.filter(x=>x==='neither').length)];break;
 }
 case 'handshakes':{let total=0n;for(let later=1;later<task.n;later++)total+=BigInt(later);parts=[total];break;}
 case 'probability':parts=[pascalChoose(task.red,2),pascalChoose(task.blue,2)];denominator=pascalChoose(task.red+task.blue,2);break;
 }
 return c.denominator===denominator&&c.parts.length===parts.length&&c.parts.every((v,i)=>v===parts[i])&&c.total===parts.reduce((s,x)=>s+x,0n);
}
const gcd=(a:bigint,b:bigint):bigint=>b===0n?a:gcd(b,a%b);
export function countingLesson(text:string){
 const c=countingCertificate(text);if(!c||!verifyCountingCertificate(c))return null;const t=c.task;let steps:CombinatoricsDeduction[],conclusion:string,subtopic:string;
 const combinationReason='Với một nhóm gồm $j$ người, xếp thứ tự nhóm đó có đúng $j!$ cách. Đếm các lựa chọn có thứ tự rồi chia cho $j!$ vì mọi nhóm không thứ tự bị đếm đúng bấy nhiêu lần; gọi số nhóm là $C_N^j$ với $N$ người. Với $j=0$ có một nhóm rỗng; nếu $j>N$ thì không có nhóm.';
 if(t.kind==='selection'){
  subtopic='Đếm nhóm không thứ tự theo số nữ';conclusion=`Vậy có $${c.total}$ cách chọn thỏa yêu cầu.`;
  const rows=c.parts.map((v,i)=>{const g=t.minimumGirls+i;return `${g}&${t.k-g}&C_{${t.girls}}^{${g}}C_{${t.boys}}^{${t.k-g}}=${v}`;});
  steps=[
   {title:'Xác định một cách chọn',explanation:`Chọn đồng thời nên một nhóm không thay đổi khi đổi thứ tự gọi tên các bạn; không chọn lại một bạn. ${combinationReason}`,math:'C_N^j=\\frac{N(N-1)\\cdots(N-j+1)}{j!}\\quad(1\\le j\\le N)',reason:'Đếm thứ tự rồi chia số hoán đổi của mỗi nhóm',question:'Ba bạn giống nhau nhưng được kể theo thứ tự khác nhau có thành nhóm mới không?'},
   {title:'Chia các trường hợp không trùng nhau',explanation:`Gọi $g$ là số nữ trong nhóm. Điều kiện ít nhất $${t.minimumGirls}$ nữ cho $g=${t.minimumGirls},\\ldots,${t.k}$; khi đó có đúng $${t.k}-g$ nam. Chọn nữ và nam độc lập vì hai tập học sinh tách nhau. Mỗi nhóm thuộc đúng một giá trị $g$; các trường hợp không đủ học sinh có0 cách.`,math:'\\begin{array}{c|c|l}g&\\text{nam}&\\text{số nhóm}\\\\\\hline '+rows.join('\\\\')+'\\end{array}',reason:'Quy tắc nhân trong mỗi trường hợp và phân loại đầy đủ theo số nữ',question:'Vì sao không có nhóm nào bị tính ở hai giá trị số nữ khác nhau?'},
   {title:'Cộng số nhóm của các trường hợp',explanation:`Các trường hợp đã bao quát và không giao nhau, nên cộng số nhóm trong bảng. ${t.minimumGirls===1?`Có thể kiểm tra bằng tổng mọi nhóm trừ nhóm toàn nam: $C_{${t.boys+t.girls}}^{${t.k}}-C_{${t.boys}}^{${t.k}}=${c.total}$.`:''} ${conclusion}`,math:c.parts.join('+')+'='+c.total,reason:'Quy tắc cộng cho các trường hợp không trùng nhau',question:'Tại sao được cộng các số nhóm mà không cần trừ phần trùng?'}];
 }else if(t.kind==='digits'){
  subtopic='Đếm số có thứ tự và chữ số khác nhau';conclusion=`Vậy lập được $${c.total}$ số thỏa yêu cầu.`;const ends=t.digits.filter(d=>d%t.divisor===0||t.divisor===10&&d===0);
  steps=[
   {title:'Xác định điều kiện từng vị trí',explanation:`Đây là số có $${t.length}$ chữ số nên chữ số đầu không được0. Chữ số đôi một khác nhau nên không dùng lại. Chia hết cho $${t.divisor}$ khi và chỉ khi chữ số cuối thuộc $\\{${ends.join(', ')}\\}$. Các trường hợp theo chữ số cuối không giao nhau.`,math:null,reason:'Dấu hiệu chia hết và điều kiện chữ số đầu của số nhiều chữ số',question:'Có được tính một dãy bắt đầu bằng0 là số có đủ chữ số không?'},
   {title:'Đếm sau khi cố định chữ số cuối',explanation:`Nếu cuối là0, chữ số đầu có $${t.digits.length-1}$ lựa chọn. Nếu cuối khác0, chữ số đầu không được bằng chữ số cuối${t.digits.includes(0)?' và cũng không được0':''}, nên có $${t.digits.length-1-(t.digits.includes(0)?1:0)}$ lựa chọn. Sau hai vị trí ấy còn $${t.digits.length-2}$ chữ số để điền lần lượt $${t.length-2}$ vị trí giữa; số lựa chọn giảm một sau mỗi vị trí. Thứ tự các vị trí làm nên các số khác nhau nên không chia cho giai thừa.`,math:'\\begin{array}{c|c}\\text{cuối}&\\text{số cách}\\\\\\hline '+ends.map((d,i)=>`${d}&${[t.digits.length-1-(d!==0&&t.digits.includes(0)?1:0),...Array.from({length:t.length-2},(_,j)=>t.digits.length-2-j)].join('\\cdot')}=${c.parts[i]}`).join('\\\\')+'\\end{array}',reason:'Quy tắc nhân với thứ tự vị trí, không lặp và không có0 đứng đầu',question:'Vì sao đổi hai chữ số giữa thường tạo một số khác, không phải đếm trùng?'},
   {title:'Cộng các chữ số cuối có thể có',explanation:`Mỗi số có duy nhất một chữ số cuối, nên cộng các dòng. ${conclusion}`,math:c.parts.length?c.parts.join('+')+'='+c.total:'0',reason:'Quy tắc cộng cho các trường hợp cuối khác nhau',question:'Một số có thể thuộc đồng thời hai dòng chữ số cuối không?'}];
  if(!ends.length){
   steps=[
    {title:'Kiểm tra chữ số cuối có thể có',explanation:`Trong các chữ số đã cho, không có chữ số nào có thể đứng cuối một số chia hết cho $${t.divisor}$. Vì điều kiện chữ số cuối là cần thiết, không thể lập số thỏa yêu cầu.`,math:'\\varnothing',reason:'Dấu hiệu chia hết kiểm tra ngay trên tập chữ số được phép dùng',question:'Trong các chữ số của đề, có chữ số nào được phép đứng cuối không?'},
    {title:'Kết luận không có số thỏa điều kiện',explanation:conclusion,math:'0',reason:'Không có chữ số cuối hợp lệ nên không có số hợp lệ',question:'Có cần đếm các vị trí đầu khi đã không chọn được vị trí cuối không?'}
   ];
  }
 }else if(t.kind==='inclusion'){
  subtopic='Đếm phần giao và phần bù';conclusion=`Vậy có $${c.total}$ em không thích môn nào trong hai môn đó.`;
  steps=[
   {title:'Chỉ ra phần bị đếm hai lần',explanation:`Cộng $${t.a}$ em thích Toán với $${t.b}$ em thích Văn thì $${t.both}$ em thích cả hai đã được tính hai lần. Trừ đi một lần phần đó, mỗi em thích ít nhất một môn được tính đúng một lần.`,math:`${t.a}+${t.b}-${t.both}=${t.a+t.b-t.both}`,reason:'Sửa phần giao bị đếm hai lần',question:'Một em thích cả hai môn xuất hiện mấy lần trong tổng ban đầu?'},
   {title:'Lấy phần bù trong cả lớp',explanation:`Nhóm thích ít nhất một môn và nhóm không thích môn nào tách nhau, hợp lại là toàn bộ $${t.n}$ em. ${conclusion}`,math:`${t.n}-(${t.a}+${t.b}-${t.both})=${c.total}`,reason:'Phần bù của tập thích ít nhất một môn',question:'Nhóm thích một môn và nhóm không thích môn nào có trùng nhau không?'}];
 }else if(t.kind==='handshakes'){
  subtopic='Đếm hai lần các cặp không thứ tự';conclusion=`Vậy có $${c.total}$ cái bắt tay.`;
  steps=[
   {title:'Đếm theo từng người',explanation:`Mỗi người có $${t.n-1}$ người khác để bắt tay. Cộng theo $${t.n}$ người cho $${t.n}\\cdot${t.n-1}$ lượt ghi nhận. Một cái bắt tay giữa hai người được ghi ở cả hai người.`,math:`${t.n}\\cdot${t.n-1}=${BigInt(t.n)*BigInt(t.n-1)}`,reason:'Mỗi người bắt tay mọi người còn lại đúng một lần',question:'Cái bắt tay của hai người được tính ở tên của mấy người?'},
   {title:'Chia đúng số lần đếm trùng',explanation:`Mọi cái bắt tay đều được ghi đúng hai lần, không phải tùy cặp. Chia cho2 để mỗi cặp được đếm một lần. ${conclusion}`,math:`\\frac{${t.n}\\cdot${t.n-1}}{2}=${c.total}`,reason:'Đếm hai lần, mỗi cặp có hai đầu mút',question:'Vì sao phải chia cho2 chứ không trừ một số cố định?'}];
 }else{
  subtopic='Xác suất cặp đồng khả năng';const common=gcd(c.total,c.denominator);conclusion=`Vậy xác suất cần tìm là $\\frac{${c.total/common}}{${c.denominator/common}}$.`;
  steps=[
   {title:'Đếm không gian cặp không thứ tự',explanation:`Các viên phân biệt và rút đồng thời nên mỗi kết quả là một cặp không thứ tự, không lặp viên. Đề cho mọi cặp có khả năng như nhau. ${combinationReason}`,math:`C_{${t.red+t.blue}}^2=\\frac{${t.red+t.blue}\\cdot${t.red+t.blue-1}}{2}=${c.denominator}`,reason:'Mỗi cặp bị đếm hai lần khi kể thứ tự rút; đồng khả năng do đề cho',question:'Rút đồng thời có phân biệt đỏ trước, xanh sau với xanh trước, đỏ sau không?'},
   {title:'Hai trường hợp cùng màu không giao nhau',explanation:`Hai viên cùng màu thì hoặc đều đỏ, hoặc đều xanh. Không có cặp thuộc cả hai trường hợp; các viên phân biệt nên chọn cặp trong từng màu.`,math:`C_{${t.red}}^2+C_{${t.blue}}^2=${c.parts[0]}+${c.parts[1]}=${c.total}`,reason:'Quy tắc cộng cho hai màu tách nhau',question:'Một cặp có thể vừa gồm hai viên đỏ vừa gồm hai viên xanh không?'},
   {title:'Lấy số cặp thuận lợi chia tổng số cặp',explanation:`Vì các cặp đồng khả năng, xác suất bằng số cặp cùng màu chia số cặp có thể rút. Rút gọn phân số bằng ước chung. ${conclusion}`,math:`\\frac{${c.total}}{${c.denominator}}=\\frac{${c.total/common}}{${c.denominator/common}}`,reason:'Định nghĩa xác suất với các kết quả đồng khả năng',question:'Vì sao chỉ được dùng tỉ số số cách khi mọi cặp có khả năng như nhau?'}];
 }
 const lesson=combinatoricsProofLesson(text,subtopic,'Xác định rõ đối tượng, thứ tự và phần trùng trước khi tính.',steps,conclusion);return lesson?{lesson,certificate:c}:null;
}
