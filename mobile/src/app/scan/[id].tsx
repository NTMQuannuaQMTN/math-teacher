import { Image } from "expo-image";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputSelectionChangeEventData,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LIMITS, type Scan } from "@shared/contract";
import { isWellFormedMathText, normalizeProblemText } from "@shared/mathText";
import { api } from "@/api/client";
import { AppError, errorMessage } from "@/api/errors";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { MathText } from "@/components/math/MathText";
import { QuestionCard, type QuestionDraft } from "@/components/QuestionCard";
import { StateView } from "@/components/StateView";
import { SymbolBar, insertSnippet, type Snippet } from "@/components/SymbolBar";
import { useDebounced } from "@/hooks/useDebounced";
import { useStrings } from "@/i18n";
import { confirmAsync } from "@/lib/confirm";
import { PREFETCH_SOLVE_ON_SAVE } from "@/lib/config";
import { lessonKey, lessonStore } from "@/state/lessonProgress";
import { scanStore, updateRecentSnapshot } from "@/state/scanStore";
import { radius, spacing, typography, useTheme } from "@/theme";

const POLL_MS = 2500;
const MAX_POLLS = 40;

/** Questions to review when the photo held several problems; null for a single problem. */
function initialQuestions(scan: Scan | null): QuestionDraft[] | null {
  const problems = scan?.ocr?.problems ?? [];
  return problems.length > 1 ? problems.map((p) => ({ label: p.label, text: p.text, included: true })) : null;
}

function isOcrPending(scan: Scan): boolean {
  return scan.status === "draft" && scan.ocr === null && scan.ocrError === null;
}

