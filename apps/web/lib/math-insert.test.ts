import assert from "node:assert/strict";
import { test } from "node:test";
import { acceptUnclear, countUnclear, insertSnippet, insideMath } from "./math-insert.ts";

test("insideMath follows the renderer's delimiters", () => {
  assert.equal(insideMath("Ta có x", 7), false);
  assert.equal(insideMath("Ta có $x", 8), true); // unclosed
  assert.equal(insideMath("$x$ và ", 7), false);
  assert.equal(insideMath("$x + $", 5), true); // just before the closing $
  assert.equal(insideMath("$$x^2$$ rồi", 11), false);
  assert.equal(insideMath("$$x^2", 4), true);
  assert.equal(insideMath("\\(a\\) b", 7), false);
  assert.equal(insideMath("giá \\$5 và x", 12), false); // escaped dollar is text
});

test("outside math the snippet is wrapped and the caret lands inside the braces", () => {
  const { value, caret } = insertSnippet("Ta có ", 6, 6, { before: "\\sqrt{", after: "}" });
  assert.equal(value, "Ta có $\\sqrt{}$");
  assert.equal(value.slice(0, caret), "Ta có $\\sqrt{");
});

test("inside math the snippet is inserted as is", () => {
  const { value, caret } = insertSnippet("$x  2$", 3, 3, { before: "\\le " });
  assert.equal(value, "$x \\le  2$");
  assert.equal(caret, 7);
});

test("the selection goes inside the snippet", () => {
  const { value, caret } = insertSnippet("$x+1$", 1, 4, { before: "\\sqrt{", after: "}" });
  assert.equal(value, "$\\sqrt{x+1}$");
  assert.equal(value.slice(caret), "}$");
});

test("accepting unclear readings keeps the reading and matches braces", () => {
  assert.equal(acceptUnclear("$(x-\\unclear{3})=0$ và \\unclear{nên}"), "$(x-3)=0$ và nên");
  assert.equal(acceptUnclear("$\\unclear{\\frac{1}{2}} + \\unclear{\\{1\\}}$"), "$\\frac{1}{2} + \\{1\\}$");
  assert.equal(acceptUnclear("$\\unclear{x$"), "$\\unclear{x$"); // unbalanced: left alone
  assert.equal(countUnclear("\\unclear{3} và \\unclear{8}"), 2);
  assert.equal(countUnclear("không có"), 0);
});

test("a \\\\ line break before ( does not open maths (same rule as the API normaliser)", () => {
  assert.equal(insideMath("\\\\(a", 4), false);
  assert.equal(insideMath("\\(a", 3), true);
});
