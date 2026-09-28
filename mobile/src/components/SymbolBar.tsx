import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { useStrings } from "@/i18n";
import { MIN_TOUCH, radius, spacing, useTheme } from "@/theme";

export interface Snippet {
  label: string;
  /** LaTeX to insert. `|` marks where the cursor goes (removed on insert). */
  tex: string;
  a11y: string;
}

/** Symbols a Grade 9 student most often needs to fix an OCR mistake. */
export const SNIPPETS: Snippet[] = [
  { label: "x²", tex: "^{2}|", a11y: "squared" },
  { label: "xⁿ", tex: "^{|}", a11y: "power" },
  { label: "a⁄b", tex: "\\frac{|}{}", a11y: "fraction" },
  { label: "√", tex: "\\sqrt{|}", a11y: "square root" },
  { label: "≤", tex: "\\le |", a11y: "less than or equal" },
  { label: "≥", tex: "\\ge |", a11y: "greater than or equal" },
  { label: "≠", tex: "\\ne |", a11y: "not equal" },
  { label: "±", tex: "\\pm |", a11y: "plus minus" },
  { label: "×", tex: "\\times |", a11y: "times" },
  { label: "·", tex: "\\cdot |", a11y: "dot" },
  { label: "π", tex: "\\pi |", a11y: "pi" },
  { label: "°", tex: "^{\\circ}|", a11y: "degrees" },
  { label: "∠", tex: "\\widehat{|}", a11y: "angle" },
  { label: "△", tex: "\\triangle |", a11y: "triangle" },
  { label: "x₁", tex: "_{|}", a11y: "subscript" },
  { label: "{ }", tex: "\\begin{cases} | \\\\  \\end{cases}", a11y: "system of equations" },
];

/** True if `index` is inside a `$…$` maths region (odd number of unescaped `$` before it). */
export function isInsideMath(text: string, index: number): boolean {
  let count = 0;
  for (let i = 0; i < index && i < text.length; i++) {
    if (text[i] === "$" && text[i - 1] !== "\\") count += 1;
  }
  return count % 2 === 1;
}

/**
 * Inserts a snippet at the selection. Outside maths it wraps the snippet in
 * `$…$` so the student never has to know about delimiters.
 */
export function insertSnippet(
  text: string,
  selection: { start: number; end: number },
  snippet: Snippet,
): { text: string; cursor: number } {
  const inMath = isInsideMath(text, selection.start);
  const wrapped = inMath ? snippet.tex : `$${snippet.tex}$`;
  const cursorOffset = wrapped.indexOf("|");
  const insert = wrapped.replace("|", "");
  const next = text.slice(0, selection.start) + insert + text.slice(selection.end);
  return { text: next, cursor: selection.start + cursorOffset };
}

export function SymbolBar({ onInsert }: { onInsert: (snippet: Snippet) => void }) {
  const { colors } = useTheme();
  const s = useStrings();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="always"
      contentContainerStyle={styles.row}
      accessibilityLabel={s.result.symbols}
    >
      {SNIPPETS.map((snippet) => (
        <Pressable
          key={snippet.label}
          onPress={() => onInsert(snippet)}
          accessibilityRole="button"
          accessibilityLabel={snippet.a11y}
          style={({ pressed }) => [
            styles.chip,
            { backgroundColor: pressed ? colors.primarySoft : colors.surfaceMuted, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.label, { color: colors.text }]}>{snippet.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingVertical: spacing.xs },
  chip: {
    minWidth: MIN_TOUCH,
    height: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 18, fontWeight: "500" },
});
