import {parseMathText} from '../../../shared/src/mathText';
import {exactSymmetricSystem,verifySymmetricSystemCertificate,fractionLatex} from '../../../shared/src/rationalPolynomial';
import {systemEquationLesson} from './systemEquation';
import {algebraProofLesson,type AlgebraDeduction} from './algebraProofLesson';
export function symmetricSystemLesson(text:string) {
 try {
 const match=/^Giải hệ phương trình(?: sau)?\s*:?\s*([\s\S]+?)(?:\s+trên tập số thực)?\s*\.?$/iu.exec(text.trim());if(!match)return null;
 const segments=parseMathText(match[1]!),maths=segments.filter(s=>s.kind==='math');if(maths.length!==1||segments.filter(s=>s.kind==='text').some(s=>s.value.trim()))return null;
 const body=/^\\begin\{cases\}([\s\S]+)\\end\{cases\}$/u.exec(maths[0]!.value.trim());if(!body)return null;
 const equations=body[1]!.split(/\\\\|\\cr\b/u).map(e=>e.replace(/&/g,'').trim()),c=exactSymmetricSystem(equations);if(!c||!verifySymmetricSystemCertificate(c))return null;
 const [x,y]=c.variables,f=fractionLatex,q=c.quadratic,system=c.converted.equations.map(e=>e.replace(/\*/g,'\\cdot ')).join('\\\\');
 const core=systemEquationLesson(`Giải hệ phương trình $\\begin{cases}${system}\\end{cases}$.`);if(!core)return null;
 const final=core.lesson.finalAnswer.text;
 const details:AlgebraDeduction[]=[
 {title:'Dùng tổng hai ẩn để biểu diễn tổng bình phương',explanation:`Phương trình số $${c.sumIndex+1}$ cho tổng $${x}+${y}=${f(c.sum)}$. Khai triển bình phương tổng để biểu diễn tổng bình phương qua tích; đẳng thức này đúng với mọi số thực, nên không làm mất nghiệm.`,math:`${x}^2+${y}^2=(${x}+${y})^2-2${x}${y}=(${f(c.sum)})^2-2${x}${y}`,reason:'Hằng đẳng thức bình phương tổng; dùng điều kiện tổng đã cho',question:'Bình phương tổng chứa thêm hạng tử nào so với tổng hai bình phương?'},
 {title:'Thay vào phương trình còn lại và thu gọn tương đương',explanation:'Khai triển và nhóm các hạng tử của phương trình còn lại theo tổng bình phương, tích, tổng hai ẩn và hằng số. Thay đẳng thức vừa có, thu gọn hệ số của tích. Mọi bước đều tương đương khi giữ nguyên điều kiện tổng, kể cả trường hợp hệ số của tích bằng không.',math:`\\begin{gathered}(${f(q.square)})(${x}^2+${y}^2)+(${f(q.product)})${x}${y}+(${f(q.linear)})(${x}+${y})+(${f(q.constant)})=0\\\\(${f(q.square)})[(${f(c.sum)})^2-2${x}${y}]+(${f(q.product)})${x}${y}+(${f(q.linear)})(${f(c.sum)})+(${f(q.constant)})=0\\\\(${f(c.reducedProduct)})${x}${y}+(${f(c.reducedConstant)})=0\\end{gathered}`,reason:'Khai triển, nhóm hạng tử đối xứng; thay và thu gọn',question:'Sau khi thay tổng bình phương, hệ số của tích hai ẩn có bằng không không?'},
 ...core.lesson.steps.map(s=>({title:s.title,explanation:s.explanation,math:s.math,reason:s.reason??'Giải hệ tương đương',question:'Hệ mới đã được chứng minh tương đương với hệ ban đầu; bước này xét hết các trường hợp chưa?'}))
 ];
 details[details.length-1]!.explanation+=c.converted.infinite==='none'&&!c.converted.solutions.length?' Các phép thay tổng bình phương ở đầu đều tương đương khi giữ tổng đã cho, nên mâu thuẫn này cũng loại mọi nghiệm của hệ ban đầu.':' Các phép thay tổng bình phương ở đầu đều tương đương khi giữ tổng đã cho, nên các cặp này cũng thỏa mãn cả hai phương trình ban đầu.';
 // Keep the conclusion naturally at the end after the equivalence explanation.
 details[details.length-1]!.explanation=details[details.length-1]!.explanation.replace(final,'').trim()+' '+final;
 const lesson=algebraProofLesson(text,'Hệ đối xứng qua tổng và tích','Dùng bình phương tổng để thay tổng bình phương, thu gọn thành hệ tương đương rồi giải đủ các cặp có thứ tự.',details,final,{givens:equations.map(e=>`$${e}$`),unknowns:[`Tất cả cặp số thực $(${x},${y})$ thỏa mãn đồng thời hai phương trình`]} );return lesson?{lesson,certificate:c}:null;
 }catch{return null;}
}
