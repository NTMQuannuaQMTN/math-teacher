import {normalizeProblemText} from '../../../shared/src/mathText';
import {figureFromStatement} from '../../../shared/src/figureFromText';
import {ModelLessonSchema,type ModelLesson} from '../../../shared/src/solution';
import {algebraProofLesson} from './algebraProofLesson';
/** A constructive degeneracy witness for the complete diameter/orthocenter question family.
 * Does not silently add unequal sides or claim a diagram proves the general theorem. */
export function diameterOrthocenterDiagnosis(input:string):ModelLesson|null {
 const text=normalizeProblemText(input),plain=text.replace(/\$/g,'').replace(/\s+/g,' ').trim();
 const m=/^Cho tứ giác ([A-Z]{4}) nội tiếp đường tròn \(([A-Z])\) có tam giác ([A-Z]{3}) là tam giác nhọn và đường chéo ([A-Z]{2}) đi qua tâm ([A-Z]) của đường tròn \(([A-Z])\)\. Gọi ([A-Z]) là trung điểm ([A-Z]{2}), ([A-Z]) là trực tâm của tam giác ([A-Z]{3}), ([A-Z]) là giao điểm khác ([A-Z]) của ([A-Z]{2}) với \(([A-Z])\) và ([A-Z]) là hình chiếu vuông góc của ([A-Z]) lên ([A-Z]{2})\. Chứng minh ([A-Z]{4}) là hình bình hành và ([A-Z])([A-Z])\^2=([A-Z])([A-Z])\^2=([A-Z])([A-Z])\\cdot\s*([A-Z])([A-Z])\.$/.exec(plain);
 if(!m)return null;
 const [quad,o,tri,diameter,center1,center2,i,baseSide,h,altTri,e,avoid,secant,circle,k,projected,projection,parallelogram,...product]=m.slice(1) as string[];
 const [a,b,c,d]=[...quad!];
 if(new Set([a,b,c,d,o,i,h,e,k]).size!==9 || tri!==a!+b!+d! || diameter!==a!+c! || center1!==o || center2!==o || baseSide!==b!+d! || altTri!==tri || avoid!==a || secant!==a!+i! || circle!==o || projected!==h || projection!==secant || parallelogram!==c!+e!+h!+k! || product.join('')!==i!+b!+i!+d!+i!+a!+i!+k!)return null;
 const final=`Với đề hiện tại, $${e}=${c}$ và $${k}=${h}$ có thể xảy ra; vì vậy $${c}${e}${h}${k}$ không nhất thiết là một hình bình hành không suy biến. Cần xác nhận giả thiết loại trường hợp này trước khi chứng minh kết luận ấy. Ví dụ trên vẫn thỏa đẳng thức tích, nhưng chưa phải chứng minh đẳng thức trong mọi trường hợp.`;
 const base=algebraProofLesson(text,'Kiểm tra trường hợp suy biến','Chọn một cấu hình hợp lệ theo đúng giả thiết để kiểm tra bốn đỉnh có luôn phân biệt hay không.',[
  {title:'Chọn một trường hợp được giả thiết cho phép',explanation:`Lấy tam giác $${a}${b}${d}$ đều, nội tiếp đường tròn $(${o})$ bán kính $2$. Đây là tam giác nhọn nên thỏa giả thiết. Lấy $${c}$ đối diện $${a}$ qua tâm: $${a}${c}$ là đường kính. Bốn điểm $${a},${b},${c},${d}$ đều phân biệt và nằm trên đường tròn.`,math:null,reason:'Tam giác đều có ba góc bằng 60 độ; dựng đường kính',question:'Giả thiết có loại tam giác đều hay không?'},
  {title:'Xác định trung điểm và trực tâm',explanation:`Vì tam giác đều, trung tuyến từ $${a}$ đồng thời là đường cao, đường trung trực và đường phân giác. Tâm đường tròn ngoại tiếp cũng là trực tâm và trọng tâm, nên $${h}=${o}$; các điểm $${a},${o},${i},${c}$ thẳng hàng. Trọng tâm chia trung tuyến theo tỉ số $2:1$, nên từ $${a}${o}=2$ suy ra $${a}${i}=3$ và $${o}${i}=1$.`,math:null,reason:'Các tâm của tam giác đều trùng nhau; tính chất trọng tâm',question:'Trong tam giác đều, trực tâm nằm ở đâu?'},
  {title:'Hai cặp đỉnh của tứ giác trùng nhau',explanation:`Đường thẳng $${a}${i}$ chính là đường thẳng chứa đường kính $${a}${c}$, nên giao điểm thứ hai với đường tròn là $${e}=${c}$. Điểm $${h}=${o}$ đã nằm trên đường thẳng này, vì vậy hình chiếu của $${h}$ lên nó là chính $${h}$: $${k}=${h}$. Do đó $${c}${e}${h}${k}$ chỉ có hai điểm phân biệt, không phải một tứ giác.`,math:null,reason:'Giao điểm của đường kính với đường tròn; hình chiếu của điểm đã nằm trên đường thẳng',question:'Bốn đỉnh được yêu cầu có còn phân biệt không?'},
  {title:'Kiểm tra phần đẳng thức và nêu giới hạn',explanation:`Tam giác $${o}${i}${b}$ vuông tại $${i}$ vì trung tuyến của tam giác đều vuông góc với đáy. Theo Pythagore, $${i}${b}^2=2^2-1^2=3$, và $${i}${d}^2=3$ do $${i}$ là trung điểm. Mặt khác $${i}${a}\\cdot ${i}${k}=3\\cdot1=3$. Vậy ${final}`,math:String.raw`${i}${b}^2=${i}${d}^2=${i}${a}\cdot ${i}${k}=3`,reason:'Pythagore; phản ví dụ đối với kết luận không suy biến',question:'Ví dụ này bác bỏ phần nào và chưa giải quyết phần nào?'}
 ],final,{givens:['Giữ nguyên giả thiết của đề; tam giác đều là một trường hợp tam giác nhọn'],unknowns:['Kiểm tra tính không suy biến của hình bình hành'],constraints:['Không tự thêm giả thiết hai cạnh khác nhau']});
 const built=figureFromStatement(text);if(!base||!built)return null;
 const figure={...built.figure,points:built.figure.points.map(p=>p.id===a?{...p,value:90}:p.id===b?{...p,value:210}:p.id===d?{...p,value:330}:p),circles:built.figure.circles.map(q=>q.label===`(${o})`?{...q,radius:2}:q)};
 const parsed=ModelLessonSchema.safeParse({...base,analysis:{...base.analysis,topic:'geometry',statusReason:'Giả thiết hiện tại cho phép hai cặp đỉnh trùng nhau.',interpretationNotes:['Hình minh họa là phản ví dụ tam giác đều, không phải chứng minh cho mọi cấu hình.']},figure});
 return parsed.success?parsed.data:null;
}
