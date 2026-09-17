import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { ApiError, fetchQuestion, NetworkError, submitQuestionImage } from "./src/api/client";
import type { QuestionResult } from "./src/api/types";
import { pickFromCamera, pickFromLibrary, type PickedImage } from "./src/imagePicker";
import { prepareImageForUpload } from "./src/prepareImage";
import { addToHistory, loadHistory, type HistoryEntry } from "./src/history";
import { COLORS } from "./src/constants";
import { ClassificationCard } from "./src/components/ClassificationCard";
import { GeometryDiagram } from "./src/components/GeometryDiagram";
import { SolutionView } from "./src/components/SolutionView";
import { HistoryList } from "./src/components/HistoryList";

type Phase =
  | { kind: "idle" }
  | { kind: "preview"; image: PickedImage }
  | { kind: "submitting"; image: PickedImage }
  | { kind: "result"; result: QuestionResult }
  | { kind: "error"; message: string };

export default function App() {
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const abortRef = useRef<AbortController | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [loadingHistoryId, setLoadingHistoryId] = useState<string | null>(null);

  useEffect(() => {
    loadHistory().then(setHistoryEntries);
  }, []);

  const openHistory = useCallback(async () => {
    setHistoryEntries(await loadHistory());
    setShowHistory(true);
  }, []);

  const handleSelectHistory = useCallback(async (entry: HistoryEntry) => {
    setLoadingHistoryId(entry.id);
    try {
      const result = await fetchQuestion(entry.id);
      setPhase({ kind: "result", result });
      setShowHistory(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not load that question.";
      Alert.alert("Couldn't load question", message);
    } finally {
      setLoadingHistoryId(null);
    }
  }, []);

  const handlePick = useCallback(async (source: "camera" | "library") => {
    const result = source === "camera" ? await pickFromCamera() : await pickFromLibrary();

    switch (result.kind) {
      case "picked":
        setPhase({ kind: "preview", image: result.image });
        return;
      case "canceled":
        return; // stay wherever the user was
      case "permission_denied":
        Alert.alert(
          "Permission needed",
          result.source === "camera"
            ? "Camera access is required to take a photo. You can enable it in Settings, or choose a photo from your library instead."
            : "Photo library access is required to select an image. You can enable it in Settings."
        );
        return;
      case "unavailable":
        Alert.alert("Not available", result.message);
        return;
      case "invalid":
        Alert.alert("Can't use this image", result.message);
        return;
    }
  }, []);

  const handleSubmit = useCallback(async (image: PickedImage) => {
    const controller = new AbortController();
    abortRef.current = controller;
    setPhase({ kind: "submitting", image });

    try {
      const prepared = await prepareImageForUpload(image);
      const result = await submitQuestionImage(
        { uri: prepared.uri, mimeType: prepared.mimeType, fileName: prepared.fileName },
        controller.signal
      );
      setPhase({ kind: "result", result });
      if (result.status === "complete") {
        addToHistory(result).then(() => loadHistory().then(setHistoryEntries));
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setPhase({ kind: "preview", image });
        return;
      }
      if (err instanceof ApiError) {
        setPhase({ kind: "error", message: err.message });
        return;
      }
      if (err instanceof NetworkError) {
        setPhase({ kind: "error", message: err.message });
        return;
      }
      setPhase({ kind: "error", message: "Something unexpected went wrong. Please try again." });
    } finally {
      abortRef.current = null;
    }
  }, []);

  const handleCancelSubmit = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const reset = useCallback(() => setPhase({ kind: "idle" }), []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Math Teacher</Text>
          <Text style={styles.subtitle}>Photograph a question and get a step-by-step explanation.</Text>

          {phase.kind === "idle" && !showHistory && (
            <IdleView onPick={handlePick} onOpenHistory={openHistory} hasHistory={historyEntries.length > 0} />
          )}

          {phase.kind === "idle" && showHistory && (
            <HistoryList
              entries={historyEntries}
              loadingId={loadingHistoryId}
              onSelect={handleSelectHistory}
              onClose={() => setShowHistory(false)}
            />
          )}

          {phase.kind === "preview" && (
            <PreviewView
              image={phase.image}
              onSubmit={() => handleSubmit(phase.image)}
              onRetake={() => setPhase({ kind: "idle" })}
            />
          )}

          {phase.kind === "submitting" && (
            <SubmittingView image={phase.image} onCancel={handleCancelSubmit} />
          )}

          {phase.kind === "result" && <ResultScreen result={phase.result} onReset={reset} />}

          {phase.kind === "error" && <ErrorView message={phase.message} onRetry={reset} />}
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function IdleView({
  onPick,
  onOpenHistory,
  hasHistory,
}: {
  onPick: (source: "camera" | "library") => void;
  onOpenHistory: () => void;
  hasHistory: boolean;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.emptyStateText}>No question yet. Take a photo or choose one from your library to get started.</Text>
      <View style={styles.buttonRow}>
        <PrimaryButton label="Take Photo" onPress={() => onPick("camera")} />
        <SecondaryButton label="Choose from Library" onPress={() => onPick("library")} />
      </View>
      {hasHistory && <SecondaryButton label="View Past Questions" onPress={onOpenHistory} />}
      <Text style={styles.hint}>
        Camera capture needs a physical device (it won't work in a simulator, and may be limited in
        Expo Go depending on your setup) — a development build guarantees full camera access.
      </Text>
    </View>
  );
}

function PreviewView({
  image,
  onSubmit,
  onRetake,
}: {
  image: PickedImage;
  onSubmit: () => void;
  onRetake: () => void;
}) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: image.uri }} style={styles.preview} resizeMode="contain" />
      <View style={styles.buttonRow}>
        <PrimaryButton label="Solve This" onPress={onSubmit} />
        <SecondaryButton label="Choose Another" onPress={onRetake} />
      </View>
    </View>
  );
}

