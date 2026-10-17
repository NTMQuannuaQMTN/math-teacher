import { describe, expect, it } from "vitest";
import { expressionMod, integerTarget, integerTargetFeedback } from "../../shared/src/integerTargets";

describe("exact last digits and remainders", () => {
  it("computes huge expressions modulo m", () => {
    expect(expressionMod("2^{2026}+3^{2026}", 10n)).toBe(3n);
    expect(expressionMod("2^{100}+3^{100}", 7n)).toBe((2n ** 100n + 3n ** 100n) % 7n);
    expect(expressionMod("7^{2^{10}}\\cdot 3-1", 9n)).toBe((7n ** 1024n * 3n - 1n) % 9n);
  });
  it("flags an answer that states another digit", () => {
    expect(integerTargetFeedback("Tìm chữ số tận cùng của $2^{2026}+3^{2026}$.", "Chữ số tận cùng của $2^{2026}+3^{2026}$ là 9.")).toHaveLength(1);
    expect(integerTargetFeedback("Tìm chữ số tận cùng của $2^{2026}+3^{2026}$.", "Vậy chữ số tận cùng là $3$.")).toEqual([]);
  });
});
describe("find all n with P(n) a perfect square or prime", () => {
  it("checks every stated value and finds missing ones", () => {
    const q = "Tìm tất cả các số tự nhiên $n$ sao cho $n^2+6n+40$ là số chính phương.";
    // (n+3)^2 + 31 = k^2 → (k-n-3)(k+n+3) = 31 → n = 12
    expect(integerTarget(q)).toMatchObject({ kind: "predicate", found: [12n] });
    expect(integerTargetFeedback(q, "Vậy $n=12$.")).toEqual([]);
    expect(integerTargetFeedback(q, "Vậy $n=0$ hoặc $n=12$.")).toHaveLength(1);
  });
  it("says nothing when the solutions are not a finite list", () => {
    expect(integerTarget("Tìm số nguyên dương $n$ để $n^2+n+41$ là số nguyên tố.")).toBeNull();
  });
});
