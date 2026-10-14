import {parseMathText} from '../../../shared/src/mathText';
import {splitRelation} from '../../../shared/src/expr';
import {residueCertificate,verifyResidueCertificate,type ResidueCertificate} from '../../../shared/src/integerPolynomial';
import {integerResidueLesson} from './integerResidueLesson';
import {algebraProofLesson,type AlgebraDeduction} from './algebraProofLesson';
interface EquationTask {text:string;variable:string;equation:string;expression:string;domain:'integer'|'natural'|'positive'}
export interface EquationObstructionCertificate {task:EquationTask;residues:ResidueCertificate}
function equationTask(text:string):EquationTask|null {
 const maths:string[]=[];if(text.includes('§'))return null;
 const template=parseMathText(text.trim()).map(s=>s.kind==='math'?`§${maths.push(s.value)-1}§`:s.value).join('').replace(/\s+/g,' ').trim();
 const m=/^(?:Chứng minh không có|Tìm tất cả các) (số nguyên|số tự nhiên|số nguyên dương) §0§ (?:sao cho|thỏa mãn) §1§\.?$/iu.exec(template);
 if(!m||maths.length!==2||!/^[a-z]$/u.test(maths[0]!.trim()))return null;
 const relation=splitRelation(maths[1]!);if(!relation||relation.rel!=='=')return null;
 return {text,variable:maths[0]!.trim(),equation:maths[1]!,expression:`(${relation.sides[0]})-(${relation.sides[1]})`,domain:m[1]!.toLowerCase()==='số nguyên'?'integer':m[1]!.toLowerCase()==='số tự nhiên'?'natural':'positive'};
}
export function equationObstructionCertificate(text:string):EquationObstructionCertificate|null {
 const task=equationTask(text);if(!task)return null;
 for(let m=2;m<=16;m++){const residues=residueCertificate(task.expression,m,task.variable);if(!residues)return null;if(!residues.zeros.length)return {task,residues};}
 return null;
}
export function verifyEquationObstructionCertificate(c:EquationObstructionCertificate):boolean {
 const t=equationTask(c.task.text);return !!t&&JSON.stringify(t)===JSON.stringify(c.task)&&c.residues.expression===t.expression&&c.residues.variable===t.variable&&verifyResidueCertificate(c.residues)&&!c.residues.zeros.length;
}
export function integerEquationObstructionLesson(text:string) {
 const c=equationObstructionCertificate(text);if(!c||!verifyEquationObstructionCertificate(c))return null;
 const {variable:n,domain}=c.task,m=c.residues.modulus,word=domain==='integer'?'nguyên':domain==='natural'?'tự nhiên (kể cả 0)':'nguyên dương';
 const core=integerResidueLesson(`Tìm tất cả các số nguyên $${n}$ sao cho $${c.task.expression}$ chia hết cho $${m}$.`);if(!core)return null;
 const details:AlgebraDeduction[]=[{title:'Nêu điều kiện số dư bắt buộc nếu có nghiệm',explanation:`Gọi $P(${n})=${c.task.expression}$ là hiệu hai vế. Nếu phương trình gốc đúng thì $P(${n})=0$. Số $0$ chia hết cho $${m}$, nên một nghiệm của phương trình nhất thiết phải làm hiệu có số dư $0$ khi chia $${m}$. Ta sẽ chứng minh không giá trị nguyên nào có số dư này.`,math:`${c.task.equation}\\quad\\Rightarrow\\quad P(${n})=0\\quad\\Rightarrow\\quad P(${n})\\vdots ${m}`,reason:'Phương trình buộc hiệu bằng0; 0 chia hết cho mọi số nguyên khác0',question:'Nếu phương trình đúng, hiệu hai vế phải có số dư nào?'}];
 details.push(...core.lesson.steps.slice(0,-1).map(s=>({title:s.title,explanation:s.explanation,math:s.math,reason:s.reason??'Xét đầy đủ các lớp số dư',question:'Các lớp số dư có bao quát mọi số nguyên và có lớp nào cho hiệu bằng0 không?'})));
 const answer=`Vậy không có số ${word} $${n}$ thỏa mãn phương trình đã cho.`;
 details.push({title:'Kết luận từ mâu thuẫn của điều kiện cần',explanation:`Mọi lớp số dư của số nguyên đã được xét và không lớp nào làm $P(${n})$ chia hết cho $${m}$. Điều này mâu thuẫn điều kiện cần của một nghiệm; do đó không thể có nghiệm, kể cả số âm hoặc giá trị ngoài một khoảng thử nhỏ. ${answer}`,math:null,reason:'Không giá trị nào thỏa điều kiện cần đã chứng minh cho mọi số nguyên',question:'Vì sao cản trở số dư đủ loại mọi nghiệm, không chỉ nghiệm trong một khoảng hữu hạn?'});
 const lesson=algebraProofLesson(text,'Phương trình nghiệm nguyên: cản trở số dư','Lấy hiệu hai vế; chứng minh số dư0 không thể xảy ra bằng đầy đủ các lớp số dư.',details,answer,{givens:[`$${n}$ là số ${word}.`,`$${c.task.equation}$`],unknowns:['Tính tồn tại của nghiệm nguyên theo miền đề.']});
 if(!lesson)return null;lesson.analysis.topic='number_theory';return {lesson,certificate:c};
}
