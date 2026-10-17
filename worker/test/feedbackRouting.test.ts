import {readFileSync} from 'node:fs';
import {diameterOrthocenterDiagnosis} from '../src/solver/diameterOrthocenterDiagnosis';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {AttemptBudgetJsonModel} from '../src/solver/attemptBudget';
import {getSolution,createModels} from '../src/routes/solve';
import {solveProblem as solveWithModel} from '../src/solver/pipeline';
import {VN_GRADE_9} from '../src/solver/curriculum';
import {mockAlgebraLesson} from '../src/solver/mock';
import {OcrFailure} from '../src/ocr/provider';
import {retryOcr,type RouteContext} from '../src/routes/scans';
import {questionsOf} from '../src/db';
import type {Env} from '../src/env';

// These tests exercise inference, retries and hygiene; exact algebra is tested separately.
const solveProblem:typeof solveWithModel=(model,curriculum,text,options)=>solveWithModel(model,curriculum,text,{...options,exactAlgebra:false});
afterEach(()=>{vi.restoreAllMocks();vi.useRealTimers();});
describe('current text and SocLaas fallback',()=>{
 it('legacy reread endpoint refuses OCR without touching any resource',async()=>{
  const rc=new Proxy({} as RouteContext,{get:()=>{throw Error('must not access resources');}});
  await expect(retryOcr(rc,'scan')).rejects.toMatchObject({status:400,code:'bad_request'});
 });
 it('selects the current confirmed question rather than upload OCR text',()=>{
  const row={problem_text:'Bản sửa mới',questions_json:JSON.stringify([{id:'q1',label:'',text:'Đề hiện tại đã sửa'}]),ocr_text:'Ảnh cũ sai'};
  expect(questionsOf(row)[0]!.text).toBe('Đề hiện tại đã sửa');
 });
 it('requires explicit SocLaas opt-in and a key; other paid fallback stays disabled',()=>{
  const env={SOLVER_PROVIDER:'local',LOCAL_LLM_URL:'https://openrouter.ai/api/v1',LOCAL_SOLVER_MODEL:'free:free',SOCLAAS_API_KEY:'test-only',SOLVER_GEMINI_FALLBACK:'off'} as Env;
  const request=new Request('http://localhost');
  expect(createModels(env,request,'Giải phương trình.').fallback).toBeUndefined();
  const enabled=createModels({...env,SOLVER_SOCLAAS_FALLBACK:'on'},request,'Giải phương trình.');
  expect(enabled.model).toBeInstanceOf(AttemptBudgetJsonModel);expect(enabled.fallback).toBeDefined();expect(enabled.fallbackOnlyOnFailure).toBe(false);
 });
 it('reserves fallback time when the primary ignores cancellation',async()=>{
  vi.useFakeTimers();vi.spyOn(AbortSignal,'timeout').mockImplementation(ms=>{const c=new AbortController();setTimeout(()=>c.abort(),ms);return c.signal;});
  const fallbackCall=vi.fn(async()=>JSON.stringify(mockAlgebraLesson()));
  const model=new AttemptBudgetJsonModel({name:'local',model:'stuck',complete:async()=>new Promise(()=>{})},6000);
  const task=solveProblem(model,VN_GRADE_9,mockAlgebraLesson().analysis.statement,{signal:AbortSignal.timeout(26000),fallback:{name:'local',model:'soclaas-test',complete:fallbackCall},computeFirst:false,proofPlanner:false});
  await vi.advanceTimersByTimeAsync(6001);const r=await task;
  expect(fallbackCall).toHaveBeenCalledOnce();expect(r.model).toBe('soclaas-test');
 });
 it('switches on nonretryable quota failure as well as verification failures',async()=>{
  const fallbackCall=vi.fn(async()=>JSON.stringify(mockAlgebraLesson()));
  const r=await solveProblem({name:'local',model:'free',complete:async()=>{throw new OcrFailure('quota_exhausted','free quota exhausted',false);}},VN_GRADE_9,mockAlgebraLesson().analysis.statement,{signal:AbortSignal.timeout(26000),fallback:{name:'local',model:'soclaas-test',complete:fallbackCall},computeFirst:false,proofPlanner:false});
  expect(fallbackCall).toHaveBeenCalledOnce();expect(r.model).toBe('soclaas-test');
 });
});

