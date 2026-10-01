import { describe, expect, it } from "vitest";
import { wrapBareLatex } from "../../shared/src/mathText";

describe("wrapBareLatex", () => {
  it("wraps formulas written without dollar signs", () => {
    expect(wrapBareLatex("Chứng minh ID^2 = IJ \\cdot IA")).toBe("Chứng minh $ID^2 = IJ \\cdot IA$");
    expect(wrapBareLatex("Từ tỉ lệ thức ID^2 = IJ \\cdot IA, bạn hãy viết")).toBe("Từ tỉ lệ thức $ID^2 = IJ \\cdot IA$, bạn hãy viết");
    expect(wrapBareLatex("Chứng minh \\widehat{IHD} = \\widehat{IDK} và tứ giác nội tiếp")).toBe("Chứng minh $\\widehat{IHD} = \\widehat{IDK}$ và tứ giác nội tiếp");
    expect(wrapBareLatex("Giải x^2 - 7x + 12 = 0.")).toBe("Giải $x^2 - 7x + 12 = 0$.");
  });

  it("leaves proper maths and plain prose alone", () => {
    expect(wrapBareLatex("Vì $AB = AC$ nên tam giác cân.")).toBe("Vì $AB = AC$ nên tam giác cân.");
    expect(wrapBareLatex("Tam giác ABC có AB = AC.")).toBe("Tam giác ABC có AB = AC.");
    expect(wrapBareLatex("$$x^{2} = 4$$ và ID^2")).toBe("$$x^{2} = 4$$ và $ID^2$");
    expect(wrapBareLatex("Giá \\$5 và x^2")).toBe("Giá \\$5 và $x^2$");
  });

  it.each([
    ["Định nghĩa biệt thức Δ = b^2 - 4ac.", "Định nghĩa biệt thức $Δ = b^2 - 4ac$."],
    ["Công thức (x - y)^2 = x^2 - 2xy + y^2.", "Công thức $(x - y)^2 = x^2 - 2xy + y^2$."],
    ["để được a^2+b^2 > 3b+3a = 3(a+b), tức là", "để được $a^2+b^2 > 3b+3a = 3(a+b)$, tức là"],
    ["Vì x^2 ta có kết quả", "Vì $x^2$ ta có kết quả"],
  ])("wraps the whole formula, never a fragment: %s", (input, expected) => {
    expect(wrapBareLatex(input)).toBe(expected);
  });
});
