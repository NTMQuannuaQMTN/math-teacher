import {parseMathText} from '../../../shared/src/mathText';
/** Parse the whole task. Unsupported domain restrictions or additional subquestions remain unhandled. */
export function singleAlgebraTask(text:string,kind:'equation'|'inequality'):{expression:string;requestedVariable:string|null}|null {
 const cleaned=text.trim().replace(/\s+/g,' ');
 const command=kind==='equation'
  ? /^(?:Giải phương trình(?: sau)?|Tìm nghiệm thực của phương trình|Tìm tất cả nghiệm thực của phương trình)\s*:?\s*([\s\S]+)$/iu
  : /^(?:Giải bất phương trình(?: sau)?|Tìm tập nghiệm của bất phương trình)\s*:?\s*([\s\S]+)$/iu;
 const match=command.exec(cleaned);const requested=kind==='equation'?/^Tìm\s+\$?([a-z](?:_?\d+)?)\$?\s*(?:biết|thỏa mãn)\s*:?\s*([\s\S]+)$/iu.exec(cleaned):null;
 if(!match&&!requested)return null;
 // A student often adds a presentation request after the displayed equation.  It
 // is not a second mathematical condition, so remove only these closed, known
 // suffixes before requiring the rest of the task to be one exact expression.
 const body=(match?.[1]??requested![2]!)
  .replace(/\s+và\s+trình bày(?:\s+các)?\s+bước\s+kiểm tra\s+điều kiện\s+đầy đủ\s*\.?$/iu,'')
  .replace(/\s+và\s+trình bày\s+đầy đủ\s*\.?$/iu,'')
  .replace(/\s+trên tập số thực\s*\.?$/iu,'').replace(/\.$/u,'').trim();
 const segments=parseMathText(body),maths=segments.filter(s=>s.kind==='math'),prose=segments.filter(s=>s.kind==='text').map(s=>s.value).join('').trim();
 if(maths.length>1||maths.length===1&&prose)return null;
 // A bare expression is accepted only if the exact expression parser can consume it completely downstream.
 const expression=maths.length===1?maths[0]!.value:body;
 return {expression,requestedVariable:requested?.[1]?.replace('_','')??null};
}
