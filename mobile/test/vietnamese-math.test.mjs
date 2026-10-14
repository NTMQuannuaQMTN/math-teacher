import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("react-native", () => ({
  StyleSheet: { flatten: (style) => Array.isArray(style) ? Object.assign({}, ...style) : style },
}));
vi.mock("@/theme", () => ({ useTheme: () => ({ colors: { text: "#111827" } }) }));
vi.mock("../src/components/math/MathText", () => import("../src/components/math/MathText.web"));

import { MathText } from "../src/components/math/MathText.web";
import { RichText } from "../src/components/lesson/RichText.web";
import { getLocale, getStrings, formatDateTime } from "../src/i18n";

describe("Vietnamese web lessons", () => {
  it("uses Vietnamese labels regardless of the device language", () => {
    expect(getLocale()).toBe("vi");
    expect(getStrings().solve.hint).toBe("Gợi ý");
    expect(getStrings().solve.nextHint).toBe("Gợi ý tiếp theo");
    expect(getStrings().common.cancel).toBe("Hủy");
    expect(formatDateTime("not-a-date")).toBe("");
  });

  it("typesets roots, fractions and indices in bold hint prose", () => {
    const html = renderToStaticMarkup(createElement(RichText, {
      text: "Bạn có thể biến đổi $x_1+\\sqrt{x_1^2+1}=\\frac{1}{x_2+\\sqrt{x_2^2+1}}$ như thế nào?",
      style: [{ fontSize: 20, fontWeight: "700" }, { color: "#111827" }],
    }));
    expect(html).toContain('class="katex"');
    expect(html).toContain('<msqrt>');
    expect(html).toContain('<mfrac>');
    expect(html).toContain("font-weight:700");
    expect(html).toContain("Bạn có thể biến đổi");
    expect(html).not.toContain("&lt;msqrt");
  });
});

describe("math rendering repairs",()=>{
 it("typesets standard model delimiters in titles, explanations and reasons",()=>{
  const html=renderToStaticMarkup(createElement(RichText,{
   text:String.raw`Vì \(x_1=\frac12\), suy ra \[x_1+x_2=3\].`,
   style:{fontSize:18},
  }));
  expect(html.match(/class="katex"/g)).toHaveLength(2);
  expect(html).toContain('<mfrac>');
  expect(html).not.toContain('\\(');
  expect(html).not.toContain('\\[');
  expect(html).not.toContain('class="raw"');
 });
 it("uses Vietnamese divisibility in legacy hint text",()=>{
  const html=renderToStaticMarkup(createElement(MathText,{text:"Vì $a\\mid b$ nên…"}));
  expect(html).toContain("⋮");expect(html).toContain("b \\vdots a");
 });
 it("renders aligned equations and never displays KaTeX red error output",()=>{
  const html=renderToStaticMarkup(createElement(MathText,{text:"$$\\begin{align*}x&=1\\\\y&=2\\end{align*}$$"}));
  expect(html).toContain('class="katex"');expect(html).not.toContain('katex-error');
  const invalid=renderToStaticMarkup(createElement(MathText,{text:"$\\unknowncommand{1}$"}));
  expect(invalid).not.toContain('katex-error');expect(invalid).not.toContain('\\unknowncommand');
 });
});
