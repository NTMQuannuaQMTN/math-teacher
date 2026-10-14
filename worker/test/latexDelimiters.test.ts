import {describe, expect, it} from 'vitest';
import {parseMathText, isWellFormedMathText, wrapBareLatex} from '../../shared/src/mathText';
import {latexFeedback} from '../src/solver/latexCheck';
import {tidy} from '../src/solver/pipeline';
import {mockAlgebraLesson} from '../src/solver/mock';

describe('generated standard LaTeX delimiters', () => {
  it('preserves prose around inline and display formulas', () => {
    expect(parseMathText(String.raw`Vì \(x_1=\frac12\), suy ra \[x_1+x_2=3\].`)).toEqual([
      {kind:'text', value:'Vì '}, {kind:'math', value:String.raw`x_1=\frac12`, display:false},
      {kind:'text', value:', suy ra '}, {kind:'math', value:'x_1+x_2=3', display:true}, {kind:'text', value:'.'},
    ]);
  });
  it('does not consume row breaks or literal escaped delimiters', () => {
    expect(parseMathText(String.raw`$\begin{aligned}x&=1\\[2pt]y&=2\end{aligned}$`)[0]).toMatchObject({kind:'math', display:false});
    expect(parseMathText(String.raw`Ký hiệu \\(x\\)`).every(s=>s.kind==='text')).toBe(true);
  });
  it('flags an incomplete standard delimiter rather than accepting raw markup', () => {
    expect(isWellFormedMathText(String.raw`Vì \(x=1 nên kết luận.`)).toBe(false);
    expect(isWellFormedMathText(String.raw`Vì x=1\) nên kết luận.`)).toBe(false);
  });
  it('normalizes model fields without dropping parentheses or changing the formula', () => {
    const l=mockAlgebraLesson();
    l.hints[0]!.question=String.raw`Bạn có thể dùng \(x_1+\sqrt{x_1^2+1}\) như thế nào?`;
    l.steps[0]!.math=String.raw`\[\frac{1}{2}+\frac{1}{2}=1\]`;
    const normalized=tidy(l);
    expect(normalized.hints[0]!.question).toBe(String.raw`Bạn có thể dùng $x_1+\sqrt{x_1^2+1}$ như thế nào?`);
    expect(normalized.steps[0]!.math).toBe(String.raw`\frac{1}{2}+\frac{1}{2}=1`);
    expect(latexFeedback(normalized)).toEqual([]);
    expect(wrapBareLatex(String.raw`Điều kiện \(x>0\).`)).toBe('Điều kiện $x>0$.');
  });
});
