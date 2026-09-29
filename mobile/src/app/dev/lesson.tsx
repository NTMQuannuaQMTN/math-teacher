import { Redirect, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SolutionSchema, type Solution } from "@shared/solution";
import { LessonView } from "@/components/lesson/LessonView";
import type { LessonProgress } from "@/state/lessonProgress";

/**
 * Development-only: renders a stored lesson from `?src=<url of Solution JSON>`
 * so native rendering (SVG figure, KaTeX WebViews) can be checked on a
 * simulator without going through scanning. `&reveal=all` opens everything.
 */
export default function DevLessonScreen() {
  const { src, reveal } = useLocalSearchParams<{ src?: string; reveal?: string }>();
  const [solution, setSolution] = useState<Solution | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<LessonProgress>({ revealed: [], unlocked: 1, showSolution: false });

  useEffect(() => {
    if (!__DEV__ || !src) return;
    fetch(src)
      .then((r) => r.json())
      .then((json) => {
        const parsed = SolutionSchema.parse(json);
        setSolution(parsed);
        if (reveal === "all" && parsed.lesson) {
          const hints = parsed.lesson.hints;
          setProgress({ revealed: hints.map((h) => h.id), unlocked: hints.length, showSolution: true });
        } else if (reveal === "hints" && parsed.lesson) {
          const hints = parsed.lesson.hints;
          setProgress({ revealed: hints.slice(0, 2).map((h) => h.id), unlocked: 2, showSolution: false });
        }
      })
      .catch((e) => setError(String(e)));
  }, [src, reveal]);

  if (!__DEV__) return <Redirect href="/" />;
  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: "Lesson (dev)" }} />
      {error ? <Text>{error}</Text> : solution ? <LessonView solution={solution} progress={progress} setProgress={(u) => setProgress(u)} onRegenerate={() => undefined} /> : <ActivityIndicator />}
    </View>
  );
}
