import {describe,expect,it} from 'vitest';
import {certifiedNumberTheoryFamily} from '../src/solver/certifiedNumberTheoryFamilies';
import {latexFeedback} from '../src/solver/latexCheck';
import {cleanLanguage} from '../../shared/src/language';
import {verifyLesson} from '../../shared/src/verify';
import {problemDomains} from '../../shared/src/knowledgeBase';

const questions=[
 'Tìm số dư khi chia $2^{2026}$ cho $7$ và chứng minh.',
 'Tính $\\gcd(2^{12}-1,2^{18}-1)$ và giải thích bằng thuật toán Euclid.',
 'Tìm tất cả các cặp số nguyên $(x,y)$ thỏa mãn $x^2+y^2=25$. Chứng minh không bỏ sót nghiệm.',
 'Chứng minh số có đúng $2026$ chữ số $1$ liên tiếp trong hệ thập phân chia hết cho $11$.',
];

describe('certified number-theory families',()=>{
 it.each(questions)('builds a complete verified lesson for %s',(question)=>{
  const result=certifiedNumberTheoryFamily(question);
  expect(result).not.toBeNull();
  expect(result?.verify()).toBe(true);
  expect(result?.lesson.steps.length).toBe(4);
  expect(result?.lesson.steps.every(step=>Boolean(step.reason))).toBe(true);
  expect(latexFeedback(result!.lesson)).toEqual([]);
  expect(cleanLanguage(result!.lesson).feedback).toEqual([]);
 });

 it('generalizes bounded parameters',()=>{
  expect(certifiedNumberTheoryFamily('Tìm số dư khi chia $3^{25}$ cho $7$ và chứng minh.')?.lesson.finalAnswer.text).toContain('$3$');
  expect(certifiedNumberTheoryFamily('Tính $\\gcd(3^{8}-1,3^{12}-1)$ và giải thích bằng thuật toán Euclid.')?.lesson.finalAnswer.text).toContain('80');
  expect(certifiedNumberTheoryFamily('Tìm tất cả các cặp số nguyên $(x,y)$ thỏa mãn $x^2+y^2=5$. Chứng minh không bỏ sót nghiệm.')?.lesson.finalAnswer.text).toContain('$8$');
 });

 it('rejects odd repunit length and extra rules',()=>{
  expect(certifiedNumberTheoryFamily('Chứng minh số có đúng $7$ chữ số $1$ liên tiếp trong hệ thập phân chia hết cho $11$.')).toBeNull();
  expect(certifiedNumberTheoryFamily(`${questions[0]} Biết thêm số mũ là số nguyên tố.`)).toBeNull();
 });

 it('accepts equivalent Vietnamese operators and renamed integer variables',()=>{
  expect(certifiedNumberTheoryFamily('Dùng thuật toán Euclid để tìm UCLN của 3^{12}-1 và 3^{18}-1.')?.lesson.finalAnswer.text).toContain('728');
  const squares=certifiedNumberTheoryFamily('Liệt kê đầy đủ mọi cặp số nguyên có thứ tự (a,b) sao cho a^2+b^2=25 và chứng minh tính đầy đủ.');
  expect(squares?.lesson.steps.map(step=>step.math).join(' ')).toContain('(a,b)');
  expect(squares?.lesson.finalAnswer.text).toContain('12');
  expect(certifiedNumberTheoryFamily('Số tự nhiên viết bởi 2024 chữ số 1 có chia hết cho 11 không? Chứng minh câu trả lời.')?.verify()).toBe(true);
  const counted=certifiedNumberTheoryFamily('Có bao nhiêu cặp (u,v) nguyên thỏa u^2+v^2=50? Liệt kê chúng để chứng minh không thiếu.');
  expect(counted?.lesson.finalAnswer.text).toContain('12');
  expect(problemDomains('Có bao nhiêu cặp (u,v) nguyên thỏa u^2+v^2=50?')).toContain('number_theory');
  const checked=verifyLesson(counted!.lesson,{problemText:'Có bao nhiêu cặp (u,v) nguyên thỏa u^2+v^2=50? Liệt kê chúng để chứng minh không thiếu.'});
  expect(checked.verification,JSON.stringify(checked.verification)).not.toMatchObject({status:'unverified'});
 });
});
