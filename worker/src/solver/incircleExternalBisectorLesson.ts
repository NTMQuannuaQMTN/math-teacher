import {normalizeProblemText} from '../../../shared/src/mathText';
import {type ModelLesson} from '../../../shared/src/solution';
import {algebraProofLesson,type AlgebraDeduction} from './algebraProofLesson';

export interface IncircleExternalBisectorCertificate {a:string;b:string;c:string;d:string;e:string;f:string;i:string;l:string;h:string;statement:string}

/** Recognizes the complete construction and only the diameter-circle goal. */
export function incircleExternalBisectorCertificate(input:string):IncircleExternalBisectorCertificate|null {
 const statement=normalizeProblemText(input);
 const plain=statement.replace(/\$/g,'').replace(/\\widehat\s*\{?([A-Z]{3})\}?/g,'góc $1').replace(/\\in/g,'∈').replace(/\\ne/g,'≠').replace(/góc\s+góc/g,'góc').replace(/\s*([∈≠])\s*/g,'$1').replace(/\s+([,.;:])/g,'$1').replace(/\s+/g,' ').trim();
 const sentences=/^(.+?)\. (.+?)\. (.+?)\. (.+?)\.$/u.exec(plain);if(!sentences)return null;
 const one=/^Cho tam giác ([A-Z]{3})$/u.exec(sentences[1]!);
 const two=/^Gọi ([A-Z]),([A-Z]),([A-Z]) là các tiếp điểm của đường tròn \(([A-Z])\) nội tiếp tam giác ([A-Z]{3}) với ([A-Z]{2}),([A-Z]{2}),([A-Z]{2})$/u.exec(sentences[2]!);
 const three=/^Từ chân đường phân giác ngoài ([A-Z]) của góc ([A-Z]{3}) \(([A-Z])∈([A-Z]{2})\), kẻ tiếp tuyến ([A-Z]{2}) đến (?:đường tròn )?\(([A-Z])\) \(([A-Z])∈\(([A-Z])\), ([A-Z])≠([A-Z])\)$/u.exec(sentences[3]!);
 const four=/^Chứng minh (?:rằng )?đường tròn ngoại tiếp tam giác ([A-Z]{3}) đi qua (?:tâm nội tiếp )?([A-Z])$/u.exec(sentences[4]!);
 if(!one||!two||!three||!four)return null;
 const tri=one[1]!,[d,e,f,i,tri2,side1,side2,side3]=two.slice(1) as string[];
 const [l,angle,l2,sideL,tangent,circleI,h,circleI2,h2,neq]=three.slice(1) as string[];
 const [targetTri,targetI]=four.slice(1) as string[];
 const [a,b,c]=[...tri!];
 if(tri2!==tri||side1!==b!+c||side2!==c!+a||side3!==a!+b||angle!==b!+a!+c||l2!==l||sideL!==b!+c||tangent!==l!+h||circleI!==i||h2!==h||circleI2!==i||neq!==d||targetTri!==a!+l!+h||targetI!==i)return null;
 if(new Set([a,b,c,d,e,f,i,l,h]).size!==9)return null;
 return {a:a!,b:b!,c:c!,d:d!,e:e!,f:f!,i:i!,l:l!,h:h!,statement};
}

export function verifyIncircleExternalBisectorCertificate(c:IncircleExternalBisectorCertificate):boolean {
 const fresh=incircleExternalBisectorCertificate(c.statement);
 return !!fresh&&JSON.stringify(fresh)===JSON.stringify(c);
}

