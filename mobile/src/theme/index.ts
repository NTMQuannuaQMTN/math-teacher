import { useColorScheme } from "react-native";

const palette = {
  blue50: "#EEF3FF",
  blue100: "#DCE6FF",
  blue500: "#3563E9",
  blue600: "#2A50C8",
  blue300: "#8EA8F5",
  ink900: "#111827",
  ink700: "#374151",
  ink500: "#6B7280",
  ink300: "#D1D5DB",
  ink200: "#E5E7EB",
  ink100: "#F3F4F6",
  white: "#FFFFFF",
  night900: "#0B1020",
  night800: "#131A2E",
  night700: "#1C2540",
  night600: "#2A3456",
  amber50: "#FFF7E6",
  amber700: "#9A5B00",
  amber300: "#F5C46B",
  red50: "#FDECEC",
  red600: "#D0342C",
  red300: "#F19A94",
  green50: "#E9F8EF",
  green600: "#1F8A4C",
  green300: "#7FD3A3",
};

export interface Colors {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  text: string;
  textMuted: string;
  textInverse: string;
  primary: string;
  primaryPressed: string;
  primarySoft: string;
  onPrimary: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  success: string;
  successSoft: string;
  overlay: string;
}

const light: Colors = {
  background: "#F6F7FB",
  surface: palette.white,
  surfaceMuted: palette.ink100,
  border: palette.ink200,
  text: palette.ink900,
  textMuted: palette.ink500,
  textInverse: palette.white,
  primary: palette.blue500,
  primaryPressed: palette.blue600,
  primarySoft: palette.blue50,
  onPrimary: palette.white,
  warning: palette.amber700,
  warningSoft: palette.amber50,
  danger: palette.red600,
  dangerSoft: palette.red50,
  success: palette.green600,
  successSoft: palette.green50,
  overlay: "rgba(0,0,0,0.55)",
};

const dark: Colors = {
  background: palette.night900,
  surface: palette.night800,
  surfaceMuted: palette.night700,
  border: palette.night600,
  text: "#F3F5FA",
  textMuted: "#A3ACC2",
  textInverse: palette.ink900,
  primary: "#5B83F2",
  primaryPressed: "#4A70DA",
  primarySoft: "#1C2A55",
  onPrimary: palette.white,
  warning: palette.amber300,
  warningSoft: "#33270F",
  danger: palette.red300,
  dangerSoft: "#3A1A1A",
  success: palette.green300,
  successSoft: "#12301F",
  overlay: "rgba(0,0,0,0.65)",
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;

export const typography = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: "700" as const },
  title: { fontSize: 20, lineHeight: 26, fontWeight: "700" as const },
  subtitle: { fontSize: 17, lineHeight: 23, fontWeight: "600" as const },
  body: { fontSize: 16, lineHeight: 23, fontWeight: "400" as const },
  bodyStrong: { fontSize: 16, lineHeight: 23, fontWeight: "600" as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: "400" as const },
  label: { fontSize: 13, lineHeight: 18, fontWeight: "600" as const },
};

/** Minimum touch target (Apple HIG 44pt, Material 48dp). */
export const MIN_TOUCH = 48;

export interface Theme {
  dark: boolean;
  colors: Colors;
}

export function useTheme(): Theme {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  return { dark: isDark, colors: isDark ? dark : light };
}