export default function ScanResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = useStrings();
  const { colors } = useTheme();
  const navigation = useNavigation();

  const [scan, setScan] = useState<Scan | null>(() => (id ? scanStore.get(id) ?? null : null));
  const [loadError, setLoadError] = useState<unknown>(null);
  const [text, setText] = useState(() => scan?.ocr?.formattedText ?? "");
  const [editing, setEditing] = useState(false);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [forcedSelection, setForcedSelection] = useState<{ start: number; end: number } | undefined>();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<unknown>(null);
  const [rereading, setRereading] = useState(false);
  const [rereadError, setRereadError] = useState<unknown>(null);
  const [photoExpanded, setPhotoExpanded] = useState(false);
  const [questions, setQuestions] = useState<QuestionDraft[] | null>(() => initialQuestions(scan));
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);
  const allowLeave = useRef(false);

  const originalText = scan?.ocr?.formattedText ?? "";
  const originalQuestions = initialQuestions(scan);
  const dirty = questions
    ? JSON.stringify(questions) !== JSON.stringify(originalQuestions)
    : normalizeProblemText(text) !== normalizeProblemText(originalText);
  const previewText = useDebounced(text, 250);

  const applyScan = useCallback((next: Scan, resetText: boolean) => {
    scanStore.put(next);
    setScan(next);
    if (resetText) {
      setText(next.ocr?.formattedText ?? "");
      setQuestions(initialQuestions(next));
      setEditingQuestion(null);
    }
  }, []);

  // Load (or refresh) the scan; poll while OCR is still running server-side.
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    let polls = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      try {
        const fresh = await api.getScan(id);
        if (cancelled) return;
        setLoadError(null);
        const wasPending = !scan || isOcrPending(scan);
        applyScan(fresh, wasPending);
        if (fresh.status === "confirmed") {
          allowLeave.current = true;
          router.replace({ pathname: "/problem/[id]", params: { id: fresh.id } });
          return;
        }
        if (isOcrPending(fresh) && polls++ < MAX_POLLS) timer = setTimeout(load, POLL_MS);
      } catch (err) {
        if (!cancelled && !scan) setLoadError(err);
      }
    };
    if (!scan || isOcrPending(scan)) void load();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per id; `scan` is read as initial state
  }, [id]);

  // Don't let a student lose their edits by accident.
  useEffect(() => {
    return navigation.addListener("beforeRemove", (event) => {
      if (!dirty || allowLeave.current) return;
      event.preventDefault();
      void confirmAsync({
        title: s.result.discardTitle,
        message: s.result.discardBody,
        confirmLabel: s.result.discard,
        cancelLabel: s.result.keepEditing,
        destructive: true,
      }).then((discard) => {
        if (discard) navigation.dispatch(event.data.action);
      });
    });
  }, [navigation, dirty, s]);

  async function save() {
    if (!scan || saving) return;
    Keyboard.dismiss();
    setSaving(true);
    setSaveError(null);
    try {
      const kept = questions?.filter((q) => q.included && q.text.trim());
      const saved = await api.confirmScan(scan.id, kept ? { questions: kept.map(({ label, text: t }) => ({ label, text: t })) } : { text });
      scanStore.put(saved);
      void updateRecentSnapshot({ upsert: saved });
      // Prefetch only single-question photos; with several, the student picks which ones to solve.
      if (PREFETCH_SOLVE_ON_SAVE && saved.problem?.questions.length === 1) {
        // Fire and forget: if the student opens the lesson before this finishes,
        // their request gets "in progress" and waits for this same solve.
        lessonStore.reset(saved.id);
        void api
          .solve(saved.id)
          .then((solution) => solution.status === "ready" && lessonStore.putSolution(lessonKey(saved.id), solution))
          .catch(() => undefined);
      }
      allowLeave.current = true;
      router.replace({ pathname: "/problem/[id]", params: { id: saved.id, saved: "1" } });
    } catch (err) {
      setSaveError(err);
      setSaving(false);
    }
  }

  async function readAgain() {
    if (!scan || rereading) return;
    if (dirty) {
      const ok = await confirmAsync({
        title: s.result.discardTitle,
        message: s.result.discardBody,
        confirmLabel: s.result.readAgain,
        cancelLabel: s.common.cancel,
      });
      if (!ok) return;
    }
    setRereading(true);
    setRereadError(null);
    try {
      applyScan(await api.retryOcr(scan.id), true);
      setEditing(false);
    } catch (err) {
      setRereadError(err);
    } finally {
      setRereading(false);
    }
  }

  function retake() {
    router.dismissTo("/");
    router.push("/camera");
  }

  function startTyping() {
    setText("");
    setEditing(true);
  }

  function onInsert(snippet: Snippet) {
    const result = insertSnippet(text, selection, snippet);
    setText(result.text);
    const caret = { start: result.cursor, end: result.cursor };
    setSelection(caret);
    setForcedSelection(caret);
  }

  function onSelectionChange(e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) {
    setSelection(e.nativeEvent.selection);
    setForcedSelection(undefined);
  }

  // --- loading / error states -------------------------------------------------
  if (!scan) {
    if (loadError) {
      const notFound = loadError instanceof AppError && loadError.code === "not_found";
      return (
        <SafeAreaView style={[styles.flex, styles.center]} edges={["bottom"]}>
          <StateView
            icon={notFound ? "document-outline" : "cloud-offline-outline"}
            tone="danger"
            title={notFound ? s.result.notFound : s.result.ocrFailedTitle}
            body={notFound ? undefined : errorMessage(loadError)}
          >
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

  const ocr = scan.ocr;
  const pending = isOcrPending(scan);
  const keptCount = questions ? questions.filter((q) => q.included && q.text.trim()).length : 0;
  const hasText = questions ? keptCount > 0 : text.trim().length > 0;
  const noText = !!ocr && (ocr.status === "no_math_found" || ocr.status === "unreadable") && !editing && !hasText;
  const ocrFailed = !ocr && !!scan.ocrError && !editing;
  const isDemo = ocr?.provider === "mock";

  return (
    <SafeAreaView style={styles.flex} edges={["bottom"]}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
      >
        <Pressable
          onPress={() => setPhotoExpanded((v) => !v)}
          accessibilityRole="imagebutton"
          accessibilityLabel={s.a11y.problemImage}
          style={[styles.photo, { backgroundColor: colors.surface, borderColor: colors.border, height: photoExpanded ? 360 : 140 }]}
        >
          <Image source={{ uri: scan.image.url }} style={styles.flex} contentFit="contain" transition={150} cachePolicy="memory-disk" />
        </Pressable>

        {pending || rereading ? (
          <View style={[styles.card, styles.pending, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[typography.bodyStrong, { color: colors.text }]}>{rereading ? s.result.reading : s.process.reading}</Text>
          </View>
        ) : ocrFailed ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <StateView
              icon="alert-circle-outline"
              tone="danger"
              title={s.result.ocrFailedTitle}
              body={s.errorCodes[scan.ocrError!.code]}
            >
              {scan.ocrError!.retryable ? <Button label={s.result.readAgain} icon="refresh" onPress={readAgain} /> : null}
              <Button label={s.result.typeItYourself} icon="create-outline" variant="secondary" onPress={startTyping} />
              <Button label={s.result.retake} icon="camera-outline" variant="secondary" onPress={retake} />
            </StateView>
          </View>
        ) : noText ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <StateView
              icon={ocr!.status === "unreadable" ? "eye-off-outline" : "search-outline"}
              title={ocr!.status === "unreadable" ? s.result.unreadableTitle : s.result.noMathTitle}
              body={ocr!.status === "unreadable" ? s.result.unreadableBody : s.result.noMathBody}
            >
              <Button label={s.result.retake} icon="camera" onPress={retake} />
              <Button label={s.result.typeItYourself} icon="create-outline" variant="secondary" onPress={startTyping} />
            </StateView>
          </View>
        ) : (
          <>
            {isDemo ? <Banner tone="info" title={s.common.demoOcr} message={s.common.demoOcrHint} /> : null}
            {ocr?.status === "low_quality" && !editing ? <Banner tone="warning" message={s.result.lowQuality} /> : null}
            {ocr?.issues.includes("multiple_problems") && !editing && !questions ? <Banner tone="info" message={s.result.multipleProblems} /> : null}
            {rereadError ? <Banner tone="danger" message={errorMessage(rereadError)} /> : null}

            {questions ? (
              <>
                <Banner tone="info" title={s.result.questionsFoundTitle.replace("{n}", String(questions.length))} message={s.result.questionsFoundBody} />
                {questions.map((q, i) => (
                  <QuestionCard
                    key={i}
                    index={i}
                    item={q}
                    editing={editingQuestion === i}
                    onEdit={() => setEditingQuestion(i)}
                    onDoneEditing={() => {
                      Keyboard.dismiss();
                      setEditingQuestion(null);
                    }}
                    onChange={(value) => setQuestions((all) => all && all.map((item, k) => (k === i ? { ...item, text: value } : item)))}
                    onToggle={() => setQuestions((all) => all && all.map((item, k) => (k === i ? { ...item, included: !item.included } : item)))}
                  />
                ))}
                <Button label={s.result.readAgain} icon="refresh" variant="ghost" size="md" onPress={readAgain} />
              </>
            ) : (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: editing ? colors.primary : colors.border }]}>
              <View style={styles.cardHeader}>
                <Text style={[typography.label, { color: colors.textMuted }]}>
                  {editing ? s.result.editing.toUpperCase() : s.result.subtitle}
                </Text>
              </View>

              {editing ? (
                <>
                  <SymbolBar onInsert={onInsert} />
                  <TextInput
                    testID="problem-editor"
                    value={text}
                    onChangeText={setText}
                    selection={forcedSelection}
                    onSelectionChange={onSelectionChange}
                    multiline
                    autoFocus
                    autoCorrect={false}
                    autoCapitalize="none"
                    spellCheck={false}
                    maxLength={LIMITS.maxProblemChars}
                    placeholder={s.result.emptyEditor}
                    placeholderTextColor={colors.textMuted}
                    textAlignVertical="top"
                    style={[
                      styles.editor,
                      { color: colors.text, backgroundColor: colors.surfaceMuted, borderColor: colors.border },
                    ]}
                    accessibilityLabel={s.result.editing}
                  />
                  {previewText.trim() && !isWellFormedMathText(previewText) ? (
                    <Banner tone="warning" message={s.result.markupWarning} />
                  ) : null}
                  <Text style={[typography.label, { color: colors.textMuted }]}>{s.result.preview.toUpperCase()}</Text>
                  <MathText text={previewText} placeholder={s.result.emptyPreview} fontSize={17} />
                  <Button
                    label={s.result.doneEditing}
                    icon="checkmark"
                    variant="secondary"
                    size="md"
                    onPress={() => {
                      Keyboard.dismiss();
                      setEditing(false);
                    }}
                  />
                </>
              ) : (
                <>
                  <MathText testID="problem-rendered" text={text} placeholder={s.result.emptyPreview} fontSize={19} />
                  <View style={styles.inlineActions}>
                    <Button testID="edit-button" label={s.result.edit} icon="create-outline" variant="secondary" size="md" onPress={() => setEditing(true)} style={styles.flex} />
                    {ocr ? (
                      <Button label={s.result.readAgain} icon="refresh" variant="ghost" size="md" onPress={readAgain} style={styles.flex} />
                    ) : null}
                  </View>
                </>
              )}
            </View>
            )}
          </>
        )}
      </ScrollView>

      {!pending && !ocrFailed && !noText ? (
        <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          {saveError ? <Banner tone="danger" message={`${s.result.saveFailed} ${errorMessage(saveError)}`} /> : null}
          <View style={styles.bottomRow}>
            <Button label={s.result.retake} icon="camera-outline" variant="secondary" onPress={retake} style={styles.retake} disabled={saving} />
            <Button
              testID="save-button"
              label={saving ? s.result.saving : questions ? s.result.saveQuestions.replace("{n}", String(keptCount)) : s.result.save}
              icon="checkmark-circle"
              onPress={save}
              loading={saving}
              disabled={!hasText || rereading}
              style={styles.flex}
            />
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },
  content: { padding: spacing.lg, gap: spacing.md, maxWidth: 720, width: "100%", alignSelf: "center" },
  photo: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden", padding: spacing.xs },
  card: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, gap: spacing.md },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pending: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 96 },
  editor: {
    minHeight: 140,
    maxHeight: 280,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    fontSize: 17,
    lineHeight: 24,
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
  },
  inlineActions: { flexDirection: "row", gap: spacing.sm },
  bottomBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth },
  bottomRow: { flexDirection: "row", gap: spacing.sm, maxWidth: 720, width: "100%", alignSelf: "center" },
  retake: { minWidth: 120 },
});
