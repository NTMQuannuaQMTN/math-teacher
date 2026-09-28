import { Redirect, Stack } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { MathText } from "@/components/math/MathText";
import { radius, spacing, typography, useTheme } from "@/theme";

/**
 * Development-only visual check for maths rendering on device (the native
 * WebView renderer differs from web). Open with the deep link
 * `<app-url>/--/dev/math`. Redirects home in production builds.
 */
const SAMPLES = [
  "Bài 1. Giải phương trình:\n$$x^{2} + 5x + 6 = 0$$",
  "Câu 2. Giải hệ phương trình:\n$$\\begin{cases} 2x + y = 5 \\\\ x - 3y = -1 \\end{cases}$$",
  "Bài 3. Rút gọn biểu thức\n$$A = \\frac{\\sqrt{x} + 1}{\\sqrt{x} - 1} - \\frac{2}{x - 1}$$\nvới $x \\ge 0,\\ x \\ne 1$.",
  "Bài 4. Cho $\\triangle ABC$ vuông tại $A$, đường cao $AH$. Biết $\\widehat{ABC} = 60^{\\circ}$, $BC = 10$ cm. Tính $AH$.",
  "A train travels $240$ km. If the speed were $20$ km/h faster, the trip would take $1$ hour less.",
  "Broken markup stays readable: Giá \\$5, tìm $x^{2",
  "$$\\frac{1}{1+\\frac{1}{1+\\frac{1}{1+\\frac{1}{x}}}} + \\sqrt[3]{x^{2}+2x+1} - \\left(\\frac{a+b}{c-d}\\right)^{2} = 123456789$$",
];

export default function DevMathScreen() {
  const { colors } = useTheme();
  if (!__DEV__) return <Redirect href="/" />;
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: "Math rendering (dev)" }} />
      {SAMPLES.map((sample, index) => (
        <View key={index} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[typography.caption, { color: colors.textMuted }]}>#{index + 1}</Text>
          <MathText text={sample} fontSize={18} />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  card: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: spacing.lg, gap: spacing.sm },
});
