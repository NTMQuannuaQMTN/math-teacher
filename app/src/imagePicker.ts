import * as ImagePicker from "expo-image-picker";
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

function guessMimeType(uri: string, mimeType?: string | null): string {
  if (mimeType) return mimeType;
  const ext = uri.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

function validateAsset(asset: ImagePicker.ImagePickerAsset): PickResult {
  const mimeType = guessMimeType(asset.uri, asset.mimeType);
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return { kind: "invalid", message: `Unsupported image format (${mimeType}). Use JPEG, PNG, or WebP.` };
  }
  if (typeof asset.fileSize === "number" && asset.fileSize > MAX_UPLOAD_BYTES) {
    const mb = (MAX_UPLOAD_BYTES / (1024 * 1024)).toFixed(0);
    return { kind: "invalid", message: `Image is too large. Please use an image under ${mb}MB.` };
  }
  if (typeof asset.fileSize === "number" && asset.fileSize <= 0) {
    return { kind: "invalid", message: "That image appears to be empty." };
  }
  return {
    kind: "picked",
    image: {
      uri: asset.uri,
      mimeType,
      fileName: asset.fileName ?? `question-${Date.now()}.jpg`,
      fileSize: asset.fileSize ?? 0,
      width: asset.width,
      height: asset.height,
    },
  };
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
  return validateAsset(result.assets[0]);
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
  return validateAsset(result.assets[0]);
}
