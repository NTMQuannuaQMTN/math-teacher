import { useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Feedback } from "@shared/solution";
import { api } from "@/api/client";
import { errorMessage } from "@/api/errors";
import { Card } from "@/components/lesson/LessonParts";
import { RichText } from "@/components/lesson/RichText";
import { StateView } from "@/components/StateView";
import { useStrings } from "@/i18n";
import { spacing, typography, useTheme } from "@/theme";

/** "Lỗi đã báo": this device's mistake reports, newest first — a recap of what the solver got wrong. */
export default function FeedbackScreen() {
  const s = useStrings();
  const f = s.feedback;
  const { colors } = useTheme();
  const [items, setItems] = useState<Feedback[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      setItems(await api.listFeedback());
      setError(null);
    } catch (err) {
      setError(errorMessage(err));
    }
  }
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load once on open; state is set after the request
    void load();
  }, []);

  if (error && !items) return <StateView icon="alert-circle-outline" tone="danger" title={f.listTitle} body={error} />;
  if (!items) {
    return (
      <View style={[styles.flex, styles.center]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (items.length === 0) return <StateView icon="flag-outline" title={f.listTitle} body={f.empty} />;

  const where = (it: Feedback) =>
    it.targetKind === "lesson" ? f.target.lesson : it.targetKind === "answer" ? f.target.answer : it.targetKind === "figure" ? f.target.figure : it.targetKind === "step" ? f.target.step(0).replace(/0$/, "") : f.target.hint(0).replace(/0$/, "");

  return (
    <SafeAreaView style={styles.flex} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
      >
        {items.map((it) => (
          <Card key={it.id}>
            <View style={styles.header}>
              <Text style={[typography.bodyStrong, { color: colors.text }, styles.flex]}>{f.category[it.category]}</Text>
              <Text style={[typography.caption, { color: colors.textMuted }]}>{new Date(it.createdAt).toLocaleString()}</Text>
            </View>
            <Text style={[typography.label, { color: colors.textMuted }]}>
              {where(it)}
              {it.targetId ? ` · ${it.targetId}` : ""} · {it.model ?? "?"} · {it.promptVersion ?? "?"}
            </Text>
            {it.problemText ? <RichText text={it.problemText.slice(0, 400)} numberOfLines={4} style={[typography.body, { color: colors.text }]} /> : null}
            {it.targetText ? (
              <View style={[styles.quote, { borderLeftColor: colors.warning, backgroundColor: colors.warningSoft }]}>
                <Text style={[typography.label, { color: colors.textMuted }]}>{f.reported}</Text>
                <RichText text={it.targetText} style={[typography.body, { color: colors.text }]} />
              </View>
            ) : null}
            {it.note ? (
              <Text style={[typography.body, { color: colors.text }]}>
                <Text style={typography.bodyStrong}>{f.note}: </Text>
                {it.note}
              </Text>
            ) : null}
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },
  content: { padding: spacing.lg, gap: spacing.md },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  quote: { borderLeftWidth: 3, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.xs, borderRadius: 6 },
});
