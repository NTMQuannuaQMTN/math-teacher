/** One SoCLaaS OCR run on an image: npx tsx scripts/ocr-soclaas-check.ts <image.jpg> */
import { readFileSync } from "node:fs";
import { createOcrProvider, runOcr } from "../src/ocr/service";
import type { Env } from "../src/env";

const root = new URL("../../", import.meta.url).pathname;
const vars = Object.fromEntries(readFileSync(`${root}worker/.dev.vars`, "utf8").split("\n").filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
const env = { ...vars, OCR_PROVIDER: "soclaas", OCR_TIMEOUT_MS: "120000" } as unknown as Env;
const buf = readFileSync(process.argv[2]!);
const t0 = Date.now();
const result = await runOcr(createOcrProvider(env), env, { bytes: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), contentType: "image/jpeg" });
console.log(`${Math.round((Date.now() - t0) / 1000)} s`);
console.log(JSON.stringify(result, null, 1).slice(0, 6000));
process.exit(0);
