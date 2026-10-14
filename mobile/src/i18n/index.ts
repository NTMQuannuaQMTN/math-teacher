import { STRINGS, type Locale, type Strings } from "./strings";
// The student interface is Vietnamese, including on English-language devices.
const locale: Locale = "vi";
const strings: Strings = STRINGS[locale];

if (typeof document !== "undefined") {
  document.documentElement.lang = "vi";
  document.title = strings.appName;
}

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
  const tag = "vi-VN";
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleString(tag, {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
    hour: "2-digit",
    minute: "2-digit",
  });
}
