import { describe, expect, it } from "vitest";
import { looksLikeGeometry } from "../src/solver/routing";

describe("looksLikeGeometry", () => {
  it.each([
    "Cho tam giác $ABC$ cân tại $A$. Tính $\\widehat{B}$.",
    "Cho đường tròn $(O; 5)$ và dây $AB = 8$.",
    "Triangle ABC is isosceles with AB = AC.",
    "Lines a and b are parallel.",
    "Tính $\\angle ABC$",
    "Chứng minh $AM \\perp BC$",
  ])("geometry: %s", (text) => expect(looksLikeGeometry(text)).toBe(true));

  it.each([
    "Giải phương trình $x^{2} - 7x + 10 = 0$",
    "Rút gọn biểu thức $A = \\frac{\\sqrt{x}}{\\sqrt{x}-1}$",
    "Solve the inequality $2(3x - 1) - 5 > 4x + 3$.",
    "Một mảnh vườn có diện tích 84 m². Tính chiều dài.",
    "Giải hệ phương trình",
  ])("not geometry: %s", (text) => expect(looksLikeGeometry(text)).toBe(false));
});
