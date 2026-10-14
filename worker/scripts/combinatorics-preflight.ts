import {readFileSync,writeFileSync} from 'node:fs';
import {certifiedCombinatoricsLesson} from '../src/solver/certifiedCombinatorics';
import {boardSearchLesson,verifyBoardSearch} from '../src/solver/boardSearchGame';
import {takeAwayLesson,verifyGameCertificate} from '../src/solver/takeAwayGame';
import {latexFeedback} from '../src/solver/latexCheck';
import {cleanLanguage} from '../../shared/src/language';
import {tidy} from '../src/solver/pipeline';
import {verifyLesson} from '../../shared/src/verify';
const cases=JSON.parse(readFileSync('tools/specialist-training/iteration-03/cases.json','utf8')).filter((c:any)=>c.domain==='combinatorics'&&c.split!=='held_out');
const result=[];const warnings:string[]=[];const originalWarn=console.warn;
for(const c of cases){
 console.warn=(...args)=>warnings.push(args.join(' '));const start=warnings.length;
 try {
  const proof=certifiedCombinatoricsLesson(c.text),board=boardSearchLesson(c.text),game=takeAwayLesson(c.text);
  const lesson=proof?.lesson??board?.lesson??game?.lesson,certificate=proof?.verify()??(board?board.certificates.every((p,i)=>verifyBoardSearch(p,i===0?4:2)):game?verifyGameCertificate(game.certificate):false);
  const cleaned=lesson?cleanLanguage(tidy(lesson)):null,checked=cleaned?verifyLesson(cleaned.lesson,{problemText:c.text}):null;
  result.push({id:c.id,implemented:!!lesson,certificate,latex:cleaned?latexFeedback(cleaned.lesson):[],language:cleaned?.feedback??[],verification:checked?.verification??null,feedback:checked?.feedback??[],rendererWarnings:warnings.slice(start)});
 }finally{console.warn=originalWarn;}
}
writeFileSync('tools/specialist-training/iteration-03/combinatorics-source-preflight.json',JSON.stringify({scope:'Normalized source lessons only; not app execution or independent mathematics',result},null,2)+'\n');
const bad=result.filter(r=>!r.implemented||!r.certificate||r.verification?.status==='unverified'||r.latex.length||r.language.length||r.rendererWarnings.length);console.log(JSON.stringify({total:result.length,passed:result.length-bad.length,bad},null,2));if(bad.length)process.exitCode=1;
