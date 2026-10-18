import { normalizeProblemText } from "../../../shared/src/mathText";
import type { ModelLesson } from "../../../shared/src/solution";
import { algebraProofLesson, type AlgebraDeduction } from "./algebraProofLesson";

/**
 * A proved Grade-9 family learned from the PTNK divisibility failure. The recognizer requires the complete three-part
 * statement; unrelated expressions continue to the SocLaas specialist. The certificate is the symbolic derivation
 * encoded below, not a memorized final-answer lookup.
 */
export function trainedDivisibilityGcdLesson(input: string): ModelLesson | null {
  const text = normalizeProblemText(input);
  const plain = text.replace(/\$/g, "").replace(/\s+/g, " ");
  const condition = /m\s*\^\s*2\s*\+\s*m\s*\+\s*n\s*\^\s*2/iu.test(plain) && /(?:mn|m\s*\\?cdot\s*n)/iu.test(plain) && /chia hết/iu.test(plain);
  const allParts = /n\s*=\s*3/iu.test(plain) && /m\s+chia hết cho\s+n/iu.test(plain) && /ước chung lớn nhất/iu.test(plain) && /m\s*=\s*d\s*\^\s*2/iu.test(plain);
  if (!condition || !allParts) return null;

  const steps: AlgebraDeduction[] = [
    {
      title: "Câu a: suy ra $m$ là ước của $9$",
      explanation: "Khi $n=3$, điều kiện cho $(m^2+m+9)\\vdots 3m$. Vì thế biểu thức cũng chia hết cho $m$. Hai số hạng đầu chia hết cho $m$, nên $9$ chia hết cho $m$.",
      math: "m^2+m+9\\vdots m\\Rightarrow 9\\vdots m\\Rightarrow m\\in\\{1,3,9\\}",
      reason: "Nếu một tổng và một số hạng chia hết cho $m$ thì hiệu của chúng chia hết cho $m$",
      question: "Từ điều kiện với $n=3$, ta suy ra $m$ phải là ước của số nào?",
    },
    {
      title: "Câu a: kiểm tra đủ ba khả năng",
      explanation: "Thay lần lượt $m=1,3,9$. Các số $m^2+m+9$ tương ứng là $11,21,99$, còn $3m$ là $3,9,27$; không trường hợp nào chia hết.",
      math: "11\\not\\vdots3,\\qquad21\\not\\vdots9,\\qquad99\\not\\vdots27",
      reason: "Kiểm tra trực tiếp danh sách hữu hạn đã chứng minh là đầy đủ",
      question: "Ba ước dương của $9$ có trường hợp nào thỏa điều kiện ban đầu không?",
    },
    {
      title: "Câu b: đặt $m=kn$",
      explanation: "Vì $m$ chia hết cho $n$, đặt $m=kn$ với $k$ nguyên dương. Chia thương nguyên trong điều kiện ban đầu cho $mn=kn^2$.",
      math: "\\frac{m^2+m+n^2}{mn}=k+\\frac1n+\\frac1k\\in\\mathbb Z",
      reason: "Định nghĩa chia hết và phép thế $m=kn$",
      question: "Sau khi đặt $m=kn$, thương trong điều kiện có dạng nào?",
    },
    {
      title: "Câu b: giải phương trình phân số nguyên",
      explanation: "Do $k$ đã nguyên, nên $1/n+1/k$ là số nguyên dương và không vượt quá $2$. Nếu tổng bằng $2$ thì $k=n=1$. Nếu tổng bằng $1$, nhân với $kn$ được $k+n=kn$, hay $(k-1)(n-1)=1$, nên $k=n=2$.",
      math: "\\frac1n+\\frac1k\\in\\{1,2\\}\\Rightarrow(k,n)\\in\\{(1,1),(2,2)\\}",
      reason: "Chặn số nguyên dương và phân tích thành nhân tử",
      question: "Một số nguyên dương không vượt quá $2$ chỉ có thể nhận những giá trị nào?",
    },
    {
      title: "Câu b: trở lại $(m,n)$ và kiểm tra",
      explanation: "Với $m=kn$, hai cặp trên cho $(m,n)=(1,1)$ và $(4,2)$. Thay lại cho thấy cả hai đều thỏa điều kiện, nên danh sách là đầy đủ.",
      math: "(m,n)\\in\\{(1,1),(4,2)\\}",
      reason: "Phép thế tương đương và kiểm tra trực tiếp",
      question: "Hai cặp $(k,n)$ tìm được cho những cặp $(m,n)$ nào?",
    },
    {
      title: "Câu c: tách ước chung lớn nhất",
      explanation: "Đặt $m=dx$, $n=dy$ với $x,y$ nguyên dương và $\\gcd(x,y)=1$. Sau khi chia cả số bị chia và số chia cho $d$, điều kiện trở thành quan hệ nguyên sau.",
      math: "dxy\\mid dx^2+x+dy^2",
      reason: "Định nghĩa ước chung lớn nhất và rút nhân tử chung $d$",
      question: "Khi tách $d=\\gcd(m,n)$, hai thừa số còn lại có tính chất gì?",
    },
    {
      title: "Câu c: chứng minh $d\\mid x$",
      explanation: "Vế phải chia hết cho $d$. Hai số hạng $dx^2$ và $dy^2$ đã chia hết cho $d$, nên số hạng còn lại $x$ cũng chia hết cho $d$.",
      math: "d\\mid x",
      reason: "Tính chất chia hết của hiệu",
      question: "Xét quan hệ ở bước trước theo môđun $d$ cho điều gì?",
    },
    {
      title: "Câu c: chứng minh $x\\mid d$",
      explanation: "Vế phải cũng chia hết cho $x$. Hai số hạng đầu chia hết cho $x$, do đó $x\\mid dy^2$. Vì $\\gcd(x,y)=1$ nên $\\gcd(x,y^2)=1$; theo bổ đề Euclid, $x\\mid d$.",
      math: "x\\mid dy^2,\\quad\\gcd(x,y^2)=1\\Rightarrow x\\mid d",
      reason: "Bổ đề Euclid",
      question: "Tính nguyên tố cùng nhau của $x$ và $y$ giúp khử thừa số nào?",
    },
    {
      title: "Câu c: kết luận",
      explanation: "Hai số nguyên dương $d,x$ chia hết cho nhau nên $d=x$. Bởi vậy $m=dx=d^2$, đúng điều phải chứng minh.",
      math: "d=x\\Rightarrow m=dx=d^2",
      reason: "Hai số nguyên dương chia hết cho nhau thì bằng nhau",
      question: "Từ $d\\mid x$ và $x\\mid d$, ta kết luận thế nào?",
    },
  ];

  const lesson = algebraProofLesson(
    text,
    "Chia hết và tách ước chung lớn nhất",
    "Dùng điều kiện chia hết để thu hẹp hữu hạn ở câu a, đặt $m=kn$ ở câu b, rồi đặt $m=dx,n=dy$ và khai thác tính nguyên tố cùng nhau ở câu c.",
    steps,
    "a) Không tồn tại cặp số nguyên dương khi $n=3$.\nb) $(m,n)=(1,1)$ hoặc $(4,2)$.\nc) Ta có $m=d^2$.",
    { topic: "number_theory", givens: ["$m,n$ là số nguyên dương", "$(m^2+m+n^2)\\vdots mn$"], unknowns: ["Giải lần lượt các câu a), b), c)"], constraints: ["Chỉ dùng phương pháp lớp 9 và bổ đề Euclid"] },
  );
  if (!lesson) return null;
  lesson.hints = [
    { id: "h1", level: 1, question: "Khi $n=3$, điều kiện chia hết theo $m$ buộc $m$ liên hệ thế nào với $9$?", cue: "Xét hiệu với $m^2+m$", explanation: "Từ $(m^2+m+9)\\vdots m$ và $(m^2+m)\\vdots m$, suy ra $9\\vdots m$.", math: "9\\vdots m", stepId: "s1", focus: [] },
    { id: "h2", level: 2, question: "Ở câu b), nên biểu diễn $m$ như thế nào vì $m$ chia hết cho $n$?", cue: "Đặt một thương nguyên dương", explanation: "Đặt $m=kn$ rồi viết thương $(m^2+m+n^2)/(mn)$; phần còn lại ngoài số nguyên $k$ là $1/n+1/k$.", math: "m=kn,\\quad k+\\frac1n+\\frac1k\\in\\mathbb Z", stepId: "s3", focus: [] },
    { id: "h3", level: 3, question: "Ở câu c), sau khi tách $d=\\gcd(m,n)$, hai thừa số còn lại có tính chất gì?", cue: "Đặt $m=dx,n=dy$", explanation: "Viết $m=dx,n=dy$ với $\\gcd(x,y)=1$ rồi chia quan hệ ban đầu cho $d$ để giữ một quan hệ hoàn toàn nguyên.", math: "dxy\\mid dx^2+x+dy^2", stepId: "s6", focus: [] },
    { id: "h4", level: 4, question: "Hãy xét quan hệ nguyên lần lượt theo $d$ và theo $x$; ta thu được hai chiều chia hết nào?", cue: "Dùng bổ đề Euclid với $\\gcd(x,y)=1$", explanation: "Xét theo $d$ cho $d\\mid x$. Xét theo $x$ cho $x\\mid dy^2$; vì $x$ nguyên tố cùng nhau với $y^2$, bổ đề Euclid cho $x\\mid d$.", math: "d\\mid x,\\qquad x\\mid d", stepId: "s8", focus: [] },
  ];
  lesson.answerChecks = [
    { kind: "integers", statements: ["((m^2+m+9) % (3*m)) = 0", "m > 0"], assignments: [], expected: "none" },
    { kind: "substitute", statements: ["((m^2+m+n^2) % (m*n)) = 0", "(m % n) = 0", "m > 0", "n > 0"], assignments: [[{ variable: "m", value: "1" }, { variable: "n", value: "1" }], [{ variable: "m", value: "4" }, { variable: "n", value: "2" }]], expected: null },
  ];
  return lesson;
}
