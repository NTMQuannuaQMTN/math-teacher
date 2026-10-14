import type {ModelLesson} from '../../../shared/src/solution';
import {certifiedNumberTheoryLesson} from './certifiedNumberTheory';
/** Compatibility entry point; the specialist dispatcher and its certificates are shared with the application. */
export function numberTheoryLesson(text:string):ModelLesson|null {return certifiedNumberTheoryLesson(text)?.lesson??null;}
