/**
 * Copies pdf.js (pdfjs-dist) into public/pdfjs so the web app can render uploaded PDFs in the
 * browser. It's loaded at runtime from the app's own origin (no CDN, no bundling of its ES
 * modules through Metro) and only when a PDF is chosen. Runs on postinstall.
 */
import { copyFileSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const build = join(dirname(require.resolve("pdfjs-dist/package.json")), "build");
const out = join(dirname(fileURLToPath(import.meta.url)), "../public/pdfjs");
mkdirSync(out, { recursive: true });
for (const file of ["pdf.min.mjs", "pdf.worker.min.mjs"]) copyFileSync(join(build, file), join(out, file));
const wasmSource = join(dirname(build), "wasm");
const wasmOut = join(out, "wasm");
mkdirSync(wasmOut, { recursive: true });
for (const file of readdirSync(wasmSource)) {
  if (/\.(wasm|js)$/.test(file)) copyFileSync(join(wasmSource, file), join(wasmOut, file));
}
writeFileSync(join(out, "pdf-loader.js"), 'import * as lib from "./pdf.min.mjs";\n\nlib.GlobalWorkerOptions.workerSrc = new URL("./pdf.worker.min.mjs", import.meta.url).href;\nwindow.__pdfjsLib = lib;\nwindow.dispatchEvent(new Event("pdfjs-ready"));\n');
console.log(`pdf.js ${require("pdfjs-dist/package.json").version} → public/pdfjs`);
