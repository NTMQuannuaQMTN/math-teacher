import { describe, expect, it } from "vitest";
import { wrapBareNumbers } from "../src/solver/routine/text";

describe("scanned wording", () => {
  it("wraps bare divisors and Unicode powers outside formulas", () => {
    expect(wrapBareNumbers("Tìm $n$ để $f(n)$ chia hết cho 24². Chứng minh chia hết cho 16 với mọi $n$."))
      .toBe("Tìm $n$ để $f(n)$ chia hết cho $24^{2}$. Chứng minh chia hết cho $16$ với mọi $n$.");
    expect(wrapBareNumbers("Tính $x^2 + 1$ khi chia hết cho $3$")).toBe("Tính $x^2 + 1$ khi chia hết cho $3$");
  });
});
