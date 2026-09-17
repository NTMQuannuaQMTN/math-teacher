import AsyncStorage from "@react-native-async-storage/async-storage";
import type { QuestionResult } from "./api/types";

const STORAGE_KEY = "math-teacher/history";
const MAX_ENTRIES = 30;

export interface HistoryEntry {
  id: string;
  topic: string;
  preview: string;
  createdAt: string;
}

/** Local-only history: no accounts in this MVP (see docs/DECISIONS.md), so
 * "recent questions" lives on-device via AsyncStorage rather than a server
 * listing endpoint. Best-effort — storage errors never block the core flow. */
export async function loadHistory(): Promise<HistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function addToHistory(result: QuestionResult): Promise<void> {
  if (result.status !== "complete" || !result.classification) return;

  const entry: HistoryEntry = {
    id: result.id,
    topic: result.classification.topic ?? "Math question",
    preview: result.classification.extracted_text.slice(0, 120),
    createdAt: result.created_at ?? new Date().toISOString(),
  };

  try {
    const existing = await loadHistory();
    const deduped = existing.filter((e) => e.id !== entry.id);
    const updated = [entry, ...deduped].slice(0, MAX_ENTRIES);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Non-fatal: history is a convenience, not core functionality.
  }
}
