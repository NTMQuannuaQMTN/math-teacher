import { router } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Linking } from "react-native";
import { useStrings } from "@/i18n";
import { pickFromLibrary } from "@/lib/picker";
import { scanDraft } from "@/state/scanDraft";

/**
 * "Upload from photos" flow shared by Home and the camera screen:
 * pick → validate/normalize → review. Cancelling is silent; every failure
 * gets a specific, actionable message.
 */
export function useStartUpload(options: { replace?: boolean } = {}) {
  const s = useStrings();
  const [busy, setBusy] = useState(false);

  const start = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const outcome = await pickFromLibrary();
      if (outcome.kind === "canceled") return;
      if (outcome.kind === "picked") {
        scanDraft.start("library", outcome.image);
        if (options.replace) router.replace("/review");
        else router.push("/review");
        return;
      }
      switch (outcome.reason) {
        case "permission":
          Alert.alert(s.picker.permissionTitle, s.picker.permissionBody, [
            { text: s.common.cancel, style: "cancel" },
            { text: s.camera.openSettings, onPress: () => void Linking.openSettings() },
          ]);
          break;
        case "invalid_type":
          Alert.alert(s.picker.invalidType);
          break;
        case "too_large":
          Alert.alert(s.picker.tooLarge);
          break;
        case "too_small":
          Alert.alert(s.picker.tooSmall);
          break;
        case "corrupted":
          Alert.alert(s.picker.corrupted);
          break;
        default:
          Alert.alert(s.picker.failed);
      }
    } finally {
      setBusy(false);
    }
  }, [busy, options.replace, s]);

  return { start, busy };
}
