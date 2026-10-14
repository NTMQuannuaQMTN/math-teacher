import {parseExpression} from '../../../shared/src/expr';
import {parseMathText} from '../../../shared/src/mathText';
import {expressionSource} from '../../../shared/src/expressionSource';
import {exactConstantRadical,verifyConstantRadicalCertificate} from '../../../shared/src/rationalPolynomial';
import {radicalSequenceLesson} from './radicalSequence';
import {algebraProofLesson,type AlgebraDeduction} from './algebraProofLesson';
interface SequenceTask {text:string;index:string;name:string;definition:string;modulus:number}
export interface SequenceDivisibilityCertificate {task:SequenceTask;sum:number;product:number;states:number[][];prefix:number;period:number;prefixZeros:number[];cycleZeros:number[]}
function sequenceTask(text:string):SequenceTask|null {
 const maths:string[]=[];if(text.includes('§'))return null;
 const template=parseMathText(text.trim()).map(s=>s.kind==='math'?`§${maths.push(s.value)-1}§`:s.value).join('').replace(/\s+/g,' ').trim();
 const match=/^Với mỗi số tự nhiên §0§, đặt §1§\. Tìm §2§ để §3§ chia hết cho (?:§4§|(\d+))\.?$/iu.exec(template);
 if(!match||maths.length!==(match[1]?4:5))return null;
 const index=maths[0]!.trim();if(!/^[a-z]$/u.test(index)||maths[2]!.trim()!==index)return null;
 const def=new RegExp(`^([a-z])_(?:\\{${index}\\}|${index})\\s*=([\\s\\S]+)$`).exec(maths[1]!);if(!def||def[1]===index)return null;
 if(maths[3]!.replace(/\s/g,'')!==`${def[1]}_${index}`&&maths[3]!.replace(/\s/g,'')!==`${def[1]}_{${index}}`)return null;
 const literal=match[1]??maths[4]!.trim();if(!/^\d+$/u.test(literal))return null;const modulus=Number(literal);if(modulus<2||modulus>60)return null;
 return {text,index,name:def[1]!,definition:def[2]!,modulus};
}
function sequenceCoefficients(task:SequenceTask):{sum:number;product:number}|null {
 try{
  const node=parseExpression(task.definition);if(node.t!=='bin'||node.op!=='+')return null;
  const powers=[node.a,node.b];if(powers.some(p=>p.t!=='bin'||p.op!=='^'||p.b.t!=='var'||p.b.name!==task.index))return null;
  const bases=powers.map(p=>expressionSource((p as Extract<typeof node,{t:'bin'}>).a));
  const sum=exactConstantRadical(`(${bases[0]})+(${bases[1]})`),product=exactConstantRadical(`(${bases[0]})*(${bases[1]})`);
  if(!sum||!product||!verifyConstantRadicalCertificate(sum)||!verifyConstantRadicalCertificate(product)||sum.value.v.n||product.value.v.n||sum.value.u.d!==1n||product.value.u.d!==1n||product.value.u.n===0n)return null;
  const S=Number(sum.value.u.n),P=Number(product.value.u.n);if(Math.abs(S)>1000||Math.abs(P)>1000)return null;
  return {sum:S,product:P};
 }catch{return null;}
}
const mod=(n:number,m:number)=>(n%m+m)%m;
const recurrenceText=(t:SequenceTask,S:number,P:number)=>`Với mỗi số tự nhiên $${t.index}$, đặt $${t.name}_${t.index}=${t.definition}$. Chứng minh $${t.name}_{${t.index}+2}=(${S})${t.name}_{${t.index}+1}-(${P})${t.name}_${t.index}$ với mọi $${t.index}=0,1,2,\\ldots$.`;
export function sequenceDivisibilityCertificate(text:string):SequenceDivisibilityCertificate|null {
 const task=sequenceTask(text);if(!task)return null;
 const coefficients=sequenceCoefficients(task);if(!coefficients)return null;
 const {sum:S,product:P}=coefficients,core=radicalSequenceLesson(recurrenceText(task,S,P));if(!core)return null;
 const states:number[][]=[],seen=new Map<string,number>();let state=[mod(2,task.modulus),mod(S,task.modulus)];
 for(let i=0;i<=task.modulus**2;i++){
  const key=state.join(',');if(seen.has(key)){
   const prefix=seen.get(key)!,period=states.length-prefix;if(states.length>40)return null;
   return {task,...coefficients,states,prefix,period,prefixZeros:states.flatMap((s,i)=>i<prefix&&s[0]===0?[i]:[]),cycleZeros:states.flatMap((s,i)=>i>=prefix&&s[0]===0?[i-prefix]:[])};
  }
  seen.set(key,states.length);states.push(state);state=[state[1]!,mod(S*state[1]!-P*state[0]!,task.modulus)];
 }
 return null;
}
/** Check every edge and the first repeated pair, and recheck the universal recurrence proof.
 * Matching one term alone is insufficient: the state must include two consecutive terms. */
