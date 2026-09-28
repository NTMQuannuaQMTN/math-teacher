import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Scan } from "@shared/contract";
import { api } from "@/api/client";
import { AppError, errorMessage } from "@/api/errors";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { MathText } from "@/components/math/MathText";
import { StateView } from "@/components/StateView";
import { formatDateTime, useStrings } from "@/i18n";
import { confirmAsync } from "@/lib/confirm";
import { loadRecentSnapshot, scanStore, updateRecentSnapshot } from "@/state/scanStore";
import { radius, spacing, typography, useTheme } from "@/theme";

export default function ProblemScreen() {
  const { id, saved } = useLocalSearchParams<{ id: string; saved?: string }>();
  const s = useStrings();
  const { colors } = useTheme();

  const [scan, setScan] = useState<Scan | null>(() => (id ? scanStore.get(id) ?? null : null));
  const [loadError, setLoadError] = useState<unknown>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<unknown>(null);
  const [viewer, setViewer] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    api
      .getScan(id)
      .then((fresh) => {
        if (cancelled) return;
        scanStore.put(fresh);
        setScan(fresh);
      })
      .catch(async (err) => {
        if (cancelled) return;
        // Offline: fall back to the on-device snapshot.
        const cached = (await loadRecentSnapshot()).find((item) => item.id === id);
        if (cached) setScan((current) => current ?? cached);
        else setLoadError(err);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function remove() {
    if (!scan || deleting) return;
    const ok = await confirmAsync({
      title: s.problem.deleteTitle,
      message: s.problem.deleteBody,
      confirmLabel: s.common.delete,
      cancelLabel: s.common.cancel,
      destructive: true,
    });
    if (!ok) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteScan(scan.id);
      scanStore.remove(scan.id);
      await updateRecentSnapshot({ removeId: scan.id });
      if (router.canGoBack()) router.back();
      else router.replace("/");
    } catch (err) {
      setDeleteError(err);
      setDeleting(false);
    }
  }

  if (!scan) {
    if (loadError) {
      const notFound = loadError instanceof AppError && loadError.code === "not_found";
      return (
        <SafeAreaView style={[styles.flex, styles.center]} edges={["bottom"]}>
          <StateView icon="document-outline" tone="danger" title={notFound ? s.result.notFound : errorMessage(loadError)}>
            <Button label={s.common.back} variant="secondary" onPress={() => router.replace("/")} />
          </StateView>
        </SafeAreaView>
      );
    }
    return (
      <View style={[styles.flex, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const text = scan.problem?.text ?? scan.ocr?.formattedText ?? "";

  return (
    <SafeAreaView style={styles.flex} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        {saved === "1" ? <Banner tone="success" message={s.problem.saved} /> : null}

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MathText testID="saved-problem" text={text} fontSize={19} />
        </View>

        <View style={styles.meta}>
          <Ionicons name="time-outline" size={16} color={colors.textMuted} />
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            {s.problem.scannedOn} {formatDateTime(scan.confirmedAt ?? scan.createdAt)}
            {scan.problem?.edited ? ` · ${s.problem.edited}` : ""}
          </Text>
        </View>

        <Pressable
          onPress={() => setViewer(true)}
          accessibilityRole="imagebutton"
          accessibilityLabel={s.problem.viewPhoto}
          style={[styles.photo, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Image source={{ uri: scan.image.url }} style={styles.flex} contentFit="contain" transition={150} cachePolicy="memory-disk" />
          <View style={[styles.expandHint, { backgroundColor: colors.overlay }]}>
            <Ionicons name="expand-outline" size={16} color="#FFFFFF" />
          </View>
        </Pressable>

        {deleteError ? <Banner tone="danger" message={`${s.problem.deleteFailed} ${errorMessage(deleteError)}`} /> : null}

        <View style={styles.actions}>
          <Button
            testID="scan-another"
            label={s.problem.scanAnother}
            icon="camera"
            onPress={() => {
              router.dismissTo("/");
              router.push("/camera");
            }}
          />
          <Button label={s.common.delete} icon="trash-outline" variant="danger" onPress={remove} loading={deleting} />
        </View>
      </ScrollView>

      <Modal visible={viewer} animationType="fade" onRequestClose={() => setViewer(false)} supportedOrientations={["portrait", "landscape"]}>
        <SafeAreaView style={styles.viewer}>
          <Pressable onPress={() => setViewer(false)} accessibilityRole="button" accessibilityLabel={s.common.close} style={styles.viewerClose} hitSlop={12}>
            <Ionicons name="close" size={30} color="#FFFFFF" />
          </Pressable>
          <Image source={{ uri: scan.image.url }} style={styles.flex} contentFit="contain" accessibilityLabel={s.a11y.problemImage} />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },
  content: { padding: spacing.lg, gap: spacing.md, maxWidth: 720, width: "100%", alignSelf: "center" },
  card: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: spacing.lg },
  meta: { flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingHorizontal: spacing.xs },
  photo: { height: 180, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden", padding: spacing.xs },
  expandHint: { position: "absolute", right: spacing.sm, bottom: spacing.sm, borderRadius: radius.pill, padding: 6 },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
  viewer: { flex: 1, backgroundColor: "#000000" },
  viewerClose: { alignSelf: "flex-end", width: 48, height: 48, alignItems: "center", justifyContent: "center", margin: spacing.sm },
});
