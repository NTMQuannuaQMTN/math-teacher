import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { radius, spacing, typography, useTheme } from "@/theme";

interface Props {
  icon: ComponentProps<typeof Ionicons>["name"];
  title: string;
  body?: string;
  tone?: "neutral" | "danger";
  children?: ReactNode;
}

/** Centered empty / error / permission state with optional actions below. */
export function StateView({ icon, title, body, tone = "neutral", children }: Props) {
  const { colors } = useTheme();
  const accent = tone === "danger" ? colors.danger : colors.primary;
  const soft = tone === "danger" ? colors.dangerSoft : colors.primarySoft;
  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: soft }]}>
        <Ionicons name={icon} size={34} color={accent} />
      </View>
      <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
        {title}
      </Text>
      {body ? <Text style={[styles.body, { color: colors.textMuted }]}>{body}</Text> : null}
      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", paddingHorizontal: spacing.xl, paddingVertical: spacing.xl, gap: spacing.md },
  iconWrap: { width: 72, height: 72, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  title: { ...typography.title, textAlign: "center" },
  body: { ...typography.body, textAlign: "center", maxWidth: 360 },
  actions: { alignSelf: "stretch", gap: spacing.sm, marginTop: spacing.sm },
});
