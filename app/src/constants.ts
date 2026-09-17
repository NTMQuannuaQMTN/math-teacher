export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // must match worker/wrangler.toml MAX_UPLOAD_BYTES
export const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export const COLORS = {
  background: "#0B1220",
  surface: "#141C2E",
  surfaceAlt: "#1C263C",
  border: "#2A3550",
  primary: "#5B8DEF",
  primaryText: "#FFFFFF",
  text: "#E7ECFB",
  textMuted: "#8B96B8",
  danger: "#F26A6A",
  success: "#57C293",
  warning: "#E2B93B",
};
