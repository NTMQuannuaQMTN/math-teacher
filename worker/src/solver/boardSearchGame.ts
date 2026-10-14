import {LEARNED_TWO_BY_NINE_FOUR} from './learnedBoardPolicy';
import {ModelLessonSchema,type ModelLesson} from '../../../shared/src/solution';
import {parseHiddenBoardQuestion} from '../../../shared/src/hiddenBoardQuestion';
export interface BoardSearchCertificate {columns:number;queries:number[][];survivors:number[]}
const neighbors=(cell:number,n:number):number[]=>{
 const row=Math.floor(cell/n),col=cell%n,out=[(1-row)*n+col];
 if(col>0)out.push(cell-1);if(col<n-1)out.push(cell+1);return out;
};
/** A belief set includes every surviving adversarial path, with no stochastic assumptions. */
export function boardSearchCertificate(columns:number,k:2|4):BoardSearchCertificate {
 if(!Number.isInteger(columns)||columns<2||columns>50)throw Error('unsupported board');
 const queries:number[][]=columns===9&&k===4?LEARNED_TWO_BY_NINE_FOUR.map(q=>[...q]):[],length=columns-1;
 if(!queries.length)for(let phase=0;phase<(k===4?1:2);phase++)for(let j=0;j<length;j++) {
  const color=phase===0?j%2:(length+j+1)%2;
  const query:number[]=[];
  for(let row=0;row<2;row++)for(const col of [j,j+1])if(k===4||(row+col)%2===color)query.push(row*columns+col);
  queries.push(query);
 }
 let possible=new Set(Array.from({length:2*columns},(_,i)=>i));const survivors:number[]=[];
 for(const query of queries){possible=new Set([...possible].flatMap(c=>neighbors(c,columns)).filter(c=>!query.includes(c)));survivors.push(possible.size);}
 return {columns,queries,survivors};
}
/** Independently enumerate destination cells and predecessors, rechecking every legal movement. */
export function verifyBoardSearch(c:BoardSearchCertificate,k:2|4):boolean {
 const n=c.columns;
 if(!Number.isInteger(n)||n<2||n>50||(c.queries.length<1||c.queries.length>(k===4?1:2)*(n-1))||c.survivors.length!==c.queries.length)return false;
 let possible=Array.from({length:2*n},()=>true);
 for(let t=0;t<c.queries.length;t++){
  const query=c.queries[t]!;
  if(query.length!==k||new Set(query).size!==k||query.some(q=>!Number.isInteger(q)||q<0||q>=2*n))return false;
  const next=Array.from({length:2*n},()=>false);
  for(let dest=0;dest<2*n;dest++)if(!query.includes(dest))for(let src=0;src<2*n;src++){
   if(possible[src]&&Math.abs(Math.floor(dest/n)-Math.floor(src/n))+Math.abs(dest%n-src%n)===1)next[dest]=true;
  }
  if(next.filter(Boolean).length!==c.survivors[t])return false;
  possible=next;
 }
 return !possible.some(Boolean);
}
/** Exact stated rules only. Staying still, diagonal movement, wrapping edges and different interrogation rules are declined. */
export function boardSearchLesson(text:string):{lesson:ModelLesson;certificates:BoardSearchCertificate[]}|null {
 const task=parseHiddenBoardQuestion(text);if(!task)return null;
 const n=task.columns,length=n-1,official=task.official;
 const certificates=([4,2] as const).map(k=>boardSearchCertificate(n,k));
 if(!certificates.every((c,i)=>verifyBoardSearch(c,i===0?4:2)))return null;
 const firstRow=(length+1)%2===1?2:1,otherRow=3-firstRow;
 const queryTable=(certificate:BoardSearchCertificate,start:number,end:number)=>{
  const indices=Array.from({length:end-start},(_,i)=>start+i);
  const shown=indices.length<=12?indices:[...indices.slice(0,4),-1,...indices.slice(-4)];
  return '\\begin{array}{c|l}t&Q_t\\\\\\hline '+shown.map(i=>i<0?'\\vdots&\\vdots':`${i+1}&${certificate.queries[i]!.map(cell=>`(${Math.floor(cell/n)+1},${cell%n+1})`).join(', ')}`).join('\\\\')+'\\end{array}';
 };

 const details:{title:string;explanation:string;math:string|null;reason:string;question:string}[]=[
  {title:'Đánh số ô và xác định khi nào phát hiện An',explanation:`Gọi ô ở hàng $r$, cột $c$ là $(r,c)$, với $r=1,2$ và $1\\le c\\le${n}$. Hai ô kề bên có chung một cạnh. Mỗi lượt An di chuyển đúng một lần trước, rồi Bình hỏi $k$ ô về cùng vị trí hiện tại của An; An không di chuyển giữa các câu hỏi trong một lượt. An phải trả lời đúng; Bình thắng khi trong các ô hỏi có ô An đang đứng. Nếu đề quy ước hỏi lần đầu ngay sau khi An chọn ô ban đầu, chiến lược cũng giữ nguyên: lượt đầu chỉ cần vị trí bất kỳ, còn giữa hai lần hỏi An vẫn phải đi đúng một bước. Bình không cần biết ô ban đầu hay đoán nước đi của An.`,math:null,reason:'Dùng đúng luật di chuyển kề cạnh và phát hiện vị trí',question:'Một bước sang ô kề cạnh có thể đổi cột nhiều hơn một đơn vị không?'},
  {title:'a) Các ô Bình hỏi khi $k=4$',explanation:`Đây là lịch hỏi cụ thể, không phụ thuộc vị trí hay nước đi của An. $t$ là số lượt, $Q_t$ là tập các ô hỏi sau khi An di chuyển ở lượt đó. Mỗi tọa độ là (hàng,cột); nếu đã tìm thấy An thì dừng. Các lượt giữa dấu ba chấm, nếu có, dùng đúng công thức sau. Ở lượt $t$, hỏi cả hai hàng của hai cột $t,t+1$.`,math:queryTable(certificates[0]!,0,certificates[0]!.queries.length),reason:'Chỉ rõ bốn ô khác nhau ở từng lượt; không cần đoán đối phương',question:'Ở lượt $1$, Bình hỏi chính xác những ô nào khi $k=4$?'},
 {title:'a) Chứng minh quét hai cột bắt được mọi đường đi',explanation:`Ở lượt $j=1,2,\\ldots,${length}$, Bình hỏi cả bốn ô của cột $j$ và $j+1$. Nếu An chưa bị phát hiện sau lượt đầu thì An ở cột ít nhất $3$. Giả sử sau lượt $j-1$, An ở cột ít nhất $j+1$; bước tiếp theo chỉ có thể đưa An về cột ít nhất $j$. Hai cột $j,j+1$ đều được hỏi, nên nếu vẫn thoát thì An phải ở cột ít nhất $j+2$. Đây là suy luận cho mọi nước đi, kể cả đi dọc. Sau lượt $${length}$, muốn thoát An phải ở cột ít nhất $${n+1}$, không tồn tại. Vậy $k=4$ bảo đảm thắng sau không quá $${length}$ lượt.`,math:null,reason:'Suy luận lần lượt: vị trí còn có thể đứng luôn ở bên phải vùng đã quét',question:'Sau khi hỏi cả hai cột đầu, nếu An chưa bị phát hiện thì An chỉ có thể ở phía nào?'},
  {title:'b) Mỗi bước đổi màu bàn cờ',explanation:'Tô màu ô theo tính chẵn lẻ của $r+c$. Đi ngang hoặc đi dọc đều đổi màu. Vì An buộc phải đi ở mỗi lượt, biết màu ở một lượt sẽ biết màu ở mọi lượt sau. Trong hai cột kề nhau có đúng hai ô của mỗi màu. Ta có thể dùng hai câu hỏi để kiểm tra toàn bộ một màu trong vùng hai cột.',math:null,reason:'Tính chẵn lẻ đổi sau mỗi bước sang ô chung cạnh',question:'Nếu An đang ở ô có tổng hàng và cột chẵn, sau một bước tổng đó chẵn hay lẻ?'},
  {title:'b) Lịch hỏi hai ô trong lần quét đầu',explanation:`Ở lượt $t=1,\\ldots,${length}$, hỏi $(1,t)$ và $(2,t+1)$ theo bảng. Hai ô có cùng màu vì tổng hàng và cột là $t+1$ và $t+3$; sang lượt sau, màu được hỏi đổi. Không biết An ở đâu vẫn làm đúng bảng này.`,math:queryTable(certificates[1]!,0,length),reason:'Cho lịch hỏi thực hiện được và chứng minh hai ô mỗi lượt cùng màu',question:'Hai tọa độ trong mỗi hàng của bảng có tổng hàng và cột cùng tính chẵn lẻ không?'},
 {title:'Quét lần đầu để loại một khả năng về màu',explanation:`Trong $${length}$ lượt đầu, ở lượt $j$ hỏi $(1,j)$ và $(2,j+1)$. Màu của hai ô được hỏi đổi đúng như màu của An sau mỗi bước. Nếu màu của An ở lượt đầu trùng màu được hỏi, thì ở mọi lượt sau cũng trùng. Đối với trường hợp màu này, hai câu hỏi đã kiểm tra mọi ô An có thể đứng trong hai cột đang quét. Sau lượt đầu, nếu chưa trúng thì cột của An ít nhất là 3. Nếu sau lượt $j-1$ cột ít nhất là $j+1$, bước đi tiếp theo cho cột ít nhất là $j$; vì hai ô đúng màu ở cột $j,j+1$ đều được hỏi, muốn thoát phải có cột ít nhất là $j+2$. Sau lượt cuối phải có cột lớn hơn số cột của bảng, không tồn tại; nên An sẽ bị phát hiện trong lượt $${length}$ hoặc sớm hơn. Nếu An vẫn chưa bị phát hiện thì màu của An ở lượt đầu phải là màu còn lại.`,math:null,reason:'Phân hai khả năng về màu, quét một khả năng mà không bỏ sót nước đi',question:'Vì sao hỏi hai ô cùng màu đủ thay cho bốn ô khi đã biết màu của An?'},
  {title:'b) Lịch hỏi lần hai và màu tại lượt chuyển',explanation:`Nếu qua lượt $${length}$ chưa thắng, tiếp tục theo bảng sau. Ở lượt đầu của lần quét cũ, màu hỏi có tổng hàng và cột chẵn, nên An khi đó phải ở màu lẻ. Sau $${length}$ bước giữa lượt $1$ và lượt $${length+1}$, màu của An có tính chẵn lẻ giống $1+${length}$. Vì vậy cặp $(${firstRow},1),(${otherRow},2)$ ở lượt $${length+1}$ có đúng màu An. Cả lịch hỏi và An đều đổi màu sau mỗi bước, nên mọi hàng tiếp theo vẫn hỏi đúng màu.`,math:queryTable(certificates[1]!,length,2*length),reason:'Tính màu theo số bước thực sự giữa hai lượt; không lặp sai màu quét trước',question:`Giữa lượt $1$ và lượt $${length+1}$ có bao nhiêu bước đổi màu?`},
 {title:'Quét lại với màu đã được xác định',explanation:`Nếu chưa thắng, từ lượt $${length+1}$ ta biết chắc màu của An: đó là màu đối lập với màu mà lần quét cũ sẽ kiểm tra ở lượt này. Quét lại từ trái sang phải trong $${length}$ lượt: ở lượt $${length}+j$ hỏi $(${firstRow},j)$ và $(${otherRow},j+1)$, với $j=1,\\ldots,${length}$. Hai ô này luôn có đúng màu hiện tại của An. Vị trí An lúc bắt đầu lần quét thứ hai có thể bất kỳ; sau lần hỏi đầu, nếu chưa trúng thì cột ít nhất là 3. Ở lượt thứ $j$ của lần quét này, từ cột ít nhất $j+1$ sau lượt trước, An chỉ có thể đi về cột ít nhất $j$; hai cột $j,j+1$ đã được hỏi đầy đủ với màu của An, nên nếu thoát thì cột ít nhất là $j+2$. Sau lượt cuối phải đứng ngoài bảng, không thể xảy ra. Vậy $k=2$ bảo đảm thắng sau không quá $${2*length}$ lượt; cùng với câu a, ta được cả hai kết luận cần chứng minh.`,math:null,reason:'Nếu lần đầu chưa bắt được thì màu đã biết; lần quét thứ hai kiểm tra đúng màu ở mọi lượt',question:'Nếu lần quét đầu không bắt được An, ta đã biết thêm điều gì để chọn hai ô trong lần quét sau?'},
 ];
 if(n===9){
  details[1]={title:'a) Lịch hỏi cụ thể với $k=4$',explanation:'Bình hỏi đúng bốn ô trong mỗi hàng của bảng sau, theo thứ tự từ lượt 1 đến lượt 6. Nếu phát hiện An thì dừng. Nếu An trả lời không, tiếp tục sang hàng kế tiếp; lịch này không phụ thuộc vị trí ban đầu hoặc nước đi của An. Ta sẽ kiểm tra từng lượt để chứng minh không còn đường thoát sau lượt 6.',math:queryTable(certificates[0]!,0,6),reason:'Một lịch hỏi rõ ràng, kiểm tra được cho mọi nước đi',question:'Bạn có thể đọc bốn tọa độ phải hỏi ở lượt đầu từ bảng không?'};
  const grid=(cells:number[])=>'\\begin{array}{c|'+('c'.repeat(n))+'} &'+Array.from({length:n},(_,i)=>i+1).join('&')+'\\\\\\hline '+[0,1].map(row=>`${row+1}&`+Array.from({length:n},(_,col)=>cells.includes(row*n+col)?'\\circ':'-').join('&')).join('\\\\')+'\\end{array}';
  let possible=Array.from({length:2*n},(_,i)=>i);
  const checks=certificates[0]!.queries.map((query,t)=>{
   const before=[...possible],moved=[...new Set(before.flatMap(c=>neighbors(c,n)))].sort((a,b)=>a-b);
   possible=moved.filter(c=>!query.includes(c));
   const explanation=t===0?'Trước lượt đầu, An có thể ở bất kỳ ô nào. Mỗi ô đều có một ô kề bên, nên sau bước di chuyển đầu tiên cả 18 ô vẫn có thể là vị trí An. Loại đúng bốn ô Bình hỏi ở lượt 1; các ô còn lại được ghi ở dòng thứ hai.':`Bắt đầu từ từng ô còn có thể đứng sau lượt $${t}$. Từ mỗi ô, liệt kê ô khác hàng cùng cột và ô cùng hàng ở cột liền trước hoặc liền sau nếu cột đó tồn tại. Hợp các vị trí đến được là dòng đầu; loại những ô nằm trong bốn ô hỏi ở lượt này, ta được dòng thứ hai. Một đường đi chưa bị phát hiện phải kết thúc ở một trong các ô còn lại đó.`;
   return {title:`a) Kiểm tra mọi nước đi ở lượt $${t+1}$`,explanation:explanation+' Ký hiệu $D$ là bảng sau khi đi, $C$ là bảng sau khi hỏi. Hàng đầu ghi số cột, cột đầu ghi số hàng; vòng tròn đánh dấu ô còn có thể đứng, dấu gạch là ô đã bị loại. Đọc từng ô theo tọa độ (hàng,cột).'+(possible.length?` Còn $${possible.length}$ vị trí có thể đứng, nên tiếp tục hỏi theo bảng.`:' Không còn ô nào có thể đứng nếu chưa bị phát hiện. Vậy mọi đường đi của An đều bị phát hiện trong không quá 6 lượt, và $6\\le8$, nên yêu cầu câu a được chứng minh.'),math:`\\begin{gathered}D_{${t+1}}:\\quad ${grid(moved)}\\\\C_{${t+1}}:\\quad ${grid(possible)}\\end{gathered}`,reason:'Liệt kê tất cả ô kề cạnh; loại vị trí đã được hỏi nếu An trả lời không',question:`Ở lượt $${t+1}$, từ các vị trí còn lại của lượt trước An có thể đi đến những ô nào?`};
  });
  details.splice(2,1,...checks);
 }
 const conclusion=`Bình có chiến lược thắng sau không quá $${certificates[0]!.queries.length}$ lượt với $k=4$ và $${2*length}$ lượt với $k=2$.`;
 const lesson={analysis:{statement:text,language:'vi',topic:'combinatorics',subtopic:'Tìm vị trí trên bàn cờ bằng tính chẵn lẻ',gradeLevel:9,withinCurriculum:true,concepts:['Tính chẵn lẻ','Chiến lược cho mọi nước đi'],techniques:['invariant'],givens:[`Bàn cờ $2\\times${n}$.`,'An buộc di chuyển sang ô chung cạnh mỗi lượt.'],unknowns:['Chiến lược của Bình'],constraints:['Không đứng yên, không đi chéo; ô kề bên có chung cạnh.'],status:'solvable',statusReason:null,interpretationNotes:official?['Đọc các lỗi gõ “nguyên đường”, “kế bến nếu chứng”, “kô” lần lượt là “nguyên dương”, “kề bên nếu chúng”, “k ô”; giữ nguyên luật An phải đi trước rồi Bình hỏi.']:[]},strategy:n===9?'Với bốn câu hỏi, dùng lịch sáu lượt và kiểm tra toàn bộ vị trí còn có thể đứng sau từng lượt. Với hai câu hỏi, quét hai cột theo màu bàn cờ trong hai lần.':'Quét hai cột từ trái sang phải; khi chỉ được hỏi hai ô, dùng màu bàn cờ và hai lần quét.',hints:details.filter((_,i)=>details.length<=8||[0,1,2,5,7,9,11,details.length-1].includes(i)).map((d,i)=>({id:`h${i+1}`,level:Math.min(i+1,4) as 1|2|3|4,question:d.question,cue:d.reason,explanation:d.explanation,math:d.math,stepId:`s${details.indexOf(d)+1}`,focus:[]})),steps:details.map((d,i)=>({id:`s${i+1}`,title:d.title,explanation:d.explanation,math:d.math,reason:d.reason,uses:i?[`s${i}`]:[],geometryActions:[]})),finalAnswer:{text:conclusion,math:null},answerChecks:[],figure:null} satisfies ModelLesson;
 const gamePlans=certificates.map((c,i)=>({rows:2 as const,columns:n,k:(i===0?4:2) as 2|4,queries:c.queries.map(q=>q.map(cell=>[Math.floor(cell/n)+1,cell%n+1] as [number,number]))}));
 const parsed=ModelLessonSchema.safeParse({...lesson,gamePlans});return parsed.success?{lesson:parsed.data,certificates}:null;
}
