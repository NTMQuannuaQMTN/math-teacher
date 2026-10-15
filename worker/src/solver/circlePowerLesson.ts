import {fraction,fractionLatex,type Fraction} from '../../../shared/src/rationalPolynomial';
import {normalizeProblemText} from '../../../shared/src/mathText';
import {type ModelLesson} from '../../../shared/src/solution';
import {algebraProofLesson,type AlgebraDeduction} from './algebraProofLesson';
import {flatten} from './routine/text';

type Family='tangent-secant'|'intersecting-chords';
export interface CirclePowerCertificate {
 family:Family; statement:string; pivot:string; tangent?:string; first:string; second:string;
 givens:Record<string,string>; target:string; result:{n:string;d:string};
}
const segment=(s:string)=>[...s].sort().join('');
const sameSegment=(a:string,b:string)=>segment(a)===segment(b);
const q=(s:string)=>fraction(BigInt(s));
const div=(a:Fraction,b:Fraction)=>fraction(a.n*b.d,a.d*b.n);
const mul=(a:Fraction,b:Fraction)=>fraction(a.n*b.n,a.d*b.d);
const sq=(a:Fraction)=>mul(a,a);
const positive=(a:Fraction)=>a.n>0n;
const values=(plain:string)=>new Map([...plain.matchAll(/\b([A-Z]{2})=(\d{1,6})\b/g)].map(m=>[segment(m[1]!),m[2]!]));
const value=(map:Map<string,string>,s:string)=>map.get(segment(s));

/** Whole-statement recognizer. It rejects extra goals and records every value used by the exact calculation. */
export function circlePowerCertificate(input:string):CirclePowerCertificate|null {
 const statement=normalizeProblemText(input),plain=flatten(statement).replace(/\s+([,.;:])/g,'$1');
 let m=/^Từ điểm ([A-Z]) nằm ngoài đường tròn \(([A-Z])\), kẻ tiếp tuyến ([A-Z]{2}) và cát tuyến qua ([A-Z]) cắt đường tròn lần lượt tại ([A-Z]),\s*([A-Z]), với ([A-Z]) nằm giữa ([A-Z]),\s*([A-Z])\. Biết ([\s\S]+)\. Tính ([A-Z]{2}) và chứng minh hệ thức được dùng\.$/u.exec(plain);
 if(m){
  const [p,o,tangent,p2,b,c,between,p3,c2,givenText,target]=m.slice(1) as string[];
  if(p!==p2||p!==p3||c!==c2||b!==between||tangent![0]!==p||new Set([p,o,tangent![1],b,c]).size!==5)return null;
  const map=values(givenText!),ta=value(map,tangent!),near=value(map,p!+b!),far=value(map,p!+c!);
  if(target!==p!+c||!ta||!near||far||map.size!==2)return null;
  const a=q(ta),n=q(near);if(!positive(a)||!positive(n))return null;
  const result=div(sq(a),n);
  return {family:'tangent-secant',statement,pivot:p!,tangent:tangent!,first:p!+b!,second:p!+c!,givens:Object.fromEntries(map),target:target!,result:{n:String(result.n),d:String(result.d)}};
 }
 m=/^Hai dây ([A-Z]{2}) và ([A-Z]{2}) của một đường tròn cắt nhau tại điểm ([A-Z]) bên trong đường tròn\. Biết ([\s\S]+)\. Tính ([A-Z]{2}) và chứng minh hệ thức được dùng\.$/u.exec(plain);
 if(!m)return null;
 const [chord1,chord2,p,givenText,target]=m.slice(1) as string[];
 if(new Set([...chord1!,...chord2!,p!]).size!==5||chord1!.includes(p!)||chord2!.includes(p!))return null;
 const arms=[p!+chord1![0],p!+chord1![1],p!+chord2![0],p!+chord2![1]],map=values(givenText!);
 const missing=arms.filter(s=>!value(map,s));
 if(missing.length!==1||!sameSegment(missing[0]!,target!)||map.size!==3)return null;
 const known=arms.map(s=>value(map,s));if(known.some((v,i)=>i!==arms.indexOf(missing[0]!)&&!v))return null;
 const targetIndex=arms.indexOf(missing[0]!);
 const mate=targetIndex%2===0?targetIndex+1:targetIndex-1;
 const other:[number,number]=targetIndex<2?[2,3]:[0,1];
 const result=div(mul(q(known[other[0]]!),q(known[other[1]]!)),q(known[mate]!));
 if(!positive(result))return null;
 return {family:'intersecting-chords',statement,pivot:p!,first:chord1!,second:chord2!,givens:Object.fromEntries(map),target:target!,result:{n:String(result.n),d:String(result.d)}};
}

