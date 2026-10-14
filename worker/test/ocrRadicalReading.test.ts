import { describe, expect, it } from "vitest";
import { radicalReadingConflict } from "../src/ocr/normalize";
import { joinSystem, stripTaskLabel } from "../src/solver/routine/text";

describe("OCR reading checks", () => {
  it("flags √(x + 1) when the statement's domain is that of √x", () => {
    expect(radicalReadingConflict("P = (√(x + 1))/(√(x - 1)) với x ≥ 0, x ≠ 1")).toBe(true);
    expect(radicalReadingConflict("P = \\frac{\\sqrt{x + 1}}{\\sqrt{x - 1}} với x \\ge 0")).toBe(true);
  });
  it("does not flag consistent readings", () => {
    expect(radicalReadingConflict("P = (√x + 1)/(√x − 1) với x ≥ 0, x ≠ 1")).toBe(false);
    expect(radicalReadingConflict("Giải phương trình √(x + 3) = x − 3")).toBe(false);
    expect(radicalReadingConflict("Cho √(x - 1) với x ≥ 1")).toBe(false);
  });
});

describe("solver input from OCR", () => {
  it("drops the problem number and a point value", () => {
    expect(stripTaskLabel("Bài 2. Giải phương trình: x² + 5x + 6 = 0")).toBe("Giải phương trình: x² + 5x + 6 = 0");
    expect(stripTaskLabel("Câu 3 (1,5 điểm): Tìm ƯCLN của 84 và 36.")).toBe("Tìm ƯCLN của 84 và 36.");
    expect(stripTaskLabel("Bài toán 2 người cùng làm")).toBe("Bài toán 2 người cùng làm");
  });
  it("turns OCR's boxed brace into a system", () => {
    expect(joinSystem("Giải hệ phương trình:\n☐ 2x + y = 5\n☐ x - 3y = -1")).toBe("Giải hệ phương trình: $\\begin{cases}2x+y=5\\\\x-3y=-1\\end{cases}$.");
    expect(joinSystem("Giải hệ phương trình: 2x + y = 5; x − 3y = −1")).toContain("\\begin{cases}2x+y=5\\\\x-3y=-1\\end{cases}");
    expect(joinSystem("Giải hệ phương trình $\\begin{cases}x+y=5\\\\xy=6\\end{cases}$")).toBe("Giải hệ phương trình $\\begin{cases}x+y=5\\\\xy=6\\end{cases}$");
  });
});
