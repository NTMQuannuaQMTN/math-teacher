import { describe, expect, it } from "vitest";
import {
  containsVietnamese,
  isWellFormedMathText,
  latexToPlain,
  mathTextToPlain,
  normalizeProblemText,
  parseMathText,
} from "../../shared/src/mathText";

describe("parseMathText", () => {
  it("splits inline and display maths", () => {
    expect(parseMathText("Giải $x^2=4$ và\n$$\\frac{1}{2}$$")).toEqual([
      { kind: "text", value: "Giải " },
      { kind: "math", value: "x^2=4", display: false },
      { kind: "text", value: " và\n" },
      { kind: "math", value: "\\frac{1}{2}", display: true },
    ]);
  });

  it("treats an unterminated dollar as literal text", () => {
    expect(parseMathText("costs $5 each")).toEqual([{ kind: "text", value: "costs $5 each" }]);
  });

  it("supports escaped dollars", () => {
    expect(parseMathText("price \\$3 and $x$")).toEqual([
      { kind: "text", value: "price $3 and " },
      { kind: "math", value: "x", display: false },
    ]);
  });

  it("does not let inline maths span a blank line", () => {
    const segments = parseMathText("a $x\n\ny$ b");
    expect(segments.every((s) => s.kind === "text")).toBe(true);
  });

  it("keeps escaped dollars inside maths", () => {
    expect(parseMathText("$a \\$ b$")).toEqual([{ kind: "math", value: "a \\$ b", display: false }]);
  });

  it("handles empty input", () => {
    expect(parseMathText("")).toEqual([]);
  });
});

describe("isWellFormedMathText", () => {
  it("accepts balanced markup", () => {
    expect(isWellFormedMathText("Tìm $x$ biết $\\frac{x}{2} = 3$")).toBe(true);
  });
  it("rejects unbalanced dollars", () => {
    expect(isWellFormedMathText("Tìm $x biết")).toBe(false);
  });
  it("rejects unbalanced braces in maths", () => {
    expect(isWellFormedMathText("$\\frac{x}{2$")).toBe(false);
  });
  it("rejects LaTeX leaking into prose (mismatched delimiters)", () => {
    expect(isWellFormedMathText("Giá $5, tìm $x^{2")).toBe(false);
    expect(isWellFormedMathText("Tìm \\frac{1}{2}")).toBe(false);
  });
  it("rejects Vietnamese prose swallowed into maths, but allows \\text{}", () => {
    expect(isWellFormedMathText("$x$ và $y là số$")).toBe(false);
    expect(isWellFormedMathText("$x \\text{ (cm) } + \\text{với}$")).toBe(true);
  });
});

describe("latexToPlain", () => {
  it.each([
    ["x^{2} + 5x + 6 = 0", "x² + 5x + 6 = 0"],
    ["\\frac{a+1}{b}", "(a+1)/b"],
    ["\\sqrt{x} \\ge 0", "√x ≥ 0"],
    ["\\sqrt[3]{8}", "∛8"],
    ["x_{1} + x_{2}", "x₁ + x₂"],
    ["\\widehat{ABC} = 90^{\\circ}", "∠ABC = 90°"],
    ["\\triangle ABC", "△ ABC"],
    ["x \\in \\mathbb{R}", "x ∈ ℝ"],
    ["2^{n+1}", "2ⁿ⁺¹"],
    ["a^{bc}", "a^(bc)"],
  ])("%s → %s", (tex, plain) => {
    expect(latexToPlain(tex)).toBe(plain);
  });

  it("renders systems readably", () => {
    expect(latexToPlain("\\begin{cases} x + y = 3 \\\\ x - y = 1 \\end{cases}")).toBe("{ x + y = 3 ; x - y = 1");
  });

  it("never throws on garbage", () => {
    for (const input of ["\\", "{{{", "^", "\\frac{", "\\sqrt[", "_{", "}}}}"]) {
      expect(() => latexToPlain(input)).not.toThrow();
    }
  });
});

describe("mathTextToPlain", () => {
  it("converts a mixed Vietnamese problem", () => {
    expect(mathTextToPlain("Bài 1. Giải phương trình:\n$$x^{2} - 4 = 0$$")).toBe("Bài 1. Giải phương trình:\nx² - 4 = 0");
  });
});

describe("normalizeProblemText", () => {
  it("composes decomposed Vietnamese diacritics (NFD → NFC)", () => {
    const decomposed = "Giải phương trình".normalize("NFD");
    expect(decomposed).not.toBe("Giải phương trình");
    expect(normalizeProblemText(decomposed)).toBe("Giải phương trình");
  });
  it("strips control and zero-width characters", () => {
    expect(normalizeProblemText("x\u0000 +​ 1﻿")).toBe("x + 1");
  });
  it("collapses blank lines and trims", () => {
    expect(normalizeProblemText("  a\r\n\r\n\r\n\r\nb  ")).toBe("a\n\nb");
  });
});

describe("containsVietnamese", () => {
  it("detects Vietnamese", () => {
    expect(containsVietnamese("Chứng minh rằng")).toBe(true);
  });
  it("does not flag English", () => {
    expect(containsVietnamese("Prove that x > 0")).toBe(false);
  });
});
