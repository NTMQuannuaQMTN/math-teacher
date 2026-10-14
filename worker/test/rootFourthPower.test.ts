import {describe,it,expect} from 'vitest';
import {exactRootFourthPower,verifyRootFourthPowerCertificate,fractionLatex} from '../../shared/src/rationalPolynomial';
import {rootFourthPowerLesson} from '../src/solver/rootFourthPower';
import {latexFeedback} from '../src/solver/latexCheck';
import {cleanLanguage} from '../../shared/src/language';
describe('universal fourth-power bounds by a verified complete-square decomposition',()=>{
 it('proves the captured root-power inequality with a stronger bound6',()=>{
  const c=exactRootFourthPower('x^2-2(m+1)x+2m=0','m','x_1^4+x_2^4>9/2')!;expect(c).not.toBeNull();expect(verifyRootFourthPowerCertificate(c)).toBe(true);expect(fractionLatex(c.lowerBound)).toBe('6');
 });
 it('generalizes to independently known roots m+s,m-s rather than fitting the reported coefficients',()=>{
  for(let s=1;s<=5;s++){
   const c=exactRootFourthPower(`(x-m)^2-${s*s}=0`,'m',`x_1^4+x_2^4>${s**4}`)!;expect(c).not.toBeNull();expect(verifyRootFourthPowerCertificate(c)).toBe(true);
   for(let doubled=-10;doubled<=10;doubled++){const m=doubled/2,total=(m+s)**4+(m-s)**4;expect(total).toBeGreaterThan(s**4);expect(total).toBeGreaterThanOrEqual(2*s**4);}
  }
 });
 it('declines a lower bound it has not established and a missing real-root condition',()=>{
  expect(exactRootFourthPower('x^2-2(m+1)x+2m=0','m','x_1^4+x_2^4>7')).toBeNull();expect(exactRootFourthPower('x^2+m=0','m','x_1^4+x_2^4>1')).toBeNull();
 });
 it('rejects a forged universal lower bound',()=>{const c=exactRootFourthPower('(x-m)^2-1=0','m','x_1^4+x_2^4>1')!;c.lowerBound.n=3n;expect(verifyRootFourthPowerCertificate(c)).toBe(false);});
 it('renders all root identities, expansion and positivity reasons',()=>{
  const r=rootFourthPowerLesson('Cho phương trình $x^2-2(m+1)x+2m=0$ ($m$ là tham số). Chứng minh $x_1^4+x_2^4>\\frac92$.')!;
  expect(r).not.toBeNull();expect(latexFeedback(r.lesson)).toEqual([]);expect(cleanLanguage(r.lesson).feedback).toEqual([]);expect(r.lesson.steps[3]!.math).toContain('\\ge6>');
 });
});
