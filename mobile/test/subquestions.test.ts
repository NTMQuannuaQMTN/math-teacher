import { describe, expect, it } from "vitest";
import { separateSubquestions } from "../src/components/lesson/LessonParts";

describe("separateSubquestions", () => {
  it("puts each exam subquestion on its own line", () => {
    expect(separateSubquestions("a) Một cách ghi thỏa mãn là $A=3$. b) Tổng nhỏ nhất là $19/4$."))
      .toBe("a) Một cách ghi thỏa mãn là $A=3$.\nb) Tổng nhỏ nhất là $19/4$.");
  });

  it("does not split labels inside a formula", () => {
    expect(separateSubquestions("Ta có $a) + b)$ và tiếp tục."))
      .toBe("Ta có $a) + b)$ và tiếp tục.");
  });
});
