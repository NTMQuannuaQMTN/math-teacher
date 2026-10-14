import {parseMathText} from '../../../shared/src/mathText';
import {integerPolynomial} from '../../../shared/src/integerPolynomial';
import {algebraProofLesson,type AlgebraDeduction} from './algebraProofLesson';

interface PrimeOffsetTask {text:string;variable:string;expressions:string[];offsets:number[]}
export interface PrimeOffsetCertificate {task:PrimeOffsetTask;modulus:number;cover:number[];candidates:number[];solutions:number[];compositeDivisors:(number|null)[][]}
function primeOffsetTask(text:string):PrimeOffsetTask|null {
 const maths:string[]=[];if(text.includes('§'))return null;
 const template=parseMathText(text.trim()).map(s=>s.kind==='math'?`§${maths.push(s.value)-1}§`:s.value).join('').replace(/\s+/g,' ').trim();
 const match=/^Tìm (?:tất cả )?(?:các )?số nguyên tố §0§ sao cho (.+) cũng là số nguyên tố\.?$/iu.exec(template);if(!match||maths.length<2||maths.length>7)return null;
 const expected=maths.slice(1).map((_,i)=>`§${i+1}§`);
 const clause=match[1]!.replace(/,?\s*và\s*/u,', ').split(/,\s*/u);
 if(clause.join(',')!==expected.join(','))return null;
 const variable=maths[0]!.trim();if(!/^[a-z]$/u.test(variable))return null;
 const offsets=[0];for(const expression of maths.slice(1)){
  const p=integerPolynomial(expression,variable);if(!p||p.coefficients.length!==2||p.coefficients[1]!==1n||p.coefficients[0]!>10000n||p.coefficients[0]!< -10000n)return null;
  offsets.push(Number(p.coefficients[0]));
 }
 if(new Set(offsets).size!==offsets.length)return null;
 return {text,variable,expressions:[variable,...maths.slice(1)],offsets};
}
const remainder=(n:number,m:number)=>(n%m+m)%m;
/** Smallest nontrivial divisor; 0 means not even an eligible prime (<2), null means prime.
 * Every tested integer is ≤20007, so trial division through sqrt is a proved finite bound. */
const nonprime=(n:number):number|null=>{if(n<2)return 0;for(let d=2;d*d<=n;d++)if(n%d===0)return d;return null;};
export function primeOffsetCertificate(text:string):PrimeOffsetCertificate|null {
 const task=primeOffsetTask(text);if(!task)return null;
 for(const modulus of [2,3,5,7]){
  const cover=Array.from({length:modulus},(_,r)=>task.offsets.findIndex(a=>remainder(r+a,modulus)===0));
  if(cover.some(i=>i<0))continue;
  const candidates=[...new Set(task.offsets.map(a=>modulus-a))].filter(p=>p>=2).sort((a,b)=>a-b);
  const compositeDivisors=candidates.map(p=>task.offsets.map(a=>nonprime(p+a)));
  return {task,modulus,cover,candidates,compositeDivisors,solutions:candidates.filter((_,i)=>compositeDivisors[i]!.every(d=>d===null))};
 }
 return null;
}
/** Check the residue cover and every exceptional candidate independently. The complete sieve
 * has a justified finite upper bound, and no observed prime pattern is extrapolated. */
