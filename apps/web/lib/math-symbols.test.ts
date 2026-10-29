import assert from "node:assert/strict";
import { test } from "node:test";
import katex from "katex";
import { GROUPS } from "./math-symbols.ts";

const symbols = GROUPS.flatMap((g) => g.symbols);

test("every symbol renders in KaTeX, alone and with its label", () => {
  for (const s of symbols) {
    for (const tex of [`${s.before}x${s.after ?? ""}`, s.tex].filter((t): t is string => Boolean(t))) {
      assert.doesNotThrow(() => katex.renderToString(tex, { throwOnError: true }), `${s.name}: ${tex}`);
    }
  }
});

test("only notation used in official answer keys (docs/NOTATION.md)", () => {
  // ∞ ≈ ∅ ⊂ ℚ ℝ never appear; a|b, ∠ and ∥ appear only in club solutions (official keys use ⋮, a hat, //).
  const banned = ["\\infty", "\\approx", "\\varnothing", "\\emptyset", "\\subset", "\\mathbb{Q}", "\\mathbb{R}",
    "\\mid", "\\nmid", "\\angle", "\\parallel", "\\div", "\\forall", "\\exists", "\\lor"];
  for (const s of symbols) {
    for (const command of banned) assert.ok(!`${s.before}${s.after ?? ""}`.includes(command), `${s.name} uses ${command}`);
  }
  assert.equal(new Set(symbols.map((s) => s.name)).size, symbols.length, "names are unique (they are the button labels)");
});