export function verifySequenceDivisibilityCertificate(c:SequenceDivisibilityCertificate):boolean {
 try{
  const task=sequenceTask(c.task.text),coefficients=task&&sequenceCoefficients(task);if(!task||!coefficients||JSON.stringify(task)!==JSON.stringify(c.task)||c.sum!==coefficients.sum||c.product!==coefficients.product||!radicalSequenceLesson(recurrenceText(task,c.sum,c.product)))return false;
  if(c.states.length<1||c.states.length>40||!Number.isInteger(c.prefix)||!Number.isInteger(c.period)||c.prefix<0||c.period<1||c.prefix+c.period!==c.states.length)return false;
  if(c.states[0]!.join(',')!==[mod(2,task.modulus),mod(c.sum,task.modulus)].join(','))return false;
  const seen=new Set<string>();
  for(let i=0;i<c.states.length;i++){
   const state=c.states[i]!;if(state.length!==2||state.some(v=>!Number.isInteger(v)||v<0||v>=task.modulus)||seen.has(state.join(',')))return false;seen.add(state.join(','));
   const expected=[state[1]!,Number(((BigInt(c.sum)*BigInt(state[1]!)-BigInt(c.product)*BigInt(state[0]!))%BigInt(task.modulus)+BigInt(task.modulus))%BigInt(task.modulus))];
   if(expected.join(',')!==(i+1<c.states.length?c.states[i+1]!:c.states[c.prefix]!).join(','))return false;
  }
  const prefixZeros=c.states.flatMap((s,i)=>i<c.prefix&&s[0]===0?[i]:[]),cycleZeros=c.states.flatMap((s,i)=>i>=c.prefix&&s[0]===0?[i-c.prefix]:[]);
  return prefixZeros.join(',')===c.prefixZeros.join(',')&&cycleZeros.join(',')===c.cycleZeros.join(',');
 }catch{return false;}
}
export function radicalSequenceDivisibilityLesson(text:string) {
 const c=sequenceDivisibilityCertificate(text);if(!c||!verifySequenceDivisibilityCertificate(c))return null;
 const {index:n,name:a,modulus:m}=c.task,core=radicalSequenceLesson(recurrenceText(c.task,c.sum,c.product))!;
 const details:AlgebraDeduction[]=core.lesson.steps.slice(0,3).map(s=>({title:s.title,explanation:s.explanation,math:s.math,reason:s.reason??'Đẳng thức đã được chứng minh',question:'Từ tổng và tích của hai cơ số, suy ra quan hệ nào giữa ba số hạng liên tiếp?'}));
 details.push({title:'Chứng minh mọi số hạng là số nguyên',explanation:`Hai cơ số khác0 cho $${a}_0=2$; tổng của chúng cho $${a}_1=${c.sum}$. Đây đều là số nguyên. Công thức vừa chứng minh chỉ nhân với các hệ số nguyên rồi trừ, nên từ hai số hạng nguyên suy ra số hạng tiếp theo nguyên. Bắt đầu từ chỉ số0, lập luận lần lượt chứng minh tất cả số hạng nguyên; vì vậy phép xét chia hết có nghĩa.`,math:`${a}_0=2,\\quad ${a}_1=${c.sum},\\quad ${a}_{${n}+2}=(${c.sum})${a}_{${n}+1}-(${c.product})${a}_${n}`,reason:'Hai số hạng đầu nguyên; công thức truy hồi giữ tính nguyên',question:'Vì sao biểu thức chứa căn vẫn cho số nguyên ở mọi chỉ số?'});
 details.push({title:'Theo dõi hai số hạng liên tiếp để bảo đảm chu kỳ',explanation:`Xét cặp số dư $(${a}_${n},${a}_{${n}+1})$ khi chia $${m}$. Công thức truy hồi xác định duy nhất cặp kế tiếp từ cặp hiện tại. Có nhiều nhất $${m*m}$ cặp; khi một cặp lặp lại, toàn bộ các cặp sau lặp theo cùng cách. Phải trùng cả hai số dư, không chỉ một số hạng.`,math:`(u,v)\\longmapsto(v,(${c.sum})v-(${c.product})u)\\pmod{${m}}`,reason:'Trạng thái gồm hai số hạng; chuyển trạng thái duy nhất trên tập hữu hạn',question:'Tại sao trùng một số dư chưa đủ để kết luận cả dãy lặp?'});
 for(let i=0;i<c.states.length;i+=8){const rows=c.states.slice(i,i+8);details.push({title:`Tính các cặp số dư từ chỉ số ${i} đến ${i+rows.length-1}`,explanation:`Bắt đầu từ cặp số dư của $(2,${c.sum})$, dùng đúng công thức truy hồi để tính mỗi cặp kế tiếp. Bảng ghi cả hai số dư; những cột có số dư của $${a}_${n}$ bằng0 là chỉ số được nhận.`,math:`\\begin{array}{c|${'c'.repeat(rows.length)}}${n}&${rows.map((_,j)=>i+j).join('&')}\\\\\\hline ${a}_${n}\\bmod ${m}&${rows.map(s=>s[0]).join('&')}\\\\${a}_{${n}+1}\\bmod ${m}&${rows.map(s=>s[1]).join('&')}\\end{array}`,reason:'Tính từng chuyển trạng thái; đối chiếu điều kiện chia hết',question:'Ở những cột nào số hạng đầu của cặp có số dư0?'});}
 const repeat=c.states[c.prefix]!;
 details.push({title:'Chứng minh phần trước chu kỳ và mọi chu kỳ tiếp theo',explanation:`Cặp ở chỉ số $${c.states.length}$ là $(${repeat.join(',')})$, đúng bằng cặp ở chỉ số $${c.prefix}$. Không cặp nào trước đó lặp. Vì chuyển trạng thái là duy nhất, từ chỉ số $${c.prefix}$ các cặp lặp theo chu kỳ $${c.period}$. ${c.prefix===0?'Chu kỳ bắt đầu ngay ở chỉ số0, nên mọi chỉ số đều nằm trong một chu kỳ đã kiểm tra.':`Các chỉ số nhỏ hơn $${c.prefix}$ được xét riêng, còn mọi chỉ số sau đều nằm trong một chu kỳ đã kiểm tra.`}`,math:`(${a}_{${c.states.length}},${a}_{${c.states.length+1}})\\equiv(${a}_{${c.prefix}},${a}_{${c.prefix+1}})\\equiv(${repeat.join(',')})\\pmod{${m}}`,reason:'Cùng cặp đầu vào cho cùng cặp đầu ra ở mọi lần tiếp theo; chứng minh chu kỳ đầy đủ',question:'Cặp nào lặp lại, từ đâu, và tại sao việc lặp kéo dài mãi?'});
 const K=['k','t','u','v'].find(v=>![n,a].includes(v))!;
 const families=[...c.prefixZeros.map(i=>`${n}=${i}`),...c.cycleZeros.map(r=>`${n}=${c.prefix+r}+${c.period}${K},\\ ${K}\\in\\mathbb Z,\\ ${K}\\ge0`)];
 const answer=families.length?`Vậy tất cả chỉ số cần tìm là ${families.map(f=>`$${f}$`).join(' hoặc ')}.`:'Vậy không có chỉ số tự nhiên nào thỏa điều kiện chia hết.';
 details.push({title:'Kết luận mọi chỉ số thỏa mãn, không chỉ các số đầu',explanation:`${c.prefix?'Trong phần trước chu kỳ, nhận đúng các cột có số dư0; trong mỗi chu kỳ, nhận đúng các vị trí có số dư0 của bảng.':'Chu kỳ bắt đầu từ chỉ số0; trong mỗi chu kỳ, nhận đúng các vị trí có số dư0 của bảng.'} Các vị trí khác đều có số dư khác0, nên không chia hết. ${answer}`,math:null,reason:'Phần đầu và chu kỳ bao quát mọi số tự nhiên; điều kiện cần và đủ',question:'Công thức chỉ số có bao gồm mọi lần lặp mà không thêm vị trí có số dư khác0 không?'});
 const lesson=algebraProofLesson(text,'Dãy liên hợp: tính nguyên và chu kỳ số dư','Chứng minh công thức truy hồi và tính nguyên, rồi theo dõi cặp số dư để chứng minh chu kỳ đầy đủ.',details,answer,{givens:[`$${a}_${n}=${c.task.definition}$`],unknowns:[`Tất cả số tự nhiên $${n}$ sao cho $${a}_${n}$ chia hết cho $${m}$.`],constraints:['Chỉ số tự nhiên gồm0; chu kỳ phải xét cặp số hạng liên tiếp.']});
 if(!lesson)return null;lesson.analysis.topic='number_theory';return {lesson,certificate:c};
}
