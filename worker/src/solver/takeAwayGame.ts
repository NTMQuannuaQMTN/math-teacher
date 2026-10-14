import { ModelLessonSchema, type ModelLesson } from '../../../shared/src/solution';

export interface TakeAwayGame { stones:number; moves:number[]; lastLoses:boolean }
export interface GameCertificate extends TakeAwayGame { winning:boolean[]; move:(number|null)[] }

/** Every edge decreases n: a finite, acyclic game with no probabilistic opponent assumptions. */
export function solveTakeAway(game:TakeAwayGame):GameCertificate {
  if (!Number.isInteger(game.stones)||game.stones<1||game.stones>200||!game.moves.length||
    game.moves.some(m=>!Number.isInteger(m)||m<1||m>12)) throw Error('unsupported finite game');
  const winning=[game.lastLoses],move:(number|null)[]=[null];
  for(let n=1;n<=game.stones;n++){
    const choice=game.moves.find(m=>m<=n && !winning[n-m]);
    winning[n]=choice!==undefined;move[n]=choice??null;
  }
  return {...game,winning,move};
}

/** Recheck the entire certificate against all legal replies, not just one sample play. */
export function verifyGameCertificate(c:GameCertificate):boolean {
  if(!Number.isInteger(c.stones)||c.stones<1||c.stones>200||!c.moves.length||c.moves.some(m=>!Number.isInteger(m)||m<1||m>12))return false;
  if(c.winning.length!==c.stones+1||c.move.length!==c.stones+1||c.winning[0]!==c.lastLoses)return false;
  for(let n=1;n<=c.stones;n++){
    const legal=c.moves.filter(m=>m<=n);
    const canWin=legal.some(m=>c.winning[n-m]===false);
    if(c.winning[n]!==canWin)return false;
    if(canWin && (c.move[n]===null||!legal.includes(c.move[n]!)||c.winning[n-c.move[n]!]!==false))return false;
    if(!canWin && c.move[n]!==null)return false;
  }
  return true;
}

/** Exact grammar: no extra rules, other piles, passes or ambiguous terminal conventions are guessed. */
export function parseTakeAway(text:string):TakeAwayGame|null {
  const plain=text.replace(/\$/g,'').trim();
  const match=/^Có (\d+) viên sỏi\. Hai người chơi luân phiên, mỗi lượt lấy (.+?) viên sỏi\. (Người lấy viên sỏi cuối cùng (thắng|thua)|Ai không lấy được viên nào thì thua)\. (?:Ai có chiến lược thắng|Người đi trước có chiến lược thắng không)\? Hãy chứng minh\.$/iu.exec(plain);
  if(!match)return null;
  const range=/^từ 1 đến (\d+)$/.exec(match[2]!);
  let moves:number[];
  if(range){const k=Number(range[1]);if(k<1||k>12)return null;moves=Array.from({length:k},(_,i)=>i+1);}
  else {
    const choices=match[2]!.replace(/ hoặc | và /g,',');
    if(!/^\d+(?:\s*,\s*\d+)*$/.test(choices))return null;
    moves=[...new Set(choices.split(',').map(Number))].sort((a,b)=>a-b);
  }
  const stones=Number(match[1]);
  if(!Number.isInteger(stones)||stones<1||stones>200||moves.some(m=>m<1||m>12))return null;
  if(!moves.includes(1)&&match[3]!== 'Ai không lấy được viên nào thì thua')return null;
  return {stones,moves,lastLoses:match[4]==='thua'};
}

