import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/Button";
import { MathText } from "@/components/math/MathText";
import { ProblemEditor } from "@/components/ProblemEditor";
import { useStrings } from "@/i18n";
import { radius, spacing, typography, useTheme } from "@/theme";

export interface QuestionDraft {
  label: string;
  text: string;
  included: boolean;
}

interface Props {
  index: number;
  item: QuestionDraft;
  editing: boolean;
  onEdit: () => void;
  onDoneEditing: () => void;
  onChange: (text: string) => void;
  onToggle: () => void;
}

/** One question found on the photo, on the check screen: keep/skip it, read it, fix it. */
export function QuestionCard({ index, item, editing, onEdit, onDoneEditing, onChange, onToggle }: Props) {
  const s = useStrings();
  const { colors } = useTheme();
  const title = item.label || `${s.result.question} ${index + 1}`;
  return (
    <View
      testID={`question-${index + 1}`}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: editing ? colors.primary : colors.border,
          opacity: item.included ? 1 : 0.6,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: item.included ? colors.primarySoft : colors.surfaceMuted }]}>
          <Text style={[typography.label, { color: item.included ? colors.primary : colors.textMuted }]}>{title}</Text>
        </View>
        <Pressable
          testID={`question-toggle-${index + 1}`}
          onPress={onToggle}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: item.included }}
          accessibilityLabel={`${s.result.keepQuestion}: ${title}`}
          hitSlop={8}
          style={styles.toggle}
        >
          <Ionicons name={item.included ? "checkbox" : "square-outline"} size={24} color={item.included ? colors.primary : colors.textMuted} />
          <Text style={[typography.label, { color: colors.textMuted }]}>{item.included ? s.result.keepQuestion : s.result.skipped}</Text>
        </Pressable>
      </View>

      {editing ? (
        <>
          <ProblemEditor value={item.text} onChange={onChange} testID={`question-editor-${index + 1}`} />
          <Button label={s.result.doneEditing} icon="checkmark" variant="secondary" size="md" onPress={onDoneEditing} />
        </>
      ) : (
        <>
          <MathText text={item.text} fontSize={17} placeholder={s.result.emptyPreview} />
          {item.included ? (
            <Button testID={`question-edit-${index + 1}`} label={s.result.edit} icon="create-outline" variant="ghost" size="md" onPress={onEdit} />
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, gap: spacing.sm },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  badge: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4 },
  toggle: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44 },
});
