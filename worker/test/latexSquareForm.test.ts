import { describe, expect, it } from "vitest";
import { fraction, shiftedPowerLatex, sumLatex } from "../../shared/src/rationalPolynomial";
import { parameterEquationLesson } from "../src/solver/parameterEquation";
import { rootFourthPowerLesson } from "../src/solver/rootFourthPower";

describe("completed-square formulas read like a student's", () => {
  it("drops zero shifts, unit coefficients and bracketed constants", () => {
    expect(sumLatex([[fraction(4n), shiftedPowerLatex("m", fraction(0n), 2)], [fraction(4n), ""]])).toBe("4m^{2}+4");
    expect(sumLatex([[fraction(1n), shiftedPowerLatex("m", fraction(1n), 2)], [fraction(8n), ""]])).toBe("(m-1)^{2}+8");
    expect(sumLatex([[fraction(-1n), shiftedPowerLatex("m", fraction(-3n, 2n), 2)], [fraction(-2n), ""]])).toBe("-(m+\\frac{3}{2})^{2}-2");
    expect(shiftedPowerLatex("m", fraction(-1n, 2n), 1)).toBe("m+\\frac{1}{2}");
  });
  it("no '(4)(m-(0))^2+(4)' or 'm-(-…)' in served lessons", () => {
    const texts = [
      parameterEquationLesson("Cho phương trình $x^2-2mx-1=0$, với $m$ là số thực. Chứng minh phương trình luôn có hai nghiệm phân biệt."),
      rootFourthPowerLesson("Cho phương trình $x^2-2(m+1)x+2m=0$ ($m$ là tham số). Chứng minh $x_1^4+x_2^4>\\frac92$."),
    ].map((r) => JSON.stringify(r!.lesson));
    for (const t of texts) {
      expect(t).not.toMatch(/\(0\)|-\(-|\+\(-|\(\d+\)\(m|\+\(\d+\)/);
    }
    expect(texts[0]).toContain("\\\\Delta=4m^{2}+4");
  });
});
