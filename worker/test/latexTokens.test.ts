import {describe,it,expect} from 'vitest';
import {evalExpression} from '../../shared/src/expr';
import katex from 'katex';
describe('valid TeX single-token arguments have the same mathematical meaning in checking',()=>{
 it.each([
 ['2\\sqrt3',2*Math.sqrt(3)],['\\sqrt12',2],['\\sqrt{12}',Math.sqrt(12)],
 ['\\sqrt 12',2],['\\sqrt x',3],['\\frac12',.5],['\\frac1{2}',.5],['\\frac{12}3',4],
 ['\\sqrt{7+4\\sqrt3}-\\sqrt{7-4\\sqrt3}',2*Math.sqrt(3)],
 ['\\frac1{\\sqrt4}',.5],
 ])('checks %s without assuming an unbraced multidigit argument',(source,expected)=>{
  expect(()=>katex.renderToString(source,{throwOnError:true})).not.toThrow();
  expect(evalExpression(source,{x:9})).toBeCloseTo(expected,12);
 });
 it('does not change unsupported command names into ordinary expressions',()=>{
  expect(()=>evalExpression('\\sqrtx',{})).toThrow();expect(()=>evalExpression('\\fracab',{})).toThrow();
 });
});
