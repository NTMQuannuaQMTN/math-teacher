import type {ModelLesson} from '../../../shared/src/solution';
import {normalizeProblemText} from '../../../shared/src/mathText';
import {algebraProofLesson,type AlgebraDeduction} from './algebraProofLesson';

type Task={kind:'coins';text:string;coins:number;flips:number}|{kind:'domino';text:string;columns:number;firstPlayer:string;secondPlayer:string};
export interface InvariantPairingCertificate {task:Task;verifiedStates:number}
const plain=(input:string)=>normalizeProblemText(input).replace(/\$/g,'').replace(/\\times/g,'×').replace(/\s+/g,' ').trim();
function parse(input:string):Task|null {
 const text=normalizeProblemText(input),p=plain(input);let m:RegExpExecArray|null;
 if(/(?:được|có thể)\s+(?:bỏ lượt|đặt chồng|lật thêm)|thay đổi luật/iu.test(p))return null;
 m=/(\d+)\s*đồng xu[^.]{0,40}(?:đều |đang )ngửa[\s\S]{0,100}?lật\s+(?:đúng|chính xác)\s*(\d+|hai)\s*đồng(?: xu)?\s*(?:phân biệt|khác nhau)[\s\S]{0,100}?(?:tất cả|cả\s+\1\s+đồng xu)[^.?!]{0,40}sấp/iu.exec(p);
 if(m){const coins=Number(m[1]),flips=m[2]!.toLowerCase()==='hai'?2:Number(m[2]);return coins>=1&&coins<=20&&coins%2===1&&flips===2?{kind:'coins',text,coins,flips}:null;}
 const board=/bàn(?: cờ)?\s*2×(\d+)|(?:Trên )?bảng\s*2×(\d+)/iu.exec(p),players=/\b([A-ZĐ][\p{L}]*)\s+và\s+([A-ZĐ][\p{L}]*)\s+(?:luân phiên|thay nhau)/u.exec(p);
 if(board&&players&&/domino/iu.test(p)&&/hai ô kề cạnh[^.]{0,20}(?:còn )?trống/iu.test(p)&&new RegExp(`\\b${players[1]}\\s+đi trước`,'u').test(p)&&/(?:không còn|hết) nước đi[^.]{0,20}thua/iu.test(p)){
  const columns=Number(board[1]??board[2]);return columns>=2&&columns<=20&&columns%2===0?{kind:'domino',text,columns,firstPlayer:players[1]!,secondPlayer:players[2]!}:null;
 }
 return null;
}
function verifyCoins(task:Extract<Task,{kind:'coins'}>):number {
 const seen=new Set<number>([0]),queue=[0],full=(1<<task.coins)-1;
 while(queue.length){const state=queue.shift()!;for(let i=0;i<task.coins;i++)for(let j=i+1;j<task.coins;j++){const next=state^(1<<i)^(1<<j);if(!seen.has(next)){seen.add(next);queue.push(next);}}}
 return seen.has(full)?-1:seen.size;
}
type Cell=[number,number];
const key=(cells:Cell[])=>cells.map(([r,c])=>`${r},${c}`).sort().join('|');
function verifyDomino(task:Extract<Task,{kind:'domino'}>):number {
 const all:Cell[][]=[];for(let r=1;r<=2;r++)for(let c=1;c<task.columns;c++)all.push([[r,c],[r,c+1]]);for(let c=1;c<=task.columns;c++)all.push([[1,c],[2,c]]);
 for(const move of all){const reply=move.map(([r,c])=>[3-r,task.columns+1-c] as Cell);if(key(move)===key(reply))return -1;const occupied=new Set(move.map(String));if(reply.some(cell=>occupied.has(String(cell))))return -1;if(!all.some(candidate=>key(candidate)===key(reply)))return -1;}
 return all.length;
}
export function invariantPairingLesson(input:string):{lesson:ModelLesson;certificate:InvariantPairingCertificate}|null {
 const task=parse(input);if(!task)return null;let steps:AlgebraDeduction[],final:string,verifiedStates:number;
 if(task.kind==='coins'){
  verifiedStates=verifyCoins(task);if(verifiedStates<0)return null;
  steps=[
   {title:'Chọn đại lượng bất biến',explanation:`Gọi $H$ là số đồng xu đang ngửa. Ban đầu $H=${task.coins}$, là số lẻ. Ta chỉ cần theo dõi tính chẵn lẻ của $H$, không cần đoán thứ tự các lượt.`,math:`H_0=${task.coins}\equiv1\pmod2`,reason:'Định nghĩa đại lượng bất biến theo tính chẵn lẻ',question:'Ban đầu số đồng xu ngửa là chẵn hay lẻ?'},
   {title:'Xét đầy đủ một lượt lật hai đồng xu',explanation:'Nếu lật hai đồng ngửa thì $H$ giảm $2$; lật một ngửa và một sấp thì $H$ không đổi; lật hai đồng sấp thì $H$ tăng $2$. Đây là ba trường hợp duy nhất vì hai đồng được chọn là phân biệt.',math:'\Delta H\in\{-2,0,2\}',reason:'Phân loại đầy đủ theo trạng thái của hai đồng được lật',question:'Một lượt có thể làm số đồng ngửa thay đổi những lượng nào?'},
   {title:'Chứng minh tính chẵn lẻ không đổi',explanation:'Cả ba độ thay đổi đều là số chẵn, nên sau mỗi lượt $H$ vẫn cùng tính chẵn lẻ với trước lượt. Bằng quy nạp theo số lượt, $H$ luôn lẻ sau mọi dãy lượt hợp lệ.',math:'H_t\equiv H_0\equiv1\pmod2',reason:'Cộng một số chẵn không đổi tính chẵn lẻ; quy nạp theo số lượt',question:'Vì sao lập luận áp dụng cho mọi độ dài dãy lượt?'},
   {title:'So sánh với trạng thái đích và kết luận',explanation:`Khi cả $${task.coins}$ đồng xu đều sấp thì $H=0$, là số chẵn. Trạng thái này trái với bất biến $H$ luôn lẻ, nên không thể đạt được bằng bất kỳ dãy lượt nào.`,math:'0\not\equiv1\pmod2',reason:'Mâu thuẫn với bất biến đã chứng minh',question:'Trạng thái tất cả sấp có bao nhiêu đồng ngửa?'}];
  final=`Vậy không thể làm cho cả $${task.coins}$ đồng xu đều sấp.`;
 }else{
  verifiedStates=verifyDomino(task);if(verifiedStates<0)return null;
  const n=task.columns;
  steps=[
   {title:'Ghép cặp các ô bằng phép quay 180 độ',explanation:`Đánh số hàng $1,2$ và cột $1,\ldots,${n}$. Phép quay $R(r,c)=(3-r,${n+1}-c)$ biến bàn cờ thành chính nó và biến hai ô kề cạnh thành hai ô kề cạnh.`,math:`R(r,c)=(3-r,${n+1}-c)`,reason:'Tính chất phép quay nửa vòng của hình chữ nhật',question:'Ảnh của một ô sau phép quay nửa vòng là ô nào?'},
   {title:'Nêu chiến lược đáp rõ cho mọi nước của An',explanation:'Sau mỗi nước An đặt domino $D$, Bình đặt domino $R(D)$ là ảnh của đúng hai ô đó qua phép quay 180 độ. Quy tắc này xác định một nước đáp cho mọi domino ngang hoặc dọc mà An có thể đặt.',math:'D\longmapsto R(D)',reason:'Chiến lược đối xứng cố định, không phụ thuộc một ví dụ chơi cụ thể',question:'Bình phải làm gì ngay sau mỗi nước của An?'},
   {title:'Chứng minh domino đáp khác và không chồng lên nước vừa đi',explanation:`Vì $${n}$ chẵn, không có cột giữa cố định. Domino dọc ở cột $c$ biến thành domino dọc ở cột $${n+1}-c\ne c$. Domino ngang ở một hàng biến sang hàng kia, nên cũng không chung ô với nó. Vì vậy $D$ và $R(D)$ luôn rời nhau.`,math:`D\cap R(D)=\varnothing`,reason:'Xét đủ hai hướng domino và dùng số cột chẵn',question:'Tại sao điều kiện số cột chẵn loại domino dọc cố định?'},
   {title:'Chứng minh nước đáp luôn còn trống',explanation:'Trước lượt An, tập ô đã phủ đối xứng qua $R$ vì Bình luôn khôi phục đối xứng sau lượt mình. Nếu một ô của $R(D)$ đã bị phủ, ảnh ngược của nó trong $D$ cũng đã bị phủ, mâu thuẫn với việc An vừa đi hợp lệ. Kết hợp bước 3, cả hai ô của $R(D)$ đều trống.',math:'R(U)=U,\quad D\cap U=\varnothing\Rightarrow R(D)\cap U=\varnothing',reason:'Bất biến đối xứng và phép quay là song ánh, tự nghịch đảo',question:'Nếu ảnh của nước An đã bị phủ thì điều gì xảy ra với nước An?'},
   {title:'Chứng minh trò chơi kết thúc và xác định người thắng',explanation:`Bàn cờ có $2\cdot${n}=${2*n}$ ô. Mỗi cặp lượt An–Bình phủ thêm bốn ô khác nhau, nên sau hữu hạn không quá $${n/2}$ cặp lượt, trò chơi phải dừng. Bình luôn có nước đáp sau nước của An; vì thế người đầu tiên không còn nước hợp lệ là An.`,math:`${2*n}/4=${n/2}`,reason:'Số ô hữu hạn và mỗi nước phủ thêm hai ô chưa dùng',question:'Ai có thể là người đầu tiên không còn nước khi Bình luôn đáp được?'}];
  final=`Vậy Bình có chiến lược thắng: sau mọi nước $D$ của An, đặt $R(D)$ qua phép quay $180^\circ$.`;
 }
 let lesson=algebraProofLesson(task.text,task.kind==='coins'?'Bất biến chẵn lẻ':'Chiến lược ghép cặp đối xứng','Chọn một bất biến áp dụng cho mọi lượt và chứng minh đầy đủ rằng trạng thái đích hoặc mọi nước đáp được kiểm soát.',steps,final,{topic:'combinatorics'});
 if(lesson&&task.kind==='domino'&&(task.firstPlayer!=='An'||task.secondPlayer!=='Bình')){
  const rewrite=(value:any):any=>typeof value==='string'?value.replace(/\bAn\b/g,task.firstPlayer).replace(/\bBình\b/g,task.secondPlayer):Array.isArray(value)?value.map(rewrite):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([k,v])=>[k,rewrite(v)])):value;
  lesson=rewrite(lesson) as ModelLesson;
 }
 return lesson?{lesson,certificate:{task,verifiedStates}}:null;
}
export function verifyInvariantPairingCertificate(c:InvariantPairingCertificate):boolean {
 const parsed=parse(c.task.text);if(!parsed||JSON.stringify(parsed)!==JSON.stringify(c.task))return false;
 const count=parsed.kind==='coins'?verifyCoins(parsed):verifyDomino(parsed);return count>=0&&count===c.verifiedStates;
}
