import type {ModelLesson} from '../../../shared/src/solution';
import {verifyResidueCertificate} from '../../../shared/src/integerPolynomial';
import {integerResidueLesson} from './integerResidueLesson';
import {integerFactorLesson,verifyIntegerFactorCertificate} from './integerFactorLesson';
import {primeOffsetLesson,verifyPrimeOffsetCertificate} from './primeOffsetLesson';
import {integerSquareLesson,verifyIntegerSquareCertificate} from './integerSquareLesson';
import {gcdLesson,verifyGcdCertificate} from './gcdLesson';
import {radicalSequenceDivisibilityLesson,verifySequenceDivisibilityCertificate} from './radicalSequenceDivisibility';
import {polynomialDivisibilityLesson,verifyPolynomialDivisibilityCertificate} from './polynomialDivisibilityLesson';
import {quadraticNormLesson,verifyNormCertificate} from './quadraticNormLesson';
import {quadraticWitnessLesson,verifyQuadraticWitnessCertificate} from './quadraticWitnessLesson';
import {integerEquationObstructionLesson,verifyEquationObstructionCertificate} from './integerEquationObstruction';
import {divisorCountLesson,verifyDivisorCountCertificate} from './divisorCountLesson';
import {linearIntegerLesson,verifyLinearIntegerCertificate} from './linearIntegerLesson';
import {factorialExponentLesson,verifyFactorialExponentCertificate} from './factorialExponentLesson';
import {cubeDifferenceLesson,verifyCubeDifferenceCertificate} from './cubeDifferenceLesson';
import {certifiedNumberTheoryFamily} from './certifiedNumberTheoryFamilies';

export interface CertifiedIntegerLesson {lesson:ModelLesson;verify:()=>boolean;coverage:'complete'|'partial';label:string}
/** A bounded specialist dispatcher. Each parser consumes its whole task before generating a
 * lesson; rejected tasks continue through the existing inference/deadline pipeline. */
export function certifiedNumberTheoryLesson(text:string):CertifiedIntegerLesson|null {
 const builders:(()=>CertifiedIntegerLesson|null)[]=[
  ()=>{const r=certifiedNumberTheoryFamily(text);return r?{lesson:r.lesson,verify:r.verify,coverage:'complete',label:r.label}:null;},
  ()=>{const r=cubeDifferenceLesson(text);return r?{lesson:r.lesson,verify:()=>verifyCubeDifferenceCertificate(r.certificate),coverage:'complete',label:'Kiểm tra lập phương gốc trên toàn bộ giới hạn đã chứng minh, mọi ước, căn nguyên và miền của hai ẩn'}:null;},
  ()=>{const r=factorialExponentLesson(text);return r?{lesson:r.lesson,verify:()=>verifyFactorialExponentCertificate(r.certificate),coverage:'complete',label:'Đếm độc lập số thừa số nguyên tố của từng số trong giai thừa, kiểm tra mọi mức và tính nguyên của thương'}:null;},
  ()=>{const r=integerResidueLesson(text);return r?{lesson:r.lesson,verify:()=>verifyResidueCertificate(r.certificate),coverage:'complete',label:'Kiểm tra đa thức nguyên và đầy đủ mọi lớp số dư, gồm số âm'}:null;},
  ()=>{const r=integerFactorLesson(text);return r?{lesson:r.lesson,verify:()=>verifyIntegerFactorCertificate(r.certificate),coverage:'complete',label:'Kiểm tra phân tích nhân tử, toàn bộ ước có giới hạn đã chứng minh và miền gốc'}:null;},
  ()=>{const r=primeOffsetLesson(text);return r?{lesson:r.lesson,verify:()=>verifyPrimeOffsetCertificate(r.certificate),coverage:'complete',label:'Kiểm tra phủ đầy đủ số dư, mọi ứng viên ngoại lệ và tính nguyên tố bằng sàng độc lập'}:null;},
  ()=>{const r=integerSquareLesson(text);return r?{lesson:r.lesson,verify:()=>verifyIntegerSquareCertificate(r.certificate),coverage:'complete',label:'Kiểm tra tập số dư bình phương hoặc mọi cặp thừa số, tính chẵn lẻ và miền căn'}:null;},
  ()=>{const r=gcdLesson(text);return r?{lesson:r.lesson,verify:()=>verifyGcdCertificate(r.certificate),coverage:'complete',label:'Kiểm tra toàn bộ ước, điều kiện nguyên tố cùng nhau và nhân chứng đạt từng giá trị'}:null;},
  ()=>{const r=radicalSequenceDivisibilityLesson(text);return r?{lesson:r.lesson,verify:()=>verifySequenceDivisibilityCertificate(r.certificate),coverage:'complete',label:'Kiểm tra đẳng thức truy hồi, tính nguyên và mọi cạnh của chu kỳ cặp số dư'}:null;},
  ()=>{const r=polynomialDivisibilityLesson(text);return r?{lesson:r.lesson,verify:()=>verifyPolynomialDivisibilityCertificate(r.certificate),coverage:'complete',label:'Kiểm tra khai triển, giảm môđun, các lũy thừa nguyên tố và toàn bộ lớp nghiệm từng câu'}:null;},
  ()=>{const r=quadraticNormLesson(text);return r?{lesson:r.lesson,verify:()=>verifyNormCertificate(r.certificate),coverage:r.certificate.task.kind==='fixed'?'complete':'partial',label:r.certificate.task.kind==='fixed'?'Kiểm tra tất cả ước có giới hạn đã chứng minh và điều kiện gốc':'Kiểm tra cấu trúc giả thiết và các cặp; chứng minh chia hết bằng lời chưa được chứng nhận toàn bộ bằng máy'}:null;},
  ()=>{const r=quadraticWitnessLesson(text);return r?{lesson:r.lesson,verify:()=>verifyQuadraticWitnessCertificate(r.certificate),coverage:'complete',label:'Kiểm tra các số khác nhau, chữ số, chia hết và biểu diễn với nhân chứng nguyên cụ thể'}:null;},
  ()=>{const r=integerEquationObstructionLesson(text);return r?{lesson:r.lesson,verify:()=>verifyEquationObstructionCertificate(r.certificate),coverage:'complete',label:'Kiểm tra đa thức hiệu hai vế; số dư0 không tồn tại trong mọi lớp số dư nguyên'}:null;},
  ()=>{const r=divisorCountLesson(text);return r?{lesson:r.lesson,verify:()=>verifyDivisorCountCertificate(r.certificate),coverage:'complete',label:'Kiểm tra mọi số trong giới hạn bằng phép đếm ước độc lập và đối chiếu phân tích nguyên tố'}:null;},
  ()=>{const r=linearIntegerLesson(text);return r?{lesson:r.lesson,verify:()=>verifyLinearIntegerCertificate(r.certificate),coverage:'complete',label:'Kiểm tra đẳng thức tuyến tính, ƯCLN độc lập, tổ hợp nguyên, phương trình gốc và toàn bộ giới hạn tham số'}:null;},
 ];
 for(const build of builders){const result=build();if(result)return result;}
 return null;
}
