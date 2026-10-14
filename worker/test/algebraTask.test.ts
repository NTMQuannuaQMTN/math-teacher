import {describe,it,expect} from 'vitest';
import {rationalEquationLesson} from '../src/solver/rationalEquation';
import {unaryEquationLesson} from '../src/solver/unaryEquation';
import {rationalInequalityLesson} from '../src/solver/rationalInequality';
import {latexFeedback} from '../src/solver/latexCheck';
describe('current question algebra wording without OCR or omitted conditions',()=>{
 it.each(['Giải phương trình 2x+1=5.','Giải phương trình sau: $2x+1=5$.','Tìm x biết $2x+1=5$.','Tìm $x$ thỏa mãn $2x+1=5$.','Tìm nghiệm thực của phương trình $2x+1=5$ trên tập số thực.'])('consumes all of %s',text=>{
  const r=rationalEquationLesson(text)!;expect(r).not.toBeNull();expect(r.lesson.finalAnswer.text).toContain('$x=2$');expect(latexFeedback(r.lesson)).toEqual([]);
 });
 it.each(['Giải phương trình 2x+1=5 với x là số nguyên.','Tìm y biết $x=2$.','Giải phương trình $x=2$. b) Tính $x^2$.','Giải phương trình $x=2$, với $x<0$.','Giải phương trình x=2 và chứng minh điều khác.'])('declines a changed task %s',text=>expect(rationalEquationLesson(text)).toBeNull());
 it.each(['|2x-1|=3','\\left|2x-1\\right|=3','\\lvert2x-1\\rvert=3','\\left\\lvert2x-1\\right\\rvert=3','\\vert2x-1\\vert=3'])('accepts supported absolute-value notation %s',eq=>expect(unaryEquationLesson(`Tìm x biết $${eq}$.`)).not.toBeNull());
 it('accepts a whole bare inequality without discarding a requested condition',()=>{
  expect(rationalInequalityLesson('Giải bất phương trình 2x+1<=5.')).not.toBeNull();
  expect(rationalInequalityLesson('Giải bất phương trình 2x+1<=5 với x>0.')).toBeNull();
 });
});
