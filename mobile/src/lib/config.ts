import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Resolves the Worker base URL.
 * 1. EXPO_PUBLIC_API_URL if set (required for production builds).
 * 2. In development: the same host that serves the JS bundle, port 8787 —
 *    works for simulators and for phones on the same Wi-Fi without config.
 */
function resolveApiUrl(): string | null {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  if (!__DEV__) return null;

  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `http://${window.location.hostname}:8787`;
  }
  const hostUri = Constants.expoConfig?.hostUri ?? "";
  const host = hostUri.split(":")[0];
  return host ? `http://${host}:8787` : "http://localhost:8787";
}

export const API_URL = resolveApiUrl();

if (__DEV__) {
  console.log(`[api] Using API_URL=${API_URL ?? "(not configured)"} (hostUri=${Constants.expoConfig?.hostUri ?? "n/a"})`);
}
