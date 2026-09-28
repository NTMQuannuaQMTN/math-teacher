import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from "react-native";
import type { Scan } from "@shared/contract";
import { api } from "@/api/client";
import { AppError, errorMessage } from "@/api/errors";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { ProblemCard } from "@/components/ProblemCard";
import { StateView } from "@/components/StateView";
import { useStrings } from "@/i18n";
import { loadRecentSnapshot, saveRecentSnapshot, scanStore } from "@/state/scanStore";
import { spacing, useTheme } from "@/theme";

const PAGE_SIZE = 20;

export default function HistoryScreen() {
  const s = useStrings();
  const { colors } = useTheme();
  const [items, setItems] = useState<Scan[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [offline, setOffline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState(false);
  const loadingMoreRef = useRef(false);

  const loadFirstPage = useCallback(async () => {
    try {
      const page = await api.listScans({ status: "confirmed", limit: PAGE_SIZE });
      scanStore.putMany(page.items);
      setItems(page.items);
      setCursor(page.nextCursor);
      setError(null);
      setOffline(false);
      void saveRecentSnapshot(page.items);
    } catch (err) {
      const isOffline = err instanceof AppError && (err.kind === "network" || err.kind === "timeout");
      const cached = isOffline ? await loadRecentSnapshot() : [];
      if (isOffline && cached.length > 0) {
        setItems(cached);
        setCursor(null);
        setOffline(true);
      } else {
        setItems((current) => current ?? []);
        setError(err);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadFirstPage();
    }, [loadFirstPage]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFirstPage();
    setRefreshing(false);
  }, [loadFirstPage]);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    setMoreError(false);
    try {
      const page = await api.listScans({ status: "confirmed", limit: PAGE_SIZE, cursor });
      scanStore.putMany(page.items);
      setItems((current) => {
        const seen = new Set((current ?? []).map((scan) => scan.id));
        return [...(current ?? []), ...page.items.filter((scan) => !seen.has(scan.id))];
      });
      setCursor(page.nextCursor);
    } catch {
      setMoreError(true);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [cursor]);

  const openProblem = useCallback((scan: Scan) => {
    router.push({ pathname: "/problem/[id]", params: { id: scan.id } });
  }, []);

  if (items === null) {
    return (
      <View style={[styles.flex, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.flex}
      contentContainerStyle={styles.content}
      data={items}
      keyExtractor={(scan) => scan.id}
      renderItem={({ item }) => <ProblemCard scan={item} onPress={openProblem} />}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      onEndReached={loadMore}
      onEndReachedThreshold={0.4}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textMuted} />}
      ListHeaderComponent={
        offline ? (
          <View style={styles.header}>
            <Banner tone="warning" message={s.history.offline} />
          </View>
        ) : error && items.length > 0 ? (
          <View style={styles.header}>
            <Banner tone="danger" message={errorMessage(error)} />
          </View>
        ) : null
      }
      ListEmptyComponent={
        error ? (
          <StateView icon="cloud-offline-outline" tone="danger" title={errorMessage(error)}>
            <Button label={s.common.retry} icon="refresh" onPress={() => void loadFirstPage()} />
          </StateView>
        ) : (
          <StateView icon="document-text-outline" title={s.home.emptyTitle} body={s.history.empty}>
            <Button label={s.home.scan} icon="camera" onPress={() => router.push("/camera")} />
          </StateView>
        )
      }
      ListFooterComponent={
        loadingMore ? (
          <ActivityIndicator style={styles.footer} color={colors.textMuted} />
        ) : moreError ? (
          <View style={styles.footer}>
            <Button label={s.history.loadMoreFailed} icon="refresh" variant="ghost" size="md" onPress={() => void loadMore()} />
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },
  content: { padding: spacing.lg, flexGrow: 1, maxWidth: 720, width: "100%", alignSelf: "center" },
  header: { marginBottom: spacing.md },
  separator: { height: spacing.sm },
  footer: { paddingVertical: spacing.lg },
});
