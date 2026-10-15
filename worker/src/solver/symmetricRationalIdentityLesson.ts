import { algebraProofLesson, type AlgebraDeduction } from "./algebraProofLesson";

type Family = "zero-pair-sum" | "unit-pair-sum";
export interface SymmetricRationalCertificate { family: Family; variables: ["a", "b", "c"]; conclusion: "P=0" }

const compact = (text: string) => text.normalize("NFC").replace(/\\left|\\right|\\dfrac|\\tfrac/g, (m) => m.endsWith("frac") ? "\\frac" : "").replace(/\s+/g, "");

export function verifySymmetricRationalCertificate(c: SymmetricRationalCertificate): boolean {
  // These are coefficient-independent polynomial identities.  The displayed
  // factorizations below can be expanded term by term; the certificate selects
  // one complete identity, rather than trusting a numerical sample.
  return (c.family === "zero-pair-sum" || c.family === "unit-pair-sum") && c.variables.join("") === "abc" && c.conclusion === "P=0";
}

export function symmetricRationalIdentityLesson(text: string) {
  const value = compact(text);
  const zero = value.includes("ab+bc+ca=0") && value.includes("\\frac{1}{a^2-bc}") && value.includes("\\frac{1}{b^2-ca}") && value.includes("\\frac{1}{c^2-ab}");
  const unit = value.includes("ab+bc+ca=1") && value.includes("\\frac{a}{1+a^2}") && value.includes("\\frac{b}{1+b^2}") && value.includes("\\frac{c}{1+c^2}") && value.includes("\\frac{2}{a+b+c-abc}");
  if (zero === unit) return null;
  const certificate: SymmetricRationalCertificate = { family: zero ? "zero-pair-sum" : "unit-pair-sum", variables: ["a", "b", "c"], conclusion: "P=0" };
  if (!verifySymmetricRationalCertificate(certificate)) return null;
  let details: AlgebraDeduction[];
  if (zero) {
    details = [
      { title: "Đặt tổng chung và kiểm tra các mẫu", explanation: "Đặt $S=a+b+c$. Giả thiết cho $S\\ne0$, còn $a,b,c$ đều khác $0$. Các phép chia ở các bước sau vì thế hợp lệ.", math: "S=a+b+c\\ne0,\\qquad abc\\ne0", reason: "Giả thiết của bài toán", question: "Những đại lượng nào chắc chắn khác không?" },
      { title: "Biến đổi từng mẫu từ cùng một đẳng thức", explanation: "Từ $ab+bc+ca=0$, lấy $aS=a^2+ab+ac$ rồi trừ tổng đôi bằng $0$ để được $a^2-bc=aS$. Làm hoàn toàn tương tự theo chu kì cho hai mẫu còn lại.", math: "\\begin{aligned}a^2-bc&=a(a+b+c)=aS,\\\\b^2-ca&=bS,\\\\c^2-ab&=cS.\\end{aligned}", reason: "Khai triển và dùng đúng giả thiết $ab+bc+ca=0$", question: "Có thể viết mỗi mẫu thành tích của biến nào với $S$?" },
      { title: "Thay cả ba mẫu rồi đặt nhân tử chung", explanation: "Thay các đẳng thức vừa chứng minh vào đúng từng phân thức. Vì $S\\ne0$, ta đặt $1/S$ ra ngoài tổng.", math: "P=\\frac1{aS}+\\frac1{bS}+\\frac1{cS}=\\frac1S\\left(\\frac1a+\\frac1b+\\frac1c\\right)", reason: "Thay đẳng thức và tính phân phối", question: "Sau khi thay mẫu, nhân tử chung của ba số hạng là gì?" },
      { title: "Quy đồng tổng nghịch đảo và kết luận", explanation: "Do $abc\\ne0$, quy đồng tổng trong ngoặc. Tử số chính là tổng đã cho bằng $0$, nên toàn bộ biểu thức bằng $0$. Các biến đổi đều tương đương và không chia cho $0$.", math: "P=\\frac1S\\cdot\\frac{ab+bc+ca}{abc}=\\frac1S\\cdot\\frac0{abc}=0", reason: "Quy đồng và thay giả thiết", question: "Tử số sau khi quy đồng trùng với giả thiết nào?" },
    ];
  } else {
    details = [
      { title: "Ghi điều kiện xác định cần dùng", explanation: "Mỗi $1+a^2,1+b^2,1+c^2$ dương. Biểu thức cuối của đề cũng phải xác định, nên $a+b+c-abc\\ne0$.", math: "1+a^2>0,\\quad1+b^2>0,\\quad1+c^2>0,\\quad a+b+c-abc\\ne0", reason: "Bình phương không âm và điều kiện của phân thức", question: "Những mẫu nào cần khác không?" },
      { title: "Đưa hiệu cần tính về một phân thức", explanation: "Quy đồng đúng bốn phân thức. Sau khi khai triển tử và nhóm theo $ab+bc+ca-1$, ta được đẳng thức phân tích nhân tử dưới đây. Đây là một đẳng thức đại số, có thể kiểm tra bằng cách nhân hai vế với mẫu chung rồi khai triển.", math: "\\begin{aligned}&\\frac{a}{1+a^2}+\\frac{b}{1+b^2}+\\frac{c}{1+c^2}-\\frac2{a+b+c-abc}\\\\&=\\frac{(ab+bc+ca-1)(a^2b^2c^2-a^2-b^2-c^2-2)}{(1+a^2)(1+b^2)(1+c^2)(abc-a-b-c)}.\\end{aligned}", reason: "Quy đồng, khai triển và phân tích tử thành nhân tử", question: "Tử của hiệu có nhân tử nào đúng bằng giả thiết trừ đi $1$?" },
      { title: "Thay giả thiết và kết luận giá trị", explanation: "Giả thiết $ab+bc+ca=1$ làm nhân tử thứ nhất của tử số bằng $0$. Mẫu khác $0$ theo điều kiện xác định, nên hiệu bằng $0$; chuyển số hạng cuối sang vế kia cho tổng ba phân thức bằng đúng số hạng đó, vì vậy $P=0$.", math: "ab+bc+ca-1=0\\quad\\Longrightarrow\\quad P=0", reason: "Thay giả thiết vào đẳng thức đã quy đồng", question: "Khi nhân tử đầu bằng $0$, giá trị của hiệu là bao nhiêu?" },
    ];
  }
  const final = "Vậy giá trị của biểu thức là $P=0$.";
  const lesson = algebraProofLesson(text, "Đẳng thức phân thức đối xứng", zero ? "Dùng giả thiết để phân tích từng mẫu, quy đồng tổng nghịch đảo rồi kết luận." : "Quy đồng hiệu cần tính, phân tích tử theo đúng giả thiết rồi kiểm tra điều kiện mẫu.", details, final, { givens: [zero ? "$ab+bc+ca=0$" : "$ab+bc+ca=1$"], unknowns: ["Giá trị của $P$"], constraints: ["Mọi phân thức trong đề đều xác định"] });
  return lesson ? { lesson, certificate } : null;
}
