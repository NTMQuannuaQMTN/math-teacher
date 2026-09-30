/**
 * Copies pdf.js (pdfjs-dist) into public/pdfjs so the web app can render uploaded PDFs in the
 * browser. It's loaded at runtime from the app's own origin (no CDN, no bundling of its ES
 * modules through Metro) and only when a PDF is chosen. Runs on postinstall.
 */
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const build = join(dirname(require.resolve("pdfjs-dist/package.json")), "build");
const out = join(dirname(fileURLToPath(import.meta.url)), "../public/pdfjs");
mkdirSync(out, { recursive: true });
for (const file of ["pdf.min.mjs", "pdf.worker.min.mjs"]) copyFileSync(join(build, file), join(out, file));
console.log(`pdf.js ${require("pdfjs-dist/package.json").version} → public/pdfjs`);
