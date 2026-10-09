import { Ionicons } from "@expo/vector-icons";
import { FeedbackSheet } from "./FeedbackSheet";
import { router } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { mentionedTargets } from "@shared/figureComplete";
import { statementParts } from "@shared/claims";
import { resolveFigure } from "@shared/geometry";
import { techniqueName } from "@shared/knowledgeBase";
import type { Solution } from "@shared/solution";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { GeometryView } from "@/components/geometry/GeometryView";
import { MathText } from "@/components/math/MathText";
import { StateView } from "@/components/StateView";
import { useStrings } from "@/i18n";
import type { LessonProgress } from "@/state/lessonProgress";
import { spacing, typography, useTheme } from "@/theme";
import { Card, FinalAnswerCard, HintCard, SectionTitle, StepCard, UnderstandCard } from "./LessonParts";

type Focus = { kind: "hint" | "step"; id: string } | null;

interface Props {
  solution: Solution;
  progress: LessonProgress;
  setProgress: (update: (p: LessonProgress) => LessonProgress) => void;
  onRegenerate: () => void;
}

/**
 * The interactive lesson: figure pinned on top, then problem, understanding,
 * hints (revealed one at a time), full solution, final answer. The current
 * hint/step drives what the figure highlights and which construction lines
 * are visible. Platform-independent (renders on native and Expo web).
 */
