import { router } from "expo-router";
import { useCallback, useState } from "react";
import { useStrings } from "@/i18n";
import { captureScreen, pickDocument, type SourceOutcome } from "@/lib/webSources";
import { scanDraft } from "@/state/scanDraft";

/**
 * Web entry points on Home: "screenshot a screen" and "upload a document" (image or PDF).
 * A picked image goes to the crop/review screen like a camera photo; a multi-page PDF first goes
 * to the page picker. Cancelling is silent.
 */
export function useWebSources() {
  const s = useStrings();
  const [busy, setBusy] = useState<"screen" | "document" | null>(null);

  const handle = useCallback(
    (outcome: SourceOutcome) => {
      if (outcome.kind === "canceled") return;
      if (outcome.kind === "picked") {
        scanDraft.start("library", outcome.image);
        router.push("/review");
        return;
      }
      if (outcome.kind === "pdf") {
        router.push("/pdf-pages");
        return;
      }
      const messages: Record<typeof outcome.reason, string> = {
        unsupported: s.webSources.unsupported,
        invalid_type: s.webSources.invalidType,
        too_large: s.webSources.tooLarge,
        too_small: s.picker.tooSmall,
        corrupted: s.webSources.corrupted,
        failed: s.webSources.failed,
      };
      globalThis.alert?.(messages[outcome.reason]);
    },
    [s],
  );

  const run = useCallback(
    async (kind: "screen" | "document") => {
      if (busy) return;
      setBusy(kind);
      try {
        handle(kind === "screen" ? await captureScreen() : await pickDocument());
      } finally {
        setBusy(null);
      }
    },
    [busy, handle],
  );

  return {
    screenshot: useCallback(() => run("screen"), [run]),
    uploadDocument: useCallback(() => run("document"), [run]),
    busy,
  };
}
