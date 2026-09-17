import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { Classification } from "../api/types";
import { COLORS } from "../constants";

export function ClassificationCard({ classification }: { classification: Classification }) {
  return (
    <View style={styles.card}>
      <Text style={styles.questionText}>{classification.extracted_text}</Text>
      <View style={styles.badgeRow}>
        {classification.topic ? <Badge label={classification.topic} /> : null}
        {classification.difficulty ? <Badge label={classification.difficulty} tone="warning" /> : null}
        {classification.is_geometry ? <Badge label="Geometry" tone="primary" /> : null}
      </View>
      {classification.concepts.length > 0 ? (
        <View style={styles.conceptsRow}>
          {classification.concepts.map((concept) => (
            <View key={concept} style={styles.conceptChip}>
              <Text style={styles.conceptText}>{concept}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function Badge({ label, tone = "muted" }: { label: string; tone?: "muted" | "warning" | "primary" }) {
  const colors = {
    muted: { bg: COLORS.surfaceAlt, text: COLORS.textMuted },
    warning: { bg: `${COLORS.warning}26`, text: COLORS.warning },
    primary: { bg: `${COLORS.primary}26`, text: COLORS.primary },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.badgeText, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  questionText: {
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 22,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  conceptsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  conceptChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  conceptText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
});
