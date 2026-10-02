import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Hint, Step, Verification } from "@shared/solution";
import { Button } from "@/components/Button";
import { MathText } from "@/components/math/MathText";
import { useStrings } from "@/i18n";
import { radius, spacing, typography, useTheme } from "@/theme";
import { RichText } from "./RichText";

export function SectionTitle({ children, right }: { children: string; right?: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionRow}>
      <Text style={[typography.title, { color: colors.text }]} accessibilityRole="header">
        {children}
      </Text>
      {right}
    </View>
  );
}

export function Card({ children, accent }: { children: ReactNode; accent?: "primary" | "success" | "warning" }) {
  const { colors } = useTheme();
  const border = accent === "primary" ? colors.primary : accent === "success" ? colors.success : accent === "warning" ? colors.warning : colors.border;
  return <View style={[styles.card, { backgroundColor: colors.surface, borderColor: border, borderWidth: accent ? 1.5 : StyleSheet.hairlineWidth }]}>{children}</View>;
}

/** Given / find / key ideas — the "understand the problem" stage. */
export function UnderstandCard(props: { kind?: string; givens: string[]; unknowns: string[]; concepts: string[]; techniques?: string[]; notes: string[]; strategy: string | null }) {
  const { colors } = useTheme();
  const s = useStrings();
  const row = (icon: "pricetag-outline" | "information-circle-outline" | "help-circle-outline" | "bulb-outline" | "construct-outline" | "eye-outline" | "navigate-outline", title: string, items: string[]) =>
    items.length ? (
      <View style={styles.understandRow}>
        <Ionicons name={icon} size={20} color={colors.primary} style={styles.rowIcon} />
        <View style={styles.flex}>
          <Text style={[typography.label, { color: colors.textMuted }]}>{title.toUpperCase()}</Text>
          {items.map((item, i) => (
            <RichText key={i} text={item} style={[typography.body, { color: colors.text }]} />
          ))}
        </View>
      </View>
    ) : null;
  return (
    <Card>
      {props.kind ? row("pricetag-outline", s.solve.problemKind, [props.kind]) : null}
      {row("information-circle-outline", s.solve.given, props.givens)}
      {row("help-circle-outline", s.solve.find, props.unknowns)}
      {row("bulb-outline", s.solve.concepts, props.concepts)}
      {props.techniques?.length ? row("construct-outline", s.solve.techniques, [props.techniques.join(" · ")]) : null}
      {row("eye-outline", s.solve.interpretation, props.notes)}
      {props.strategy ? row("navigate-outline", s.solve.strategy, [props.strategy]) : null}
    </Card>
  );
}

interface HintCardProps {
  hint: Hint;
  index: number;
  revealed: boolean;
  active: boolean;
  onReveal: () => void;
  onFocus: () => void;
}

/** A hint: the question is visible; the explanation stays hidden until the student asks. */
export function HintCard({ hint, index, revealed, active, onReveal, onFocus }: HintCardProps) {
  const { colors } = useTheme();
  const s = useStrings();
  return (
    <Card accent={active ? "primary" : undefined}>
      {/* Tapping the question focuses the figure on this hint (no nested buttons: the reveal button sits outside). */}
      <Pressable onPress={onFocus} accessibilityRole="button" accessibilityState={{ selected: active }} style={styles.hintBody}>
        <View style={styles.hintHeader}>
          <View style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="bulb" size={14} color={colors.primary} />
            <Text style={[typography.label, { color: colors.primary }]}>
              {s.solve.hint} {index + 1}
            </Text>
          </View>
        </View>
        <RichText text={hint.question} style={[typography.subtitle, { color: colors.text }]} />
        {hint.cue ? <RichText text={hint.cue} style={[typography.body, styles.cue, { color: colors.textMuted }]} /> : null}
      </Pressable>
      {revealed ? (
        <View style={[styles.reveal, { backgroundColor: colors.surfaceMuted }]} accessibilityLiveRegion="polite">
          <RichText text={hint.explanation} style={[typography.body, { color: colors.text }]} />
          {hint.math ? <MathText text={`$$${hint.math}$$`} fontSize={17} /> : null}
        </View>
      ) : (
        <>
          <Text style={[typography.caption, { color: colors.textMuted }]}>{s.solve.tryFirst}</Text>
          <Button testID={`reveal-${hint.id}`} label={s.solve.showHint} icon="eye-outline" variant="secondary" size="md" onPress={onReveal} />
        </>
      )}
    </Card>
  );
}

