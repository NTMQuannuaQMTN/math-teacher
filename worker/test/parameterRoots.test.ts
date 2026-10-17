import { describe, expect, it } from "vitest";
import { answerParameterValues, parameterAnswerFeedback, parameterRootCondition } from "../../shared/src/parameterRoots";

const q = (eq: string, cond: string, distinct = false) => `Cho phương trình $${eq}$ ($m$ là tham số). Tìm $m$ để phương trình có hai nghiệm${distinct ? " phân biệt" : ""} $x_1,x_2$ thỏa mãn $${cond}$.`;

describe("parametric root conditions are checked numerically", () => {
  it("finds the irrational solutions and rejects a wrong answer", () => {
    const text = q("x^2-(m+2)x+m=0", "x_1^2+x_2^2=6");
    expect(parameterRootCondition(text)!.values.map((v) => +v.toFixed(4))).toEqual([-2.7321, 0.7321]);
    expect(parameterAnswerFeedback(text, "Vậy $m = 1$ hoặc $m = -5$.")).toHaveLength(1);
    expect(parameterAnswerFeedback(text, "Vậy $m=-1\\pm\\sqrt3$.")).toEqual([]);
  });
  it("respects the discriminant condition (a value with no real roots is not a solution)", () => {
    // x^2-6x+m: x1²+x2² = 36-2m = 40 gives m = -2 (Δ' = 9+2 > 0); 36-2m = 10 gives m = 13, but Δ' = 9-13 < 0
    expect(parameterRootCondition(q("x^2-6x+m=0", "x_1^2+x_2^2=40"))!.values.map((v) => Math.round(v))).toEqual([-2]);
    expect(parameterRootCondition(q("x^2-6x+m=0", "x_1^2+x_2^2=10"))!.values).toEqual([]);
    expect(parameterAnswerFeedback(q("x^2-6x+m=0", "x_1^2+x_2^2=10"), "Vậy $m=13$.")).toHaveLength(1);
    expect(parameterAnswerFeedback(q("x^2-6x+m=0", "x_1^2+x_2^2=10"), "Vậy không có giá trị m nào thỏa mãn.")).toEqual([]);
  });
  it("handles a non-symmetric condition with both labelings", () => {
    const text = q("x^2-2(m+1)x+m^2+3=0", "x_1=3x_2", true);
    expect(parameterRootCondition(text)!.values.map((v) => +v.toFixed(4))).toEqual([3]);
    expect(parameterAnswerFeedback(text, "Vậy $m=2$.")).toHaveLength(1);
  });
  it("says nothing when it cannot read the task or the answer", () => {
    expect(parameterRootCondition(q("x^2-5x+m=0", "x_1^2+x_2^2=6") + " Biết $m$ là số nguyên.")).toBeNull();
    expect(answerParameterValues("Ta chứng minh được điều phải chứng minh.")).toBeNull();
  });
});
