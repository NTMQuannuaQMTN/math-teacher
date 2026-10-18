import { describe, expect, it } from "vitest";
import { verifyLesson } from "../../shared/src/verify";
import { radicalSubstitutionEquationLesson } from "../src/solver/radicalSubstitutionEquation";

describe("radical equation with a repeated quadratic", () => {
  it.each([
    ["Giải phương trình $x^2-2x-\\sqrt{x^2-2x+4}=2$.", ["1-\\sqrt{6}", "1+\\sqrt{6}"]],
    ["Giải phương trình $x^2+2x-\\sqrt{x^2+2x+4}=2$.", ["-1-\\sqrt{6}", "-1+\\sqrt{6}"]],
  ])("solves and independently substitutes every root: %s", (question, roots) => {
    const lesson = radicalSubstitutionEquationLesson(question)!;
    expect(lesson).toBeTruthy();
    for (const root of roots) expect(lesson.finalAnswer.text).toContain(root);
    const checked = verifyLesson(lesson, { problemText: question });
    expect(checked.verification.checks.filter((c) => !c.passed)).toEqual([]);
    expect(checked.feedback).toEqual([]);
  });

  it("declines when the quadratic outside the radical is different", () => {
    expect(radicalSubstitutionEquationLesson("Giải phương trình $x^2-2x-\\sqrt{x^2+2x+4}=2$." )).toBeNull();
  });
});
