import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { OPAQUE_TOKEN_PATTERN } from "@shared/contract";
import { randomToken } from "./random";

const KEY = "device_token_v1";

/**
 * Anonymous per-install identity. Stored in the Keychain / Keystore on
 * native (localStorage on web, which is development-only). The server only
 * ever sees it over HTTPS and stores its hash.
 */
let cached: Promise<string> | null = null;

async function read(): Promise<string | null> {
  if (Platform.OS === "web") return globalThis.localStorage?.getItem(KEY) ?? null;
  return SecureStore.getItemAsync(KEY);
}

async function write(value: string): Promise<void> {
  if (Platform.OS === "web") {
    globalThis.localStorage?.setItem(KEY, value);
    return;
  }
  await SecureStore.setItemAsync(KEY, value, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK });
}

export function getDeviceToken(): Promise<string> {
  cached ??= (async () => {
    try {
      const existing = await read();
      if (existing && OPAQUE_TOKEN_PATTERN.test(existing)) return existing;
    } catch (err) {
      console.warn("Could not read device token; creating a new one", err);
    }
    const token = randomToken();
    try {
      await write(token);
    } catch (err) {
      // Still usable for this session; history just won't survive a reinstall.
      console.warn("Could not persist device token", err);
    }
    return token;
  })();
  return cached;
}
