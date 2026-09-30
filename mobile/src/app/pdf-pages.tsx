import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { StateView } from "@/components/StateView";
import { useStrings } from "@/i18n";
import { closePdf, openPdf, pdfPageImage, pdfThumbnail } from "@/lib/webSources";
import { scanDraft } from "@/state/scanDraft";
import { radius, spacing, typography, useTheme } from "@/theme";

/** Web only: choose one page of an uploaded multi-page PDF, then crop it on the review screen. */
export default function PdfPagesScreen() {
  const s = useStrings();
  const { colors } = useTheme();
  const pdf = openPdf();
  const [thumbs, setThumbs] = useState<(string | null)[]>(() => Array.from({ length: pdf?.pages ?? 0 }, () => null));
  const [opening, setOpening] = useState<number | null>(null);

  // Render previews one at a time (big PDFs stay responsive); free them when leaving.
  useEffect(() => {
    if (!pdf) return;
    let cancelled = false;
    const urls: string[] = [];
    void (async () => {
      for (let n = 1; n <= pdf.pages && !cancelled; n++) {
        const url = await pdfThumbnail(n).catch(() => "");
        if (cancelled) break;
        urls.push(url);
        setThumbs((t) => t.map((v, i) => (i === n - 1 ? url : v)));
      }
    })();
    return () => {
      cancelled = true;
      urls.forEach((u) => u && URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the open PDF doesn't change while this screen is shown
  }, []);

  const choose = async (n: number) => {
    if (opening) return;
    setOpening(n);
    const outcome = await pdfPageImage(n);
    setOpening(null);
    if (outcome.kind === "picked") {
      scanDraft.start("library", outcome.image);
      void closePdf();
      router.replace("/review");
    } else {
      globalThis.alert?.(s.webSources.corrupted);
    }
  };

  if (!pdf) {
    return <StateView icon="document-outline" title={s.webSources.failed} />;
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <Text style={[typography.body, { color: colors.textMuted }]}>{s.webSources.pagesHint}</Text>
      <View style={styles.grid}>
        {thumbs.map((url, i) => (
          <Pressable
            key={i}
            testID={`pdf-page-${i + 1}`}
            onPress={() => void choose(i + 1)}
            accessibilityRole="button"
            accessibilityLabel={s.webSources.page.replace("{n}", String(i + 1))}
            style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: pressed ? colors.primary : colors.border }]}
          >
            <View style={[styles.preview, { backgroundColor: colors.surfaceMuted }]}>
              {url ? <Image source={{ uri: url }} style={styles.image} resizeMode="contain" /> : <ActivityIndicator color={colors.textMuted} />}
              {opening === i + 1 ? (
                <View style={styles.overlay}>
                  <ActivityIndicator color="#FFFFFF" />
                </View>
              ) : null}
            </View>
            <Text style={[typography.bodyStrong, { color: colors.text, textAlign: "center" }]}>
              {opening === i + 1 ? s.webSources.loadingPage.replace("{n}", String(i + 1)) : s.webSources.page.replace("{n}", String(i + 1))}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, maxWidth: 900, width: "100%", alignSelf: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  card: { width: 200, borderRadius: radius.lg, borderWidth: 1, padding: spacing.sm, gap: spacing.sm },
  preview: { height: 260, borderRadius: radius.md, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  image: { width: "100%", height: "100%" },
  overlay: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center" },
});
