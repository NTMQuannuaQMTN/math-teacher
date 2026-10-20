// Fails if browser-delivered assets contain server-only configuration names or known secret values.
// Run after `npm run build` (Next) or `npm run build:cf` (vinext). Usage: node scripts/check-bundle-secrets.mjs [dir...]
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import path from "node:path";

const dirs = process.argv.slice(2).length ? process.argv.slice(2) : [".next/static", "dist/client"];
const needles = ["API_GATEWAY_SECRET", "SOCLAAS_API_KEY", "ADMIN_DEV_TOKEN", "X-Gateway-Secret", "mts_"];
for (const name of ["API_GATEWAY_SECRET", "ADMIN_DEV_TOKEN", "SOCLAAS_API_KEY"]) {
  const value = process.env[name];
  if (value && value.length >= 8) needles.push(value);
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (/\.(js|mjs|css|html|json|map|txt)$/.test(entry)) yield full;
  }
}

let checked = 0;
const hits = [];
for (const dir of dirs) {
  if (!existsSync(dir)) continue;
  for (const file of walk(dir)) {
    checked += 1;
    const content = readFileSync(file, "utf8");
    for (const needle of needles) if (content.includes(needle)) hits.push(`${file}: ${needle.slice(0, 24)}`);
  }
}
if (checked === 0) {
  console.error("No client assets found. Build first.");
  process.exit(2);
}
if (hits.length) {
  console.error("Server-only values found in client assets:\n" + hits.join("\n"));
  process.exit(1);
}
console.log(`OK: ${checked} client files checked, no server-only values found.`);
