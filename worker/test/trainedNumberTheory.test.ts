import { describe, expect, it } from "vitest";
import { verifyLesson } from "../../shared/src/verify";
import { proofDependencyFeedback } from "../../shared/src/proofDependencies";
import { latexFeedback } from "../src/solver/latexCheck";
import { stepClaimFeedback } from "../../shared/src/stepClaims";
import { numericDivisibilityFeedback } from "../../shared/src/numericDivisibility";
import { trainedDivisibilityGcdLesson } from "../src/solver/trainedNumberTheory";

const question = `Câu 3 (2 điểm). Cho các số nguyên dương $m, n$ thỏa mãn: $m^2 + m + n^2$ chia hết cho tích $mn$ (1).
a) Chứng minh không tồn tại $m, n$ thỏa mãn (1) khi $n = 3$.
b) Tìm $m, n$ thỏa mãn (1) biết $m$ chia hết cho $n$.
c) Ký hiệu $d$ là ước chung lớn nhất của $m$ và $n$. Chứng minh nếu $m, n$ thỏa mãn (1) thì $m = d^2$.`;

describe("trained divisibility and gcd proof", () => {
  it("produces the complete three-part proof with machine-checkable cases", () => {
    const lesson = trainedDivisibilityGcdLesson(question);
    expect(lesson).not.toBeNull();
    expect(lesson!.finalAnswer.text).toContain("(4,2)");
    expect(lesson!.finalAnswer.text).toContain("m=d^2");
    expect(lesson!.steps.map((step) => step.title)).toEqual(expect.arrayContaining([
      "Câu a: suy ra $m$ là ước của $9$", "Câu b: đặt $m=kn$", "Câu c: chứng minh $x\\mid d$",
    ]));
    expect(latexFeedback(lesson!)).toEqual([]);
    expect(proofDependencyFeedback(lesson!, question)).toEqual([]);
    expect(stepClaimFeedback(lesson!)).toEqual([]);
    expect(numericDivisibilityFeedback(lesson!)).toEqual([]);
    const checked = verifyLesson(lesson!, { problemText: question });
    expect(["verified", "partial"]).toContain(checked.verification.status);
    expect(checked.verification.checks.every((check) => check.passed)).toBe(true);
  });

  it("does not claim unrelated number-theory problems", () => {
    expect(trainedDivisibilityGcdLesson("Tìm số dư của $7^{100}$ khi chia cho $5$." )).toBeNull();
  });
});