export function verifyPrimeOffsetCertificate(c:PrimeOffsetCertificate):boolean {
 try{
  const t=primeOffsetTask(c.task.text);if(!t||JSON.stringify(t)!==JSON.stringify(c.task)||![2,3,5,7].includes(c.modulus))return false;
  if(c.cover.length!==c.modulus||c.cover.some((i,r)=>!Number.isInteger(i)||i<0||i>=t.offsets.length||remainder(r+t.offsets[i]!,c.modulus)!==0))return false;
  const candidates=[...new Set(t.offsets.map(a=>c.modulus-a))].filter(p=>p>=2).sort((a,b)=>a-b);if(candidates.join(',')!==c.candidates.join(',')||c.compositeDivisors.length!==candidates.length)return false;
  const max=Math.max(2,...candidates.flatMap(p=>t.offsets.map(a=>p+a))),prime=Array<boolean>(max+1).fill(true);prime[0]=prime[1]=false;
  for(let p=2;p*p<=max;p++)if(prime[p])for(let n=p*p;n<=max;n+=p)prime[n]=false;
  const solutions:number[]=[];
  for(let i=0;i<candidates.length;i++){
   const values=t.offsets.map(a=>candidates[i]!+a),ds=c.compositeDivisors[i]!;if(ds.length!==values.length)return false;
   for(let j=0;j<values.length;j++){const v=values[j]!,d=ds[j];if(v>=2&&prime[v]){if(d!==null)return false;}else if(v<2){if(d!==0)return false;}else if(d==null||!Number.isInteger(d)||d<2||d>=v||v%d!==0)return false;}
   if(values.every(v=>v>=2&&prime[v]))solutions.push(candidates[i]!);
  }
  return solutions.join(',')===c.solutions.join(',');
 }catch{return false;}
}
export function primeOffsetLesson(text:string) {
 const c=primeOffsetCertificate(text);if(!c||!verifyPrimeOffsetCertificate(c))return null;
 const {variable:p,expressions,offsets}=c.task,q=c.modulus,details:AlgebraDeduction[]=[],h=['h','t','k'].find(v=>v!==p)!,R=['r','s','u'].find(v=>![p,h].includes(v))!;
 details.push({title:'Xét đầy đủ số dư của số nguyên tố cần tìm',explanation:`Mọi số nguyên $${p}$ có đúng một số dư $${R}$ khi chia $${q}$, với $0\\le ${R}<${q}$. Các biểu thức có dạng $${p}+${h}$, trong đó $${h}$ lần lượt là các hằng số $${offsets.join(',')}$. Nếu $${p}$ chia $${q}$ dư $${R}$, thì $${p}+${h}$ chia $${q}$ dư bằng số dư của $${R}+${h}$. Bảng chỉ rõ, trong mỗi trường hợp, ít nhất một số đề yêu cầu là số nguyên tố lại chia hết cho $${q}$.`,math:`\\begin{array}{c|${'c'.repeat(q)}}${R}&${Array.from({length:q},(_,r)=>r).join('&')}\\\\\\hline \\text{số chia hết cho }${q}&${c.cover.map(i=>expressions[i]).join('&')}\\end{array}`,reason:'Phép chia có dư; tính số dư của tổng; xét hết các trường hợp',question:'Trong mỗi lớp số dư, số nào trong đề chắc chắn chia hết cho một số nguyên tố nhỏ?'});
 details.push({title:'Đưa điều kiện nguyên tố về hữu hạn ứng viên',explanation:`Số $${q}$ là số nguyên tố. Một số nguyên tố chia hết cho $${q}$ phải bằng chính $${q}$, vì nó chỉ có hai ước dương là 1 và chính nó. Vì thế ít nhất một biểu thức trong $${expressions.join(', ')}$ bằng $${q}$. Giải từng phương trình $${expressions.map(e=>`${e}=${q}`).join(', ')}$, rồi loại giá trị $${p}<2$, được tất cả ứng viên bên dưới.`,math:`${p}\\in\\{${c.candidates.join(',')}\\}`,reason:`Nếu một số nguyên tố có ước nguyên tố ${q} thì số ấy bằng ${q}; tập ứng viên là đầy đủ`,question:`Một số nguyên tố chia hết cho $${q}$ có thể là bội lớn hơn $${q}$ không?`});
 for(let i=0;i<c.candidates.length;i++){
  const candidate=c.candidates[i]!,values=offsets.map(a=>candidate+a),ds=c.compositeDivisors[i]!,bad=ds.findIndex(d=>d!==null);
  const tests=values.map(v=>{const limit=Math.floor(Math.sqrt(v));return limit<2?`$${v}$ chỉ có ước dương1 và chính nó`:`$${v}$: ${Array.from({length:limit-1},(_,i)=>i+2).map(d=>`chia $${d}$ dư $${v%d}$`).join(', ')}`;}).join('; ');
  const why=bad>=0?values[bad]!<2?`Số $${values[bad]}<2$ không phải số nguyên tố, nên loại ứng viên.`:`Số $${values[bad]}=${ds[bad]}\\cdot ${values[bad]!/ds[bad]!}$ có hai thừa số lớn hơn 1, nên không nguyên tố; loại ứng viên.`:`Nếu số $v$ hợp số thì có một ước $d$ thỏa $2\\le d\\le\\sqrt v$. Kiểm tra cụ thể: ${tests}. Không có ước trong giới hạn bắt buộc của một hợp số, nên tất cả đều nguyên tố; nhận ứng viên.`;
  details.push({title:`Kiểm tra ứng viên ${p}=${candidate}`,explanation:`Thay $${p}=${candidate}$ vào tất cả biểu thức của đề được $${values.join(', ')}$. ${why}`,math:`${p}=${candidate}\\quad\\Rightarrow\\quad (${expressions.join(',')})=(${values.join(',')})`,reason:'Thử lại tất cả yêu cầu; ước hữu hạn của một hợp số hoặc chứng minh nguyên tố',question:'Ứng viên có làm tất cả các số yêu cầu đều nguyên tố không?'});
 }
 const answer=c.solutions.length?`Vậy tất cả số nguyên tố cần tìm là $${p}\\in\\{${c.solutions.join(',')}\\}$.`:'Vậy không có số nguyên tố nào thỏa mãn đồng thời các yêu cầu.';
 details.push({title:'Kết luận và bảo đảm không bỏ sót',explanation:`Mọi nghiệm phải thuộc tập ứng viên vì bảng số dư bao quát tất cả trường hợp. Mọi ứng viên đã được đối chiếu với tất cả điều kiện, nên không còn nghiệm khác. ${answer}`,math:null,reason:'Điều kiện cần bao quát; kiểm tra điều kiện đủ cho từng ứng viên',question:'Tại sao không cần tìm tiếp những số nguyên tố lớn hơn?'});
 const lesson=algebraProofLesson(text,'Số nguyên tố trong các biểu thức dịch chuyển','Dùng một ước nguyên tố nhỏ bao phủ mọi lớp số dư để lập tập ứng viên hữu hạn, rồi thử lại.',details,answer,{givens:[`$${expressions.join(', ')}$ đều phải là số nguyên tố.`],unknowns:[`Tất cả số nguyên tố $${p}$`],constraints:['Số nguyên tố là số nguyên lớn hơn 1, chỉ có hai ước dương.']});
 if(!lesson)return null;lesson.analysis.topic='number_theory';return {lesson,certificate:c};
}
