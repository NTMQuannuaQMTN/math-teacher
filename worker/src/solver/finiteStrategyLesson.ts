import {combinatoricsProofLesson,plainCombinatorics,type CombinatoricsDeduction} from './combinatoricsProofLesson';
interface PilesTask {text:string;a:number;b:number;lastLoses:boolean}
export interface PilesCertificate {task:PilesTask;firstWins:boolean;firstPile:1|2;firstTake:number}
function parsePiles(text:string):PilesTask|null {
 const m=/^Có hai đống sỏi, một đống có (\d+) viên và một đống có (\d+) viên\. Hai người luân phiên chơi; mỗi lượt chọn đúng một đống và lấy một số nguyên dương viên sỏi từ đống đó\. Người lấy viên cuối cùng (thắng|thua)\. Người đi trước có chiến lược thắng không\? Hãy chứng minh\.$/u.exec(plainCombinatorics(text));
 if(!m)return null;const a=Number(m[1]),b=Number(m[2]);if(a<1||b<1||a>100||b>100)return null;return {text,a,b,lastLoses:m[3]==='thua'};
}
export function pilesCertificate(text:string):PilesCertificate|null {
 const task=parsePiles(text);if(!task)return null;const {a,b,lastLoses}=task;
 const firstWins=lastLoses?(a===1&&b===1||a!==b):a!==b;
 let firstPile:1|2=a>=b?1:2,firstTake=Math.abs(a-b);
 if(lastLoses&&Math.min(a,b)===1){firstTake=Math.max(a,b);if(a===b){firstPile=1;firstTake=1;}}
 return {task,firstWins,firstPile,firstTake:firstWins?firstTake:0};
}
/** Independent complete game-state table; every legal subtraction in either pile is considered. */
export function verifyPilesCertificate(c:PilesCertificate):boolean {
 const t=parsePiles(c.task.text);if(!t||JSON.stringify(t)!==JSON.stringify(c.task))return false;
 const w=Array.from({length:t.a+1},()=>Array<boolean>(t.b+1).fill(false));w[0]![0]=t.lastLoses;
 for(let total=1;total<=t.a+t.b;total++)for(let a=0;a<=t.a;a++){
  const b=total-a;if(b<0||b>t.b)continue;
  w[a]![b]=Array.from({length:a},(_,i)=>i).some(x=>!w[x]![b])||Array.from({length:b},(_,i)=>i).some(y=>!w[a]![y]);
 }
 if(w[t.a]![t.b]!==c.firstWins)return false;
 if(!c.firstWins)return c.firstTake===0;
 if(!Number.isInteger(c.firstTake)||c.firstTake<1||![1,2].includes(c.firstPile))return false;
 const a=t.a-(c.firstPile===1?c.firstTake:0),b=t.b-(c.firstPile===2?c.firstTake:0);
 return a>=0&&b>=0&&!w[a]![b];
}
export function twoPilesLesson(text:string){
 const c=pilesCertificate(text);if(!c||!verifyPilesCertificate(c))return null;const {a,b,lastLoses}=c.task;
 const terminal=lastLoses?'Người lấy viên cuối cùng thua. Nếu chỉ còn một viên ở một đống và đống kia hết, người đến lượt buộc lấy viên ấy và thua.':'Người lấy viên cuối cùng thắng. Nếu cả hai đống đã hết thì người đến lượt không còn nước đi và thua.';
 const losing=lastLoses?'Hai đống bằng nhau, mỗi đống ít nhất hai viên, là trạng thái thua. Trạng thái chỉ còn đúng một viên cũng là trạng thái thua.':'Hai đống bằng nhau là trạng thái thua đối với người đến lượt.';
 const response=lastLoses?'Sau nước của đối phương từ hai đống bằng nhau và ít nhất hai viên: nếu đống họ vừa lấy vẫn còn ít nhất hai viên, lấy ở đống kia đúng số viên họ vừa lấy. Nếu họ để lại một viên ở đống vừa lấy, lấy hết đống kia, để họ gặp đúng một viên. Nếu họ lấy hết một đống, ở đống kia lấy tất cả trừ một viên. Các nước này đều lấy số nguyên dương trong đúng một đống.':'Sau mỗi nước của đối phương từ hai đống bằng nhau, lấy ở đống kia đúng số viên họ vừa lấy. Nước này hợp lệ vì trước nước đối phương hai đống bằng nhau. Ta đưa hai đống trở lại bằng nhau; nếu đối phương vừa lấy hết một đống, ta lấy hết đống kia và thắng.';
 const first=c.firstWins?`Lượt đầu lấy $${c.firstTake}$ viên ở đống thứ $${c.firstPile}$, để lại $(${a-(c.firstPile===1?c.firstTake:0)},${b-(c.firstPile===2?c.firstTake:0)})$.`:`Ban đầu hai đống bằng nhau${lastLoses?' và mỗi đống ít nhất hai viên':''}, nên người đi sau dùng quy tắc đáp trả.`;
 const conclusion=`Vậy người đi ${c.firstWins?'trước':'sau'} có chiến lược thắng. ${first}`;
 const steps:CombinatoricsDeduction[]=[
 {title:'Đọc đúng điều kiện kết thúc',explanation:`Mỗi lượt lấy ít nhất một viên trong đúng một đống, không vượt số viên trong đống đó. ${terminal}`,math:null,reason:'Luật chọn một đống và điều kiện thắng/thua',question:'Có được lấy từ cả hai đống trong cùng một lượt không?'},
 {title:'Các vị trí mà đối phương không giữ được lợi thế',explanation:`${losing} ${response} Vì vậy từ vị trí này mọi nước của đối phương đều có một đáp trả hợp lệ đưa họ trở lại vị trí thua hoặc làm họ thua ngay. Đây là lập luận cho mọi lượng lấy, không phải một ván mẫu.`,math:null,reason:'Đối xứng hai đống và xét cả trường hợp đống còn0 hoặc1 viên',question:'Nếu đối phương lấy hết một đống, quy tắc đáp trả còn hợp lệ thế nào?'},
 {title:'Chỉ rõ nước đầu và cách đáp trả về sau',explanation:`${first} ${response} ${lastLoses?'Nếu đã để lại đúng một viên cho đối phương, không cần đáp trả thêm vì họ buộc lấy viên cuối và thua.':''}`,math:null,reason:'Xây dựng nước hợp lệ đưa đối phương vào vị trí thua',question:'Ở đề này lượt đầu cần lấy chính xác bao nhiêu viên ở đống nào?'},
 {title:'Chứng minh kết thúc và xác định người thắng',explanation:`Mỗi lượt giảm tổng số viên ít nhất một, nên ván chơi kết thúc sau hữu hạn lượt. Quy tắc trên luôn hợp lệ khi còn chơi và giữ đối phương ở vị trí thua; không cần dự đoán họ lấy bao nhiêu viên. ${conclusion}`,math:null,reason:'Tổng số viên giảm và mọi phản ứng đã được xét',question:'Vì sao chiến lược không thể dẫn đến một ván kéo dài mãi?'}];
 const lesson=combinatoricsProofLesson(text,'Trò chơi hai đống sỏi','Đưa hai đống về đối xứng và đáp trả mọi nước, chú ý luật viên cuối.',steps,conclusion);return lesson?{lesson,certificate:c}:null;
}

