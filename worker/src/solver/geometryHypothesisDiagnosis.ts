import {normalizeProblemText} from '../../../shared/src/mathText';
import {ModelLessonSchema,type ModelLesson,type Figure,type PointDef} from '../../../shared/src/solution';
import {algebraProofLesson} from './algebraProofLesson';
const point=(id:string,kind:PointDef['kind'],refs:string[]=[],x:number|null=null,y:number|null=null):PointDef=>({id,label:id,kind,refs,x,y,value:null,value2:null,draggable:kind==='free',hidden:false});
function finish(base:ModelLesson|null,figure:Figure):ModelLesson|null {
 if(!base)return null;
 const parsed=ModelLessonSchema.safeParse({...base,analysis:{...base.analysis,topic:'geometry'},figure});
 return parsed.success?parsed.data:null;
}
/** Whole-question matching: never discard an extra hypothesis or requested part.
 * These are constructive diagnoses, not a claim that every geometry problem is solved. */
export function geometryHypothesisDiagnosis(input:string):ModelLesson|null {
 const text=normalizeProblemText(input),plain=text.replace(/\$/g,'').replace(/\s+/g,' ').trim();
 let m=/^Cho tam giác ([A-Z]{3}), ([A-Z]),([A-Z]) lần lượt là chân đường cao từ ([A-Z]),([A-Z])\. Chứng minh tứ giác ([A-Z]{4}) nội tiếp\.$/.exec(plain);
 if(m) {
  const [tri,e,f,from1,from2,quad]=m.slice(1) as string[],[a,b,c]=[...tri!];
  if(new Set([...tri!,e!,f!]).size!==5||from1!==b||from2!==c||quad!==b!+c!+e!+f!)return null;
  const final=`Đề hiện tại chưa bảo đảm $${quad}$ là một tứ giác có bốn đỉnh phân biệt. Bốn điểm luôn nằm trên đường tròn đường kính $${b}${c}$; nếu tam giác không vuông thì chúng phân biệt và tạo thành tứ giác nội tiếp. Nếu tam giác vuông, có các đỉnh trùng nhau như đã xét.`;
  const base=algebraProofLesson(text,'Kiểm tra đỉnh trùng nhau','Chứng minh tính chất của đường tròn trước, rồi xét đủ ba trường hợp tam giác vuông thay vì bỏ qua điều kiện bốn đỉnh phân biệt.',[
   {title:'Hai chân đường cao thuộc đường tròn đường kính',explanation:`Theo cách dựng, $${b}${e}\\perp ${a}${c}$ và $${c}${f}\\perp ${a}${b}$. Nếu $${e}\\ne ${c}$ thì $\\widehat{${b}${e}${c}}=90^\\circ$, nên $${e}$ thuộc đường tròn đường kính $${b}${c}$. Nếu $${e}=${c}$ thì điểm ấy đã là đầu đường kính. Tương tự, $${f}$ thuộc đường tròn này khi $${f}\\ne ${b}$ nhờ góc vuông $\\widehat{${b}${f}${c}}$; khi $${f}=${b}$ thì đó là đầu đường kính.`,math:null,reason:'Định nghĩa chân đường cao; dấu hiệu góc vuông chắn đường kính',question:'Nếu chân đường cao trùng đầu đường kính thì phải xét thế nào?'},
   {title:'Chỉ ra trường hợp vuông làm các đỉnh trùng nhau',explanation:`Nếu tam giác vuông tại $${a}$ thì $${e}=${f}=${a}$. Nếu vuông tại $${b}$ thì $${f}=${b}$; nếu vuông tại $${c}$ thì $${e}=${c}$. Ví dụ cụ thể: dựng hai cạnh vuông góc $${a}${b}=4$, $${a}${c}=3$. Khi đó cả hai chân đường cao từ $${b},${c}$ đều là $${a}$, nên $${quad}$ chỉ có ba điểm phân biệt.`,math:null,reason:'Hình chiếu lên hai cạnh vuông góc; ví dụ cụ thể thỏa giả thiết',question:'Với tam giác vuông tại đỉnh thứ nhất, hai chân đường cao ở đâu?'},
   {title:'Kiểm tra điều kiện đủ để có bốn đỉnh phân biệt',explanation:`Nếu tam giác không vuông, $${e}=${c}$ sẽ buộc góc $${c}$ vuông và $${f}=${b}$ sẽ buộc góc $${b}$ vuông, đều trái giả thiết bổ sung. Điểm $${e}$ không thể trùng $${b}$ vì $${b}$ không nằm trên $${a}${c}$; tương tự $${f}\\ne ${c}$. Nếu $${e}=${f}$ thì điểm ấy phải là giao điểm của hai đường thẳng $${a}${b},${a}${c}$, tức $${a}$, làm góc $${a}$ vuông. Do đó bốn điểm phân biệt khi tam giác không vuông. Vậy ${final}`,math:null,reason:'Hai cạnh của tam giác chỉ gặp nhau tại đỉnh; kiểm tra mọi cặp đỉnh',question:'Vì sao hai chân đường cao trùng nhau buộc góc ở đỉnh chung vuông?'}
  ],final,{givens:['Tam giác được cho chưa có điều kiện loại góc vuông'],constraints:['Không tự thêm giả thiết tam giác nhọn'],unknowns:['Tính nội tiếp và điều kiện bốn đỉnh phân biệt']});
  const center='O_BC',figure:Figure={scale:'schematic',points:[point(a!,'free',[],0,0),{...point(b!,'polar',[a!]),value:0,value2:4},{...point(c!,'polar',[a!]),value:90,value2:3},point(e!,'foot',[b!,a!,c!]),point(f!,'foot',[c!,a!,b!]),{...point(center,'midpoint',[b!,c!]),label:'',hidden:true}],lines:[a!+b!,a!+c!,b!+c!].map(s=>({id:'seg_'+s,kind:'segment',from:s[0]!,to:s[1]!,style:'given',label:null})),circles:[{id:'c_BC',center,through:b!,radius:null,style:'construction',label:null}],angles:[],marks:[],checks:[]};
  return finish(base,figure);
 }
 m=/^Cho bốn điểm ([A-Z]),([A-Z]),([A-Z]),([A-Z]) phân biệt, không có ba điểm nào thẳng hàng, thỏa mãn \\widehat\{([A-Z]{3})\}=\\widehat\{([A-Z]{3})\}\. Chứng minh tứ giác ([A-Z]{4}) nội tiếp\.$/.exec(plain);
 if(!m)return null;
 const [a,b,c,d,left,right,quad]=m.slice(1) as string[];
 if(new Set([a,b,c,d]).size!==4||left!==a!+c!+b!||right!==a!+d!+b!||quad!==a!+b!+c!+d!)return null;
 const mid=['M','N','P','Q','R','S','T'].find(id=>![a,b,c,d].includes(id))!;
 const final=`Chỉ có $\\widehat{${left}}=\\widehat{${right}}$ chưa đủ để suy ra nội tiếp. Cần thêm điều kiện $${c},${d}$ ở cùng phía đối với đường thẳng $${a}${b}$, hoặc thay bằng tổng hai góc bằng $180^\\circ$ khi hai điểm ở khác phía. Cấu hình trên là phản ví dụ cụ thể cho đề hiện tại.`;
 const base=algebraProofLesson(text,'Kiểm tra điều kiện của dấu hiệu nội tiếp','Dựng hai tam giác bằng nhau ở hai phía của đáy để giữ góc bằng nhau, rồi kiểm tra tổng hai góc đối.',[
  {title:'Dựng một cấu hình cụ thể',explanation:`Lấy $${a}${b}=2$ và $${mid}$ là trung điểm. Trên đường thẳng vuông góc với $${a}${b}$ tại $${mid}$, lấy $${c},${d}$ ở hai phía sao cho $${mid}${c}=${mid}${d}=2$. Bốn điểm phân biệt, không có ba điểm thẳng hàng. Đây là cách dựng rõ ràng, không giả sử kết luận nội tiếp.`,math:null,reason:'Dựng đường trung trực và hai điểm đối xứng qua trung điểm',question:'Có thể đặt hai đỉnh ở hai phía của đáy như thế nào?'},
  {title:'Kiểm tra chính xác giả thiết góc bằng nhau',explanation:`Các tam giác vuông $${a}${mid}${c}$ và $${a}${mid}${d}$ có hai cạnh góc vuông bằng nhau nên bằng nhau; suy ra $${a}${c}=${a}${d}$. Tương tự $${b}${c}=${b}${d}$. Hai tam giác $${a}${c}${b},${a}${d}${b}$ bằng nhau theo cạnh–cạnh–cạnh, do đó $\\widehat{${left}}=\\widehat{${right}}$.`,math:null,reason:'Hai cạnh góc vuông; trường hợp cạnh–cạnh–cạnh',question:'Hai tam giác đối xứng có thỏa đúng giả thiết về góc không?'},
  {title:'Kiểm tra tổng hai góc đối',explanation:`Vì tam giác $${a}${c}${b}$ cân, $${c}${mid}$ là phân giác. Trong tam giác vuông $${a}${mid}${c}$, $\\tan\\widehat{${a}${c}${mid}}=\\frac{${mid}${a}}{${mid}${c}}=\\frac12<1=\\tan45^\\circ$, nên $\\widehat{${left}}=2\\widehat{${a}${c}${mid}}<90^\\circ$. Góc $\\widehat{${right}}$ bằng góc ấy nên cũng nhỏ hơn $90^\\circ$. Tứ giác theo thứ tự $${a}${c}${b}${d}$ có hai góc đối tại $${c},${d}$ với tổng nhỏ hơn $180^\\circ$, nên không nội tiếp. Vậy ${final}`,math:null,reason:'Tỉ số lượng giác lớp9; tổng hai góc đối của tứ giác nội tiếp bằng 180 độ',question:'Hai góc bằng nhau nhưng tổng có nhất thiết bằng 180 độ không?'}
 ],final,{givens:[`Hai góc $${left},${right}$ bằng nhau; bốn điểm phân biệt`],constraints:['Chưa có điều kiện cùng phía của hai đỉnh'],unknowns:['Kết luận nội tiếp có suy ra từ các giả thiết hay không']});
 const center='O_ACB',figure:Figure={scale:'schematic',points:[point(a!,'free',[],0,0),{...point(b!,'polar',[a!]),value:0,value2:2},{...point(c!,'polar',[mid]),value:90,value2:2},point(mid,'midpoint',[a!,b!]),point(d!,'reflect',[c!,mid]),{...point(center,'circumcenter',[a!,c!,b!]),label:'',hidden:true}],lines:[a!+c!,c!+b!,b!+d!,d!+a!].map(s=>({id:'seg_'+s,kind:'segment',from:s[0]!,to:s[1]!,style:'given',label:null})),circles:[{id:'c_ACB',center,through:a!,radius:null,style:'construction',label:null}],angles:[],marks:[],checks:[]};
 return finish(base,figure);
}
