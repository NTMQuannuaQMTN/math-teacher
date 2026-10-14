import {describe,it,expect} from 'vitest';
import {problemDomains} from '../../shared/src/knowledgeBase';
import {certifiedCombinatoricsLesson} from '../src/solver/certifiedCombinatorics';
import {countingCertificate,verifyCountingCertificate} from '../src/solver/countingLesson';
import {constructiveCertificate,verifyConstructiveCertificate} from '../src/solver/constructiveCombinatoricsLesson';
import {pilesCertificate,verifyPilesCertificate,signCertificate,verifySignCertificate} from '../src/solver/finiteStrategyLesson';
import {solveProblem} from '../src/solver/pipeline';
import {VN_GRADE_9} from '../src/solver/curriculum';
import {latexFeedback} from '../src/solver/latexCheck';
import {cleanLanguage} from '../../shared/src/language';
import {verifyLesson} from '../../shared/src/verify';
const pair='Cho tập $S=\\{1,2,3,4,5,6,7,8,9,10\\}$. Chọn bất kỳ 6 số phân biệt thuộc $S$. Chứng minh có hai số được chọn có tổng bằng $11$ và chỉ rõ cách tìm hai số đó.';
const selection=(b=6,g=4,k=3,min='một')=>`Có ${b} học sinh nam và ${g} học sinh nữ. Chọn đồng thời ${k} học sinh. Có bao nhiêu cách chọn sao cho có ít nhất ${min} học sinh nữ?`;
const piles=(a:number,b:number,last='thắng')=>`Có hai đống sỏi, một đống có ${a} viên và một đống có ${b} viên. Hai người luân phiên chơi; mỗi lượt chọn đúng một đống và lấy một số nguyên dương viên sỏi từ đống đó. Người lấy viên cuối cùng ${last}. Người đi trước có chiến lược thắng không? Hãy chứng minh.`;
const signs=(n=10,m=3)=>`An và Bình luân phiên đặt dấu cộng hoặc dấu trừ trước các số 1, 2, 3, ..., ${n} theo đúng thứ tự này; An đặt dấu trước số 1. An thắng nếu tổng có dấu của các số chia hết cho ${m}, nếu không Bình thắng. Ai có chiến lược thắng? Hãy chứng minh.`;
const examples=['Cho các số $-8,-1,4,10,17,23,29$. Hãy chỉ ra hai số phân biệt trong danh sách có hiệu chia hết cho $6$.','Cho các số $1,2,3$. Hãy chỉ ra hai số phân biệt trong danh sách có hiệu chia hết cho $6$.',selection(),pair,'Chọn 7 số nguyên bất kỳ. Chứng minh luôn có hai số có hiệu chia hết cho 6.','Trên bảng có các số $1,2,\\ldots,15$. Mỗi lượt xóa hai số $a,b$ và viết số $a+b-1$. Sau 14 lượt còn một số. Tìm số đó và chứng minh kết quả không phụ thuộc thứ tự chọn.',piles(2,3),signs(),'Từ các chữ số $0,1,2,3,4,5$, lập được bao nhiêu số tự nhiên có ba chữ số đôi một khác nhau và chia hết cho $5$?','Trong một lớp có 30 học sinh, 18 em thích Toán, 16 em thích Văn và 8 em thích cả hai môn. Có bao nhiêu em không thích môn nào trong hai môn đó?','Có 8 người, mỗi cặp người bắt tay nhau đúng một lần. Có bao nhiêu cái bắt tay? Giải thích vì sao không đếm trùng.','Trong hộp có 3 viên bi đỏ và 2 viên bi xanh, các viên phân biệt. Rút đồng thời ngẫu nhiên 2 viên, mọi cặp có khả năng như nhau. Tính xác suất hai viên cùng màu.'];
describe('constructive combinatorics and exact counting',()=>{
 it('routes a choose-any subset proof to combinatorics',()=>expect(problemDomains(pair)).toContain('combinatorics'));
 it.each(examples)('returns a complete renderable Vietnamese proof with unavailable inference: %s',async(text)=>{
  const r=certifiedCombinatoricsLesson(text);expect(r).not.toBeNull();expect(r!.verify()).toBe(true);
  expect(latexFeedback(r!.lesson)).toEqual([]);
  expect(cleanLanguage(r!.lesson).feedback).toEqual([]);
  expect(verifyLesson(r!.lesson,{problemText:text}).verification.status).not.toBe('unverified');
  const solved=await solveProblem({name:'unused',model:'unused',complete:async()=>{throw Error('inference unavailable');}},VN_GRADE_9,text,{signal:AbortSignal.timeout(26000)});
  expect(solved.model).toBe('certified-combinatorics');expect(solved.attempts).toBe(0);expect(solved.verification.status).toBe('verified');expect(latexFeedback(solved.lesson)).toEqual([]);expect(cleanLanguage(solved.lesson).feedback).toEqual([]);
 });
 it('preserves the escaped spacing command in the actual combination formula',()=>{
  const lesson=certifiedCombinatoricsLesson(selection())!.lesson;expect(lesson.steps[0]!.math).toContain('\\quad');
 });
 it('shows the residue classification that justifies a nontrivial sign policy',()=>{
  const lesson=certifiedCombinatoricsLesson(signs(8,4))!.lesson;
  const calculations=lesson.steps.filter(s=>s.title.includes('Các số dư')).map(s=>s.math).join(' ');
  expect(calculations).toContain('9&\\{0\\}');
  expect(calculations).toContain('1&\\{0, 2\\}');
  expect(lesson.steps.find(s=>s.title.includes('Các số dư'))!.explanation).toContain('cả hai đều thuộc');
 });
 it('names the actual values and refuses to invent a pair for an impossible input',()=>{
  const lesson=certifiedCombinatoricsLesson(examples[0]!)!.lesson;expect(lesson.steps.at(-1)!.explanation).toContain('hai số $-8$ và $4$');
  const absent=certifiedCombinatoricsLesson(examples[1]!)!.lesson;expect(absent.steps.at(-1)!.explanation).toContain('không có hai số phân biệt');
 });
 it('explains impossibility before counting when no final digit is permitted',()=>{
  const text='Từ các chữ số $1,3,5,7$, lập được bao nhiêu số tự nhiên có 2 chữ số đôi một khác nhau và chia hết cho $2$?';
  const lesson=certifiedCombinatoricsLesson(text)!.lesson;expect(lesson.steps).toHaveLength(2);expect(lesson.steps[0]!.explanation).toContain('không có chữ số nào');expect(lesson.steps.at(-1)!.explanation).toContain('$0$');expect(lesson.steps.some(s=>s.math?.includes('hline'))).toBe(false);
 });
 it('does not invent chosen values for unspecified input',()=>{
  const l=certifiedCombinatoricsLesson(pair)!.lesson;expect(l.steps.some(s=>s.explanation.includes('chỉ số đầu tiên'))).toBe(true);expect(l.steps.some(s=>s.explanation.includes('đều được đánh dấu'))).toBe(true);
 });
 it('rejects changed rules, malformed sets and inconsistent counts',()=>{
  for(const q of [selection()+' Chọn có thứ tự.',pair.replace('6 số','5 số'),pair.replace('8,9,10','8,8,10'),piles(2,3)+' Được lấy cả hai đống.',signs()+' An được đổi dấu trước.',examples[9]!.replace('và 8 em','và 3 em'),examples[11]!.replace(', mọi cặp có khả năng như nhau','')])expect(certifiedCombinatoricsLesson(q)).toBeNull();
 });
 it('rejects corrupted independent certificates',()=>{
  const count=countingCertificate(selection())!;expect(verifyCountingCertificate({...count,total:count.total+1n})).toBe(false);
  const object=constructiveCertificate(pair)!;expect(verifyConstructiveCertificate({...object,boxes:object.boxes.slice(1)})).toBe(false);
  const game=pilesCertificate(piles(2,3))!;expect(verifyPilesCertificate({...game,firstTake:2})).toBe(false);
  const sg=signCertificate(signs())!;const policy=sg.policy.map(row=>[...row]);policy[10]![0]='-';policy[10]![1]='-';expect(verifySignCertificate({...sg,policy})).toBe(false);
 });
});