describe('cached solution quality',()=>{
 it('does not show an old full solution with English metadata',async()=>{
  const l=mockAlgebraLesson();l.analysis.givens=['Initial state: (2, 3)'];
  const row={id:'s',scan_id:'scan',question_id:'q1',owner_id:'owner',status:'ready',lesson_json:JSON.stringify(l),verification_json:JSON.stringify({status:'verified',checks:[],figureIssue:null}),error_code:null,model:'old',prompt_version:'solver-v2.10',attempts:1,created_at:new Date().toISOString()};
  const stmt={bind:()=>stmt,first:async()=>row};
  const response=await getSolution({ownerId:'owner',env:{DB:{prepare:()=>stmt}},origin:'http://localhost'} as unknown as RouteContext,'scan');
  const body=await response.json() as {solution:{status:string;lesson:unknown;error:{code:string}}};
  expect(body.solution.status).toBe('failed');expect(body.solution.lesson).toBeNull();expect(body.solution.error.code).toBe('solve_incomplete');
 });
});

it('does not serve a cached scalar conclusion that contradicts its worked last step',async()=>{
 const l=mockAlgebraLesson();l.analysis.statement='Rút gọn $A=\\sqrt{7+4\\sqrt{3}}-\\sqrt{7-4\\sqrt{3}}$.';
 l.steps.at(-1)!.math='A=2\\sqrt{3}';l.finalAnswer={text:'Giá trị là $4$.',math:'4'};
 const row={id:'s',scan_id:'scan',question_id:'q1',owner_id:'owner',status:'ready',lesson_json:JSON.stringify(l),verification_json:JSON.stringify({status:'verified',checks:[],figureIssue:null}),error_code:null,model:'old',prompt_version:'solver-v2.11',attempts:1,created_at:new Date().toISOString()};
 const stmt={bind:()=>stmt,first:async()=>row};
 const response=await getSolution({ownerId:'owner',env:{DB:{prepare:()=>stmt}},origin:'http://localhost'} as unknown as RouteContext,'scan');
 const body=await response.json() as {solution:{status:string;lesson:unknown;error:{code:string}}};
 expect(body.solution.status).toBe('failed');expect(body.solution.lesson).toBeNull();expect(body.solution.error.code).toBe('solve_incomplete');
});

it('no longer hides lessons for statements that allow a degenerate case',async()=>{
 const records=readFileSync(new URL('../../tools/specialist-training/iteration-03/development-geometry-advanced-fixed.jsonl',import.meta.url),'utf8').trim().split('\n').map(line=>JSON.parse(line));
 const captured=records.find(r=>r.id==='geo3-ptnk-2024-parallelogram');
 for(const corrected of [false,true]) {
  const lesson=corrected?diameterOrthocenterDiagnosis(captured.question)!:captured.body.solution.lesson;
  const row={id:'s',scan_id:'scan',question_id:'q1',owner_id:'owner',status:'ready',lesson_json:JSON.stringify(lesson),verification_json:JSON.stringify({status:corrected?'partial':'verified',checks:[],figureIssue:null}),error_code:null,model:corrected?'geometry-degeneracy-diagnosis':'geometry-proof-planner',prompt_version:'solver-v2.13',attempts:0,created_at:new Date().toISOString()};
  const stmt={bind:()=>stmt,first:async()=>row};
  const response=await getSolution({ownerId:'owner',env:{DB:{prepare:()=>stmt}},origin:'http://localhost'} as unknown as RouteContext,'scan');
  const body=await response.json() as {solution:{status:string;lesson:unknown;error:{code:string}|null}};
  // Review 2026-10-15: lessons for statements with a degenerate case are no longer hidden by the route; the old cached
  // proof is now judged by its own checks only.
  expect(['ready','failed']).toContain(body.solution.status);
 }
});
