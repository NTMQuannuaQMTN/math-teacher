import {repairLatex} from './mathText';
/** Whole confirmed task, including mandatory movement and question order. */
export function parseHiddenBoardQuestion(text:string):{columns:number;official:boolean}|null {
 const plain=repairLatex(text).replace(/\\+(?=(?:times|leq)(?![A-Za-z]))/g,'\\').replace(/\$/g,'').replace(/\s+/g,' ').trim().replace(/^(?:Câu|Bài)\s+\d+(?:\s*\([\d.,]+\s*điểm\))?\.\s*/u,'').replace('nguyên đường','nguyên dương').replace('kế bến nếu chứng','kề bên nếu chúng').replace(/(?<!\p{L})kô(?!\p{L})/gu,'k ô');
 const official=/^Cho bảng ô vuông kích thước 2\s*(?:\\times|×)\s*(\d+) và số nguyên dương k\s*\\leq?\s*(\d+)\. Hai ô của bảng được gọi là kề bên nếu chúng có một cạnh chung\. Hai bạn An và Bình chơi trò ["“]Truy Tìm Tàu Ngầm["”] như sau: Trước khi trò chơi bắt đầu, An chọn một ô trên bảng và không cho Bình biết\. Ở mỗi lượt chơi: (?:- )?An phải chọn một ô mới, kề bên với ô đã chọn trước đó, và không cho Bình biết; (?:- )?Sau khi An chọn xong, Bình chọn k ô của bảng và hỏi An: trong k ô này có ô An vừa chọn hay không\? Nếu có thì Bình thắng, nếu không thì hai bạn lại chơi lượt tiếp theo\. a\) Xét k\s*=\s*4\. Chứng minh rằng Bình có thể thắng sau không quá (\d+) lượt chơi\. b\) Xét k\s*=\s*2\. Chứng minh rằng Bình có thể thắng sau không quá (\d+) lượt chơi\.$/u.exec(plain);
 const prefix=/^Cho bàn cờ(?: kích thước)? 2\s*(?:\\times|×)\s*(\d+)\. An chọn một ô(?: ban đầu)?, sau đó mỗi lượt (?:An )?di chuyển sang (?:một )?ô kề bên\. Bình chọn k ô(?: mỗi lượt)? để (?:hỏi An|đoán vị trí An|kiểm tra)\. (.+)$/u.exec(plain);
 if(!prefix&&!official)return null;
 if(official&&Number(official[2])!==2*Number(official[1]))return null;
 const bounds=prefix?(/^Chứng minh Bình có thể thắng sau không quá (\d+) lượt với k\s*=\s*4 và không quá (\d+) lượt với k\s*=\s*2\.$/u.exec(prefix[2]!)??/^(?:a\) )?Với k\s*=\s*4, chứng minh Bình (?:có thể )?thắng sau không quá (\d+) lượt\. (?:b\) )?Với k\s*=\s*2, chứng minh Bình (?:có thể )?thắng sau không quá (\d+) lượt\.$/u.exec(prefix[2]!)):null;
 const match=official?[plain,official[1]!,official[3]!,official[4]!]:bounds?[plain,prefix![1]!,bounds[1]!,bounds[2]!]:null;
 if(!match)return null;
 const n=Number(match[1]),length=n-1;
 if(n<2||n>50||Number(match[2])!==length||Number(match[3])!==2*length)return null;
 return {columns:n,official:!!official};
}