describe('independent adversarial and bounded enumeration checks',()=>{
 it('counts all labelled subsets directly, including empty groups and impossible female counts',()=>{
  for(let boys=0;boys<=5;boys++)for(let girls=0;girls<=5;girls++)for(let k=0;k<=Math.min(5,boys+girls);k++)for(let minimum=0;minimum<=k;minimum++){
   const c=countingCertificate(selection(boys,girls,k,String(minimum)))!;let count=0n;
   for(let mask=0;mask<2**(boys+girls);mask++){
    const selected=Array.from({length:boys+girls},(_,i)=>i).filter(i=>mask&(1<<i));if(selected.length===k&&selected.filter(i=>i>=boys).length>=minimum)count++;
   }
   expect(c.total,`${boys}/${girls}/${k}/${minimum}`).toBe(count);expect(verifyCountingCertificate(c)).toBe(true);
  }
 });
 it('finds an actual marked pair for EVERY six-element subset of1..10',()=>{
  const c=constructiveCertificate(pair)!;
  for(let mask=0;mask<1024;mask++){
   const selected=Array.from({length:10},(_,i)=>i+1).filter(v=>mask&(1<<(v-1)));if(selected.length!==6)continue;
   const found=c.boxes.find(([a,b])=>selected.includes(a!)&&selected.includes(b!));expect(found).toBeDefined();expect(found![0]!+found![1]!).toBe(11);
  }
 });
 it('matches an independent full game tree for both two-pile terminal conventions',()=>{
  const tree=(a:number,b:number,lastLoses:boolean):boolean=>a+b===0?lastLoses:Array.from({length:a},(_,i)=>i).some(x=>!tree(x,b,lastLoses))||Array.from({length:b},(_,i)=>i).some(y=>!tree(a,y,lastLoses));
  for(let a=1;a<=5;a++)for(let b=1;b<=5;b++)for(const loses of [false,true]){
   const c=pilesCertificate(piles(a,b,loses?'thua':'thắng'))!;expect(c.firstWins).toBe(tree(a,b,loses));expect(verifyPilesCertificate(c)).toBe(true);
  }
 });
 it('executes the sign policy against all opponent choices in the original signed sum',()=>{
  for(let n=4;n<=10;n++)for(let m=2;m<=7;m++){
   const c=signCertificate(signs(n,m))!;expect(verifySignCertificate(c)).toBe(true);
   const visit=(turn:number,sum:number):void=>{
    if(turn===n+1){expect(sum%m===0,`${n}/${m}/${sum}`).toBe(c.anWins);return;}
    if((turn%2===1)===c.anWins){const r=(sum%m+m)%m,sign=c.policy[turn]![r];expect(sign).not.toBeNull();visit(turn+1,sum+(sign==='+'?turn:-turn));}
    else {visit(turn+1,sum+turn);visit(turn+1,sum-turn);}
   };visit(1,0);
  }
 });
 it('proves the merge result for every order of small integer multisets, including a negative offset',()=>{
  for(let n=2;n<=6;n++)for(const offset of [-2,0,1,3]){
   const text=`Trên bảng có các số $1,2,\\ldots,${n}$. Mỗi lượt xóa hai số $a,b$ và viết số $a+b${offset>=0?'-'+offset:'+'+(-offset)}$. Sau ${n-1} lượt còn một số. Tìm số đó và chứng minh kết quả không phụ thuộc thứ tự chọn.`;
   const c=constructiveCertificate(text)!;expect(verifyConstructiveCertificate(c)).toBe(true);const seen=new Set<string>();
   const visit=(numbers:number[]):void=>{
    const key=[...numbers].sort((a,b)=>a-b).join(',');if(seen.has(key))return;seen.add(key);
    if(numbers.length===1){expect(numbers[0]).toBe(c.finalValue);return;}
    for(let i=0;i<numbers.length;i++)for(let j=i+1;j<numbers.length;j++)visit([...numbers.filter((_,p)=>p!==i&&p!==j),numbers[i]!+numbers[j]!-offset]);
   };visit(Array.from({length:n},(_,i)=>i+1));
  }
 });
});
