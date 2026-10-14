import {numberTheoryLesson} from '../../worker/src/solver/numberTheory';
import {ModelLessonSchema} from '../../shared/src/solution';
const failures=[];let matched=0;
for(let c=-200;c<=200;c++){
 const l=numberTheoryLesson(`Tìm tất cả các cặp số nguyên $(x,y)$ thỏa mãn $xy+2x+3y=${c}$.`);
 if(!l)continue;matched++;
 const r=ModelLessonSchema.safeParse(l);
 if(!r.success)failures.push({constant:c,issues:r.error.issues.map(x=>({path:x.path,message:x.message}))});
}
console.log(JSON.stringify({matched,failures},null,2));
