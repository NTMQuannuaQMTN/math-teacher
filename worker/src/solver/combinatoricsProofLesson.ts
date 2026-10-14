import {algebraProofLesson,type AlgebraDeduction} from './algebraProofLesson';
import {parseMathText} from '../../../shared/src/mathText';
export type CombinatoricsDeduction=AlgebraDeduction;
/** Shared typed presentation; mathematical construction and certificate remain separate. */
export function combinatoricsProofLesson(text:string,subtopic:string,strategy:string,steps:CombinatoricsDeduction[],final:string){
 const spaced=steps.map(s=>({...s,title:teacherSpacing(s.title),explanation:teacherSpacing(s.explanation),reason:teacherSpacing(s.reason),question:teacherSpacing(s.question)}));
 return algebraProofLesson(text,subtopic,strategy,spaced,teacherSpacing(final),{topic:'combinatorics',givens:[text],unknowns:['Kết quả và lập luận đầy đủ'],constraints:['Giữ đúng thứ tự, điều kiện chọn và luật chơi trong đề']});
}
/** Space our generated prose without changing any formula or the user's statement. */
function teacherSpacing(value:string):string {
 const parts=parseMathText(value);
 return parts.map((p,i)=>{
  if(p.kind==='math')return p.display?`$$${p.value}$$`:`$${p.value}$`;
  let text=p.value.replace(/(\p{L})(\d)|(\d)(\p{L})/gu,(_,a,b,c,d)=>a?`${a} ${b}`:`${c} ${d}`);
  if(parts[i-1]?.kind==='math'&&/^[\p{L}\d]/u.test(text))text=' '+text;
  if(parts[i+1]?.kind==='math'&&/[\p{L}\d]$/u.test(text))text+=' ';
  return text;
 }).join('');
}
export const plainCombinatorics=(text:string)=>text.replace(/\$/g,'').replace(/\s+/g,' ').trim();
export function choose(n:number,k:number):bigint {
 if(k<0||k>n)return 0n;let v=1n;for(let j=1;j<=Math.min(k,n-k);j++)v=v*BigInt(n-j+1)/BigInt(j);return v;
}
/** Counting subsets by independently adding Pascal rows, not factorial division. */
export function pascalChoose(n:number,k:number):bigint {
 if(k<0||k>n)return 0n;let row=[1n];for(let i=1;i<=n;i++){const next=[1n];for(let j=1;j<i;j++)next.push(row[j-1]!+row[j]!);next.push(1n);row=next;}return row[k]!;
}
