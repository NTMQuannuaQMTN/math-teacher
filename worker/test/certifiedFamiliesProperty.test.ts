import {describe,expect,it} from 'vitest';
import {cleanLanguage} from '../../shared/src/language';
import {certifiedAlgebraFamily} from '../src/solver/certifiedAlgebraFamilies';
import {certifiedGeometryFamily} from '../src/solver/certifiedGeometryFamilies';
import {certifiedNumberTheoryFamily} from '../src/solver/certifiedNumberTheoryFamilies';
import {invariantPairingLesson,verifyInvariantPairingCertificate} from '../src/solver/invariantPairingGame';
import {latexFeedback} from '../src/solver/latexCheck';

const quality=(lesson:NonNullable<ReturnType<typeof certifiedAlgebraFamily>>['lesson'])=>{
 expect(latexFeedback(lesson)).toEqual([]);
 expect(cleanLanguage(lesson).feedback).toEqual([]);
 expect(lesson.steps.every(step=>Boolean(step.reason))).toBe(true);
};

describe('bounded generalization of the new certified families',()=>{
 it('reconstructs varied quadratic polynomials from three values',()=>{
  for(const [a,b,c,target] of [[-2,3,5,-3],[0,-4,7,6],[1,0,-9,5],[3,-2,1,4]] as const){
   const values=[c,a+b+c,4*a+2*b+c];
   const question=`Cho đa thức $P(x)$ có bậc không quá hai, biết $P(0)=${values[0]}$, $P(1)=${values[1]}$, $P(2)=${values[2]}$. Tính $P(${target})$ và giải thích các bước.`;
   const result=certifiedAlgebraFamily(question),expected=a*target*target+b*target+c;
   expect(result?.verify()).toBe(true);expect(result?.lesson.finalAnswer.text).toContain(`=${expected}$`);quality(result!.lesson);
  }
 });

 it('finds the unique median for signed triples',()=>{
  for(const values of [[-9,-2,6],[-4,3,11],[1,8,20]] as const){
   const term=(root:number)=>root<0?`|x+${-root}|`:`|x-${root}|`;
   const question=`Tìm giá trị nhỏ nhất của $${values.map(term).join('+')}$ với $x$ thực và tất cả giá trị $x$ đạt giá trị nhỏ nhất.`;
   const result=certifiedAlgebraFamily(question),expected=values[2]-values[0];
   expect(result?.verify()).toBe(true);expect(result?.lesson.finalAnswer.text).toContain(`$${expected}$`);expect(result?.lesson.finalAnswer.text).toContain(`x=${values[1]}`);quality(result!.lesson);
  }
 });

 it('keeps Ceva, Menelaus and regular-hexagon parameters symbolic',()=>{
  for(const [p,q] of [[1,2],[2,5],[4,3]] as const){
   const ceva=certifiedGeometryFamily(`Cho tam giác $ABC$. Điểm $D$ thuộc cạnh $BC$, điểm $E$ thuộc cạnh $CA$, với $BD/DC=${p}$ và $CE/EA=${q}$. Hai đường thẳng $AD$ và $BE$ cắt nhau tại $P$. Đường thẳng $CP$ cắt cạnh $AB$ tại $F$. Tính $AF/FB$ và chứng minh.`);
   expect(ceva?.verify()).toBe(true);expect(ceva?.lesson.finalAnswer.text).toContain(`{1}{${p*q}}`);quality(ceva!.lesson);
   if(p*q!==1){const menelaus=certifiedGeometryFamily(`Cho tam giác $ABC$. Điểm $D$ thuộc cạnh $AB$, điểm $E$ thuộc cạnh $BC$, với $AD/DB=${p}$ và $BE/EC=${q}$. Đường thẳng $DE$ cắt đường thẳng $AC$ tại $F$. Xác định vị trí $F$ và tính $AF/FC$, kèm chứng minh.`);expect(menelaus?.verify()).toBe(true);expect(menelaus?.lesson.finalAnswer.text).toContain(`=${p*q}`);quality(menelaus!.lesson);}
  }
  for(const radius of [1,7,23]){const result=certifiedGeometryFamily(`Cho lục giác đều $ABCDEF$ nội tiếp đường tròn tâm $O$, bán kính bằng $${radius}$. Tính độ dài cạnh và diện tích lục giác, chứng minh các bước.`);expect(result?.verify()).toBe(true);quality(result!.lesson);}
 });

 it('checks residue, gcd-power and repunit boundary variants independently',()=>{
  const powMod=(base:number,exponent:number,modulus:number)=>{let r=1%modulus,b=base%modulus;for(let e=exponent;e;e=Math.floor(e/2)){if(e%2)r=r*b%modulus;b=b*b%modulus;}return r;};
  for(const [base,exponent,modulus] of [[2,1,3],[3,25,7],[5,44,11],[7,31,13]] as const){const result=certifiedNumberTheoryFamily(`Tìm số dư khi chia $${base}^{${exponent}}$ cho $${modulus}$ và chứng minh.`);expect(result?.verify()).toBe(true);expect(result?.lesson.finalAnswer.text).toContain(`$${powMod(base,exponent,modulus)}$`);quality(result!.lesson);}
  for(const digits of [2,10,2028]){const result=certifiedNumberTheoryFamily(`Chứng minh số có đúng $${digits}$ chữ số $1$ liên tiếp trong hệ thập phân chia hết cho $11$.`);expect(result?.verify()).toBe(true);quality(result!.lesson);}
 });

 it('certifies every even domino width in the supported range',()=>{
  for(let columns=2;columns<=20;columns+=2){const result=invariantPairingLesson(`An và Bình luân phiên đặt một quân domino phủ đúng hai ô kề cạnh còn trống trên bàn cờ $2\\times${columns}$. An đi trước. Ai không còn nước đi hợp lệ thì thua. Ai có chiến lược thắng? Hãy nêu rõ nước đáp cho mọi nước đi của đối phương, chứng minh nước đáp luôn hợp lệ và trò chơi kết thúc.`);expect(result&&verifyInvariantPairingCertificate(result.certificate)).toBe(true);quality(result!.lesson);}
 });
});
