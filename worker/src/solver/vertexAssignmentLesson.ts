import {ModelLessonSchema,type ModelLesson} from '../../../shared/src/solution';
import {algebraProofLesson,type AlgebraDeduction} from './algebraProofLesson';
import {exactArithmeticIdentity} from '../../../shared/src/polynomialIdentity';
import {repairLatex} from '../../../shared/src/mathText';

/** Whole-task positive distinct adjacent-sum family; unsupported extra clauses
 * are declined. The square supplies labels only, never measured coordinates. */
export function vertexAssignmentLesson(text:string):{lesson:ModelLesson;verify:()=>boolean}|null {
 const plain=repairLatex(text).replace(/\$/g,'').replace(/\s+/g,' ').trim().replace(/^(?:Câu|Bài)\s+\d+(?:\s*\([\d.,]+\s*điểm\))?\.\s*/u,'').replace('đối một phân biệt','đôi một phân biệt');
 const m=/^Người ta muốn ghi bốn số thực ở bốn đỉnh của hình vuông ([A-Z]{4}) \(mỗi đỉnh một số\) thỏa mãn: i\) Bốn số được ghi là đôi một phân biệt; ii\) Tổng hai số được ghi ở hai đầu của cạnh ([A-Z]{2}) là 0; iii\) Tổng hai số được ghi ở hai đầu của ba cạnh còn lại là ba giá trị phân biệt: (\d+), (\d+), (\d+)\. (.+)$/u.exec(plain);
 if(!m||m[2]!==m[1]!.slice(0,2)||new Set(m[1]).size!==4)return null;
 const sums=[Number(m[3]),Number(m[4]),Number(m[5])].sort((a,b)=>a-b),[p,q,r]=sums as [number,number,number];
 if(p<=0||r>100||p===q||p+q!==r)return null;
 const example='Hãy chỉ ra một cách ghi thỏa mãn các điều kiện trên.',optimize='Trong các cách ghi thỏa mãn các điều kiện trên, tìm cách ghi có tổng bình phương của các số ở bốn đỉnh là nhỏ nhất.';
 const both=m[6]===`a) ${example} b) ${optimize}`,wantExample=m[6]===example||both,wantMinimum=m[6]===optimize||both;
 if(!wantExample&&!wantMinimum)return null;
 const [A,B,C,D]=[...m[1]!];
 const witness=[p+q,-p-q,2*p+q,-p];
 const scaled:[number,number,number,number]=[q-p,p-q,3*p+q,p+3*q],numerator=3*p*p+2*p*q+3*q*q;
 const tex=(v:number)=>v%4===0?String(v/4):`${v<0?'-':''}\\frac{${Math.abs(v)}}{4}`;
 const minimum=`\\frac{${numerator}}{4}`;
 const verify=()=>{
  const pairSums=(v:number[])=>[v[1]!+v[2]!,v[2]!+v[3]!,v[3]!+v[0]!].sort((a,b)=>a-b);
  const valid=(v:number[],factor:number)=>new Set(v).size===4 && v[0]! + v[1]! === 0 && pairSums(v).every((n,i)=>n===factor*sums[i]!);
  return valid(witness,1)&&valid(scaled,4)&&scaled.reduce((s,n)=>s+BigInt(n)**2n,0n)===4n*BigInt(numerator)&&!!exactArithmeticIdentity(`2*a^2+(a+${p})^2+(${q}-a)^2`,`4*(a-(${q-p})/4)^2+(${numerator})/4`)?.valid;
 };
 if(!verify())return null;
 const ds:AlgebraDeduction[]=[{title:'Đặt ẩn và viết đúng điều kiện bằng lời',explanation:`Gọi số tại $${A},${B},${C},${D}$ lần lượt là $a,b,c,d$. Ta có $a+b=0$. Ba tổng $b+c$, $c+d$, $d+a$ nhận ba giá trị $${p},${q},${r}$ theo một thứ tự nào đó, mỗi giá trị xuất hiện đúng một lần; không gán trước thứ tự.`,math:'a+b=0',reason:'Chuyển đúng các giả thiết thành ẩn, giữ điều kiện đôi một phân biệt',question:'Ba giá trị ở ba cạnh còn lại đã được gán thứ tự hay chưa?'}];
 if(wantExample)ds.push({title:both?'a) Nêu một cách ghi cụ thể':'Nêu một cách ghi cụ thể',explanation:`Chọn số tại các đỉnh $(${A},${B},${C},${D})=(${witness.join(',')})$. Bốn số khác nhau. Tổng cạnh $${A}${B}$ bằng $0$, các cạnh $${B}${C},${C}${D},${D}${A}$ lần lượt bằng $${p},${r},${q}$. Các phép cộng bên dưới kiểm tra trực tiếp mọi điều kiện.`,math:`\\begin{gathered}(${witness[0]})+(${witness[1]})=0\\\\(${witness[1]})+(${witness[2]})=${p}\\\\(${witness[2]})+(${witness[3]})=${r}\\\\(${witness[3]})+(${witness[0]})=${q}\\end{gathered}`,reason:'Nhân chứng cụ thể và kiểm tra từng cạnh, không chỉ nói tồn tại',question:'Cách ghi vừa nêu có giữ đủ ba tổng và bốn số khác nhau không?'});
 if(wantMinimum)ds.push(
  {title:both?'b) Xác định tổng ở cạnh đối diện':'Xác định tổng ở cạnh đối diện',explanation:`Vì $a+b=0$, nên $(b+c)+(d+a)=c+d$. Do đó một trong ba giá trị phải bằng tổng hai giá trị còn lại. Các giá trị dương và $${r}=${p}+${q}$, nên $c+d=${r}$. Còn đúng hai trường hợp: $b+c=${p},d+a=${q}$ hoặc $b+c=${q},d+a=${p}$.`,math:'(b+c)+(d+a)=c+d',reason:'Cộng các tổng, dùng a+b=0; số lớn nhất là tổng hai số còn lại',question:'Vì sao c+d phải là giá trị lớn nhất, và còn bao nhiêu thứ tự cần xét?'},
  {title:'Trường hợp thứ nhất: hoàn thành bình phương',explanation:`Nếu $b+c=${p}$ và $d+a=${q}$ thì $b=-a$, $c=a+${p}$, $d=${q}-a$. Thay vào tổng bình phương, khai triển và hoàn thành bình phương như bên dưới. Bình phương không âm nên cận nhỏ nhất là $${minimum}$; dấu bằng khi $a=${tex(q-p)}$.`,math:`\\begin{gathered}T=2a^2+(a+${p})^2+(${q}-a)^2\\\\=4\\left(a-(${tex(q-p)})\\right)^2+${minimum}\\ge${minimum}\\end{gathered}`,reason:'Thay các ẩn theo a; đẳng thức bình phương; bình phương không âm',question:'Dấu bằng xảy ra tại a nào? Cận có thực sự đạt khi bốn số phải khác nhau không?'},
  {title:'Trường hợp thứ hai và kiểm tra dấu bằng',explanation:`Nếu $b+c=${q}$ và $d+a=${p}$ thì đổi vai trò $${p},${q}$ trong phép tính trên. Cận không đổi, dấu bằng khi $a=${tex(p-q)}$. Trường hợp đầu đạt tại $(${A},${B},${C},${D})=(${scaled.map(tex).join(',')})$; trường hợp sau đạt tại $(${A},${B},${C},${D})=(${[scaled[1],scaled[0],scaled[3],scaled[2]].map(tex).join(',')})$. Hai số đầu khác nhau vì $${p}\\ne${q}$; hai số cuối khác nhau và đều lớn hơn trị tuyệt đối của hai số đầu, nên bốn số đôi một phân biệt. Thay lại các tổng cạnh đúng bằng $0,${p},${r},${q}$ hoặc $0,${q},${r},${p}$.`,math:null,reason:'Xét hết hai trường hợp; kiểm tra miền và mọi nhân chứng đạt cận',question:'Vì sao các bộ đạt dấu bằng vẫn có bốn số đôi một phân biệt?'});
 const conclusion=wantMinimum?`Vậy tổng bình phương nhỏ nhất là $${minimum}$, đạt tại đúng hai cách ghi đã kiểm tra.`:`Vậy cách ghi $(${A},${B},${C},${D})=(${witness.join(',')})$ thỏa mọi điều kiện.`;
 ds.push({title:'Kết luận',explanation:conclusion,math:null,reason:'Nhân chứng đã kiểm tra; khi tối ưu, cận và mọi trường hợp đạt cận đã được chứng minh',question:'Đã chỉ rõ cách ghi và kiểm tra đủ điều kiện của kết luận chưa?'});
 const lesson=algebraProofLesson(text,'Gán số ở đỉnh: các tổng và cận bình phương','Viết ba giá trị theo một thứ tự chưa biết, xác định tổng ở cạnh đối diện rồi xét hai trường hợp và hoàn thành bình phương.',ds,conclusion);
 if(lesson&&text.includes('đối một phân biệt'))lesson.analysis.interpretationNotes.push('Cụm “đối một phân biệt” trong đề hiện tại được hiểu là “đôi một phân biệt” theo điều kiện về bốn số; giữ nguyên văn đề để đối chiếu.');
 const parsed=ModelLessonSchema.safeParse(lesson);return parsed.success?{lesson:parsed.data,verify}:null;
}