function SubmittingView({ image, onCancel }: { image: PickedImage; onCancel: () => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.previewWrapper}>
        <Image source={{ uri: image.uri }} style={[styles.preview, styles.previewDimmed]} resizeMode="contain" />
        <View style={styles.processingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.processingText}>Reading and solving the question…</Text>
          <Text style={styles.processingSubtext}>This can take up to a couple of minutes.</Text>
        </View>
      </View>
      <SecondaryButton label="Cancel" onPress={onCancel} />
    </View>
  );
}

function ResultScreen({ result, onReset }: { result: QuestionResult; onReset: () => void }) {
  if (result.status === "failed") {
    return <ErrorView message={result.error ?? "Could not process this question."} onRetry={onReset} />;
  }

  return (
    <View style={{ gap: 16 }}>
      {result.classification && <ClassificationCard classification={result.classification} />}
      {result.geometry && <GeometryDiagram spec={result.geometry} />}
      {result.solution && <SolutionView solution={result.solution} />}
      <SecondaryButton label="Ask Another Question" onPress={onReset} />
    </View>
  );
}

function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={[styles.card, styles.errorCard]}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>{message}</Text>
      <PrimaryButton label="Try Again" onPress={onRetry} />
    </View>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.button, styles.primaryButton, pressed && styles.pressed]} onPress={onPress}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.button, styles.secondaryButton, pressed && styles.pressed]} onPress={onPress}>
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
    flexGrow: 1,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 15,
    marginTop: -12,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    gap: 16,
  },
  emptyStateText: {
    color: COLORS.textMuted,
    fontSize: 15,
    lineHeight: 21,
  },
  hint: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 17,
    fontStyle: "italic",
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  primaryButtonText: {
    color: COLORS.primaryText,
    fontWeight: "700",
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontWeight: "600",
    fontSize: 15,
  },
  pressed: {
    opacity: 0.7,
  },
  preview: {
    width: "100%",
    height: 260,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceAlt,
  },
  previewWrapper: {
    position: "relative",
  },
  previewDimmed: {
    opacity: 0.35,
  },
  processingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  processingText: {
    color: COLORS.text,
    fontWeight: "600",
    fontSize: 15,
  },
  processingSubtext: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  errorCard: {
    borderColor: COLORS.danger,
  },
  errorTitle: {
    color: COLORS.danger,
    fontWeight: "700",
    fontSize: 16,
  },
  errorMessage: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
  },
});
