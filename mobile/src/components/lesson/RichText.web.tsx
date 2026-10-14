import { StyleSheet, type StyleProp, type TextStyle } from "react-native";
import { MathText } from "../math/MathText";

/** Web lesson prose uses real KaTeX, including titles, cues and reasons. */
export function RichText({ text, style, numberOfLines }: { text: string; style?: StyleProp<TextStyle>; numberOfLines?: number }) {
  const typography = StyleSheet.flatten(style) ?? {};
  return (
    <div style={{
      flex: typography.flex,
      minWidth: 0,
      fontStyle: typography.fontStyle,
      ...(numberOfLines ? { display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: numberOfLines, overflow: "hidden" } : {}),
    }}>
      <MathText text={text} fontSize={typography.fontSize} fontWeight={typography.fontWeight} color={typography.color as string | undefined} align={typography.textAlign === "center" ? "center" : "left"} />
    </div>
  );
}
