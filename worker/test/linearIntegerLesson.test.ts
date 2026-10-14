import {describe,it,expect} from 'vitest';
import {linearIntegerLesson,verifyLinearIntegerCertificate} from '../src/solver/linearIntegerLesson';
import {latexFeedback} from '../src/solver/latexCheck';
import {cleanLanguage} from '../../shared/src/language';
const task=(equation:string,positive=false)=>`Tìm tất cả các cặp số nguyên${positive?' dương':''} $(x,y)$ thỏa mãn $${equation}$.`;
describe('linear integer equations have proved complete parameter families',()=>{
 it('constructs an actual solution and all signed integer solutions',()=>{
  const r=linearIntegerLesson(task('7x+11y=1'))!;expect(r).not.toBeNull();expect(r.certificate.gcd).toBe(1);expect(verifyLinearIntegerCertificate(r.certificate)).toBe(true);
  for(let x=-80;x<=80;x++)for(let y=-80;y<=80;y++)if(7*x+11*y===1){const t=(x-r.certificate.x0)/r.certificate.dx;expect(Number.isInteger(t)).toBe(true);expect(y).toBe(r.certificate.y0+r.certificate.dy*t);}
  expect(latexFeedback(r.lesson)).toEqual([]);expect(cleanLanguage(r.lesson).feedback).toEqual([]);
 });
 it('intersects exact positive parameter bounds, with a real in-domain witness',()=>{
  const r=linearIntegerLesson(task('6x+9y=30',true))!;expect(r.certificate.kind).toBe('family');expect(r.certificate.witness).toEqual([2,2]);expect(r.certificate.lower).toBe(r.certificate.upper);
  expect(verifyLinearIntegerCertificate(r.certificate)).toBe(true);
  const none=linearIntegerLesson(task('6x+9y=6',true))!;expect(none.certificate.kind).toBe('none');expect(none.certificate.witness).toBeNull();expect(verifyLinearIntegerCertificate(none.certificate)).toBe(true);
  const infinite=linearIntegerLesson(task('3x-5y=1',true))!;expect(infinite.certificate.kind).toBe('family');expect(verifyLinearIntegerCertificate(infinite.certificate)).toBe(true);expect(infinite.certificate.witness!.every(v=>v>0)).toBe(true);
 });
 it('uses a gcd obstruction for impossible equations over all integers',()=>{
  const r=linearIntegerLesson(task('6x+9y=20'))!;expect(r.certificate.kind).toBe('none');expect(r.certificate.gcd).toBe(3);expect(verifyLinearIntegerCertificate(r.certificate)).toBe(true);expect(r.lesson.finalAnswer.text).toContain('không có');
 });
 it('matches complete finite positive solution sets across coefficient and boundary variations',()=>{
  for(let a=1;a<=5;a++)for(let b=1;b<=5;b++)for(let c=1;c<=40;c++){
   // Positive coefficients prove x<=c/a and y<=c/b. This enumeration is
   // exhaustive for these tasks, independently of the parameter algorithm.
   const expected:string[]=[];
   for(let x=1;x<=Math.floor(c/a);x++)for(let y=1;y<=Math.floor(c/b);y++)if(a*x+b*y===c)expected.push(`${x},${y}`);
   const result=linearIntegerLesson(task(`${a}x+${b}y=${c}`,true))!;
   expect(result,`${a},${b},${c}`).not.toBeNull();
   const cert=result.certificate,actual:string[]=[];
   if(cert.kind==='family'){
    expect(cert.lower).not.toBeNull();expect(cert.upper).not.toBeNull();
    for(let t=cert.lower!;t<=cert.upper!;t++)actual.push(`${cert.x0+cert.dx*t},${cert.y0+cert.dy*t}`);
   }
   expect(actual.sort(),`${a}x+${b}y=${c}`).toEqual(expected.sort());
   expect(verifyLinearIntegerCertificate(cert)).toBe(true);
  }
 });
 it.each(['0x+5y=15','-4x+0y=12','0x+0y=0','0x+0y=3'])('handles zero coefficients without division by0: %s',(equation)=>{
  for(const positive of [false,true]){const r=linearIntegerLesson(task(equation,positive))!;expect(r).not.toBeNull();expect(verifyLinearIntegerCertificate(r.certificate)).toBe(true);expect(latexFeedback(r.lesson)).toEqual([]);}
 });
 it('rejects tampered family directions, missing bounds, wrong witnesses and gcd claims',()=>{
  const c=linearIntegerLesson(task('6x+9y=30',true))!.certificate;
  expect(verifyLinearIntegerCertificate({...c,dx:c.dx+1})).toBe(false);expect(verifyLinearIntegerCertificate({...c,gcd:1})).toBe(false);
  expect(verifyLinearIntegerCertificate({...c,lower:null})).toBe(false);expect(verifyLinearIntegerCertificate({...c,witness:[0,0]})).toBe(false);
 });
 it('proves linearity symbolically rather than fitting three sample points',()=>{
  expect(linearIntegerLesson(task('7x+11y+x(x-1)=1'))).toBeNull();
  expect(linearIntegerLesson(task('7x+11y+xy=1'))).toBeNull();
  expect(linearIntegerLesson(task('(x^2-x^2)/x+11y=1'))).toBeNull();
  expect(linearIntegerLesson(task('7x+11y=1')+' Và $x>10$.')).toBeNull();
 });
 it('names the fixed nonpositive coordinate even when the free coordinate has a feasible bound',()=>{
  const r=linearIntegerLesson(task('-4x+0y=12',true))!;
  expect(r.certificate.kind).toBe('none');expect(r.lesson.steps.map(s=>s.explanation).join('\n')).toContain('$x=-3\\le0$');expect(r.lesson.steps.map(s=>s.explanation).join('\n')).not.toContain('Hai bất đẳng thức cho $t\\ge1$, không có tham số nguyên chung');
  const conflicting=linearIntegerLesson(task('6x+9y=6',true))!;expect(conflicting.lesson.steps.map(s=>s.explanation).join('\n')).toContain('$t\\ge1,\\ t\\le0$');
 });
});
