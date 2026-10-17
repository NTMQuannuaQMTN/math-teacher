import { describe, expect, it } from "vitest";
import { fixJsonLatexEscapes } from "../src/solver/pipeline";

describe("single-backslash LaTeX in model JSON", () => {
  it("restores commands whose first letter is a JSON escape (\\f, \\b, \\t, \\r, \\n)", () => {
    const raw = String.raw`{"a":"$(a-\frac{3}{2})^2$, \begin{cases}x\end{cases}, \text{và}, \theta, \right), \neq"}`;
    expect(JSON.parse(fixJsonLatexEscapes(raw)).a).toBe(String.raw`$(a-\frac{3}{2})^2$, \begin{cases}x\end{cases}, \text{và}, \theta, \right), \neq`);
  });
  it("leaves correct escapes and real line breaks alone", () => {
    const raw = String.raw`{"a":"\\frac{1}{2}\nDòng mới, \\text{ok}"}`;
    expect(JSON.parse(fixJsonLatexEscapes(raw)).a).toBe("\\frac{1}{2}\nDòng mới, \\text{ok}");
  });
});
