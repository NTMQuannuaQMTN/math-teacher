import {describe,expect,it} from 'vitest';
import {certifiedAlgebraFamily} from '../src/solver/certifiedAlgebraFamilies';
import {latexFeedback} from '../src/solver/latexCheck';
import {cleanLanguage} from '../../shared/src/language';

const questions=[
 'Cho đa thức $P(x)$ có bậc không quá hai, biết $P(0)=1$, $P(1)=3$, $P(2)=9$. Tính $P(3)$ và giải thích các bước.',
 'Tìm giá trị nhỏ nhất của $|x-1|+|x-4|+|x-7|$ với $x$ thực và tất cả giá trị $x$ đạt giá trị nhỏ nhất.',
 'Phân tích $x^4+4y^4$ thành tích các đa thức với hệ số nguyên và chứng minh đẳng thức.',
 'Với số nguyên dương $n$, tính tổng $S=\\frac{1}{1\\cdot2}+\\frac{1}{2\\cdot3}+\\cdots+\\frac{1}{n(n+1)}$. Chứng minh công thức.',
];

describe('certified algebra families',()=>{
 it.each(questions)('builds and independently verifies %s',(question)=>{
  const result=certifiedAlgebraFamily(question);
  expect(result).not.toBeNull();
  expect(result?.verify()).toBe(true);
  expect(result?.lesson.steps.length).toBeGreaterThanOrEqual(4);
  expect(result?.lesson.steps.every(step=>Boolean(step.reason))).toBe(true);
  expect(latexFeedback(result!.lesson)).toEqual([]);
  expect(cleanLanguage(result!.lesson).feedback).toEqual([]);
 });

 it('generalizes interpolation and median constants',()=>{
  const interpolation=certifiedAlgebraFamily('Cho đa thức $P(x)$ có bậc không quá hai, biết $P(0)=2$, $P(1)=6$, $P(2)=12$. Tính $P(4)$ và giải thích các bước.');
  const median=certifiedAlgebraFamily('Tìm giá trị nhỏ nhất của $|x+2|+|x-3|+|x-9|$ với $x$ thực và tất cả giá trị $x$ đạt giá trị nhỏ nhất.');
  expect(interpolation?.lesson.finalAnswer.text).toContain('30');
  expect(median?.lesson.finalAnswer.text).toContain('11');
  expect(median?.lesson.finalAnswer.text).toContain('x=3');
 });

 it('rejects statements with extra conditions instead of reusing a certificate',()=>{
  expect(certifiedAlgebraFamily(`${questions[2]} Biết thêm x=y.`)).toBeNull();
 });

 it('accepts structural paraphrases and preserves renamed symbols',()=>{
  const polynomial=certifiedAlgebraFamily('Đa thức P có bậc không vượt quá 2 và P(0)=-1, P(1)=2, P(2)=9. Hãy tìm P(3), trình bày đầy đủ.');
  expect(polynomial?.lesson.finalAnswer.text).toContain('20');
  const median=certifiedAlgebraFamily('Với t là số thực, hãy tìm min của |t-10| + |t+3| + |t-4| và nêu mọi t đạt min.');
  expect(median?.lesson.finalAnswer.text).toContain('t=4');
  const identity=certifiedAlgebraFamily('Hãy chứng minh rồi phân tích a^4+4b^4 thành tích hai đa thức hệ số nguyên.');
  expect(identity?.lesson.finalAnswer.text).toContain('2ab');
  expect(identity?.lesson.finalAnswer.text).not.toContain('xy');
 });
});
