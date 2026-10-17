import { describe, expect, it } from "vitest";
import { dropRepeatedLines, tidyNumberBrackets as t } from "../../shared/src/latexTidy";

describe("template brackets around plain numbers", () => {
  it("removes them where they are noise", () => {
    expect(t("\\Delta=(-5)^{2}-4\\cdot(1)\\cdot(6)=1")).toBe("\\Delta=(-5)^{2}-4\\cdot1\\cdot6=1");
    expect(t("t^2-(5)t+(6)")).toBe("t^2-5t+6");
    expect(t("\\sqrt{x_1^2+(1)}>|x_1|")).toBe("\\sqrt{x_1^2+1}>|x_1|");
    expect(t("a_{n+2}=(4)(p^{n+1}+q^{n+1})-(1)(p^{n}+q^{n})")).toBe("a_{n+2}=4(p^{n+1}+q^{n+1})-(p^{n}+q^{n})");
    expect(t("\\begin{gathered}(2)+(3)=5,\\quad (2)(3)=6\\end{gathered}")).toBe("\\begin{gathered}2+3=5,\\quad 2\\cdot 3=6\\end{gathered}");
  });
  it("keeps meaningful brackets", () => {
    expect(t("x=\\frac{-(-5)\\pm\\sqrt{1}}{2}")).toBe("x=\\frac{-(-5)\\pm\\sqrt{1}}{2}");
    expect(t("(3)+(-3)=0")).toBe("3+(-3)=0");
    expect(t("P(0)=1,\\ f(2)=3,\\ 2(3),\\ x_{(1)}")).toBe("P(0)=1,\\ f(2)=3,\\ 2(3),\\ x_{(1)}");
    expect(t("\\widehat{A}+\\widehat{B}=90^\\circ\\quad (1)")).toBe("\\widehat{A}+\\widehat{B}=90^\\circ\\quad (1)");
  });
  it("shows a line once when substitution left it unchanged", () => {
    expect(dropRepeatedLines("\\begin{gathered}t^2-5t+6=0\\\\t^{2}-5t+6=0\\end{gathered}")).toBe("t^2-5t+6=0");
    expect(dropRepeatedLines("\\begin{gathered}a=1\\\\b=2\\end{gathered}")).toBe("\\begin{gathered}a=1\\\\b=2\\end{gathered}");
  });
});

import { bracketAlternatives } from "../../shared/src/latexTidy";
describe("'or' written as a system brace", () => {
  it("becomes the hoặc bracket when one variable gets several values", () => {
    expect(bracketAlternatives("m^2-m-6=0 \\Leftrightarrow \\begin{cases} m = 3 \\\\ m = -2 \\end{cases}")).toBe("m^2-m-6=0 \\Leftrightarrow \\left[\\begin{array}{l}m = 3\\\\m = -2\\end{array}\\right.");
  });
  it("leaves real systems alone", () => {
    const sys = "\\begin{cases} x + y = 5 \\\\ xy = 6 \\end{cases}";
    expect(bracketAlternatives(sys)).toBe(sys);
    expect(bracketAlternatives("\\begin{cases} x = 1 \\\\ y = 2 \\end{cases}")).toBe("\\begin{cases} x = 1 \\\\ y = 2 \\end{cases}");
  });
});
