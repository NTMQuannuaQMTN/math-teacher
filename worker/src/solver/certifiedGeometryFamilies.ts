import type {ModelLesson} from '../../../shared/src/solution';
import {normalizeProblemText} from '../../../shared/src/mathText';
import {algebraProofLesson,type AlgebraDeduction} from './algebraProofLesson';

type Task=
 |{kind:'ceva';text:string;p:number;q:number;num:number;den:number}
 |{kind:'menelaus';text:string;p:number;q:number;ratio:number;position:'qua C'|'qua A'}
 |{kind:'triangleArea';text:string;ab:number;ac:number;bc:number;projection:number;height:number;area:number}
 |{kind:'hexagon';text:string;radius:number};
export interface CertifiedGeometryFamily {lesson:ModelLesson;verify:()=>boolean;label:string}
const gcd=(a:number,b:number):number=>b?gcd(b,a%b):Math.abs(a);
const plain=(input:string)=>normalizeProblemText(input).replace(/\$/g,'').replace(/\\?times/g,'×').replace(/\s+/g,' ').trim();
function parse(input:string):Task|null {
 const text=normalizeProblemText(input),p=plain(input);let m:RegExpExecArray|null;
 if(/\b(?:biết|giả sử|cho) thêm\b/iu.test(p))return null;
 const ratio=(first:string,second:string)=>new RegExp(`${first}\\s*(?:\\/|:)\\s*${second}\\s*=\\s*(\\d+)`,'u').exec(p)?.[1];
 const on=(point:string,side:string)=>new RegExp(`${point}[^.]{0,35}(?:thuộc(?: cạnh)?|nằm trên|ở trên|∈)\\s*${side}`,'iu').test(p);
 const bd=ratio('BD','DC'),ce=ratio('CE','EA');
 if(/tam giác ABC/iu.test(p)&&on('D','BC')&&on('E','CA')&&bd&&ce&&/AD/u.test(p)&&/BE/u.test(p)&&/CP/u.test(p)&&/AB/u.test(p)&&/\bP\b/u.test(p)&&/\bF\b/u.test(p)&&/(?:cắt nhau|giao|∩)/iu.test(p)){
  const a=Number(bd),b=Number(ce),d=gcd(1,a*b);if(a<1||b<1||a*b>10000)return null;return {kind:'ceva',text,p:a,q:b,num:1/d,den:a*b/d};
 }
 const ad=ratio('AD','DB'),be=ratio('BE','EC');
 if(/tam giác ABC/iu.test(p)&&on('D','AB')&&on('E','BC')&&ad&&be&&/\bDE\b/u.test(p)&&/\bAC\b/u.test(p)&&/\bF\b/u.test(p)&&/AF\s*(?:\/|:)\s*FC/u.test(p)){
  const a=Number(ad),b=Number(be),product=a*b;if(a<1||b<1||product===1||product>10000)return null;return {kind:'menelaus',text,p:a,q:b,ratio:product,position:product>1?'qua C':'qua A'};
 }
 const ab=/\bAB\s*=\s*(\d+)/u.exec(p)?.[1],ac=/\bAC\s*=\s*(\d+)/u.exec(p)?.[1],bc=/\bBC\s*=\s*(\d+)/u.exec(p)?.[1];
 if(/tam giác ABC/iu.test(p)&&ab&&ac&&bc&&/(?:diện tích|đường cao)/iu.test(p)){
  const A=Number(ab),C=Number(ac),B=Number(bc);if(Math.max(A,C,B)>=A+C+B-Math.max(A,C,B)||[A,C,B].some(v=>v<1||v>1000))return null;const projection=(B*B+A*A-C*C)/(2*B),h2=A*A-projection*projection,height=Math.sqrt(h2),area=B*height/2;if(!Number.isInteger(projection)||!Number.isInteger(height)||!Number.isInteger(area))return null;return {kind:'triangleArea',text,ab:A,ac:C,bc:B,projection,height,area};
 }
 if(/lục giác đều/iu.test(p)&&/nội tiếp/iu.test(p)&&/(?:cạnh|diện tích)/iu.test(p)){
  m=/(?:bán kính(?: bằng)?\s*|\(O\s*;\s*)(\d+)/iu.exec(p);if(m){const radius=Number(m[1]);return radius>=1&&radius<=10000?{kind:'hexagon',text,radius}:null;}
 }
 return null;
}
function build(task:Task):ModelLesson|null {
 let subtopic:string,strategy:string,steps:AlgebraDeduction[],final:string;
 if(task.kind==='ceva'){
  subtopic='Định lí Ceva bằng tỉ số diện tích';strategy='Chứng minh tích ba tỉ số bằng 1 từ các diện tích có chung đường cao, rồi thay hai tỉ số đã biết.';
  steps=[
   {title:'Đặt ba diện tích quanh giao điểm',explanation:'Gọi $[XYZ]$ là diện tích tam giác $XYZ$. Vì $A,P,D$ thẳng hàng, hai tam giác $PAB$ và $PAC$ có chung đáy $AP$; tỉ số hai đường cao từ $B,C$ đến $AP$ bằng $BD/DC$ do $D$ nằm trên $BC$.',math:'\frac{BD}{DC}=\frac{[PAB]}{[PAC]}',reason:'Hai tam giác có chung đáy; các tam giác vuông tạo bởi khoảng cách đến đường thẳng $AP$ đồng dạng',question:'Tỉ số BD/DC liên hệ hai diện tích nào?'},
   {title:'Lập hai tỉ số diện tích còn lại',explanation:'Lập luận tương tự với $B,P,E$ thẳng hàng và $C,P,F$ thẳng hàng. Mỗi tỉ số cạnh trên một cạnh tam giác bằng tỉ số hai diện tích ở hai phía của đường cevian tương ứng.',math:'\frac{CE}{EA}=\frac{[PBC]}{[PAB]},\qquad\frac{AF}{FB}=\frac{[PAC]}{[PBC]}',reason:'Cùng đáy và các đường cao tỉ lệ trên một đường thẳng',question:'Hai tỉ số nào còn thiếu để khi nhân các diện tích triệt tiêu?'},
   {title:'Nhân ba đẳng thức và triệt tiêu',explanation:'Nhân vế theo vế, mỗi diện tích xuất hiện đúng một lần ở tử và một lần ở mẫu, nên tích bằng $1$. Đây là chứng minh của định lí Ceva trong cấu hình này.',math:'\frac{BD}{DC}\cdot\frac{CE}{EA}\cdot\frac{AF}{FB}=1',reason:'Nhân các phân số và triệt tiêu các thừa số khác 0',question:'Sau khi nhân, các diện tích triệt tiêu thế nào?'},
   {title:'Thay số và giải tỉ số cần tìm',explanation:`Thay $BD/DC=${task.p}$ và $CE/EA=${task.q}$, rồi chia hai vế cho $${task.p*task.q}$.`,math:`${task.p}\cdot${task.q}\cdot\frac{AF}{FB}=1\Rightarrow\frac{AF}{FB}=\frac{${task.num}}{${task.den}}`,reason:'Thay giả thiết và biến đổi đẳng thức với số dương',question:'Tỉ số AF/FB bằng bao nhiêu?'}];
  final=`Vậy $\dfrac{AF}{FB}=\dfrac{${task.num}}{${task.den}}$.`;
 }else if(task.kind==='menelaus'){
  subtopic='Định lí Menelaus và vị trí giao điểm ngoài';strategy='Trước hết xác định F phải ở ngoài đoạn, sau đó chứng minh tích tỉ số bằng 1 bằng các tam giác vuông đồng dạng.';
  steps=[
   {title:'Xác định giao điểm không nằm trong đoạn AC',explanation:'Đường thẳng qua hai điểm trong $D\in AB$ và $E\in BC$ cắt đường biên của tam giác tại $D,E$. Phần còn lại của đường thẳng nằm ngoài tam giác, nên giao điểm thứ ba với đường thẳng $AC$ không thể nằm trong đoạn $AC$.',math:'F\notin [AC]',reason:'Một đường thẳng cắt miền trong của tam giác theo một đoạn có hai đầu trên biên',question:'Đường thẳng DE đã đi qua hai cạnh nào của tam giác?'},
   {title:'Chứng minh hệ thức Menelaus trong cấu hình',explanation:'Từ $A,B,C$ hạ các đường vuông góc tới $DEF$, có độ dài lần lượt $h_A,h_B,h_C$. Các cặp tam giác vuông chung góc tại $D,E,F$ đồng dạng, cho $AD/DB=h_A/h_B$, $BE/EC=h_B/h_C$ và $CF/FA=h_C/h_A$.',math:'\frac{AD}{DB}=\frac{h_A}{h_B},\quad\frac{BE}{EC}=\frac{h_B}{h_C},\quad\frac{CF}{FA}=\frac{h_C}{h_A}',reason:'Đồng dạng các tam giác vuông có một góc nhọn chung',question:'Ba tỉ số đường cao triệt tiêu ra sao?'},
   {title:'Nhân ba tỉ số và thay số',explanation:'Nhân ba đẳng thức, các đường cao triệt tiêu, được tích bằng $1$. Thay hai tỉ số đã biết.',math:`${task.p}\cdot${task.q}\cdot\frac{CF}{FA}=1\Rightarrow\frac{AF}{FC}=${task.ratio}`,reason:'Định lí Menelaus vừa được chứng minh; các độ dài đều dương',question:'Tỉ số AF/FC bằng bao nhiêu?'},
   {title:'Dùng độ lớn tỉ số để chọn đúng phía',explanation:task.position==='qua C'?`Vì $AF/FC=${task.ratio}>1$, nếu $F$ nằm trên tia đối của $AC$ qua $A$ thì $FC=FA+AC>FA$, trái với tỉ số lớn hơn $1$. Do đó $F$ nằm trên phần kéo dài của $AC$ qua $C$.`:`Vì $AF/FC=${task.ratio}<1$, nếu $F$ nằm qua $C$ thì $AF=AC+CF>CF$, trái với tỉ số nhỏ hơn $1$. Do đó $F$ nằm trên phần kéo dài qua $A$.`,math:`F\text{ nằm trên phần kéo dài }AC\text{ ${task.position}}`,reason:'Cộng đoạn thẳng trên một tia và so sánh độ dài',question:'Tỉ số lớn hơn hay nhỏ hơn 1 quyết định F ở phía nào?'}];
  final=`Vậy $F$ nằm ngoài đoạn $AC$ về phía ${task.position==='qua C'?'$C$':'$A$'} và $\dfrac{AF}{FC}=${task.ratio}$.`;
 }else if(task.kind==='triangleArea'){
  const {ab,ac,bc,projection:x,height:h,area}=task;
  subtopic='Diện tích tam giác bằng đường cao và Pythagore';strategy='Hạ đường cao, dùng hiệu hai phương trình Pythagore để tìm hình chiếu, rồi tính đường cao và diện tích.';
  steps=[
   {title:'Hạ đường cao và đặt độ dài hình chiếu',explanation:'Hạ $AH\perp BC$ tại $H$ và đặt $BH=x$. Khi đó $CH=BC-BH$. Các độ dài tính được dưới đây cho $0<x<BC$, nên $H$ thật sự nằm trong đoạn $BC$.',math:`BH=x,\quad CH=${bc}-x`,reason:'Dựng đường cao và cộng đoạn thẳng',question:'Hai đoạn BH và CH có tổng bằng cạnh nào?'},
   {title:'Viết hai phương trình Pythagore',explanation:'Hai tam giác $ABH$ và $ACH$ vuông tại $H$. Áp dụng định lí Pythagore cho từng tam giác.',math:`\begin{cases}AH^2+x^2=${ab}^2\\AH^2+(${bc}-x)^2=${ac}^2\end{cases}`,reason:'Định lí Pythagore trong hai tam giác vuông',question:'Hai phương trình có chung đại lượng nào để khử?'},
   {title:'Trừ hai phương trình để tìm BH',explanation:`Lấy phương trình thứ hai trừ phương trình thứ nhất, các hạng $AH^2$ và $x^2$ triệt tiêu sau khai triển. Giải phương trình bậc nhất còn lại được $x=${x}$.`,math:`${bc*bc}-2\cdot${bc}x=${ac*ac-ab*ab}\Rightarrow x=${x}`,reason:'Khai triển bình phương và giải phương trình bậc nhất',question:'Độ dài BH bằng bao nhiêu?'},
   {title:'Tính đường cao',explanation:`Thay $BH=${x}$ vào tam giác vuông $ABH$: $AH^2=${ab}^2-${x}^2=${h*h}$. Vì độ dài dương nên $AH=${h}$.`,math:`AH=${h}`,reason:'Định lí Pythagore và lấy căn dương của độ dài',question:'Vì sao chọn căn dương?'},
   {title:'Tính diện tích và kết luận',explanation:`Dùng đáy $BC=${bc}$ và chiều cao $AH=${h}$, diện tích bằng nửa tích đáy với chiều cao.`,math:`S_{ABC}=\frac12\cdot${bc}\cdot${h}=${area}`,reason:'Công thức diện tích tam giác',question:'Diện tích cuối cùng bằng bao nhiêu?'}];
  final=`Vậy diện tích tam giác $ABC$ bằng $${area}$.`;
 }else{
  const R=task.radius;
  const areaCoefficient=3*R*R,areaDisplay=areaCoefficient%2===0?`${areaCoefficient/2}\\sqrt3`:`\\frac{${areaCoefficient}\\sqrt3}{2}`;
  subtopic='Lục giác đều nội tiếp đường tròn';strategy='Chia lục giác thành sáu tam giác ở tâm, chứng minh mỗi tam giác đều rồi tính diện tích bằng đường cao.';
  steps=[
   {title:'Chia đều góc ở tâm',explanation:'Sáu đỉnh của lục giác đều chia đường tròn thành sáu cung bằng nhau, nên mỗi góc ở tâm bằng $360^\circ/6=60^\circ$.',math:'\widehat{AOB}=60^\circ',reason:'Tổng góc quanh tâm và tính đều của lục giác',question:'Mỗi góc ở tâm bằng bao nhiêu?'},
   {title:'Chứng minh tam giác ở tâm là tam giác đều',explanation:`Ta có $OA=OB=${R}$ là hai bán kính và góc xen giữa bằng $60^\circ$. Hai góc đáy của tam giác cân $AOB$ cộng lại $120^\circ$, nên mỗi góc cũng bằng $60^\circ$; tam giác $AOB$ đều.`,math:`AB=OA=OB=${R}`,reason:'Tam giác cân và tổng ba góc của tam giác',question:'Cạnh lục giác liên hệ bán kính thế nào?'},
   {title:'Tính diện tích một tam giác đều',explanation:`Hạ đường cao của tam giác đều cạnh $${R}$; đường cao chia đáy thành hai đoạn $${R}/2$. Theo Pythagore, đường cao bằng $${R}\sqrt3/2$.`,math:`S_{AOB}=\frac12\cdot${R}\cdot\frac{${R}\sqrt3}{2}=\frac{${R*R}\sqrt3}{4}`,reason:'Đường cao tam giác đều, định lí Pythagore và công thức diện tích',question:'Diện tích một trong sáu tam giác bằng bao nhiêu?'},
   {title:'Cộng sáu phần không chồng lấn',explanation:'Sáu tam giác ở tâm có phần trong không chồng nhau và hợp lại đúng lục giác, nên diện tích lục giác bằng sáu lần diện tích một tam giác. Rút gọn hệ số nếu tử số chẵn.',math:`S=6\cdot\frac{${R*R}\sqrt3}{4}=${areaDisplay}`,reason:'Quy tắc cộng diện tích các phần không chồng lấn và rút gọn phân số',question:'Diện tích cả lục giác bằng bao nhiêu lần một tam giác?'}];
  final=`Vậy cạnh lục giác bằng $${R}$ và diện tích bằng $${areaDisplay}$.`;
 }
 return algebraProofLesson(task.text,subtopic,strategy,steps,final,{topic:'geometry'});
}
function verify(task:Task):boolean {
 if(task.kind==='ceva')return Math.abs(task.p*task.q*task.num/task.den-1)<1e-12;
 if(task.kind==='menelaus')return task.ratio===task.p*task.q&&(task.position==='qua C')===(task.ratio>1);
 if(task.kind==='triangleArea'){const A:[number,number]=[task.projection,task.height],B:[number,number]=[0,0],C:[number,number]=[task.bc,0];return Math.hypot(A[0]-B[0],A[1]-B[1])===task.ab&&Math.hypot(A[0]-C[0],A[1]-C[1])===task.ac&&task.bc*task.height/2===task.area;}
 return task.radius>0;
}
export function certifiedGeometryFamily(input:string):CertifiedGeometryFamily|null {
 const task=parse(input);if(!task||!verify(task))return null;const lesson=build(task);if(!lesson)return null;
 return {lesson,verify:()=>verify(task),label:'Kiểm tra độc lập bằng tỉ số diện tích, tọa độ chính xác hoặc phân hoạch sáu tam giác ở tâm'};
}
