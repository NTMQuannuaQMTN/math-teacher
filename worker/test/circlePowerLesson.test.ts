import {describe,it,expect} from 'vitest';
import {auditLesson} from '../scripts/lesson-audit';
import {circlePowerCertificate,circlePowerLesson,verifyCirclePowerCertificate} from '../src/solver/circlePowerLesson';
import {proofDependencyFeedback} from '../../shared/src/proofDependencies';

const tangent='Từ điểm $P$ nằm ngoài đường tròn $(O)$, kẻ tiếp tuyến $PA$ và cát tuyến qua $P$ cắt đường tròn lần lượt tại $B,C$, với $B$ nằm giữa $P,C$. Biết $PA=6$, $PB=4$. Tính $PC$ và chứng minh hệ thức được dùng.';
const chords='Hai dây $AB$ và $CD$ của một đường tròn cắt nhau tại điểm $P$ bên trong đường tròn. Biết $PA=3$, $PB=8$, $PC=4$. Tính $PD$ và chứng minh hệ thức được dùng.';

describe('certified circle-power lessons',()=>{
 it('derives tangent-secant before calculating, with exact arithmetic',()=>{
  const r=circlePowerLesson(tangent)!;expect(r).not.toBeNull();
  expect(r.certificate.result).toEqual({n:'9',d:'1'});
  expect(r.lesson.steps).toHaveLength(4);
  expect(r.lesson.steps[2]!.math).toContain('PA^{2}=PB\\cdot PC');
  expect(r.lesson.steps.at(-1)!.explanation).toContain('PC=9');
  expect(auditLesson(r.lesson)).toMatchObject({schemaValid:true,latexErrors:[],languageErrors:[]});
 });
 it('derives intersecting-chords from vertical and inscribed angles',()=>{
  const r=circlePowerLesson(chords)!;expect(r).not.toBeNull();
  expect(r.certificate.result).toEqual({n:'6',d:'1'});
  expect(r.lesson.steps[0]!.reason).toContain('đối đỉnh');
  expect(r.lesson.steps[1]!.reason).toContain('nội tiếp');
  expect(r.lesson.steps[2]!.math).toContain('PA\\cdot PB=PC\\cdot PD');
  expect(proofDependencyFeedback(r.lesson,chords)).toEqual([]);
  expect(auditLesson(r.lesson)).toMatchObject({schemaValid:true,latexErrors:[],languageErrors:[]});
 });
 it('generalizes across names, numbers, and a different missing arm',()=>{
  const renamed='Từ điểm $X$ nằm ngoài đường tròn $(I)$, kẻ tiếp tuyến $XY$ và cát tuyến qua $X$ cắt đường tròn lần lượt tại $U,V$, với $U$ nằm giữa $X,V$. Biết $XY=10$, $XU=5$. Tính $XV$ và chứng minh hệ thức được dùng.';
  expect(circlePowerLesson(renamed)?.certificate.result).toEqual({n:'20',d:'1'});
  const other='Hai dây $KL$ và $MN$ của một đường tròn cắt nhau tại điểm $Q$ bên trong đường tròn. Biết $QK=2$, $QM=3$, $QN=4$. Tính $QL$ và chứng minh hệ thức được dùng.';
  expect(circlePowerLesson(other)?.certificate.result).toEqual({n:'6',d:'1'});
 });
 it('declines changed incidence, extra goals, incomplete values, and forged certificates',()=>{
  expect(circlePowerLesson(tangent.replace('$B$ nằm giữa $P,C$','$C$ nằm giữa $P,B$'))).toBeNull();
  expect(circlePowerLesson(chords+' Chứng minh thêm một mệnh đề khác.')).toBeNull();
  expect(circlePowerLesson(chords.replace(', $PC=4$',''))).toBeNull();
  const cert=circlePowerCertificate(tangent)!;
  expect(verifyCirclePowerCertificate({...cert,target:'PB'})).toBe(false);
 });
});
