// Run: npm run test:unit
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderMathText, restoreLatexEscapes } from "./math.ts";

test("LaTeX that JSON turned into control characters is restored (seen live: “rac{\\Delta}{4}”)", () => {
  assert.equal(restoreLatexEscapes("Tính $\frac{\\Delta}{4} > 0$"), "Tính $\\frac{\\Delta}{4} > 0$");
  assert.equal(restoreLatexEscapes("$2 \times 3$, $\beta$, $\right)$"), "$2 \\times 3$, $\\beta$, $\\right)$");
  assert.equal(restoreLatexEscapes("Dòng 1\nDòng 2\t 3"), "Dòng 1\nDòng 2\t 3"); // real breaks and spacing stay
  const rendered = renderMathText("Tính $\frac{\\Delta}{4} = m^2 + 1 > 0$.");
  assert.deepEqual(rendered.errors, []);
  assert.ok(rendered.html.includes("frac-line") && !rendered.html.includes("\f")); // a real fraction, no form feed
});
