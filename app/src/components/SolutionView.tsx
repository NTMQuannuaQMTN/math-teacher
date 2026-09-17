import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { Solution } from "../api/types";
import { COLORS } from "../constants";

export function SolutionView({ solution }: { solution: Solution }) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Step-by-step solution</Text>
      {solution.steps.map((step) => (
        <View key={step.step_number} style={styles.stepRow}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>{step.step_number}</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepDescription}>{step.description}</Text>
            {step.math_expression ? (
              <Text style={styles.mathExpression}>{step.math_expression}</Text>
            ) : null}
          </View>
        </View>
      ))}

      <View style={styles.answerCard}>
        <Text style={styles.answerLabel}>Final answer</Text>
        <Text style={styles.answerText}>{solution.final_answer}</Text>
      </View>

      <View style={styles.explanationCard}>
        <Text style={styles.sectionTitle}>Why this works</Text>
        <Text style={styles.explanationText}>{solution.explanation}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
  },
  stepRow: {
    flexDirection: "row",
    gap: 12,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadgeText: {
    color: COLORS.primaryText,
    fontWeight: "700",
    fontSize: 13,
  },
  stepContent: {
    flex: 1,
    gap: 4,
  },
  stepDescription: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 21,
  },
  mathExpression: {
    color: COLORS.primary,
    fontFamily: "monospace",
    fontSize: 14,
  },
  answerCard: {
    backgroundColor: `${COLORS.success}1A`,
    borderColor: COLORS.success,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  answerLabel: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  answerText: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "600",
  },
  explanationCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 8,
  },
  explanationText: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});
