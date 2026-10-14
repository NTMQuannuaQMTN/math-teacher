import {parseExpression} from '../../../shared/src/expr';
import {expressionSource} from '../../../shared/src/expressionSource';
import {exactConstantRadical,verifyConstantRadicalCertificate,rootLatex,rootSign,fractionLatex} from '../../../shared/src/rationalPolynomial';
import {exactArithmeticIdentity,verifyArithmeticIdentity} from '../../../shared/src/polynomialIdentity';
import {algebraProofLesson,type AlgebraDeduction} from './algebraProofLesson';
export function radicalSequenceLesson(text:string) {
 try {
 const match=/^Với mỗi số tự nhiên\s+\$([a-z])\$,\s*đặt\s+\$([a-z])_\1=([^$]+)\$\.\s*Chứng minh\s+\$([^$]+)\$\s+với mọi\s+\$\1=0,1,2,(?:\\ldots|\\dots)\$\s*\.?$/iu.exec(text.trim());if(!match)return null;
 const n=match[1]!,name=match[2]!,definition=match[3]!,node=parseExpression(definition);if(node.t!=='bin'||node.op!=='+')return null;
 const parts=[node.a,node.b];if(parts.some(p=>p.t!=='bin'||p.op!=='^'||p.b.t!=='var'||p.b.name!==n))return null;
 const bases=parts.map(p=>expressionSource((p as Extract<typeof node,{t:'bin'}>).a));
 const first=exactConstantRadical(bases[0]!),second=exactConstantRadical(bases[1]!),sum=exactConstantRadical(`(${bases[0]})+(${bases[1]})`),product=exactConstantRadical(`(${bases[0]})*(${bases[1]})`);
 if(!first||!second||!sum||!product||![first,second,sum,product].every(verifyConstantRadicalCertificate)||rootSign(first.value)===0||rootSign(second.value)===0||sum.value.v.n!==0n||product.value.v.n!==0n)return null;
 const S=fractionLatex(sum.value.u),P=fractionLatex(product.value.u),sides=match[4]!.replace(/\s/g,'').split('=');if(sides.length!==2||sides[0]!==`${name}_{${n}+2}`)return null;
 const rhs=sides[1]!.replaceAll(`${name}_{${n}+1}`,'u').replaceAll(`${name}_${n}`,'v');
 const recognition=exactArithmeticIdentity(rhs,`(${S})u-(${P})v`);if(!recognition||!verifyArithmeticIdentity(recognition))return null;
 const checks=bases.map(base=>exactConstantRadical(`(${base})^2-(${S})*(${base})+(${P})`));if(checks.some(c=>!c||!verifyConstantRadicalCertificate(c)||rootSign(c.value)!==0))return null;
 const p=rootLatex(first.value),q=rootLatex(second.value),final=`Vậy $${match[4]}$ đúng với mọi số tự nhiên $${n}\\ge0$.`;
 const names=['p','q','r','s'].filter(v=>![n,name].includes(v)),B1=names[0]!,B2=names[1]!,T=['t','x','z'].find(v=>![n,name,B1,B2].includes(v))!;
 const details:AlgebraDeduction[]=[
 {title:'Đặt tên cho hai cơ số và tính tổng, tích',explanation:`Đặt $${B1}=${p}$, $${B2}=${q}$. Khai triển, gộp các hạng tử cùng căn để tính tổng và tích như bên dưới. Tích $${B1}${B2}=${P}\\ne0$ nên cả hai cơ số khác không; biểu thức xác định cả ở chỉ số $0$.`,math:`${B1}=${p},\\quad ${B2}=${q},\\quad ${B1}+${B2}=(${p})+(${q})=${S},\\quad ${B1}${B2}=(${p})(${q})=${P},\\quad ${name}_${n}= ${B1}^{${n}}+${B2}^{${n}}`,reason:'Đặt tên; khai triển và rút gọn căn; điều kiện của lũy thừa',question:'Hai cơ số có tổng và tích là gì? Chúng có bằng không không?'},
 {title:'Dựng phương trình bậc hai mà cả hai cơ số thỏa mãn',explanation:`Khai triển tích $(${T}-${B1})(${T}-${B2})$ rồi thay tổng và tích vừa tính. Cho $${T}=${B1}$ hoặc $${T}=${B2}$ làm tích bằng $0$, nên cả hai cơ số thỏa mãn phương trình bậc hai này. Chuyển hạng tử tự do sang vế phải để viết bình phương theo cơ số.`,math:`\\begin{gathered}(${T}-${B1})(${T}-${B2})=${T}^2-(${S})${T}+(${P})\\\\${B1}^2=(${S})${B1}-(${P}),\\quad ${B2}^2=(${S})${B2}-(${P})\\end{gathered}`,reason:'Khai triển tích; Vi-ét đảo; chuyển vế',question:'Từ tổng và tích, mỗi cơ số thỏa mãn phương trình bậc hai nào?'},
 {title:'Nhân với lũy thừa rồi cộng hai đẳng thức',explanation:`Với mọi số nguyên $${n}\\ge0$, nhân đẳng thức của $${B1}$ với $${B1}^{${n}}$ và của $${B2}$ với $${B2}^{${n}}$. Dùng quy tắc nhân các lũy thừa cùng cơ số, rồi cộng hai đẳng thức. Nhóm theo định nghĩa của dãy để được đúng quan hệ cần chứng minh; lập luận đúng ở mọi chỉ số, không chỉ một vài số đầu.`,math:`\\begin{gathered}${B1}^{${n}+2}=(${S})${B1}^{${n}+1}-(${P})${B1}^{${n}}\\\\${B2}^{${n}+2}=(${S})${B2}^{${n}+1}-(${P})${B2}^{${n}}\\\\${name}_{${n}+2}=(${S})(${B1}^{${n}+1}+${B2}^{${n}+1})-(${P})(${B1}^{${n}}+${B2}^{${n}})\\\\${match[4]}\\end{gathered}`,reason:'Nhân đẳng thức; quy tắc lũy thừa; cộng và thay định nghĩa dãy',question:'Nhân phương trình của từng cơ số với lũy thừa nào để xuất hiện chỉ số tăng thêm $2$?'}
 ];
 details.push({title:'Kiểm tra chỉ số đầu và kết luận tổng quát',explanation:`Tại chỉ số $0$, hai cơ số khác không nên $${B1}^0=${B2}^0=1$; do đó $${name}_0=2$, $${name}_1=${S}$. Công thức vừa chứng minh áp dụng cả tại $0$ và mọi số tự nhiên tiếp theo. ${final}`,math:`${name}_0=2,\\quad ${name}_1=${S}`,reason:'Lũy thừa bậc $0$ của số khác0; lập luận cho chỉ số tùy ý',question:'Lập luận có áp dụng được tại chỉ số0 không?'});
 const lesson=algebraProofLesson(text,'Dãy tổng hai lũy thừa của các cơ số liên hợp','Dùng tổng và tích để dựng phương trình của hai cơ số, nhân với lũy thừa tùy ý rồi cộng.',details,final,{givens:[`$${name}_${n}=${definition}$`,`$${n}\\in\\mathbb{N},\\ ${n}\\ge0$`],unknowns:[`Chứng minh $${match[4]}$ với mọi chỉ số đã cho`]} );return lesson?{lesson,certificate:{first,second,sum,product,recognition,checks}}:null;
 }catch{return null;}
}
