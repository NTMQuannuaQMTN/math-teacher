/** Presentation only. Never reverse absolute values, set-builder bars or conditional probability. */
export function divisibilityLatex(tex: string): string {
  const chunks: string[] = [];
  let start=0, depth=0;
  const boundary= /^(?:,|;|\\quad\b|\\qquad\b|\\\\|\n)/;
  for(let i=0;i<tex.length;i++) {
    if(tex[i]==='\\' && /[{}]/.test(tex[i+1]??'')){depth+=tex[i+1]==='{'?1:-1;i++;continue;}
    if('({['.includes(tex[i]!))depth++;
    if(')}]'.includes(tex[i]!))depth--;
    const sep=depth===0 ? boundary.exec(tex.slice(i)) : null;
    if(sep){chunks.push(reverse(tex.slice(start,i)),sep[0]);i+=sep[0].length-1;start=i+1;}
  }
  chunks.push(reverse(tex.slice(start)));return chunks.join('');
}
function reverse(clause:string):string {
  let depth=0;const relations:{start:number;end:number;negative:boolean}[]=[];
  for(let i=0;i<clause.length;i++) {
    if(clause[i]==='\\' && /[{}]/.test(clause[i+1]??'')){depth+=clause[i+1]==='{'?1:-1;i++;continue;}
    if('({['.includes(clause[i]!))depth++;
    if(')}]'.includes(clause[i]!))depth--;
    if(depth!==0)continue;
    const token=/^\\(nmid|mid)\b/.exec(clause.slice(i));
    if(token){relations.push({start:i,end:i+token[0].length,negative:token[1]==='nmid'});i+=token[0].length-1;}
    else if(clause[i]==='|')relations.push({start:i,end:i+1,negative:false});
  }
  if(relations.length!==1)return clause;
  const r=relations[0]!,left=clause.slice(0,r.start).trim(),right=clause.slice(r.end).trim();
  // Only arithmetic operands: comparisons, prose, alignment and other bars are ambiguous.
  const operand=(s:string)=>s.length>0&&!/[|&=<>À-ỹĐđ]/u.test(s)&&! /\\(?:text|operatorname|in|ge|le|Rightarrow)\b/.test(s);
  if(!operand(left)||!operand(right))return clause;
  return `${clause.match(/^\s*/)?.[0]??''}${right} ${r.negative?'\\not\\vdots':'\\vdots'} ${left}${clause.match(/\s*$/)?.[0]??''}`;
}
