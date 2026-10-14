import {parseMathText} from '../../../shared/src/mathText';
import {integerPolynomial,residueCertificate,verifyResidueCertificate,type ResidueCertificate} from '../../../shared/src/integerPolynomial';
import {algebraProofLesson,type AlgebraDeduction} from './algebraProofLesson';
interface SquareTask {text:string;variable:string;expression:string;domain:'integer'|'positive'|'natural'}
export type SquareCertificate = {kind:'obstruction';task:SquareTask;polynomial:ResidueCertificate;squares:ResidueCertificate} | {kind:'gap';task:SquareTask;constant:number;rows:{u:number;v:number;root:number;n:number;accepted:boolean}[];solutions:number[];all:boolean};
function squareTask(text:string):SquareTask|null {
 const maths:string[]=[];if(text.includes('§'))return null;
 const template=parseMathText(text.trim()).map(s=>s.kind==='math'?`§${maths.push(s.value)-1}§`:s.value).join('').replace(/\s+/g,' ').trim();
 const m=/^Tìm (?:tất cả )?(?:các )?(số nguyên|số nguyên dương|số tự nhiên) §0§ sao cho §1§ là số chính phương\.?$/iu.exec(template);
 if(!m||maths.length!==2||!/^[a-z]$/u.test(maths[0]!.trim()))return null;
 return {text,variable:maths[0]!.trim(),expression:maths[1]!,domain:m[1]!.toLowerCase()==='số nguyên'?'integer':m[1]!.toLowerCase()==='số nguyên dương'?'positive':'natural'};
}
const admissible=(n:number,domain:SquareTask['domain'])=>domain==='integer'||n>=(domain==='natural'?0:1);
export function integerSquareCertificate(text:string):SquareCertificate|null {
 const task=squareTask(text);if(!task)return null;
 for(let m=2;m<=16;m++){
  const polynomial=residueCertificate(task.expression,m,task.variable),squares=residueCertificate('t^2',m,'t');
  if(!polynomial||!squares)return null;
  if(!polynomial.remainders.some(v=>squares.remainders.includes(v)))return {kind:'obstruction',task,polynomial,squares};
 }
 const p=integerPolynomial(task.expression,task.variable);if(!p||p.coefficients.length!==3||p.coefficients[1]!==0n||p.coefficients[2]!==1n||p.coefficients[0]!>10000n||p.coefficients[0]!< -10000n)return null;
 const constant=Number(p.coefficients[0]),rows:Extract<SquareCertificate,{kind:'gap'}>['rows']=[];
 if(!constant)return {kind:'gap',task,constant,rows,solutions:[],all:true};
 for(let u=-Math.abs(constant);u<=Math.abs(constant);u++)if(u&&constant%u===0){const v=constant/u,root=(u+v)/2,n=(v-u)/2,accepted=Number.isInteger(root)&&Number.isInteger(n)&&root>=0&&admissible(n,task.domain);rows.push({u,v,root,n,accepted});}
 if(rows.length>48)return null;
 const solutions=[...new Set(rows.filter(r=>r.accepted).map(r=>r.n))].sort((a,b)=>a-b);
 return {kind:'gap',task,constant,rows,solutions,all:false};
}
export function verifyIntegerSquareCertificate(c:SquareCertificate):boolean {
 try{
  const task=squareTask(c.task.text);if(!task||JSON.stringify(task)!==JSON.stringify(c.task))return false;
  if(c.kind==='obstruction')return c.polynomial.expression===task.expression&&c.polynomial.variable===task.variable&&c.squares.expression==='t^2'&&c.polynomial.modulus===c.squares.modulus&&verifyResidueCertificate(c.polynomial)&&verifyResidueCertificate(c.squares)&&!c.polynomial.remainders.some(v=>c.squares.remainders.includes(v));
  const p=integerPolynomial(task.expression,task.variable);if(!p||p.coefficients.length!==3||p.coefficients[1]!==0n||p.coefficients[2]!==1n||p.coefficients[0]!==BigInt(c.constant)||Math.abs(c.constant)>10000)return false;
  if(c.constant===0)return c.all&&!c.rows.length&&!c.solutions.length;
  if(c.all)return false;
  // Independent root scan: |t|≤|c| since t=(u+v)/2 and each factor is bounded by|c|.
  const solutions:number[]=[];
  for(let n=-Math.abs(c.constant);n<=Math.abs(c.constant);n++)if(admissible(n,task.domain)){
   const value=n*n+c.constant;if(value<0)continue;
   const root=Math.floor(Math.sqrt(value));if(root*root===value)solutions.push(n);
  }
  if(solutions.join(',')!==c.solutions.join(','))return false;
  const divisors=Array.from({length:2*Math.abs(c.constant)+1},(_,i)=>i-Math.abs(c.constant)).filter(u=>u&&c.constant%u===0);
  if(c.rows.length!==divisors.length)return false;
  return c.rows.every((r,i)=>r.u===divisors[i]&&r.v===c.constant/r.u&&r.root===(r.u+r.v)/2&&r.n===(r.v-r.u)/2&&r.accepted===(Number.isInteger(r.root)&&Number.isInteger(r.n)&&r.root>=0&&admissible(r.n,task.domain)));
 }catch{return false;}
}
export function integerSquareLesson(text:string) {
 const c=integerSquareCertificate(text);if(!c||!verifyIntegerSquareCertificate(c))return null;
 const {variable:n,expression,domain}=c.task,word=domain==='integer'?'nguyên':domain==='natural'?'tự nhiên (kể cả 0)':'nguyên dương',details:AlgebraDeduction[]=[];
 const root=['t','s','h','z'].find(v=>v!==n)!,aux=['u','v','a','b'].filter(v=>![n,root].includes(v)),U=aux[0]!,V=aux[1]!,R=['r','w','k'].find(v=>![n,root].includes(v))!,Q=['q','k','j'].find(v=>![n,root,R].includes(v))!;
 let answer:string;
 if(c.kind==='obstruction'){
  const m=c.polynomial.modulus,values=[...new Set(c.polynomial.remainders)].sort((a,b)=>a-b),squares=[...new Set(c.squares.remainders)].sort((a,b)=>a-b);
  details.push({title:'Nêu các số dư có thể của một số chính phương',explanation:`Mọi số chính phương có dạng $${root}^2$ với $${root}$ nguyên không âm. Chia $${root}$ cho $${m}$, số dư thuộc $0,1,\\ldots,${m-1}$. Bình phương các số dư rồi chia $${m}$ cho bảng bên dưới. Vì $${root}^2-${R}^2=(${root}-${R})(${root}+${R})$, thay $${root}$ bởi số dư $${R}$ không làm đổi số dư của bình phương.`,math:`\\begin{array}{c|${'c'.repeat(m)}}${R}&${Array.from({length:m},(_,r)=>r).join('&')}\\\\\\hline ${R}^2\\bmod ${m}&${c.squares.remainders.join('&')}\\end{array}`,reason:'Hiệu hai bình phương; phép chia có dư đầy đủ',question:'Bình phương một số nguyên có thể cho những số dư nào?'});
  details.push({title:'Chứng minh các số dư của biểu thức gốc cũng được xét đầy đủ',explanation:`Gọi $P(${n})=${expression}$. Với $${n}=${m}${Q}+${R}$, ta có $${n}-${R}$ chia hết cho $${m}$. Hiệu từng lũy thừa của $${n}$ và $${R}$ chia hết cho $${m}$ nhờ hằng đẳng thức hiệu lũy thừa; cộng với các hệ số nguyên của đa thức, suy ra $P(${n})-P(${R})$ chia hết cho $${m}$. Vì thế chỉ cần xét tất cả số dư $${R}$, kể cả khi $${n}$ âm.`,math:`P(${n})\\equiv P(${R})\\pmod{${m}}`,reason:'Đa thức hệ số nguyên giữ đồng dư; không thay miền vô hạn bằng một mẫu thử',question:'Tại sao xét các lớp số dư bao quát mọi số nguyên?'});
  details.push({title:'Tính các số dư của biểu thức và đối chiếu',explanation:`Thay lần lượt từng số dư vào biểu thức rồi chia $${m}$, được bảng. Các số dư của biểu thức thuộc $\\{${values.join(',')}\\}$, còn số chính phương chỉ có số dư thuộc $\\{${squares.join(',')}\\}$. Hai tập không có phần tử chung.`,math:`\\begin{array}{c|${'c'.repeat(m)}}${R}&${Array.from({length:m},(_,r)=>r).join('&')}\\\\\\hline P(${R})\\bmod ${m}&${c.polynomial.remainders.join('&')}\\end{array}`,reason:'Xét hết số dư; hai tập số dư rời nhau',question:'Có số dư nào vừa thuộc biểu thức vừa thuộc số chính phương không?'});
  answer=`Vậy không có số ${word} $${n}$ làm $${expression}$ là số chính phương.`;
  details.push({title:'Kết luận không thể xảy ra, không bỏ sót trường hợp',explanation:`Nếu biểu thức là số chính phương thì nó phải có một trong các số dư của bình phương, trái với các số dư vừa xét đầy đủ. ${answer}`,math:null,reason:'Mâu thuẫn giữa hai tập số dư đã chứng minh đầy đủ',question:'Vì sao mâu thuẫn số dư loại được mọi giá trị, không chỉ những số đã thử?'});
 }else if(c.all){
  answer=`Vậy mọi số ${word} $${n}$ đều thỏa mãn.`;
  details.push({title:'Rút gọn và nhận ra bình phương',explanation:`Khai triển và thu gọn biểu thức gốc được đúng $${n}^2$. Với mọi số ${word}, $${n}$ nguyên nên bình phương của nó là số chính phương. ${answer}`,math:`${expression}=${n}^2`,reason:'Đẳng thức đa thức; định nghĩa số chính phương',question:'Biểu thức rút gọn có phải bình phương của một số nguyên không?'});
 }else{
  const k=c.constant;
  details.push({title:'Đưa điều kiện chính phương về hiệu hai bình phương',explanation:`Khai triển và thu gọn biểu thức gốc được $${n}^2${k>=0?'+':''}${k}$. Đặt nó bằng $${root}^2$ với $${root}$ nguyên không âm; đây là điều kiện cần và đủ để là số chính phương. Chuyển vế và phân tích hiệu hai bình phương, đặt $${U}=${root}-${n}$, $${V}=${root}+${n}$.`,math:`${root}^2-${n}^2=${k},\\quad (${root}-${n})(${root}+${n})=${k}`,reason:'Định nghĩa số chính phương; hiệu hai bình phương',question:'Đặt biểu thức bằng bình phương của số nguyên nào để phân tích thành tích?'});
  details.push({title:'Giới hạn hữu hạn và điều kiện của đổi biến ngược',explanation:`Vì $${U}${V}=${k}\\ne0$, $${U}$ là ước nguyên khác 0 của $${k}$, gồm cả hai dấu. Cả $|${U}|,|${V}|$ đều không quá $${Math.abs(k)}$. Ngược lại, $${root}=(${U}+${V})/2$, $${n}=(${V}-${U})/2$: chỉ nhận khi $${U},${V}$ cùng tính chẵn lẻ, $${root}\\ge0$, và $${n}$ thuộc đúng miền số ${word}.`,math:`${k}\\vdots ${U},\\quad ${V}=${k}/${U},\\quad ${root}=\\frac{${U}+${V}}{2},\\quad ${n}=\\frac{${V}-${U}}{2}`,reason:'Ước của tích khác không; điều kiện nguyên, không âm và miền gốc',question:'Hai thừa số phải thỏa tính chẵn lẻ và dấu nào để đổi lại thành số nguyên?'});
  for(let i=0;i<c.rows.length;i+=6){const rows=c.rows.slice(i,i+6);details.push({title:`Xét các cặp thừa số từ ${i+1} đến ${i+rows.length}`,explanation:'Tính các giá trị theo đổi biến ngược ở từng cặp thừa số. Cặp không cho hai số nguyên, căn không âm và miền yêu cầu bị loại; dấu $\\checkmark$ ghi hàng được nhận, còn dấu $\\times$ ghi hàng bị loại.',math:`\\begin{gathered}${rows.map(r=>`(${U},${V})=(${r.u},${r.v})\\Rightarrow(${root},${n})=(${r.root},${r.n})\\quad${r.accepted?'\\checkmark':'\\times'}`).join('\\\\')}\\end{gathered}`,reason:'Xét tất cả ước; kiểm tra mọi điều kiện của đổi biến',question:'Hàng nào cho số nguyên thuộc miền gốc và căn không âm?'});}
  answer=c.solutions.length?`Vậy tất cả nghiệm là $${n}\\in\\{${c.solutions.join(',')}\\}$.`:`Vậy không có số ${word} thỏa mãn.`;
  details.push({title:'Kiểm tra nghiệm và kết luận đầy đủ',explanation:`Với mỗi giá trị được nhận, cặp thừa số cho $${root}$ nguyên không âm và $${n}^2${k>=0?'+':''}${k}=${root}^2$, nên thỏa yêu cầu. Mọi nghiệm ban đầu đều phải cho một cặp thừa số đã xét; vì thế không còn nghiệm khác. ${answer}`,math:c.solutions.length?`\\begin{gathered}${c.solutions.map(v=>`${n}=${v}:\\quad ${v*v}${k>=0?'+':''}${k}=${v*v+k}`).join('\\\\')}\\end{gathered}`:null,reason:'Hai chiều của phân tích nhân tử và đối chiếu miền; kiểm tra biểu thức gốc',question:'Tại sao mọi nghiệm đều xuất hiện trong bảng thừa số?'});
 }
 const lesson=algebraProofLesson(text,'Số chính phương: số dư hoặc hiệu hai bình phương','Chứng minh cản trở số dư nếu có; nếu không, phân tích hiệu hai bình phương và giữ điều kiện đổi biến.',details,answer,{givens:[`$${n}$ là số ${word}.`],unknowns:[`Tất cả $${n}$ để $${expression}$ là số chính phương.`],constraints:['Căn của số chính phương là số nguyên không âm.']});
 if(!lesson)return null;lesson.analysis.topic='number_theory';return {lesson,certificate:c};
}
