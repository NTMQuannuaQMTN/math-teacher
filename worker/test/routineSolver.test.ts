import { describe, expect, it } from "vitest";
import { routineLesson } from "../src/solver/routine";
import { flatten } from "../src/solver/routine/text";
import { solveProblem } from "../src/solver/pipeline";
import { VN_GRADE_9 } from "../src/solver/curriculum";
import { OcrFailure } from "../src/ocr/provider";
import type { JsonModel } from "../src/solver/llm";

const solved = (text: string) => {
  const r = routineLesson(text);
  expect(r, text).not.toBeNull();
  expect(r!.verify()).toBe(true);
  return { family: r!.family, answer: r!.lesson.finalAnswer.text, topic: r!.lesson.analysis.topic };
};
const declined = (text: string) => expect(routineLesson(text), text).toBeNull();

describe("routine solver: the same task in different wordings", () => {
  it("remainders of powers and last digits", () => {
    expect(solved("Tìm số dư khi chia $3^{100}$ cho $5$.").answer).toContain("$1$");
    expect(solved("$2^{2026}$ chia cho $7$ dư bao nhiêu?").answer).toContain("$2$");
    expect(solved("Tìm chữ số tận cùng của $3^{2025}$.").answer).toContain("$3$");
    expect(solved("Tìm hai chữ số tận cùng của $3^{20}$.").answer).toContain("$01$");
    // 2^n mod 10 never returns to 1: the pre-period/period branch
    expect(solved("Tìm chữ số tận cùng của $2^{2025}$.").answer).toContain("$2$");
  });
  it("gcd / lcm of numbers and closed expressions", () => {
    expect(solved("Tìm ƯCLN của $252$ và $198$.").answer).toContain("$18$");
    expect(solved("Tính $\\gcd(2^{12}-1,2^{18}-1)$.").answer).toContain("$63$");
    const both = solved("Tìm ƯCLN và BCNN của $90$ và $168$.").answer;
    expect(both).toContain("$6$");
    expect(both).toContain("$2520$");
  });
  it("divisibility by a linear expression, with the domain respected", () => {
    expect(solved("Tìm tất cả các số nguyên dương $n$ sao cho $n+3$ chia hết cho $n-1$.").answer).toContain("2;3;5");
    expect(solved("Tìm số nguyên $n$ để $2n^2+n-7$ chia hết cho $2n+1$.").answer).toContain("-4;-1;0;3");
  });
  it("integer equations: factorable, difference and sum of squares", () => {
    expect(solved("Tìm tất cả các cặp số nguyên $(x,y)$ thỏa mãn $xy-x-y=2$.").answer).toContain("(4;2)");
    expect(solved("Tìm các cặp số nguyên dương (x; y) thỏa mãn x² − y² = 21").answer).toMatch(/\(5;2\).*\(11;10\)/);
    expect(solved("Tìm nghiệm nguyên của phương trình $x^2+y^2=25$ (cặp số $(x;y)$).").answer.match(/\(/g)!.length).toBe(13);
  });
  it("for-all divisibility proofs use consecutive integers when possible, residue classes otherwise", () => {
    expect(solved("Chứng minh rằng $n^3-n$ chia hết cho $6$ với mọi số nguyên $n$.").family).toBe("consecutive-product");
    // n⁴ − n² = (n−1)n(n+1)(n+2) − 2(n−1)n(n+1): a sum of consecutive products (review 2026-10-15: tables are too long)
    expect(solved("Chứng minh rằng $n^4-n^2$ chia hết cho $12$ với mọi số nguyên $n$.").family).toBe("consecutive-product");
    expect(solved("Chứng minh rằng $n^4+2$ chia hết cho $3$ với mọi số nguyên $n$.").family).not.toBe("consecutive-product");
  });
  it("smallest number with given remainders", () => {
    expect(solved("Tìm số tự nhiên nhỏ nhất chia cho $4$ dư $3$, chia cho $5$ dư $4$ và chia cho $6$ dư $5$.").answer).toContain("$59$");
  });
  it("counting", () => {
    expect(solved("Một giải bóng đá có $8$ đội, mỗi đội gặp mỗi đội khác đúng một lần. Hỏi có tất cả bao nhiêu trận đấu?").answer).toContain("$28$");
    expect(solved("Một đa giác lồi có $10$ đỉnh thì có bao nhiêu đường chéo?").answer).toContain("$35$");
    expect(solved("Một đội có $6$ bạn nam và $5$ bạn nữ. Có bao nhiêu cách chọn ra $3$ bạn nam và $2$ bạn nữ?").answer).toContain("$200$");
    expect(solved("Từ các chữ số $0,1,2,3,4,5,6$ lập được bao nhiêu số tự nhiên lẻ có bốn chữ số khác nhau?").answer).toContain("$300$");
    expect(solved("Xếp $6$ bạn thành một hàng, trong đó bạn Lan phải đứng ở một trong hai đầu hàng. Có bao nhiêu cách xếp?").answer).toContain("$240$");
    expect(solved("Có bao nhiêu số tự nhiên từ $1$ đến $200$ chia hết cho $3$ hoặc $5$?").answer).toContain("$93$");
    expect(solved("Có bao nhiêu số tự nhiên có ba chữ số mà tổng các chữ số bằng $5$?").answer).toContain("$15$");
    expect(solved("Chứng minh rằng trong $8$ số nguyên bất kì luôn có hai số mà hiệu của chúng chia hết cho $7$.").family).toBe("pigeonhole-residue");
  });
  it("geometry lengths and areas", () => {
    expect(solved("Cho tam giác $ABC$ vuông tại $A$, đường cao $AH$. Biết $BH=3$ cm, $HC=12$ cm. Tính $AH$ và $AC$.").answer).toMatch(/AH=6.*AC=6\\sqrt\{5\}/);
    expect(solved("Cho đường tròn $(O;13\\text{ cm})$, dây $AB$ cách tâm $O$ là $5$ cm. Tính $AB$.").answer).toContain("AB=24");
    expect(solved("Cho tam giác $ABC$ có $AB=13$, $AC=15$, $BC=14$. Tính diện tích tam giác.").answer).toContain("$84$");
    expect(solved("Cho tam giác $ABC$, điểm $D$ thuộc cạnh $AB$, điểm $E$ thuộc cạnh $AC$ sao cho $DE\\parallel BC$. Biết $AD=3$, $AB=9$, $BC=12$. Tính $DE$.").answer).toContain("DE=4");
  });
  it("algebra: extremum, parameter condition, reciprocal sums", () => {
    expect(solved("Tìm giá trị lớn nhất của biểu thức $C=-x^2+6x-5$.").answer).toMatch(/là \$4\$.*x=3/);
    expect(solved("Cho phương trình $x^2-6x+m-1=0$ ($m$ là tham số). Tìm $m$ để phương trình có nghiệm kép.").answer).toContain("m=10");
    expect(solved("Cho $x+\\frac{1}{x}=4$. Tính $x^2+\\frac{1}{x^2}$.").answer).toContain("14");
  });
  it("labels each lesson with its specialist topic", () => {
    expect(solved("Tìm ƯCLN của $252$ và $198$.").topic).toBe("number_theory");
    expect(solved("Một đa giác lồi có $10$ đỉnh thì có bao nhiêu đường chéo?").topic).toBe("combinatorics");
    expect(solved("Cho tam giác $ABC$ có $AB=13$, $AC=15$, $BC=14$. Tính diện tích tam giác.").topic).toBe("geometry");
  });
});

describe("routine solver declines what it cannot answer completely (no confident wrong answers)", () => {
  it("ordered selections are not combinations", () => {
    declined("Một lớp có $30$ học sinh. Có bao nhiêu cách chọn $3$ học sinh làm lớp trưởng, lớp phó và thủ quỹ?");
  });
  it("extra conditions and extra parts", () => {
    declined("Một tổ có $10$ học sinh trong đó có $4$ nữ. Có bao nhiêu cách chọn $3$ học sinh có ít nhất một nữ?");
    declined("Từ các chữ số $0,1,2,3,4,5$ lập được bao nhiêu số có bốn chữ số khác nhau và lớn hơn $2000$?");
    declined("Tìm số dư khi chia $2^{100}+3$ cho $7$.");
    declined("Tìm các số nguyên $n$ sao cho $n+3$ chia hết cho $n-1$ và $n<10$.");
    declined("a) Tìm số dư khi chia $3^{100}$ cho $5$. b) Tìm số dư khi chia $3^{100}$ cho $7$.");
    declined("Xếp $6$ bạn thành một hàng sao cho An và Bình đứng cạnh nhau và Cường đứng đầu hàng. Có bao nhiêu cách xếp?");
  });
  it("an extremum that does not exist, or a domain-restricted one", () => {
    declined("Tìm giá trị lớn nhất của biểu thức $A=x^2-6x+10$.");
    declined("Tìm giá trị nhỏ nhất của $A=x^2-6x+10$ với $x\\ge 5$.");
  });
  it("conditions on the roots are not reduced to a discriminant condition", () => {
    declined("Cho phương trình $x^2-4x+m=0$ ($m$ là tham số). Tìm $m$ để phương trình có hai nghiệm $x_1,x_2$ thỏa mãn $x_1^2+x_2^2=10$.");
  });
  it("inconsistent or out-of-scope geometry", () => {
    declined("Cho tam giác $ABC$ có $AB=1$, $AC=2$, $BC=5$. Tính diện tích tam giác.");
    declined("Cho tam giác $ABC$ vuông tại $A$ có $AB=6$ cm, $\\widehat{B}=60^\\circ$. Tính $AC$.");
  });
  it("a false premise (no real x with x + 1/x = 1) is not computed", () => {
    declined("Cho $x+\\frac{1}{x}=1$. Tính $x^2+\\frac{1}{x^2}$.");
  });
});

describe("OCR-style text", () => {
  it("unicode superscripts and minus signs read as the same mathematics", () => {
    expect(flatten("x² − y² = 15")).toBe("x^2-y^2=15");
    expect(flatten("$\\frac{1}{x}$")).toBe("(1)/(x)");
  });
});

describe("pipeline integration", () => {
  const unavailable: JsonModel = {
    name: "none",
    model: "unavailable",
    complete: async () => {
      throw new OcrFailure("provider_error", "model unavailable", true);
    },
  };
  it("serves a certified routine lesson without any model call", async () => {
    const result = await solveProblem(unavailable, VN_GRADE_9, "Tìm ƯCLN và BCNN của $90$ và $168$.", { signal: AbortSignal.timeout(5000) });
    expect(result.model).toBe("routine-gcd-lcm");
    expect(result.verification.status).toBe("verified");
    expect(result.attempts).toBe(0);
    expect(result.lesson.finalAnswer.text).toContain("$2520$");
  });
  it("can be switched off (ablation)", async () => {
    await expect(solveProblem(unavailable, VN_GRADE_9, "Tìm ƯCLN và BCNN của $90$ và $168$.", { signal: AbortSignal.timeout(5000), routine: false })).rejects.toThrow();
  });
});
