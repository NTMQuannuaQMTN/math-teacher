import {exactConstantRadical,verifyConstantRadicalCertificate,rootLatex,fractionLatex,type ExactRoot} from '../../../shared/src/rationalPolynomial';
import {algebraProofLesson,type AlgebraDeduction} from './algebraProofLesson';
export function constantRadicalLesson(text:string) {
 try {
 const match=/^(?:Rút gọn|Tính giá trị(?: của)?(?: biểu thức)?)\s+\$(?:([A-Z])=)?([^$]+)\$\.$/iu.exec(text.trim());if(!match)return null;
 const c=exactConstantRadical(match[2]!);if(!c||!verifyConstantRadicalCertificate(c))return null;
 const n=match[1]??'A',value=rootLatex(c.value),final=`Vậy biểu thức đã cho bằng $${value}$.`;
 const signReason=(r:ExactRoot)=>{
  const u=fractionLatex(r.u),v=fractionLatex(r.v);
  if(r.u.n>=0n&&r.v.n>=0n)return 'Hai hạng tử đều không âm nên tổng không âm.';
  return r.u.n>=0n?`So sánh hai số không âm: $(${u})^2\\ge(${v})^2\\cdot${r.radicand}$, nên $${u}\\ge-(${v})\\sqrt{${r.radicand}}$. Do đó hiệu không âm.`:`So sánh hai số không âm: $(${v})^2\\cdot${r.radicand}\\ge(${u})^2$, nên $(${v})\\sqrt{${r.radicand}}\\ge-(${u})$. Do đó tổng không âm.`;
 };
 const details:AlgebraDeduction[]=c.radicals.filter(({argument,result})=>rootLatex(result)!==`\\sqrt{${rootLatex(argument)}}`).map(({argument,result},i)=>({title:`Rút gọn căn thức thứ ${i+1} và kiểm tra dấu`,explanation:`Biểu thức dưới căn là $${rootLatex(argument)}$. Bình phương $${rootLatex(result)}$ cho đúng biểu thức ấy. ${signReason(result)} Vì căn bậc hai số học là số không âm duy nhất có bình phương đã cho, căn thức bằng đúng giá trị này. Phải kiểm tra dấu; chỉ có cùng bình phương chưa đủ.`,math:`\\begin{gathered}(${rootLatex(result)})^2=${rootLatex(argument)},\\quad ${rootLatex(result)}\\ge0\\\\\\sqrt{${rootLatex(argument)}}=${rootLatex(result)}\\end{gathered}`,reason:'Khai triển bình phương; chọn căn bậc hai số học không âm',question:'Giá trị dự định thay cho căn thức có bình phương đúng và không âm không?'}));
 for(let i=0;i<c.operations.length;i+=4){
  const operations=c.operations.slice(i,i+4);
  details.push({title:'Thực hiện các phép toán sau khi thay căn',explanation:'Các dòng sau khai triển và thu gọn những phép toán có chứa căn. Với phép chia, nhân cả tử và mẫu với biểu thức liên hợp để đưa mẫu về số hữu tỉ khác không.',math:`\\begin{gathered}${operations.map(o=>o.op==='/'?`\\frac{${rootLatex(o.left)}}{${rootLatex(o.right)}}=${rootLatex(o.result)}`:`(${rootLatex(o.left)})${o.op==='*'?'\\cdot':o.op}(${rootLatex(o.right)})=${rootLatex(o.result)}`).join('\\\\')}\\end{gathered}`,reason:'Khai triển, thu gọn hạng tử cùng căn; nhân liên hợp khi chia',question:'Những hạng tử cùng căn gộp được với nhau như thế nào? Khi chia, mẫu sau khi nhân liên hợp bằng bao nhiêu?'});
 }
 details.push({title:'Đối chiếu toàn bộ biểu thức và kết luận',explanation:`Từng căn thức và các phép toán của biểu thức ban đầu đã được tính chính xác. Mọi phép chia đã được kiểm tra mẫu khác không. ${final}`,math:`${n}=${match[2]}=${value}`,reason:'Thay các đẳng thức đã chứng minh và đối chiếu kết quả',question:'Kết luận có thống nhất với các phép toán sau khi thay căn không?'});
 const lesson=algebraProofLesson(text,'Rút gọn căn lồng bằng hằng đẳng thức','Tìm căn bậc hai số học bằng đẳng thức bình phương kèm điều kiện không âm, rồi thực hiện chính xác các phép toán còn lại.',details,final);return lesson?{lesson,certificate:c}:null;
 }catch{return null;}
}
