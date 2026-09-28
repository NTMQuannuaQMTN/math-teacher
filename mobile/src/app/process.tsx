import { Image } from "expo-image";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/api/client";
import { AppError, errorMessage, isAbort } from "@/api/errors";
import { Button } from "@/components/Button";
import { StateView } from "@/components/StateView";
import { useStrings } from "@/i18n";
import { scanDraft } from "@/state/scanDraft";
import { scanStore } from "@/state/scanStore";
import { radius, spacing, typography, useTheme } from "@/theme";

type Phase = { kind: "working"; stage: "uploading" | "reading" | "slow" } | { kind: "error"; error: unknown };

const READING_AFTER_MS = 1500;
const SLOW_AFTER_MS = 20_000;
const IN_PROGRESS_RETRY_MS = 2500;
const MAX_IN_PROGRESS_RETRIES = 30;

export default function ProcessScreen() {
  const s = useStrings();
  const { colors } = useTheme();
  const draft = scanDraft.get();
  const prepared = draft?.prepared;
  const [phase, setPhase] = useState<Phase>({ kind: "working", stage: "uploading" });
  const controller = useRef<AbortController | null>(null);

  const run = useCallback(async () => {
    const current = scanDraft.get();
    if (!current?.prepared || !current.idempotencyKey) return;
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;

    const timers = [
      setTimeout(() => setPhase((p) => (p.kind === "working" ? { kind: "working", stage: "reading" } : p)), READING_AFTER_MS),
      setTimeout(() => setPhase((p) => (p.kind === "working" ? { kind: "working", stage: "slow" } : p)), SLOW_AFTER_MS),
    ];
    try {
      for (let attempt = 0; ; attempt++) {
        try {
          // Same idempotency key on every retry: if the first request actually
          // reached the server, we get that scan back instead of a duplicate.
          const scan = await api.createScan({
            imageUri: current.prepared.uri,
            source: current.source,
            idempotencyKey: current.idempotencyKey,
            signal: abort.signal,
          });
          if (abort.signal.aborted) return;
          scanStore.put(scan);
          scanDraft.clear();
          router.replace({ pathname: "/scan/[id]", params: { id: scan.id } });
          return;
        } catch (err) {
          const stillRunning = err instanceof AppError && err.code === "ocr_in_progress";
          if (!stillRunning || attempt >= MAX_IN_PROGRESS_RETRIES) throw err;
          await new Promise((resolve) => setTimeout(resolve, IN_PROGRESS_RETRY_MS));
          if (abort.signal.aborted) return;
        }
      }
    } catch (err) {
      if (isAbort(err) || abort.signal.aborted) return;
      setPhase({ kind: "error", error: err });
    } finally {
      timers.forEach(clearTimeout);
    }
  }, []);

  useEffect(() => {
    // run() only sets state after awaiting the network or from timers, never synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void run();
    // Leaving the screen cancels the request. The server still finishes and
    // keeps the result, which then shows up on Home as an unfinished scan.
    return () => controller.current?.abort();
  }, [run]);

  function cancel() {
    controller.current?.abort();
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  if (!prepared) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
        <StateView icon="image-outline" title={s.review.missing}>
          <Button label={s.process.retake} icon="camera" onPress={() => router.replace("/camera")} />
          <Button label={s.common.back} variant="secondary" onPress={() => router.replace("/")} />
        </StateView>
      </SafeAreaView>
    );
  }

  if (phase.kind === "error") {
    const err = phase.error;
    const retryable = !(err instanceof AppError) || err.retryable;
    const connection = err instanceof AppError && (err.kind === "network" || err.kind === "timeout");
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <Image source={{ uri: prepared.uri }} style={[styles.thumb, { borderColor: colors.border }]} contentFit="contain" />
          <StateView
            icon={connection ? "cloud-offline-outline" : "alert-circle-outline"}
            tone="danger"
            title={connection ? s.process.sendFailedTitle : s.result.ocrFailedTitle}
            body={errorMessage(err)}
          >
            {retryable ? (
              <Button
                testID="process-retry"
                label={s.common.retry}
                icon="refresh"
                onPress={() => {
                  setPhase({ kind: "working", stage: "uploading" });
                  void run();
                }}
              />
            ) : null}
            <Button
              label={s.process.retake}
              icon="camera-outline"
              variant={retryable ? "secondary" : "primary"}
              onPress={() => (draft?.source === "camera" ? router.replace("/camera") : router.back())}
            />
          </StateView>
        </View>
      </SafeAreaView>
    );
  }

  const label =
    phase.stage === "uploading" ? s.process.uploading : phase.stage === "reading" ? s.process.reading : s.process.slow;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.center}>
        <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Image
            source={{ uri: prepared.uri }}
            style={styles.preview}
            contentFit="contain"
            accessibilityLabel={s.a11y.problemImage}
          />
        </View>
        <View style={styles.status} accessibilityLiveRegion="polite" accessible accessibilityLabel={label}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        </View>
      </View>
      <View style={styles.footer}>
        <Button testID="process-cancel" label={s.process.cancel} variant="secondary" onPress={cancel} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, justifyContent: "center", paddingHorizontal: spacing.lg, gap: spacing.xl },
  previewCard: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.sm,
    height: 220,
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
  },
  preview: { flex: 1 },
  thumb: { height: 120, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, marginHorizontal: spacing.xl },
  status: { alignItems: "center", gap: spacing.md, minHeight: 110, paddingHorizontal: spacing.lg },
  label: { ...typography.subtitle, textAlign: "center" },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
});
