import { getLocales } from "expo-localization";
import { STRINGS, type Locale, type Strings } from "./strings";

function detectLocale(): Locale {
  try {
    const code = getLocales()[0]?.languageCode ?? "vi";
    return code === "en" ? "en" : "vi";
  } catch {
    return "vi";
  }
}

// The device language rarely changes while the app is open; read it once.
const locale: Locale = detectLocale();
const strings: Strings = STRINGS[locale];

export function useStrings(): Strings {
  return strings;
}

export function getStrings(): Strings {
  return strings;
}

export function getLocale(): Locale {
  return locale;
}

/** Locale-aware date/time, e.g. "28 thg 9, 16:05". */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const tag = locale === "vi" ? "vi-VN" : "en-GB";
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleString(tag, {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
    hour: "2-digit",
    minute: "2-digit",
  });
}