export function takeAwayLesson(text:string):{lesson:ModelLesson;certificate:GameCertificate}|null {
  const game=parseTakeAway(text);if(!game)return null;
  const certificate=solveTakeAway(game);if(!verifyGameCertificate(certificate))return null;
  const {stones:n,moves,lastLoses}=game,firstWins=certificate.winning[n]!;
  const losing=Array.from({length:n},(_,i)=>i+1).filter(k=>!certificate.winning[k]);
  const terminal=lastLoses
    ? 'Lấy hết số sỏi là thua ngay, nên nước đi này không thể là nước thắng. Vì được lấy một viên, nếu còn sỏi thì luôn có nước hợp lệ.'
    : 'Khi không còn sỏi hoặc không còn nước đi hợp lệ, người đang đến lượt thua. Người vừa lấy hết sỏi thắng.';
  const conclusion=firstWins
    ? `Vậy người đi trước có chiến lược thắng: lượt đầu lấy $${certificate.move[n]}$ viên; các lượt sau luôn đưa đối phương vào một trạng thái thua như đã phân loại.`
    : 'Vậy người đi sau có chiến lược thắng: sau mỗi nước hợp lệ của người đi trước, chọn một nước đưa người đó trở lại trạng thái thua; không cần giả sử đối phương chơi theo một cách cố định.';
  let details:[{title:string;explanation:string;math:string|null;reason:string;question:string},...{title:string;explanation:string;math:string|null;reason:string;question:string}[]]=[
    {title:'Xác định luật và điều kiện kết thúc',explanation:`Mỗi lượt chỉ được lấy một trong các số $${moves.join(', ')}$, không nhiều hơn số sỏi còn lại. ${terminal}`,math:null,reason:'Đọc đúng luật chơi, phân biệt lấy viên cuối cùng thắng và thua',question:'Ai thắng khi viên sỏi cuối cùng bị lấy? Có được lấy nhiều hơn số còn lại không?'},
    {title:'Phân loại từ các trường hợp nhỏ',explanation:'Gọi một trạng thái thắng nếu người đến lượt có thể bảo đảm thắng, dù đối phương chọn nước nào. Một trạng thái thua là trạng thái mà mọi nước hợp lệ đều nhường cho đối phương một trạng thái thắng. Vì mỗi lượt giảm số sỏi, ta xét lần lượt từ ít sỏi đến nhiều sỏi. Trạng thái có nước đến một trạng thái thua là thắng; nếu không có nước như vậy thì là thua. Lập luận này chứng minh đầy đủ bằng cách xét mọi nước, không phải chỉ chơi thử một ván.',math:null,reason:'Xét hết các nước hợp lệ và suy luận từ số sỏi nhỏ hơn',question:'Vì sao chỉ tìm được một ván thắng chưa đủ để chứng minh có chiến lược thắng?'},
    {title:'Áp dụng cho mọi trạng thái đến đề bài',explanation:`Áp dụng quy tắc trên cho từng số sỏi từ $1$ đến $${n}$, các trạng thái thua là $${losing.join(', ') || '\\varnothing'}$. Với $${n}$ viên, đây là trạng thái ${firstWins?'thắng':'thua'}. Các trạng thái còn lại đều có ít nhất một nước đưa về một trạng thái thua. Toàn bộ bảng đã được kiểm tra với mọi số lượng được phép lấy.`,math:null,reason:'Phạm vi hữu hạn vì số sỏi giảm sau mỗi lượt',question:'Sau nước đầu, bạn muốn đối phương gặp một trạng thái thắng hay thua?'},
    {title:'Chọn nước đi và chứng minh chiến lược',explanation:`${firstWins?`Lấy $${certificate.move[n]}$ viên, còn $${n-certificate.move[n]!}$ viên ở trạng thái thua.`:`Ban đầu $${n}$ là trạng thái thua, nên mọi nước hợp lệ của người đi trước đều đưa người đi sau vào một trạng thái thắng.`} Nếu đối phương lấy viên cuối cùng trong luật lấy hết thì thua, đối phương thua ngay. Nếu ván chơi còn tiếp tục, đối phương đi từ một trạng thái thua thì chỉ có thể đưa ta đến trạng thái thắng; ta chọn nước cụ thể như sau: với $s$ viên còn lại, thử các số được phép lấy theo thứ tự tăng; chọn số đầu tiên $m$ thỏa $m\\le s$ và $s-m$ thuộc danh sách trạng thái thua ở bước trước. Trong luật lấy hết thì thắng, tính cả $0$ là trạng thái thua; trong luật lấy hết thì thua, không chọn nước làm còn $0$. Quy tắc phân loại đã chứng minh luôn có một số như vậy ở trạng thái thắng, nên đây là cách chọn thực hiện được, không phải yêu cầu đoán. Số sỏi giảm nên quá trình kết thúc, và luật kết thúc ở bước đầu bảo đảm người giữ chiến lược thắng. ${conclusion}`,math:null,reason:'Bảo đảm đối với mọi phản ứng của đối phương và chứng minh kết thúc',question:'Chiến lược có còn đúng nếu đối phương chọn một nước khác không?'},
  ];
  if(moves.every((v,i)=>v===i+1)){
    const block=moves.length+1,target=lastLoses?1:0;
    const initial=firstWins?`Lượt đầu lấy $${certificate.move[n]}$ viên, còn $${n-certificate.move[n]!}$ viên.`:`Ban đầu $${n}$ viên thuộc lớp thua; người đi sau đáp trả theo quy tắc dưới.`;
    const pattern=target?`${block}q+1`:`${block}q`;
    const result=firstWins?'trước':'sau';
    details=[
      {title:'Xác định luật và lớp số cần giữ',explanation:`Mỗi lượt được lấy từ1 đến$${moves.length}$ viên, không vượt số còn lại. ${terminal} Ta sẽ để đối phương gặp số sỏi dạng$${pattern}$, với$q$ nguyên không âm${lastLoses?'':'; số0 là trường hợp ván đã kết thúc'}.`,math:null,reason:'Đọc đúng luật viên cuối và lượng được phép lấy',question:'Theo luật này, cần để lại0 hay1 viên ở thời điểm kết thúc chiến lược?'},
      {title:'Nước đáp trả cho mọi lượng đối phương lấy',explanation:`Nếu đối phương lấy$m$ viên, với$1\le m\le${moves.length}$, ta lấy$${block}-m$ viên. Lượng này vẫn nằm từ1 đến$${moves.length}$. ${lastLoses?`Nếu đã để đối phương gặp1 viên, họ lấy viên cuối và thua ngay. Nếu chưa kết thúc, số trước nước của họ ít nhất$${block+1}$; sau họ lấy$m$, còn ít nhất$${block+1}-m$, đủ để ta lấy$${block}-m$ và vẫn còn ít nhất1 viên.`:`Nếu số trước nước của họ là một bội dương của$${block}$ thì ít nhất$${block}$; sau họ lấy$m$, còn ít nhất$${block}-m$, nên nước đáp trả không lấy quá số còn lại.`}`,math:`m+(${block}-m)=${block}`,reason:'Ghép mỗi nước đối phương với một nước hợp lệ có tổng cố định',question:'Nếu đối phương lấy số khác đi, bạn thay đổi lượng lấy thế nào?'},
      {title:'Áp dụng cụ thể ở lượt đầu',explanation:`${initial} ${firstWins?`Lượng lấy đầu tiên nằm trong các lượng hợp lệ và đưa số còn lại về dạng$${pattern}$.`:'Mọi nước đầu của đối phương đều có một đáp trả theo quy tắc đã chứng minh.'} Về sau cứ dùng đúng quy tắc: đối phương lấy$m$, ta lấy$${block}-m$; không cần đoán$m$.`,math:firstWins?`${n}-${certificate.move[n]}=${n-certificate.move[n]!}`:null,reason:'Chỉ rõ người giữ chiến lược và hành động đầu',question:'Ở đề này người giữ chiến lược cần làm gì ở lần đi đầu của mình?'},
      {title:'Duy trì lớp số và chứng minh kết thúc',explanation:`Sau mỗi cặp lượt, tổng số sỏi giảm đúng$${block}$, nên số để đối phương gặp vẫn dạng$${pattern}$. Số sỏi giảm sau mọi lượt nên không thể kéo dài mãi. ${lastLoses?'Cuối cùng ta để lại đúng1 viên cho đối phương; họ phải lấy viên cuối và thua.':'Cuối cùng nước đáp trả của ta lấy hết số sỏi; ta thắng theo luật.'} Vậy người đi${result==='trước'?' trước':' sau'} có chiến lược thắng: ${initial} Sau mỗi nước$m$ của đối phương, lấy$${block}-m$ khi ván còn tiếp tục.`,math:null,reason:'Bất biến theo từng cặp lượt, lượng giảm và điều kiện kết thúc',question:'Vì sao chiến lược bảo đảm thắng với mọi cách chọn lượng lấy của đối phương?'}
    ];
  }
  if(!moves.every((v,i)=>v===i+1)){
    // Give the actual subtraction in every finite state; do not present an
    // unexplained list of losing positions as a completed proof.
    const rows=Array.from({length:n},(_,i)=>{
      const state=i+1,selected=certificate.move[state];
      const calculations=selected===null?moves.filter(m=>m<=state).map(m=>`${state}-${m}=${state-m}`).join(', '):`${state}-${selected}=${state-selected!}`;
      return `${state}&${selected===null?'\\varnothing':selected}&${calculations||'\\varnothing'}`;
    });
    const chunks:string[][]=[];let chunk:string[]=[];
    for(const row of rows){
      if(chunk.length&&(chunk.length>=16||chunk.join('\\\\').length+row.length>650)){chunks.push(chunk);chunk=[];}
      chunk.push(row);
    }
    if(chunk.length)chunks.push(chunk);
    const tables=chunks.map((part,index)=>({title:`Tính từng trạng thái: bảng ${index+1}`,explanation:`Đọc từ số sỏi nhỏ đến lớn. Cột đầu là số sỏi $s$. Nếu cột giữa ghi một số $m$, lấy đúng $m$ viên; phép trừ ở cột cuối cho số sỏi còn lại đã được xác định là thua, nên $s$ là thắng. Nếu cột giữa ghi $\\varnothing$, cột cuối liệt kê phép trừ của tất cả nước hợp lệ: mọi số còn lại đều đã được xác định là thắng, nên $s$ là thua. Nếu không có nước hợp lệ thì $s$ cũng là thua theo luật. ${lastLoses?'Riêng kết quả còn $0$ không phải một lượt chơi mới: người vừa lấy hết đã thua, nên không chọn phép trừ ấy làm nước thắng.':'Kết quả còn $0$ nghĩa là lấy hết và thắng; xem $0$ là trạng thái thua cho người kế tiếp.'} Mỗi phép trừ chỉ dùng trạng thái nhỏ hơn, đã có ở những dòng trước.`,math:'\\begin{array}{c|c|l}s&m&r\\\\\\hline '+part.join('\\\\')+'\\end{array}',reason:'Viết mọi phép trừ hợp lệ ở trạng thái thua; chỉ rõ nước về trạng thái thua ở trạng thái thắng',question:'Trong mỗi dòng, vì sao số sỏi sau khi lấy đã được phân loại ở một dòng trước?'}));
    details.splice(2,0,...tables);
  }
  const lesson={analysis:{statement:text,language:'vi',topic:'combinatorics',subtopic:'Trò chơi lấy sỏi hữu hạn',gradeLevel:9,withinCurriculum:true,concepts:['Chiến lược thắng và trạng thái thua'],techniques:['invariant'],givens:[`Có $${n}$ viên sỏi.`,`Mỗi lượt lấy $${moves.join(', ')}$ viên.`],unknowns:['Người có chiến lược thắng'],constraints:[terminal],status:'solvable',statusReason:null,interpretationNotes:[]},strategy:'Xét các trạng thái nhỏ trước, kiểm tra mọi nước hợp lệ rồi xây dựng chiến lược cho mọi phản ứng.',hints:details.filter((_,i)=>details.length<=8||[0,1,2,3,Math.floor(details.length/2),details.length-3,details.length-2,details.length-1].includes(i)).map((d,i)=>({id:`h${i+1}`,level:Math.min(i+1,4) as 1|2|3|4,question:d.question,cue:d.reason,explanation:d.explanation,math:d.math,stepId:`s${details.indexOf(d)+1}`,focus:[]})),steps:details.map((d,i)=>({id:`s${i+1}`,title:d.title,explanation:d.explanation,math:d.math,reason:d.reason,uses:i?[`s${i}`]:[],geometryActions:[]})),finalAnswer:{text:conclusion,math:null},answerChecks:[],figure:null} satisfies ModelLesson;
  const parsed=ModelLessonSchema.safeParse(lesson);return parsed.success?{lesson:parsed.data,certificate}:null;
}
