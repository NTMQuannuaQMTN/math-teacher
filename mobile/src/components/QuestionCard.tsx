import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/Button";
import { MathText } from "@/components/math/MathText";
import { ProblemEditor } from "@/components/ProblemEditor";
import { useStrings } from "@/i18n";
import { radius, spacing, typography, useTheme } from "@/theme";

export interface QuestionDraft {
  label: string;
  text: string;
}

interface Props {
  index: number;
  item: QuestionDraft;
  editing: boolean;
  onEdit: () => void;
  onDoneEditing: () => void;
  onChange: (text: string) => void;
  onDelete: () => void;
}

/** One question found on the photo, on the check screen: read it, fix it, or delete it. */
export function QuestionCard({ index, item, editing, onEdit, onDoneEditing, onChange, onDelete }: Props) {
  const s = useStrings();
  const { colors } = useTheme();
  const title = item.label || `${s.result.question} ${index + 1}`;
  return (
    <View testID={`question-${index + 1}`} style={[styles.card, { backgroundColor: colors.surface, borderColor: editing ? colors.primary : colors.border }]}>
      <View style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
        <Text style={[typography.label, { color: colors.primary }]}>{title}</Text>
      </View>

      {editing ? (
        <>
          <ProblemEditor value={item.text} onChange={onChange} testID={`question-editor-${index + 1}`} />
          <Button label={s.result.doneEditing} icon="checkmark" variant="secondary" size="md" onPress={onDoneEditing} />
        </>
      ) : (
        <>
          <MathText text={item.text} fontSize={17} placeholder={s.result.emptyPreview} />
          <View style={styles.actions}>
            <Button testID={`question-edit-${index + 1}`} label={s.result.edit} icon="create-outline" variant="secondary" size="md" onPress={onEdit} style={styles.flex} />
            <Button
              testID={`question-delete-${index + 1}`}
              label={s.common.delete}
              icon="trash-outline"
              variant="danger"
              size="md"
              onPress={onDelete}
              accessibilityHint={`${s.common.delete}: ${title}`}
              style={styles.flex}
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, gap: spacing.sm },
  badge: { alignSelf: "flex-start", borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4 },
  actions: { flexDirection: "row", gap: spacing.sm },
});
