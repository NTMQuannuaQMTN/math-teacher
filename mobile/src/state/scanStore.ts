import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";
import { ScanSchema, type Scan } from "@shared/contract";
import { z } from "@shared/zodRuntime";

/**
 * Client-side cache of scans the app has seen, plus a persisted snapshot of
 * the most recent confirmed problems so Home/History still work offline.
 * The server is always the source of truth; this only avoids blank screens.
 */
const byId = new Map<string, Scan>();
const listeners = new Set<() => void>();
let version = 0;

function emit() {
  version += 1;
  for (const listener of listeners) listener();
}

export const scanStore = {
  get(id: string): Scan | undefined {
    return byId.get(id);
  },
  put(scan: Scan): void {
    byId.set(scan.id, scan);
    emit();
  },
  putMany(scans: Scan[]): void {
    for (const scan of scans) byId.set(scan.id, scan);
    emit();
  },
  remove(id: string): void {
    byId.delete(id);
    emit();
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

/** Re-renders when any cached scan changes (e.g. saved on another screen). */
export function useScanStoreVersion(): number {
  return useSyncExternalStore(scanStore.subscribe, () => version);
}

// ---------------------------------------------------------------------------
// Offline snapshot of recent confirmed problems
// ---------------------------------------------------------------------------

const SNAPSHOT_KEY = "recent_problems_v1";
const SNAPSHOT_SIZE = 30;
const SnapshotSchema = z.array(ScanSchema);

export async function saveRecentSnapshot(scans: Scan[]): Promise<void> {
  try {
    await AsyncStorage.setItem(SNAPSHOT_KEY, JSON.stringify(scans.slice(0, SNAPSHOT_SIZE)));
  } catch (err) {
    console.warn("Could not save offline snapshot", err);
  }
}

export async function loadRecentSnapshot(): Promise<Scan[]> {
  try {
    const raw = await AsyncStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return [];
    const parsed = SnapshotSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

/** Keeps the snapshot consistent after a save or delete, without a network round trip. */
export async function updateRecentSnapshot(change: { upsert?: Scan; removeId?: string }): Promise<void> {
  const current = await loadRecentSnapshot();
  let next = current.filter((s) => s.id !== change.upsert?.id && s.id !== change.removeId);
  if (change.upsert?.status === "confirmed") next = [change.upsert, ...next];
  await saveRecentSnapshot(next);
}
