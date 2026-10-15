import {exactPositiveParameters,verifyPositiveParameterCertificate,fractionLatex,polynomialLatex,polynomialRootDerivation,intervalLatex,type PositiveParameterCertificate} from '../../../shared/src/rationalPolynomial';
import {algebraProofLesson,type AlgebraDeduction} from './algebraProofLesson';
export function positiveParameterLesson(text:string) {
 try {
 const cleaned=text.trim();
 const domain='(?:\\\\in\\\\mathbb\\s*\\{?R\\}?|\\\\in\\\\mathbbR)?';
 const tail='có hai nghiệm(?:\\s+thực)?\\s+phân biệt và (?:cả hai nghiệm đều|đều)\\s+dương';
 const given=new RegExp(`^Cho phương trình\\s+\\$([^$]+)\\$\\.\\s*Tìm tất cả\\s+\\$([a-z])${domain}\\$\\s+để phương trình ${tail}\\.$`,'iu').exec(cleaned);
 const requested=new RegExp(`^Tìm tất cả\\s+\\$([a-z])${domain}\\$\\s+để phương trình\\s+\\$([^$]+)\\$\\s+${tail}\\.$`,'iu').exec(cleaned);
 const equation=given?.[1]??requested?.[2],parameter=given?.[2]??requested?.[1];if(!equation||!parameter)return null;
 const c=exactPositiveParameters(equation,parameter);if(!c||!verifyPositiveParameterCertificate(c))return null;
 const b=c.base,m=b.parameter,f=fractionLatex,delta=polynomialLatex(b.discriminant,m),sum=`-\\frac{${polynomialLatex(b.b,m)}}{${f(b.a)}}`,product=`\\frac{${polynomialLatex(b.c,m)}}{${f(b.a)}}`;
 const set=(intervals:PositiveParameterCertificate['intervals'])=>intervals.length?intervals.map(intervalLatex).join('\\cup'):'\\varnothing';
 const final=c.intervals.length?`Vậy tất cả tham số cần tìm là $${m}\\in${set(c.intervals)}$.`:'Vậy không có tham số thực nào thỏa mãn yêu cầu.';
 const details:AlgebraDeduction[]=[
 {title:'Tính biệt thức và tổng, tích hai nghiệm',explanation:`Hệ số bậc hai $a=${f(b.a)}\\ne0$ không phụ thuộc tham số. Tính biệt thức để xét hai nghiệm thực phân biệt; khi chúng tồn tại, gọi chúng là $x_1,x_2$. Định lý Vi-ét cho tổng và tích như bên dưới.`,math:`\\begin{gathered}a=${f(b.a)},\\quad b=${polynomialLatex(b.b,m)},\\quad c=${polynomialLatex(b.c,m)}\\\\\\Delta=b^2-4ac=${delta}\\\\x_1+x_2=${sum},\\quad x_1x_2=${product}\\end{gathered}`,reason:'Công thức biệt thức; định lý Vi-ét',question:'Muốn hai nghiệm thực phân biệt cần biệt thức thế nào? Vi-ét cho tổng và tích ra sao?'},
 {title:'Chứng minh ba điều kiện là cần và đủ',explanation:'Nếu có hai nghiệm phân biệt và đều dương, biệt thức, tổng và tích đều dương. Ngược lại, biệt thức dương cho hai nghiệm thực phân biệt; tích dương khiến chúng cùng dấu và khác không. Tổng dương loại trường hợp cả hai âm, nên cả hai dương. Vì thế phải giải đồng thời cả ba bất phương trình, không bỏ một điều kiện.',math:`\\Delta>0,\\quad x_1+x_2>0,\\quad x_1x_2>0`,reason:'Dấu của tích và tổng hai số thực; phân loại nghiệm theo biệt thức',question:'Chỉ có tích dương đã đủ để hai nghiệm dương chưa? Tổng giúp loại trường hợp nào?'},
 ];
 const labels=['biệt thức','tổng hai nghiệm','tích hai nghiệm'];
 c.conditions.forEach((condition,i)=>{
  const n=polynomialLatex(condition.difference.n,m),d=polynomialLatex(condition.difference.d,m);
  const derivation=polynomialRootDerivation(condition.difference.n,m);
  const chart=condition.intervalSigns.map((s,j)=>`${intervalLatex({lower:condition.boundaries[j-1]?.root??null,upper:condition.boundaries[j]?.root??null,lowerClosed:false,upperClosed:false})}:F${s<0?'<':s>0?'>':'='}0`).join('\\\\');
  details.push({title:`Giải điều kiện ${labels[i]} dương`,explanation:`Rút gọn hiệu thành $F=\\frac{${n}}{${d}}$. Tìm đầy đủ nghiệm tử để chia trục số thành các khoảng. Dấu ở khoảng phải cùng là dấu hệ số bậc cao nhất của tử chia mẫu; qua nghiệm đơn đổi dấu, qua nghiệm kép giữ dấu. Chọn các khoảng dương và loại điểm bằng không vì điều kiện nghiêm ngặt.`,math:`\\begin{gathered}F=\\frac{${n}}{${d}}>0${derivation?'\\\\'+derivation:''}\\\\${chart}\\\\${m}\\in${set(condition.intervals)}\\end{gathered}`,reason:'Giải bậc nhất hoặc bậc hai; xét dấu theo nghiệm và bội; bất phương trình nghiêm ngặt',question:`Giá trị nào làm ${labels[i]} bằng không? Những khoảng nào cho dấu dương?`});
 });
 details.push({title:'Lấy giao ba điều kiện và kết luận',explanation:`Tham số phải thuộc đồng thời ba tập vừa tìm; lấy giao giữ đúng các khoảng chung và các đầu mút được phép. Tính cần và đủ đã được chứng minh, nên mọi tham số trong tập này thỏa mãn yêu cầu, còn mọi tham số ngoài tập đều vi phạm ít nhất một điều kiện. ${final}`,math:`${m}\\in(${set(c.conditions[0]!.intervals)})\\cap(${set(c.conditions[1]!.intervals)})\\cap(${set(c.conditions[2]!.intervals)})=${set(c.intervals)}`,reason:'Giao các điều kiện cần và đủ',question:'Một tham số chỉ thỏa mãn hai trong ba điều kiện có được nhận không?'});
 const lesson=algebraProofLesson(text,'Điều kiện hai nghiệm phân biệt đều dương','Kết hợp biệt thức và Vi-ét thành ba điều kiện cần và đủ, giải chính xác từng bất phương trình rồi lấy giao.',details,final,{givens:[`$${equation}$`],unknowns:[`Tất cả $${m}$ để hai nghiệm phân biệt và đều dương`]} );return lesson?{lesson,certificate:c}:null;
 }catch{return null;}
}
