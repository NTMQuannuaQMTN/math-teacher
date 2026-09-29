import { describe, expect, it } from "vitest";
import { evalExpression } from "../../shared/src/expr";
import type { AnswerCheck } from "../../shared/src/solution";
import { resultParts, runAnswerCheck } from "../../shared/src/verify";

const integers = (condition: string, expected: string, domain = ["n >= 1"]): AnswerCheck => ({
  kind: "integers",
  statements: [condition, ...domain],
  assignments: [],
  expected,
});
const F = "((n+4)^4 - n^4)";

describe("remainder operator", () => {
  it("supports % and mod with a non-negative result", () => {
    expect(evalExpression("17 % 5")).toBe(2);
    expect(evalExpression("-7 mod 3")).toBe(2);
    expect(evalExpression("(2+3)^4 % 24")).toBe(625 % 24);
    expect(Number.isNaN(evalExpression("2.5 % 2"))).toBe(true);
  });
});

describe("integers check (f(n) = (n+4)^4 - n^4, a real wrong lesson)", () => {
  it("rejects the wrong answers the model gave", () => {
    // b) the model said: every n not divisible by 3. False at n = 2 (f(2) = 1280).
    const b = runAnswerCheck(integers(`${F} % 3 = 0`, "n % 3 != 0"));
    expect(b.passed).toBe(false);
    expect(b.detail).toContain("n=2");
    // c) the model said: no n. False at n = 16.
    expect(runAnswerCheck(integers(`${F} % 576 = 0`, "none")).passed).toBe(false);
  });

  it("accepts the correct answers", () => {
    expect(runAnswerCheck(integers(`${F} % 3 = 0`, "n % 3 = 1")).passed).toBe(true);
    expect(runAnswerCheck(integers(`${F} % 576 = 0`, "n % 18 = 16")).passed).toBe(true);
    expect(runAnswerCheck(integers(`${F} % 16 = 0`, "n >= 1")).passed).toBe(true);
  });
});

describe("result parts", () => {
  it("finds the lettered parts that ask for a result", () => {
    const statement =
      "Với mỗi số nguyên dương $n$, đặt $f(n)=(n+4)^{4}-n^{4}$.\na) Chứng minh $f(n)$ chia hết cho $16$.\nb) Tìm $n$ để $f(n)$ chia hết cho $3$.\nc) Tìm $n$ để $f(n)$ chia hết cho $24^{2}$.";
    expect(resultParts(statement)).toEqual(["b", "c"]);
    expect(resultParts("Giải phương trình $x^2 = 4$.")).toEqual([]);
  });
});
