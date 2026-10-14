import {describe,it,expect} from 'vitest';
import {compareRoots,fraction,type ExactRoot} from '../../shared/src/rationalPolynomial';
const root=(u:number,v:number,d:number):ExactRoot=>({u:fraction(BigInt(u)),v:fraction(BigInt(v)),radicand:BigInt(d)});
describe('exact ordering of independently represented quadratic boundaries',()=>{
 it('recognizes equal values with different radicands',()=>{
  expect(compareRoots(root(1,2,2),root(1,1,8))).toBe(0);
  expect(compareRoots(root(0,-2,3),root(0,-1,12))).toBe(0);
 });
 it('agrees with well-separated independently computed numerical values across signed surds',()=>{
  const samples:ExactRoot[]=[];for(const d of [2,3,5,7])for(let u=-3;u<=3;u++)for(let v=-2;v<=2;v++)samples.push(root(u,v,d));
  const value=(r:ExactRoot)=>Number(r.u.n)/Number(r.u.d)+Number(r.v.n)/Number(r.v.d)*Math.sqrt(Number(r.radicand));
  for(const a of samples)for(const b of samples){const diff=value(a)-value(b);if(Math.abs(diff)<1e-10)continue;expect(compareRoots(a,b)).toBe(diff<0?-1:1);}
 });
 it('resolves values on opposite sides of a close Pell approximation',()=>{
  expect(compareRoots(root(0,99,2),root(140,0,0))).toBe(1);
  expect(compareRoots(root(0,408,2),root(577,0,0))).toBe(-1);
 });
});
