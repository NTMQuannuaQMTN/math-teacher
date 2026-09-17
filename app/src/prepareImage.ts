import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import type { PickedImage } from "./imagePicker";
import { MAX_UPLOAD_BYTES } from "./constants";

// Phone cameras routinely produce 10-30MP photos (multi-MB files). Sending
// those straight to the Worker is slow on cellular, risks tripping the
// server's size limit, and costs more in vision tokens than a full-resolution
// photo of a page of text needs. Downscaling client-side keeps the upload
// fast and reliable without hurting legibility for the model.
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.7;

/**
 * Resizes/recompresses a picked image for upload. Best-effort: if
 * manipulation fails for any reason (unsupported format quirk, etc.) we fall
 * back to the original image rather than blocking the user from submitting.
 */
export async function prepareImageForUpload(image: PickedImage): Promise<PickedImage> {
  const needsResize = image.width > MAX_DIMENSION || image.height > MAX_DIMENSION;
  const needsRecompress = image.fileSize === 0 || image.fileSize > MAX_UPLOAD_BYTES || needsResize;

  if (!needsRecompress) {
    return image;
  }

  try {
    const resizeAction = needsResize
      ? [{ resize: image.width >= image.height ? { width: MAX_DIMENSION } : { height: MAX_DIMENSION } }]
      : [];

    const result = await manipulateAsync(image.uri, resizeAction, {
      compress: JPEG_QUALITY,
      format: SaveFormat.JPEG,
    });

    return {
      uri: result.uri,
      mimeType: "image/jpeg",
      fileName: image.fileName.replace(/\.\w+$/, "") + ".jpg",
      // expo-image-manipulator doesn't report the output file size; the
      // server enforces the real limit, so this is only used for client-side
      // pre-checks and is safe to leave unknown (0 = "unknown" downstream).
      fileSize: 0,
      width: result.width,
      height: result.height,
    };
  } catch {
    return image;
  }
}
