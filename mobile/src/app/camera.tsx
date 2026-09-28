import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type LayoutRectangle,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { StateView } from "@/components/StateView";
import { useStartUpload } from "@/hooks/useStartUpload";
import { useStrings } from "@/i18n";
import { normalizeSource, type CropRect, type LocalImage } from "@/lib/imagePrep";
import { scanDraft } from "@/state/scanDraft";
import { radius, spacing, typography, useTheme } from "@/theme";

/** If the preview hasn't started by then, treat the camera as unavailable. */
const CAMERA_READY_TIMEOUT_MS = 8000;

/** Guide frame: full width minus margins, landscape-ish, slightly above centre. */
function guideFrame(view: LayoutRectangle): LayoutRectangle {
  const width = view.width - spacing.xl * 2;
  const height = Math.min(view.height * 0.34, width * 0.72);
  return { x: spacing.xl, y: (view.height - height) / 2 - view.height * 0.04, width, height };
}

/**
 * Maps the on-screen guide frame to a crop in photo pixels. The preview is
 * aspect-fill, so the photo is scaled by max(view/photo) and centred. A
 * margin is added because students rarely align perfectly; they can refine
 * the crop on the next screen.
 */
function frameToCrop(frame: LayoutRectangle, view: LayoutRectangle, photo: LocalImage): CropRect {
  const scale = Math.max(view.width / photo.width, view.height / photo.height);
  const offsetX = (view.width - photo.width * scale) / 2;
  const offsetY = (view.height - photo.height * scale) / 2;
  const margin = 0.06;
  let x = (frame.x - offsetX) / scale - (frame.width / scale) * margin;
  let y = (frame.y - offsetY) / scale - (frame.height / scale) * margin;
  let width = (frame.width / scale) * (1 + margin * 2);
  let height = (frame.height / scale) * (1 + margin * 2);
  x = Math.max(0, x);
  y = Math.max(0, y);
  width = Math.min(width, photo.width - x);
  height = Math.min(height, photo.height - y);
  return { originX: x, originY: y, width, height };
}

