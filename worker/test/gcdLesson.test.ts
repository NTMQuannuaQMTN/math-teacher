import {describe,it,expect} from 'vitest';
import {gcdLesson,verifyGcdCertificate} from '../src/solver/gcdLesson';
import {latexFeedback} from '../src/solver/latexCheck';
import {cleanLanguage} from '../../shared/src/language';
import {verifyLesson} from '../../shared/src/verify';
describe('gcd possibilities and ordered lcm pairs have explicit witnesses',()=>{
 it('shows every possible affine gcd and an actual n attaining each',()=>{
  const text='Cho số nguyên $n$. Tìm tất cả các giá trị có thể của ước chung lớn nhất của $n+2$ và $n+8$.',r=gcdLesson(text)!;
  expect(r).not.toBeNull();if(!('difference' in r.certificate))throw Error('wrong kind');expect(r.certificate.values).toEqual([1,2,3,6]);expect(r.certificate.witnesses).toEqual([-1,0,1,4]);
  expect(verifyGcdCertificate(r.certificate)).toBe(true);expect(latexFeedback(r.lesson)).toEqual([]);expect(cleanLanguage(r.lesson).feedback).toEqual([]);expect(verifyLesson(r.lesson,{problemText:text}).verification.status).not.toBe('unverified');
  // The failed prose used common multiples: 9 is a multiple of3,9 but not of their difference6.
  // The corrected argument must discuss common DIVISORS, as the Euclidean identity requires.
  expect(9%3===0&&9%9===0&&9%6!==0).toBe(true);
  expect(r.lesson.steps[0]!.explanation).toContain('là ước chung');expect(r.lesson.steps[0]!.explanation).not.toContain('chia hết cho cả');
 });
 it('a renamed index cannot collide with the introduced gcd variable',()=>{
  const r=gcdLesson('Cho số nguyên $d$. Tìm tất cả các giá trị có thể của ước chung lớn nhất của $d+2$ và $d+8$.')!;
  expect(r.lesson.steps[0]!.explanation).toContain('Gọi $g=');expect(verifyGcdCertificate(r.certificate)).toBe(true);
 });
 it('retains positivity of every witness and handles a singleton divisor',()=>{
  const r=gcdLesson('Cho số nguyên dương $t$. Tìm tất cả các giá trị có thể của ước chung lớn nhất của $t+5$ và $t+6$.')!;
  if(!('difference' in r.certificate))throw Error('wrong kind');expect(r.certificate.values).toEqual([1]);expect(r.certificate.witnesses.every(n=>n>0)).toBe(true);expect(verifyGcdCertificate(r.certificate)).toBe(true);
 });
 it('does not silently define gcd(0,0), and retains a valid equal-positive family',()=>{
  expect(gcdLesson('Cho số nguyên $n$. Tìm tất cả các giá trị có thể của ước chung lớn nhất của $n+2$ và $n+2$.')).toBeNull();
  const r=gcdLesson('Cho số nguyên dương $n$. Tìm tất cả các giá trị có thể của ước chung lớn nhất của $n+2$ và $n+2$.')!;
  expect(r.lesson.finalAnswer.text).toContain('d\\ge3');expect(verifyGcdCertificate(r.certificate)).toBe(true);
 });
 it('finds every ordered coprime factor pair, including swapped pairs',()=>{
  const r=gcdLesson('Tìm tất cả các cặp số nguyên dương $(a,b)$ có ước chung lớn nhất bằng $6$ và bội chung nhỏ nhất bằng $180$.')!;
  if(!('pairs' in r.certificate))throw Error('wrong kind');expect(r.certificate.pairs).toEqual([[6,180],[12,90],[18,60],[30,36],[36,30],[60,18],[90,12],[180,6]]);expect(verifyGcdCertificate(r.certificate)).toBe(true);expect(latexFeedback(r.lesson)).toEqual([]);expect(cleanLanguage(r.lesson).feedback).toEqual([]);
  expect(verifyGcdCertificate({...r.certificate,pairs:r.certificate.pairs.slice(1)})).toBe(false);
 });
 it('same gcd/lcm permits only one pair, while inconsistent values permit none',()=>{
  const equal=gcdLesson('Tìm tất cả các cặp số nguyên dương $(a,b)$ có ước chung lớn nhất bằng $6$ và bội chung nhỏ nhất bằng $6$.')!;
  if(!('pairs' in equal.certificate))throw Error('wrong kind');expect(equal.certificate.pairs).toEqual([[6,6]]);
  const impossible=gcdLesson('Tìm tất cả các cặp số nguyên dương $(a,b)$ có ước chung lớn nhất bằng $6$ và bội chung nhỏ nhất bằng $10$.')!;
  expect(impossible.lesson.finalAnswer.text).toContain('không có');expect(verifyGcdCertificate(impossible.certificate)).toBe(true);
 });
 it('does not drop additional restrictions',()=>{
  expect(gcdLesson('Tìm tất cả các cặp số nguyên dương $(a,b)$ có ước chung lớn nhất bằng $6$ và bội chung nhỏ nhất bằng $180$, biết $a<b$.')).toBeNull();
 });
});
