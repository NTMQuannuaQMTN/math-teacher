import {splitRelation} from '../../../shared/src/expr';
import {exactArithmeticIdentity,verifyArithmeticIdentity} from '../../../shared/src/polynomialIdentity';
import {exactRationalEquation,fraction,fractionLatex} from '../../../shared/src/rationalPolynomial';
import {algebraProofLesson,type AlgebraDeduction} from './algebraProofLesson';
const identical=(left:string,right:string)=>{const c=exactArithmeticIdentity(left,right);return c&&verifyArithmeticIdentity(c)?c:null;};
const constant=(source:string)=>{const c=exactRationalEquation(`t=(${source})`);return c?.solutions.length===1&&c.solutions[0]!.v.n===0n?c.solutions[0]!.u:null;};
export function positiveInequalityLesson(text:string) {
 try {
 const match=/^Cho\s+\$([a-z](?:\s*,\s*[a-z]){1,3})\$\s+là các số thực dương(?:(?:\s+thỏa mãn|\s+và)\s+\$([^$]+)\$)?\.\s*Chứng minh\s+\$([^$]+)\$\s+và\s+(?:tìm|xác định)\s+trường hợp xảy ra dấu bằng\.$/iu.exec(text.trim());if(!match)return null;
 const vars=match[1]!.split(',').map(s=>s.trim());if(new Set(vars).size!==vars.length)return null;
 const relation=splitRelation(match[3]!);if(!relation)return null;const target=constant(relation.sides[1]);if(!target)return null;
 const sum=vars.join('+'),reciprocal=vars.map(v=>`1/${v}`).join('+'),N=BigInt(vars.length);
 let S=null;
 if(match[2]){const condition=splitRelation(match[2]);if(!condition||condition.rel!=='='||!identical(condition.sides[0],sum))return null;S=constant(condition.sides[1]);if(!S||S.n<=0n)return null;}
 const [a,b]=vars as [string,string],certificates=[],details:AlgebraDeduction[]=[];let final:string,strategy:string;
 if(vars.length===2&&!S&&relation.rel==='>='&&target.n===2n*target.d){
  const expression=`${a}/${b}+${b}/${a}`,recognition=identical(relation.sides[0],expression),proof=identical(`(${expression})-2`,`(${a}-${b})^2/(${a}*${b})`);if(!recognition||!proof)return null;certificates.push(recognition,proof);
  details.push({title:'Trừ cận cần chứng minh rồi quy đồng',explanation:`Vì $${a},${b}>0$, mẫu $${a}${b}>0$. Quy đồng biểu thức sau khi trừ $2$, khai triển tử rồi nhận ra bình phương hiệu.`,math:`\\frac{${a}}{${b}}+\\frac{${b}}{${a}}-2=\\frac{${a}^2+${b}^2-2${a}${b}}{${a}${b}}=\\frac{(${a}-${b})^2}{${a}${b}}\\ge0`,reason:'Quy đồng; bình phương không âm; mẫu dương',question:'Sau khi trừ $2$ và quy đồng, tử số có phải một bình phương không?'});
  final=`Vậy $\\frac{${a}}{${b}}+\\frac{${b}}{${a}}\\ge2$; dấu bằng xảy ra khi và chỉ khi $${a}=${b}>0$.`;
  details.push({title:'Chỉ rõ mọi trường hợp dấu bằng',explanation:`Mẫu luôn dương nên phân thức bằng không đúng khi tử bằng không, tức $${a}-${b}=0$. Mọi cặp bằng nhau và dương đều làm biểu thức bằng $2$; chẳng hạn chọn cụ thể $${a}=${b}=1$. ${final}`,math:`(${a}-${b})^2=0\\Leftrightarrow ${a}=${b},\\qquad ${a}=${b}=1`,reason:'Bình phương bằng không khi và chỉ khi biểu thức trong bình phương bằng không',question:'Những cặp dương nào làm tử bằng $0$? Hãy chỉ ra một cặp cụ thể.'});
  strategy='Đưa hiệu với cận cần chứng minh về một bình phương chia mẫu dương rồi xét chính xác dấu bằng.';
 }else if(vars.length===2&&S&&relation.rel==='<='&&target.n*4n*S.d*S.d===S.n*S.n*target.d){
  const recognition=identical(relation.sides[0],`${a}*${b}`),proof=identical(`(${sum})^2-4*${a}*${b}`,`(${a}-${b})^2`);if(!recognition||!proof)return null;certificates.push(recognition,proof);const equal=fraction(S.n,2n*S.d);
  details.push({title:'Dùng tổng đã cho để tạo một bình phương không âm',explanation:`Khai triển bình phương tổng và bình phương hiệu; hiệu giữa bình phương tổng với bốn lần tích đúng bằng bình phương hiệu. Thay $${sum}=${fractionLatex(S)}$ từ giả thiết.`,math:`\\begin{gathered}(${a}+${b})^2-4${a}${b}=(${a}-${b})^2\\ge0\\\\4${a}${b}\\le(${fractionLatex(S)})^2\\quad\\Rightarrow\\quad ${a}${b}\\le${fractionLatex(target)}\\end{gathered}`,reason:'Hằng đẳng thức; bình phương không âm; thay tổng đã cho',question:'Bình phương tổng trừ bốn lần tích bằng bình phương nào?'});
  final=`Vậy $${a}${b}\\le${fractionLatex(target)}$; dấu bằng xảy ra khi và chỉ khi $${a}=${b}=${fractionLatex(equal)}$.`;
  details.push({title:'Tìm và kiểm tra cặp đạt dấu bằng',explanation:`Dấu bằng tương đương bình phương hiệu bằng không, nên hai số bằng nhau. Kết hợp tổng đã cho, mỗi số phải bằng $${fractionLatex(equal)}$. Giá trị này dương và cặp vừa tìm có đúng tổng ban đầu, nên thật sự được phép và đạt dấu bằng. ${final}`,math:`${a}=${b},\\quad ${a}+${b}=${fractionLatex(S)}\\Rightarrow ${a}=${b}=${fractionLatex(equal)}`,reason:'Điều kiện dấu bằng; giải đồng thời với giả thiết',question:'Nếu hai số bằng nhau và có tổng đã cho thì từng số bằng bao nhiêu?'});
  strategy='Khai triển bình phương hiệu, thay tổng cố định rồi chứng minh cả cận trên và cặp duy nhất đạt cận.';
 }else if(S&&relation.rel==='>='&&target.n*S.n===N*N*S.d*target.d){
  const pairs=vars.flatMap((a,i)=>vars.slice(i+1).map(b=>({a,b}))),squares=pairs.map(({a,b})=>`(${a}-${b})^2/(${a}*${b})`).join('+');
  const recognition=identical(relation.sides[0],reciprocal),proof=identical(`(${sum})*(${reciprocal})-${N*N}`,squares);if(!recognition||!proof)return null;certificates.push(recognition,proof);
  const equal=fraction(S.n,N*S.d),reciprocalLatex=vars.map(v=>`\\frac1{${v}}`).join('+');
  details.push({title:'Khai triển tích tổng với tổng nghịch đảo',explanation:`Mỗi hạng tử một số nhân nghịch đảo chính nó bằng1. Ghép các hạng tử chéo theo từng cặp: $a/b+b/a-2=(a-b)^2/(ab)$. Với ${vars.length} số có ${pairs.length} cặp, khai triển và nhóm cho đúng đẳng thức bên dưới.`,math:`(${sum})(${reciprocalLatex})-${N*N}=${pairs.map(({a,b})=>`\\frac{(${a}-${b})^2}{${a}${b}}`).join('+')}`,reason:'Khai triển tích; ghép hạng tử chéo; quy đồng từng cặp',question:'Mỗi cặp hạng tử chéo sau khi trừ $2$ biến thành bình phương chia mẫu nào?'});
  details.push({title:'Xét dấu từng hạng tử và thay tổng cố định',explanation:`Mỗi tử là bình phương không âm, mỗi mẫu là tích hai số dương nên dương. Tổng các phân thức không âm. Thay tổng đã cho bằng $${fractionLatex(S)}>0$, rồi chia hai vế cho số dương này để giữ chiều bất phương trình.`,math:`(${fractionLatex(S)})(${reciprocalLatex})\\ge${N*N}\\quad\\Rightarrow\\quad ${reciprocalLatex}\\ge${fractionLatex(target)}`,reason:'Tổng số không âm; chia bất phương trình cho số dương',question:'Có hạng tử nào mang mẫu âm không? Khi chia cho tổng đã cho, chiều có đổi không?'});
  final=`Vậy $${reciprocalLatex}\\ge${fractionLatex(target)}$; dấu bằng xảy ra khi và chỉ khi $${vars.join('=')}=${fractionLatex(equal)}$.`;
  details.push({title:'Chỉ rõ các số đạt dấu bằng',explanation:`Tổng các số không âm bằng không đúng khi từng số bằng không, nên hiệu của mỗi cặp số đều bằng không. Tất cả số bằng nhau; kết hợp tổng cố định cho mỗi số bằng $${fractionLatex(equal)}$. Những số này dương và có đúng tổng đã cho, nên đây là trường hợp đạt dấu bằng cụ thể. ${final}`,math:`${vars.join('=')}=${fractionLatex(equal)}`,reason:'Điều kiện tổng số không âm bằng không; kiểm tra đầy đủ giả thiết',question:'Dấu bằng có yêu cầu mọi bình phương đều bằng $0$ không? Từ tổng cố định, hãy chỉ rõ từng số.'});
  strategy='Khai triển tích thành tổng các bình phương chia mẫu dương, thay tổng cố định rồi chỉ rõ các số đạt dấu bằng.';
 }else return null;
 const lesson=algebraProofLesson(text,'Bất đẳng thức từ bình phương không âm và dấu bằng',strategy,details,final,{givens:[`${vars.map(v=>`$${v}>0$`).join(', ')}`,...(match[2]?[`$${match[2]}$`]:[])],unknowns:[`Chứng minh $${match[3]}$ và tìm mọi trường hợp dấu bằng`]} );return lesson?{lesson,certificate:certificates}:null;
 }catch{return null;}
}
