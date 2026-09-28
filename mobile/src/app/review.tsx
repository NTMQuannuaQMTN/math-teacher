import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View, type LayoutRectangle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { CropBox, type Rect } from "@/components/CropBox";
import { StateView } from "@/components/StateView";
import { useStartUpload } from "@/hooks/useStartUpload";
import { useStrings } from "@/i18n";
import { ImagePrepError, prepareForUpload, rotateClockwise, type LocalImage } from "@/lib/imagePrep";
import { scanDraft } from "@/state/scanDraft";
import { spacing, typography, useTheme } from "@/theme";

/** Crop stored as fractions of the image, so it survives layout changes and rotation resets. */
interface NormalizedCrop {
  x: number;
  y: number;
  w: number;
  h: number;
}

const FULL: NormalizedCrop = { x: 0.03, y: 0.03, w: 0.94, h: 0.94 };

function initialCrop(image: LocalImage): NormalizedCrop {
  const suggested = scanDraft.get()?.suggestedCrop;
  if (!suggested) return FULL;
  return {
    x: suggested.originX / image.width,
    y: suggested.originY / image.height,
    w: suggested.width / image.width,
    h: suggested.height / image.height,
  };
}

/** Where an image of this size sits inside the container with contentFit="contain". */
function containRect(container: LayoutRectangle, image: LocalImage): Rect {
  const scale = Math.min(container.width / image.width, container.height / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  return { x: (container.width - width) / 2, y: (container.height - height) / 2, width, height };
}

export default function ReviewScreen() {
  const s = useStrings();
  const { colors } = useTheme();
  const draft = scanDraft.get();
  const upload = useStartUpload({ replace: true });

  const [image, setImage] = useState<LocalImage | null>(draft?.original ?? null);
  const [crop, setCrop] = useState<NormalizedCrop>(() => (draft ? initialCrop(draft.original) : FULL));
  const [container, setContainer] = useState<LayoutRectangle | null>(null);
  const [busy, setBusy] = useState<"rotate" | "prepare" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bounds = useMemo(() => (container && image ? containRect(container, image) : null), [container, image]);

  if (!draft || !image) {
    return (
      <SafeAreaView style={[styles.flex, styles.center, { backgroundColor: colors.background }]}>
        <StateView icon="image-outline" title={s.review.missing}>
          <Button label={s.review.retake} icon="camera" onPress={() => router.replace("/camera")} />
          <Button label={s.common.back} variant="secondary" onPress={() => router.replace("/")} />
        </StateView>
      </SafeAreaView>
    );
  }

  const displayRect: Rect | null = bounds
    ? { x: bounds.x + crop.x * bounds.width, y: bounds.y + crop.y * bounds.height, width: crop.w * bounds.width, height: crop.h * bounds.height }
    : null;

  function onCropChange(rect: Rect) {
    if (!bounds) return;
    setCrop({
      x: (rect.x - bounds.x) / bounds.width,
      y: (rect.y - bounds.y) / bounds.height,
      w: rect.width / bounds.width,
      h: rect.height / bounds.height,
    });
  }

  async function rotate() {
    if (!image || busy) return;
    setBusy("rotate");
    setError(null);
    try {
      const rotated = await rotateClockwise(image);
      scanDraft.replaceOriginal(rotated);
      setImage(rotated);
      setCrop(FULL);
    } catch {
      setError(s.review.prepareFailed);
    } finally {
      setBusy(null);
    }
  }

  async function usePhoto() {
    if (!image || busy) return;
    setBusy("prepare");
    setError(null);
    try {
      const prepared = await prepareForUpload(image, {
        originX: crop.x * image.width,
        originY: crop.y * image.height,
        width: crop.w * image.width,
        height: crop.h * image.height,
      });
      scanDraft.setPrepared(prepared);
      router.push("/process");
    } catch (err) {
      setError(err instanceof ImagePrepError && err.reason === "too_small" ? s.review.cropTooSmall : s.review.prepareFailed);
    } finally {
      setBusy(null);
    }
  }

  const retake = () => (draft.source === "camera" ? router.replace("/camera") : upload.start());

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel={s.common.back} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
          {s.review.title}
        </Text>
        <View style={styles.headerButton} />
      </View>

      <View style={styles.stage} onLayout={(e) => setContainer(e.nativeEvent.layout)}>
        <Image
          source={{ uri: image.uri }}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          accessibilityLabel={s.a11y.problemImage}
          accessibilityIgnoresInvertColors
        />
        {bounds && displayRect ? <CropBox bounds={bounds} rect={displayRect} onChange={onCropChange} /> : null}
      </View>

      <View style={styles.footer}>
        {error ? <Banner tone="danger" message={error} /> : <Text style={styles.hint}>{s.review.hint}</Text>}
        <View style={styles.tools}>
          <ToolButton icon="refresh-outline" label={s.review.rotate} onPress={rotate} disabled={!!busy} flipIcon />
          <ToolButton icon="scan-outline" label={s.review.reset} onPress={() => setCrop(FULL)} disabled={!!busy} />
          <ToolButton
            icon={draft.source === "camera" ? "camera-outline" : "images-outline"}
            label={draft.source === "camera" ? s.review.retake : s.review.reselect}
            onPress={retake}
            disabled={!!busy || upload.busy}
          />
        </View>
        <Button
          testID="use-photo"
          label={busy === "prepare" ? s.review.preparing : s.review.usePhoto}
          icon="sparkles-outline"
          onPress={usePhoto}
          loading={busy === "prepare"}
          disabled={busy === "rotate"}
        />
      </View>
    </SafeAreaView>
  );
}

function ToolButton(props: {
  icon: "refresh-outline" | "scan-outline" | "camera-outline" | "images-outline";
  label: string;
  onPress: () => void;
  disabled?: boolean;
  flipIcon?: boolean;
}) {
  return (
    <Pressable
      onPress={props.onPress}
      disabled={props.disabled}
      accessibilityRole="button"
      accessibilityLabel={props.label}
      style={({ pressed }) => [styles.tool, pressed && styles.toolPressed, props.disabled && styles.toolDisabled]}
    >
      <Ionicons name={props.icon} size={24} color="#FFFFFF" style={props.flipIcon ? { transform: [{ scaleX: -1 }] } : undefined} />
      <Text style={styles.toolLabel} numberOfLines={1}>
        {props.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { justifyContent: "center" },
  root: { flex: 1, backgroundColor: "#0B0D12" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.sm, height: 52 },
  headerButton: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, textAlign: "center", color: "#FFFFFF", ...typography.subtitle },
  stage: { flex: 1, marginHorizontal: spacing.md, marginVertical: spacing.sm },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md, gap: spacing.md },
  hint: { color: "rgba(255,255,255,0.8)", textAlign: "center", ...typography.body, fontSize: 15 },
  tools: { flexDirection: "row", justifyContent: "space-around" },
  tool: { alignItems: "center", justifyContent: "center", minWidth: 88, minHeight: 56, gap: 4, borderRadius: 12, paddingHorizontal: spacing.sm },
  toolPressed: { backgroundColor: "rgba(255,255,255,0.12)" },
  toolDisabled: { opacity: 0.4 },
  toolLabel: { color: "#FFFFFF", ...typography.label },
});
