import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { ALLOWED_MIME_TYPES, MAX_UPLOAD_BYTES } from "./constants";

export interface PickedImage {
  uri: string;
  mimeType: string;
  fileName: string;
  fileSize: number;
  width: number;
  height: number;
}

export type PickResult =
  | { kind: "picked"; image: PickedImage }
  | { kind: "canceled" }
  | { kind: "permission_denied"; source: "camera" | "library" }
  | { kind: "unavailable"; message: string }
  | { kind: "invalid"; message: string };

// Phone cameras routinely produce 10-30MP photos (multi-MB files), and
// camera captures on iOS commonly come back as HEIC, not JPEG/PNG/WebP.
// Normalizing every picked asset to JPEG here — before any format check —
// means the allowlist below never has to deal with device/OS-specific
// capture formats, and uploads stay small and fast regardless of source.
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.8;

function guessMimeType(uri: string, mimeType?: string | null): string {
  if (mimeType) return mimeType;
  const ext = uri.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

function checkSize(image: PickedImage): PickResult {
  // fileSize is 0 ("unknown") after re-encoding, since expo-image-manipulator
  // doesn't report output size — the server enforces the real limit in that
  // case. Only a *known* oversized/empty size is rejected client-side here.
  if (image.fileSize > 0) {
    if (image.fileSize > MAX_UPLOAD_BYTES) {
      const mb = (MAX_UPLOAD_BYTES / (1024 * 1024)).toFixed(0);
      return { kind: "invalid", message: `Image is too large. Please use an image under ${mb}MB.` };
    }
    if (image.fileSize <= 0) {
      return { kind: "invalid", message: "That image appears to be empty." };
    }
  }
  return { kind: "picked", image };
}

/** Re-encodes any picked/captured asset to JPEG (resizing if it's larger
 * than needed for reading text), regardless of the source format the OS
 * camera or library handed back. Falls back to the raw asset, gated through
 * the MIME allowlist, only if manipulation itself fails. */
async function normalizeAsset(asset: ImagePicker.ImagePickerAsset): Promise<PickResult> {
  try {
    const needsResize = asset.width > MAX_DIMENSION || asset.height > MAX_DIMENSION;
    const resizeAction = needsResize
      ? [{ resize: asset.width >= asset.height ? { width: MAX_DIMENSION } : { height: MAX_DIMENSION } }]
      : [];

    const result = await manipulateAsync(asset.uri, resizeAction, {
      compress: JPEG_QUALITY,
      format: SaveFormat.JPEG,
    });

    return checkSize({
      uri: result.uri,
      mimeType: "image/jpeg",
      fileName: (asset.fileName ?? `question-${Date.now()}`).replace(/\.\w+$/, "") + ".jpg",
      fileSize: 0,
      width: result.width,
      height: result.height,
    });
  } catch {
    const mimeType = guessMimeType(asset.uri, asset.mimeType);
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return {
        kind: "invalid",
        message: `Unsupported image format (${mimeType}). Use JPEG, PNG, or WebP.`,
      };
    }
    return checkSize({
      uri: asset.uri,
      mimeType,
      fileName: asset.fileName ?? `question-${Date.now()}.jpg`,
      fileSize: asset.fileSize ?? 0,
      width: asset.width,
      height: asset.height,
    });
  }
}

export async function pickFromCamera(): Promise<PickResult> {
  let permission;
  try {
    permission = await ImagePicker.requestCameraPermissionsAsync();
  } catch {
    return { kind: "unavailable", message: "Camera is not available on this device." };
  }
  if (!permission.granted) {
    return { kind: "permission_denied", source: "camera" };
  }

  let result: ImagePicker.ImagePickerResult;
  try {
    result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: false,
    });
  } catch {
    return {
      kind: "unavailable",
      message:
        "Camera could not be launched. On some setups (e.g. Expo Go in a simulator) camera capture requires a physical device or a development build.",
    };
  }

  if (result.canceled || !result.assets?.[0]) {
    return { kind: "canceled" };
  }
  return normalizeAsset(result.assets[0]);
}

export async function pickFromLibrary(): Promise<PickResult> {
  let permission;
  try {
    permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  } catch {
    return { kind: "unavailable", message: "Photo library is not available on this device." };
  }
  if (!permission.granted) {
    return { kind: "permission_denied", source: "library" };
  }

  let result: ImagePicker.ImagePickerResult;
  try {
    result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: false,
    });
  } catch {
    return { kind: "unavailable", message: "Could not open the photo library." };
  }

  if (result.canceled || !result.assets?.[0]) {
    return { kind: "canceled" };
  }
  return normalizeAsset(result.assets[0]);
}
