import {fraction,fractionLatex,type Fraction} from '../../../shared/src/rationalPolynomial';
import {figureFromStatement} from '../../../shared/src/figureFromText';
import {normalizeProblemText} from '../../../shared/src/mathText';
import {ModelLessonSchema,type ModelLesson} from '../../../shared/src/solution';
import {algebraProofLesson,type AlgebraDeduction} from './algebraProofLesson';
const number='(\\d{1,5}(?:[.,]\\d{1,3})?)';
const parse=(s:string)=>{const [a,b='']=s.replace(',','.').split('.');return fraction(BigInt(a!+b),10n**BigInt(b.length));};
const add=(a:Fraction,b:Fraction)=>fraction(a.n*b.d+b.n*a.d,a.d*b.d);
const sub=(a:Fraction,b:Fraction)=>fraction(a.n*b.d-b.n*a.d,a.d*b.d);
const mul=(a:Fraction,b:Fraction)=>fraction(a.n*b.n,a.d*b.d);
const div=(a:Fraction,b:Fraction)=>fraction(a.n*b.d,a.d*b.n);
const f=fractionLatex;
function lesson(text:string,subtopic:string,strategy:string,details:AlgebraDeduction[],final:string,givens:string[],unknowns:string[],check?:{expression:string;expected:Fraction}):{lesson:ModelLesson}|null {
 const base=algebraProofLesson(text,subtopic,strategy,details,final,{givens,unknowns});
 const built=figureFromStatement(text);
 if(!base||!built)return null;
 const parsed=ModelLessonSchema.safeParse({...base,analysis:{...base.analysis,topic:'geometry'},figure:built.figure,answerChecks:check?[{kind:"value",statements:[check.expression],assignments:[],expected:`${check.expected.n}/${check.expected.d}`}]:[]});
 return parsed.success?{lesson:parsed.data}:null;
}
/** Entire-statement recognizers for elementary geometry computations; exact rational arithmetic, never a drawing as proof. */
export function triangleCalculationLesson(input:string):{lesson:ModelLesson}|null {
 const text=normalizeProblemText(input);
 const plain=text.replace(/\$/g,'').replace(/\\(?:widehat|hat)\{([A-Z]{1,3})\}/g,'∠$1').replace(/\^\{?\\circ\}?/g,'°').replace(/\\parallel/g,'∥').replace(/\s+/g,' ').trim();
 try {
  let m=new RegExp(`^Cho tam giác ([A-Z]{3}) cân tại ([A-Z])(?: và|,| có) ∠([A-Z]{1,3})\\s*=\\s*${number}°\\. Tính ∠([A-Z]{1,3}) và ∠([A-Z]{1,3})\\.$`).exec(plain);
  if(m) {
   const [tri,apex,angle,value,target1,target2]=m.slice(1) as [string,string,string,string,string,string];
   if(new Set(tri).size!==3||!tri.includes(apex!))return null;
   const vertex=(s:string)=>s.length===1&&tri.includes(s)?s:s.length===3&&new Set(s).size===3&&[...s].every(x=>tri.includes(x))?s[1]:null;
   const others=[...tri].filter(x=>x!==apex),givenVertex=vertex(angle!),t1=vertex(target1!),t2=vertex(target2!);
   if(givenVertex!==apex||!t1||!t2||t1===t2||!others.includes(t1)||!others.includes(t2))return null;
   const v=parse(value!),remaining=sub(fraction(180n),v),base=div(remaining,fraction(2n));
   if(v.n<=0n||remaining.n<=0n)return null;
   const [b,c]=others;
   const final=String.raw`$\widehat{${target1}}=\widehat{${target2}}=${f(base)}^\circ$.`;
   return lesson(text,'Góc trong tam giác cân','Dùng hai góc ở đáy bằng nhau và tổng ba góc của tam giác.',[
    {title:'Xác định hai góc ở đáy',explanation:`Tam giác $${tri}$ cân tại $${apex}$ nên $${apex}${b}=${apex}${c}$. Hai góc đối diện hai cạnh bằng nhau bằng nhau.`,math:String.raw`\widehat{${b}}=\widehat{${c}}`,reason:'Tính chất tam giác cân',question:`Hai góc nào đối diện hai cạnh bằng nhau?`},
    {title:'Viết tổng ba góc',explanation:`Tổng ba góc của tam giác bằng $180^\\circ$. Thay góc ở đỉnh đã cho và hai góc ở đáy bằng nhau.`,math:String.raw`${f(v)}^\circ+2\widehat{${b}}=180^\circ`,reason:'Tổng ba góc của tam giác',question:`Thay góc ở đỉnh vào tổng ba góc như thế nào?`},
    {title:'Tính và kết luận',explanation:`Trừ góc ở đỉnh rồi chia cho hai, ta có $\\widehat{${b}}=\\frac{180^\\circ-${f(v)}^\\circ}{2}=${f(base)}^\\circ$. Góc ở đáy còn lại bằng góc này. Vậy ${final}`,math:String.raw`\widehat{${target1}}=\widehat{${target2}}=${f(base)}^\circ`,reason:'Giải phương trình bậc nhất và hai góc ở đáy bằng nhau',question:'Mỗi góc ở đáy bằng bao nhiêu?'}
   ],final,[`Tam giác $${tri}$ cân tại $${apex}$`,String.raw`$\widehat{${angle}}=${f(v)}^\circ$`],[`$\\widehat{${target1}}$`,`$\\widehat{${target2}}$`],{expression:`(180-${v.n}/${v.d})/2`,expected:base});
  }
  m=new RegExp(`^Cho tam giác ([A-Z]{3}), ([A-Z]),\\s*([A-Z]) lần lượt là trung điểm của ([A-Z]{2}),\\s*([A-Z]{2})\\. Biết diện tích tam giác ([A-Z]{3}) bằng ${number}\\. Tính diện tích tam giác ([A-Z]{3})\\.$`).exec(plain);
  if(m) {
   const [tri,u,v,side1,side2,givenTri,area,target]=m.slice(1) as string[];
   const [a,b,c]=[...tri!];
   if(new Set([...tri!,u!,v!]).size!==5||side1!==a!+b!||side2!==a!+c!||givenTri!==tri||target!==a!+u!+v!)return null;
   const whole=parse(area!),small=div(whole,fraction(4n));if(whole.n<=0n)return null;
   const final=`Diện tích tam giác $${target}$ bằng $${f(small)}$.`;
   return lesson(text,'Diện tích và đường trung bình','Dùng đường trung bình để chứng minh hai tam giác đồng dạng với tỉ số một nửa; suy ra cả đáy và chiều cao đều giảm một nửa.',[
    {title:'Dùng hai trung điểm',explanation:`Vì $${u},${v}$ lần lượt là trung điểm của $${a}${b},${a}${c}$, đoạn $${u}${v}$ là đường trung bình của tam giác $${tri}$. Do đó $${u}${v}\\parallel ${b}${c}$ và $${a}${u}=\\frac12${a}${b}$.`,math:null,reason:'Định nghĩa trung điểm và định lí đường trung bình',question:'Đoạn nối hai trung điểm song song với cạnh nào?'},
    {title:'Chứng minh đồng dạng và tỉ số cạnh',explanation:`Hai tam giác $${target}$ và $${tri}$ có góc tại $${a}$ chung, góc $${a}${u}${v}$ bằng góc $${a}${b}${c}$ do hai đường thẳng song song. Vì thế chúng đồng dạng theo góc–góc, với tỉ số cạnh tương ứng $\\frac{${a}${u}}{${a}${b}}=\\frac12$.`,math:String.raw`\triangle ${target}\sim\triangle ${tri}`,reason:'Góc đồng vị; đồng dạng góc–góc',question:'Tỉ số đồng dạng bằng bao nhiêu?'},
    {title:'So sánh chiều cao',explanation:`Chọn các cạnh $${a}${u},${a}${b}$ cùng nằm trên đường thẳng $${a}${b}$ làm đáy. Nếu $${a}${c}\\perp ${a}${b}$, các chiều cao chính là $${a}${v},${a}${c}$ nên tỉ số bằng $\\frac12$. Trong trường hợp còn lại, kẻ đường cao từ $${v},${c}$ xuống đường thẳng này. Hai tam giác vuông tạo bởi các đường cao có góc ở $${a}$ chung nên đồng dạng; do $${a}${v}=\\frac12${a}${c}$, chiều cao từ $${v}$ bằng một nửa chiều cao từ $${c}$. Như vậy cả đáy lẫn chiều cao của tam giác nhỏ bằng một nửa các đại lượng tương ứng của tam giác lớn.`,math:null,reason:'Đồng dạng hai tam giác vuông; tỉ số cạnh tương ứng',question:'Vì sao chiều cao cũng giảm một nửa?'},
    {title:'Tính diện tích và kết luận',explanation:`Theo công thức diện tích bằng nửa tích đáy và chiều cao, tỉ số hai diện tích bằng $\\frac12\\cdot\\frac12=\\frac14$. Suy ra $S_{${target}}=\\frac{${f(whole)}}4=${f(small)}$. Vậy ${final[0]!.toLowerCase()+final.slice(1)}`,math:String.raw`S_{${target}}=\frac14 S_{${tri}}=${f(small)}`,reason:'Công thức diện tích tam giác',question:'Tích hai tỉ số đáy và chiều cao bằng bao nhiêu?'}
   ],final,[`$${u},${v}$ là hai trung điểm`,`$S_{${tri}}=${f(whole)}$`],[`$S_{${target}}$`],{expression:`(${whole.n}/${whole.d})/4`,expected:small});
  }
  m=new RegExp(`^Cho tam giác ([A-Z]{3}), ([A-Z]) thuộc đoạn ([A-Z]{2}), ([A-Z]) thuộc đoạn ([A-Z]{2}) và ([A-Z]{2})∥\\s*([A-Z]{2})\\. Biết ([A-Z]{2})=${number}, ([A-Z]{2})=${number}, ([A-Z]{2})=${number}\\. Tính ([A-Z]{2})\\.$`).exec(plain);
  if(!m)return null;
  const [tri,d,side1,e,side2,parallel1,parallel2,seg1,n1,seg2,n2,seg3,n3,target]=m.slice(1) as string[];
  const [a,b,c]=[...tri!];
  const same=(x:string,y:string)=>[...x].sort().join('')===[...y].sort().join('');
  if(new Set([...tri!,d!,e!]).size!==5||!same(side1!,a!+b!)||!same(side2!,a!+c!)||!same(parallel1!,d!+e!)||!same(parallel2!,b!+c!)||!same(target!,d!+e!))return null;
  const values=new Map([[seg1!,parse(n1!)],[seg2!,parse(n2!)],[seg3!,parse(n3!)]]);
  const length=(seg:string)=>[...values].find(([s])=>same(seg,s))?.[1];
  const ad=length(a!+d!),db=length(d!+b!),bc=length(b!+c!);
  if(!ad||!db||!bc||[ad,db,bc].some(v=>v.n<=0n))return null;
  const ab=add(ad,db),de=mul(div(ad,ab),bc);
  const final=`$${target}=${f(de)}$.`;
  return lesson(text,'Định lí Thalès','Cộng hai đoạn trên một cạnh, rồi dùng đồng dạng do hai đường thẳng song song.',[
   {title:`Tính cạnh $${a}${b}$`,explanation:`Vì $${d}$ thuộc đoạn $${a}${b}$ nên $${a}${b}=${a}${d}+${d}${b}$.`,math:`${a}${b}=${f(ad)}+${f(db)}=${f(ab)}`,reason:'Cộng độ dài hai đoạn liên tiếp',question:`Vì sao có thể cộng $${a}${d}$ và $${d}${b}$?`},
   {title:'Chứng minh hai tam giác đồng dạng',explanation:`Hai tam giác $${a}${d}${e}$ và $${a}${b}${c}$ có góc ở $${a}$ chung. Do $${d}${e}\\parallel ${b}${c}$, góc $${a}${d}${e}$ bằng góc $${a}${b}${c}$ (hai góc đồng vị). Vì vậy hai tam giác đồng dạng theo góc–góc.`,math:String.raw`\triangle ${a}${d}${e}\sim\triangle ${a}${b}${c}`,reason:'Hai góc đồng vị và trường hợp đồng dạng góc–góc',question:'Hai cặp góc tương ứng nào bằng nhau?'},
   {title:'Dùng tỉ số các cạnh tương ứng',explanation:`Từ đồng dạng, tỉ số cạnh $${d}${e}$ với $${b}${c}$ bằng tỉ số $${a}${d}$ với $${a}${b}$. Thay các độ dài đã biết.`,math:String.raw`\frac{${d}${e}}{${b}${c}}=\frac{${a}${d}}{${a}${b}}=\frac{${f(ad)}}{${f(ab)}}`,reason:'Tỉ số các cạnh tương ứng của hai tam giác đồng dạng',question:`Cạnh $${d}${e}$ tương ứng với cạnh nào?`},
   {title:'Tính và kết luận',explanation:`Nhân hai vế với $${b}${c}=${f(bc)}>0$, ta được $${d}${e}=${f(de)}$. Vậy ${final}`,math:String.raw`${d}${e}=\frac{${f(ad)}}{${f(ab)}}\cdot ${f(bc)}=${f(de)}`,reason:'Thay số và nhân hai vế',question:'Thay số vào tỉ lệ để tính độ dài cần tìm.'}
  ],final,[`$${d}\\in ${a}${b},\\quad ${e}\\in ${a}${c},\\quad ${d}${e}\\parallel ${b}${c}$`,`$${a}${d}=${f(ad)},\\quad ${d}${b}=${f(db)},\\quad ${b}${c}=${f(bc)}$`],[`Độ dài $${target}$`],{expression:`(${ad.n}/${ad.d})/((${ad.n}/${ad.d})+(${db.n}/${db.d}))*(${bc.n}/${bc.d})`,expected:de});
 } catch {return null;}
}