export function StepCard({
  step,
  index,
  active,
  onPress,
  uses = [],
  check,
}: {
  step: Step;
  index: number;
  active: boolean;
  onPress: () => void;
  /** 1-based numbers of the earlier steps this one relies on. */
  uses?: number[];
  /** What the machine checked in this step (absent for older solutions). */
  check?: "checked" | "failed" | "answer" | "not_checked";
}) {
  const { colors } = useTheme();
  const s = useStrings();
  const checkTone = check === "failed" ? colors.danger : check === "checked" || check === "answer" ? colors.success : colors.textMuted;
  return (
    <Pressable testID={`step-${step.id}`} onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: active }}>
      <View style={[styles.step, { borderLeftColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primarySoft : "transparent" }]}>
        <View style={styles.stepHeader}>
          <View style={[styles.stepNumber, { backgroundColor: active ? colors.primary : colors.surfaceMuted }]}>
            <Text style={[typography.label, { color: active ? colors.onPrimary : colors.text }]}>{index + 1}</Text>
          </View>
          <RichText text={step.title} style={[typography.bodyStrong, styles.flex, { color: colors.text }]} />
        </View>
        {uses.length > 0 ? (
          <View style={styles.reasonRow}>
            <Ionicons name="git-merge-outline" size={15} color={colors.textMuted} />
            <Text style={[typography.caption, { color: colors.textMuted }]}>{s.solve.usesSteps(uses)}</Text>
          </View>
        ) : null}
        <RichText text={step.explanation} style={[typography.body, { color: colors.text }]} />
        {step.math ? <MathText text={`$$${step.math}$$`} fontSize={17} /> : null}
        {step.reason ? (
          <View style={styles.reasonRow}>
            <Ionicons name="book-outline" size={15} color={colors.textMuted} />
            <RichText text={step.reason} style={[typography.caption, styles.flex, { color: colors.textMuted }]} />
          </View>
        ) : null}
        {check ? (
          <View style={styles.reasonRow} testID={`step-check-${step.id}`}>
            <Ionicons name={check === "failed" ? "alert-circle-outline" : check === "not_checked" ? "ellipse-outline" : "checkmark-circle-outline"} size={15} color={checkTone} />
            <Text style={[typography.caption, { color: checkTone }]}>{s.solve.stepCheck[check]}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export function FinalAnswerCard({ text, math, verification, hasFigure }: { text: string; math: string | null; verification: Verification | null; hasFigure: boolean }) {
  const { colors } = useTheme();
  const s = useStrings();
  const status = verification?.status ?? "not_checkable";
  const info = {
    verified: { icon: "shield-checkmark" as const, color: colors.success, title: s.solve.verified, body: hasFigure ? s.solve.verifiedBodyFigure : s.solve.verifiedBody },
    partial: { icon: "shield-half" as const, color: colors.warning, title: s.solve.partial, body: s.solve.partialBody },
    unverified: { icon: "warning" as const, color: colors.danger, title: s.solve.unverified, body: s.solve.unverifiedBody },
    not_checkable: { icon: "information-circle" as const, color: colors.textMuted, title: s.solve.notCheckable, body: s.solve.notCheckableBody },
  }[status];
  // Only a verified answer gets the "correct" green; an unverified one must not look approved.
  const tone =
    status === "verified"
      ? { bg: colors.successSoft, border: colors.success, fg: colors.success }
      : status === "unverified"
        ? { bg: colors.dangerSoft, border: colors.danger, fg: colors.danger }
        : { bg: colors.surface, border: colors.primary, fg: colors.primary };
  return (
    <View testID="final-answer" style={[styles.final, { backgroundColor: tone.bg, borderColor: tone.border }]}>
      <View style={styles.hintHeader}>
        <Ionicons name="flag" size={18} color={tone.fg} />
        <Text style={[typography.label, { color: tone.fg }]}>{s.solve.finalAnswer.toUpperCase()}</Text>
      </View>
      <RichText text={text} style={[typography.subtitle, { color: colors.text }]} />
      {math ? <MathText text={`$$${math}$$`} fontSize={18} /> : null}
      <View style={[styles.verify, { borderTopColor: colors.border }]} accessibilityRole="summary">
        <Ionicons name={info.icon} size={20} color={info.color} />
        <View style={styles.flex}>
          <Text style={[typography.bodyStrong, { color: info.color }]}>{info.title}</Text>
          <Text style={[typography.caption, { color: colors.textMuted }]}>{info.body}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.sm },
  card: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  understandRow: { flexDirection: "row", gap: spacing.sm },
  rowIcon: { marginTop: 2 },
  hintBody: { gap: spacing.sm },
  hintHeader: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  cue: { fontStyle: "italic" },
  reveal: { borderRadius: radius.md, padding: spacing.md, gap: spacing.xs },
  step: { borderLeftWidth: 3, paddingLeft: spacing.md, paddingVertical: spacing.sm, paddingRight: spacing.sm, gap: spacing.xs, borderRadius: radius.sm },
  stepHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  stepNumber: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  reasonRow: { flexDirection: "row", gap: spacing.xs, alignItems: "flex-start" },
  final: { borderRadius: radius.lg, borderWidth: 1.5, padding: spacing.lg, gap: spacing.sm },
  verify: { flexDirection: "row", gap: spacing.sm, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, alignItems: "flex-start" },
});
