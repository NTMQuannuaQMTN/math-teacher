import {describe,it,expect} from 'vitest';
import {lessonStore} from '../src/state/lessonProgress';
import {CURRENT_LESSON_VERSION} from '../../shared/src/lessonQuality';
import type {Solution} from '../../shared/src/solution';
function fixture():Solution {
 return {
  id:'test',scanId:'scan',questionId:'q1',status:'ready',createdAt:'2026-10-12T00:00:00Z',promptVersion:CURRENT_LESSON_VERSION,model:'test',attempts:0,error:null,verification:null,
  lesson:{
   analysis:{statement:'Giải $x=1$.',language:'vi',topic:'algebra',subtopic:'Phương trình',gradeLevel:9,withinCurriculum:true,concepts:[],techniques:[],givens:[],unknowns:[],constraints:[],status:'solvable',statusReason:null,interpretationNotes:[]},strategy:'Dùng phương trình đã cho.',
   hints:[{id:'h1',level:1,question:'Giá trị $x$ là bao nhiêu?',cue:null,explanation:'Phương trình cho $x=1$.',math:'x=1',stepId:'s1',focus:[]}],
   steps:[{id:'s1',title:'Kết luận',explanation:'Vậy $x=1$.',math:'x=1',reason:'Phương trình đã cho.',uses:[],geometryActions:[]}],finalAnswer:{text:'Vậy $x=1$.',math:'x=1'},answerChecks:[],figure:null,
  },
 };
}
describe('session lesson quality',()=>{
 it('keeps a current clean lesson and its hint progress',()=>{
  const s=fixture();lessonStore.putSolution('clean',s);lessonStore.putProgress('clean',{revealed:['h1'],unlocked:2,showSolution:false});
  expect(lessonStore.getSolution('clean')).toBe(s);expect(lessonStore.getProgress('clean').unlocked).toBe(2);
 });
 it('invalidates older proof versions instead of hiding fixes behind the session cache',()=>{
  const s=fixture();s.promptVersion='solver-v2.34';lessonStore.putSolution('old',s);lessonStore.putProgress('old',{revealed:['h1'],unlocked:3,showSolution:true});
  expect(lessonStore.getSolution('old')).toBeUndefined();expect(lessonStore.getProgress('old').unlocked).toBe(1);
 });
 it.each(['Bước четвертая','kimesdimesaimesab','Tích hợp razionale'])('refuses displayed leakage %s',text=>{
  const s=fixture();s.lesson!.hints[0]!.question=text;lessonStore.putSolution(text,s);expect(lessonStore.getSolution(text)).toBeUndefined();
 });
});
