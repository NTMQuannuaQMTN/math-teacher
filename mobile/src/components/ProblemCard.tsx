import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { mathTextToPlain } from "@shared/mathText";
import type { Scan } from "@shared/contract";
import { formatDateTime, useStrings } from "@/i18n";
import { radius, spacing, typography, useTheme } from "@/theme";

interface Props {
  scan: Scan;
  onPress: (scan: Scan) => void;
}

/** One saved problem in a list: thumbnail, readable text preview, date. */
export const ProblemCard = memo(function ProblemCard({ scan, onPress }: Props) {
  const { colors } = useTheme();
  const s = useStrings();
  const questions = scan.problem?.questions ?? [];
  const text = questions[0]?.text ?? scan.problem?.text ?? scan.ocr?.formattedText ?? "";
  const more = questions.length > 1 ? s.problem.moreQuestions.replace("{n}", String(questions.length - 1)) : null;
  // Lists show plain Unicode (x², √, ≤) instead of a WebView per row: fast and still readable.
  const preview = mathTextToPlain(text).replace(/\s*\n\s*/g, " ");
  const date = formatDateTime(scan.confirmedAt ?? scan.createdAt);

  return (
    <Pressable
      onPress={() => onPress(scan)}
      accessibilityRole="button"
      accessibilityLabel={`${s.a11y.openProblem}. ${preview}. ${date}`}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: pressed ? colors.surfaceMuted : colors.surface, borderColor: colors.border },
      ]}
    >
      <Image
        source={{ uri: scan.image.url }}
        style={[styles.thumb, { backgroundColor: colors.surfaceMuted }]}
        contentFit="cover"
        transition={120}
        cachePolicy="memory-disk"
        recyclingKey={scan.id}
        accessibilityIgnoresInvertColors
      />
      <View style={styles.body}>
        <Text style={[styles.preview, { color: colors.text }]} numberOfLines={3}>
          {preview || "—"}
        </Text>
        <View style={styles.metaRow}>
          <Text style={[styles.date, { color: colors.textMuted }]}>{date}</Text>
          {more ? (
            <View style={[styles.more, { backgroundColor: colors.primarySoft }]}>
              <Text style={[typography.label, { color: colors.primary }]}>{more}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 88,
  },
  thumb: { width: 64, height: 64, borderRadius: radius.sm },
  body: { flex: 1, gap: spacing.xs },
  preview: { ...typography.body, fontSize: 15, lineHeight: 21 },
  date: { ...typography.caption },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  more: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 1 },
});