interface SignTask {text:string;n:number;modulus:number}
export interface SignCertificate {task:SignTask;anWins:boolean;anCanWin:boolean[][];policy:('+'|'-'|null)[][]}
const mod=(x:number,m:number)=>(x%m+m)%m;
function parseSigns(text:string):SignTask|null {
 const p=plainCombinatorics(text);
 const m=/^An và Bình luân phiên đặt dấu cộng hoặc dấu trừ trước các số 1, 2, 3, (?:\.\.\.|\\ldots|\\dots), (\d+) theo đúng thứ tự này; An đặt dấu trước số 1\. An thắng nếu tổng có dấu của (?:mười số|các số) chia hết cho (\d+), nếu không Bình thắng\. Ai có chiến lược thắng\? Hãy chứng minh\.$/u.exec(p);
 if(!m)return null;const n=Number(m[1]),modulus=Number(m[2]);if(n<4||n>30||modulus<2||modulus>12||p.includes('mười số')&&n!==10)return null;return {text,n,modulus};
}
export function signCertificate(text:string):SignCertificate|null {
 const task=parseSigns(text);if(!task)return null;const {n,modulus:m}=task;
 const anCanWin=Array.from({length:n+2},()=>Array<boolean>(m).fill(false));anCanWin[n+1]=Array.from({length:m},(_,r)=>r===0);
 for(let t=n;t>=1;t--)for(let r=0;r<m;r++){
  const a=anCanWin[t+1]![mod(r+t,m)]!,b=anCanWin[t+1]![mod(r-t,m)]!;anCanWin[t]![r]=t%2===1?a||b:a&&b;
 }
 const anWins=anCanWin[1]![0]!;const policy=Array.from({length:n+1},()=>Array<'+'|'-'|null>(m).fill(null));
 for(let t=1;t<=n;t++)if((t%2===1)===anWins)for(let r=0;r<m;r++)if(anCanWin[t]![r]===anWins){policy[t]![r]=anCanWin[t+1]![mod(r+t,m)]===anWins?'+':'-';}
 return {task,anWins,anCanWin,policy};
}
/** Independent memoized game-tree recursion checks ALL (turn,residue) states and the selected actions. */
export function verifySignCertificate(c:SignCertificate):boolean {
 const t=parseSigns(c.task.text);if(!t||JSON.stringify(t)!==JSON.stringify(c.task))return false;const {n,modulus:m}=t,memo=new Map<string,boolean>();
 const recurse=(turn:number,r:number):boolean=>{
  if(turn===n+1)return r===0;const key=`${turn}/${r}`;if(memo.has(key))return memo.get(key)!;
  const children=[recurse(turn+1,mod(r+turn,m)),recurse(turn+1,mod(r-turn,m))];const result=turn%2===1?children.some(Boolean):children.every(Boolean);memo.set(key,result);return result;
 };
 if(c.anCanWin.length!==n+2||c.policy.length!==n+1||c.anWins!==recurse(1,0)||c.anCanWin.some(row=>row.length!==m||row.some(v=>typeof v!=='boolean'))||c.policy.some(row=>row.length!==m))return false;
 for(let turn=1;turn<=n+1;turn++)for(let r=0;r<m;r++){
  if(c.anCanWin[turn]?.[r]!==recurse(turn,r))return false;
  if(turn<=n&&((turn%2===1)!==c.anWins||recurse(turn,r)!==c.anWins)&&c.policy[turn]?.[r]!==null)return false;
  if(turn<=n&&(turn%2===1)===c.anWins&&recurse(turn,r)===c.anWins){const action=c.policy[turn]?.[r];if(action!=='+'&&action!=='-'||recurse(turn+1,mod(r+(action==='+'?turn:-turn),m))!==c.anWins)return false;}
 }
 return true;
}
export function signGameLesson(text:string){
 const c=signCertificate(text);if(!c||!verifySignCertificate(c))return null;const {n,modulus:m}=c.task,winner=c.anWins?'An':'Bình';
 const simple=!c.anWins&&n%2===0&&mod(2*n,m)!==0;
 const rows=simple?[n]:Array.from({length:n},(_,i)=>i+1).filter(t=>(t%2===1)===c.anWins);
 const table='\\begin{array}{c|c|c}t&R_+&R_-\\\\\\hline '+rows.map(t=>{
  const plus:number[]=[],minus:number[]=[];for(let r=0;r<m;r++){
   const sign=simple?(mod(r+n,m)!==0?'+':'-'):c.policy[t]![r];if(sign==='+' )plus.push(r);if(sign==='-')minus.push(r);
  }
  return `${t}&${plus.length?plus.join(', '):'\\varnothing'}&${minus.length?minus.join(', '):'\\varnothing'}`;
 }).join('\\\\')+'\\end{array}';
 const conclusion=`Vậy ${winner} có chiến lược thắng với quy tắc đặt dấu đã nêu, dù đối phương chọn dấu thế nào.`;
 const steps:CombinatoricsDeduction[]=[
 {title:'Theo dõi số dư và người đến lượt',explanation:`Trước khi đặt dấu cho số $t$, gọi $r$ là số dư của tổng đã đặt khi chia cho $${m}$, với $0\\le r<${m}$. Đặt cộng cho số $t$ làm số dư thành số dư của $r+t$; đặt trừ làm số dư thành số dư của $r-t$. An chọn ở lượt lẻ, Bình ở lượt chẵn. Khi đủ $${n}$ dấu, An thắng đúng khi số dư bằng $0$.`,math:null,reason:'Số dư của tổng và thứ tự đặt dấu đã cho',question:'Đặt một dấu cộng hoặc trừ thay đổi số dư theo công thức nào?'},
 {title:simple?'Bình kiểm soát dấu cuối':'Phân loại bằng mọi lựa chọn còn lại',explanation:simple?`Bình đặt dấu cho số cuối $${n}$. Hai số dư cuối của $r+${n}$ và $r-${n}$ khác nhau vì hiệu $${2*n}$ không chia hết cho $${m}$. Vì vậy chúng không thể cùng bằng $0$: Bình luôn có một dấu làm tổng không chia hết cho $${m}$. Lập luận đúng với mọi tổng trước lượt cuối.`:`Xét từ lượt cuối ngược về lượt đầu. Ở lượt An, một số dư có thể bảo đảm An thắng khi ít nhất một trong hai dấu dẫn đến một vị trí bảo đảm An thắng. Ở lượt Bình, An chỉ bảo đảm thắng khi cả hai dấu đều dẫn đến vị trí như vậy. Điều kiện cuối là số dư $0$. Xét mọi số dư $0,\\ldots,${m-1}$ ở từng lượt theo quy tắc này, trạng thái ban đầu lượt$1$, số dư$0$ cho thấy ${winner} bảo đảm thắng. Bảng sau cho dấu cụ thể ở tất cả vị trí thuộc chiến lược đó.`,math:null,reason:simple?'Hai số dư khác nhau không thể cùng bằng0':'Xét hết hai dấu của đối phương, suy ngược trên số lượt hữu hạn',question:'Vì sao phải xét cả hai dấu mà đối phương có thể chọn?'},
 {title:'Quy tắc chọn dấu thực hiện được',explanation:`Trong bảng, $R_+$ là các số dư trước lượt $t$ mà ${winner} đặt cộng; $R_-$ là các số dư mà đặt trừ. ${simple?'Ở các lượt trước lượt cuối, Bình cứ đặt cộng; tới lượt cuối tính số dư của tổng trước đó rồi theo hàng dưới.':`${winner} tính số dư hiện tại trước lượt của mình rồi theo đúng hàng tương ứng. Những số dư không có trong hàng không thể xuất hiện nếu đã giữ chiến lược từ đầu; mọi dấu của đối phương vẫn đưa tới một vị trí có quy tắc. ${c.anWins?`Lượt đầu An đặt ${c.policy[1]![0]==='+'?'cộng':'trừ'} trước số1.`:'Lượt đầu An có thể đặt dấu nào; Bình tính số dư sau dấu đó để chọn ở lượt2.'}`}`,math:table,reason:'Nêu dấu cụ thể theo số dư, không chỉ khẳng định tồn tại dấu',question:'Nếu đối phương đổi dấu ở lượt của họ, bạn tính lại số dư và chọn dấu nào?'},
 {title:'Bảo đảm cho mọi phản ứng và kết thúc',explanation:simple?`Dấu của Bình ở lượt cuối chỉ phụ thuộc số dư hiện tại, không giả sử các dấu trước đó. Theo hàng cuối, mọi số dư đều có một lựa chọn làm số dư cuối khác$0$. Trò chơi kết thúc sau đúng$${n}$ lượt. ${conclusion}`:`Ở lượt của ${winner}, dấu trong bảng giữ vị trí bảo đảm người đó thắng. Ở lượt của đối phương, cả hai dấu đều giữ một vị trí như vậy, theo quy tắc phân loại. Bắt đầu từ lượt 1, số dư 0 rồi lặp lập luận qua mỗi lượt, tới lượt$${n+1}$ điều kiện thắng của ${winner} được thỏa. Có đúng$${n}$ dấu nên quá trình kết thúc. ${conclusion}`,math:null,reason:'Duy trì trạng thái bảo đảm thắng qua mọi dấu đối phương và hết số lượt',question:'Chiến lược có cần đối phương hợp tác chọn một dấu định sẵn không?'}];
 if(!simple){
  const classification:CombinatoricsDeduction[]=[];
  const turns=Array.from({length:n+1},(_,i)=>n+1-i);
  for(let start=0;start<turns.length;start+=8){
   const chunk=turns.slice(start,start+8);
   const table='\\begin{array}{c|l}t&A_t\\\\\\hline '+chunk.map(t=>{
    const residues=c.anCanWin[t]!.flatMap((w,r)=>w?[r]:[]);
    return `${t}&${residues.length?'\\{'+residues.join(', ')+'\\}':'\\varnothing'}`;
   }).join('\\\\')+'\\end{array}';
   classification.push({title:`Các số dư bảo đảm An thắng trước lượt $${chunk.at(-1)}$ đến $${chunk[0]}$`,explanation:`Gọi $A_t$ là tập số dư trước lượt $t$ mà An có thể bảo đảm thắng. Khởi đầu tính ngược từ $A_{${n+1}}=\\{0\\}$. Với mỗi $r=0,\\ldots,${m-1}$, tính số dư không âm của $r+t$ và $r-t$ khi chia cho $${m}$. Nếu $t$ lẻ, ghi $r$ vào $A_t$ khi ít nhất một trong hai số dư ấy thuộc $A_{t+1}$. Nếu $t$ chẵn, chỉ ghi khi cả hai đều thuộc $A_{t+1}$. Bảng theo thứ tự từ lượt sau về lượt trước; vì đã có tập ở dòng trước, từng dòng được xác định bằng hai phép tính cho mỗi số dư. Tập rỗng nghĩa là không số dư nào bảo đảm An thắng tại lượt đó.`,math:table,reason:'Điều kiện cuối và xét đủ hai dấu: An cần một lựa chọn, Bình có thể chọn bất kỳ lựa chọn nào',question:'Từ tập ở lượt sau, ở lượt của An cần một hay cả hai dấu đưa vào tập đó?'});
  }
  steps.splice(2,0,...classification);
 }
 const lesson=combinatoricsProofLesson(text,'Trò chơi đặt dấu và số dư','Theo dõi tổng theo số dư; cho quy tắc dấu và chứng minh với mọi phản ứng.',steps,conclusion);return lesson?{lesson,certificate:c}:null;
}
