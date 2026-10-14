import {readFileSync,writeFileSync} from 'node:fs';
import {solveProblem} from '../../../worker/src/solver/pipeline';
import {VN_GRADE_9} from '../../../worker/src/solver/curriculum';
import {normalizeProblemText} from '../../../shared/src/mathText';
import {problemKey} from '../../../worker/src/solver/problemKey';
import {sha256Hex} from '../../../worker/src/crypto';
import {CURRENT_LESSON_VERSION} from '../../../shared/src/lessonQuality';
import {auditLesson} from '../../../worker/scripts/lesson-audit';
const dir='tools/specialist-training/game-theory-02';
const scan=JSON.parse(readFileSync(dir+'/active-confirmed-scan.json','utf8'))[0];
const questions=JSON.parse(scan.questions_json),out=[];
const quote=(s:string)=>"'"+s.replace(/'/g,"''")+"'";
for(const id of ['q1','q2','q5']){
 const text=normalizeProblemText(questions.find((q:any)=>q.id===id).text),start=performance.now();
 const result=await solveProblem({name:'local',model:'unused',complete:async()=>{throw Error('No inference permitted in certified repair');}},VN_GRADE_9,text,{signal:AbortSignal.timeout(26000)});
 const audit=auditLesson(result.lesson);if(!audit.schemaValid||audit.languageErrors.length||audit.latexErrors.length)throw Error(JSON.stringify(audit));
 out.push({id,text,...result,audit,endToEndOfflineMs:performance.now()-start,problemHash:await sha256Hex(`${CURRENT_LESSON_VERSION}\n${text}`),problemKey:await problemKey(text),promptVersion:CURRENT_LESSON_VERSION});
}
writeFileSync(dir+'/live-repair-answers.json',JSON.stringify(out,null,2)+'\n');
const sql=out.map(r=>`UPDATE solutions SET lesson_json=${quote(JSON.stringify(r.lesson))}, verification_json=${quote(JSON.stringify(r.verification))}, problem_hash=${quote(r.problemHash)}, problem_key=${quote(r.problemKey)}, prompt_version=${quote(r.promptVersion)}, model=${quote(r.model)}, attempts=${r.attempts}, duration_ms=${r.durationMs}, error_code=NULL, status='ready', started_at=NULL, updated_at=${quote(new Date().toISOString())} WHERE scan_id='434848a5-4ebc-4d25-affb-05175e16f1d9' AND question_id=${quote(r.id)} AND prompt_version IN ('solver-v2.9','solver-v2.37','solver-v2.38','solver-v2.39') AND EXISTS(SELECT 1 FROM scans WHERE id=solutions.scan_id AND questions_json=${quote(scan.questions_json)});`).join('\n');
writeFileSync(dir+'/live-repair.sql',sql+'\n');
console.log(JSON.stringify(out.map(r=>({id:r.id,model:r.model,ms:r.endToEndOfflineMs,steps:r.lesson.steps.length,audit:r.audit}))));
