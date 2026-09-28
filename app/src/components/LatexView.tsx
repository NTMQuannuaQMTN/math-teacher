import React, { useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { COLORS } from "../constants";

interface Props {
  expression: string;
  fontSize?: number;
  color?: string;
}

const KATEX_VERSION = "0.16.9";

/**
 * Renders a raw LaTeX string as typeset math via KaTeX inside a WebView —
 * there's no native LaTeX renderer for React Native, and a WebView + KaTeX
 * (loaded from CDN) is the standard, well-supported way to do this. Requires
 * network access, which the app already needs for every other feature.
 *
 * WebView has no intrinsic content size, so this measures the rendered
 * height in-page and reports it back via postMessage to auto-size the view
 * (otherwise it either clips or leaves a large empty box).
 */
export function LatexView({ expression, fontSize = 16, color = COLORS.text }: Props) {
  const [height, setHeight] = useState(28);

  const html = useMemo(() => buildHtml(expression, fontSize, color), [expression, fontSize, color]);

  function onMessage(event: WebViewMessageEvent) {
    const measured = Number.parseInt(event.nativeEvent.data, 10);
    if (Number.isFinite(measured) && measured > 0) {
      setHeight(measured);
    }
  }

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        source={{ html }}
        onMessage={onMessage}
        style={styles.webview}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        originWhitelist={["*"]}
        androidLayerType="software"
      />
    </View>
  );
}

function buildHtml(expression: string, fontSize: number, color: string): string {
  // JSON.stringify safely embeds the AI-generated string as a JS string
  // literal — handles quotes/backslashes without risking breaking out of
  // the <script> block.
  const expressionLiteral = JSON.stringify(expression);
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@${KATEX_VERSION}/dist/katex.min.css">
  <style>
    * { -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }
    html, body { margin: 0; padding: 0; background: transparent; overflow: hidden; }
    body { display: flex; align-items: center; justify-content: center; padding: 4px 0; }
    #math { color: ${color}; font-size: ${fontSize}px; }
    .katex { color: ${color}; }
    .katex-error { color: #F26A6A; font-size: ${fontSize - 2}px; }
  </style>
</head>
<body>
  <div id="math"></div>
  <script src="https://cdn.jsdelivr.net/npm/katex@${KATEX_VERSION}/dist/katex.min.js"></script>
  <script>
    function reportHeight() {
      var height = document.body.scrollHeight;
      window.ReactNativeWebView.postMessage(String(height));
    }
    try {
      katex.render(${expressionLiteral}, document.getElementById('math'), {
        throwOnError: false,
        displayMode: true
      });
    } catch (e) {
      document.getElementById('math').innerText = ${expressionLiteral};
    }
    // KaTeX render is synchronous, but give layout a tick to settle.
    setTimeout(reportHeight, 30);
  </script>
</body>
</html>`;
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  webview: {
    backgroundColor: "transparent",
  },
});
