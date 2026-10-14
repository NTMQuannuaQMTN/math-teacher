import {it,expect,vi} from 'vitest';
import {solveProblem} from '../src/solver/pipeline';
import {VN_GRADE_9} from '../src/solver/curriculum';
import {latexFeedback} from '../src/solver/latexCheck';
import {cleanLanguage} from '../../shared/src/language';
it.each([
 ['Giải phương trình $\\sqrt{x+1}+\\sqrt{2x-1}=3$.','29-6\\sqrt{21}'],
 ['Giải phương trình $x^4-5x^2+4=0$.','x=-2'],
 ['Giải phương trình $\\sqrt{x^2}=x$.','[0;+\\infty)'],
 ['Cho $-1\\le x\\le4$. Tìm giá trị nhỏ nhất và lớn nhất của $A=x^2-4x+1$.','x=2'],
 ['Rút gọn $A=\\sqrt{7+4\\sqrt3}-\\sqrt{7-4\\sqrt3}$.','2\\sqrt{3}'],
 ['Cho phương trình $x^2-(m+2)x+2m=0$. Tìm tất cả $m$ để phương trình có hai nghiệm phân biệt và cả hai nghiệm đều dương.','(0;2)\\cup(2;+\\infty)'],
 ['Cho $a,b,c$ là các số thực dương và $a+b+c=6$. Chứng minh $\\frac1a+\\frac1b+\\frac1c\\ge\\frac32$ và tìm trường hợp xảy ra dấu bằng.','a=b=c=2'],
 ['Tìm $a$ để đa thức $P(x)=x^3-2x^2+ax+4$ chia hết cho $x-2$.','a=-2'],
 ['Giải hệ phương trình $\\begin{cases}x+y=5\\\\x^2+y^2=13\\end{cases}$.','(2;3)'],
 ])('uses independently checked algebra certificates without inference: %s',async(question,expected)=>{
 const complete=vi.fn(async()=>{throw Error('inference must be unnecessary');});
 const r=await solveProblem({name:'none',model:'none',complete},VN_GRADE_9,question,{signal:AbortSignal.timeout(26000)});
 expect(complete).not.toHaveBeenCalled();expect(r.verification.status).toBe('verified');expect(r.model).toBe('deterministic-algebra');expect(r.lesson.finalAnswer.text).toContain(expected);
 expect(r.lesson.steps.at(-1)!.explanation).toContain(r.lesson.finalAnswer.text);expect(latexFeedback(r.lesson)).toEqual([]);expect(cleanLanguage(r.lesson).feedback).toEqual([]);
});
