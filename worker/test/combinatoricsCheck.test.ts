import {describe,expect,it} from 'vitest';
import {evalExpression} from '../../shared/src/expr';
import {runAnswerCheck,isTrivialCheck} from '../../shared/src/verify';
function count(n:number,k:number):number{
 let total=0;for(let mask=0;mask<2**n;mask++){let bits=0;for(let i=0;i<n;i++)bits+=(mask>>i)&1;if(bits===k)total++;}return total;
}
describe('bounded combination arithmetic checked against independent subsets',()=>{
 it('checks every n,k up to ten',()=>{for(let n=0;n<=10;n++)for(let k=0;k<=n;k++)expect(evalExpression(`C(${n},${k})`)).toBeCloseTo(count(n,k),8);});
 it('handles LaTeX and complementary counting without order overcounting',()=>{
  expect(evalExpression(String.raw`\binom{9}{3}-\binom{5}{3}`)).toBeCloseTo(74,8);
  const c={kind:'substitute' as const,statements:['C(9,3)-C(5,3)'],assignments:[],expected:'74'};
  expect(isTrivialCheck(c)).toBe(false);expect(runAnswerCheck(c).passed).toBe(true);
  expect(runAnswerCheck({...c,expected:'444'}).passed).toBe(false);
 });
 it.each(['C(1000000,3)','C(5,6)','C(9,-1)','C(n,3)','C(3.5,2)','C(2,1);process.exit()'])('rejects unsupported or unsafe %s',s=>{expect(()=>evalExpression(s)).toThrow();});
});
