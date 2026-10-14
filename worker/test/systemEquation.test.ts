import {solveProblem} from '../src/solver/pipeline';
import {VN_GRADE_9} from '../src/solver/curriculum';
import type {JsonModel} from '../src/solver/llm';
import {describe,it,expect} from 'vitest';
import {exactTwoVariableSystem,verifySystemCertificate,systemLineParameters,type SystemCertificate} from '../../shared/src/rationalPolynomial';
import {systemEquationLesson} from '../src/solver/systemEquation';
import {latexFeedback} from '../src/solver/latexCheck';
import {cleanLanguage} from '../../shared/src/language';
import {evalRelation} from '../../shared/src/expr';
const value=(r:SystemCertificate['solutions'][number][number])=>Number(r.u.n)/Number(r.u.d)+Number(r.v.n)/Number(r.v.d)*Math.sqrt(Number(r.radicand));
describe('complete real two-variable systems',()=>{
 it('recovers independently constructed ordered integer pairs from sum and product',()=>{
  for(let a=-7;a<=7;a++)for(let b=-7;b<=7;b++){
   const c=exactTwoVariableSystem([`x+y=${a+b}`,`xy=${a*b}`])!;expect(c).not.toBeNull();expect(verifySystemCertificate(c)).toBe(true);
   const expected=a===b?[[a,b]]:[[a,b],[b,a]];expect(c.solutions.map(pair=>pair.map(value)).sort()).toEqual(expected.sort());
  }
 });
 it('handles non-real and irrational pairs',()=>{
  expect(exactTwoVariableSystem(['x+y=0','xy=1'])!.solutions).toEqual([]);
  const c=exactTwoVariableSystem(['x+y=1','xy=-1'])!;expect(c.solutions).toHaveLength(2);expect(verifySystemCertificate(c)).toBe(true);
  for(const pair of c.solutions){const [x,y]=pair.map(value);expect(Math.abs(x!+y!-1)).toBeLessThan(1e-10);expect(Math.abs(x!*y!+1)).toBeLessThan(1e-10);}
 });
 it('solves an independently generated grid of nonsingular systems and satisfies both original equations',()=>{
  for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++)for(let d=-2;d<=2;d++)for(let e=-2;e<=2;e++){
   if(a*e-b*d===0)continue;const equations=[`${a}x+(${b})y=${a*3-b*2}`,`${d}x+(${e})y=${d*3-e*2}`];
   const c=exactTwoVariableSystem(equations)!;expect(c).not.toBeNull();expect(c.solutions.map(pair=>pair.map(value))).toEqual([[3,-2]]);expect(verifySystemCertificate(c)).toBe(true);
   expect(equations.every(eq=>evalRelation(eq,{x:3,y:-2})===true)).toBe(true);
  }
 });
 it.each([
 [['x+y=3','2x+2y=6'],'line'],[['x+y=3','2x+2y=7'],'none'],
 [['x+y-y=1','2x+y-y=2'],'line'],[['x+y-y=1','2x+y-y=3'],'none'],
 [['x-x+y-y=0','x-x+y-y=0'],'plane'],[['x-x+y-y=1','x+y=0'],'none'],
 ])('classifies dependent/contradictory system %s',(eqs,infinite)=>{
  const c=exactTwoVariableSystem(eqs)!;expect(c).not.toBeNull();expect(c.infinite).toBe(infinite);expect(verifySystemCertificate(c)).toBe(true);
 });
 it.each(['x+y=9\\\\xy=14','2x+y=7\\\\x-y=2','x+y=3\\\\2x+2y=6','x+y=3\\\\2x+2y=7','x+y=0\\\\xy=1','x+y=1\\\\xy=-1'])('renders all reasoning for %s',body=>{
  const r=systemEquationLesson(`Giải hệ phương trình $\\begin{cases}${body}\\end{cases}$.`)!;expect(r).not.toBeNull();expect(latexFeedback(r.lesson)).toEqual([]);expect(cleanLanguage(r.lesson).feedback).toEqual([]);expect(r.lesson.steps.at(-1)!.explanation).toContain('Vậy');
 });
 it('uses the exact system proof in the real pipeline without inference',async()=>{
  const unavailable:JsonModel={name:'none',model:'none',complete:async()=>{throw Error('no inference');}};
  const r=await solveProblem(unavailable,VN_GRADE_9,'Giải hệ phương trình $\\begin{cases}x+y=9\\\\xy=14\\end{cases}$.',{signal:AbortSignal.timeout(26000)});
  expect(r.model).toBe('deterministic-algebra');expect(r.verification.status).toBe('verified');expect(r.lesson.finalAnswer.text).toContain('(2;7)');
 });
 it('the displayed infinite-family rule satisfies both originals for independent parameter choices',()=>{
  for(const equations of [['x+y=3','2x+2y=6'],['x+y-y=1','2x+y-y=2'],['x-x+y=4','2y+x-x=8']]){
   const c=exactTwoVariableSystem(equations)!;expect(c.infinite).toBe('line');const p=systemLineParameters(c.line!);
   const numeric=(f:typeof p.x0)=>Number(f.n)/Number(f.d);
   for(let t=-7;t<=7;t++){const env={x:numeric(p.x0)+numeric(p.xt)*t,y:numeric(p.y0)+numeric(p.yt)*t};expect(equations.every(eq=>evalRelation(eq,env)===true)).toBe(true);}
  }
 });
 it('rejects altered ordered pairs and omitted original equations',()=>{
  const c=exactTwoVariableSystem(['x+y=9','xy=14'])!;c.solutions.pop();expect(verifySystemCertificate(c)).toBe(false);
 });
 it.each([[['x^2+y=0','x+y=1']], [['x/y=1','x+y=2']], [['xy+x=2','x+y=3']]])('declines unsupported systems %s',eqs=>expect(exactTwoVariableSystem(eqs)).toBeNull());
});
