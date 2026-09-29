import { useState } from "react";
import { Platform, StyleSheet, Text, TextInput, type NativeSyntheticEvent, type TextInputSelectionChangeEventData } from "react-native";
import { LIMITS } from "@shared/contract";
import { isWellFormedMathText } from "@shared/mathText";
import { Banner } from "@/components/Banner";
import { MathText } from "@/components/math/MathText";
import { SymbolBar, insertSnippet, type Snippet } from "@/components/SymbolBar";
import { useDebounced } from "@/hooks/useDebounced";
import { useStrings } from "@/i18n";
import { radius, spacing, typography, useTheme } from "@/theme";

/** Source editor for one problem: symbol bar, text field, markup warning, live typeset preview. */
export function ProblemEditor({ value, onChange, testID }: { value: string; onChange: (text: string) => void; testID?: string }) {
  const s = useStrings();
  const { colors } = useTheme();
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [forcedSelection, setForcedSelection] = useState<{ start: number; end: number } | undefined>();
  const preview = useDebounced(value, 250);

  function onInsert(snippet: Snippet) {
    const result = insertSnippet(value, selection, snippet);
    onChange(result.text);
    const caret = { start: result.cursor, end: result.cursor };
    setSelection(caret);
    setForcedSelection(caret);
  }

  function onSelectionChange(e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) {
    setSelection(e.nativeEvent.selection);
    setForcedSelection(undefined);
  }

  return (
    <>
      <SymbolBar onInsert={onInsert} />
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChange}
        selection={forcedSelection}
        onSelectionChange={onSelectionChange}
        multiline
        autoFocus
        autoCorrect={false}
        autoCapitalize="none"
        spellCheck={false}
        maxLength={LIMITS.maxProblemChars}
        placeholder={s.result.emptyEditor}
        placeholderTextColor={colors.textMuted}
        textAlignVertical="top"
        style={[styles.editor, { color: colors.text, backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
        accessibilityLabel={s.result.editing}
      />
      {preview.trim() && !isWellFormedMathText(preview) ? <Banner tone="warning" message={s.result.markupWarning} /> : null}
      <Text style={[typography.label, { color: colors.textMuted }]}>{s.result.preview.toUpperCase()}</Text>
      <MathText text={preview} placeholder={s.result.emptyPreview} fontSize={17} />
    </>
  );
}

const styles = StyleSheet.create({
  editor: {
    minHeight: 120,
    maxHeight: 260,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    fontSize: 17,
    lineHeight: 24,
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
  },
});
