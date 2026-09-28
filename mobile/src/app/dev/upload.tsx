import { Directory, File, Paths } from "expo-file-system";
import { Redirect, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text } from "react-native";
import { api } from "@/api/client";
import { randomToken } from "@/lib/random";

/**
 * Development-only self-test of the native upload path (Expo fetch + FormData),
 * which the web E2E can't exercise. Open `<app-url>/--/dev/upload?src=<image url>`:
 * the image is downloaded to the device, then uploaded exactly like a real scan.
 */
export default function DevUploadScreen() {
  const { src } = useLocalSearchParams<{ src?: string }>();
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    if (!__DEV__ || !src) return;
    const add = (line: string) => setLog((l) => [...l, line]);
    (async () => {
      try {
        const dir = new Directory(Paths.cache, "dev-upload");
        if (!dir.exists) dir.create();
        const target = new File(dir, `probe-${Date.now()}.jpg`);
        const file = await File.downloadFileAsync(src, target);
        add(`downloaded ${file.size} bytes`);
        const scan = await api.createScan({ imageUri: file.uri, source: "library", idempotencyKey: randomToken(24) });
        add(`UPLOAD OK scan=${scan.id} ocr=${scan.ocr?.status ?? scan.ocrError?.code}`);
        add(`text: ${scan.ocr?.formattedText ?? ""}`);
      } catch (err) {
        add(`UPLOAD FAILED: ${String(err)}`);
      }
    })();
  }, [src]);

  if (!__DEV__) return <Redirect href="/" />;
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
      <Stack.Screen options={{ title: "Upload self-test (dev)" }} />
      {log.map((line, i) => (
        <Text key={i} testID={`log-${i}`} style={{ fontSize: 15 }}>
          {line}
        </Text>
      ))}
    </ScrollView>
  );
}
