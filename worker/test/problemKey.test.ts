import { describe, expect, it } from "vitest";
import { canonicalProblem, problemKey } from "../src/solver/problemKey";

describe("shared lesson key", () => {
  it("ignores the problem number, spacing and line breaks", async () => {
    const a = "Bài 3. Giải phương trình $x^{2} - 5x + 6 = 0$.";
    const b = "Câu 1:  Giải phương trình\n$x^{2} - 5x + 6 = 0$.";
    const c = "Giải phương trình $x^{2} - 5x + 6 = 0$.";
    expect(canonicalProblem(a)).toBe(canonicalProblem(c));
    expect(await problemKey(a)).toBe(await problemKey(b));
  });

  it("treats decomposed Vietnamese diacritics as the same text", async () => {
    const t = "Giải phương trình $x = 1$";
    expect(await problemKey(t.normalize("NFD"))).toBe(await problemKey(t));
  });

  it("keeps different maths apart", async () => {
    expect(await problemKey("Giải $x^{2} - 5x + 6 = 0$")).not.toBe(await problemKey("Giải $x^{2} - 5x - 6 = 0$"));
    expect(await problemKey("Tính $AB$")).not.toBe(await problemKey("Tính $ab$"));
  });
});
