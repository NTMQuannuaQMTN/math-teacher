import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Scan } from "@shared/contract";
import { api } from "@/api/client";
import { AppError } from "@/api/errors";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { ProblemCard } from "@/components/ProblemCard";
import { StateView } from "@/components/StateView";
import { useStartUpload } from "@/hooks/useStartUpload";
import { useStrings } from "@/i18n";
import { loadRecentSnapshot, saveRecentSnapshot, scanStore } from "@/state/scanStore";
import { radius, spacing, typography, useTheme } from "@/theme";

const RECENT_COUNT = 5;

export default function HomeScreen() {
  const { colors } = useTheme();
  const s = useStrings();
  const insets = useSafeAreaInsets();
  const upload = useStartUpload();

  const [recent, setRecent] = useState<Scan[] | null>(null);
  const [draft, setDraft] = useState<Scan | null>(null);
  const [offline, setOffline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Show the offline snapshot instantly, then refresh from the server.
  useEffect(() => {
    void loadRecentSnapshot().then((cached) => setRecent((current) => current ?? cached));
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [confirmed, drafts] = await Promise.all([
        api.listScans({ status: "confirmed", limit: 30 }),
        api.listScans({ status: "draft", limit: 1 }),
      ]);
      scanStore.putMany([...confirmed.items, ...drafts.items]);
      setRecent(confirmed.items);
      setDraft(drafts.items[0] ?? null);
      setOffline(false);
      void saveRecentSnapshot(confirmed.items);
    } catch (err) {
      setOffline(err instanceof AppError && (err.kind === "network" || err.kind === "timeout"));
      setRecent((current) => current ?? []);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const onPullRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const openProblem = useCallback((scan: Scan) => {
    router.push({ pathname: "/problem/[id]", params: { id: scan.id } });
  }, []);

  const shown = recent?.slice(0, RECENT_COUNT) ?? [];

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onPullRefresh} tintColor={colors.textMuted} />}
    >
      <View style={styles.brand}>
        <View style={[styles.logo, { backgroundColor: colors.primary }]}>
          <Text style={styles.logoGlyph}>∑</Text>
        </View>
        <View style={styles.brandText}>
          <Text style={[styles.appName, { color: colors.text }]} accessibilityRole="header">
            {s.appName}
          </Text>
          <Text style={[styles.tagline, { color: colors.textMuted }]}>{s.tagline}</Text>
        </View>
      </View>

      <Pressable
        testID="scan-button"
        onPress={() => router.push("/camera")}
        accessibilityRole="button"
        accessibilityLabel={s.home.scan}
        accessibilityHint={s.home.scanHint}
        style={({ pressed }) => [styles.scanCard, { backgroundColor: pressed ? colors.primaryPressed : colors.primary }]}
      >
        <View style={styles.scanIcon}>
          <Ionicons name="camera" size={34} color={colors.primary} />
        </View>
        <View style={styles.scanTexts}>
          <Text style={styles.scanTitle}>{s.home.scan}</Text>
          <Text style={styles.scanHint}>{s.home.scanHint}</Text>
        </View>
        <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
      </Pressable>

      <Button
        testID="upload-button"
        label={s.home.upload}
        icon="images-outline"
        variant="secondary"
        onPress={upload.start}
        loading={upload.busy}
      />

      {offline ? <Banner tone="warning" message={s.home.offline} /> : null}

      {draft ? (
        <Pressable
          onPress={() => router.push({ pathname: "/scan/[id]", params: { id: draft.id } })}
          accessibilityRole="button"
          accessibilityLabel={`${s.home.unfinishedTitle}. ${s.home.unfinishedBody}`}
          style={({ pressed }) => [
            styles.unfinished,
            { backgroundColor: pressed ? colors.surfaceMuted : colors.warningSoft, borderColor: colors.border },
          ]}
        >
          <Ionicons name="time-outline" size={24} color={colors.warning} />
          <View style={{ flex: 1 }}>
            <Text style={[typography.bodyStrong, { color: colors.text }]}>{s.home.unfinishedTitle}</Text>
            <Text style={[typography.caption, { color: colors.textMuted }]}>{s.home.unfinishedBody}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]} accessibilityRole="header">
          {s.home.recent}
        </Text>
        {recent && recent.length > RECENT_COUNT ? (
          <Pressable onPress={() => router.push("/history")} hitSlop={12} accessibilityRole="link">
            <Text style={[typography.bodyStrong, { color: colors.primary }]}>{s.home.seeAll}</Text>
          </Pressable>
        ) : null}
      </View>

      {recent === null ? (
        <View style={styles.skeletons} accessibilityLabel={s.common.loading}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.skeleton, { backgroundColor: colors.surfaceMuted }]} />
          ))}
        </View>
      ) : shown.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <StateView icon="document-text-outline" title={s.home.emptyTitle} body={s.home.emptyBody} />
        </View>
      ) : (
        <View style={styles.list}>
          {shown.map((scan) => (
            <ProblemCard key={scan.id} scan={scan} onPress={openProblem} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, gap: spacing.lg, maxWidth: 720, width: "100%", alignSelf: "center" },
  brand: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.sm },
  logo: { width: 48, height: 48, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  logoGlyph: { color: "#FFFFFF", fontSize: 28, fontWeight: "700", marginTop: -2 },
  brandText: { flex: 1 },
  appName: { ...typography.display },
  tagline: { ...typography.body, fontSize: 15 },
  scanCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.xl,
    minHeight: 120,
  },
  scanIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  scanTexts: { flex: 1, gap: 2 },
  scanTitle: { color: "#FFFFFF", fontSize: 22, lineHeight: 28, fontWeight: "700" },
  scanHint: { color: "rgba(255,255,255,0.88)", fontSize: 15, lineHeight: 20 },
  unfinished: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.sm },
  sectionTitle: { ...typography.title },
  list: { gap: spacing.sm },
  skeletons: { gap: spacing.sm },
  skeleton: { height: 88, borderRadius: radius.lg },
  emptyCard: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth },
});
