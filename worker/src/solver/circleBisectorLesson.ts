import {normalizeProblemText} from '../../../shared/src/mathText';
import {figureFromStatement} from '../../../shared/src/figureFromText';
import {ModelLessonSchema,type ModelLesson} from '../../../shared/src/solution';
import {algebraProofLesson,type AlgebraDeduction} from './algebraProofLesson';
export interface CircleBisectorCertificate {a:string;b:string;c:string;d:string;e:string;f:string;o:string;statement:string}
/** Recognizes a theorem family, not fixed coordinates or a fixed answer. Extra requests are declined. */
export function circleBisectorCertificate(input:string):CircleBisectorCertificate|null {
 const statement=normalizeProblemText(input),plain=statement.replace(/\$/g,'').replace(/\s+/g,' ').trim();
 const m=/^Cho tam giác ([A-Z]{3}) nhọn nội tiếp đường tròn \(([A-Z])\)(.*?)\. Đường trung trực của ([A-Z]{2}) cắt ([A-Z]{2}) tại ([A-Z]); đường trung trực của ([A-Z]{2}) cắt ([A-Z]{2}) tại ([A-Z])\. Chứng minh các điểm ([A-Z](?:,\s*[A-Z]){3}) thuộc một đường tròn và đường tròn này đi qua tâm ([A-Z]) của \(([A-Z])\)\.$/.exec(plain);
 if(!m)return null;
 const [a,b,c]=[...m[1]!],o=m[2]!,e=m[6]!,f=m[9]!;
 const arc=new RegExp(`(?:và )?(?:điểm )?([A-Z]) trên cung nhỏ ${a}${c}(?: sao cho (.*))?$`).exec(m[3]!.trim());
 if(!arc)return null;
 const d=arc[1]!;
 if(new Set([a,b,c,d,e,f,o]).size!==7 || m[4]!==d!+b! || m[5]!==a!+b! || m[7]!==d!+c! || m[8]!==a!+c! || m[10]!.replace(/\s/g,'')!==[a,d,e,f].join(',') || m[11]!==o || m[12]!==o)return null;
 // Optional angle/chord restrictions are retained, not promoted to new goals or trusted prose.
 const prefix=m[3]!.trim().slice(0,arc.index).trim()
  .replace(/\\(?:widehat|hat)\s*\{?([A-Z])\}?/g,'\\hat $1');
 if(prefix && prefix!==`có \\hat ${a}>\\hat ${b}>\\hat ${c}`)return null;
 if(arc[2] && arc[2]!==`${c}${d}>${a}${b}`)return null;
 return {a:a!,b:b!,c:c!,d,e,f,o,statement};
}
export function verifyCircleBisectorCertificate(c:CircleBisectorCertificate):boolean {
 const fresh=circleBisectorCertificate(c.statement);
 return !!fresh && JSON.stringify(fresh)===JSON.stringify(c);
}
/** Synthetic proof with all positional cases. Equal/supplementary angles are never read off the drawing. */
export function circleBisectorLesson(input:string):{lesson:ModelLesson;certificate:CircleBisectorCertificate}|null {
 const cert=circleBisectorCertificate(input);if(!cert||!verifyCircleBisectorCertificate(cert))return null;
 const {a,b,c,d,e,f,o,statement:text}=cert;
 const angle=(s:string)=>String.raw`\widehat{${s}}`;
 const details:AlgebraDeduction[]=[
  {title:`Xét trường hợp đầu cung $${d}=${a}$`,explanation:`Nếu $${d}=${a}$ thì $${e}$ và $${f}$ lần lượt là trung điểm của $${a}${b}$ và $${a}${c}$; vì $${o}${a}=${o}${b}=${o}${c}$, các đường $${o}${e}$ và $${o}${f}$ là đường trung trực của hai dây ấy; do đó $${angle(a+e+o)}=${angle(a+f+o)}=90^\\circ$: $${e},${f}$ thuộc đường tròn đường kính $${a}${o}$; đường tròn này đã chứa các điểm yêu cầu. Từ đây xét $${d}\\ne ${a}$.`,math:null,reason:'Trung điểm của dây, đường trung trực và góc vuông chắn đường kính',question:`Nếu điểm $${d}$ trùng đầu cung $${a}$ thì hai giao điểm nằm ở đâu?`},
  {title:'Xác định góc từ cung nhỏ',explanation:`Đường trung trực của $${d}${c}$ đã được dựng nên $${d}\\ne ${c}$. Tam giác $${a}${b}${c}$ nhọn nên cung nhỏ $${a}${c}$ có số đo $2${angle(a+b+c)}<180^\\circ$. Cung $${a}${d}$ nằm trong cung này. Đặt $\\beta=${angle(a+b+d)}=${angle(a+c+d)}$, vì hai góc nội tiếp cùng chắn cung $${a}${d}$. Khi đó $0<\\beta<90^\\circ$ và góc ở tâm $${angle(a+o+d)}=2\\beta$. Cung $${a}${d}$ nhỏ hơn cung $${a}${c}$ nên dây $${a}${d}<${a}${c}$.`,math:null,reason:'Góc nội tiếp, góc ở tâm và so sánh dây với cung nhỏ',question:'Hai góc nội tiếp nào cùng chắn cung nhỏ cần dùng?'},
  {title:`Chứng minh $${f}$ nằm giữa $${a}$ và $${c}$`,explanation:`Vì $${f}$ thuộc đường trung trực của $${d}${c}$ nên $${f}${d}=${f}${c}$. Do $${a}${d}<${a}${c}$, điểm $${a}$ nằm về phía $${d}$ đối với đường trung trực của $${d}${c}$; còn $${c}$ nằm ở phía kia. Vì thế giao điểm $${f}$ với đoạn $${a}${c}$ nằm giữa hai đầu đoạn. Tam giác $${f}${c}${d}$ cân tại $${f}$, có $${angle(f+c+d)}=${angle(f+d+c)}=\\beta$, nên $${angle(c+f+d)}=180^\\circ-2\\beta$. Hai tia $${f}${a},${f}${c}$ đối nhau, do đó $${angle(a+f+d)}=2\\beta$.`,math:null,reason:'Đường trung trực chia hai miền gần mỗi đầu đoạn; tam giác cân và hai góc kề bù',question:`Vì sao $${f}$ nằm trong đoạn $${a}${c}$ và góc $${a}${f}${d}$ bằng $2\\beta$?`},
  {title:'Dựng đường tròn và chứng minh điểm thứ tư thuộc nó',explanation:`Vì cung $${a}${d}$ có số đo nằm giữa $0^\\circ$ và $180^\\circ$, ba điểm $${a},${d},${o}$ không thẳng hàng. Gọi $(${a}${d}${o})$ là đường tròn qua ba điểm này. Điểm $${c}$ và tâm $${o}$ ở cùng phía đối với dây $${a}${d}$, vì $${c}$ ở cung lớn $${a}${d}$. Điểm $${f}$ nằm trong đoạn $${a}${c}$ nên cũng ở phía ấy. Ta đã có $${angle(a+f+d)}=${angle(a+o+d)}=2\\beta$. Hai điểm $${f},${o}$ cùng nhìn đoạn $${a}${d}$ dưới một góc bằng nhau và ở cùng phía, nên $${f}\\in(${a}${d}${o})$.`,math:null,reason:'Đường tròn qua ba điểm không thẳng hàng và dấu hiệu cùng nhìn một đoạn từ cùng phía',question:`Hai điểm $${f},${o}$ nhìn đoạn nào dưới cùng một góc?`},
  {title:`Xác định vị trí có thể có của $${e}$`,explanation:`Ta có $${e}${d}=${e}${b}$ theo cách dựng. Điểm $${e}$ không thể trùng $${b}$. Nếu $${e}$ nằm trên tia đối của tia $${b}${a}$ thì $${angle(e+b+d)}=180^\\circ-\\beta>90^\\circ$, trái với việc hai góc ở đáy của tam giác cân $${e}${b}${d}$ bằng nhau. Vậy $${e}$ thuộc tia $${b}${a}$. Suy ra $${angle(e+b+d)}=${angle(e+d+b)}=\\beta$ và $${angle(b+e+d)}=180^\\circ-2\\beta$. Nếu $${e}=${a}$ thì $${e}$ đã thuộc $(${a}${d}${o})$; còn lại xét hai vị trí sau.`,math:null,reason:'Hai góc ở đáy tam giác cân bằng nhau; tổng ba góc bằng 180 độ',question:`Vì sao $${e}$ không thể nằm trên tia đối của $${b}${a}$?`},
  {title:`Trường hợp $${e}$ nằm giữa $${a}$ và $${b}$`,explanation:`Nếu $${e}$ nằm giữa $${a},${b}$, hai tia $${e}${a},${e}${b}$ đối nhau, nên $${angle(a+e+d)}=180^\\circ-${angle(b+e+d)}=2\\beta=${angle(a+o+d)}$. Điểm $${b}$ ở cung lớn $${a}${d}$ nên cùng phía với $${o}$ đối với dây $${a}${d}$; $${e}$ nằm trong đoạn $${a}${b}$ cũng ở phía ấy. Dấu hiệu cùng nhìn đoạn $${a}${d}$ dưới hai góc bằng nhau từ cùng phía cho $${e}\\in(${a}${d}${o})$.`,math:null,reason:'Hai góc kề bù và dấu hiệu nội tiếp từ hai góc cùng chắn một đoạn',question:`Trong trường hợp này, tia $${e}${a}$ và tia $${e}${b}$ có quan hệ gì?`},
  {title:`Trường hợp $${e}$ nằm ngoài đoạn về phía $${a}$`,explanation:`Nếu $${e}$ nằm trên tia $${b}${a}$ và ở ngoài đoạn $${a}${b}$, hai tia $${e}${a},${e}${b}$ trùng nhau; vì vậy $${angle(a+e+d)}=180^\\circ-2\\beta$ và $${angle(a+e+d)}+${angle(a+o+d)}=180^\\circ$. Điểm $${e}$ ở phía đối diện với $${b}$ và $${o}$ đối với dây $${a}${d}$. Hai góc đối bù nhau là dấu hiệu nội tiếp, nên $${e}\\in(${a}${d}${o})$.`,math:null,reason:'Hai tia trùng nhau và dấu hiệu tổng hai góc đối bằng 180 độ',question:`Khi $${e}$ nằm trên phần kéo dài qua $${a}$, cần dùng góc bằng nhau hay góc bù nhau?`},
  {title:'Kết luận cho cả hai yêu cầu',explanation:`Các vị trí hợp lệ của $${e}$ đã được xét hết: nằm trong đoạn, trùng $${a}$ hoặc nằm trên phần kéo dài qua $${a}$. Trong mọi trường hợp $${e}$ và $${f}$ đều thuộc đường tròn $(${a}${d}${o})$ qua $${a},${d},${o}$. Vậy đường tròn này chứa cả bốn điểm $${a},${d},${e},${f}$ và đi qua tâm $${o}$, như hai yêu cầu của đề. Trường hợp đầu cung đã được giải riêng ở bước đầu.`,math:String.raw`${a},${d},${e},${f},${o}\in(${a}${d}${o})`,reason:'Các trường hợp đã xét bao phủ mọi vị trí và cùng cho một đường tròn',question:'Hai điểm vừa chứng minh thuộc cùng đường tròn nào?'}
 ];
 const base=algebraProofLesson(text,'Đường trung trực của dây và các trường hợp vị trí','Chứng minh giao điểm trên cạnh thứ hai thuộc đường tròn qua đỉnh, điểm trên cung và tâm; sau đó xét đầy đủ vị trí của giao điểm còn lại.',details,`Đường tròn qua $${a},${d},${o}$ chứa $${e},${f}$; cả hai yêu cầu đã được chứng minh.`,{givens:[text.split(/Chứng minh/)[0]!],unknowns:['Đường tròn chứa các điểm đã cho và đi qua tâm']});
 const built=figureFromStatement(text);if(!base||!built||built.unbuilt.length||built.resolved.errors.length)return null;
 // The additional circle is dependent on the original draggable construction, not a replacement diagram.
 const centerId='aux_center_proof',circleId='circle_proof';
 const figure={...built.figure,points:[...built.figure.points,{id:centerId,label:'',kind:'circumcenter' as const,refs:[a,d,o],x:null,y:null,value:null,value2:null,draggable:false,hidden:true}],circles:[...built.figure.circles,{id:circleId,center:centerId,through:a,radius:null,label:'Đường tròn phụ',style:'construction' as const}]};
 const dependencies=[[],[],['s2'],['s2','s3'],['s2'],['s4','s5'],['s4','s5'],['s1','s4','s6','s7']];
 base.steps.forEach((s,i)=>{s.uses=dependencies[i]!;});
 base.analysis.interpretationNotes=['Hình chỉ minh họa một vị trí. Hai trường hợp điểm giao nằm trong đoạn và trên phần kéo dài được xét riêng; không suy ra vị trí các điểm chỉ từ hình vẽ.'];
 base.steps.forEach((s,i)=>{s.geometryActions=[{action:'highlight',targets:i<2?[a,b,c,d,o]:i<4?[a,c,d,f,o]:[a,b,d,e,f,o]}];});
 base.steps[3]!.geometryActions.push({action:'show',targets:[circleId]});
 base.steps.at(-1)!.geometryActions.push({action:'highlight',targets:[circleId]});
 base.hints=details.map((s,i)=>({id:`h${i+1}`,level:Math.min(i+1,4) as 1|2|3|4,question:s.question,cue:s.reason,explanation:s.explanation,math:s.math,stepId:base.steps[i]!.id,focus:[a,d,e,f,o]}));
 const parsed=ModelLessonSchema.safeParse({...base,analysis:{...base.analysis,topic:'geometry'},figure});
 return parsed.success?{lesson:parsed.data,certificate:cert}:null;
}
