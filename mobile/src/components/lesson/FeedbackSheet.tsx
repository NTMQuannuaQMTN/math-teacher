import { router } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { FeedbackCategory, FeedbackRequest, ModelLesson } from "@shared/solution";
import { api } from "@/api/client";
import { errorMessage } from "@/api/errors";
import { Button } from "@/components/Button";
import { useStrings } from "@/i18n";
import { radius, spacing, typography, useTheme } from "@/theme";

const CATEGORIES: FeedbackCategory[] = ["wrong_math", "skipped_step", "not_grade9", "figure", "unclear", "language", "other"];
type Target = FeedbackRequest["target"];

interface Props {
  visible: boolean;
  onClose: () => void;
  scanId: string;
  questionId: string;
  lesson: ModelLesson;
  /** Preselected target (e.g. the step the student is looking at). */
  initialTarget?: Target;
}

function Chip({ label, selected, onPress, testID }: { label: string; selected: boolean; onPress: () => void; testID?: string }) {
  const { colors } = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={[styles.chip, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primarySoft : colors.surface }]}
    >
      <Text style={[typography.label, { color: selected ? colors.primary : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

/** "Báo lỗi": pick what is wrong (whole lesson, a step, a hint, the answer, the figure), the kind of mistake, a note. */
export function FeedbackSheet({ visible, onClose, scanId, questionId, lesson, initialTarget }: Props) {
  const { colors } = useTheme();
  const s = useStrings();
  const f = s.feedback;
  const [target, setTarget] = useState<Target>(initialTarget ?? { kind: "lesson", id: null });
  const [category, setCategory] = useState<FeedbackCategory | null>(null);
  const [note, setNote] = useState("");
  const [state, setState] = useState<{ kind: "editing" } | { kind: "sending" } | { kind: "sent" } | { kind: "error"; message: string }>({ kind: "editing" });

  useEffect(() => {
    if (!visible) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset the form each time the sheet opens
    setTarget(initialTarget ?? { kind: "lesson", id: null });
    setCategory(null);
    setNote("");
    setState({ kind: "editing" });
  }, [visible, initialTarget]);

  const targets: { target: Target; label: string }[] = [
    { target: { kind: "lesson", id: null }, label: f.target.lesson },
    ...lesson.steps.map((st, i) => ({ target: { kind: "step" as const, id: st.id }, label: f.target.step(i + 1) })),
    ...lesson.hints.map((h, i) => ({ target: { kind: "hint" as const, id: h.id }, label: f.target.hint(i + 1) })),
    { target: { kind: "answer", id: null }, label: f.target.answer },
    ...(lesson.figure ? [{ target: { kind: "figure" as const, id: null }, label: f.target.figure }] : []),
  ];
  const same = (a: Target, b: Target) => a.kind === b.kind && (a.id ?? null) === (b.id ?? null);

  async function send() {
    if (!category) return;
    setState({ kind: "sending" });
    try {
      await api.reportFeedback(scanId, questionId, { target, category, note });
      setState({ kind: "sent" });
    } catch (err) {
      setState({ kind: "error", message: errorMessage(err) });
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]} testID="feedback-sheet">
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={[typography.title, { color: colors.text }]}>{f.title}</Text>
            {state.kind === "sent" ? (
              <View style={styles.section}>
                <Text style={[typography.body, { color: colors.success }]}>{f.sent}</Text>
                <Button label={f.reportAnother} variant="secondary" size="md" onPress={() => { setCategory(null); setNote(""); setState({ kind: "editing" }); }} />
                <Button label={f.viewAll} variant="ghost" size="md" onPress={() => { onClose(); router.push("/feedback"); }} />
                <Button label={s.common.done} size="md" onPress={onClose} />
              </View>
            ) : (
              <>
                <Text style={[typography.caption, { color: colors.textMuted }]}>{f.intro}</Text>
                <Text style={[typography.label, styles.label, { color: colors.textMuted }]}>{f.whereLabel.toUpperCase()}</Text>
                <View style={styles.chips} accessibilityRole="radiogroup">
                  {targets.map((t) => (
                    <Chip key={`${t.target.kind}:${t.target.id ?? ""}`} label={t.label} selected={same(t.target, target)} onPress={() => setTarget(t.target)} />
                  ))}
                </View>
                <Text style={[typography.label, styles.label, { color: colors.textMuted }]}>{f.kindLabel.toUpperCase()}</Text>
                <View style={styles.chips} accessibilityRole="radiogroup">
                  {CATEGORIES.map((c) => (
                    <Chip key={c} testID={`feedback-category-${c}`} label={f.category[c]} selected={category === c} onPress={() => setCategory(c)} />
                  ))}
                </View>
                <Text style={[typography.label, styles.label, { color: colors.textMuted }]}>{f.noteLabel.toUpperCase()}</Text>
                <TextInput
                  testID="feedback-note"
                  value={note}
                  onChangeText={setNote}
                  placeholder={f.notePlaceholder}
                  placeholderTextColor={colors.textMuted}
                  multiline
                  maxLength={1000}
                  style={[styles.note, typography.body, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                />
                {state.kind === "error" ? <Text style={[typography.caption, { color: colors.danger }]}>{state.message}</Text> : null}
                <View style={styles.actions}>
                  <Button label={s.common.cancel} variant="ghost" size="md" onPress={onClose} style={styles.flex} />
                  <Button testID="feedback-send" label={f.send} size="md" icon="flag" onPress={send} disabled={!category} loading={state.kind === "sending"} style={styles.flex} />
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { flex: 1, justifyContent: "flex-end" },
  sheet: { maxHeight: "90%", borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, width: "100%", maxWidth: 720, alignSelf: "center" },
  content: { padding: spacing.lg, gap: spacing.sm },
  section: { gap: spacing.md, marginTop: spacing.sm },
  label: { marginTop: spacing.md },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, minHeight: 40, justifyContent: "center" },
  note: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, minHeight: 96, textAlignVertical: "top" },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
});
