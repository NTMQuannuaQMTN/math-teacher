import type {ModelLesson} from '../../../shared/src/solution';
import {normalizeProblemText} from '../../../shared/src/mathText';
import {algebraProofLesson,type AlgebraDeduction} from './algebraProofLesson';

type Task=
 |{kind:'power';text:string;base:number;exponent:number;modulus:number;remainder:number;cycle:number[]}
 |{kind:'gcdPowers';text:string;base:number;first:number;second:number;g:number;answer:bigint}
 |{kind:'sumSquares';text:string;total:number;solutions:[number,number][];firstVar:string;secondVar:string}
 |{kind:'repunit';text:string;digits:number};
export interface CertifiedNumberTheoryFamily {lesson:ModelLesson;verify:()=>boolean;label:string}

const plain=(input:string)=>normalizeProblemText(input).replace(/\$/g,'').replace(/\s+/g,' ').trim();
const gcd=(a:number,b:number):number=>{while(b){const r=a%b;a=b;b=r;}return Math.abs(a)};
const powMod=(base:number,exponent:number,modulus:number)=>{let a=BigInt(base%modulus),n=BigInt(exponent),out=1n,m=BigInt(modulus);while(n){if(n&1n)out=out*a%m;a=a*a%m;n>>=1n;}return Number(out)};
function parse(input:string):Task|null {
 const text=normalizeProblemText(input),p=plain(input);let m:RegExpExecArray|null;
 if(/\b(?:biết|giả sử|cho) thêm\b/iu.test(p))return null;
 m=/(?:chia\s+)?(\d+)\^\{?(\d+)\}?[^.]{0,45}(?:cho|chia cho|mod)\s*(\d+)/iu.exec(p);
 if(m){const base=Number(m[1]),exponent=Number(m[2]),modulus=Number(m[3]);if(base<1||base>1000||exponent<1||exponent>1e7||modulus<2||modulus>1000||gcd(base,modulus)!==1)return null;const cycle:number[]=[];let value=1;for(let i=1;i<=modulus;i++){value=value*base%modulus;cycle.push(value);if(value===1)break;}if(cycle.at(-1)!==1)return null;return {kind:'power',text,base,exponent,modulus,remainder:powMod(base,exponent,modulus),cycle};}
 const powers=[...p.matchAll(/(\d+)\^\{?(\d+)\}?\s*-\s*1/gu)];
 if(powers.length===2&&/(?:\\gcd|UCLN|ước chung lớn nhất)/iu.test(p)&&powers[0]![1]===powers[1]![1]){const base=Number(powers[0]![1]),first=Number(powers[0]![2]),second=Number(powers[1]![2]);if(base<2||base>20||first<1||second<1||first>60||second>60)return null;const g=gcd(first,second),answer=BigInt(base)**BigInt(g)-1n;return {kind:'gcdPowers',text,base,first,second,g,answer};}
 m=/\b([a-z])\^\{?2\}?\s*\+\s*([a-z])\^\{?2\}?\s*=\s*(\d+)/iu.exec(p);
 if(m&&/(?:cặp|nghiệm)/iu.test(p)&&/nguyên/iu.test(p)){const firstVar=m[1]!,secondVar=m[2]!,total=Number(m[3]);if(firstVar===secondVar||total<0||total>10000)return null;const limit=Math.floor(Math.sqrt(total)),solutions:[number,number][]=[];for(let x=-limit;x<=limit;x++)for(let y=-limit;y<=limit;y++)if(x*x+y*y===total)solutions.push([x,y]);return {kind:'sumSquares',text,total,solutions,firstVar,secondVar};}
 m=/(\d+)\s*chữ số(?: đều bằng)?\s*1/iu.exec(p);
 if(m){const digits=Number(m[1]);if(digits<2||digits>100000||digits%2)return null;return {kind:'repunit',text,digits};}
 return null;
}
function build(task:Task):ModelLesson|null {
 let subtopic:string,strategy:string,steps:AlgebraDeduction[],final:string;
 if(task.kind==='power'){
  const L=task.cycle.length,q=Math.floor(task.exponent/L),r=task.exponent%L,index=r===0?L:r;
  subtopic='Chu kỳ số dư của lũy thừa';strategy='Tính một chu kỳ đầy đủ, chia số mũ theo độ dài chu kỳ rồi đối chiếu số dư; không thay số lớn trực tiếp.';
  steps=[
   {title:'Tính các số dư cho đến khi chu kỳ khép lại',explanation:`Nhân lần lượt với $${task.base}$ và lấy số dư khi chia cho $${task.modulus}$. Lần đầu trở lại $1$ sau $${L}$ bước, nên phép nhân tiếp tục lặp lại đúng dãy này.`,math:`${task.cycle.map((v,i)=>`${task.base}^{${i+1}}\equiv${v}\pmod{${task.modulus}}`).join(',\quad ')}`,reason:'Nếu hai số có cùng số dư thì nhân cùng một số vẫn cho cùng số dư',question:'Chu kỳ trở lại số dư 1 sau bao nhiêu bước?'},
   {title:'Chia số mũ theo độ dài chu kỳ',explanation:`Ta có $${task.exponent}=${L}\cdot${q}+${r}$. Mỗi khối $${L}$ lũy thừa đóng góp số dư $1$.`,math:`${task.base}^{${L}}\equiv1\pmod{${task.modulus}}`,reason:'Phép chia có dư của số mũ và quy tắc nhân lũy thừa',question:'Số mũ để lại vị trí nào trong chu kỳ?'},
   {title:'Rút lũy thừa về vị trí trong chu kỳ',explanation:`Do đó $${task.base}^{${task.exponent}}=(${task.base}^{${L}})^{${q}}\cdot${task.base}^{${r}}$ có cùng số dư với vị trí $${index}$ của chu kỳ.`,math:`${task.base}^{${task.exponent}}\equiv${task.remainder}\pmod{${task.modulus}}`,reason:'Tính chất đồng dư khi nhân và nâng lũy thừa',question:'Số dư ở vị trí cần tìm là bao nhiêu?'},
   {title:'Kết luận bằng số dư chuẩn',explanation:`Số $${task.remainder}$ nằm từ $0$ đến $${task.modulus-1}$, nên đây là số dư duy nhất khi chia cho $${task.modulus}$.`,math:`0\le${task.remainder}<${task.modulus}`,reason:'Định nghĩa số dư trong phép chia có dư',question:'Số dư cuối cùng có nằm trong khoảng chuẩn không?'}];
  final=`Vậy số dư cần tìm là $${task.remainder}$.`;
 }else if(task.kind==='gcdPowers'){
  const a=task.base,m=task.first,n=task.second,g=task.g;
  subtopic='Thuật toán Euclid cho hiệu các lũy thừa';strategy='Mô phỏng đúng các phép chia số mũ của thuật toán Euclid và dùng hằng đẳng thức hiệu lũy thừa ở mỗi bước.';
  const exponentRows:string[]=[];let u=Math.max(m,n),v=Math.min(m,n);while(v){exponentRows.push(`${u}=${Math.floor(u/v)}\cdot${v}+${u%v}`);[u,v]=[v,u%v];}
  steps=[
   {title:'Nêu phép biến đổi Euclid cho lũy thừa',explanation:`Nếu $r=sq+t$, thì $${a}^{r}-1=(${a}^{s}-1)Q+(${a}^{t}-1)$ với $Q$ là số nguyên, vì $${a}^{sq}-1$ chia hết cho $${a}^{s}-1$. Vì thế thay số thứ nhất bằng số dư lũy thừa không đổi ước chung lớn nhất.`,math:`\gcd(${a}^{r}-1,${a}^{s}-1)=\gcd(${a}^{s}-1,${a}^{t}-1)`,reason:'Thuật toán Euclid và hằng đẳng thức hiệu hai lũy thừa',question:'Phần dư của số mũ dẫn đến phần dư nào của lũy thừa?'},
   {title:'Chạy thuật toán Euclid trên hai số mũ',explanation:'Thực hiện phép chia có dư liên tiếp; số dư khác 0 cuối cùng là ước chung lớn nhất của hai số mũ.',math:`\begin{gathered}${exponentRows.join('\\')}\end{gathered}`,reason:'Thuật toán Euclid trên số mũ',question:'Ước chung lớn nhất của hai số mũ bằng bao nhiêu?'},
   {title:'Chuyển từng phép chia sang hai số ban đầu',explanation:`Áp dụng đẳng thức ở bước 1 theo đúng từng dòng của thuật toán Euclid, cặp lũy thừa cuối cùng rút về $${a}^{${g}}-1$ và $0$.`,math:`\gcd(${a}^{${m}}-1,${a}^{${n}}-1)=${a}^{${g}}-1`,reason:'Lặp phép biến đổi Euclid đã chứng minh',question:'Dạng lũy thừa cuối cùng ứng với số mũ nào?'},
   {title:'Tính giá trị và kết luận',explanation:`Tính chính xác $${a}^{${g}}-1=${task.answer}$. Vậy ước chung lớn nhất cần tìm là $${task.answer}$.`,math:`${a}^{${g}}-1=${task.answer}`,reason:'Tính lũy thừa nguyên',question:'Giá trị số cuối cùng là bao nhiêu?'}];
  final=`Vậy $\gcd(${a}^{${m}}-1,${a}^{${n}}-1)=${task.answer}$.`;
 }else if(task.kind==='sumSquares'){
  const limit=Math.floor(Math.sqrt(task.total)),absPairs=[...new Set(task.solutions.map(([x,y])=>`${Math.abs(x)},${Math.abs(y)}`))].map(s=>s.split(',').map(Number) as [number,number]);
  subtopic='Phương trình tổng hai bình phương nguyên';strategy='Chặn trị tuyệt đối của từng ẩn, liệt kê bình phương hữu hạn rồi khôi phục mọi dấu và thứ tự.';
  steps=[
   {title:'Chứng minh miền tìm kiếm hữu hạn',explanation:`Vì $x^2,y^2\ge0$ và tổng bằng $${task.total}$, ta có $x^2\le${task.total}$ và $y^2\le${task.total}$. Do đó $|x|,|y|\le${limit}$.`,math:`-${limit}\le x,y\le${limit}`,reason:'Bình phương không âm và lấy căn hai vế',question:'Mỗi ẩn có thể có trị tuyệt đối lớn hơn căn của tổng không?'},
   {title:'Liệt kê các bình phương có thể dùng',explanation:`Các bình phương của số nguyên từ $0$ đến $${limit}$ là hữu hạn. Đối chiếu hai số trong danh sách có tổng $${task.total}$ cho các cặp trị tuyệt đối sau.`,math:`(|x|,|y|)\in\{${absPairs.map(p=>`(${p.join(',')})`).join(',')}\}`,reason:'Liệt kê đầy đủ trong giới hạn đã chứng minh',question:'Những cặp bình phương nào cộng lại đúng bằng vế phải?'},
   {title:'Khôi phục dấu và thứ tự không trùng',explanation:'Với tọa độ khác $0$, mỗi trị tuyệt đối cho hai dấu; nếu đổi thứ tự hai trị tuyệt đối khác nhau thì được cặp có thứ tự mới. Tọa độ bằng $0$ chỉ có một dấu. Liệt kê theo quy tắc này, không nhân máy móc cho trường hợp có số 0.',math:`(x,y)\in\{${task.solutions.map(p=>`(${p.join(',')})`).join(',')}\}`,reason:'Mỗi số nguyên được xác định bởi trị tuyệt đối và dấu; cặp có thứ tự',question:'Số 0 có tạo hai lựa chọn dấu khác nhau không?'},
   {title:'Kiểm tra và kết luận tính đầy đủ',explanation:`Mỗi cặp trong danh sách đều cho $x^2+y^2=${task.total}$. Ngược lại, bước 1 và 2 đã xét mọi trị tuyệt đối có thể, nên không còn nghiệm nào khác. Tổng cộng có $${task.solutions.length}$ cặp có thứ tự.`,math:`N=${task.solutions.length}`,reason:'Kiểm tra trực tiếp và hai chiều của phép liệt kê',question:'Vì sao danh sách không bỏ sót nghiệm có trị tuyệt đối khác?'}];
  final=`Vậy có $${task.solutions.length}$ cặp số nguyên có thứ tự: $${task.solutions.map(p=>`(${p.join(',')})`).join(', ')}$.`;
 }else{
  const pairs=task.digits/2;
  subtopic='Số gồm các chữ số 1 và dấu hiệu chia hết';strategy='Nhóm chữ số thành từng khối 11 theo đúng giá trị hàng thập phân, tạo phân tích nhân tử nguyên.';
  steps=[
   {title:'Viết số theo từng cặp chữ số',explanation:`Vì $${task.digits}=2\cdot${pairs}$ là số chẵn, ta nhóm từ phải sang trái thành $${pairs}$ khối “11”. Khối thứ $j$ kể từ phải có giá trị $11\cdot100^j$.`,math:`N=11+11\cdot100+\cdots+11\cdot100^{${pairs-1}}`,reason:'Giá trị theo vị trí trong hệ thập phân',question:'Mỗi cặp chữ số 11 được dịch sang trái bằng lũy thừa nào của 100?'},
   {title:'Đặt thừa số 11 ra ngoài',explanation:'Mọi số hạng trong tổng đều có thừa số $11$, nên dùng tính phân phối để đặt $11$ ra ngoài.',math:`N=11(1+100+\cdots+100^{${pairs-1}})`,reason:'Tính phân phối của phép nhân đối với phép cộng',question:'Tổng trong ngoặc có phải là số nguyên không?'},
   {title:'Xác nhận thương là số nguyên',explanation:`Mỗi $100^j$ là số nguyên không âm và tổng có hữu hạn $${pairs}$ số hạng, nên biểu thức trong ngoặc là số nguyên. Do đó tồn tại số nguyên $Q$ sao cho $N=11Q$.`,math:`Q=1+100+\cdots+100^{${pairs-1}}\in\mathbb Z`,reason:'Tính đóng của số nguyên qua phép cộng và nhân',question:'Điều gì cần chứng minh để kết luận chia hết?'},
   {title:'Kết luận theo định nghĩa chia hết',explanation:`Ta đã viết chính số có $${task.digits}$ chữ số $1$ dưới dạng $11$ nhân với một số nguyên. Vì vậy số ấy chia hết cho $11$.`,math:'N\vdots 11',reason:'Định nghĩa chia hết',question:'Dạng tích nào chứng minh ngay kết luận?'}];
  final=`Vậy số có đúng $${task.digits}$ chữ số $1$ liên tiếp chia hết cho $11$.`;
 }
 let lesson=algebraProofLesson(task.text,subtopic,strategy,steps,final,{topic:'number_theory'});
 if(lesson&&task.kind==='sumSquares'&&(task.firstVar!=='x'||task.secondVar!=='y')){
  const replaceFormula=(value:string)=>value.replace(/x/g,task.firstVar).replace(/y/g,task.secondVar);
  const rewrite=(value:any,key=''):any=>typeof value==='string'?(key==='math'?replaceFormula(value):value.replace(/\$[^$]+\$/g,replaceFormula)):Array.isArray(value)?value.map(v=>rewrite(v,key)):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([k,v])=>[k,rewrite(v,k)])):value;
  lesson=rewrite(lesson) as ModelLesson;
 }
 return lesson;
}
function verify(task:Task):boolean {
 if(task.kind==='power')return task.remainder===powMod(task.base,task.exponent,task.modulus)&&task.cycle.length>0&&task.cycle.at(-1)===1;
 if(task.kind==='gcdPowers'){const x=BigInt(task.base)**BigInt(task.first)-1n,y=BigInt(task.base)**BigInt(task.second)-1n;let a=x,b=y;while(b){const r=a%b;a=b;b=r;}return a===task.answer;}
 if(task.kind==='sumSquares'){const limit=Math.floor(Math.sqrt(task.total)),expected:[number,number][]=[];for(let x=-limit;x<=limit;x++)for(let y=-limit;y<=limit;y++)if(x*x+y*y===task.total)expected.push([x,y]);return JSON.stringify(expected)===JSON.stringify(task.solutions);}
 return task.digits%2===0&&task.digits>=2;
}
export function certifiedNumberTheoryFamily(input:string):CertifiedNumberTheoryFamily|null {
 const task=parse(input);if(!task||!verify(task))return null;const lesson=build(task);if(!lesson)return null;
 return {lesson,verify:()=>verify(task),label:'Kiểm tra độc lập số dư bằng lũy thừa nhanh, Euclid trên số nguyên lớn, liệt kê hữu hạn hoặc phân tích thập phân'};
}