export function verifyCirclePowerCertificate(c:CirclePowerCertificate):boolean {
 const fresh=circlePowerCertificate(c.statement);
 return !!fresh&&JSON.stringify(fresh)===JSON.stringify(c);
}

function tangentLesson(c:CirclePowerCertificate):ModelLesson|null {
 const p=c.pivot,t=c.tangent!,a=t[1]!,b=c.first.replace(p,''),d=c.second.replace(p,''),r=fraction(BigInt(c.result.n),BigInt(c.result.d));
 const ta=q(c.givens[segment(t)]!),near=q(c.givens[segment(c.first)]!);
 const details:AlgebraDeduction[]=[
  {title:'Chọn hai tam giác để chứng minh đồng dạng',explanation:`Nối $${a}${b}$ và $${a}${d}$. Xét hai tam giác $${p}${a}${b}$ và $${p}${d}${a}$. Vì $${p},${b},${d}$ thẳng hàng và $${b}$ nằm giữa $${p},${d}$, hai góc tại $${p}$ là cùng một góc.`,math:String.raw`\widehat{${a}${p}${b}}=\widehat{${d}${p}${a}}`,reason:'Hai tia cùng phương do ba điểm thẳng hàng',question:'Nên xét hai tam giác nào để xuất hiện ba độ dài cần dùng?'},
  {title:'Tạo cặp góc thứ hai',explanation:`Theo định lí góc tạo bởi tiếp tuyến và dây cung, góc giữa tiếp tuyến $${p}${a}$ và dây $${a}${b}$ bằng góc nội tiếp chắn cùng dây $${a}${b}$. Vì tia $${d}${b}$ trùng tia $${d}${p}$, góc nội tiếp đó là $\widehat{${p}${d}${a}}$.`,math:String.raw`\widehat{${p}${a}${b}}=\widehat{${p}${d}${a}}`,reason:'Định lí góc tạo bởi tiếp tuyến và dây cung',question:'Góc giữa tiếp tuyến và dây cung bằng góc nội tiếp nào?'},
  {title:'Suy ra hệ thức tiếp tuyến–cát tuyến',explanation:`Hai tam giác $${p}${a}${b}$ và $${p}${d}${a}$ đồng dạng theo góc–góc. Các cạnh tương ứng cho $\dfrac{${p}${a}}{${p}${d}}=\dfrac{${p}${b}}{${p}${a}}$. Nhân chéo được hệ thức cần dùng.`,math:String.raw`${p}${a}^{2}=${p}${b}\cdot ${p}${d}`,reason:'Tam giác đồng dạng và nhân chéo tỉ lệ',question:'Từ đồng dạng, viết tỉ lệ nào có đoạn tiếp tuyến xuất hiện hai lần?'},
  {title:`Thay số để tính $${c.target}$`,explanation:`Thay $${t}=${fractionLatex(ta)}$ và $${c.first}=${fractionLatex(near)}$ vào hệ thức trên: $${c.second}=\dfrac{${fractionLatex(ta)}^2}{${fractionLatex(near)}}=${fractionLatex(r)}$. Vậy $${c.target}=${fractionLatex(r)}$.`,math:String.raw`${c.target}=\frac{${fractionLatex(ta)}^2}{${fractionLatex(near)}}=${fractionLatex(r)}`,reason:'Chia hai vế cho độ dài dương của đoạn gần',question:`Giá trị chính xác của $${c.target}$ là bao nhiêu?`}
 ];
 return algebraProofLesson(c.statement,'Hệ thức tiếp tuyến–cát tuyến','Chứng minh hệ thức bằng hai tam giác đồng dạng rồi mới thay số.',details,`$${c.target}=${fractionLatex(r)}$.`,{topic:'geometry',givens:[`$${t}=${fractionLatex(ta)}$`,`$${c.first}=${fractionLatex(near)}$`],unknowns:[`$${c.target}$ và chứng minh hệ thức`]});
}

