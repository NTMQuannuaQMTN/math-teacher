import { describe, expect, it } from 'vitest';
import { cleanLanguage,patchVietnamese,isStrippedVietnamese } from '../../shared/src/language';
import { mockAlgebraLesson, mockGeometryLesson } from '../src/solver/mock';

describe('Vietnamese hygiene across all displayed fields', () => {
 it.each(['Điều kiện trước khi giải phuong trinh.', 'Bước này: binh phuong hai vế.', 'Kết luận: hai nghiem đã được kiểm tra.'])('detects missing accents even beside accented prose: %s',text=>{
  expect(isStrippedVietnamese(text)).toBe(true);const l=mockAlgebraLesson();l.hints[0]!.question=text;expect(cleanLanguage(l).feedback.join(' ')).toContain('without diacritics');
 });
 it('retains a critical stripped condition and an OCR uncertainty note for correction',()=>{
  const l=mockAlgebraLesson();l.analysis.constraints=['dieu kien x > 0'];l.analysis.interpretationNotes=['Chưa chắc so nguyen trong đề có đúng không.'];const r=cleanLanguage(l);
  expect(r.lesson.analysis.constraints).toEqual(l.analysis.constraints);expect(r.lesson.analysis.interpretationNotes).toEqual(l.analysis.interpretationNotes);expect(r.feedback.join(' ')).toContain('constraint');
 });
 it('rejects English metadata even when it would otherwise bypass Vietnamese hygiene',()=>{
  const l=mockAlgebraLesson();l.analysis.language='en';l.hints[0]!.question='Which move guarantees winning?';expect(cleanLanguage(l).feedback.join(' ')).toContain('English or mixed-language');
 });
 it('preserves native so sánh instead of translating so as an English conjunction',()=>{
  expect(patchVietnamese('So sánh hai vế và so sánh các hệ số.')).toBe('So sánh hai vế và so sánh các hệ số.');
 });
 it('does not match English so inside accented Vietnamese words',()=>{
  const text='Bình kiểm soát dấu cuối, so sánh số dư và so với kết quả trước, không so đo.';
  expect(patchVietnamese(text)).toBe(text);
  const lesson=mockAlgebraLesson();lesson.steps[0]!.title=text;
  expect(cleanLanguage(lesson).lesson.steps[0]!.title).toBe(text);
 });
 it.each(['อยู่', 'العربية', '한국어'])('rejects non-Latin leakage %s even mixed with accented Vietnamese',word=>{
  const l=mockAlgebraLesson();l.hints[0]!.explanation=`Hai người luôn ${word} bên nhau.`;
  expect(cleanLanguage(l).feedback.join(' ')).toContain('foreign non-Latin');
 });
 it('repairs measured French and English counting leakage in all prose fields',()=>{
  const l=mockAlgebraLesson();l.analysis.constraints=['Lấy đồng thời, không remettre'];
  l.hints[0]!.cue='Xác suất P = favorable/total.';
  const r=cleanLanguage(l);
  expect(r.lesson.analysis.constraints[0]).toContain('không hoàn lại');
  expect(r.lesson.hints[0]!.cue).toContain('số kết quả thuận lợi');
  expect(r.feedback).toEqual([]);
 });
 it.each(['statusReason', 'givens', 'unknowns', 'constraints', 'interpretationNotes', 'concepts'] as const)('detects leakage in analysis.%s', field => {
  const l=mockAlgebraLesson();
  if(field==='statusReason') l.analysis[field]='Vì функция chưa rõ.';
  else l.analysis[field]=['Điều kiện функция chưa rõ.'];
  expect(cleanLanguage(l).feedback.join(' ')).toContain('Cyrillic');
 });
 it('detects foreign text in the final-answer math and step audit fields', () => {
  const l=mockAlgebraLesson();l.finalAnswer.math=String.raw`x=2\text{ where valid}`;
  l.steps[0]!.verification={status:'not_checked',method:'function',reason:'Hằng đẳng thức külön hai bình phương'};
  const out=cleanLanguage(l).feedback.join(' ');
  expect(out).toContain('final answer math');expect(out).toContain('verification reason');
 });
 it('detects leakage in diagram labels while preserving point letters',()=>{
  const l=mockGeometryLesson();l.figure!.circles=[{id:'c_O',center:'A',through:'B',radius:null,style:'given',label:'Đường tròn функция'}];
  expect(cleanLanguage(l).feedback.join(' ')).toContain('circle label');
  expect(cleanLanguage(mockGeometryLesson()).feedback).toEqual([]);
 });
 it('does not mistake Vietnamese accents or algebraic letters for foreign words',()=>{
  const l=mockAlgebraLesson();l.steps[0]!.reason='Đặt ẩn phụ, dùng hệ thức Vi-ét.';
  expect(cleanLanguage(l).feedback).toEqual([]);
 });
});

describe('English analysis and proof-note leakage',()=>{
 it.each(['Game theory (Nim game)','Initial state: (2, 3)','Rules of the game','Logical deduction about game states','Verified by coordinate addition.','Two players take turns moving the piece.'])('rejects %s',foreign=>{
  const l=mockAlgebraLesson();l.analysis.constraints=[foreign];
  expect(cleanLanguage(l).feedback.join(' ')).toContain('English');
 });
 it('does not confuse accented Vietnamese or shared words with English',()=>{
  const l=mockAlgebraLesson();l.analysis.constraints=['An và Bình so sánh hai tổng do các lượt trước tạo ra.'];
  expect(cleanLanguage(l).feedback).toEqual([]);
 });
});
