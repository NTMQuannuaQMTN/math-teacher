import {describe,it,expect} from 'vitest';
import {exactRationalInequality,verifyInequalityCertificate,intervalLatex,fraction,compareRoots,type InequalityCertificate} from '../../shared/src/rationalPolynomial';
import {rationalInequalityLesson} from '../src/solver/rationalInequality';
import {latexFeedback} from '../src/solver/latexCheck';
import {cleanLanguage} from '../../shared/src/language';
const contains=(c:InequalityCertificate,n:number,d=1)=>{
 const r={u:fraction(BigInt(n),BigInt(d)),v:fraction(0n),radicand:0n};
 return c.intervals.some(i=>(!i.lower||compareRoots(r,i.lower)>0||i.lowerClosed&&compareRoots(r,i.lower)===0)&&(!i.upper||compareRoots(r,i.upper)<0||i.upperClosed&&compareRoots(r,i.upper)===0));
};
describe('exact complete inequality sign charts',()=>{
 it.each([
 ['(2x-3)/(x+1)<=0',['(-1;\\frac{3}{2}]']],['x^2<=0',['\\{0\\}']],
 ['x^2<0',[]],['x^2>=0',['(-\\infty;+\\infty)']],
 ['(x^2-1)/(x-1)>=0',['[-1;1)','(1;+\\infty)']],
 ['1/(x^2-1)>0',['(-\\infty;-1)','(1;+\\infty)']],
 ['(x-x)/(x-2)<=0',['(-\\infty;2)','(2;+\\infty)']],
 ['x^2-2<=0',['[-\\sqrt{2};\\sqrt{2}]']],
 ['(x-1)^2/(x+2)>=0',['(-2;+\\infty)']],
 ])('finds all intervals and isolated points of %s',(eq,expected)=>{
  const c=exactRationalInequality(eq)!;expect(c).not.toBeNull();expect(verifyInequalityCertificate(c)).toBe(true);expect(c.intervals.map(intervalLatex)).toEqual(expected);
 });
 it('matches independent direct substitution across linear fractional families and all endpoint types',()=>{
  for(let a=-5;a<=5;a++)for(let b=-5;b<=5;b++)for(const rel of ['<','<=','>','>=']){
   const c=exactRationalInequality(`(x-(${a}))/(x-(${b}))${rel}0`)!;expect(c).not.toBeNull();
   for(let n=-32;n<=32;n++){const x=n/4,y=(x-a)/(x-b);const expected=x!==b&&(rel==='<'?y<0:rel==='<='?y<=0:rel==='>'?y>0:y>=0);expect(contains(c,n,4),`${a},${b},${rel},${x}`).toBe(expected);}
  }
 });
 it('rejects missing holes and altered endpoint flags',()=>{
  const c=exactRationalInequality('(x^2-1)/(x-1)>=0')!;c.intervals[0]!.upperClosed=true;expect(verifyInequalityCertificate(c)).toBe(false);
 });
 it('renders Vietnamese reasoning and sign charts with original excluded endpoints',()=>{
  const r=rationalInequalityLesson('Giải bất phương trình $\\frac{2x-3}{x+1}\\le0$.')!;expect(r).not.toBeNull();expect(latexFeedback(r.lesson)).toEqual([]);expect(cleanLanguage(r.lesson).feedback).toEqual([]);expect(r.lesson.steps.at(-1)!.explanation).toContain('Vậy');
 });
 it.each(['x^3>0','sqrt(x)>1','x+y<=0','x/(x-x)>0'])('declines unsupported input %s',eq=>expect(exactRationalInequality(eq)).toBeNull());
});