function chordsLesson(c:CirclePowerCertificate):ModelLesson|null {
 const p=c.pivot,a=c.first[0]!,b=c.first[1]!,d=c.second[0]!,e=c.second[1]!,r=fraction(BigInt(c.result.n),BigInt(c.result.d));
 const arm=(x:string)=>p+x;
 const details:AlgebraDeduction[]=[
  {title:'Chọn hai tam giác chứa bốn đoạn',explanation:`Xét hai tam giác $${p}${a}${d}$ và $${p}${e}${b}$. Hai góc $\widehat{${a}${p}${d}}$ và $\widehat{${e}${p}${b}}$ là hai góc đối đỉnh nên bằng nhau.`,math:String.raw`\widehat{${a}${p}${d}}=\widehat{${e}${p}${b}}`,reason:'Hai góc đối đỉnh',question:'Cặp góc nào bằng nhau ngay tại giao điểm hai dây?'},
  {title:'Dùng hai góc nội tiếp cùng chắn một cung',explanation:`Vì $${a},${b},${d},${e}$ cùng nằm trên đường tròn, $\widehat{${p}${a}${d}}=\widehat{${b}${a}${d}}$ và $\widehat{${p}${e}${b}}=\widehat{${d}${e}${b}}$. Hai góc $\widehat{${b}${a}${d}}$ và $\widehat{${d}${e}${b}}$ cùng chắn cung $${b}${d}$, nên bằng nhau.`,math:String.raw`\widehat{${p}${a}${d}}=\widehat{${p}${e}${b}}`,reason:'Hai góc nội tiếp cùng chắn một cung',question:'Hai góc nội tiếp này cùng chắn cung nào?'},
  {title:'Suy ra tích hai đoạn trên mỗi dây',explanation:`Hai tam giác $${p}${a}${d}$ và $${p}${e}${b}$ đồng dạng theo góc–góc. Do đó $\dfrac{${arm(a)}}{${arm(e)}}=\dfrac{${arm(d)}}{${arm(b)}}$. Nhân chéo, ta được tích hai đoạn trên dây thứ nhất bằng tích hai đoạn trên dây thứ hai.`,math:String.raw`${arm(a)}\cdot ${arm(b)}=${arm(d)}\cdot ${arm(e)}`,reason:'Tam giác đồng dạng và nhân chéo tỉ lệ',question:'Sau khi nhân chéo, hai tích độ dài nào bằng nhau?'},
  {title:`Thay số và kết luận`,explanation:`Thay ba độ dài đã biết vào hệ thức vừa chứng minh rồi chia cho đoạn đi cùng $${c.target}$. Phép tính chính xác cho $${c.target}=${fractionLatex(r)}$.`,math:String.raw`${c.target}=${fractionLatex(r)}`,reason:'Thay số vào đẳng thức tích và chia cho độ dài dương',question:`Giá trị chính xác của $${c.target}$ là bao nhiêu?`}
 ];
 return algebraProofLesson(c.statement,'Hệ thức hai dây cắt nhau','Chứng minh hai tam giác đồng dạng để suy ra đẳng thức tích, rồi thay số.',details,`$${c.target}=${fractionLatex(r)}$.`,{topic:'geometry',givens:Object.entries(c.givens).map(([s,v])=>`$${s}=${v}$`),unknowns:[`$${c.target}$ và chứng minh hệ thức`]});
}

export function circlePowerLesson(input:string):{lesson:ModelLesson;certificate:CirclePowerCertificate}|null {
 const certificate=circlePowerCertificate(input);if(!certificate||!verifyCirclePowerCertificate(certificate))return null;
 const lesson=certificate.family==='tangent-secant'?tangentLesson(certificate):chordsLesson(certificate);
 return lesson?{lesson,certificate}:null;
}