export default function CameraScreen() {
  const s = useStrings();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const upload = useStartUpload({ replace: true });

  const [measured, setMeasured] = useState<LayoutRectangle | null>(null);
  const window = useWindowDimensions();
  // The camera is full screen, so the window is a safe fallback until (or if) onLayout reports.
  const layout: LayoutRectangle = measured ?? { x: 0, y: 0, width: window.width, height: window.height };
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [captureError, setCaptureError] = useState(false);
  const [torch, setTorch] = useState(false);

  // Re-check permission when returning from Settings (it may have been granted or revoked).
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void getPermission();
    });
    return () => sub.remove();
  }, [getPermission]);

  useEffect(() => {
    if (!permission?.granted || ready || unavailable) return;
    const timer = setTimeout(() => setUnavailable(true), CAMERA_READY_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [permission?.granted, ready, unavailable]);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    void CameraView.isAvailableAsync().then((available) => {
      if (!available) setUnavailable(true);
    });
  }, []);

  const close = () => (router.canGoBack() ? router.back() : router.replace("/"));

  async function capture() {
    if (!camera.current || capturing || !ready) return;
    setCapturing(true);
    setCaptureError(false);
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
      const picture = await camera.current.takePictureAsync({ quality: 1, exif: false, shutterSound: false });
      if (!picture?.uri) throw new Error("no picture");
      const image = await normalizeSource(picture.uri);
      scanDraft.start("camera", image, frameToCrop(guideFrame(layout), layout, image));
      router.replace("/review");
    } catch (err) {
      console.warn("capture failed", err);
      setCaptureError(true);
      setCapturing(false);
    }
  }

  // --- permission & availability states --------------------------------------
  if (!permission) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.textMuted} />
      </View>
    );
  }

  if (!permission.granted || unavailable) {
    const blocked = !permission.granted && !permission.canAskAgain;
    const title = unavailable ? s.camera.unavailableTitle : blocked ? s.camera.permissionBlockedTitle : s.camera.permissionTitle;
    const body = unavailable ? s.camera.unavailableBody : blocked ? s.camera.permissionBlockedBody : s.camera.permissionBody;
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
        <View style={styles.topBarLight}>
          <Pressable onPress={close} hitSlop={12} accessibilityRole="button" accessibilityLabel={s.camera.close} style={styles.iconButton}>
            <Ionicons name="close" size={28} color={colors.text} />
          </Pressable>
        </View>
        <View style={styles.permissionBody}>
          <StateView icon={unavailable ? "videocam-off-outline" : "camera-outline"} title={title} body={body}>
            {!unavailable && !blocked ? (
              <Button testID="allow-camera" label={s.camera.permissionAllow} icon="camera" onPress={() => void requestPermission()} />
            ) : null}
            {!unavailable && blocked ? (
              <Button label={s.camera.openSettings} icon="settings-outline" onPress={() => void Linking.openSettings()} />
            ) : null}
            <Button
              label={s.camera.uploadInstead}
              icon="images-outline"
              variant={unavailable ? "primary" : "secondary"}
              onPress={upload.start}
              loading={upload.busy}
            />
          </StateView>
        </View>
      </SafeAreaView>
    );
  }

  // --- live camera -------------------------------------------------------------
  const frame = guideFrame(layout);

  return (
    <View style={styles.cameraRoot} onLayout={(e) => setMeasured(e.nativeEvent.layout)}>
      <CameraView
        ref={camera}
        style={StyleSheet.absoluteFill}
        facing="back"
        mirror={false}
        mode="picture"
        enableTorch={torch}
        autofocus="on"
        animateShutter
        onCameraReady={() => setReady(true)}
        onMountError={(e) => {
          console.warn("camera mount error", e.message);
          setUnavailable(true);
        }}
      />

      {frame.width > 0 && frame.height > 0 ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={[styles.dim, { top: 0, left: 0, right: 0, height: frame.y }]} />
          <View style={[styles.dim, { top: frame.y + frame.height, left: 0, right: 0, bottom: 0 }]} />
          <View style={[styles.dim, { top: frame.y, left: 0, width: frame.x, height: frame.height }]} />
          <View style={[styles.dim, { top: frame.y, right: 0, width: frame.x, height: frame.height }]} />
          <View style={[styles.frame, { left: frame.x, top: frame.y, width: frame.width, height: frame.height }]}>
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
          </View>
          <Text style={[styles.guide, { top: frame.y + frame.height + spacing.lg }]}>{s.camera.guide}</Text>
        </View>
      ) : null}

      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={close} hitSlop={12} accessibilityRole="button" accessibilityLabel={s.camera.close} style={styles.roundButton}>
          <Ionicons name="close" size={26} color="#FFFFFF" />
        </Pressable>
        {Platform.OS !== "web" ? (
          <Pressable
            onPress={() => setTorch((t) => !t)}
            hitSlop={12}
            accessibilityRole="switch"
            accessibilityState={{ checked: torch }}
            accessibilityLabel={torch ? s.camera.flashOff : s.camera.flashOn}
            style={[styles.roundButton, torch && { backgroundColor: "#FFFFFF" }]}
          >
            <Ionicons name={torch ? "flashlight" : "flashlight-outline"} size={22} color={torch ? "#000000" : "#FFFFFF"} />
          </Pressable>
        ) : null}
      </View>

      {captureError ? (
        <View style={[styles.errorWrap, { top: insets.top + 72 }]}>
          <Banner tone="danger" message={s.camera.captureFailed} />
        </View>
      ) : null}

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.xl }]}>
        <Pressable
          onPress={upload.start}
          disabled={upload.busy || capturing}
          accessibilityRole="button"
          accessibilityLabel={s.camera.gallery}
          style={styles.sideButton}
        >
          {upload.busy ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="images" size={28} color="#FFFFFF" />}
        </Pressable>

        <Pressable
          testID="shutter"
          onPress={capture}
          disabled={!ready || capturing}
          accessibilityRole="button"
          accessibilityLabel={s.camera.capture}
          accessibilityState={{ disabled: !ready || capturing, busy: capturing }}
          style={({ pressed }) => [styles.shutterOuter, (!ready || capturing) && styles.dimmed, pressed && styles.shutterPressed]}
        >
          <View style={styles.shutterInner}>{capturing ? <ActivityIndicator color="#1C2540" /> : null}</View>
        </Pressable>

        <View style={styles.sideButton} />
      </View>
    </View>
  );
}

const CORNER = 28;
const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  cameraRoot: { flex: 1, backgroundColor: "#000000" },
  dim: { position: "absolute", backgroundColor: "rgba(0,0,0,0.5)" },
  frame: { position: "absolute", borderRadius: radius.md },
  corner: { position: "absolute", width: CORNER, height: CORNER, borderColor: "#FFFFFF" },
  tl: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: radius.md },
  tr: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: radius.md },
  bl: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: radius.md },
  br: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: radius.md },
  guide: {
    position: "absolute",
    left: spacing.xl,
    right: spacing.xl,
    textAlign: "center",
    color: "#FFFFFF",
    ...typography.bodyStrong,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowRadius: 6,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
  },
  topBarLight: { flexDirection: "row", paddingHorizontal: spacing.sm },
  permissionBody: { flex: 1, justifyContent: "center" },
  iconButton: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  roundButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  errorWrap: { position: "absolute", left: spacing.lg, right: spacing.lg },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: spacing.lg,
  },
  sideButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  shutterOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 5,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  shutterPressed: { transform: [{ scale: 0.94 }] },
  dimmed: { opacity: 0.5 },
});
