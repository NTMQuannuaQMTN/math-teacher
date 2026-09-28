import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import type { ShouldStartLoadRequest } from "react-native-webview/lib/WebViewTypes";
import { mathTextToPlain } from "@shared/mathText";
import { useTheme } from "@/theme";
import { KATEX_CSS, KATEX_JS } from "./katexAssets.generated";
import { BASE_CSS, RENDER_SCRIPT, toPayload } from "./mathHtml";

export interface MathTextProps {
  text: string;
  fontSize?: number;
  color?: string;
  align?: "left" | "center";
  /** Shown when `text` is empty. */
  placeholder?: string;
  testID?: string;
}

// Built once per app run: KaTeX (fonts inlined) is ~600 KB, so the page is
// static and content is pushed in with injectJavaScript instead of reloading.
const HTML = `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>${KATEX_CSS}</style><style>${BASE_CSS}</style></head>
<body><div id="root"></div><script>${KATEX_JS}</script><script>${RENDER_SCRIPT}</script></body></html>`;

function allowOnlyInitialPage(request: ShouldStartLoadRequest): boolean {
  // Block every navigation (links, redirects, window.open). Only the inline document may load.
  return request.url === "about:blank" || request.url.startsWith("data:");
}

/**
 * Renders problem text (prose + $LaTeX$) as typeset maths.
 * Falls back to readable Unicode text if the WebView fails.
 */
export function MathText({ text, fontSize = 18, color, align = "left", placeholder, testID }: MathTextProps) {
  const { colors } = useTheme();
  const webview = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  const [height, setHeight] = useState(0);
  const [failed, setFailed] = useState(false);

  const plain = useMemo(() => mathTextToPlain(text), [text]);
  const payload = useMemo(
    () => JSON.stringify(toPayload(text, fontSize, color ?? colors.text, align)),
    [text, fontSize, color, colors.text, align],
  );

  useEffect(() => {
    if (ready) webview.current?.injectJavaScript(`window.renderMath(${payload}); true;`);
  }, [ready, payload]);

  function onMessage(event: WebViewMessageEvent) {
    try {
      const message = JSON.parse(event.nativeEvent.data) as { type: string; value?: number };
      if (message.type === "ready") setReady(true);
      if (message.type === "height" && typeof message.value === "number" && message.value >= 0) {
        setHeight(message.value);
      }
    } catch {
      // ignore anything that isn't our protocol
    }
  }

  if (!text.trim() && placeholder) {
    return <Text style={[styles.placeholder, { color: colors.textMuted, fontSize: fontSize - 2 }]}>{placeholder}</Text>;
  }

  if (failed) {
    return (
      <Text style={{ color: color ?? colors.text, fontSize, lineHeight: fontSize * 1.5 }} selectable>
        {plain}
      </Text>
    );
  }

  return (
    <View
      testID={testID}
      style={{ minHeight: fontSize * 1.6, height: height || undefined }}
      accessible
      accessibilityRole="text"
      accessibilityLabel={plain}
    >
      <WebView
        ref={webview}
        source={{ html: HTML }}
        originWhitelist={["about:blank", "data:*"]}
        onShouldStartLoadWithRequest={allowOnlyInitialPage}
        onMessage={onMessage}
        onError={() => setFailed(true)}
        onRenderProcessGone={() => setFailed(true)}
        onContentProcessDidTerminate={() => webview.current?.reload()}
        style={styles.webview}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        javaScriptCanOpenWindowsAutomatically={false}
        setSupportMultipleWindows={false}
        allowFileAccess={false}
        dataDetectorTypes="none"
        textInteractionEnabled={false}
        importantForAccessibility="no-hide-descendants"
        androidLayerType="hardware"
      />
      {!ready || height === 0 ? (
        <View style={[StyleSheet.absoluteFill, styles.loading]}>
          <ActivityIndicator color={colors.textMuted} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  webview: { backgroundColor: "transparent", flex: 1 },
  loading: { alignItems: "flex-start", justifyContent: "center" },
  placeholder: { fontStyle: "italic" },
});
