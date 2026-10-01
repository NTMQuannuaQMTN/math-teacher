import { router, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Solution, SolveProgress } from "@shared/solution";
import { api } from "@/api/client";
import { AppError, errorMessage, isAbort } from "@/api/errors";
import { Button } from "@/components/Button";
import { LessonView } from "@/components/lesson/LessonView";
import { RichText } from "@/components/lesson/RichText";
import { StateView } from "@/components/StateView";
import { useStrings } from "@/i18n";
import { confirmAsync } from "@/lib/confirm";
import { lessonKey, lessonStore, type LessonProgress } from "@/state/lessonProgress";
import { scanStore } from "@/state/scanStore";
import { spacing, typography, useTheme } from "@/theme";

type Phase = { kind: "loading" } | { kind: "ready"; solution: Solution } | { kind: "error"; error: unknown };

const POLL_MS = 2000;
const MAX_POLLS = 80;
const STAGE_MS = 7000;
/** While the solve request is open, read the server's live progress this often. */
const PROGRESS_MS = 2500;

export default function SolveScreen() {
  const params = useLocalSearchParams<{ id: string; q?: string }>();
  const id = params.id;
  const questionId = params.q && /^q\d{1,2}$/.test(params.q) ? params.q : "q1";
  const key = id ? lessonKey(id, questionId) : "";
  const s = useStrings();
  const { colors } = useTheme();

  const cached = id ? lessonStore.getSolution(key) : undefined;
  // "Bài học · Bài 2" when the photo held several questions.
  const questions = id ? scanStore.get(id)?.problem?.questions ?? [] : [];
  const questionLabel = questions.length > 1 ? questions.find((q) => q.id === questionId)?.label || null : null;
  const header = <Stack.Screen options={{ title: questionLabel ? `${s.solve.title} · ${questionLabel}` : s.solve.title }} />;
  const [phase, setPhase] = useState<Phase>(cached?.status === "ready" ? { kind: "ready", solution: cached } : { kind: "loading" });
  const [stage, setStage] = useState(0);
  const [live, setLive] = useState<SolveProgress | null>(null);
  const [progress, setProgressState] = useState<LessonProgress>(() => (id ? lessonStore.getProgress(key) : { revealed: [], unlocked: 1, showSolution: false }));
  const controller = useRef<AbortController | null>(null);

  const setProgress = useCallback(
    (update: (p: LessonProgress) => LessonProgress) => {
      setProgressState((current) => {
        const next = update(current);
        if (id) lessonStore.putProgress(key, next);
        return next;
      });
    },
    [id, key],
  );

  const load = useCallback(
    async (regenerate = false) => {
      if (!id) return;
      controller.current?.abort();
      const abort = new AbortController();
      controller.current = abort;
      setStage(0);
      setLive(null);
      // Live progress: poll the pending solution while the solve request is open (older servers send none).
      let open = true;
      void (async () => {
        while (open && !abort.signal.aborted) {
          await new Promise((r) => setTimeout(r, PROGRESS_MS));
          if (!open || abort.signal.aborted) return;
          try {
            const pending = await api.getSolution(id, questionId, abort.signal);
            if (open && pending.status === "pending" && pending.progress) setLive(pending.progress);
          } catch {
            // Not created yet, or offline for a moment: keep the generic progress text.
          }
        }
      })();
      try {
        let solution: Solution;
        try {
          solution = await api.solve(id, { questionId, regenerate, signal: abort.signal });
        } catch (err) {
          if (!(err instanceof AppError && err.code === "solve_in_progress")) throw err;
          // Another request (e.g. before the student left and came back) is generating it: wait for that one.
          solution = await api.getSolution(id, questionId, abort.signal);
          for (let i = 0; solution.status === "pending" && i < MAX_POLLS; i++) {
            await new Promise((r) => setTimeout(r, POLL_MS));
            if (abort.signal.aborted) return;
            solution = await api.getSolution(id, questionId, abort.signal);
          }
        }
        if (abort.signal.aborted) return;
        if (solution.status === "ready") lessonStore.putSolution(key, solution);
        setPhase(solution.status === "ready" ? { kind: "ready", solution } : { kind: "error", error: new AppError("api", solution.error?.retryable ?? true, (solution.error?.code as never) ?? "internal_error") });
      } catch (err) {
        if (isAbort(err) || abort.signal.aborted) return;
        setPhase({ kind: "error", error: err });
      } finally {
        open = false;
      }
    },
    [id, key, questionId],
  );

  useEffect(() => {
    // load() only sets state after awaiting the network.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!cached) void load();
    return () => controller.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per problem
  }, [key]);

  useEffect(() => {
    if (phase.kind !== "loading") return;
    const timer = setInterval(() => setStage((n) => n + 1), STAGE_MS);
    return () => clearInterval(timer);
  }, [phase.kind]);

  async function regenerate() {
    const ok = await confirmAsync({ title: s.solve.regenerate, message: s.solve.leaveNote, confirmLabel: s.solve.regenerate, cancelLabel: s.common.cancel });
    if (!ok || !id) return;
    lessonStore.reset(key);
    setProgressState({ revealed: [], unlocked: 1, showSolution: false });
    setPhase({ kind: "loading" });
    void load(true);
  }

  // --- loading / error ---------------------------------------------------------
  if (phase.kind === "loading") {
    const stages = s.solve.stages;
    const fallbackLabel = stage < stages.length ? stages[stage]! : s.solve.slow;
    const label = !live
      ? fallbackLabel
      : live.stage === "writing"
        ? s.solve.live.writing(live.stepsWritten)
        : s.solve.live[live.stage];
    const elapsed = live ? `${Math.floor(live.elapsedMs / 60_000)}:${String(Math.floor(live.elapsedMs / 1000) % 60).padStart(2, "0")}` : null;
    return (
      <SafeAreaView style={[styles.flex, styles.center]} edges={["bottom"]}>
        {header}
        <View style={styles.loading} accessibilityLiveRegion="polite">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[typography.subtitle, styles.centerText, { color: colors.text }]}>{label}</Text>
          {elapsed ? <Text style={[typography.caption, styles.centerText, { color: colors.textMuted }]}>{elapsed}</Text> : null}
          {live && (live.problemKind || live.strategy) ? (
            <View style={[styles.draft, { borderColor: colors.border }]} testID="solve-draft">
              <Text style={[typography.label, { color: colors.textMuted }]}>{s.solve.live.draft.toUpperCase()}</Text>
              {live.problemKind ? <RichText text={`${s.solve.problemKind}: ${live.problemKind}`} style={[typography.body, { color: colors.text }]} /> : null}
              {live.strategy ? <RichText text={`${s.solve.strategy}: ${live.strategy}`} style={[typography.body, { color: colors.text }]} /> : null}
            </View>
          ) : null}
          <Text style={[typography.caption, styles.centerText, { color: colors.textMuted }]}>{s.solve.leaveNote}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (phase.kind === "error") {
    const retryable = !(phase.error instanceof AppError) || phase.error.retryable;
    return (
      <SafeAreaView style={[styles.flex, styles.center]} edges={["bottom"]}>
        <StateView icon="alert-circle-outline" tone="danger" title={s.solve.failedTitle} body={errorMessage(phase.error)}>
          {retryable ? (
            <Button
              testID="solve-retry"
              label={s.common.retry}
              icon="refresh"
              onPress={() => {
                setPhase({ kind: "loading" });
                void load();
              }}
            />
          ) : null}
          <Button label={s.common.back} variant="secondary" onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} />
        </StateView>
      </SafeAreaView>
    );
  }

  return (
    <>
      {header}
      <LessonView solution={phase.solution} progress={progress} setProgress={setProgress} onRegenerate={regenerate} />
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },
  centerText: { textAlign: "center" },
  loading: { alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.xl, maxWidth: 420 },
  draft: { alignSelf: "stretch", gap: spacing.xs, borderWidth: 1, borderStyle: "dashed", borderRadius: 12, padding: spacing.md },
});
