import { describe, expect, it } from "vitest";
import katex from "katex";
import { slotUnderscores } from "../../shared/src/latexTidy";

describe("slot pictures", () => {
  it("draws lone underscores as empty places and keeps real subscripts", () => {
    const out = slotUnderscores("_ N _ N _ N _ N _ N _");
    expect(out).toBe(String.raw`\square N \square N \square N \square N \square N \square`);
    expect(() => katex.renderToString(out, { throwOnError: true })).not.toThrow();
    expect(slotUnderscores("x_1 + x_{2} = a_n")).toBe("x_1 + x_{2} = a_n");
  });
});
