import { useMemo } from "react";
import { Platform, Text, type StyleProp, type TextStyle } from "react-native";
import { latexToPlain, parseMathText, repairLatex, wrapBareLatex } from "@shared/mathText";

const MATH_FONT = Platform.select({ ios: "Times New Roman", android: "serif", default: "'Times New Roman', serif" });

/**
 * Lightweight native renderer for short lesson prose (hints, step
 * explanations): inline $…$ maths is shown as readable Unicode (∠ABC, x²,
 * √3/2) in a maths font. Full KaTeX (MathText) is reserved for display
 * equations, so a lesson doesn't spin up a WebView per sentence.
 */
export function RichText({ text, style, numberOfLines }: { text: string; style?: StyleProp<TextStyle>; numberOfLines?: number }) {
  const segments = useMemo(() => parseMathText(wrapBareLatex(repairLatex(text))), [text]);
  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {segments.map((segment, i) =>
        segment.kind === "text" ? (
          segment.value
        ) : (
          <Text key={i} style={{ fontFamily: MATH_FONT, fontStyle: "italic" }}>
            {latexToPlain(segment.value)}
          </Text>
        ),
      )}
    </Text>
  );
}
