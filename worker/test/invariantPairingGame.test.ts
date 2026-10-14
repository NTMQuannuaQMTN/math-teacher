import {describe,expect,it} from 'vitest';
import {invariantPairingLesson,verifyInvariantPairingCertificate} from '../src/solver/invariantPairingGame';
import {latexFeedback} from '../src/solver/latexCheck';
import {cleanLanguage} from '../../shared/src/language';

describe('invariant and pairing games',()=>{
 it('proves the odd-coin obstruction for every legal move sequence',()=>{
  const result=invariantPairingLesson('Ban đầu có $9$ đồng xu đều ngửa. Mỗi lượt phải lật đúng $2$ đồng xu phân biệt. Có thể làm cho cả $9$ đồng xu đều sấp không? Chứng minh cho mọi dãy lượt đi.');
  expect(result).not.toBeNull();
  expect(result&&verifyInvariantPairingCertificate(result.certificate)).toBe(true);
  expect(result?.lesson.finalAnswer.text).toContain('không thể');
  expect(result?.lesson.steps.map(step=>step.explanation).join(' ')).toContain('ba trường hợp duy nhất');
  expect(latexFeedback(result!.lesson)).toEqual([]);
  expect(cleanLanguage(result!.lesson).feedback).toEqual([]);
 });

 it('checks the rotated response for every domino on even 2 by n boards',()=>{
  for(const columns of [2,4,8,20]){
   const question=`An và Bình luân phiên đặt một quân domino phủ đúng hai ô kề cạnh còn trống trên bàn cờ $2\\times${columns}$. An đi trước. Ai không còn nước đi hợp lệ thì thua. Ai có chiến lược thắng? Hãy nêu rõ nước đáp cho mọi nước đi của đối phương, chứng minh nước đáp luôn hợp lệ và trò chơi kết thúc.`;
   const result=invariantPairingLesson(question);
   expect(result&&verifyInvariantPairingCertificate(result.certificate)).toBe(true);
   expect(result?.lesson.finalAnswer.text).toContain('Bình');
   expect(result?.lesson.steps.length).toBeGreaterThanOrEqual(5);
   expect(latexFeedback(result!.lesson)).toEqual([]);
   expect(cleanLanguage(result!.lesson).feedback).toEqual([]);
  }
 });

 it('declines odd-width boards and changed move rules',()=>{
  const odd='An và Bình luân phiên đặt một quân domino phủ đúng hai ô kề cạnh còn trống trên bàn cờ $2\\times7$. An đi trước. Ai không còn nước đi hợp lệ thì thua. Ai có chiến lược thắng? Hãy nêu rõ nước đáp cho mọi nước đi của đối phương, chứng minh nước đáp luôn hợp lệ và trò chơi kết thúc.';
  expect(invariantPairingLesson(odd)).toBeNull();
  expect(invariantPairingLesson('Ban đầu có $9$ đồng xu đều ngửa. Mỗi lượt phải lật đúng $3$ đồng xu phân biệt. Có thể làm cho cả $9$ đồng xu đều sấp không? Chứng minh cho mọi dãy lượt đi.')).toBeNull();
 });

 it('preserves renamed players and accepts equivalent rule wording',()=>{
  const game=invariantPairingLesson('Trên bảng $2\\times12$, Minh và Lan thay nhau đặt domino vào hai ô kề cạnh còn trống; Minh đi trước và người hết nước đi thua. Ai thắng nếu chơi đúng, và người đó phải đáp thế nào sau mọi nước của đối thủ? Chứng minh đáp án.');
  expect(game&&verifyInvariantPairingCertificate(game.certificate)).toBe(true);
  expect(game?.lesson.finalAnswer.text).toContain('Lan');
  expect(game?.lesson.finalAnswer.text).not.toContain('Bình');
  const coins=invariantPairingLesson('Có $15$ đồng xu đang ngửa. Mỗi bước lật chính xác hai đồng khác nhau. Liệu sau hữu hạn bước tất cả có thể cùng sấp? Chứng minh cho mọi cách chọn.');
  expect(coins&&verifyInvariantPairingCertificate(coins.certificate)).toBe(true);
 });
});
