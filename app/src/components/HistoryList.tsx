import React from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import type { HistoryEntry } from "../history";
import { COLORS } from "../constants";

interface Props {
  entries: HistoryEntry[];
  loadingId: string | null;
  onSelect: (entry: HistoryEntry) => void;
  onClose: () => void;
}

export function HistoryList({ entries, loadingId, onSelect, onClose }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Past Questions</Text>
        <Pressable onPress={onClose} hitSlop={8}>
          <Text style={styles.closeText}>Close</Text>
        </Pressable>
      </View>

      {entries.length === 0 ? (
        <Text style={styles.emptyText}>
          Nothing here yet. Solved questions will show up so you can revisit them.
        </Text>
      ) : (
        entries.map((entry) => (
          <Pressable
            key={entry.id}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => onSelect(entry)}
            disabled={loadingId !== null}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.topic}>{entry.topic}</Text>
              <Text style={styles.preview} numberOfLines={2}>
                {entry.preview}
              </Text>
            </View>
            {loadingId === entry.id && <ActivityIndicator color={COLORS.primary} />}
          </Pressable>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "700",
  },
  closeText: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  rowPressed: {
    opacity: 0.6,
  },
  topic: {
    color: COLORS.text,
    fontWeight: "600",
    fontSize: 14,
    textTransform: "capitalize",
  },
  preview: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
});
