import { ModelLessonSchema } from '../../shared/src/solution';
import { cleanLanguage } from '../../shared/src/language';
import { latexFeedback } from '../src/solver/latexCheck';
export function auditLesson(input:unknown){
 const parsed=ModelLessonSchema.safeParse(input);
 if(!parsed.success)return {schemaValid:false,latexErrors:[],languageErrors:[],schemaErrors:parsed.error.issues};
 return {schemaValid:true,latexErrors:latexFeedback(parsed.data),languageErrors:cleanLanguage(parsed.data).feedback};
}

export {problemDomains as routingForQuestion} from '../../shared/src/knowledgeBase';