export function LessonView({ solution, progress, setProgress, onRegenerate }: Props) {
  const s = useStrings();
  const { colors } = useTheme();
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  // Wide screens: problem and figure in a fixed left column, the lesson scrolls on the right. Phones: both pinned on top.
  const wide = screenWidth >= 960;
  const [problemOpen, setProblemOpen] = useState(true);
  const [focus, setFocus] = useState<Focus>(null);
  const [figureOpen, setFigureOpen] = useState(true);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const layout = useRef({ steps: 0, step: new Map<string, number>() });
  // Phones: problem + figure stay pinned but leave most of the screen to the lesson.
  // Desktop: the figure takes the height left under the problem, so the left column never needs scrolling.
  const [problemHeight, setProblemHeight] = useState(0);
  const figureHeight = wide
    ? Math.round(Math.min(Math.max(screenHeight - problemHeight - 170, 240), 560))
    : Math.round(Math.min(Math.max(screenHeight * 0.26, 180), 300));
  const lesson = solution.lesson!;
  const { analysis, hints, steps, figure } = lesson;

  // Figure state follows the lesson: current hint/step highlights; constructions appear from the step that introduces them.
  const stepIndex = useMemo(() => new Map(steps.map((step, i) => [step.id, i])), [steps]);
  const reachedStep = useMemo(() => {
    let reached = -1;
    for (const h of hints) if (progress.revealed.includes(h.id)) reached = Math.max(reached, stepIndex.get(h.stepId) ?? -1);
    if (progress.showSolution) reached = steps.length - 1;
    if (focus?.kind === "step") reached = Math.max(reached, stepIndex.get(focus.id) ?? -1);
    return reached;
  }, [hints, progress, stepIndex, steps.length, focus]);
  const shownConstructions = useMemo(
    () => steps.slice(0, reachedStep + 1).flatMap((step) => step.geometryActions.filter((a) => a.action === "show").flatMap((a) => a.targets)),
    [steps, reachedStep],
  );
  // Selecting a step or hint highlights everything its text names (points, segments, angles, circles, polygons),
  // plus what the model chose to highlight. A hint not yet revealed only uses its question (no spoiler).
  const resolved = useMemo(() => (figure ? resolveFigure(figure) : null), [figure]);
  const highlight = useMemo(() => {
    if (!focus) return [];
    const named = (texts: (string | null)[]) => (figure && resolved ? mentionedTargets(texts, figure, resolved) : []);
    if (focus.kind === "hint") {
      const h = hints.find((x) => x.id === focus.id);
      if (!h) return [];
      const open = progress.revealed.includes(h.id);
      return [...new Set([...h.focus, ...named(open ? [h.question, h.cue, h.explanation, h.math] : [h.question, h.cue])])];
    }
    const st = steps.find((x) => x.id === focus.id);
    if (!st) return [];
    return [...new Set([...st.geometryActions.flatMap((a) => a.targets), ...named([st.title, st.explanation, st.math, st.reason])])];
  }, [focus, hints, steps, figure, resolved, progress.revealed]);

  const stepChecks = new Map((solution.verification?.steps ?? []).map((c) => [c.stepId, c.status]));

  // Tapping an object in the figure jumps to the first step that draws or highlights it (once the solution is
  // open), or to a revealed hint that focuses it — never to something the student hasn't unlocked.
  const selectObject = (id: string | null) => {
    if (!id) return;
    if (progress.showSolution) {
      const step = steps.find((st) => st.geometryActions.some((a) => a.targets.includes(id)));
      if (step) {
        setFocus({ kind: "step", id: step.id });
        const y = layout.current.step.get(step.id);
        if (y !== undefined) scroll.current?.scrollTo({ y: Math.max(0, layout.current.steps + y - spacing.md), animated: true });
        return;
      }
    }
    const hint = hints.find((h) => progress.revealed.includes(h.id) && h.focus.includes(id));
    if (hint) setFocus({ kind: "hint", id: hint.id });
  };

  if (analysis.status !== "solvable") {
    const title = analysis.status === "ambiguous" ? s.solve.ambiguousTitle : analysis.status === "unsupported" ? s.solve.unsupportedTitle : s.solve.notProblemTitle;
    return (
      <SafeAreaView style={styles.flex} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.content}>
          <Card>
            <MathText text={analysis.statement} fontSize={17} />
          </Card>
          <StateView icon="help-buoy-outline" title={title} body={analysis.statusReason ?? undefined}>
            <Button label={s.common.back} variant="secondary" onPress={() => router.back()} />
            <Button label={s.solve.regenerate} icon="refresh" variant="ghost" onPress={onRegenerate} />
            <Button label={s.feedback.button} icon="flag-outline" variant="ghost" onPress={() => setFeedbackOpen(true)} />
          </StateView>
          <FeedbackSheet visible={feedbackOpen} onClose={() => setFeedbackOpen(false)} scanId={solution.scanId} questionId={solution.questionId} lesson={lesson} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const visibleHints = hints.slice(0, Math.max(1, progress.unlocked));
  const allHintsRevealed = hints.every((h) => progress.revealed.includes(h.id));
  const lastVisible = visibleHints[visibleHints.length - 1];

  const reveal = (hintId: string) => {
    setProgress((p) => ({ ...p, revealed: p.revealed.includes(hintId) ? p.revealed : [...p.revealed, hintId] }));
    setFocus({ kind: "hint", id: hintId });
  };
  const nextHint = () => {
    const next = hints[progress.unlocked];
    setProgress((p) => ({ ...p, unlocked: Math.min(hints.length, p.unlocked + 1) }));
    if (next) setFocus({ kind: "hint", id: next.id });
  };

  // The part being read ("Câu b: …" steps, or the step a hint leads to): on a phone the pinned pane shows that part,
  // so the question is always in view without scrolling; "Cả đề" shows the whole statement.
  const parts = useMemo(() => statementParts(analysis.statement).filter((p) => p.letter), [analysis.statement]);
  const focusedStep = focus ? (focus.kind === "step" ? steps.find((x) => x.id === focus.id) : steps.find((x) => x.id === hints.find((h) => h.id === focus.id)?.stepId)) : undefined;
  const focusLetter = focusedStep ? /^Câu ([a-f])\b/i.exec(focusedStep.title)?.[1]?.toLowerCase() : undefined;
  const focusPart = parts.find((p) => p.letter === focusLetter);
  const [wholeProblem, setWholeProblem] = useState(false);
  const pinnedText = !wide && focusPart && !wholeProblem ? focusPart.text.trim() : analysis.statement;

  const problemPane = (
    <View style={[styles.problemPane, { borderBottomColor: colors.border, backgroundColor: colors.background }]} onLayout={(e) => setProblemHeight(e.nativeEvent.layout.height)}>
      <Pressable onPress={() => setProblemOpen(!problemOpen)} style={styles.figureToggle} accessibilityRole="button" accessibilityState={{ expanded: problemOpen }}>
        <Ionicons name="document-text-outline" size={16} color={colors.textMuted} />
        <Text style={[typography.label, styles.flex, { color: colors.textMuted }]}>{s.solve.problem.toUpperCase()}</Text>
        <Ionicons name={problemOpen ? "chevron-up" : "chevron-down"} size={18} color={colors.textMuted} />
      </Pressable>
      {problemOpen ? (
        <>
          <ScrollView style={wide ? undefined : { maxHeight: Math.round(screenHeight * (focusPart && !wholeProblem ? 0.2 : 0.16)) }} nestedScrollEnabled>
            <MathText testID="lesson-problem" text={pinnedText} fontSize={wide ? 17 : 15} />
          </ScrollView>
          {!wide && focusPart ? (
            <Pressable onPress={() => setWholeProblem(!wholeProblem)} accessibilityRole="button" style={styles.wholeToggle}>
              <Text style={[typography.caption, { color: colors.primary }]}>{wholeProblem ? s.solve.problemPart(focusPart.letter) : s.solve.problemWhole}</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}
    </View>
  );
  const figurePane = figure ? (
    <View style={[styles.figurePane, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
      <Pressable onPress={() => setFigureOpen(!figureOpen)} style={styles.figureToggle} accessibilityRole="button" accessibilityState={{ expanded: figureOpen }}>
        <Ionicons name="shapes-outline" size={16} color={colors.textMuted} />
        <Text style={[typography.label, styles.flex, { color: colors.textMuted }]}>{s.solve.figure.toUpperCase()}</Text>
        <Ionicons name={figureOpen ? "chevron-up" : "chevron-down"} size={18} color={colors.textMuted} />
      </Pressable>
      {figureOpen ? (
        <GeometryView
          figure={figure}
          highlight={highlight}
          shownConstructions={shownConstructions}
          height={figureHeight}
          onSelect={selectObject}
        />
      ) : null}
      {figureOpen && progress.showSolution ? <Text style={[typography.caption, { color: colors.textMuted }]}>{s.solve.figureTapHint}</Text> : null}
    </View>
  ) : null;

  return (
    <SafeAreaView style={[styles.flex, wide && styles.row]} edges={["bottom"]}>
      {/* The problem (and figure) stay in view while the student reads hints and the solution. */}
      {wide ? (
        <ScrollView style={[styles.side, { borderRightColor: colors.border }]} contentContainerStyle={styles.sideContent} stickyHeaderIndices={[0]}>
          {problemPane}
          {figurePane}
        </ScrollView>
      ) : (
        <>
          {problemPane}
          {figurePane}
        </>
      )}

      <ScrollView ref={scroll} style={styles.flex} contentContainerStyle={styles.content}>
        {solution.verification?.figureIssue ? <Banner tone="info" message={s.solve.figureUnavailable} /> : null}

        <SectionTitle>{s.solve.understand}</SectionTitle>
        <UnderstandCard
          kind={analysis.subtopic.trim() || undefined}
          givens={analysis.givens}
          unknowns={analysis.unknowns}
          concepts={analysis.concepts}
          techniques={analysis.techniques.map((t) => (analysis.language === "en" ? t.replace(/_/g, " ") : techniqueName(t) ?? t))}
          notes={analysis.interpretationNotes}
          strategy={progress.revealed.length > 0 || progress.showSolution ? lesson.strategy : null}
        />

        <SectionTitle>{s.solve.hints}</SectionTitle>
        <Text style={[typography.caption, { color: colors.textMuted }]}>{s.solve.hintIntro}</Text>
        {visibleHints.map((hint, i) => (
          <HintCard
            key={hint.id}
            hint={hint}
            index={i}
            revealed={progress.revealed.includes(hint.id)}
            active={focus?.kind === "hint" && focus.id === hint.id}
            onReveal={() => reveal(hint.id)}
            onFocus={() => setFocus({ kind: "hint", id: hint.id })}
          />
        ))}
        {lastVisible && progress.revealed.includes(lastVisible.id) && progress.unlocked < hints.length ? (
          <Button testID="next-hint" label={s.solve.nextHint} icon="arrow-forward" onPress={nextHint} />
        ) : null}

        <Button
          testID="toggle-solution"
          label={progress.showSolution ? s.solve.hideSolution : s.solve.showSolution}
          icon={progress.showSolution ? "chevron-up" : "list"}
          variant={allHintsRevealed && !progress.showSolution ? "primary" : "secondary"}
          onPress={() => {
            setProgress((p) => ({ ...p, showSolution: !p.showSolution }));
            if (!progress.showSolution) setFocus(steps[0] ? { kind: "step", id: steps[0].id } : null);
          }}
        />

        {progress.showSolution ? (
          <>
            <SectionTitle>{s.solve.solution}</SectionTitle>
            <View style={styles.steps} onLayout={(e) => (layout.current.steps = e.nativeEvent.layout.y)}>
              {steps.map((step, i) => (
                <View key={step.id} onLayout={(e) => layout.current.step.set(step.id, e.nativeEvent.layout.y)}>
                  <StepCard
                    step={step}
                    index={i}
                    active={focus?.kind === "step" && focus.id === step.id}
                    onPress={() => setFocus({ kind: "step", id: step.id })}
                    uses={step.uses.map((id) => (stepIndex.get(id) ?? -1) + 1).filter((n) => n > 0)}
                    check={stepChecks.get(step.id)}
                  />
                </View>
              ))}
            </View>
            <FinalAnswerCard text={lesson.finalAnswer.text} math={lesson.finalAnswer.math} verification={solution.verification} hasFigure={!!figure} />
            <Button label={s.solve.regenerate} icon="refresh" variant="ghost" size="md" onPress={onRegenerate} />
          </>
        ) : null}
        {/* "Báo lỗi": report a mistake (the step or hint in focus is preselected). */}
        <View style={styles.feedbackRow}>
          <Button testID="feedback-open" label={s.feedback.button} icon="flag-outline" variant="secondary" size="md" onPress={() => setFeedbackOpen(true)} style={styles.flexOne} />
          <Button label={s.feedback.viewAll} icon="list-outline" variant="ghost" size="md" onPress={() => router.push("/feedback")} style={styles.flexOne} />
        </View>
      </ScrollView>
      <FeedbackSheet
        visible={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        scanId={solution.scanId}
        questionId={solution.questionId}
        lesson={lesson}
        initialTarget={focus ? { kind: focus.kind, id: focus.id } : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  feedbackRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  flexOne: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md, maxWidth: 720, width: "100%", alignSelf: "center", paddingBottom: spacing.xxl },
  figurePane: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  problemPane: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: "row" },
  side: { flexGrow: 0, flexBasis: "42%", maxWidth: 620, borderRightWidth: StyleSheet.hairlineWidth },
  sideContent: { paddingBottom: spacing.lg },
  wholeToggle: { paddingTop: spacing.xs, alignSelf: "flex-start" },
  figureToggle: { flexDirection: "row", alignItems: "center", gap: spacing.xs, minHeight: 36 },
  steps: { gap: spacing.sm },
});
