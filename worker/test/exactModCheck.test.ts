import { describe, expect, it } from "vitest";
import { runAnswerCheck } from "../../shared/src/verify";

describe("answer checks with huge powers", () => {
  it("computes (2^100 + 3^100) % 7 exactly", () => {
    expect(runAnswerCheck({ kind: "value", statements: ["(2^100 + 3^100) % 7"], assignments: [], expected: "6" } as never).passed).toBe(true);
    expect(runAnswerCheck({ kind: "value", statements: ["(2^100 + 3^100) % 7"], assignments: [], expected: "4" } as never).passed).toBe(false);
  });
});
