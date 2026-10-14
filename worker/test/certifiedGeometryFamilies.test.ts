import {describe,expect,it} from 'vitest';
import {certifiedGeometryFamily} from '../src/solver/certifiedGeometryFamilies';
import {latexFeedback} from '../src/solver/latexCheck';
import {cleanLanguage} from '../../shared/src/language';

const questions=[
 'Cho tam giác $ABC$. Điểm $D$ thuộc cạnh $BC$, điểm $E$ thuộc cạnh $CA$, với $BD/DC=2$ và $CE/EA=3$. Hai đường thẳng $AD$ và $BE$ cắt nhau tại $P$. Đường thẳng $CP$ cắt cạnh $AB$ tại $F$. Tính $AF/FB$ và chứng minh.',
 'Cho tam giác $ABC$. Điểm $D$ thuộc cạnh $AB$, điểm $E$ thuộc cạnh $BC$, với $AD/DB=2$ và $BE/EC=3$. Đường thẳng $DE$ cắt đường thẳng $AC$ tại $F$. Xác định vị trí $F$ và tính $AF/FC$, kèm chứng minh.',
 'Cho tam giác $ABC$ có $AB=13$, $AC=15$, $BC=14$. Tính diện tích tam giác bằng phương pháp lớp 9 và chứng minh các phép tính.',
 'Cho lục giác đều $ABCDEF$ nội tiếp đường tròn tâm $O$, bán kính bằng $5$. Tính độ dài cạnh và diện tích lục giác, chứng minh các bước.',
];

describe('certified geometry families',()=>{
 it.each(questions)('builds and verifies every deduction for %s',(question)=>{
  const result=certifiedGeometryFamily(question);
  expect(result).not.toBeNull();
  expect(result?.verify()).toBe(true);
  expect(result?.lesson.steps.length).toBeGreaterThanOrEqual(4);
  expect(result?.lesson.steps.every(step=>Boolean(step.reason))).toBe(true);
  expect(latexFeedback(result!.lesson)).toEqual([]);
  expect(cleanLanguage(result!.lesson).feedback).toEqual([]);
 });

 it('generalizes ratios, integer-height triangles and radii',()=>{
  expect(certifiedGeometryFamily(questions[0]!.replace('BD/DC=2','BD/DC=4').replace('CE/EA=3','CE/EA=5'))?.lesson.finalAnswer.text).toContain('20');
  expect(certifiedGeometryFamily('Cho tam giác $ABC$ có $AB=5$, $AC=5$, $BC=6$. Tính diện tích tam giác bằng phương pháp lớp 9 và chứng minh các phép tính.')?.lesson.finalAnswer.text).toContain('$12$');
  expect(certifiedGeometryFamily(questions[3]!.replace('bằng $5$','bằng $7$'))?.lesson.finalAnswer.text).toContain('147');
 });

 it('rejects degenerate triangles and changed constructions',()=>{
  expect(certifiedGeometryFamily('Cho tam giác $ABC$ có $AB=1$, $AC=2$, $BC=3$. Tính diện tích tam giác bằng phương pháp lớp 9 và chứng minh các phép tính.')).toBeNull();
  expect(certifiedGeometryFamily(`${questions[0]} Biết thêm P là trung điểm AD.`)).toBeNull();
 });

 it('accepts equivalent ratio notation and natural construction wording',()=>{
  const ceva=certifiedGeometryFamily('Trong tam giác ABC, D nằm trên BC, E nằm trên CA và BD:DC=3, CE:EA=5. AD giao BE tại P; CP gặp AB tại F. Hãy chứng minh và tính AF:FB.');
  expect(ceva?.lesson.finalAnswer.text).toContain('15');
  const menelaus=certifiedGeometryFamily('Tam giác ABC có D ở trên AB, E ở trên BC, AD:DB=1, BE:EC=3. Gọi F là giao điểm của DE với đường thẳng AC. F ở đâu và AF:FC bằng bao nhiêu? Chứng minh.');
  expect(menelaus?.lesson.finalAnswer.text).toContain('=3');
  const hexagon=certifiedGeometryFamily('Lục giác đều ABCDEF được nội tiếp đường tròn (O;8). Hãy tính cạnh và diện tích, giải thích bằng cách chia thành các tam giác.');
  expect(hexagon?.lesson.finalAnswer.text).toContain('96\\sqrt3');
 });
});
