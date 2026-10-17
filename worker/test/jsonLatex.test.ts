import { describe, expect, it } from "vitest";
import { normalizeProblemText } from "../../shared/src/mathText";
import { fixJsonLatexEscapes, restoreLatexControls } from "../src/solver/jsonLatex";

describe("LaTeX backslashes lost as JSON escapes", () => {
  it("a repair or outline response with a single-backslash \\frac parses to \\frac, not 'rac'", () => {
    const raw = String.raw`{"text":"$(a-\frac{3}{2})^2>\frac{9}{2}$ \Rightarrow \beta"}`;
    expect(JSON.parse(fixJsonLatexEscapes(raw)).text).toBe(String.raw`$(a-\frac{3}{2})^2>\frac{9}{2}$ \Rightarrow \beta`);
  });
  it("restores control characters that already replaced a backslash", () => {
    expect(restoreLatexControls({ a: ["-\frac{3}{2}", "\times 2"], b: "line\nnext" })).toEqual({ a: [String.raw`-\frac{3}{2}`, String.raw`\times 2`], b: "line\nnext" });
    expect(normalizeProblemText("r+s=-\frac{3}{2}")).toBe(String.raw`r+s=-\frac{3}{2}`);
  });
});
