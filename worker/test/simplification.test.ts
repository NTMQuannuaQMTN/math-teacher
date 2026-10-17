import { describe, expect, it } from "vitest";
import { simplificationFeedback } from "../../shared/src/simplification";

const st = "Rút gọn biểu thức $A=\\left(\\frac{\\sqrt x}{\\sqrt x-1}-\\frac{1}{x-\\sqrt x}\\right):\\frac{\\sqrt x+1}{x-1}$ với $x>0$, $x\\ne1$.";
describe("simplification answers are compared with the original expression", () => {
  it("rejects a wrong simplified form and accepts the right one", () => {
    expect(simplificationFeedback(st, "$A = \\frac{(\\sqrt{x}-1)^2}{\\sqrt{x}}$")).toHaveLength(1);
    expect(simplificationFeedback(st, "$A = 1$")).toHaveLength(1);
    expect(simplificationFeedback(st, "Vậy $A = \\frac{x-1}{\\sqrt{x}}$ với $x>0$, $x\\ne1$.")).toEqual([]);
  });
});
