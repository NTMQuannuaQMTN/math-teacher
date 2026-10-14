import {countingLesson,verifyCountingCertificate} from './countingLesson';
import {constructiveCombinatoricsLesson,verifyConstructiveCertificate} from './constructiveCombinatoricsLesson';
import {twoPilesLesson,verifyPilesCertificate,signGameLesson,verifySignCertificate} from './finiteStrategyLesson';
import {explicitWitnessLesson,verifyExplicitWitnessCertificate} from './explicitWitnessLesson';
import {invariantPairingLesson,verifyInvariantPairingCertificate} from './invariantPairingGame';
import type {ModelLesson} from '../../../shared/src/solution';
export interface CertifiedCombinatorics {lesson:ModelLesson;verify:()=>boolean;label:string}
export function certifiedCombinatoricsLesson(text:string):CertifiedCombinatorics|null {
 const builders:(()=>CertifiedCombinatorics|null)[]=[
 ()=>{const r=invariantPairingLesson(text);return r?{lesson:r.lesson,verify:()=>verifyInvariantPairingCertificate(r.certificate),label:'Kiểm tra vét cạn không gian trạng thái đồng xu hoặc mọi domino hợp lệ và ảnh quay của nó'}:null;},
 ()=>{const r=explicitWitnessLesson(text);return r?{lesson:r.lesson,verify:()=>verifyExplicitWitnessCertificate(r.certificate),label:'Kiểm tra mọi cặp giá trị phân biệt trong danh sách gốc và nhân chứng thực tế, không suy từ ví dụ thử'}:null;},
 ()=>{const r=twoPilesLesson(text);return r?{lesson:r.lesson,verify:()=>verifyPilesCertificate(r.certificate),label:'Kiểm tra toàn bộ trạng thái hai đống với mọi lượng lấy hợp lệ, đúng luật viên cuối'}:null;},
 ()=>{const r=signGameLesson(text);return r?{lesson:r.lesson,verify:()=>verifySignCertificate(r.certificate),label:'Kiểm tra cây trò chơi theo lượt và số dư, cả hai dấu của đối phương và mọi dấu trong chiến lược'}:null;},
 ()=>{const r=countingLesson(text);return r?{lesson:r.lesson,verify:()=>verifyCountingCertificate(r.certificate),label:'Đối chiếu đếm độc lập: chọn/bỏ từng đối tượng, liệt kê chữ số, phân hoạch phần giao hoặc cộng từng cặp'}:null;},
 ()=>{const r=constructiveCombinatoricsLesson(text);return r?{lesson:r.lesson,verify:()=>verifyConstructiveCertificate(r.certificate),label:'Kiểm tra phân hoạch đầy đủ không trùng, điều kiện nhiều phần tử hơn ngăn và đẳng thức bất biến tổng quát'}:null;},
 ];
 for(const build of builders){const r=build();if(r)return r;}return null;
}