export function incircleExternalBisectorLesson(input:string):{lesson:ModelLesson;certificate:IncircleExternalBisectorCertificate}|null {
 const certificate=incircleExternalBisectorCertificate(input);if(!certificate||!verifyIncircleExternalBisectorCertificate(certificate))return null;
 const {a,b,c,i,l,h,statement}=certificate;
 const details:AlgebraDeduction[]=[
  {title:`Chứng minh $${a}${i}\\perp ${a}${l}$`,explanation:`Vì $${i}$ là tâm đường tròn nội tiếp tam giác $${a}${b}${c}$, tia $${a}${i}$ là phân giác trong của góc $${b}${a}${c}$. Theo giả thiết, $${a}${l}$ là phân giác ngoài của chính góc ấy. Hai phân giác trong và ngoài của một góc vuông góc với nhau.`,math:String.raw`${a}${i}\perp ${a}${l}`,reason:'Phân giác trong vuông góc với phân giác ngoài của cùng một góc',question:`Đường thẳng $${a}${i}$ là phân giác nào của góc tại $${a}$?`},
  {title:`Suy ra góc vuông tại $${a}$`,explanation:`Từ $${a}${i}\\perp ${a}${l}$, góc tạo bởi hai tia $${a}${l}$ và $${a}${i}$ là góc vuông.`,math:String.raw`\widehat{${l}${a}${i}}=90^\circ`,reason:'Định nghĩa hai đường thẳng vuông góc',question:`Góc $${l}${a}${i}$ có số đo bao nhiêu?`},
  {title:`Suy ra góc vuông tại tiếp điểm $${h}$`,explanation:`Đường thẳng $${l}${h}$ là tiếp tuyến của đường tròn tâm $${i}$ tại $${h}$. Bán kính $${i}${h}$ vuông góc với tiếp tuyến tại tiếp điểm, nên góc $${l}${h}${i}$ là góc vuông.`,math:String.raw`\widehat{${l}${h}${i}}=90^\circ`,reason:'Bán kính vuông góc với tiếp tuyến tại tiếp điểm',question:`Bán kính nào vuông góc với tiếp tuyến $${l}${h}$?`},
  {title:'Dùng đường tròn đường kính',explanation:`Một điểm $X$ nằm trên đường tròn đường kính $${l}${i}$ khi và chỉ khi $\widehat{${l}X${i}}=90^\circ$. Hai góc vuông ở trên cho thấy cả $${a}$ và $${h}$ đều nằm trên đường tròn đường kính $${l}${i}$. Hiển nhiên $${l},${i}$ là hai đầu đường kính, vì vậy bốn điểm $${a},${l},${h},${i}$ cùng thuộc đường tròn này.`,math:String.raw`\widehat{${l}${a}${i}}=\widehat{${l}${h}${i}}=90^\circ`,reason:'Định lí đảo của góc nội tiếp chắn nửa đường tròn',question:`Hai góc vuông cùng chắn đoạn $${l}${i}$ cho kết luận gì?`},
  {title:'Kết luận đúng yêu cầu',explanation:`Đường tròn qua ba điểm $${a},${l},${h}$ chính là đường tròn đường kính $${l}${i}$ vừa xác định, và đường tròn này chứa $${i}$. Vậy đường tròn ngoại tiếp tam giác $${a}${l}${h}$ đi qua $${i}$.`,math:null,reason:'Ba điểm không thẳng hàng xác định duy nhất một đường tròn',question:'Tâm nội tiếp thuộc đường tròn ngoại tiếp tam giác nào?'}
 ];
 const lesson=algebraProofLesson(statement,'Phân giác trong, phân giác ngoài và đường tròn đường kính','Tạo hai góc vuông cùng chắn đoạn nối chân phân giác ngoài với tâm nội tiếp.',details,`Đường tròn ngoại tiếp tam giác $${a}${l}${h}$ đi qua $${i}$.`,{topic:'geometry',givens:[`$${i}$ là tâm nội tiếp`,`$${a}${l}$ là phân giác ngoài`,`$${l}${h}$ là tiếp tuyến tại $${h}$`],unknowns:[`Chứng minh $${a},${l},${h},${i}$ cùng thuộc một đường tròn`]});
 if(!lesson)return null;
 lesson.steps[3]!.uses=['s2','s3'];lesson.steps[4]!.uses=['s4'];
 return {lesson,certificate};
}
