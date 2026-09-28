import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { radius, spacing, typography, useTheme } from "@/theme";

interface Props {
  tone: "info" | "warning" | "danger" | "success";
  title?: string;
  message: string;
}

/** Inline status message. Announced to screen readers when it appears. */
export function Banner({ tone, title, message }: Props) {
  const { colors } = useTheme();
  const toneStyle = {
    info: { bg: colors.primarySoft, fg: colors.primary, icon: "information-circle" as const },
    warning: { bg: colors.warningSoft, fg: colors.warning, icon: "alert-circle" as const },
    danger: { bg: colors.dangerSoft, fg: colors.danger, icon: "close-circle" as const },
    success: { bg: colors.successSoft, fg: colors.success, icon: "checkmark-circle" as const },
  }[tone];

  return (
    <View
      style={[styles.container, { backgroundColor: toneStyle.bg }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Ionicons name={toneStyle.icon} size={22} color={toneStyle.fg} style={styles.icon} />
      <View style={styles.texts}>
        {title ? <Text style={[styles.title, { color: colors.text }]}>{title}</Text> : null}
        <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  icon: { marginTop: 1 },
  texts: { flex: 1, gap: 2 },
  title: { ...typography.bodyStrong },
  message: { ...typography.body, fontSize: 15, lineHeight: 21 },
});
