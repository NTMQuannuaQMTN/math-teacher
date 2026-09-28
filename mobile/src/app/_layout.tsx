import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useStrings } from "@/i18n";
import { useTheme } from "@/theme";

export default function RootLayout() {
  const { dark, colors } = useTheme();
  const s = useStrings();
  const base = dark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <SafeAreaProvider>
      <ThemeProvider value={navTheme}>
        <StatusBar style={dark ? "light" : "dark"} />
        <Stack
          screenOptions={{
            headerShadowVisible: false,
            headerTintColor: colors.primary,
            headerTitleStyle: { color: colors.text },
            headerStyle: { backgroundColor: colors.background },
            headerBackButtonDisplayMode: "minimal",
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="camera" options={{ headerShown: false, presentation: "fullScreenModal", animation: "fade" }} />
          <Stack.Screen name="review" options={{ headerShown: false, animation: "fade", contentStyle: { backgroundColor: "#000" } }} />
          <Stack.Screen name="process" options={{ headerShown: false, gestureEnabled: false, animation: "fade" }} />
          <Stack.Screen name="scan/[id]" options={{ title: s.result.title }} />
          <Stack.Screen name="problem/[id]" options={{ title: s.problem.title }} />
          <Stack.Screen name="history" options={{ title: s.history.title }} />
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
