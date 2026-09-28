import * as ImagePicker from "expo-image-picker";
import { ImagePrepError, normalizeSource, type LocalImage } from "./imagePrep";

export type PickOutcome =
  | { kind: "picked"; image: LocalImage }
  | { kind: "canceled" }
  | { kind: "error"; reason: "permission" | "invalid_type" | "too_large" | "too_small" | "corrupted" | "failed" };

const ACCEPTED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif"]);
/** Raw picked files above this are refused before decoding (phones rarely exceed ~15 MB). */
const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
/** Below this, the photo can't contain a legible problem. */
const MIN_SOURCE_SIDE = 100;

/**
 * Opens the system photo picker. The modern pickers (iOS PHPicker, Android
 * Photo Picker) don't need a library permission; if the OS still refuses
 * we report `permission` so the UI can point to Settings.
 */
export async function pickFromLibrary(): Promise<PickOutcome> {
  let result: ImagePicker.ImagePickerResult;
  try {
    result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      allowsMultipleSelection: false,
      quality: 1,
      exif: false,
    });
  } catch (err) {
    const message = String(err);
    console.warn("launchImageLibraryAsync failed", message);
    return { kind: "error", reason: /permission/i.test(message) ? "permission" : "failed" };
  }

  const asset = result.canceled ? undefined : result.assets?.[0];
  if (!asset) return { kind: "canceled" };

  const mime = asset.mimeType?.toLowerCase();
  if (mime && !ACCEPTED_TYPES.has(mime)) return { kind: "error", reason: "invalid_type" };
  if (asset.fileSize && asset.fileSize > MAX_SOURCE_BYTES) return { kind: "error", reason: "too_large" };
  if (asset.width && asset.height && Math.min(asset.width, asset.height) < MIN_SOURCE_SIDE) {
    return { kind: "error", reason: "too_small" };
  }

  try {
    const image = await normalizeSource(asset.uri);
    if (Math.min(image.width, image.height) < MIN_SOURCE_SIDE) return { kind: "error", reason: "too_small" };
    return { kind: "picked", image };
  } catch (err) {
    // Decoding failed: the file is corrupted or not really an image.
    return { kind: "error", reason: err instanceof ImagePrepError ? "corrupted" : "failed" };
  }
}
