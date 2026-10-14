import {rationalInequalityLesson} from './rationalInequality';
import {singleAlgebraTask} from './algebraTask';
import {exactUnaryEquation,verifyUnaryCertificate,rootLatex,expressionValueAt,rationalExpressionLatex,rootSign,intervalLatex,type UnaryEquationCertificate} from '../../../shared/src/rationalPolynomial';
import {ModelLessonSchema,type ModelLesson} from '../../../shared/src/solution';
import {rationalEquationLesson} from './rationalEquation';

/** One outer radical/absolute value, with complete exact branches and sign checks. */
export function unaryEquationLesson(text:string):{lesson:ModelLesson;certificate:UnaryEquationCertificate}|null {
 try {
 const task=singleAlgebraTask(text,'equation');if(!task)return null;
 const equation=task.expression,c=exactUnaryEquation(equation);if(!c||!verifyUnaryCertificate(c)||task.requestedVariable&&task.requestedVariable!==c.variable)return null;
 const identityBranches=c.branches.filter(b=>b.identity);
 const branchLessons=c.branches.map(b=>b.identity?rationalInequalityLesson(`Giải bất phương trình $${c.regions[identityBranches.indexOf(b)]!.original}$.`)?.lesson:rationalEquationLesson(`Giải phương trình $${b.original}$.`)?.lesson);if(branchLessons.some(l=>!l))return null;
 const first=branchLessons[0]!,isRoot=c.kind==='sqrt',v=c.variable;
 const intervalNames=[...new Set(c.regions.flatMap(region=>region.intervals.map(intervalLatex)))];
 const setExpression=[...intervalNames,...(c.solutions.length?[`\\{${c.solutions.map(rootLatex).join(';')}\\}`]:[])].join('\\cup');
 const hasSolutions=intervalNames.length+c.solutions.length>0;
 const final=c.regions.length?(hasSolutions?`Vậy tập nghiệm của phương trình là $${setExpression}$.`:'Vậy phương trình vô nghiệm trên tập số thực.'):c.solutions.length?`Vậy phương trình có ${c.solutions.length===1?'nghiệm duy nhất':'các nghiệm'}: ${c.solutions.map(r=>`$${v}=${rootLatex(r)}$`).join(' hoặc ')}.`:'Vậy phương trình vô nghiệm trên tập số thực.';
 const argument=rationalExpressionLatex(c.argument,v),other=rationalExpressionLatex(c.other,v);
 const opening={title:isRoot?'Giữ điều kiện trước khi bình phương':'Xét đầy đủ hai trường hợp của giá trị tuyệt đối',explanation:isRoot?'Căn bậc hai có nghĩa khi biểu thức dưới căn không âm và luôn nhận giá trị không âm. Vì thế vế phải cũng phải không âm. Khi hai vế không âm, bình phương là phép biến đổi tương đương.':'Giá trị tuyệt đối luôn không âm nên vế phải phải không âm. Với vế phải không âm, biểu thức bên trong hoặc bằng vế phải, hoặc bằng đối của vế phải; hai trường hợp này bao quát mọi khả năng.',math:isRoot?`${argument}\\ge0,\\quad ${other}\\ge0\\quad;\\quad ${argument}=(${other})^2`:`\\begin{gathered}${other}\\ge0\\\\${argument}=${other}\\\\${argument}=-(${other})\\end{gathered}`,reason:isRoot?'Định nghĩa căn bậc hai số học và điều kiện để bình phương tương đương':'Định nghĩa giá trị tuyệt đối',uses:[],geometryActions:[]};
 const middle=branchLessons.flatMap((l,index)=>l!.steps.slice(0,-1).filter(s=>s.math!==`${v}\\in\\mathbb{R}`).map(s=>({...s,title:c.branches.length>1?`Trường hợp ${index+1}: ${s.title}`:s.title,explanation:c.branches[index]!.identity?`Phương trình ở trường hợp này là một đẳng thức đúng trong điều kiện xác định. Vì thế ta giải đầy đủ điều kiện vế phải không âm. ${s.explanation}`:s.explanation})));
 const candidateNames=c.branches.flatMap(b=>b.solutions).map(rootLatex);
 const checks=c.branches.flatMap(b=>b.solutions).map(root=>{
  const right=expressionValueAt(c.other,v,root),sign=rootSign(right),valid=sign>=0;
  return `${v}=${rootLatex(root)}:\\quad \\text{VP}=${rootLatex(right)}${valid?'\\ge0':'<0'}`;
 });
 const decisions=c.branches.flatMap(b=>b.solutions).map(root=>{
  const right=expressionValueAt(c.other,v,root),valid=rootSign(right)>=0;
  return `$${v}=${rootLatex(root)}$ cho vế phải bằng $${rootLatex(right)}$, ${valid?'không âm nên nhận':'âm nên loại'}.`;
 });
 const domainRejected=c.branches.flatMap(b=>b.candidates.filter(root=>!b.solutions.includes(root))).map(root=>`Giá trị $${v}=${rootLatex(root)}$ làm một mẫu số ban đầu bằng không, nên loại.`);
 const last={title:'Đối chiếu từng giá trị với điều kiện ban đầu',explanation:`${c.regions.length?'Những trường hợp phương trình trở thành đồng nhất được xét bằng bảng dấu của vế phải, nên có thể cho cả một khoảng nghiệm. ':''}${candidateNames.length?`Các phương trình sau biến đổi cho các giá trị cần kiểm tra: ${[...new Set(candidateNames)].map(r=>`$${v}=${r}$`).join(', ')}. `:c.regions.length?'Những giá trị trong các khoảng đã tìm được thỏa mãn điều kiện của trường hợp đồng nhất. ':'Các phương trình sau biến đổi không có nghiệm thực. '}${[...new Set(domainRejected)].join(' ')} ${[...new Set(decisions)].join(' ')} ${hasSolutions?'Giữ lại đúng các giá trị có vế phải ban đầu không âm; quan hệ đã biến đổi và dấu của vế phải bảo đảm chúng thỏa mãn phương trình ban đầu. ':'Không có giá trị nào thỏa mãn đồng thời phương trình đã biến đổi và dấu của vế phải ban đầu. '}Không có nghiệm khác vì mọi nghiệm ban đầu đều phải thuộc các trường hợp đã xét. ${final}`,math:c.regions.length?`${v}\\in${setExpression||'\\varnothing'}`:checks.length?`\\begin{gathered}${[...new Set(checks)].join('\\\\')}\\end{gathered}`:null,reason:'Kiểm tra dấu sau khi bình phương hoặc tách giá trị tuyệt đối; tính tương đương và tính đầy đủ',uses:[],geometryActions:[]};
 const steps=[opening,...middle,last].map((s,i)=>({...s,id:`s${i+1}`,uses:i?[`s${i}`]:[]}));
 const lesson={...first,analysis:{...first.analysis,statement:text,subtopic:isRoot?'Phương trình chứa căn bậc hai':'Phương trình chứa giá trị tuyệt đối',givens:[`$${equation}$`],constraints:[`$${other}\\ge0$`,...(isRoot?[`$${argument}\\ge0$`]:[])]},strategy:isRoot?'Giữ điều kiện không âm, bình phương tương đương, giải phương trình đa thức rồi kiểm tra dấu ở phương trình ban đầu.':'Giữ vế phải không âm, giải đầy đủ hai trường hợp theo định nghĩa giá trị tuyệt đối rồi kiểm tra điều kiện.',steps,hints:steps.filter((_,i)=>[0,1,2,Math.floor((steps.length-1)/2),steps.length-2,steps.length-1].includes(i)).map((s,i)=>({id:`h${i+1}`,level:Math.min(i+1,4) as 1|2|3|4,question:i===0?'Vế phải có thể âm không? Phép biến đổi cần điều kiện gì để không sinh nghiệm ngoại lai?':s.id===steps.at(-1)!.id?'Mỗi nghiệm tìm được có thỏa mãn dấu của vế phải ban đầu không? Vì sao đã xét hết mọi khả năng?':s.title.includes('biệt thức')?'Tính biệt thức từ các hệ số vừa tìm được. Dấu của biệt thức cho biết điều gì?':s.title.includes('công thức nghiệm')?'Khi thay vào công thức nghiệm, đối của hệ số $b$ là số nào? Có bao nhiêu giá trị phải kiểm tra?':s.title.includes('bậc nhất')?'Chuyển hạng tử tự do rồi chia cho hệ số nào để tìm ẩn?':s.title.includes('điều kiện')?'Những biểu thức ở mẫu nào phải khác không?': 'Sau khi khai triển và chuyển vế, hệ số từng bậc của phương trình là gì?',cue:s.reason,explanation:s.explanation,math:s.math,stepId:s.id,focus:[]})),finalAnswer:{text:final,math:null},answerChecks:[]} satisfies ModelLesson;
 const parsed=ModelLessonSchema.safeParse(lesson);return parsed.success?{lesson:parsed.data,certificate:c}:null;
 }catch{return null;}
}
